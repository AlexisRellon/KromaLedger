import type { PropsWithChildren } from "react";
import {
  PresentationProvider,
  type PresentationBoxProps,
  type PresentationButtonProps,
  type PresentationComponents,
  type PresentationIconProps,
  type PresentationInputProps,
  type PresentationModalProps,
  type PresentationTextProps,
} from "../../state/presentation/PresentationContext";
import { SmokedCard } from "../primitives";

import { createPortal } from "react-dom";

const directionClasses = { row: "flex-row", column: "flex-col" };
const gapClasses = { none: "gap-0", sm: "gap-2", md: "gap-4", lg: "gap-6" };
const paddingClasses = { none: "p-0", sm: "p-3", md: "p-4", lg: "p-6" };
const alignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  between: "items-center justify-between",
};

function WebBox({
  children,
  surface = "plain",
  direction = "column",
  align = "start",
  gap = "none",
  padding = "none",
}: PresentationBoxProps) {
  const isCardHeader = surface === "card" && direction === "row" && align === "between";
  const classes = isCardHeader
    ? "flex min-w-0 flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-4 sm:gap-6 p-5 sm:p-6"
    : `flex min-w-0 ${directionClasses[direction]} ${alignClasses[align]} ${gapClasses[gap]} ${paddingClasses[padding]} ${direction === "row" ? "flex-wrap" : ""}`;
  return surface === "card" ? (
    <SmokedCard className={classes}>{children}</SmokedCard>
  ) : (
    <div className={`${classes} ${surface === "muted" ? "rounded-2xl border-2 border-neutral-900 bg-[#FAF8F5] p-3 shadow-[2px_2px_0px_#18181B]" : ""}`}>
      {children}
    </div>
  );
}

function WebText({
  children,
  as = "body",
  size = "md",
  tone = "primary",
  weight = "normal",
  mono = false,
}: PresentationTextProps) {
  const Tag = as === "heading" ? "h2" : as === "body" ? "p" : "span";
  const sizeClass = { sm: "text-xs", md: "text-sm", lg: "text-lg", xl: "text-2xl" }[size];
  const toneClass = {
    primary: "text-neutral-900",
    muted: "text-neutral-600",
    accent: "text-[var(--theme-accent-text)]",
    inverse: "text-white",
    inherit: "text-inherit",
  }[tone];
  const weightClass = { normal: "font-normal", medium: "font-medium", bold: "font-bold" }[weight];
  return (
    <Tag
      className={`min-w-0 ${sizeClass} ${toneClass} ${weightClass} ${mono ? "font-mono" : ""} ${as === "heading" ? "font-display font-black tracking-tight" : ""} ${as === "caption" ? "whitespace-nowrap font-medium" : ""}`}
    >
      {children}
    </Tag>
  );
}

function WebButton({
  children,
  variant = "secondary",
  disabled,
  accessibilityLabel,
  onPress,
}: PresentationButtonProps) {
  return (
    <button
      type="button"
      aria-label={accessibilityLabel}
      disabled={disabled}
      onClick={onPress}
      className={
        variant === "primary"
          ? "flex shrink-0 w-full sm:w-auto justify-center items-center gap-2 rounded-xl border-2 border-neutral-900 bg-[var(--theme-primary)] px-5 py-2.5 text-xs font-bold text-[var(--theme-text-on-primary)] shadow-[2px_2px_0px_#18181B] neo-btn-interactive hover:bg-[var(--theme-primary-hover)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#18181B] disabled:opacity-50 [&_*]:text-[var(--theme-text-on-primary)]"
          : "flex shrink-0 w-full sm:w-auto justify-center items-center gap-2 rounded-xl border-2 border-neutral-900 bg-white px-5 py-2.5 text-xs font-bold text-neutral-900 shadow-[2px_2px_0px_#18181B] neo-btn-interactive hover:bg-[#FAF8F5] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#18181B] disabled:opacity-50"
      }
    >
      {children}
    </button>
  );
}

function WebIcon({ name, label }: PresentationIconProps) {
  return (
    <svg
      aria-label={label}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      className={name === "credit-card" ? "h-5 w-5 shrink-0 text-[var(--theme-accent-text)]" : "h-4 w-4 shrink-0 text-current"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "credit-card" ? (
        <>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20M6 15h2" />
        </>
      ) : (
        <path d="M12 5v14M5 12h14" />
      )}
    </svg>
  );
}

function WebInput({ value, accessibilityLabel, type = "text", onValueChange }: PresentationInputProps) {
  return (
    <input
      type={type}
      aria-label={accessibilityLabel}
      value={value}
      onChange={(event) => onValueChange(event.currentTarget.value)}
      className="rounded-xl border-2 border-neutral-900 bg-white px-3.5 py-2 text-sm font-medium text-neutral-900 shadow-[2px_2px_0px_#18181B] focus-visible:outline-2 focus-visible:outline-[#4A154B]"
    />
  );
}

function WebModal({ children, accessibilityLabel, onDismiss }: PresentationModalProps) {
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={accessibilityLabel}
      onKeyDown={(event) => {
        if (event.key === "Escape") onDismiss();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/45 p-3 sm:p-4 backdrop-blur-xs"
    >
      {children}
    </div>,
    document.body
  );
}

const components: PresentationComponents = {
  Box: WebBox,
  Text: WebText,
  Button: WebButton,
  Icon: WebIcon,
  Input: WebInput,
  Modal: WebModal,
};

export function WebPresentationProvider({ children }: PropsWithChildren) {
  return <PresentationProvider components={components}>{children}</PresentationProvider>;
}
