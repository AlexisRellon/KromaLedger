import { type AIChatMessage, type AIChatThread } from "../../core/models/ai";

export { type AIChatMessage, type AIChatThread };

const THREADS_STORAGE_KEY = "kromaledger_ai_threads_v2";
const ACTIVE_THREAD_KEY = "kromaledger_ai_active_thread_v2";
const LEGACY_STORAGE_KEY = "kromaledger_ai_chat_history_v1";

const memoryStore = new Map<string, string>();
const inMemoryStorage: Storage = {
  getItem: (k: string) => memoryStore.get(k) ?? null,
  setItem: (k: string, v: string) => {
    memoryStore.set(k, String(v));
  },
  removeItem: (k: string) => {
    memoryStore.delete(k);
  },
  clear: () => {
    memoryStore.clear();
  },
  key: (i: number) => Array.from(memoryStore.keys())[i] ?? null,
  get length() {
    return memoryStore.size;
  },
};

function getStorage(): Storage {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) {
      return (globalThis as any).localStorage;
    }
  } catch {
    // Access denied or sandboxed
  }
  return inMemoryStorage;
}

export function generateThreadTitle(content: string): string {
  const clean = content
    .trim()
    .replace(/^[#*>\-\s]+/, "")
    .replace(/\s+/g, " ");

  if (!clean) return "Consultation";
  const firstSentence = clean.split(/[.?!]/)[0]?.trim() || clean;
  if (firstSentence.length <= 70) return firstSentence;
  return firstSentence.slice(0, 68).trim() + "…";
}

export function createEmptyThread(title = "New Consultation"): AIChatThread {
  const now = new Date().toISOString();
  return {
    id: `thread-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function loadAllThreads(): { threads: AIChatThread[]; activeThreadId: string } {
  try {
    const storage = getStorage();
    const raw = storage.getItem(THREADS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const storedActiveId = storage.getItem(ACTIVE_THREAD_KEY);
        const resolvedActiveId =
          storedActiveId && parsed.some((t: AIChatThread) => t.id === storedActiveId)
            ? storedActiveId
            : parsed[0]?.id || "";
        return { threads: parsed, activeThreadId: resolvedActiveId };
      }
    }

    // Attempt migration from v1 single-thread history
    const legacyRaw = storage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacyMsgs = JSON.parse(legacyRaw);
      if (Array.isArray(legacyMsgs) && legacyMsgs.length > 0) {
        const userMsg = legacyMsgs.find((m: AIChatMessage) => m.role === "user");
        const title = userMsg ? generateThreadTitle(userMsg.content) : "Previous Consultation";
        const thread: AIChatThread = {
          id: `thread-${Date.now()}`,
          title,
          createdAt: legacyMsgs[0]?.timestamp || new Date().toISOString(),
          updatedAt: legacyMsgs[legacyMsgs.length - 1]?.timestamp || new Date().toISOString(),
          messages: legacyMsgs.slice(-60),
        };
        saveAllThreads([thread]);
        setActiveThreadId(thread.id);
        return { threads: [thread], activeThreadId: thread.id };
      }
    }
  } catch {
    // Non-fatal, fallback to default
  }

  const initial = createEmptyThread();
  saveAllThreads([initial]);
  setActiveThreadId(initial.id);
  return { threads: [initial], activeThreadId: initial.id };
}

export function saveAllThreads(threads: AIChatThread[]): void {
  try {
    // Limit to 40 most recent threads to respect storage quota
    const trimmed = threads.slice(0, 40).map((t) => ({
      ...t,
      messages: t.messages.slice(-50),
    }));
    getStorage().setItem(THREADS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Local storage quota or security error
  }
}

export function getActiveThreadId(): string | null {
  try {
    return getStorage().getItem(ACTIVE_THREAD_KEY);
  } catch {
    return null;
  }
}

export function setActiveThreadId(id: string): void {
  try {
    getStorage().setItem(ACTIVE_THREAD_KEY, id);
  } catch {
    // Non-fatal
  }
}

export function createNewThread(title?: string): AIChatThread {
  const newThread = createEmptyThread(title);
  const { threads } = loadAllThreads();
  const updated = [newThread, ...threads];
  saveAllThreads(updated);
  setActiveThreadId(newThread.id);
  return newThread;
}

export function deleteThreadFromStorage(threadId: string): { threads: AIChatThread[]; activeThreadId: string } {
  const { threads, activeThreadId } = loadAllThreads();
  const filtered = threads.filter((t) => t.id !== threadId);

  let nextActiveId = activeThreadId;
  if (filtered.length === 0) {
    const brandNew = createEmptyThread();
    filtered.push(brandNew);
    nextActiveId = brandNew.id;
  } else if (activeThreadId === threadId) {
    nextActiveId = filtered[0]!.id;
  }

  saveAllThreads(filtered);
  setActiveThreadId(nextActiveId);
  return { threads: filtered, activeThreadId: nextActiveId };
}

export function renameThreadInStorage(threadId: string, newTitle: string): AIChatThread[] {
  const { threads } = loadAllThreads();
  const title = newTitle.trim() || "Consultation";
  const updated = threads.map((t) => (t.id === threadId ? { ...t, title, updatedAt: new Date().toISOString() } : t));
  saveAllThreads(updated);
  return updated;
}

export function clearAllChatThreads(): { threads: AIChatThread[]; activeThreadId: string } {
  try {
    const storage = getStorage();
    storage.removeItem(THREADS_STORAGE_KEY);
    storage.removeItem(ACTIVE_THREAD_KEY);
    storage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Non-fatal
  }

  const initial = createEmptyThread();
  saveAllThreads([initial]);
  setActiveThreadId(initial.id);
  return { threads: [initial], activeThreadId: initial.id };
}

export function exportThreadAsMarkdown(thread: AIChatThread): string {
  const lines = [
    `# KromaLedger // Kroma Prism Intelligence Report`,
    `Session: ${thread.title}`,
    `Created: ${new Date(thread.createdAt).toLocaleString()}`,
    `Updated: ${new Date(thread.updatedAt).toLocaleString()}`,
    `Engine: Kroma Prism`,
    `---`,
    "",
  ];

  if (thread.messages.length === 0) {
    lines.push("*No messages in this consultation.*");
    return lines.join("\n");
  }

  for (const m of thread.messages) {
    const sender = m.role === "user" ? "### Operator" : "### Kroma Prism";
    const time = new Date(m.timestamp).toLocaleTimeString();
    lines.push(`${sender} (${time})`);
    lines.push("");
    lines.push(m.content);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

export interface ThreadGroups {
  Today: AIChatThread[];
  Yesterday: AIChatThread[];
  "Previous 7 Days": AIChatThread[];
  Older: AIChatThread[];
}

export function groupThreadsByDate(threads: AIChatThread[]): ThreadGroups {
  const groups: ThreadGroups = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const sevenDaysStart = todayStart - 7 * 86400000;

  for (const thread of threads) {
    const time = new Date(thread.updatedAt || thread.createdAt).getTime();
    if (time >= todayStart) {
      groups.Today.push(thread);
    } else if (time >= yesterdayStart) {
      groups.Yesterday.push(thread);
    } else if (time >= sevenDaysStart) {
      groups["Previous 7 Days"].push(thread);
    } else {
      groups.Older.push(thread);
    }
  }

  return groups;
}

// Backward-compatible adapters
export function loadChatHistory(): AIChatMessage[] {
  const { threads, activeThreadId } = loadAllThreads();
  const active = threads.find((t) => t.id === activeThreadId) || threads[0];
  return active?.messages || [];
}

export function saveChatHistory(messages: AIChatMessage[]): void {
  const { threads, activeThreadId } = loadAllThreads();
  const updated = threads.map((t) =>
    t.id === activeThreadId ? { ...t, messages, updatedAt: new Date().toISOString() } : t
  );
  saveAllThreads(updated);
}

export function clearChatHistory(): void {
  const { threads, activeThreadId } = loadAllThreads();
  const updated = threads.map((t) => (t.id === activeThreadId ? { ...t, messages: [], updatedAt: new Date().toISOString() } : t));
  saveAllThreads(updated);
}

export function exportChatHistoryAsMarkdown(messages: AIChatMessage[]): string {
  const dummyThread: AIChatThread = {
    id: "export",
    title: "Consultation Report",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages,
  };
  return exportThreadAsMarkdown(dummyThread);
}
