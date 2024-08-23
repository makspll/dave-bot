variable "grafana_api_key" {
  description = "Grafana API key for an access policy able to create/modify grafana cloud stacks"
  type        = string
}

variable "stack_name" {
  description = "Name of the Grafana stack"
  type        = string
}

variable "stack_slug" {
  description = "Slug of the Grafana stack"
  type        = string
}

variable "region_slug" {
  description = "Region slug for the Grafana stack"
  type        = string
}


variable "service_account_role" {
  description = "Role of the service account"
  default     = "Admin"
  type        = string
}
