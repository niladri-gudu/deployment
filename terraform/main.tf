# TaskFlow AWS skeleton — Phase 2 (ECS first, then EKS).
# Fill in step by step while learning. Nothing here is applied yet.
#
# Suggested order:
#   1. provider + remote state (s3 + dynamodb)
#   2. vpc (2 AZs, public + private subnets, nat gateway)
#   3. ecr (taskflow-api, taskflow-worker — same image, different CMD)
#   4. rds (postgres 16, private subnets) + read replica (Phase 4)
#   5. elasticache (redis 7, private subnets)
#   6. alb (public, /health + /ready target group) -> ecs service (api)
#   7. ecs service (worker, autoscale on queue depth via CloudWatch)
#   8. secretsmanager (DATABASE_URL, REDIS_HOST) + cloudwatch logs

terraform {
  required_version = ">= 1.9.0"
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

# TODO(learning-1): add S3 backend for state.
# terraform {
#   backend "s3" {}
# }

# TODO(learning-2): module "vpc" { source = "./modules/vpc" ... }
# TODO(learning-3): module "ecr" { source = "./modules/ecr" ... }
# TODO(learning-4): module "rds" { source = "./modules/rds" ... }  # primary + read replica later
# TODO(learning-5): module "redis" { source = "./modules/elasticache" ... }
# TODO(learning-6): module "ecs_api" { source = "./modules/ecs-service" ... }  # ALB + HPA on CPU / request count
# TODO(learning-7): module "ecs_worker" { source = "./modules/ecs-service" ... }  # HPA on queue depth
