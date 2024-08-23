output "stack_url" {
  description = "URL of the Grafana stack"
  value       = grafana_cloud_stack.dave_stack.url
}

output "service_account_id" {
  description = "ID of the service account"
  value       = grafana_cloud_stack_service_account.dave_service_account.id
}

output "service_account_token" {
  description = "Token of the service account"
  value       = grafana_cloud_stack_service_account_token.dave_service_account.key
}


