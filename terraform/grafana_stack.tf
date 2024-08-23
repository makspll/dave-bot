
provider "grafana" {
  url  = module.dave_grafana_stack.stack_url
  auth = module.dave_grafana_stack.service_account_token
}

module "dave_grafana_stack" {
  source          = "./modules/grafana_stack"
  grafana_api_key = var.grafana_api_key
  stack_name      = "dave-bot"
  stack_slug      = "dave-bot"
  region_slug     = "eu"
}

resource "grafana_folder" "dave_folder" {
  title = "Dave Bot"
}

resource "grafana_data_source" "loki" {
  name                = "Loki"
  type                = "loki"
  url                 = "https://logs-dave-bot.grafana.net"
  access_mode         = "proxy"
  basic_auth_enabled  = true
  basic_auth_username = var.loki_username
  secure_json_data_encoded = jsonencode({
    basicAuthPassword = var.loki_password
  })
}
