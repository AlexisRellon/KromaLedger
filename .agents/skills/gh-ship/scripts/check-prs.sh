#!/usr/bin/env bash
set -euo pipefail

# List open PRs with check rollup, mergeable state, and author.
if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Usage: $(basename "$0") [limit]"
  exit 0
fi

LIMIT="${1:-20}"

gh pr list --state open --limit "$LIMIT" \
  --json number,title,author,headRefName,baseRefName,mergeable,mergeStateStatus,url \
  --template '{{range .}}#{{.number}} [{{.mergeStateStatus}}/{{.mergeable}}] {{.title}} ({{.author.login}}: {{.headRefName}} -> {{.baseRefName}})
  {{.url}}
{{else}}No open pull requests.
{{end}}'
