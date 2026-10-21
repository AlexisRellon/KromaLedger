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

const directionClasses = { row: "flex-row", column: "flex-col" };
const gapClasses = { none: "gap-0", sm: "gap-2", md: "gap-4", lg: "gap-6" };
const paddingClasses = { none: "p-0", sm: "p-3", md: "p-4", lg: "p-6" };
const alignClasses = { start: "items-start", center: "items-center", end: "items-end", between: "items-center justify-between" };

function WebBox({ children, surface = "plain", direction = "column", align = "start", gap = "none", padding = "none" }: PresentationBoxProps) {
  const classes = `flex min-w-0 ${directionClasses[direction]} ${alignClasses[align]} ${gapClasses[gap]} ${paddingClasses[padding]}`;
  return surface === "card"
    ? <SmokedCard className={classes}>{children}</SmokedCard>
    : <div className={`${classes} ${surface === "muted" ? "rounded-2xl bg-black/20" : ""}`}>{children}</div>;
}

function WebText({ children, as = "body", size = "md", tone = "primary", weight = "normal", mono = false }: PresentationTextProps) {
  const Tag = as === "heading" ? "h2" : as === "body" ? "p" : "span";
  const sizeClass = { sm: "text-xs", md: "text-sm", lg: "text-lg", xl: "text-2xl" }[size];
  const toneClass = {
    primary: "text-white",
    muted: "text-neutral-400",
    accent: "text-[#D9F938]",
    inverse: "text-[#070806]",
    inherit: "text-inherit",
  }[tone];
  const weightClass = { normal: "font-normal", medium: "font-medium", bold: "font-bold" }[weight];
  return <Tag className={`min-w-0 ${sizeClass} ${toneClass} ${weightClass} ${mono ? "font-mono" : ""} ${as === "heading" ? "font-display" : ""}`}>{children}</Tag>;
}

function WebButton({ children, variant = "secondary", disabled, accessibilityLabel, onPress }: PresentationButtonProps) {
  return <button type="button" aria-label={accessibilityLabel} disabled={disabled} onClick={onPress}
    className={variant === "primary"
      ? "flex shrink-0 items-center gap-2 rounded-xl bg-[#D9F938] px-4 py-2.5 text-xs font-bold text-[#070806] [&_*]:text-[#070806] transition hover:brightness-110 active:scale-95 disabled:opacity-50"
      : "flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"}>
    {children}
  </button>;
}

function WebIcon({ name, label }: PresentationIconProps) {
  return <svg aria-label={label} aria-hidden={label ? undefined : true} role={label ? "img" : undefined}
    className={name === "credit-card" ? "h-5 w-5 shrink-0 text-[#D9F938]" : "h-4 w-4 shrink-0"}
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {name === "credit-card" ? <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h2" /></> : <path d="M12 5v14M5 12h14" />}
  </svg>;
}

function WebInput({ value, accessibilityLabel, type = "text", onValueChange }: PresentationInputProps) {
  return <input type={type} aria-label={accessibilityLabel} value={value} onChange={(event) => onValueChange(event.currentTarget.value)}
    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />;
}

function WebModal({ children, accessibilityLabel, onDismiss }: PresentationModalProps) {
  return <div role="dialog" aria-modal="true" aria-label={accessibilityLabel} onKeyDown={(event) => { if (event.key === "Escape") onDismiss(); }}
    className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">{children}</div>;
}

const components: PresentationComponents = { Box: WebBox, Text: WebText, Button: WebButton, Icon: WebIcon, Input: WebInput, Modal: WebModal };

export function WebPresentationProvider({ children }: PropsWithChildren) {
  return <PresentationProvider components={components}>{children}</PresentationProvider>;
}
