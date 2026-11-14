#!/usr/bin/env bash
set -euo pipefail

# Watch required checks on a PR and squash-merge + delete branch once green.
if [[ $# -lt 1 || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Usage: $(basename "$0") <pr-number> [--no-watch]"
  exit 0
fi

PR_NUM="$1"
WATCH=true
if [[ "${2:-}" == "--no-watch" ]]; then
  WATCH=false
fi

if [[ "$WATCH" == "true" ]]; then
  echo "==> Waiting for checks on PR #${PR_NUM}..."
  gh pr checks "$PR_NUM" --watch
fi

echo "==> Squash-merging PR #${PR_NUM}..."
gh pr merge "$PR_NUM" --squash --delete-branch
echo "==> PR #${PR_NUM} squash-merged."
