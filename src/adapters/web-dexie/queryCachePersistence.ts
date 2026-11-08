import { dehydrate, hydrate, type QueryClient } from "@tanstack/react-query";

const STORAGE_KEY = "kaban_query_cache_v1";
const LEGACY_STORAGE_KEY = "kromaledger_query_cache_v1";

export function restoreQueryCache(client: QueryClient): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw =
      sessionStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem(STORAGE_KEY) ??
      sessionStorage.getItem(LEGACY_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    hydrate(client, parsed);
    return true;
  } catch {
    return false;
  }
}

export function setupQueryCachePersistence(client: QueryClient): () => void {
  if (typeof window === "undefined") return () => {};

  let timer: ReturnType<typeof setTimeout> | null = null;
  const unsubscribe = client.getQueryCache().subscribe((event) => {
    if (event?.type === "updated" || event?.type === "removed") {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const dehydrated = dehydrate(client, {
            shouldDehydrateQuery: (query) => {
              return query.state.status === "success" && query.state.data !== undefined;
            },
          });
          const serialized = JSON.stringify(dehydrated);
          sessionStorage.setItem(STORAGE_KEY, serialized);
        } catch {}
      }, 300);
    }
  });

  return () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
  };
}
