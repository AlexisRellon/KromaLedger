import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAllChatThreads,
  createEmptyThread,
  deleteThreadFromStorage,
  exportThreadAsMarkdown,
  generateThreadTitle,
  groupThreadsByDate,
  loadAllThreads,
  renameThreadInStorage,
  saveAllThreads,
  type AIChatThread,
} from "../../src/adapters/ai/chatHistoryStorage";

if (typeof window === "undefined") {
  const mockStore = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => mockStore.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mockStore.set(k, String(v));
    },
    removeItem: (k: string) => {
      mockStore.delete(k);
    },
    clear: () => {
      mockStore.clear();
    },
    key: (i: number) => Array.from(mockStore.keys())[i] ?? null,
    get length() {
      return mockStore.size;
    },
  };
  (globalThis as any).window = { localStorage: (globalThis as any).localStorage };
}

describe("chatHistoryStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("generates a clean, concise thread title from user inquiry", () => {
    expect(generateThreadTitle("### For the current week suggest how can I budget with my current cash?"))
      .toBe("For the current week suggest how can I budget with my current cash");
    expect(generateThreadTitle("Weekly Budget Review")).toBe("Weekly Budget Review");
    expect(generateThreadTitle("")).toBe("Consultation");
    expect(generateThreadTitle("   Can I buy an expensive monitor? It costs 15,000 PHP."))
      .toBe("Can I buy an expensive monitor");
  });

  it("creates an empty thread with correct structure and zero messages", () => {
    const thread = createEmptyThread("Test Session");
    expect(thread.id).toMatch(/^thread-/);
    expect(thread.title).toBe("Test Session");
    expect(thread.messages).toEqual([]);
    expect(thread.createdAt).toBeDefined();
    expect(thread.updatedAt).toBeDefined();
  });

  it("loads and persists multiple conversation threads", () => {
    const t1: AIChatThread = {
      id: "thread-1",
      title: "First Thread",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [{ id: "m1", role: "user", content: "Hello", timestamp: new Date().toISOString() }],
    };
    const t2: AIChatThread = {
      id: "thread-2",
      title: "Second Thread",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    saveAllThreads([t1, t2]);

    const { threads, activeThreadId } = loadAllThreads();
    expect(threads).toHaveLength(2);
    expect(threads[0]?.title).toBe("First Thread");
    expect(threads[1]?.title).toBe("Second Thread");
    expect(activeThreadId).toBe("thread-1");
  });

  it("migrates legacy v1 single-thread history into v2 format without data loss", () => {
    const legacyMsgs = [
      { id: "msg-1", role: "user", content: "What is my burn rate?", timestamp: "2026-10-20T10:00:00.000Z" },
      { id: "msg-2", role: "assistant", content: "Your burn rate is PHP 500/day.", timestamp: "2026-10-20T10:00:05.000Z" },
    ];
    localStorage.setItem("kromaledger_ai_chat_history_v1", JSON.stringify(legacyMsgs));

    const { threads, activeThreadId } = loadAllThreads();
    expect(threads.length).toBeGreaterThanOrEqual(1);
    expect(threads[0]?.messages).toHaveLength(2);
    expect(threads[0]?.title).toBe("What is my burn rate");
    expect(activeThreadId).toBe(threads[0]?.id);
  });

  it("renames a thread properly in storage", () => {
    const t1 = createEmptyThread("Initial Title");
    saveAllThreads([t1]);

    const updated = renameThreadInStorage(t1.id, "Renamed Budget Review");
    expect(updated[0]?.title).toBe("Renamed Budget Review");

    const reloaded = loadAllThreads();
    expect(reloaded.threads[0]?.title).toBe("Renamed Budget Review");
  });

  it("deletes a thread and falls back to remaining thread or generates new one", () => {
    const t1: AIChatThread = {
      id: "thread-1",
      title: "Thread One",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    const t2: AIChatThread = {
      id: "thread-2",
      title: "Thread Two",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    saveAllThreads([t1, t2]);

    const res = deleteThreadFromStorage("thread-1");
    expect(res.threads).toHaveLength(1);
    expect(res.threads[0]?.id).toBe("thread-2");
    expect(res.activeThreadId).toBe("thread-2");

    // Deleting the last thread creates a fresh empty consultation
    const resEmpty = deleteThreadFromStorage("thread-2");
    expect(resEmpty.threads).toHaveLength(1);
    expect(resEmpty.threads[0]?.title).toBe("New Consultation");
  });

  it("clears all chat threads cleanly", () => {
    const t1 = createEmptyThread("A");
    saveAllThreads([t1]);

    const res = clearAllChatThreads();
    expect(res.threads).toHaveLength(1);
    expect(res.threads[0]?.messages).toHaveLength(0);
  });

  it("exports thread as clean Markdown with Operator and Kroma Prism headers", () => {
    const thread: AIChatThread = {
      id: "export-test",
      title: "Weekly Planning",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        { id: "1", role: "user", content: "What is my balance?", timestamp: "2026-10-21T12:00:00.000Z" },
        { id: "2", role: "assistant", content: "Your liquid balance is PHP 20,000.00.", timestamp: "2026-10-21T12:00:02.000Z" },
      ],
    };

    const md = exportThreadAsMarkdown(thread);
    expect(md).toContain("# KromaLedger // Kroma Prism Intelligence Report");
    expect(md).toContain("Session: Weekly Planning");
    expect(md).toContain("### Operator");
    expect(md).toContain("What is my balance?");
    expect(md).toContain("### Kroma Prism");
    expect(md).toContain("Your liquid balance is PHP 20,000.00.");
  });

  it("groups threads into Today, Yesterday, Previous 7 Days, and Older", () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0).toISOString();
    const yesterday = new Date(now.getTime() - 86400000).toISOString();
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

    const threads: AIChatThread[] = [
      { id: "1", title: "T1", createdAt: today, updatedAt: today, messages: [] },
      { id: "2", title: "T2", createdAt: yesterday, updatedAt: yesterday, messages: [] },
      { id: "3", title: "T3", createdAt: threeDaysAgo, updatedAt: threeDaysAgo, messages: [] },
      { id: "4", title: "T4", createdAt: monthAgo, updatedAt: monthAgo, messages: [] },
    ];

    const groups = groupThreadsByDate(threads);
    expect(groups["Today"]).toHaveLength(1);
    expect(groups["Yesterday"]).toHaveLength(1);
    expect(groups["Previous 7 Days"]).toHaveLength(1);
    expect(groups["Older"]).toHaveLength(1);
  });
});
