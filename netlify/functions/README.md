# Netlify Functions

## Overview
Legacy serverless HTTP endpoint code originally deployed on Netlify Functions (Netlify as the hosting provider is deprecated; frontend hosting has moved to Cloudflare Pages via `wrangler` CLI and `../../wrangler.jsonc`, while `vite.config.ts` still wires `/.netlify/functions/gemma` in local dev). Houses the Google AI proxy function (`gemma.ts`) that forwards weekly budget advisor prompts to the Google Generative Language API with per-IP hourly rate limiting, multi-key round-robin failover, and response sanitization.

## Interface
- `[gemma.ts:handler]` (default export): Web `Request` handler supporting:
  - `OPTIONS`: Returns HTTP `204` with CORS headers (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`).
  - `GET`: Rate-limit status probe returning HTTP `200` JSON `{ isLimited, remainingCalls, resetsInSeconds, totalLimit, activeKeysCount }` for the resolved client IP.
  - `POST`: Accepts JSON `{ userPrompt?: string; systemInstruction?: string; contents?: string }`, invokes Google Generative Language `generateContent`, and returns HTTP `200` JSON `{ answerMarkdown, modelUsed, remainingCalls }`.
  - Other HTTP methods return HTTP `405` (`METHOD_NOT_ALLOWED`).
- `[gemma.ts:getApiKeys]`: Resolves Google AI API keys from `GOOGLE_AI_API_KEY_1`..`GOOGLE_AI_API_KEY_4`, falling back to comma-separated `GOOGLE_AI_API_KEYS`, then `GOOGLE_AI_API_KEY`.
- `[gemma.ts:checkRateLimit]`: Evaluates the 1-hour sliding window (`ONE_HOUR_MS`) against `[gemma.ts:MAX_REQUESTS_PER_HOUR]` (`process.env.AI_HOURLY_RATE_LIMIT || 30`) and returns `{ allowed, remaining, resetsInSeconds }`.
- `[gemma.ts:recordUsage]`: Appends `Date.now()` to `[gemma.ts:ipRateLimitStore]` for the given client IP.
- `[gemma.ts:RateLimitRecord]`: TypeScript interface `{ timestamps: number[] }` stored per client IP.

## Invariants
- `[gemma.ts:handler]`: `POST` requests require valid JSON (`400 INVALID_JSON_BODY` on parse error) containing at least one of `body.contents` or `body.userPrompt` (`400 MISSING_CONTENTS` otherwise).
- `[gemma.ts:handler]`, `[gemma.ts:getApiKeys]`: If zero API keys are configured in environment variables, `POST` returns `503 NO_API_KEYS_CONFIGURED`.
- `[gemma.ts:checkRateLimit]`, `[gemma.ts:recordUsage]`: Client IP is parsed from the first comma-separated entry of `x-forwarded-for` (defaulting to `"anonymous-client"`). Calls at or above `MAX_REQUESTS_PER_HOUR` within 1 hour return `429 HOURLY_RATE_LIMIT_EXCEEDED`; `recordUsage` is only called after a non-empty model response is returned.
- `[gemma.ts:handler]`: Target model defaults to `process.env.GEMMA_MODEL || "gemini-3.5-flash-lite"` with `temperature: 0.2` and `maxOutputTokens: 1400`. When `targetModel` starts with `"gemini"` (case-insensitive) and `body.systemInstruction` is present, `payload.systemInstruction` is set; otherwise `systemInstruction` is prepended to the user prompt text.
- `[gemma.ts:handler]`: Round-robin key failover retries up to `keys.length` keys on HTTP `429`/`403`, non-OK statuses, empty candidate text, or thrown errors; if all keys fail, returns `502 ALL_KEYS_EXHAUSTED_OR_FAILED`.
- `[gemma.ts:handler]`: Output sanitization strips `<thought>...</thought>` and `<think>...</think>` blocks and slices to the `Week Overview` heading when present (or removes echoed prompt preambles).

## Side Effects
- `[gemma.ts:ipRateLimitStore]`, `[gemma.ts:checkRateLimit]`, `[gemma.ts:recordUsage]`: Mutates module-level in-memory `Map<string, RateLimitRecord>` per client IP by pruning timestamps older than 1 hour and recording new request timestamps.
- `[gemma.ts:globalKeyIndex]`, `[gemma.ts:handler]`: Mutates module-level `globalKeyIndex` across key-rotation attempts.
- `[gemma.ts:handler]`: Issues outbound HTTPS `POST` requests to `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent`.

## Verification
- Run: `npm test`