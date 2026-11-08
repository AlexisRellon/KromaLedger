import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button, FormField, Input, ModalShell, SmokedCard, Toggle, getAvatarColors, KabanMascot } from "../primitives";
import { WalletFormModal } from "../components/WalletFormModal";
import { AppPermissionsSection } from "../components/AppPermissionsSection";
import { WALLET_TYPES, WalletTypeIcon, CashIcon } from "../components/WalletTypeIcon";
import {
  useClearAllData,
  useDeleteWallet,
  useProfile,
  useResetToDemo,
  useSaveWallet,
  useWallets,
  useTransactionCount,
  useSubscriptions,
  useInvoices,
} from "../../state/queries";
import { useUIStore } from "../../state/useUIStore";
import { APP_THEMES, type ThemeMode } from "../../state/theme";
import { formatCurrency, type Wallet } from "../../core/models";
import { SettingsSkeleton } from "../components/skeletons";

export function SettingsScreen({
  onOpenBackup,
  onReplayTour,
  onDataReset,
  isLoading = false,
}: {
  onOpenBackup: () => void;
  onReplayTour?: () => void;
  onDataReset?: () => void;
  isLoading?: boolean;
}) {
  const profileQuery = useProfile();
  const walletsQuery = useWallets();
  const txCountQuery = useTransactionCount();
  const subsQuery = useSubscriptions();
  const invoicesQuery = useInvoices();

  const openEditProfile = useUIStore((s) => s.openEditProfile);
  const themeMode = useUIStore((s) => s.themeMode);
  const appTheme = useUIStore((s) => s.appTheme);
  const highContrast = useUIStore((s) => s.highContrast);
  const reducedMotion = useUIStore((s) => s.reducedMotion);
  const largeText = useUIStore((s) => s.largeText);

  const setThemeMode = useUIStore((s) => s.setThemeMode);
  const setAppTheme = useUIStore((s) => s.setAppTheme);
  const setHighContrast = useUIStore((s) => s.setHighContrast);
  const setReducedMotion = useUIStore((s) => s.setReducedMotion);
  const setLargeText = useUIStore((s) => s.setLargeText);

  const saveWalletMutation = useSaveWallet();
  const deleteWalletMutation = useDeleteWallet();
  const clearAllMutation = useClearAllData();
  const resetDemoMutation = useResetToDemo();

  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [dangerModalOpen, setDangerModalOpen] = useState(false);
  const [dangerMode, setDangerMode] = useState<"CLEAR" | "RESET_DEMO">("CLEAR");
  const [confirmInput, setConfirmInput] = useState("");
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [noticeClosing, setNoticeClosing] = useState(false);

  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeExitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
      if (noticeExitTimeoutRef.current) clearTimeout(noticeExitTimeoutRef.current);
    };
  }, []);

  const showNotice = (msg: string) => {
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    if (noticeExitTimeoutRef.current) clearTimeout(noticeExitTimeoutRef.current);
    setNoticeClosing(false);
    setStatusNotice(msg);
    noticeTimeoutRef.current = setTimeout(() => {
      setNoticeClosing(true);
      noticeExitTimeoutRef.current = setTimeout(() => {
        setStatusNotice(null);
        setNoticeClosing(false);
        noticeTimeoutRef.current = null;
        noticeExitTimeoutRef.current = null;
      }, 200);
    }, 2800);
  };

  const renderNoticeToast = () => {
    if (!statusNotice) return null;
    const toastElement = (
      <div
        role="status"
        aria-live="polite"
        className={`fixed top-6 left-1/2 z-[9999] pointer-events-auto rounded-full border-2 border-[#18181B] bg-[var(--theme-subtle)] px-6 py-2.5 text-xs font-bold text-[var(--theme-subtle-text)] shadow-[3px_3px_0px_#18181B] ${
          noticeClosing ? "animate-grow-out" : "animate-grow-in"
        }`}
      >
        {statusNotice}
      </div>
    );

    if (typeof document !== "undefined") {
      return createPortal(toastElement, document.body);
    }
    return toastElement;
  };

  if (isLoading || (profileQuery.isLoading && !profileQuery.data)) {
    return <SettingsSkeleton />;
  }

  const profile = profileQuery.data ?? {
    id: "profile" as const,
    name: "Kaban Operator",
    handle: "operator",
    email: "operator@kaban.local",
    initials: "KO",
    themeColor: "#4A154B",
    defaultCurrency: "PHP",
    bio: "Local-first financial vault",
  };

  const wallets = walletsQuery.data ?? [];
  const totalBalanceMinor = wallets.reduce((sum, w) => sum + w.balanceMinor, 0);

  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className="space-y-8 pb-16">
      {renderNoticeToast()}

      {onReplayTour && (
        <SmokedCard>
          <div className="flex flex-wrap items-center gap-4">
            <KabanMascot pose="welcome" size={56} />
            <div className="flex-1"><h2 className="font-display text-lg font-black">Meet Baulito</h2><p className="text-sm text-neutral-600">Take another look at the essentials.</p></div>
            <Button type="button" variant="secondary" onClick={onReplayTour}>Replay tour</Button>
          </div>
        </SmokedCard>
      )}

      {/* 1. Local Profile Section */}
      <SmokedCard className="relative overflow-hidden">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-[var(--border-ink)] text-xl font-black shadow-[3px_3px_0px_var(--shadow-ink)]"
              style={getAvatarColors(profile.themeColor || "#4A154B")}
            >
              {profile.initials || "KO"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-black text-[var(--text-primary)]">{profile.name}</h2>
                <span className="rounded-md border border-[var(--border-ink)] bg-[var(--badge-brand-bg)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--badge-brand-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                  @{profile.handle}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">{profile.bio || "Local-first operator"}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--text-tertiary)]">
                <span>Default Currency: <strong className="text-[var(--text-primary)] font-bold">{profile.defaultCurrency}</strong></span>
                <span aria-hidden="true" className="text-[var(--text-muted)]">•</span>
                <span className="rounded-xs bg-[var(--status-success-bg)] px-1.5 py-0.5 text-[var(--status-success-text)] border border-[var(--border-ink)] font-bold">100% On-Device Vault</span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={openEditProfile}
            className="self-start sm:self-center"
          >
            Edit Profile
          </Button>
        </div>

        {/* Ledger Summary Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t-2 border-[var(--border-divider)] pt-4 sm:grid-cols-4">
          <div className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Accounts</span>
            <p className="mt-1 text-xl font-black text-[var(--text-primary)] font-mono">{wallets.length}</p>
          </div>
          <div className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Entries</span>
            <p className="mt-1 text-xl font-black text-[var(--text-primary)] font-mono">{txCountQuery.data ?? 0}</p>
          </div>
          <div className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Subscriptions</span>
            <p className="mt-1 text-xl font-black text-[var(--text-primary)] font-mono">{subsQuery.data?.length ?? 0}</p>
          </div>
          <div className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Invoices</span>
            <p className="mt-1 text-xl font-black text-[var(--text-primary)] font-mono">{invoicesQuery.data?.length ?? 0}</p>
          </div>
        </div>
      </SmokedCard>

      {/* 2. Accessibility & Appearance Section */}
      <SmokedCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[var(--border-ink)] bg-[var(--theme-subtle)] text-[var(--theme-subtle-text)] shadow-[1px_1px_0px_var(--shadow-ink)]"
                aria-hidden="true"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-lg font-black text-[var(--text-primary)]">Accessibility & Appearance</h3>
                <p className="text-xs font-medium text-[var(--text-tertiary)] mt-0.5">
                  Configure visual contrast, light/dark mode toggle, and tactile palette themes.
                </p>
              </div>
            </div>
          </div>
          <span className="self-start sm:self-auto rounded-md border border-[var(--border-ink)] bg-[var(--theme-subtle)] px-2.5 py-1 text-xs font-mono font-bold text-[var(--theme-subtle-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
            {themeMode === "system" ? "System Sync" : themeMode === "dark" ? "Dark Theme" : "Light Theme"}
          </span>
        </div>

        {/* Subsection A: Light / Dark Mode Toggle */}
        <div className="mt-6 border-t-2 border-[var(--border-divider)] pt-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-black text-[var(--text-primary)]">Light / Dark Mode</h4>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mt-0.5">
                Toggle between daytime paper canvas, high-contrast dark room, or system preference.
              </p>
            </div>
            {/* 3-segment toggle */}
            <div
              role="radiogroup"
              aria-label="Light or dark theme mode"
              className="inline-flex items-center rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] p-1 shadow-[2px_2px_0px_var(--shadow-ink)] gap-1 self-start sm:self-auto"
            >
              {[
                {
                  id: "light" as ThemeMode,
                  label: "Light",
                  icon: (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                    </svg>
                  ),
                },
                {
                  id: "dark" as ThemeMode,
                  label: "Dark",
                  icon: (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                    </svg>
                  ),
                },
                {
                  id: "system" as ThemeMode,
                  label: "System",
                  icon: (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" />
                    </svg>
                  ),
                },
              ].map((opt) => {
                const isSelected = themeMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setThemeMode(opt.id);
                      showNotice(`Theme mode set to ${opt.label}.`);
                    }}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "border-2 border-[var(--border-ink)] bg-[var(--theme-subtle)] text-[var(--theme-subtle-text)] shadow-[1px_1px_0px_var(--shadow-ink)]"
                        : "border-2 border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Subsection B: App Theme Palette */}
        <div className="mt-6 border-t-2 border-[var(--border-divider)] pt-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-black text-[var(--text-primary)]">App Theme Palette</h4>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mt-0.5">
                Accent hue applied to primary buttons, interactive cards, and status badges.
              </p>
            </div>
            <span className="self-start sm:self-auto text-xs font-mono font-bold text-[var(--text-secondary)]">
              Active: <strong className="text-[var(--text-primary)]">{APP_THEMES.find((t) => t.id === appTheme)?.name}</strong>
            </span>
          </div>

          <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {APP_THEMES.map((theme) => {
              const isSelected = appTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    setAppTheme(theme.id);
                    showNotice(`App theme updated to ${theme.name}.`);
                  }}
                  className={`group relative flex items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-[var(--border-ink)] bg-[var(--theme-subtle)] text-[var(--theme-subtle-text)] shadow-[3px_3px_0px_var(--shadow-ink)] ring-2 ring-[var(--theme-primary)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-subtle)] shadow-[1px_1px_0px_var(--shadow-ink)] hover:border-[var(--border-ink)] hover:bg-[var(--bg-card)] hover:shadow-[2px_2px_0px_var(--shadow-ink)]"
                  }`}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--border-ink)] shadow-[1px_1px_0px_var(--shadow-ink)]"
                    style={{ backgroundColor: isDark ? theme.darkPrimaryHex : theme.hex }}
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} style={{ color: isDark ? theme.darkTextOnPrimary : theme.textOnPrimary }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-[var(--text-primary)]">{theme.name}</p>
                    <p className="truncate text-[10px] font-medium text-[var(--text-tertiary)]">{theme.tagline}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subsection C: Accessibility Preferences */}
        <div className="mt-6 border-t-2 border-[var(--border-divider)] pt-5">
          <h4 className="text-sm font-black text-[var(--text-primary)]">Accessibility Preferences</h4>
          <p className="text-xs font-medium text-[var(--text-tertiary)] mt-0.5">
            Contrast adjustments, reduced motion support, and font scaling options.
          </p>

          <div className="mt-4 divide-y divide-[var(--border-divider)]">
            {/* Toggle 1: High Contrast */}
            <div className="flex items-center justify-between py-3">
              <div className="pr-4">
                <label htmlFor="toggle-high-contrast" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer">
                  High Contrast Borders
                </label>
                <p className="text-[11px] font-medium text-[var(--text-tertiary)]">
                  Deepen ink borders and enhance text contrast for high-glare environments.
                </p>
              </div>
              <Toggle
                id="toggle-high-contrast"
                checked={highContrast}
                onChange={(checked) => {
                  setHighContrast(checked);
                  showNotice(checked ? "High contrast enabled." : "High contrast disabled.");
                }}
                label="High contrast borders"
              />
            </div>

            {/* Toggle 2: Reduced Motion */}
            <div className="flex items-center justify-between py-3">
              <div className="pr-4">
                <label htmlFor="toggle-reduced-motion" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer">
                  Reduced Motion
                </label>
                <p className="text-[11px] font-medium text-[var(--text-tertiary)]">
                  Disable entrance animations, modal slide-ups, and skeleton shimmers.
                </p>
              </div>
              <Toggle
                id="toggle-reduced-motion"
                checked={reducedMotion}
                onChange={(checked) => {
                  setReducedMotion(checked);
                  showNotice(checked ? "Reduced motion enabled." : "Motion restored.");
                }}
                label="Reduced motion"
              />
            </div>

            {/* Toggle 3: Large Text */}
            <div className="flex items-center justify-between py-3">
              <div className="pr-4">
                <label htmlFor="toggle-large-text" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer">
                  Enhanced Font Scale
                </label>
                <p className="text-[11px] font-medium text-[var(--text-tertiary)]">
                  Scale typography up for improved reading comfort and larger touch ergonomics.
                </p>
              </div>
              <Toggle
                id="toggle-large-text"
                checked={largeText}
                onChange={(checked) => {
                  setLargeText(checked);
                  showNotice(checked ? "Enhanced font scale enabled." : "Standard font scale restored.");
                }}
                label="Enhanced font scale"
              />
            </div>
          </div>
        </div>
      </SmokedCard>

      {/* 3. Wallets Management Section */}
      <SmokedCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-black text-neutral-900">Accounts & Wallets</h3>
              <span className="rounded-md border border-neutral-900 bg-[#EDE9FE] px-2 py-0.5 text-xs font-mono font-bold text-neutral-900 shadow-[1px_1px_0px_#18181B]">
                {wallets.length} active
              </span>
            </div>
            <p className="text-xs font-medium text-neutral-600 mt-0.5">
              Manage cash, bank accounts, e-wallets, and vaults strictly on this device.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingWallet(null);
                setWalletModalOpen(true);
              }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Add Account</span>
            </Button>
          </div>
        </div>

        {/* Total Wallet Balance */}
        {wallets.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t-2 border-neutral-200 pt-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Total Liquid Balance Across Accounts</span>
            <span className="font-mono text-base font-black text-[#4A154B]">
              {formatCurrency(totalBalanceMinor, profile.defaultCurrency)}
            </span>
          </div>
        )}

        {/* Wallets Grid */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet) => {
            const fallbackType = WALLET_TYPES[0] ?? { type: "CASH" as const, label: "Physical Cash", Icon: CashIcon };
            const typeInfo = WALLET_TYPES.find((t) => t.type === wallet.type) ?? fallbackType;
            return (
              <div
                key={wallet.id}
                className="group relative flex flex-col justify-between rounded-2xl border-2 border-neutral-900 bg-[#FAF8F5] p-4 shadow-[3px_3px_0px_#18181B] transition hover:bg-white"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-900 bg-white text-neutral-900 shadow-[1px_1px_0px_#18181B]"
                      aria-label={typeInfo.label}
                    >
                      <WalletTypeIcon type={wallet.type} className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      {wallet.isDefault && (
                        <span className="rounded-md border border-neutral-900 bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider text-[#92400E] shadow-[1px_1px_0px_#18181B]">
                          DEFAULT
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="mt-2.5 font-display text-sm font-black text-neutral-900">
                    {wallet.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
                    <span>{wallet.institution || typeInfo.label}</span>
                    {wallet.accountNumber && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-neutral-700">{wallet.accountNumber}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t-2 border-neutral-200 pt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wider text-neutral-600 font-mono font-bold">Balance</span>
                    <span className="font-mono text-sm font-black text-neutral-900">
                      {formatCurrency(wallet.balanceMinor, wallet.currency)}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-end gap-2 text-xs">
                    {!wallet.isDefault && (
                      <button
                        onClick={async () => {
                          await saveWalletMutation.mutateAsync({ ...wallet, isDefault: true });
                          showNotice(`Set ${wallet.name} as default wallet.`);
                        }}
                        className="text-xs font-bold text-neutral-600 hover:text-neutral-900 underline cursor-pointer"
                      >
                        Make Default
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingWallet(wallet);
                        setWalletModalOpen(true);
                      }}
                      className="text-xs font-bold text-[#4A154B] hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Delete wallet "${wallet.name}"? Transactions linked to this wallet will be unlinked.`)) {
                          await deleteWalletMutation.mutateAsync(wallet.id);
                          showNotice(`Deleted wallet ${wallet.name}.`);
                        }
                      }}
                      className="text-xs font-bold text-[#BE123C] hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {wallets.length === 0 && (
            <div className="col-span-full border-t-2 border-neutral-200 pt-6 pb-2 text-center">
              <p className="text-sm font-medium text-neutral-600">No accounts created yet.</p>
              <button
                onClick={() => {
                  setEditingWallet(null);
                  setWalletModalOpen(true);
                }}
                className="mt-2 text-xs font-bold text-[#4A154B] underline cursor-pointer"
              >
                + Create your first account
              </button>
            </div>
          )}
        </div>
      </SmokedCard>

      {/* 4. App Permissions Section */}
      <AppPermissionsSection onShowNotice={showNotice} />

      {/* 5. Storage & Backup Card */}
      <SmokedCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <KabanMascot pose="standalone" size={56} />
          <div>
            <h3 className="font-display text-lg font-black text-neutral-900">Local Vault & Backups</h3>
            <p className="text-xs font-medium text-neutral-600 mt-0.5">
              Your financial data operates with 100% on-device IndexedDB storage.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onOpenBackup}
          >
            <svg className="h-4 w-4 text-[#4A154B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <span>Open Vault Backup Modal</span>
          </Button>
        </div>
      </SmokedCard>

      {/* 6. Danger Zone */}
      <section
        aria-label="Danger Zone"
        className="rounded-3xl border-3 border-neutral-900 bg-[#FFE4E6] p-6 shadow-[5px_5px_0px_#18181B]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-neutral-900 bg-white text-[#BE123C] shadow-[2px_2px_0px_#18181B]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg font-black text-neutral-900">Danger Zone</h3>
            <p className="text-xs font-semibold text-neutral-700">
              Irreversible actions that affect your on-device ledger data.
            </p>
          </div>
        </div>

        <div className="mt-6 divide-y-2 divide-neutral-900/10 border-t-2 border-neutral-900/20">
          {/* Action 1: Reset to demo */}
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-black text-neutral-900">Reset to Demonstration Seed</h4>
              <p className="text-xs font-medium text-neutral-700">
                Replace current data with fresh demo entries, sample subscriptions, and demo accounts.
              </p>
            </div>
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={() => {
                setDangerMode("RESET_DEMO");
                setConfirmInput("");
                setDangerModalOpen(true);
              }}
              className="shrink-0 !bg-[#FEF3C7] !text-[#92400E]"
            >
              Reset to Demo Data
            </Button>
          </div>

          {/* Action 2: Wipe all data */}
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-black text-[#9F1239]">Delete All Data (Factory Wipe)</h4>
              <p className="text-xs font-medium text-neutral-700">
                Permanently erase all local transactions, subscriptions, invoices, attachments, and accounts.
              </p>
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                setDangerMode("CLEAR");
                setConfirmInput("");
                setDangerModalOpen(true);
              }}
              className="shrink-0"
            >
              Delete All Data
            </Button>
          </div>
        </div>
      </section>

      {/* Add / Edit Wallet Modal */}
      {walletModalOpen && (
        <WalletFormModal
          wallet={editingWallet}
          defaultCurrency={profile.defaultCurrency}
          onClose={() => {
            setWalletModalOpen(false);
            setEditingWallet(null);
          }}
          onSave={async (saved) => {
            await saveWalletMutation.mutateAsync(saved);
            setWalletModalOpen(false);
            setEditingWallet(null);
            showNotice(`Account "${saved.name}" saved.`);
          }}
        />
      )}

      {/* Danger Zone Confirmation Modal */}
      {dangerModalOpen && (
        <ModalShell
          isOpen={true}
          onClose={() => setDangerModalOpen(false)}
          title={dangerMode === "CLEAR" ? "Erase All Ledger Data?" : "Reset to Demo Seed?"}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDangerModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={dangerMode === "CLEAR" ? "danger" : "subtle"}
                size="sm"
                disabled={dangerMode === "CLEAR" && confirmInput !== "DELETE"}
                onClick={async () => {
                  if (dangerMode === "CLEAR") {
                    await clearAllMutation.mutateAsync();
                  } else {
                    await resetDemoMutation.mutateAsync();
                  }
                  setDangerModalOpen(false);
                  onDataReset?.();
                }}
              >
                {dangerMode === "CLEAR" ? "Permanently Erase" : "Reset Data"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm font-medium leading-relaxed text-neutral-800">
              {dangerMode === "CLEAR"
                ? "This action will permanently purge all transactions, commitments, invoices, uploaded receipts, and custom accounts stored locally on this browser. You cannot undo this without a previous vault backup."
                : "This will discard current custom entries and restore the default sample dataset with sample transactions and subscriptions."}
            </p>

            {dangerMode === "CLEAR" && (
              <FormField label="Confirmation" hint="Type DELETE to confirm:">
                {({ id }) => (
                  <Input
                    id={id}
                    type="text"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder="DELETE"
                    className="font-mono font-bold"
                  />
                )}
              </FormField>
            )}
          </div>
        </ModalShell>
      )}
    </div>
  );
}
