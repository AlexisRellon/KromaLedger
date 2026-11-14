#!/usr/bin/env bash
set -euo pipefail

# Run local verification gates before opening or merging a PR.
SKIP_BUILD=false
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    -h|--help)
      echo "Usage: $(basename "$0") [--skip-build]"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

echo "==> Running verify:lock"
npm run verify:lock

echo "==> Running typecheck"
npm run typecheck

echo "==> Running tests"
npm test

if [[ "$SKIP_BUILD" == "false" ]]; then
  echo "==> Running build"
  npm run build
fi

echo "==> All local gates passed."
