# AI Adapters

## Overview
Implements the web AI advisor client (`NetlifyGemmaAdapter`) and browser-persisted multi-thread chat history storage for Kaban's local financial assistant.

## Interface
- `class NetlifyGemmaAdapter implements IAIEngine`: [NetlifyGemmaAdapter.ts:NetlifyGemmaAdapter] — Calls the Netlify Gemma function endpoint (`/.netlify/functions/gemma`) with `askWeeklyBudget(request: AIAdvisorRequest): Promise<AIAdvisorResponse>` and `getRateLimitStatus(): Promise<RateLimitStatus>`.
- `export type { AIChatMessage, AIChatThread }`: [chatHistoryStorage.ts:AIChatMessage] — Re-exports AI chat message and thread models from `core/models`.
- `interface ThreadGroups`: [chatHistoryStorage.ts:ThreadGroups] — Date-grouped thread buckets (`today`, `yesterday`, `previous7Days`, `older`).
- `generateThreadTitle(prompt: string): string`: [chatHistoryStorage.ts:generateThreadTitle] — Derives a truncated thread title (up to 42 chars) from an initial prompt.
- `createEmptyThread(): AIChatThread`: [chatHistoryStorage.ts:createEmptyThread] — Creates a new empty `"New Chat"` thread with a generated ID and timestamps.
- `loadAllThreads(): AIChatThread[]`, `saveAllThreads(threads: AIChatThread[]): void`: [chatHistoryStorage.ts:loadAllThreads] — Loads, validates, migrates, and persists up to 40 threads.
- `getActiveThreadId(): string`, `setActiveThreadId(threadId: string): void`: [chatHistoryStorage.ts:getActiveThreadId] — Gets or sets the active thread ID, falling back to the most recent thread when unset.
- `createNewThread()`, `deleteThreadFromStorage(threadId)`, `renameThreadInStorage(threadId, newTitle)`, `clearAllChatThreads()`: [chatHistoryStorage.ts:createNewThread] — Thread lifecycle CRUD helpers.
- `exportThreadAsMarkdown(thread: AIChatThread): string`, `groupThreadsByDate(threads: AIChatThread[]): ThreadGroups`: [chatHistoryStorage.ts:exportThreadAsMarkdown] — Formats a thread as Markdown and groups threads by recency.
- `loadChatHistory()`, `saveChatHistory(messages)`, `clearChatHistory()`, `exportChatHistoryAsMarkdown(messages)`: [chatHistoryStorage.ts:loadChatHistory] — Legacy single-thread compatibility wrappers mapped onto the active v2 thread.

## Invariants
- `askWeeklyBudget` constructs prompts via `buildGemmaBudgetPrompt`, parses HTTP `429` `resetsInSeconds` (defaulting to `3600`) to throw a wait-minute message, and defaults `modelUsed` to `"gemini-3.5-flash-lite"` [NetlifyGemmaAdapter.ts:NetlifyGemmaAdapter].
- `getRateLimitStatus` falls back on non-OK HTTP responses or network failures to `{ isLimited: false, resetsInSeconds: 0, remainingCalls: 30, totalLimit: 30 }` [NetlifyGemmaAdapter.ts:NetlifyGemmaAdapter].
- `saveAllThreads` caps persisted state to the 40 most recently updated threads and at most 50 messages per thread, while `loadAllThreads` migrates legacy `kromaledger_ai_chat_history_v1` (up to the last 60 messages) [chatHistoryStorage.ts:saveAllThreads], [chatHistoryStorage.ts:loadAllThreads].
- Deleting or clearing threads always ensures at least one active thread exists, falling back to an in-memory `Map` when `window.localStorage` is unavailable [chatHistoryStorage.ts:deleteThreadFromStorage], [chatHistoryStorage.ts:clearAllChatThreads].

## Side Effects
- Executes `fetch` `POST` and `GET` HTTP calls to `/.netlify/functions/gemma` [NetlifyGemmaAdapter.ts:NetlifyGemmaAdapter].
- Reads, writes, and removes `kaban_ai_threads_v2`, `kaban_ai_active_thread_v2`, and legacy `kromaledger_ai_*` keys in `window.localStorage` [chatHistoryStorage.ts:saveAllThreads], [chatHistoryStorage.ts:setActiveThreadId].

## Verification
- Run: `npm test`