provider "grafana" {
  url  = "https://makspll.grafana.net"
  auth = var.grafana_api_key
}


resource "grafana_data_source" "loki" {
  name        = "Loki"
  type        = "loki"
  url         = "https://logs-prod-012.grafana.net"
  access_mode = "proxy"

  basic_auth_enabled  = true
  basic_auth_username = var.loki_username
  basic_auth_password = var.loki_password

  json_data = jsonencode({
    max_lines = 1000
  })
}
