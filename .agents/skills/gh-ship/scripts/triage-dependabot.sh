#!/usr/bin/env bash
set -euo pipefail

# Inspect a Dependabot PR and optionally run local gates in a temporary worktree.
if [[ $# -lt 1 || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Usage: $(basename "$0") <pr-number> [--test]"
  exit 0
fi

PR_NUM="$1"
RUN_TEST=false
if [[ "${2:-}" == "--test" ]]; then
  RUN_TEST=true
fi

echo "==> PR #${PR_NUM} Summary"
gh pr view "$PR_NUM" --json number,title,headRefName,mergeable,mergeStateStatus,files \
  --template '#{{.number}}: {{.title}}
Branch: {{.headRefName}}
Mergeable: {{.mergeable}} ({{.mergeStateStatus}})
Files: {{range .files}}{{.path}} (+{{.additions}}/-{{.deletions}}) {{end}}
'

echo "==> PR #${PR_NUM} Checks"
gh pr checks "$PR_NUM" || true

echo "==> PR #${PR_NUM} Diff"
gh pr diff "$PR_NUM"

if [[ "$RUN_TEST" == "true" ]]; then
  BRANCH=$(gh pr view "$PR_NUM" --json headRefName -q .headRefName)
  TMP_DIR=$(mktemp -d)
  cleanup() {
    git worktree remove --force "$TMP_DIR" >/dev/null 2>&1 || rm -rf "$TMP_DIR"
    git worktree prune >/dev/null 2>&1 || true
  }
  trap cleanup EXIT

  echo "==> Fetching $BRANCH and running gates in $TMP_DIR"
  git fetch origin "$BRANCH"
  git worktree add --detach "$TMP_DIR" "origin/${BRANCH}"
  (
    cd "$TMP_DIR"
    npm ci
    npm run verify:lock
    npm run typecheck
    npm test
    npm run build
  )
fi
