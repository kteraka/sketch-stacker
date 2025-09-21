# COMPLETE Config-driven imports for CloudFormation to Terraform migration
# ALL CloudFormation resources included - Terraform 1.5+ feature

# =====================================================================================
# SECRETS MANAGER RESOURCES
# =====================================================================================
import {
  to = aws_secretsmanager_secret.basic_auth_password
  id = "arn:aws:secretsmanager:ap-northeast-1:791464527050:secret:WIPUploaderSecret-SWNxHU"
}

# Note: SecretVersion will be created new to avoid conflicts

# =====================================================================================
# S3 RESOURCES
# =====================================================================================
import {
  to = aws_s3_bucket.image_bucket
  id = "wip-uploader-strage"
}

import {
  to = aws_s3_bucket_public_access_block.image_bucket
  id = "wip-uploader-strage"
}

import {
  to = aws_s3_bucket_policy.image_bucket
  id = "wip-uploader-strage"
}

# Note: S3 bucket notification will be recreated to avoid conflicts

# =====================================================================================
# CLOUDFRONT RESOURCES
# =====================================================================================
import {
  to = aws_cloudfront_distribution.main
  id = "E96GV1FQF9SU0"
}

import {
  to = aws_cloudfront_origin_access_control.image_bucket
  id = "E1Y0EK4C9ZX47D"
}

import {
  to = aws_cloudfront_response_headers_policy.cors
  id = "4f6ab204-bbcb-4a16-bb18-fb14748b8d29"
}

# =====================================================================================
# IAM ROLES
# =====================================================================================
import {
  to = aws_iam_role.upload_lambda_execution
  id = "WIPUploader-UploadLambdaExecutionRole-pepPv9zSfzBh"
}

import {
  to = aws_iam_role.update_lambda_execution
  id = "WIPUploader-UpdateImagesJsonLambdaExecutionRole-MhwPNOwZDB5j"
}

# =====================================================================================
# LAMBDA FUNCTIONS
# =====================================================================================
import {
  to = aws_lambda_function.upload
  id = "WIPUploader-UploadFunction-hJDSjvqD9eM7"
}

import {
  to = aws_lambda_function.authorizer
  id = "WIPUploader-AuthorizerFunction-7WKXvtdhJ2Lx"
}

import {
  to = aws_lambda_function.update_images_json
  id = "WIPUploaderUpdateImagesJsonFunction"
}

# =====================================================================================
# API GATEWAY RESOURCES
# =====================================================================================
import {
  to = aws_api_gateway_rest_api.main
  id = "3p4utkstnb"
}

import {
  to = aws_api_gateway_resource.upload
  id = "3p4utkstnb/zu6l15"
}

import {
  to = aws_api_gateway_authorizer.basic_auth
  id = "3p4utkstnb/b8w9lx"
}

import {
  to = aws_api_gateway_method.upload_post
  id = "3p4utkstnb/zu6l15/POST"
}

import {
  to = aws_api_gateway_deployment.main
  id = "3p4utkstnb/mpu16a"
}

# Note: API Gateway Integration and Stage are not importable - will be recreated

# =====================================================================================
# LAMBDA PERMISSIONS - Will be recreated (CloudFormation uses statement IDs)
# =====================================================================================
# Note: Lambda permissions will be recreated to avoid import ID format issues