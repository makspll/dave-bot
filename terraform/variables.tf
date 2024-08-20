variable "grafana_api_key" {
  type        = string
  description = "key for grafana provider"
  sensitive   = true
}

variable "loki_username" {
  type        = string
  description = "username for loki data source"
  sensitive   = true
}

variable "loki_password" {
  type        = string
  description = "password for loki data source"
  sensitive   = true
}
