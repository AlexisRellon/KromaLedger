import { useEffect, type PropsWithChildren, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "./controls";

export interface ModalShellProps extends PropsWithChildren {
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  busy?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  footer?: ReactNode;
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function ModalShell({
  isOpen = true,
  onClose,
  title,
  subtitle,
  busy = false,
  maxWidth = "lg",
  className = "",
  footer,
  children,
}: ModalShellProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, busy, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] w-full ${maxWidthMap[maxWidth]} flex-col overflow-hidden rounded-3xl border-3 border-[var(--border-ink)] bg-[var(--bg-canvas)] shadow-[6px_6px_0px_var(--shadow-ink)] animate-entrance ${className}`}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b-2 border-[var(--border-ink)] bg-[var(--bg-card)] px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-display text-xl font-black tracking-tight text-[var(--text-primary)]">{title}</h2>
            {subtitle && (
              <div className="font-mono text-xs text-[var(--text-tertiary)] mt-0.5">
                {subtitle}
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="icon"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="h-8 w-8 !p-0 rounded-xl"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="shrink-0 border-t-2 border-[var(--border-ink)] bg-[var(--bg-card)] px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </section>
    </div>,
    document.body
  );
}
