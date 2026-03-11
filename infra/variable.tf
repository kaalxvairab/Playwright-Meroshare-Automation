
variable "PAT" {
  type        = string
  description = "Personal access token of the user"
  sensitive   = true
}

variable "secret" {
  type        = map(string)
  description = "Map of secrets for GitHub Actions"
  sensitive   = true
}