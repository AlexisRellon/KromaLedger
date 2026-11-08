# Kaban

**Kaban** (formerly KromaLedger) is a local-first, on-device financial vault and tracker for daily expenses, recurring subscriptions, itemized client invoices, and physical wallets. Built with a tactile Philippine neobrutalist aesthetic, it operates entirely in the browser using IndexedDB with zero remote tracking, zero account sign-ups, and zero cloud lock-in.

---

## Brand Metaphor & Design

*Kaban* is the Filipino term for a traditional wooden or metal-reinforced storage chest used by families to safeguard heirlooms, vital records, land titles, and hard-earned savings.

Reflecting this heritage of private custody, Kaban abandons sterile fintech glass in favor of a tactile **Neobrutalist Paper** system:
- **Paper Canvas**: Warm cream paper base (`#FAF8F5`) layered with subtle ledger graph lines.
- **Charcoal Ink**: Bold 2px dark ink borders (`#18181B`) and hard offset shadows (`3px 3px 0px #18181B`).
- **Heritage Palette**: Royal Plum (`#4A154B`), Lavender (`#EDE9FE`), and Kaban Gold (`#F59E0B` / `#FBBF24`), accompanied by fresh mint (`#10B981`) and rose (`#F43F5E`) ledger indicators.
- **Authentic Local Typography**: **Dangwa** (Filipino public transport brush lettering by Aaron Amar) and **Bantayog** (Philippine monument display lettering by Jad Maza), paired with **Satoshi** (modern body grotesque) and **JetBrains Mono** (monospaced tabular financial numbers).

> [!NOTE]
> **Compatibility Note**: To preserve existing user databases during the rebrand, the underlying IndexedDB database identifier remains `KromaLedgerDB`. Backups export as `kaban-vault-YYYY-MM-DD.zip`, while legacy `kromaledger-vault-*.zip` archives remain fully importable.

---

## Getting Started

### Prerequisites
- Node.js 22.12 or later
- npm 10.x or later

### Installation & Development
```sh
npm ci
npm run dev
```

Open the local URL printed by Vite in your browser. On first launch, Kaban initializes the local database with sample entries. Subsequent launches maintain your existing on-device vault.

---

## Deployment (Cloudflare Pages)

Kaban is deployed on Cloudflare Pages at **https://kaban-ckh.pages.dev** with zero cold starts, global edge distribution, and zero monthly cost on the free tier.

SPA routing (`public/_redirects`), security headers, and long-term asset caching (`public/_headers`) are preconfigured and copied into `dist/` during build.

### Option A: Automatic Git Deploy (Recommended)
1. In Cloudflare Dashboard, go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Select repository `Kaban`.
3. Set build configuration:
   - **Framework preset**: `None` or `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **Save and Deploy**. Cloudflare assigns a free `*.pages.dev` subdomain automatically.

### Option B: Wrangler CLI Deploy
```sh
npm run build
npx wrangler pages deploy dist --project-name=kaban
```

---

## Verification & Quality Gates

Run the automated test suites, typechecks, and portability guardrails:

```sh
npm run verify:lock
npm run typecheck
npm test
npm run build
node scripts/verify-portability.mjs
```

### Strict Headless Portability
The portability checker (`scripts/verify-portability.mjs`) counts nonblank TypeScript, TSX, and CSS lines across `src`. It enforces strict decoupling by rejecting any browser-specific APIs (`window`, `document`, DOM events) and intrinsic web JSX from `src/core` and `src/state`. This architecture guarantees that core accounting logic and state managers can be ported directly to native mobile frameworks (such as React Native / Expo) without modifications.

---

## Architecture & Codebase Layout

```text
src/
├── core/                         # 100% Headless domain models, calculators, reconcilers
│   ├── engine/                   # Reconciler, cashflow, fees, invoice math, numpad evaluator
│   ├── models/                   # Zod schemas & TypeScript types (Transaction, Invoice, Wallet, etc.)
│   └── ports/                    # Abstract contracts (IStorageRepo, IFileStore)
├── adapters/                     # Browser-specific implementations
│   ├── web-dexie/                # Dexie.js (KromaLedgerDB) storage repo & WebP image compression
│   └── backup/                   # Zip archive export and atomic restore engine
├── state/                        # State orchestration (TanStack Query + Zustand)
│   ├── queries/                  # React Query hooks for reactive UI subscriptions
│   └── StorageContext.tsx        # Injected storage repo provider
└── ui/                           # Neobrutalist web interface & responsive screens
    ├── primitives/               # Centralized design system controls (Button, Field, Modal, ChartFrame)
    ├── components/               # Domain widgets (TopStatusHeader, FloatingNavPill, QuickAddDrawer)
    └── screens/                  # HomeDashboard, PendingAndSubsHub, WalletsScreen, SettingsScreen
```

---

## Local Vault & Atomic Backup

Kaban stores your financial data entirely on this device.
- **Exporting a Vault**: The vault screen exports a ZIP archive containing `db-dump.json` and all receipt/invoice attachments. Keep exported ZIP archives secure and private.
- **Restoring a Vault**: Restoring an archive performs an atomic single-transaction replacement of your local vault after validating file integrity and schema versions.

---

## Self-Hosted Fonts & Provenance

All font assets are bundled locally in [`public/fonts/`](file:///public/fonts/) to eliminate external network requests:
- **Dangwa**: Brush typeface by Aaron Amar (Manila, Philippines). Sourced from Behance. 100% Free for Commercial and Personal Use ([`Dangwa-LICENSE.txt`](file:///public/fonts/Dangwa-LICENSE.txt)).
- **Bantayog**: Rough monument typeface by Jad Maza (© 2020). Single-user free license ([`Licensing - Bantayog [FREE].txt`](file:///public/fonts/Licensing - Bantayog [FREE].txt)). Web embedding permitted via local `@font-face` per Jad Maza EULA (https://jadmaza.gumroad.com/p/eula-free).
- **Satoshi & Cabinet Grotesk**: Variable grotesque typefaces by Indian Type Foundry. Free commercial use ([`Satoshi-LICENSE.txt`](file:///public/fonts/Satoshi-LICENSE.txt), [`CabinetGrotesk-LICENSE.txt`](file:///public/fonts/CabinetGrotesk-LICENSE.txt)).
- **JetBrains Mono**: Monospaced tabular numerals by JetBrains. SIL Open Font License 1.1 ([`JetBrainsMono-OFL.txt`](file:///public/fonts/JetBrainsMono-OFL.txt)).
