provider "aws" {
  region                      = "ap-northeast-1" # Specify your desired region
  access_key                  = "dummy"          # Use mock credentials for local testing
  secret_key                  = "dummy"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  endpoints {
    dynamodb = "http://localhost:8000"
    iam      = "http://localhost:8000"
  }
}

terraform {
  backend "local" {
    path = "terraform.tfstate" # Local state file path
  }
}

variable "prefix" {
  default = "mdm"
}

variable "environment" {
  default = "local"
}

resource "aws_dynamodb_table" "drafts" {
  name         = "${var.prefix}-drafts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "draftId"
  # range_key    = "version"
  attribute {
    name = "draftId"
    type = "S"
  }

  # attribute {
  #   name = "version"
  #   type = "N"
  # }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  global_secondary_index {
    name            = "userId_index"
    hash_key        = "userId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

resource "aws_dynamodb_table" "reviews" {
  name         = "${var.prefix}-reviews"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "draftId"
  range_key    = "reviewerId"

  attribute {
    name = "draftId"
    type = "S"
  }

  attribute {
    name = "reviewerId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  # Add GSI for querying reviews by reviewer
  global_secondary_index {
    name            = "reviewerId_index"
    hash_key        = "reviewerId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}
