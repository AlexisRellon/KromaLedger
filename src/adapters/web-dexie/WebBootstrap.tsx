import { useEffect, useState, type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DexieStorageRepo } from "./DexieStorageRepo";
import { DexieFileStore } from "./DexieFileStore";
import { KromaLedgerDB } from "./db";
import { StorageProvider } from "../../state/StorageContext";
import { useReconcileCommand } from "../../state/queries";
import { restoreQueryCache, setupQueryCachePersistence } from "./queryCachePersistence";
import { ScreenSkeleton } from "../../ui/components/skeletons";
import { BaulitoMissedDaysModal } from "../../ui/components/BaulitoMissedDaysModal";
import { useUIStore } from "../../state/useUIStore";
import { markFirstBoot } from "../../state/onboarding";
import { addDaysManila, daysBetweenManila, getTodayManila, msUntilNextManilaMidnight } from "../../core/engine/manilaDate";
import {
  LATEST_RELEASE,
  buildAppUpdateNotification,
  getAppUpdateNotificationId,
  hasUnseenAppUpdate,
  isOnboardingPending,
  markAppUpdateSeen,
} from "../../core/engine/appChangelog";
import type { InterestRule } from "../../core/models";
import type { SyncDumpPayload, SyncRestoreOptions } from "../backup/zipVault";

function computeMissedInterestDays(rules: InterestRule[], todayManila: string): number {
  const yesterdayManila = addDaysManila(todayManila, -1);
  let maxMissed = 0;
  for (const rule of rules) {
    if (!rule.enabled || rule.payoutFrequency !== "DAILY") continue;
    const nextPeriod = rule.lastPostedPeriodKey ? addDaysManila(rule.lastPostedPeriodKey, 1) : rule.startDate;
    if (nextPeriod <= yesterdayManila) {
      const missed = daysBetweenManila(nextPeriod, yesterdayManila) + 1;
      if (missed > maxMissed) maxMissed = missed;
    }
  }
  return maxMissed;
}

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
    exportSyncFrames: async (today: string, options?: { includeAttachments?: boolean; chunkSize?: number }) => {
      const { exportSyncFrames } = await import("../backup/zipVault");
      return exportSyncFrames(db, today, options);
    },
    parseSyncPayload: async (jsonText: string) => {
      const { parseSyncPayload } = await import("../backup/zipVault");
      return parseSyncPayload(jsonText);
    },
    restoreSyncPayload: async (dumpOrJson: SyncDumpPayload | string, options: SyncRestoreOptions) => {
      const { restoreSyncPayload } = await import("../backup/zipVault");
      return restoreSyncPayload(db, dumpOrJson, options);
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
        return (
          localStorage.getItem("kaban_booted") === "1" ||
          localStorage.getItem("kromaledger_booted") === "1"
        );
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
    let active = true;
    import("virtual:pwa-register")
      .then(({ registerSW }) => {
        if (!active) return;
        registerSW({
          immediate: true,
          onNeedRefresh() {
            useUIStore.getState().openAppUpdate(true);
          },
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError("");
    const boot = async () => {
      const today = getTodayManila();
      await repo.initialize(today);
      void files.optimizeExistingAttachments().catch(() => {});
      try {
        markFirstBoot(localStorage);
      } catch {}
      const rules = await repo.listInterestRules();
      const missedDays = computeMissedInterestDays(rules, today);
      if (missedDays >= 1) {
        useUIStore.getState().setMissedInterestDays(missedDays);
        useUIStore.getState().setInterestDeferred(true);
      }
      if (!cancelled) setReady(true);
      void repo.reconcile(today, { deferInterest: missedDays >= 1 }).catch(() => {});
      try {
        if (isOnboardingPending(localStorage)) {
          markAppUpdateSeen(localStorage);
        } else if (hasUnseenAppUpdate(localStorage)) {
          const existingNotifs = await repo.listNotifications();
          const updateNotifId = getAppUpdateNotificationId();
          if (!existingNotifs.some((n) => n.id === updateNotifId)) {
            await repo.saveNotification(buildAppUpdateNotification(LATEST_RELEASE, today));
            void queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }
          if (!cancelled) {
            useUIStore.getState().openAppUpdate(false);
          }
        }
      } catch {}
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
    const runCheck = async () => {
      const today = getTodayManila();
      const ui = useUIStore.getState();
      if (!ui.interestDeferred) {
        const rules = await repo.listInterestRules();
        const missedDays = computeMissedInterestDays(rules, today);
        if (missedDays >= 1) {
          ui.setMissedInterestDays(missedDays);
          ui.setInterestDeferred(true);
          mutation.mutate({ currentDate: today, deferInterest: true });
          return;
        }
      }
      mutation.mutate({ currentDate: today, deferInterest: ui.interestDeferred });
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void runCheck().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    let midnightTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleMidnight = () => {
      midnightTimer = setTimeout(() => {
        void runCheck().catch(() => {});
        scheduleMidnight();
      }, msUntilNextManilaMidnight() + 500);
    };
    scheduleMidnight();

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (midnightTimer) clearTimeout(midnightTimer);
    };
  }, []);
  return <BaulitoMissedDaysModal />;
}
