import { useEffect, useState, type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { format } from "date-fns";
import { DexieStorageRepo } from "./DexieStorageRepo";
import { DexieFileStore } from "./DexieFileStore";
import { KromaLedgerDB } from "./db";
import { exportVault, restoreVault } from "../backup/zipVault";
import { StorageProvider } from "../../state/StorageContext";
import { useReconcileCommand } from "../../state/queries";

const db = new KromaLedgerDB();
const repo = new DexieStorageRepo(db);
const files = new DexieFileStore(db);
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });
let persistentStatus = false;
const services = { repo, files, vault: { export: (today: string) => exportVault(db, today), restore: (data: Uint8Array) => restoreVault(db, data) }, storageStatus: async () => { const estimate = await navigator.storage?.estimate?.(); return { persistent: persistentStatus, usage: estimate?.usage ?? null, quota: estimate?.quota ?? null }; } };

export function WebBootstrap({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false); const [error, setError] = useState(""); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false; setError("");
    const boot = async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      await repo.initialize(today);
      await repo.reconcile(today);
      try { persistentStatus = (await navigator.storage?.persist?.()) ?? (await navigator.storage?.persisted?.()) ?? false; } catch { persistentStatus = false; }
      if (!cancelled) setReady(true);
      };
    boot().catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not open the local ledger."); });
    return () => { cancelled = true; };
  }, [attempt]);
  if (error) return <div className="grid min-h-screen place-items-center bg-[#070806] p-6 text-center"><div><p className="text-rose-300">Could not open your local ledger.</p><p className="mt-2 max-w-md text-sm text-neutral-500">{error}</p><button onClick={() => setAttempt((value) => value + 1)} className="mt-4 rounded-xl bg-[#D9F938] px-4 py-2 text-sm font-semibold text-black">Try again</button></div></div>;
  if (!ready) return <div className="grid min-h-screen place-items-center bg-[#070806] text-sm text-neutral-400">Opening your local ledger…</div>;
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
