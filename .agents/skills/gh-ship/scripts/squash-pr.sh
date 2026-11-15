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
GIT_DIR="$(git rev-parse --git-dir)"
GIT_COMMON_DIR="$(git rev-parse --git-common-dir)"

if [[ "$GIT_DIR" != "$GIT_COMMON_DIR" ]]; then
  # In a linked worktree, `gh pr merge --delete-branch` fails trying to checkout `main` locally.
  HEAD_BRANCH="$(gh pr view "$PR_NUM" --json headRefName -q .headRefName)"
  gh pr merge "$PR_NUM" --squash
  if [[ -n "$HEAD_BRANCH" ]]; then
    git push origin --delete "$HEAD_BRANCH" 2>/dev/null || true
  fi
else
  gh pr merge "$PR_NUM" --squash --delete-branch
fi
echo "==> PR #${PR_NUM} squash-merged."
