# AGY DIRECTIVE (PART 5): Complete "Bantay (Baulito)" Mascot Suite & Front-Page Integration

## 0. OVERVIEW & MASCOT ASSET ARCHITECTURE

**Bantay (Baulito)**—the Living Kaban Chest—is the official interactive mascot for **Kaban**. All 9 poses have been vectorized in Figma and exported as static SVG assets using the `baulito-*.svg` naming convention:

* **Asset Directory**: Place all 9 exported SVG files inside `public/mascot/` (or `src/assets/mascot/` if bundled via Vite static imports):
  ```text
  public/mascot/
  ├── baulito-spent-stop.svg
  ├── baulito-saving-up.svg
  ├── baulito-calculating.svg
  ├── baulito-welcome.svg
  ├── baulito-celebrate-peso.svg
  ├── baulito-alert-peek.svg
  ├── baulito-vault-locked.svg
  ├── baulito-idle-sleep.svg
  └── baulito-standalone.svg
  ```

### Core Rule: Non-Intrusive Placement
Baulito injects warmth and Filipino heritage identity without adding visual clutter to financial figures:
* **ALLOWED**: Front-page landing greeting card (`welcome`), empty state wells when `items.length === 0` (`idle-sleep`), the `Local Vault • Backup` modal (`vault-locked`), overspending/shortfall warning banners (`spent-stop` / `alert-peek`), installment calculators (`calculating`), savings vaults (`saving-up`), and debt-payoff celebrations (`celebrate-peso`).
* **FORBIDDEN**: Never float or overlay Baulito on top of active charts, populated transaction rows, or numeric inputs.

---

## 1. THE 9-POSE FIGMA LAYER & FUNCTIONAL MATRIX

| Pose Slug (`BaulitoPose`) | Exported Filename (`public/mascot/`) | Visual Characterization | Primary UI Trigger & Placement |
| :--- | :--- | :--- | :--- |
| `'spent-stop'` | `baulito-spent-stop.svg` | One hand held up flat in a "HALT / STOP" gesture; anxious eyes & `!` alert. | Triggered when `Safe-to-Spend < ₱0`, daily burn allowance is exceeded, or a wallet has `SHORTFALL_WARNING`. |
| `'saving-up'` | `baulito-saving-up.svg` | Sitting happily with arms wrapped around a stack of golden Peso (`₱`) coins. | Rendered beside `Cashflow Breakdown` when monthly net gain is positive (`+₱Net Gain`) or on `Cash in Vault` savings cards. |
| `'calculating'` | `baulito-calculating.svg` | Tapping chin thoughtfully with lightbulb and `+ - %` math symbols above lid. | Inside `NewEntryModal` when configuring `Loan` or `Installment` tenors and amortization schedules. |
| `'welcome'` | `baulito-welcome.svg` | Waving warmly while wearing a woven sling bag with celebratory sparkles. | **Front-Page Hero Greeting Banner** (`FrontPageHero.tsx` — `"Mabuhay, Alexis!"`). |
| `'celebrate-peso'` | `baulito-celebrate-peso.svg` | Lid wide open tossing a glowing golden `₱` Peso coin with confetti. | Shown when a `Loan` or `Installment` reaches `100%` paid off (`remainingBalancePhp === 0`). |
| `'alert-peek'` | `baulito-alert-peek.svg` | Lid cracked open with wide eyes peeking out and a terracotta `!` speech bubble. | Shown in `INVOICE AGING & TAX LEDGER` when an uncollected receivable or payable enters `Overdue` status. |
| `'vault-locked'` | `baulito-vault-locked.svg` | Proudly holding a heavy brass padlock overhead. | Header of `Local Vault • Backup` modal (`VaultBackupModal.tsx`) and storage persistence status badge. |
| `'idle-sleep'` | `baulito-idle-sleep.svg` | Resting peacefully with closed eyes and a floating `Zzz...` bubble. | Default illustration inside `<TactileEmptyState />` (`RECENT ACTIVITY`, `TOP CATEGORIES`, `TRANSFER FRICTION`, `LOAN HORIZON`). |
| `'standalone'` | `baulito-standalone.svg` | Classic upright waving Kaban chest without extra props. | App header/drawer branding, Onboarding intro, and `Settings / About Kaban` card. |

---

## 2. PRODUCTION REACT COMPONENT (`src/ui/primitives/KabanMascot.tsx`)

Create or update `src/ui/primitives/KabanMascot.tsx` so it maps all 9 Figma layer names directly to their `baulito-*.svg` files (with backward-compatible support for both `pose` and `variant` props):

```tsx
// src/ui/primitives/KabanMascot.tsx
import React from 'react';

export type BaulitoPose =
  | 'spent-stop'
  | 'saving-up'
  | 'calculating'
  | 'welcome'
  | 'celebrate-peso'
  | 'alert-peek'
  | 'vault-locked'
  | 'idle-sleep'
  | 'standalone';

// Alias for backward compatibility across existing components
export type MascotVariant = BaulitoPose;

export const BAULITO_ASSET_MAP: Record<
  BaulitoPose,
  { src: string; label: string }
> = {
  'spent-stop': {
    src: '/mascot/baulito-spent-stop.svg',
    label: 'Baulito signaling a spending stop or shortfall alert',
  },
  'saving-up': {
    src: '/mascot/baulito-saving-up.svg',
    label: 'Baulito hugging a stack of Philippine Peso coins',
  },
  'calculating': {
    src: '/mascot/baulito-calculating.svg',
    label: 'Baulito calculating installment amortization and fees',
  },
  'welcome': {
    src: '/mascot/baulito-welcome.svg',
    label: 'Baulito waving a warm welcome',
  },
  'celebrate-peso': {
    src: '/mascot/baulito-celebrate-peso.svg',
    label: 'Baulito celebrating with a golden Peso coin',
  },
  'alert-peek': {
    src: '/mascot/baulito-alert-peek.svg',
    label: 'Baulito peeking out with an overdue or shortfall alert',
  },
  'vault-locked': {
    src: '/mascot/baulito-vault-locked.svg',
    label: 'Baulito holding a brass padlock for local vault security',
  },
  'idle-sleep': {
    src: '/mascot/baulito-idle-sleep.svg',
    label: 'Baulito sleeping peacefully in an empty state',
  },
  'standalone': {
    src: '/mascot/baulito-standalone.svg',
    label: 'Bantay (Baulito) the Living Kaban Chest mascot',
  },
};

export interface KabanMascotProps {
  /** Primary pose slug matching the Figma layer name */
  pose?: BaulitoPose;
  /** Optional alias so existing `<KabanMascot variant="..." />` calls continue working */
  variant?: BaulitoPose;
  size?: number;
  className?: string;
  decorative?: boolean;
}

export const KabanMascot: React.FC<KabanMascotProps> = ({
  pose,
  variant,
  size = 72,
  className = '',
  decorative = true,
}) => {
  const activePose: BaulitoPose = pose ?? variant ?? 'standalone';
  const asset = BAULITO_ASSET_MAP[activePose];

  return (
    <img
      src={asset.src}
      alt={decorative ? '' : asset.label}
      aria-hidden={decorative ? 'true' : undefined}
      width={size}
      height={size}
      loading="eager"
      decoding="async"
      draggable={false}
      className={`select-none pointer-events-none object-contain shrink-0 ${className}`}
    />
  );
};
```

---

## 3. FRONT-PAGE HERO COMPONENT (`src/ui/components/FrontPageHero.tsx`)

Render a collapsible or top-level Neobrutalist welcome banner at the top of `LEDGER OVERVIEW` featuring `baulito-welcome.svg` (and automatically switching to `baulito-spent-stop.svg` if `safeToSpendPhp < 0`):

```tsx
// src/ui/components/FrontPageHero.tsx
import React from 'react';
import { KabanMascot } from '../primitives/KabanMascot';

interface FrontPageHeroProps {
  userName?: string;
  safeToSpendPhp: number;
  dailyAllowancePhp: number;
  onQuickAdd: () => void;
}

export function FrontPageHero({
  userName = 'Alexis',
  safeToSpendPhp,
  dailyAllowancePhp,
  onQuickAdd,
}: FrontPageHeroProps) {
  const isHealthy = safeToSpendPhp >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#18181B] bg-[#FAF6F0] p-5 shadow-[4px_4px_0px_#18181B]">
      {/* Subtle Yakan Diamond Weave Watermark */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -bottom-10 h-44 w-44 text-[#18181B] opacity-[0.03]"
      >
        <rect width="100%" height="100%" fill="url(#pattern-yakan-diamond)" />
      </svg>

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#18181B] bg-[#F4C95D] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#18181B]">
              {isHealthy ? '● Kaban Vault Ready' : '● Shortfall Alert'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B]">
            Mabuhay, {userName}!
          </h2>

          <p className="text-xs text-neutral-700 max-w-md leading-relaxed">
            {isHealthy ? (
              <>
                Baulito is guarding your ledger. You have{' '}
                <span className="font-mono font-bold text-[#15803D]">
                  ₱{safeToSpendPhp.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>{' '}
                safe to spend (
                <span className="font-mono font-semibold text-[#18181B]">
                  ₱{dailyAllowancePhp.toLocaleString('en-PH', { minimumFractionDigits: 2 })}/day
                </span>
                ) after upcoming commitments.
              </>
            ) : (
              <>
                Heads up! Your scheduled obligations exceed liquid cash by{' '}
                <span className="font-mono font-bold text-[#B91C1C]">
                  ₱{Math.abs(safeToSpendPhp).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
                . Review your wallet runways below.
              </>
            )}
          </p>
        </div>

        {/* Baulito Front-Page Mascot (Switches between welcome & spent-stop) */}
        <div className="shrink-0 pr-1">
          <KabanMascot
            pose={isHealthy ? 'welcome' : 'spent-stop'}
            size={96}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 4. WIRING ALL 9 `baulito-*.svg` POSES ACROSS THE APP

1. **`FrontPageHero.tsx`**:
   * Renders `<KabanMascot pose="welcome" size={96} />` when `safeToSpendPhp >= 0`, or `<KabanMascot pose="spent-stop" size={96} />` when `safeToSpendPhp < 0`.
2. **`TactileEmptyState.tsx`**:
   * Defaults to `<KabanMascot pose="idle-sleep" size={68} />` whenever `RECENT ACTIVITY`, `TOP CATEGORIES`, `TRANSFER & CASH-IN FRICTION`, or `INSTALLMENT & LOAN HORIZON` has `0` items.
3. **`VaultBackupModal.tsx`**:
   * Renders `<KabanMascot pose="vault-locked" size={72} />` in the modal header alongside the `navigator.storage.persist()` status badge and `.zip` export action.
4. **`WalletShortfallAlertCard.tsx` (`PER-WALLET LIQUIDITY & SHORTFALL RADAR`)**:
   * Renders `<KabanMascot pose="spent-stop" size={56} />` when any wallet has `status === 'SHORTFALL_WARNING'`.
5. **`InvoiceAgingCard.tsx` (`INVOICE AGING & TAX LEDGER`)**:
   * Renders `<KabanMascot pose="alert-peek" size={52} />` when `overdueCount > 0`.
6. **`NewEntryModal.tsx`**:
   * Inside the `Loan` and `Installment` schedule preview box, render `<KabanMascot pose="calculating" size={48} />` next to the live amortization calculation.
7. **`CashflowBreakdownCard.tsx` / `WalletsSection.tsx`**:
   * Render `<KabanMascot pose="saving-up" size={52} />` when monthly net cashflow is positive or inside the savings vault summary.
8. **`PayoffHorizonCard.tsx` (`INSTALLMENT & LOAN HORIZON`)**:
   * Render `<KabanMascot pose="celebrate-peso" size={60} />` when an obligation reaches `remainingBalancePhp === 0`.
9. **`AppHeader.tsx` / `SettingsModal.tsx`**:
   * Render `<KabanMascot pose="standalone" size={36} />` in the brand/about header.

---

## 5. VERIFICATION CHECKLIST

* [ ] Verify all 9 SVG files exist in `public/mascot/baulito-*.svg` and render with zero broken image links (`404`).
* [ ] Confirm Figma SVG exports have `<svg viewBox="...">` intact and no colliding internal `<defs>` IDs.
* [ ] Run `tsc --noEmit` and `vitest run` to ensure 100% type safety across all `<KabanMascot pose="..." />` call sites.