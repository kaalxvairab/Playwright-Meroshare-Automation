resource "github_actions_secret" "all_secrets" {
  for_each        = nonsensitive(var.secret)
  repository      = "Playwright-Meroshare-Automation"
  secret_name     = each.key
  plaintext_value = each.value
}
