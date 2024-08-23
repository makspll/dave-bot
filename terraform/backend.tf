terraform {

  backend "remote" {
    hostname     = "app.terraform.io"
    organization = "dave-corp"

    workspaces {
      name = "dave-bot"
    }
  }
}
