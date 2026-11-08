import { useEffect, useRef, useState } from "react";
import { getBrowserNotificationPermission, requestBrowserNotificationPermission } from "../../adapters/notifications/notificationEngine";
import { parseStartingBalance } from "../../state/onboarding";
import { userProfileSchema, walletSchema, type UserProfile, type WalletType } from "../../core/models";
import { useProfile, useSaveProfile, useSaveWallet } from "../../state/queries";
import { useStorage } from "../../state/StorageContext";
import { KabanMascot, type BaulitoPose } from "../primitives/KabanMascot";
import { OnboardingPractice } from "./OnboardingPractice";

const TOTAL_STEPS = 9;

const practice = {
  EXPENSE: { label: "Try an expense", guidance: "For example, enter 100 and Coffee, then choose a sample wallet." },
  TRANSFER: { label: "Try a transfer", guidance: "For example, enter 100 and choose two different sample wallets." },
  SUBSCRIPTION: { label: "Try a subscription", guidance: "For example, enter 100 and Music, then choose a billing cycle and date." },
  INVOICE: { label: "Try an invoice", guidance: "Enter a title and amount, then choose a due date and direction." },
} as const;
type PracticeMode = keyof typeof practice;

const walkthrough: { title: string; body: string; pose: BaulitoPose }[] = [
  { title: "A place for every peso.", body: "Wallets bring your cash, banks, and e-wallets together. Add one to see where your money lives.", pose: "saving-up" },
  { title: "Make every entry count.", body: "Tap the + button, choose an expense or income, enter the details, and save it to a wallet.", pose: "calculating" },
  { title: "Keep what's ahead in view.", body: "See your activity on Home and find upcoming bills and subscriptions under Pending. Practice here uses sample data that won't be saved.", pose: "welcome" },
];
const inputClass = "mt-2 w-full rounded-xl border-2 border-[#352437] bg-white px-4 py-3 text-base text-[#241927] outline-none focus-visible:ring-4 focus-visible:ring-[#d8b5d8]";
const buttonClass = "w-full rounded-xl border-2 border-[#241927] bg-[var(--theme-primary)] px-5 py-3.5 text-sm font-bold text-[var(--theme-text-on-primary)] shadow-[3px_3px_0px_#241927] hover:bg-[var(--theme-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--theme-primary)] disabled:opacity-60";

export function BaulitoTour({ onClose, initialStep = 0 }: { onClose: () => void; initialStep?: number }) {
  const [step, setStep] = useState(initialStep);
  const [walletSaved, setWalletSaved] = useState(false);
  const [permission, setPermission] = useState(getBrowserNotificationPermission);
  const [requesting, setRequesting] = useState(false);
  const [showNotificationHelp, setShowNotificationHelp] = useState(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode | null>(null);
  const [practiceSaved, setPracticeSaved] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [backupError, setBackupError] = useState("");
  const [backupSuccess, setBackupSuccess] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const profile = useProfile();
  const saveProfile = useSaveProfile();
  const saveWallet = useSaveWallet();
  const { vault } = useStorage();

  useEffect(() => { heading.current?.focus(); }, [step]);
  useEffect(() => {
    if (step !== 7) return;
    const refreshPermission = () => setPermission(getBrowserNotificationPermission());
    refreshPermission();
    window.addEventListener("focus", refreshPermission);
    return () => window.removeEventListener("focus", refreshPermission);
  }, [step]);
  const next = () => { setPracticeMode(null); setPracticeSaved(false); setStep((value) => Math.min(value + 1, TOTAL_STEPS - 1)); };
  const previous = () => { setPracticeMode(null); setPracticeSaved(false); setStep((value) => Math.max(value - 1, 0)); };
  const current = step >= 2 && step <= 4 ? walkthrough[step - 2] : null;
  const title =
    step === 0
      ? "Your money,\nwith a little more clarity."
      : step === 1
        ? "Have a backup\nto import?"
        : current?.title ??
          (step === 5
            ? "Make it yours."
            : step === 6
              ? "Add your first wallet."
              : step === 7
                ? "A little heads-up?"
                : "You're all set.");
  const pose: BaulitoPose =
    step === 0
      ? "welcome"
      : step === 1
        ? "vault-locked"
        : current?.pose ??
          (step === 6
            ? "saving-up"
            : step === 7
              ? "alert-peek"
              : step === 8
                ? "celebrate-peso"
                : "standalone");
  const openPractice = (mode: PracticeMode) => {
    setPracticeSaved(false);
    setPracticeMode(mode);
  };

  return (
    <main className="min-h-[100dvh] bg-[#FAF8F5] text-[#241927]">
      <div className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-10">
        <header className="flex items-center justify-between gap-4">
          <img src="/kaban-horizontal-color.svg" alt="Kaban" className="h-9 w-auto max-w-36 object-contain" />
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-2 text-sm font-bold text-[#5f4860] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#4A154B]">Skip setup</button>
        </header>
        <div
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of ${TOTAL_STEPS}`}
          className="mt-3 flex w-full gap-1.5 sm:gap-2"
        >
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <div
              key={index}
              className="h-2 flex-1 overflow-hidden rounded-full bg-[#E6DED8]"
            >
              <div
                className="onboarding-progress h-full w-full rounded-full bg-[var(--theme-primary)]"
                style={{
                  transform: `scaleX(${index <= step ? 1 : 0})`,
                  transformOrigin: "left",
                }}
              />
            </div>
          ))}
        </div>
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center py-8">
          <div className="grid items-center gap-7 md:grid-cols-[1fr_1fr] md:gap-16">
            <div className="relative flex min-h-52 items-center justify-center py-5 sm:min-h-80">
              <div aria-hidden="true" className="absolute inset-2 opacity-35 [background-image:linear-gradient(#ad9c86_1px,transparent_1px),linear-gradient(90deg,#ad9c86_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse,black,transparent_72%)]" />
              <KabanMascot key={pose} pose={pose} size={320} className="onboarding-mascot relative h-56 w-56 sm:h-80 sm:w-80" />
            </div>
            <section key={step} className="onboarding-step mx-auto w-full max-w-md" aria-labelledby="onboarding-title">
              <h1 ref={heading} tabIndex={-1} id="onboarding-title" className="whitespace-pre-line font-display text-3xl font-black leading-tight tracking-tight outline-none sm:text-4xl">{title}</h1>
              {step === 0 && <><p className="mt-4 text-base leading-relaxed text-[#5f4860]">Meet Baulito, your companion for a calmer view of your finances. Let's get your local ledger ready.</p><p className="mt-3 text-sm font-semibold text-[#5f4860]">Your data stays on this device.</p><button type="button" onClick={next} className={`${buttonClass} mt-7`}>Get started</button></>}
              {step === 1 && (
                <div className="mt-4 space-y-4">
                  <p className="text-base leading-relaxed text-[#5f4860]">
                    Have an existing vault? You can restore a previous backup archive (.zip) right now, or start fresh with a clean slate.
                  </p>

                  {backupError && (
                    <div role="alert" className="rounded-xl border-2 border-[#BE123C] bg-[#FFE4E6] p-3.5 text-sm font-semibold text-[#BE123C]">
                      {backupError}
                    </div>
                  )}

                  {backupSuccess && (
                    <div role="status" className="rounded-xl border-2 border-[#10B981] bg-[#ECFDF5] p-3.5 text-sm font-semibold text-[#065F46]">
                      Backup restored successfully! Reloading your ledger…
                    </div>
                  )}

                  {!selectedBackupFile ? (
                    <div className="space-y-3 pt-2">
                      <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-[#241927] bg-[#EDE9FE] px-5 py-3 text-sm font-bold text-[#4A154B] shadow-[3px_3px_0px_#241927] transition hover:bg-[#DDD6FE] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--theme-primary)]">
                        <div className="flex items-center gap-2">
                          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span>Import backup file (.zip)</span>
                        </div>
                        <span className="text-xs font-normal text-[#5f4860]">Accepts Kaban or legacy KromaLedger archives</span>
                        <input
                          type="file"
                          accept=".zip,application/zip"
                          className="sr-only"
                          disabled={restoringBackup}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedBackupFile(file);
                              setBackupError("");
                            }
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={next}
                        disabled={restoringBackup}
                        className={buttonClass}
                      >
                        Start fresh (no backup)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      <div className="rounded-2xl border-2 border-[#241927] bg-white p-4 shadow-[2px_2px_0px_#241927]">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#5f4860]">Selected archive</p>
                            <p className="mt-0.5 truncate font-mono text-sm font-bold text-[#241927]">{selectedBackupFile.name}</p>
                            <p className="mt-0.5 text-xs text-[#5f4860]">
                              {selectedBackupFile.size < 1024 * 1024
                                ? `${Math.round(selectedBackupFile.size / 1024)} KB`
                                : `${(selectedBackupFile.size / (1024 * 1024)).toFixed(1)} MB`}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={restoringBackup}
                            onClick={() => { setSelectedBackupFile(null); setBackupError(""); }}
                            className="rounded-lg border-2 border-[#241927] bg-white px-2.5 py-1.5 text-xs font-bold text-[#BE123C] shadow-[1px_1px_0px_#241927] hover:bg-neutral-50"
                          >
                            Change
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={restoringBackup}
                        onClick={async () => {
                          setRestoringBackup(true);
                          setBackupError("");
                          try {
                            const bytes = new Uint8Array(await selectedBackupFile.arrayBuffer());
                            await vault.restore(bytes);
                            setBackupSuccess(true);
                            try {
                              localStorage.setItem("kaban_onboarding", "done");
                              localStorage.setItem("kromaledger_onboarding", "done");
                            } catch {}
                            setTimeout(() => {
                              try {
                                location.reload();
                              } catch {
                                onClose();
                              }
                            }, 400);
                          } catch (err) {
                            setBackupError(err instanceof Error ? err.message : "Restore failed. Please verify this is a valid Kaban backup archive.");
                            setRestoringBackup(false);
                          }
                        }}
                        className={buttonClass}
                      >
                        {restoringBackup ? "Restoring ledger…" : "Restore and finish setup"}
                      </button>

                      <button
                        type="button"
                        disabled={restoringBackup}
                        onClick={next}
                        className="w-full text-center text-xs font-bold text-[#5f4860] underline underline-offset-4"
                      >
                        Skip and start fresh instead
                      </button>
                    </div>
                  )}
                </div>
              )}
              {current && <><p className="mt-4 text-base leading-relaxed text-[#5f4860]">{current.body}</p>
                {(step === 3 || step === 4) && <div className="mt-5 border-t-2 border-[#DFD4C8] pt-4">
                  <p className="text-sm font-bold">Try it yourself <span className="font-normal text-[#5f4860]">(optional)</span></p>
                  <p className="mt-1 text-sm leading-relaxed text-[#5f4860]">Choose an exercise below. This is just practice; nothing is saved to your ledger.</p>
                  {!practiceMode && <div className="mt-3 flex flex-wrap gap-2">{(step === 3 ? ["EXPENSE", "TRANSFER"] as const : ["SUBSCRIPTION", "INVOICE"] as const).map((mode) => <button key={mode} type="button" onClick={() => openPractice(mode)} className="rounded-xl border-2 border-[var(--theme-primary)] bg-white px-3 py-2 text-sm font-bold text-[var(--theme-accent-text)] hover:bg-[var(--theme-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-primary)]">{practice[mode].label}</button>)}</div>}
                  {practiceSaved && <p role="status" className="mt-3 text-sm font-bold text-[#276245]">Practice complete. Nothing was saved.</p>}
                  {practiceMode && <OnboardingPractice key={practiceMode} mode={practiceMode} guidance={practice[practiceMode].guidance} onCancel={() => setPracticeMode(null)} onComplete={() => { setPracticeMode(null); setPracticeSaved(true); }} />}
                </div>}
                {!practiceMode && <button type="button" onClick={next} className={`${buttonClass} mt-6`}>{(step === 3 || step === 4) && !practiceSaved ? "Continue without trying" : "Continue"}</button>}</>}
              {step === 5 && (profile.isPending ? <p className="mt-5" role="status">Loading your profile…</p> : profile.isError ? <div className="mt-5" role="alert">Could not load your profile. <button type="button" className="underline" onClick={() => void profile.refetch()}>Try again</button></div> : <ProfileSetup profile={profile.data ?? userProfileSchema.parse({})} onSave={async (value) => { await saveProfile.mutateAsync(value); next(); }} />)}
              {step === 6 && <WalletSetup currency={profile.data?.defaultCurrency ?? "PHP"} saved={walletSaved} onSave={async (value) => { await saveWallet.mutateAsync(value); setWalletSaved(true); next(); }} onSkip={next} />}
              {step === 7 && <>
                <p className="mt-4 text-base leading-relaxed text-[#5f4860]">Notifications are optional. Choose whether you want browser reminders; you can change your choice later.</p>
                <p className="mt-3 text-sm font-semibold text-[#5f4860]" role="status">{permission === "unsupported" ? "Notifications aren't available in this browser." : permission === "denied" ? "Notifications are blocked in your browser settings." : permission === "granted" ? "Notifications are enabled in your browser." : "Your browser will ask for permission only if you choose to enable notifications."}</p>
                {(permission === "default" || permission === "denied") && <button type="button" disabled={requesting} onClick={async () => {
                  if (permission === "denied") { setShowNotificationHelp(true); return; }
                  setRequesting(true);
                  try { setPermission(await requestBrowserNotificationPermission()); } finally { setRequesting(false); }
                }} className={`${buttonClass} mt-7`}>{requesting ? "Waiting for permission…" : "Enable notifications"}</button>}
                {permission === "denied" && showNotificationHelp && <div className="mt-4 rounded-xl border-2 border-[#D6C7B9] bg-white p-4 text-sm leading-relaxed text-[#4A154B]" role="status">
                  Open your browser's site settings using the icon beside the address bar, allow notifications for this site, then return here. Your browser may require you to reload the page.
                  <button type="button" onClick={() => setPermission(getBrowserNotificationPermission())} className="mt-3 block font-bold underline underline-offset-4">Check permission again</button>
                </div>}
                <button type="button" onClick={next} className={`mt-4 ${permission === "default" || permission === "denied" ? "w-full rounded-xl border-2 border-[var(--theme-primary)] px-4 py-3 text-sm font-bold text-[var(--theme-accent-text)]" : buttonClass}`}>{permission === "granted" ? "Continue" : "Continue without notifications"}</button>
              </>}
              {step === 8 && <><p className="mt-4 text-base leading-relaxed text-[#5f4860]">Your ledger is ready. Add your own entries and keep a backup from Settings.</p><button type="button" onClick={onClose} className={`${buttonClass} mt-7`}>Open my ledger</button></>}
              {step > 0 && !practiceMode && <button type="button" onClick={previous} className="mt-5 rounded-lg px-1 py-2 text-sm font-bold text-[#5f4860] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#4A154B]">Back</button>}
            </section>
          </div>
        </div>
        <p className="text-center text-xs font-semibold text-[#725b72]">A little help from Baulito, right on your device.</p>
      </div>
    </main>
  );
}

function ProfileSetup({ profile, onSave }: { profile: UserProfile; onSave: (profile: UserProfile) => Promise<void> }) {
  const [name, setName] = useState(profile.name === "Operator" || profile.name === "Anonymous Operator" ? "" : profile.name);
  const [currency, setCurrency] = useState(profile.defaultCurrency);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <form className="mt-5 space-y-4" onSubmit={async (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError("Enter a name for your profile."); return; }
    setError(""); setBusy(true);
    try { await onSave({ ...profile, name: trimmed, defaultCurrency: currency, initials: trimmed.split(/\s+/).map((part) => part[0]).join("").slice(0, 4).toUpperCase() }); }
    catch { setError("Couldn't save your profile. Please try again."); }
    finally { setBusy(false); }
  }}>
    <p className="text-sm leading-relaxed text-[#5f4860]">Choose a name and currency for your local profile. You can change them later in Settings.</p>
    <label className="block text-sm font-bold">Your name<input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={100} required /></label>
    <label className="block text-sm font-bold">Default currency<select className={inputClass} value={currency} onChange={(event) => setCurrency(event.target.value)}>{["PHP", "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "SGD"].map((item) => <option key={item}>{item}</option>)}</select></label>
    {error && <p role="alert" className="text-sm font-semibold text-[#BE123C]">{error}</p>}
    <button className={buttonClass} disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
  </form>;
}

function WalletSetup({ currency, saved, onSave, onSkip }: { currency: string; saved: boolean; onSave: (wallet: ReturnType<typeof walletSchema.parse>) => Promise<void>; onSkip: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<WalletType>("CASH");
  const [balance, setBalance] = useState("0");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (saved) return <><p className="mt-4 text-[#5f4860]">Your wallet has been saved. You can add more from Wallets later.</p><button type="button" onClick={onSkip} className={`${buttonClass} mt-6`}>Continue</button></>;
  return <form className="mt-5 space-y-4" onSubmit={async (event) => {
    event.preventDefault(); setError("");
    try {
      if (!name.trim()) throw new Error("Enter a wallet name.");
      const amount = parseStartingBalance(balance);
      const wallet = walletSchema.parse({ id: `wallet-${crypto.randomUUID()}`, name: name.trim(), type, currency, balanceMinor: amount, color: "#4A154B", isDefault: false, createdAt: new Date().toISOString().slice(0, 10) });
      setBusy(true); await onSave(wallet);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't save your wallet. Please try again."); }
    finally { setBusy(false); }
  }}>
    <p className="text-sm leading-relaxed text-[#5f4860]">Optional: add your own cash or account to your ledger.</p>
    <label className="block text-sm font-bold">Wallet name<input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Everyday cash" maxLength={100} required /></label>
    <label className="block text-sm font-bold">Type<select className={inputClass} value={type} onChange={(event) => setType(event.target.value as WalletType)}><option value="CASH">Cash</option><option value="BANK">Bank</option><option value="E_WALLET">E-wallet</option><option value="OTHER">Other</option></select></label>
    <label className="block text-sm font-bold">Starting balance ({currency})<input className={inputClass} value={balance} onChange={(event) => setBalance(event.target.value)} inputMode="decimal" required /></label>
    {error && <p role="alert" className="text-sm font-semibold text-[#BE123C]">{error}</p>}
    <button className={buttonClass} disabled={busy}>{busy ? "Saving…" : "Add wallet"}</button>
    <button type="button" onClick={onSkip} disabled={busy} className="w-full rounded-xl px-4 py-2 text-sm font-bold text-[var(--theme-accent-text)] underline underline-offset-4">Skip for now</button>
  </form>;
}
