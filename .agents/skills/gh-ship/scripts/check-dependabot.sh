#!/usr/bin/env bash
set -euo pipefail

# List open Dependabot PRs and open Dependabot security alerts.
if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Usage: $(basename "$0")"
  exit 0
fi

echo "==> Open Dependabot PRs"
gh pr list --author "dependabot[bot]" --state open --limit 50 \
  --json number,title,headRefName,mergeable,mergeStateStatus,createdAt,url \
  --template '{{range .}}#{{.number}} [{{.mergeStateStatus}}/{{.mergeable}}] {{.title}} ({{.headRefName}})
  {{.url}}
{{else}}No open Dependabot PRs.
{{end}}'

echo ""
echo "==> Open Dependabot Security Alerts"
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
gh api "repos/${REPO}/dependabot/alerts?state=open&per_page=50" \
  --jq 'if length == 0 then "No open Dependabot alerts." else .[] | "#\(.number) [\(.security_advisory.severity)] \(.dependency.package.name) (\(.security_vulnerability.vulnerable_version_range) -> \(.security_vulnerability.first_patched_version.identifier // "none")) - \(.security_advisory.summary)" end' \
  || echo "Unable to query Dependabot alerts (check token permissions or if alerts are enabled)."
