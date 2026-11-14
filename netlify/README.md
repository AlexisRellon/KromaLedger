# netlify

## Overview
Legacy Netlify serverless runtime directory (Netlify as the hosting provider is deprecated; frontend hosting has moved to Cloudflare Pages via `wrangler` CLI and `../wrangler.jsonc`). Groups the remaining HTTP backend function (`functions/gemma.ts`) that proxies and rate-limits external Google AI requests for KromaLedger.

## Subdirectories & Boundaries
- [functions](./functions/README.md) - Legacy Netlify serverless function (`gemma.ts`), providing the CORS-enabled AI advisor proxy with per-IP hourly rate limiting, multi-key round-robin failover, and response sanitization.