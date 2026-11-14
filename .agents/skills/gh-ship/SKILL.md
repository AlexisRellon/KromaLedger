---
name: gh-ship
description: Automate local verification gates, PR checks, Dependabot PR/alert triage, and shipping/squash-merging changes via GitHub CLI. Use when the user asks to check PRs, triage Dependabot PRs/alerts, ship changes, or squash-merge after checks are green.
---

# GitHub Ship & Triage

Composable bash scripts in `scripts/` for verifying, triaging, shipping, and squash-merging PRs in this repository.

## Prerequisites

- `git`, `gh` (authenticated), `node`/`npm`
- Run scripts from the repository root with Git Bash, WSL, Linux, or macOS (`bash .agents/skills/gh-ship/scripts/<script>.sh`).

## Scripts

| Script | Purpose | Example |
|---|---|---|
| `scripts/gates.sh` | Run `verify:lock`, `typecheck`, `test`, `build` | `bash .agents/skills/gh-ship/scripts/gates.sh` |
| `scripts/check-prs.sh` | List open PRs, check status, and mergeability | `bash .agents/skills/gh-ship/scripts/check-prs.sh` |
| `scripts/check-dependabot.sh` | List open Dependabot PRs and open Dependabot security alerts | `bash .agents/skills/gh-ship/scripts/check-dependabot.sh` |
| `scripts/triage-dependabot.sh` | Inspect a Dependabot PR and optionally run `gates.sh` on it in a temp worktree | `bash .agents/skills/gh-ship/scripts/triage-dependabot.sh 1 --test` |
| `scripts/ship.sh` | Run gates, push branch, open PR, watch checks, and squash-merge when green | `bash .agents/skills/gh-ship/scripts/ship.sh --title "feat: ..." [--squash]` |
| `scripts/squash-pr.sh` | Watch PR checks and squash-merge + delete branch when green | `bash .agents/skills/gh-ship/scripts/squash-pr.sh 1` |

## Standard Workflows

### 1. Triage Open PRs & Dependabot
1. Run `bash .agents/skills/gh-ship/scripts/check-prs.sh` and `bash .agents/skills/gh-ship/scripts/check-dependabot.sh`.
2. For each Dependabot PR, run `bash .agents/skills/gh-ship/scripts/triage-dependabot.sh <pr-number> --test`.
3. If compatible and checks are green, squash-merge with `bash .agents/skills/gh-ship/scripts/squash-pr.sh <pr-number>`.
4. If incompatible or failing, check out a branch or worktree, apply fixes, and ship via `scripts/ship.sh`.

### 2. Ship Local Changes
1. Ensure you are on a feature/chore branch (not `main`).
2. Run `bash .agents/skills/gh-ship/scripts/ship.sh --title "<pr-title>" --body "<summary>" --squash`.

## Guardrails

- Never force-merge or bypass branch rulesets unless the user explicitly asks.
- Never squash-merge a PR with failing or pending required checks.
- See [references/ruleset-and-ci.md](references/ruleset-and-ci.md) for `main` branch ruleset and CI check details.
