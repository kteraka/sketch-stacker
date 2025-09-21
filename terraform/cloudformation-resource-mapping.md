# CloudFormation to Terraform Resource Mapping

## Stack Information
- **Stack Name**: WIPUploader
- **Stack ID**: arn:aws:cloudformation:ap-northeast-1:791464527050:stack/WIPUploader/480020f0-07ad-11f0-a8d9-0a82f6d06571
- **Total Resources**: 19

## Resource Mapping Table

| # | Logical Resource ID | Physical Resource ID | Resource Type | Status | Terraform Resource Name |
|---|--------------------|--------------------|---------------|---------|------------------------|
| 1 | ApiAuthorizer | b8w9lx | AWS::ApiGateway::Authorizer | UPDATE_COMPLETE | aws_api_gateway_authorizer.basic_auth |
| 2 | ApiDeployment | mpu16a | AWS::ApiGateway::Deployment | UPDATE_COMPLETE | aws_api_gateway_deployment.main |
| 3 | ApiGateway | 3p4utkstnb | AWS::ApiGateway::RestApi | UPDATE_COMPLETE | aws_api_gateway_rest_api.main |
| 4 | ApiMethod | 3p4utkstnb\|zu6l15\|POST | AWS::ApiGateway::Method | UPDATE_COMPLETE | aws_api_gateway_method.upload_post |
| 5 | ApiResource | zu6l15 | AWS::ApiGateway::Resource | UPDATE_COMPLETE | aws_api_gateway_resource.upload |
| 6 | AuthorizerFunction | WIPUploader-AuthorizerFunction-7WKXvtdhJ2Lx | AWS::Lambda::Function | UPDATE_COMPLETE | aws_lambda_function.authorizer |
| 7 | AuthorizerPermission | WIPUploader-AuthorizerPermission-uQTdGUlIhEsH | AWS::Lambda::Permission | UPDATE_COMPLETE | aws_lambda_permission.api_gateway_invoke_authorizer |
| 8 | BasicAuthPassword | arn:aws:secretsmanager:ap-northeast-1:791464527050:secret:WIPUploaderSecret-SWNxHU | AWS::SecretsManager::Secret | UPDATE_COMPLETE | aws_secretsmanager_secret.basic_auth_password |
| 9 | CORSResponseHeadersPolicy | 4f6ab204-bbcb-4a16-bb18-fb14748b8d29 | AWS::CloudFront::ResponseHeadersPolicy | UPDATE_COMPLETE | aws_cloudfront_response_headers_policy.cors |
| 10 | CloudFrontDistribution | E96GV1FQF9SU0 | AWS::CloudFront::Distribution | UPDATE_COMPLETE | aws_cloudfront_distribution.main |
| 11 | ImageBucket | wip-uploader-strage | AWS::S3::Bucket | UPDATE_COMPLETE | aws_s3_bucket.image_bucket |
| 12 | ImageBucketOAC | E1Y0EK4C9ZX47D | AWS::CloudFront::OriginAccessControl | UPDATE_COMPLETE | aws_cloudfront_origin_access_control.image_bucket |
| 13 | ImageBucketPolicy | wip-uploader-strage | AWS::S3::BucketPolicy | UPDATE_COMPLETE | aws_s3_bucket_policy.image_bucket |
| 14 | LambdaApiGatewayPermission | WIPUploader-LambdaApiGatewayPermission-Vlv2E9vEx60q | AWS::Lambda::Permission | UPDATE_COMPLETE | aws_lambda_permission.api_gateway_invoke_upload |
| 15 | UpdateImagesJsonLambda | WIPUploaderUpdateImagesJsonFunction | AWS::Lambda::Function | UPDATE_COMPLETE | aws_lambda_function.update_images_json |
| 16 | UpdateImagesJsonLambdaExecutionRole | WIPUploader-UpdateImagesJsonLambdaExecutionRole-MhwPNOwZDB5j | AWS::IAM::Role | UPDATE_COMPLETE | aws_iam_role.update_lambda_execution |
| 17 | UpdateImagesJsonLambdaPermission | WIPUploader-UpdateImagesJsonLambdaPermission-lImcUAQdIUTj | AWS::Lambda::Permission | UPDATE_COMPLETE | aws_lambda_permission.s3_invoke_update_lambda |
| 18 | UploadFunction | WIPUploader-UploadFunction-hJDSjvqD9eM7 | AWS::Lambda::Function | UPDATE_COMPLETE | aws_lambda_function.upload |
| 19 | UploadLambdaExecutionRole | WIPUploader-UploadLambdaExecutionRole-pepPv9zSfzBh | AWS::IAM::Role | UPDATE_COMPLETE | aws_iam_role.upload_lambda_execution |

## Critical Resources (High Risk if Lost)
- **ImageBucket** (wip-uploader-strage): Contains all user-uploaded images
- **BasicAuthPassword** (WIPUploaderSecret): Authentication credentials
- **CloudFrontDistribution** (E96GV1FQF9SU0): CDN distribution
- **AuthorizerFunction**: Production authentication logic
- **UploadFunction**: Production upload logic
- **UpdateImagesJsonLambda**: Production indexing logic

## Resources That MUST Have DeletionPolicy: Retain
All resources listed above MUST have DeletionPolicy: Retain before CloudFormation stack deletion to prevent data loss.

## Missing from Terraform Configuration
None - all 19 CloudFormation resources are accounted for in Terraform configuration.

## Post-Migration Verification Checklist
- [ ] All 19 resources exist in AWS
- [ ] S3 bucket contains existing images
- [ ] CloudFront distribution is active
- [ ] Lambda functions have correct code (not placeholder)
- [ ] API Gateway endpoints respond correctly
- [ ] Secrets Manager contains authentication credentials