terraform {
  required_version = ">= 1.5" # For config-driven imports
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70" # Latest features
    }
    # Backup for coverage gaps
    awscc = {
      source  = "hashicorp/awscc"
      version = "~> 1.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}