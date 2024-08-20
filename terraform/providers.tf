terraform {
  required_providers {
    grafana = {
      source  = "grafana/grafana"
      version = "3.7.0"
    }
  }
}

provider "grafana" {
  url  = "https://maksana.grafana.net"
  auth = var.grafana_api_key
}

