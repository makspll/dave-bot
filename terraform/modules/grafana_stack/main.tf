terraform {
  required_providers {
    grafana = {
      source  = "grafana/grafana"
      version = ">= 2.9.0"
    }
  }
}

// Step 1: Create a stack
resource "grafana_cloud_stack" "grafana_stack" {
  provider = grafana

  name        = var.stack_name
  slug        = var.stack_slug
  region_slug = var.region_slug
}

// Step 2: Create a service account and key for the stack
resource "grafana_cloud_stack_service_account" "stack_service_account" {
  provider   = grafana
  stack_slug = grafana_cloud_stack.grafana_stack.slug

  name        = "${var.stack_name}-service-account"
  role        = "Admin"
  is_disabled = false
}

resource "grafana_cloud_stack_service_account_token" "stack_service_account" {
  provider   = grafana
  stack_slug = grafana_cloud_stack.grafana_stack.slug

  name               = "${var.stack_name}-service-account-token"
  service_account_id = grafana_cloud_stack_service_account.stack_service_account.id
}
