# AGY DIRECTIVE (PART 4): Integrating "Bantay" — The Living Kaban Chest Mascot

## 0. CONTEXT & UX RESTRAINT RULES
We are introducing **Bantay** (the Living Kaban Chest — an heirloom Filipino *baul* with a brass keyhole lockplate and Yakan diamond base trim) as a reactive inline SVG mascot for **Kaban**.
- **Zero External Image Dependencies**: Implement Bantay strictly as a pure inline React SVG component (`src/ui/primitives/KabanMascot.tsx`) so it scales crisply at any DPI, works 100% offline, and adds zero binary bloat to the bundle.
- **Anti-Clutter Placement Guardrail**:
  - **NEVER** float the mascot inside populated data tables, chart canvases, or numeric summary boxes.
  - **ONLY** render `<KabanMascot />` inside:
    1. `<TactileEmptyState />` (`variant="idle-sleep"`) when a list or card has `0` records.
    2. `VaultBackupModal.tsx` (`variant="vault-locked"`) to reinforce 100% local-first device storage.
    3. `WalletShortfallAlertCard.tsx` (`variant="alert-peek"`) when any wallet has `status === 'SHORTFALL_WARNING'`.
    4. `PayoffHorizonCard.tsx` (`variant="celebrate-peso"`) when an installment or loan reaches `100%` paid off.

---

## 1. CREATE `src/ui/primitives/KabanMascot.tsx`

Implement the 4-pose inline SVG component using Kaban's exact Neobrutalist stroke weight (`#18181B`), hard offset shadow, Ibaloi Terracotta (`#B85028`), Solihiya Gold (`#F4C95D`), and Cordillera Indigo (`#1D3557`):

```tsx
// src/ui/primitives/KabanMascot.tsx
import React from 'react';

export type MascotVariant =
  | 'idle-sleep'
  | 'vault-locked'
  | 'alert-peek'
  | 'celebrate-peso';

export interface KabanMascotProps {
  variant: MascotVariant;
  size?: number;
  className?: string;
}

export const KabanMascot: React.FC<KabanMascotProps> = ({
  variant,
  size = 72,
  className = '',
}) => {
  const isCelebrating = variant === 'celebrate-peso';
  const isAlert = variant === 'alert-peek';
  const isSleeping = variant === 'idle-sleep';
  const isLocked = variant === 'vault-locked';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Neobrutalist Hard Offset Shadow */}
      <rect x="24" y="42" width="76" height="58" rx="10" fill="#18181B" />

      {/* 1. Floating Status Badges (Zzz / ! / Peso Coin) */}
      {isSleeping && (
        <g>
          <circle cx="76" cy="30" r="2.5" fill="#FAF6F0" stroke="#18181B" strokeWidth="2" />
          <rect
            x="78"
            y="8"
            width="34"
            height="20"
            rx="6"
            fill="#FAF6F0"
            stroke="#18181B"
            strokeWidth="2.5"
          />
          <text
            x="84"
            y="22"
            fontSize="11"
            fontWeight="bold"
            fill="#18181B"
            fontFamily="JetBrains Mono, monospace"
          >
            Zzz
          </text>
        </g>
      )}

      {isAlert && (
        <g>
          <circle
            cx="96"
            cy="22"
            r="12"
            fill="#B85028"
            stroke="#18181B"
            strokeWidth="2.5"
          />
          <text
            x="92.5"
            y="27"
            fontSize="15"
            fontWeight="bold"
            fill="#FFFFFF"
            fontFamily="JetBrains Mono, monospace"
          >
            !
          </text>
        </g>
      )}

      {isCelebrating && (
        <g>
          {/* Confettiarks */}
          <rect x="30" y="14" width="5" height="5" fill="#B85028" transform="rotate(15 30 14)" />
          <rect x="86" y="16" width="5" height="5" fill="#1D3557" transform="rotate(-20 86 16)" />
          {/* Golden Peso Coin */}
          <circle
            cx="60"
            cy="20"
            r="13"
            fill="#F4C95D"
            stroke="#18181B"
            strokeWidth="2.5"
          />
          <text
            x="54.5"
            y="25"
            fontSize="14"
            fontWeight="bold"
            fill="#18181B"
            fontFamily="JetBrains Mono, monospace"
          >
            ₱
          </text>
        </g>
      )}

      {/* 2. Chest Lid (Tilts open on celebrate-peso or alert-peek) */}
      <g
        transform={
          isCelebrating
            ? 'rotate(-14 20 48)'
            : isAlert
            ? 'rotate(-5 20 48)'
            : undefined
        }
      >
        <path
          d="M20 48C20 38 30 32 60 32C90 32 100 38 100 48H20Z"
          fill="#B85028"
          stroke="#18181B"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Brass Lid Straps */}
        <rect
          x="30"
          y="33"
          width="8"
          height="15"
          fill="#F4C95D"
          stroke="#18181B"
          strokeWidth="2.5"
        />
        <rect
          x="82"
          y="33"
          width="8"
          height="15"
          fill="#F4C95D"
          stroke="#18181B"
          strokeWidth="2.5"
        />
      </g>

      {/* 3. Main Wooden Chest Body (Ibaloi Terracotta) */}
      <rect
        x="20"
        y="48"
        width="80"
        height="48"
        rx="8"
        fill="#B85028"
        stroke="#18181B"
        strokeWidth="3"
      />

      {/* Wood Plank Grain Lines */}
      <line
        x1="22"
        y1="64"
        x2="98"
        y2="64"
        stroke="#18181B"
        strokeWidth="2"
        strokeOpacity="0.35"
      />
      <line
        x1="22"
        y1="78"
        x2="98"
        y2="78"
        stroke="#18181B"
        strokeWidth="2"
        strokeOpacity="0.35"
      />

      {/* 4. Yakan Geometric Diamond Base Trim */}
      <rect
        x="20"
        y="82"
        width="80"
        height="14"
        rx="4"
        fill="#1D3557"
        stroke="#18181B"
        strokeWidth="2.5"
      />
      {[30, 45, 60, 75, 90].map((cx) => (
        <polygon
          key={cx}
          points={`${cx},84 ${cx + 5},89 ${cx},94 ${cx - 5},89`}
          fill="#F4C95D"
          stroke="#18181B"
          strokeWidth="1.5"
        />
      ))}

      {/* 5. Center Brass Keyhole Lockplate */}
      <rect
        x="52"
        y="42"
        width="16"
        height="24"
        rx="5"
        fill="#F4C95D"
        stroke="#18181B"
        strokeWidth="2.5"
      />
      <circle cx="60" cy="52" r="3" fill="#18181B" />
      <path d="M58.5 53L57.5 60H62.5L61.5 53H58.5Z" fill="#18181B" />

      {/* 6. Eyes & Facial Expression */}
      {isSleeping ? (
        <>
          <path
            d="M35 58C37 61 41 61 43 58"
            stroke="#18181B"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M77 58C79 61 83 61 85 58"
            stroke="#18181B"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle
            cx="39"
            cy="57"
            r="6.5"
            fill="#FFFFFF"
            stroke="#18181B"
            strokeWidth="2.5"
          />
          <circle cx={isAlert ? '40.5' : '39'} cy="57" r="3" fill="#18181B" />
          <circle
            cx="81"
            cy="57"
            r="6.5"
            fill="#FFFFFF"
            stroke="#18181B"
            strokeWidth="2.5"
          />
          <circle cx={isAlert ? '82.5' : '81'} cy="57" r="3" fill="#18181B" />
          {isAlert ? (
            <rect x="56" y="69" width="8" height="4" rx="2" fill="#18181B" />
          ) : (
            <path
              d="M55 68C57 72 63 72 65 68"
              stroke="#18181B"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
        </>
      )}

      {/* 7. Vault Locked Brass Padlock Badge */}
      {isLocked && (
        <g transform="translate(74, 58)">
          <path
            d="M6 10V6C6 2.5 16 2.5 16 6V10"
            stroke="#18181B"
            strokeWidth="3"
            fill="none"
          />
          <rect
            x="2"
            y="10"
            width="18"
            height="16"
            rx="4"
            fill="#F4C95D"
            stroke="#18181B"
            strokeWidth="2.5"
          />
          <circle cx="11" cy="18" r="2" fill="#18181B" />
        </g>
      )}

      {/* 8. Neobrutalist Feet */}
      <path
        d="M38 96V106H30"
        stroke="#18181B"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M82 96V106H90"
        stroke="#18181B"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
```

---

## 2. WIRE `<KabanMascot />` INTO THE 4 TARGET UI TOUCHPOINTS

### Touchpoint A: Upgrade `TactileEmptyState.tsx`
Embed `<KabanMascot variant={mascotVariant ?? 'idle-sleep'} size={64} />` inside `<TactileEmptyState />` right above the empty state message so `RECENT ACTIVITY`, `TOP CATEGORIES`, `TRANSFER & CASH-IN FRICTION`, and `INSTALLMENT & LOAN HORIZON` display the resting Kaban chest whenever `items.length === 0`:

```tsx
// Inside src/ui/primitives/TactileEmptyState.tsx
import { KabanMascot, MascotVariant } from './KabanMascot';

interface TactileEmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  mascotVariant?: MascotVariant;
}

export function TactileEmptyState({
  message,
  actionLabel,
  onAction,
  mascotVariant = 'idle-sleep',
}: TactileEmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-[#18181B]/25 bg-[#FAF6F0]/70 px-4 py-5 text-center">
      <div className="relative z-10 flex flex-col items-center gap-2">
        <KabanMascot variant={mascotVariant} size={64} />
        <p className="text-xs font-medium text-neutral-600 max-w-xs">{message}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-1 rounded-full border-2 border-[#18181B] bg-white px-3.5 py-1 font-mono text-[11px] font-bold text-[#18181B] shadow-[2px_2px_0px_#18181B] hover:bg-[#F4C95D] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
```

### Touchpoint B: `Local Vault • Backup` Modal (`VaultBackupModal.tsx`)
In the header of the Local Vault Backup modal, render `<KabanMascot variant="vault-locked" size={68} />` beside the storage persistence status (`navigator.storage.persist()`) and the 1-tap `.zip` export button.

### Touchpoint C: Shortfall Radar Banner (`WalletShortfallAlertCard.tsx`)
When `wallets.some(w => w.status === 'SHORTFALL_WARNING')` is `true`, render a top callout banner inside `PER-WALLET LIQUIDITY & SHORTFALL RADAR` featuring `<KabanMascot variant="alert-peek" size={48} />` next to `"Heads up! One or more wallets need a top-up before scheduled auto-debits."`

### Touchpoint D: Debt & Installment Payoff Celebration (`PayoffHorizonCard.tsx`)
When a user marks the final cutoff of a `Loan` or `Installment` as paid (`remainingBalancePhp === 0`), render `<KabanMascot variant="celebrate-peso" size={56} />` with the badge `"Fully Paid Off!"`.

---

## 3. VERIFICATION GATES
- [ ] Run `tsc --noEmit` and `vitest run` to confirm zero build or test errors.
- [ ] Verify `<KabanMascot />` has `aria-hidden="true"` and `pointer-events-none` so it never interferes with screen readers or button clicks.
- [ ] Confirm populated data cards (`Total Liquid Cash`, `Cashflow Breakdown`, `Committed Cashflow Waterfall`) remain 100% free of mascot overlays.