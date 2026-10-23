import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAIStore } from "../../src/state/useAIStore";
import { type IAIEngine } from "../../src/core/ports/IAIEngine";
import { type WeeklyBudgetSnapshot } from "../../src/core/models/ai";

if (typeof window === "undefined") {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  };
  (globalThis as any).window = { localStorage: (globalThis as any).localStorage };
}

describe("useAIStore", () => {
  const dummySnapshot: WeeklyBudgetSnapshot = {
    today: "2026-10-21",
    weekStartDate: "2026-10-19",
    weekEndDate: "2026-10-25",
    daysRemainingInWeek: 5,
    currency: "PHP",
    totalLiquidCashMinor: 2000000,
    dueThisWeek: {
      subscriptionsMinor: 50000,
      unpaidPayableInvoicesMinor: 150000,
      expectedReceivablesMinor: 0,
      netObligationsMinor: 200000,
    },
    discretionaryBurnHistory: {
      avgDailyExpenseMinor: 50000,
      topCategoriesPastMonth: [{ categoryName: "Groceries", amountMinor: 150000, percent: 60 }],
    },
  };

  beforeEach(() => {
    localStorage.clear();
    useAIStore.setState({
      isOpen: false,
      isLoading: false,
      error: null,
      threads: [],
      activeThreadId: "",
      messages: [],
    });
  });

  it("initializes store and loads or creates an active consultation thread", () => {
    const store = useAIStore.getState();
    store.initStore();

    const state = useAIStore.getState();
    expect(state.threads.length).toBeGreaterThanOrEqual(1);
    expect(state.activeThreadId).toBe(state.threads[0]?.id);
    expect(state.messages).toEqual([]);
  });

  it("creates a new thread and sets it active", () => {
    const store = useAIStore.getState();
    store.initStore();

    const newId = store.createNewThread("Groceries Budget");
    const state = useAIStore.getState();

    expect(state.activeThreadId).toBe(newId);
    expect(state.threads[0]?.title).toBe("Groceries Budget");
    expect(state.messages).toEqual([]);
  });

  it("switches active thread and updates active messages", () => {
    useAIStore.getState().initStore();

    const id1 = useAIStore.getState().activeThreadId;
    const id2 = useAIStore.getState().createNewThread("Second Consultation");

    useAIStore.getState().selectThread(id1);
    expect(useAIStore.getState().activeThreadId).toBe(id1);

    useAIStore.getState().selectThread(id2);
    expect(useAIStore.getState().activeThreadId).toBe(id2);
  });

  it("renames a thread successfully", () => {
    useAIStore.getState().initStore();

    const activeId = useAIStore.getState().activeThreadId;
    useAIStore.getState().renameThread(activeId, "Updated Title Name");

    const state = useAIStore.getState();
    const updated = state.threads.find((t) => t.id === activeId);
    expect(updated?.title).toBe("Updated Title Name");
  });

  it("deletes a thread and adjusts active thread", () => {
    useAIStore.getState().initStore();

    const t1 = useAIStore.getState().activeThreadId;
    const t2 = useAIStore.getState().createNewThread("Another One");

    expect(useAIStore.getState().threads).toHaveLength(2);
    useAIStore.getState().deleteThread(t2);

    const state = useAIStore.getState();
    expect(state.threads).toHaveLength(1);
    expect(state.activeThreadId).toBe(t1);
  });

  it("executes askBudgetQuestion, passes multi-turn history, and appends response", async () => {
    const mockEngine: IAIEngine = {
      askWeeklyBudget: vi.fn().mockResolvedValue({
        answerMarkdown: "### Week Overview & Commitments\nSafe daily limit: PHP 2,000.00",
        modelUsed: "gemini-3.5-flash-lite",
      }),
      getRateLimitStatus: vi.fn().mockResolvedValue({
        isLimited: false,
        remainingCalls: 29,
        totalLimit: 30,
        resetsInSeconds: 0,
      }),
    };

    const store = useAIStore.getState();
    store.initStore();

    await store.askBudgetQuestion(mockEngine, "How much can I spend per day?", dummySnapshot);

    const state = useAIStore.getState();
    expect(state.messages).toHaveLength(2);
    expect(state.messages[0]?.role).toBe("user");
    expect(state.messages[0]?.content).toBe("How much can I spend per day?");
    expect(state.messages[1]?.role).toBe("assistant");
    expect(state.messages[1]?.content).toContain("Safe daily limit: PHP 2,000.00");

    // Thread title auto-updated from initial prompt
    expect(state.threads[0]?.title).toBe("How much can I spend per day");

    // Second turn verifies history was sent
    await store.askBudgetQuestion(mockEngine, "What if I cut dining out?", dummySnapshot);
    expect(mockEngine.askWeeklyBudget).toHaveBeenCalledTimes(2);

    const secondCallArg = (mockEngine.askWeeklyBudget as any).mock.calls[1][0];
    expect(secondCallArg.history).toBeDefined();
    expect(secondCallArg.history.length).toBeGreaterThanOrEqual(2);
    expect(secondCallArg.history[0].content).toBe("How much can I spend per day?");
  });
});
