# BUG-001: `gh-ship` Scripts Fail on Windows CRLF Checkouts & Linked Git Worktrees

- **Status:** Fixed
- **Date:** 2026-11-15
- **Component:** `.agents/skills/gh-ship/scripts/`

## Symptoms
1. Running `bash .agents/skills/gh-ship/scripts/ship.sh` on Windows failed on line 2:
   ```text
   .agents/skills/gh-ship/scripts/ship.sh: line 2: set: pipefail\r: invalid option name
   ```
2. Running `gh pr merge <pr> --squash --delete-branch` from inside a linked git worktree (e.g., `.worktrees/automated-interest`) failed during local branch cleanup:
   ```text
   failed to run git: fatal: 'main' is already used by worktree at 'D:/Personal Projects/KromaLedger'
   ```

## Root Causes
1. `.gitattributes` did not enforce `eol=lf` for `*.sh` files, so Git on Windows checked out `.agents/skills/gh-ship/scripts/*.sh` with `CRLF` line endings, breaking `bash`'s `set -euo pipefail`.
2. `squash-pr.sh` unconditionally passed `--delete-branch` to `gh pr merge`, which attempts a local `git checkout main` after merging — invalid when `main` is already checked out in the primary worktree.

## Resolution
1. Added `*.sh text eol=lf` to `.gitattributes` and normalized all `.agents/skills/gh-ship/scripts/*.sh` files to `LF`.
2. Updated `.agents/skills/gh-ship/scripts/squash-pr.sh` to detect linked worktrees (`git rev-parse --git-dir` vs `--git-common-dir`), run `gh pr merge <pr> --squash` without `--delete-branch`, and delete the remote head branch via `git push origin --delete "$HEAD_BRANCH"`.
