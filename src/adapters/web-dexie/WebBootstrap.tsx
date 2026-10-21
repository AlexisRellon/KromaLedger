import { useEffect, useState, type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { format } from "date-fns";
import { DexieStorageRepo } from "./DexieStorageRepo";
import { DexieFileStore } from "./DexieFileStore";
import { KromaLedgerDB } from "./db";
import { StorageProvider } from "../../state/StorageContext";
import { useReconcileCommand } from "../../state/queries";

const db = new KromaLedgerDB();
const repo = new DexieStorageRepo(db);
const files = new DexieFileStore(db);
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });
let persistentStatus = false;
const services = {
  repo,
  files,
  vault: {
    export: async (today: string) => {
      const { exportVault } = await import("../backup/zipVault");
      return exportVault(db, today);
    },
    restore: async (data: Uint8Array) => {
      const { restoreVault } = await import("../backup/zipVault");
      return restoreVault(db, data);
    },
  },
  storageStatus: async () => {
    const estimate = await navigator.storage?.estimate?.();
    return { persistent: persistentStatus, usage: estimate?.usage ?? null, quota: estimate?.quota ?? null };
  },
};

export function WebBootstrap({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false); const [error, setError] = useState(""); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false; setError("");
    const boot = async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      await repo.initialize(today);
      if (!cancelled) setReady(true);
      void repo.reconcile(today).catch(() => {});
      try { persistentStatus = (await navigator.storage?.persist?.()) ?? (await navigator.storage?.persisted?.()) ?? false; } catch { persistentStatus = false; }
    };
    boot().catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not open the local ledger."); });
    return () => { cancelled = true; };
  }, [attempt]);
  if (error) return <div className="grid min-h-screen place-items-center bg-[#070806] p-6 text-center"><div><p className="text-rose-300">Could not open your local ledger.</p><p className="mt-2 max-w-md text-sm text-neutral-500">{error}</p><button onClick={() => setAttempt((value) => value + 1)} className="mt-4 rounded-xl bg-[#D9F938] px-4 py-2 text-sm font-semibold text-black">Try again</button></div></div>;
  if (!ready) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 pb-32 sm:pb-36 pt-5 sm:px-7 lg:px-10 animate-pulse">
        <div className="flex items-center justify-between py-2 border-b border-white/5">
          <div className="h-6 w-32 rounded-lg bg-white/5" />
          <div className="h-8 w-24 rounded-full bg-white/5" />
        </div>
        <div className="mt-8 mb-6 h-10 w-48 rounded-xl bg-white/5" />
        <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
          <div className="h-64 rounded-3xl border border-white/5 bg-white/[0.02]" />
          <div className="h-64 rounded-3xl border border-white/5 bg-white/[0.02]" />
        </div>
      </main>
    );
  }
  return <QueryClientProvider client={queryClient}><StorageProvider value={services}><ForegroundReconcile />{children}</StorageProvider></QueryClientProvider>;
}

function ForegroundReconcile() {
  const mutation = useReconcileCommand();
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") mutation.mutate(format(new Date(), "yyyy-MM-dd")); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  return null;
}
