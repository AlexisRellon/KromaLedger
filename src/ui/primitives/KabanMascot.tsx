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
    label: 'Baulito the Living Kaban Chest mascot',
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
