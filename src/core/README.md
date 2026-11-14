# Core Domain Layer

## Overview
Platform-agnostic domain models, port contracts, and financial engines. Contains zero browser DOM, IndexedDB, or React dependencies so business rules remain portable and unit-testable.

## Subdirectories & Boundaries
- **[`./models/README.md`](./models/README.md)**: Zod schemas, TypeScript domain types (`Transaction`, `Subscription`, `Invoice`, `Wallet`, `UserProfile`, `AppNotification`, `AIAdvisorRequest`), and display formatters (`formatCurrency`, `formatWalletLabel`).
- **[`./ports/README.md`](./ports/README.md)**: Dependency-inversion interfaces (`IStorageRepo`, `IFileStore`, `IAIEngine`) implemented by adapters.
- **[`./engine/README.md`](./engine/README.md)**: Pure financial calculations, atomic ledger commands (`ledgerCommands.ts`), subscription/invoice reconciliation (`reconcile`), PH transfer fee rules (`detectTransferFee`), analytics (`calculateCashflow`, `calculateCommittedWaterfall`, `analyzeWalletLiquidity`, `analyzeInvoiceAging`), and AI prompt/snapshot builders.