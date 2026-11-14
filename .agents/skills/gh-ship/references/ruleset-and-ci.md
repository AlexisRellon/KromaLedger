# Ruleset & CI Reference

## `Main` Branch Ruleset

- **Rules**: `deletion`, `non_fast_forward`, `required_status_checks` (`strict_required_status_checks_policy: true`)
- **Required Status Checks**:
  - `Cloudflare Pages` (Cloudflare Pages GitHub App, `integration_id: 85455`)
  - `CI` (GitHub Actions workflow `.github/workflows/ci.yml`, `integration_id: 15368`)

## Inspecting Rulesets

```bash
gh api repos/:owner/:repo/rules/branches/main
```

## CI Workflow

`.github/workflows/ci.yml` runs on `push` to `main` and `pull_request` to `main`:
1. `npm ci`
2. `npm run verify:lock`
3. `npm run typecheck`
4. `npm test`
5. `npm run build`
