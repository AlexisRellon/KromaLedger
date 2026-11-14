# Core Domain Models

## Overview
Defines Zod validation schemas, TypeScript domain types, currency/wallet label formatters, and AI advisor data contracts shared across core, state, adapters, and UI layers.

## Interface
- `weeklyBudgetSnapshotSchema` (`WeeklyBudgetSnapshot`), `aiChatMessageSchema` (`AIChatMessage`), `aiChatThreadSchema` (`AIChatThread`), `aiAdvisorRequestSchema` (`AIAdvisorRequest`), `aiAdvisorResponseSchema` (`AIAdvisorResponse`), `RateLimitStatus`: [ai.ts:aiAdvisorRequestSchema] — AI advisor context, chat thread, request, response, and rate-limit schemas.
- `dateOnlySchema`, `transactionTypeSchema`, `transferChannelSchema` (`TransferChannel`), `transactionSchema` (`Transaction`): [index.ts:transactionSchema] — Transaction and transfer schemas.
- `billingCycleSchema`, `subscriptionSchema` (`Subscription`), `invoiceStatusSchema`, `invoiceDirectionSchema`, `invoiceItemSchema` (`InvoiceItem`), `invoiceSchema` (`Invoice`): [index.ts:invoiceSchema] — Subscription, invoice, line-item, and loan/installment obligation schemas.
- `categorySchema` (`Category`), `ALLOWED_ATTACHMENT_MIME_TYPES`, `attachmentMimeTypeSchema` (`AttachmentMimeType`), `attachmentMetaSchema` (`AttachmentMeta`): [index.ts:attachmentMetaSchema] — Category and receipt attachment metadata schemas.
- `appMetaSchema` (`AppMeta`), `userProfileSchema` (`UserProfile`), `walletTypeSchema` (`WalletType`), `walletPatternSchema` (`WalletPattern`), `cardNetworkSchema` (`CardNetwork`), `walletSchema` (`Wallet`): [index.ts:walletSchema] — Metadata, user profile, and wallet card schemas.
- `notificationTypeSchema` (`NotificationType`), `appNotificationSchema` (`AppNotification`): [index.ts:appNotificationSchema] — In-app notification schema.
- `formatCurrency(minor: number, currency = "PHP"): string`: [index.ts:formatCurrency] — Formats integer minor units using `Intl.NumberFormat` (`en-PH`).
- `formatWalletLabel(wallet: Pick<Wallet, "name" | "accountNumber">): string`: [index.ts:formatWalletLabel] — Formats wallet display label with optional masked suffix.

## Invariants
- All monetary amounts require `Number.isSafeInteger` minor units; currencies require 3-character codes defaulting to `"PHP"` [index.ts:transactionSchema], [index.ts:walletSchema].
- `dateOnlySchema` enforces strict `YYYY-MM-DD` syntax and real Gregorian calendar validity (e.g., rejecting Feb 30) [index.ts:dateOnlySchema].
- `invoiceSchema` refines obligation invoices to enforce `direction === "PAYABLE"`, `obligation.paymentMinor <= totalMinor`, and `paidMinor <= totalMinor` [index.ts:invoiceSchema].
- `ALLOWED_ATTACHMENT_MIME_TYPES` restricts attachments to PNG, JPEG, WEBP, GIF, and PDF; `aiAdvisorRequestSchema` constrains `prompt` length to `1..1000` characters [index.ts:ALLOWED_ATTACHMENT_MIME_TYPES], [ai.ts:aiAdvisorRequestSchema].

## Side Effects
- None

## Verification
- Run: `npm test`