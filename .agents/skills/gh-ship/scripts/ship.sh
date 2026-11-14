#!/usr/bin/env bash
set -euo pipefail

# Run gates, push current branch, open a PR, and optionally watch + squash-merge.
TITLE=""
BODY=""
BASE="main"
SQUASH=false
SKIP_GATES=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --title) TITLE="${2:-}"; shift 2 ;;
    --body) BODY="${2:-}"; shift 2 ;;
    --base) BASE="${2:-}"; shift 2 ;;
    --squash) SQUASH=true; shift ;;
    --skip-gates) SKIP_GATES=true; shift ;;
    -h|--help)
      echo "Usage: $(basename "$0") --title <title> [--body <body>] [--base main] [--squash] [--skip-gates]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

BRANCH=$(git branch --show-current)
if [[ -z "$BRANCH" || "$BRANCH" == "$BASE" ]]; then
  echo "Error: Must be on a non-$BASE branch to ship." >&2
  exit 1
fi

if [[ "$SKIP_GATES" == "false" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  bash "${SCRIPT_DIR}/gates.sh"
fi

echo "==> Pushing branch $BRANCH"
git push -u origin "$BRANCH"

EXISTING_PR=$(gh pr list --head "$BRANCH" --state open --json number -q '.[0].number // empty')
if [[ -n "$EXISTING_PR" ]]; then
  PR_NUM="$EXISTING_PR"
  echo "==> Using existing open PR #${PR_NUM}"
else
  if [[ -z "$TITLE" ]]; then
    TITLE=$(git log -1 --pretty=%s)
  fi
  echo "==> Creating PR against $BASE: $TITLE"
  PR_URL=$(gh pr create --base "$BASE" --head "$BRANCH" --title "$TITLE" --body "$BODY")
  PR_NUM=$(gh pr view "$PR_URL" --json number -q .number)
  echo "==> Opened PR #${PR_NUM}: $PR_URL"
fi

if [[ "$SQUASH" == "true" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  bash "${SCRIPT_DIR}/squash-pr.sh" "$PR_NUM"
fi
