import type { ComponentPropsWithRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "subtle" | "danger" | "ghost" | "icon";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  busy?: boolean;
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-[var(--theme-primary)] text-[var(--theme-text-on-primary)] hover:brightness-95",
  secondary: "bg-[var(--theme-subtle)] text-[var(--theme-subtle-text)] hover:brightness-95",
  subtle: "bg-[var(--theme-subtle)] text-[var(--theme-subtle-text)] hover:brightness-95",
  danger: "bg-[var(--status-danger-text)] text-[var(--text-on-accent)] hover:brightness-95",
  ghost: "bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-muted)] shadow-none",
  icon: "bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] p-2",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-xl",
  md: "px-5 py-3 text-sm rounded-xl",
  lg: "px-6 py-4 text-base rounded-2xl",
};

export function Button({
  variant = "primary",
  size = "md",
  busy = false,
  disabled,
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  const sizeClass = variant === "icon" ? "rounded-xl p-2" : sizeStyles[size];
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || props["aria-busy"]}
      className={`inline-flex items-center justify-center gap-2 border-2 border-[var(--border-ink)] font-bold shadow-[3px_3px_0px_var(--shadow-ink)] neo-btn-interactive focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--theme-primary)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none cursor-pointer ${buttonVariants[variant]} ${sizeClass} ${className}`}
    />
  );
}

const controlClasses =
  "w-full rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] shadow-[2px_2px_0px_var(--shadow-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-primary)] aria-invalid:border-[var(--status-danger-text)] disabled:cursor-not-allowed disabled:bg-[var(--bg-muted)] disabled:opacity-60";

export type InputProps = ComponentPropsWithRef<"input"> & { hasError?: boolean };
export type SelectProps = ComponentPropsWithRef<"select"> & { hasError?: boolean };
export type TextareaProps = ComponentPropsWithRef<"textarea"> & { hasError?: boolean };

export function Input({ className = "", hasError, ...props }: InputProps) {
  return (
    <input
      {...props}
      aria-invalid={hasError ? true : props["aria-invalid"]}
      className={`${controlClasses} ${hasError ? "!border-[var(--status-danger-text)]" : ""} ${className}`}
    />
  );
}

export function Select({ className = "", hasError, ...props }: SelectProps) {
  return (
    <select
      {...props}
      aria-invalid={hasError ? true : props["aria-invalid"]}
      className={`${controlClasses} ${hasError ? "!border-[var(--status-danger-text)]" : ""} ${className}`}
    />
  );
}

export function Textarea({ className = "", hasError, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      aria-invalid={hasError ? true : props["aria-invalid"]}
      className={`${controlClasses} ${hasError ? "!border-[var(--status-danger-text)]" : ""} ${className}`}
    />
  );
}

export interface ToggleProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

export function Toggle({
  id,
  checked,
  onChange,
  label,
  disabled = false,
  className = "",
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || label}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-[var(--border-ink)] transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-primary)] disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? "bg-[var(--theme-primary)] shadow-[2px_2px_0px_var(--shadow-ink)]"
          : "bg-[var(--bg-muted)] shadow-[1px_1px_0px_var(--shadow-ink)]"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full border-2 border-[var(--border-ink)] bg-[var(--bg-card)] shadow-sm transition duration-200 ease-in-out mt-[1px] ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
