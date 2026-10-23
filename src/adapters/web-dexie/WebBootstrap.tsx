import { useEffect, useState, type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { format } from "date-fns";
import { DexieStorageRepo } from "./DexieStorageRepo";
import { DexieFileStore } from "./DexieFileStore";
import { KromaLedgerDB } from "./db";
import { StorageProvider } from "../../state/StorageContext";
import { useReconcileCommand } from "../../state/queries";
import { restoreQueryCache, setupQueryCachePersistence } from "./queryCachePersistence";
import { ScreenSkeleton } from "../../ui/components/skeletons";
import { useUIStore } from "../../state/useUIStore";

const db = new KromaLedgerDB();
const repo = new DexieStorageRepo(db);
const files = new DexieFileStore(db);
let persistentStatus = false;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

// Synchronously restore query cache before first render
restoreQueryCache(queryClient);

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
  const [ready, setReady] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("kromaledger_booted") === "1";
      } catch {}
    }
    return false;
  });
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const unsub = setupQueryCachePersistence(queryClient);
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError("");
    const boot = async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      await repo.initialize(today);
      try {
        localStorage.setItem("kromaledger_booted", "1");
      } catch {}
      if (!cancelled) setReady(true);
      void repo.reconcile(today).catch(() => {});
      try {
        persistentStatus = (await navigator.storage?.persist?.()) ?? (await navigator.storage?.persisted?.()) ?? false;
      } catch {
        persistentStatus = false;
      }
    };
    boot().catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not open the local ledger.");
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070806] p-6 text-center">
        <div>
          <p className="text-rose-300">Could not open your local ledger.</p>
          <p className="mt-2 max-w-md text-sm text-neutral-500">{error}</p>
          <button
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-4 rounded-xl bg-[#D9F938] px-4 py-2 text-sm font-semibold text-black"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 pb-32 sm:pb-36 pt-5 sm:px-7 lg:px-10">
        <ScreenSkeleton tab={useUIStore.getState().activeNavTab} />
      </main>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StorageProvider value={services}>
        <ForegroundReconcile />
        {children}
      </StorageProvider>
    </QueryClientProvider>
  );
}

function ForegroundReconcile() {
  const mutation = useReconcileCommand();
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") mutation.mutate(format(new Date(), "yyyy-MM-dd"));
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  return null;
}
