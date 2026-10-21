import type { FC, SVGProps } from "react";
import type { WalletType } from "../../core/models";

export function CashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

export function BankIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.5M4.5 21V10.5M2.25 21h19.5" />
    </svg>
  );
}

export function EWalletIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} {...props}>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 18h2m-1.5-14h1" />
    </svg>
  );
}

export function CryptoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  );
}

export function CreditCardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} {...props}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 10h19M6.5 14.5h4" />
    </svg>
  );
}

export function OtherVaultIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
    </svg>
  );
}

export function WalletTypeIcon({
  type,
  className = "h-5 w-5",
}: {
  type: WalletType;
  className?: string;
}) {
  switch (type) {
    case "CASH":
      return <CashIcon className={className} />;
    case "BANK":
      return <BankIcon className={className} />;
    case "E_WALLET":
      return <EWalletIcon className={className} />;
    case "CRYPTO":
      return <CryptoIcon className={className} />;
    case "CREDIT":
      return <CreditCardIcon className={className} />;
    case "OTHER":
    default:
      return <OtherVaultIcon className={className} />;
  }
}

export interface WalletTypeOption {
  type: WalletType;
  label: string;
  Icon: FC<SVGProps<SVGSVGElement>>;
}

export const WALLET_TYPES: WalletTypeOption[] = [
  { type: "CASH", label: "Physical Cash", Icon: CashIcon },
  { type: "BANK", label: "Bank Account", Icon: BankIcon },
  { type: "E_WALLET", label: "E-Wallet", Icon: EWalletIcon },
  { type: "CRYPTO", label: "Crypto / Web3", Icon: CryptoIcon },
  { type: "CREDIT", label: "Credit Card", Icon: CreditCardIcon },
  { type: "OTHER", label: "Other Vault", Icon: OtherVaultIcon },
];
