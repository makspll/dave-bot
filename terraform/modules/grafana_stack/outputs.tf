output "stack_url" {
  description = "URL of the Grafana stack"
  value       = grafana_cloud_stack.grafana_stack.url
}

output "service_account_id" {
  description = "ID of the service account"
  value       = grafana_cloud_stack_service_account.stack_service_account.id
}

output "service_account_token" {
  description = "Token of the service account"
  value       = grafana_cloud_stack_service_account_token.stack_service_account.key
}

output "stack_loki_url" {
  description = "URL of the Loki datasource"
  value       = grafana_cloud_stack.grafana_stack.logs_url
}

output "stack_loki_username" {
  description = "URL of the Loki datasource"
  value       = grafana_cloud_stack.grafana_stack.logs_user_id
}



