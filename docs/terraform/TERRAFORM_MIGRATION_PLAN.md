# Terraform Migration Plan

## Overview
CloudFormationからTerraformへの段階的移行計画。既存のGyazo-like image sharing applicationのインフラをTerraformに移行する。

## Current CloudFormation Resources Analysis

### 主要リソース構成
- **S3**: ImageBucket + Policy + OAC
- **CloudFront**: Distribution + CORS Policy
- **Lambda**: 3つの関数 (Upload, Authorizer, UpdateImagesJson)
- **API Gateway**: REST API + Resources + Methods
- **IAM**: 2つの実行ロール + ポリシー
- **Secrets Manager**: Basic認証パスワード
- **Permissions**: Lambda実行許可

### 移行の課題
1. **循環依存の解決**: CloudFrontDistributionIdパラメータの問題
2. **State管理**: 既存リソースをTerraform stateにインポート
3. **Lambda関数コード**: インライン→外部ファイル化
4. **Profile指定**: `--profile dev`を全コマンドに適用

## Migration Strategy Options

### Option A: Import Strategy (推奨)
既存リソースをTerraform管理下に移行

**メリット**: ダウンタイムなし、データ保持
**デメリット**: 複雑、import作業が必要

### Option B: Clean Deployment Strategy
新しいリソースを作成して移行

**メリット**: クリーンな環境、簡単
**デメリット**: データ移行必要、一時的にリソース重複

## Detailed Implementation Steps

### Phase 1: 準備フェーズ (30分)

#### 1.1 環境確認
```bash
# Terraformバージョン確認
terraform version

# AWS CLI + profile確認
aws sts get-caller-identity --profile dev

# 現在のスタック情報取得
aws cloudformation describe-stacks --stack-name WIPUploader --profile dev
aws cloudformation describe-stack-resources --stack-name WIPUploader --profile dev > current-resources.json
```

#### 1.2 バックアップ作成
```bash
# CloudFormationテンプレート保存
aws cloudformation get-template --stack-name WIPUploader --profile dev > backup-template.yaml

# S3データバックアップ
aws s3 sync s3://your-bucket-name/ ./s3-backup/ --profile dev
```

#### 1.3 作業ディレクトリ準備
```bash
mkdir -p terraform/lambda-functions/{upload,authorizer,update-images}
cd terraform/
```

### Phase 2: Terraform設定作成 (60分)

#### 2.1 基本設定ファイル
**main.tf**
```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
```

**variables.tf**
```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "image_bucket_name" {
  description = "Name of the S3 bucket to store images"
  type        = string
}

variable "basic_auth_username" {
  description = "Username for Basic Authentication"
  type        = string
}

variable "images_json_filename_path" {
  description = "Path for JSON file that logs filenames"
  type        = string
  default     = "viewer/images.json"
}

variable "stack_name" {
  description = "Stack name for resource naming"
  type        = string
  default     = "WIPUploader"
}
```

**terraform.tfvars** (作成要)
```hcl
aws_region = "us-east-1"
image_bucket_name = "your-actual-bucket-name"
basic_auth_username = "your-username"
stack_name = "WIPUploader"
```

#### 2.2 Lambda関数コード外部化
```bash
# アップロード関数
cat > lambda-functions/upload/index.js << 'EOF'
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: process.env.AWS_DEFAULT_REGION });

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const imageData = Buffer.from(body.image, 'base64');
    const key = `${Date.now()}.png`;

    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Body: imageData,
      ContentType: 'image/png',
      StorageClass: 'GLACIER_IR'
    });

    await s3Client.send(command);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'An error occurred while processing your request.' })
    };
  }
};
EOF

# 認証関数
cat > lambda-functions/authorizer/index.js << 'EOF'
exports.handler = async (event) => {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (!authHeader) return generatePolicy('user', 'Deny', event.methodArn);

  const encodedCreds = authHeader.split(' ')[1];
  const plainCreds = Buffer.from(encodedCreds, 'base64').toString().split(':');
  const username = plainCreds[0];
  const password = plainCreds[1];

  if (username === process.env.AUTH_USERNAME && password === process.env.AUTH_PASSWORD) {
    return generatePolicy('user', 'Allow', event.methodArn);
  }

  return generatePolicy('user', 'Deny', event.methodArn);
};

const generatePolicy = (principalId, effect, resource) => {
  return {
    principalId: principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource
      }]
    }
  };
};
EOF

# 画像リスト更新関数
cat > lambda-functions/update-images/index.js << 'EOF'
const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');
const { CloudFront } = require('@aws-sdk/client-cloudfront');

const s3Client = new S3Client({ region: process.env.AWS_DEFAULT_REGION });

exports.handler = async (event) => {
  const imageBucket = process.env.IMAGE_BUCKET;
  const fileName = process.env.IMAGES_JSON_FILENAME_PATH;

  try {
    const listObjectsCommand = new ListObjectsV2Command({ Bucket: imageBucket });
    const listObjectsResponse = await s3Client.send(listObjectsCommand);
    const fileNames = listObjectsResponse.Contents.map(object => object.Key);
    console.log(fileNames);

    const jsonData = JSON.stringify(fileNames, null, 2);
    console.log(jsonData);

    const putObjectCommand = new PutObjectCommand({
      Bucket: imageBucket,
      Key: fileName,
      Body: jsonData,
      ContentType: 'application/json',
    });

    await s3Client.send(putObjectCommand);
    console.log("/" + fileName)

    const client = new CloudFront();
    await client.createInvalidation({
      DistributionId: process.env.DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: new Date().toISOString(),
        Paths: {
          Quantity: 1,
          Items: ["/" + fileName]
        }
      }
    });

    return {
      statusCode: 200,
      body: 'images.json saved successfully!',
    };
  } catch (error) {
    console.error('Error processing S3 event', error);
    return {
      statusCode: 500,
      body: 'Error processing S3 event',
    };
  }
};
EOF

# Lambda用zipファイル作成
cd lambda-functions/upload && zip -r ../upload.zip . && cd ../..
cd lambda-functions/authorizer && zip -r ../authorizer.zip . && cd ../..
cd lambda-functions/update-images && zip -r ../update-images.zip . && cd ../..
```

### Phase 3: リソース定義ファイル作成

#### 3.1 S3リソース (s3.tf)
```hcl
resource "aws_s3_bucket" "image_bucket" {
  bucket = var.image_bucket_name
}

resource "aws_s3_bucket_public_access_block" "image_bucket" {
  bucket = aws_s3_bucket.image_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "image_bucket" {
  bucket = aws_s3_bucket.image_bucket.id

  policy = jsonencode({
    Statement = [
      {
        Action = "s3:GetObject"
        Effect = "Allow"
        Resource = "${aws_s3_bucket.image_bucket.arn}/*"
        Principal = "*"
        Condition = {
          StringEquals = {
            "aws:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.main.id}"
          }
        }
      }
    ]
  })
}

resource "aws_cloudfront_origin_access_control" "image_bucket" {
  name                              = "OAC for ${var.image_bucket_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_s3_bucket_notification" "image_bucket" {
  bucket = aws_s3_bucket.image_bucket.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.update_images_json.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.allow_bucket]
}
```

### Phase 4: Import実行 (45分)

#### 4.1 Terraform初期化
```bash
terraform init
```

#### 4.2 リソースID取得
```bash
# 必要なリソースID取得
aws cloudformation describe-stack-resources --stack-name WIPUploader --profile dev | \
  jq -r '.StackResources[] | "\(.LogicalResourceId): \(.PhysicalResourceId)"'
```

#### 4.3 段階的import
```bash
# S3バケット
terraform import aws_s3_bucket.image_bucket <actual-bucket-name>

# CloudFrontディストリビューション
terraform import aws_cloudfront_distribution.main <distribution-id>

# Lambda関数
terraform import aws_lambda_function.upload <upload-function-name>
terraform import aws_lambda_function.authorizer <authorizer-function-name>
terraform import aws_lambda_function.update_images_json <update-function-name>

# API Gateway
terraform import aws_api_gateway_rest_api.main <api-gateway-id>
terraform import aws_api_gateway_resource.upload <resource-id>
terraform import aws_api_gateway_method.upload <method-id>

# IAMロール
terraform import aws_iam_role.upload_lambda <role-name>
terraform import aws_iam_role.update_lambda <role-name>

# Secrets Manager
terraform import aws_secretsmanager_secret.basic_auth_password <secret-arn>
```

#### 4.4 State確認とプラン
```bash
# State一覧確認
terraform state list

# 差分確認
terraform plan -var-file="terraform.tfvars"

# 必要に応じて調整
terraform apply -var-file="terraform.tfvars"
```

### Phase 5: テスト・検証 (30分)

#### 5.1 リソース確認
```bash
# Terraformで管理されているリソース確認
terraform state list
terraform show

# AWSリソースの状態確認
aws s3 ls --profile dev
aws lambda list-functions --profile dev
aws apigateway get-rest-apis --profile dev
```

#### 5.2 アプリケーションテスト
```bash
# React app build & test
cd ../viewer-react/
npm run build
npm run preview -- --host

# アップロードAPI テスト
AUTH=$(echo -n 'username:password' | base64)
IMAGE=$(base64 -i test.png)
curl -X POST \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE\"}" \
  <new-api-endpoint>
```

### Phase 6: クリーンアップ (15分)

#### 6.1 CloudFormationスタック削除
```bash
# 確認
aws cloudformation describe-stacks --stack-name WIPUploader --profile dev

# 削除実行
aws cloudformation delete-stack --stack-name WIPUploader --profile dev

# 削除完了確認
aws cloudformation wait stack-delete-complete --stack-name WIPUploader --profile dev
```

#### 6.2 ドキュメント更新
```bash
# CLAUDE.md更新
# - CloudFormation関連セクションをTerraformに変更
# - デプロイコマンドを更新
# - --profile dev を全コマンドに追加
```

## Risk Mitigation & Rollback Plan

### バックアップ戦略
1. CloudFormationテンプレート保存済み
2. S3データバックアップ済み
3. 各フェーズでのterraform state backup

### ロールバック手順
```bash
# Import失敗時
terraform state rm <resource-type>.<resource-name>

# 完全ロールバック時
terraform destroy -var-file="terraform.tfvars"
aws cloudformation create-stack --stack-name WIPUploader --template-body file://backup-template.yaml --profile dev
```

### トラブルシューティング
1. **Import失敗**: リソースIDの確認、権限チェック
2. **循環依存**: 段階的適用、depends_on使用
3. **Lambda関数エラー**: コード差分確認、権限確認

## Success Criteria
- [ ] 全リソースがTerraformで管理されている
- [ ] `terraform plan`で差分が出ない
- [ ] アプリケーションが正常動作する
- [ ] 全AWS CLIコマンドで`--profile dev`使用
- [ ] CloudFormationスタックが削除されている
- [ ] CLAUDE.mdが更新されている

## Post-Migration Tasks
1. **CI/CD設定**: GitHub Actions
2. **State Backend**: S3 + DynamoDB
3. **環境分離**: dev/staging/prod
4. **セキュリティ強化**: least privilege, encryption
5. **モニタリング**: CloudWatch, alerts

## Timeline Summary
- **準備**: 30分
- **設定作成**: 60分
- **Import実行**: 45分
- **テスト検証**: 30分
- **クリーンアップ**: 15分

**総所要時間**: 約3時間

---

*このプランは段階的実行を前提としており、各フェーズで問題が発生した場合は前のフェーズに戻ることができます。*