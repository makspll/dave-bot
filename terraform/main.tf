
resource "grafana_data_source" "loki" {
  name                = "Loki"
  type                = "loki"
  url                 = "https://logs-prod-012.grafana.net"
  access_mode         = "proxy"
  basic_auth_enabled  = true
  basic_auth_username = var.loki_username
  secure_json_data_encoded = jsonencode({
    basicAuthPassword = var.loki_password
  })
}
