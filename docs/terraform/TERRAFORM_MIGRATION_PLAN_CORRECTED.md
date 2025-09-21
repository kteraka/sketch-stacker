# CloudFormation → Terraform 移行計画（修正版）

## 重要：私の最初の計画は完全に間違っていました

CloudFormationスタックを削除するとリソースも削除されます。正しい移行手順は以下のとおりです。

## 正しい移行手順

### Phase 1: CloudFormationテンプレート修正とスタック更新 (45分)

#### 1.1 現在のスタック状況確認
```bash
# 現在のリソース一覧取得
aws cloudformation describe-stack-resources --stack-name WIPUploader --profile dev

# テンプレート取得・バックアップ
aws cloudformation get-template --stack-name WIPUploader --profile dev > backup-template.yaml
```

#### 1.2 テンプレートにRetainポリシー追加
**重要**: `DeletionPolicy: Retain` と `UpdateReplacePolicy: Retain` の**両方**を全リソースに追加

```yaml
# 例：S3バケット
ImageBucket:
  Type: AWS::S3::Bucket
  DeletionPolicy: Retain
  UpdateReplacePolicy: Retain
  Properties:
    BucketName: !Ref ImageBucketName
    # ... 既存プロパティ

# 例：Lambda関数
UploadFunction:
  Type: AWS::Lambda::Function
  DeletionPolicy: Retain
  UpdateReplacePolicy: Retain
  Properties:
    # ... 既存プロパティ
```

**全リソースに追加が必要：**
- ImageBucket
- CloudFrontDistribution
- UploadFunction
- AuthorizerFunction
- UpdateImagesJsonLambda
- ApiGateway
- UploadLambdaExecutionRole
- UpdateImagesJsonLambdaExecutionRole
- BasicAuthPassword
- ImageBucketOAC
- CORSResponseHeadersPolicy

#### 1.3 スタック更新実行
```bash
# Change Set作成で影響確認
aws cloudformation create-change-set \
  --stack-name WIPUploader \
  --template-body file://Uploader/template.yaml \
  --parameters ParameterKey=ImageBucketName,ParameterValue=<actual-bucket-name> \
    ParameterKey=BasicAuthUsername,ParameterValue=<username> \
    ParameterKey=CloudFrontDistributionId,ParameterValue=<distribution-id> \
  --change-set-name add-retain-policies \
  --capabilities CAPABILITY_IAM \
  --profile dev

# Change Set内容確認
aws cloudformation describe-change-set \
  --stack-name WIPUploader \
  --change-set-name add-retain-policies \
  --profile dev

# 変更実行
aws cloudformation execute-change-set \
  --stack-name WIPUploader \
  --change-set-name add-retain-policies \
  --profile dev

# 完了確認
aws cloudformation wait stack-update-complete \
  --stack-name WIPUploader \
  --profile dev
```

### Phase 2: Terraform設定準備 (60分)

#### 2.1 基本設定ファイル作成
```bash
mkdir -p terraform/lambda-functions/{upload,authorizer,update-images}
cd terraform/
```

#### 2.2 Lambda関数コード外部化
CloudFormationのZipFileからindex.jsファイルに分離

**upload/index.js:**
```javascript
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
```

#### 2.3 Terraform設定ファイル作成
**main.tf:**
```hcl
terraform {
  required_version = ">= 1.5"
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

### Phase 3: Terraformインポート実行 (60分)

#### 3.1 現在のリソースID取得
```bash
# リソースID一覧取得
aws cloudformation describe-stack-resources --stack-name WIPUploader --profile dev | \
  jq -r '.StackResources[] | "\(.LogicalResourceId): \(.PhysicalResourceId)"' > resource-ids.txt
```

#### 3.2 Terraform初期化
```bash
terraform init
```

#### 3.3 段階的インポート（Terraform 1.5+の新機能使用）

**import.tf:**
```hcl
# S3バケット
import {
  to = aws_s3_bucket.image_bucket
  id = "your-actual-bucket-name"
}

# CloudFront
import {
  to = aws_cloudfront_distribution.main
  id = "E1234567890ABC"
}

# Lambda関数
import {
  to = aws_lambda_function.upload
  id = "WIPUploader-UploadFunction-ABCD1234"
}

import {
  to = aws_lambda_function.authorizer
  id = "WIPUploader-AuthorizerFunction-EFGH5678"
}

import {
  to = aws_lambda_function.update_images_json
  id = "WIPUploader-UpdateImagesJsonLambda-IJKL9012"
}

# API Gateway
import {
  to = aws_api_gateway_rest_api.main
  id = "abcd123456"
}

# IAMロール
import {
  to = aws_iam_role.upload_lambda
  id = "WIPUploader-UploadLambdaExecutionRole-MNOP3456"
}

# その他リソースも同様...
```

#### 3.4 インポート実行と調整
```bash
# インポート実行
terraform plan

# 必要に応じてリソース定義調整
terraform apply

# 差分確認（理想的にはNo changesになるまで調整）
terraform plan
```

### Phase 4: CloudFormationからの段階的削除 (45分)

#### 4.1 CloudFormationテンプレートからリソース削除
Retainポリシーが設定されているので、テンプレートからリソースを削除してもAWSリソースは保持される

```bash
# リソースを削除したテンプレートでスタック更新
aws cloudformation update-stack \
  --stack-name WIPUploader \
  --template-body file://Uploader/template-empty.yaml \
  --profile dev

# 更新完了確認
aws cloudformation wait stack-update-complete \
  --stack-name WIPUploader \
  --profile dev
```

#### 4.2 最終的にCloudFormationスタック削除
```bash
# スタック削除（リソースはRetainされるので削除されない）
aws cloudformation delete-stack \
  --stack-name WIPUploader \
  --profile dev

# 削除完了確認
aws cloudformation wait stack-delete-complete \
  --stack-name WIPUploader \
  --profile dev
```

### Phase 5: 検証とクリーンアップ (30分)

#### 5.1 Terraform管理確認
```bash
# Terraformで管理されているリソース一覧
terraform state list

# プラン確認（差分なしであることを確認）
terraform plan
```

#### 5.2 アプリケーション動作確認
```bash
# React app build & test
cd ../viewer-react/
npm run build
npm run preview -- --host

# API動作確認
AUTH=$(echo -n 'username:password' | base64)
IMAGE=$(base64 -i test.png)
curl -X POST \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE\"}" \
  <api-endpoint>
```

## 重要な注意事項

### 1. DeletionPolicy/UpdateReplacePolicyの制約
- これらのポリシーのみを変更する場合、CloudFormationがno-opとして扱う既知のバグがある
- 必要に応じて他の軽微な変更を同時に行う

### 2. リソース固有のインポート
- **S3バケット**: バケット名がID
- **Lambda関数**: 関数名がID
- **CloudFront**: DistributionId
- **API Gateway**: REST API ID

### 3. IAMロール・ポリシー
- 複雑な権限設定の再現に時間がかかる可能性
- inline policyとmanaged policyの違いに注意

## リスク軽減策

### バックアップ
- CloudFormationテンプレート保存済み
- S3データバックアップ済み
- 各フェーズでのterraform state backup

### ロールバック手順
```bash
# Terraformでの管理を停止
terraform state rm <resource-type>.<resource-name>

# CloudFormationで再管理（必要に応じて）
# バックアップテンプレートを使用してスタック再作成
```

## 所要時間見積もり
- **Phase 1**: 45分（CloudFormation修正・更新）
- **Phase 2**: 60分（Terraform設定準備）
- **Phase 3**: 60分（インポート実行・調整）
- **Phase 4**: 45分（CloudFormation削除）
- **Phase 5**: 30分（検証・クリーンアップ）

**総計: 4時間** (調整・トラブルシューティング含む)

## Success Criteria
- [ ] 全リソースがTerraformで管理されている
- [ ] `terraform plan`で差分なし
- [ ] アプリケーションが正常動作する
- [ ] CloudFormationスタックが削除されている
- [ ] 全AWS CLIで`--profile dev`使用
- [ ] CLAUDE.md更新完了

---

**この計画は実際のCloudFormation→Terraform移行事例に基づいて作成されており、リソース削除のリスクを回避できます。**