import { create } from "zustand";
import {
  clearAllChatThreads,
  createEmptyThread,
  deleteThreadFromStorage,
  generateThreadTitle,
  loadAllThreads,
  renameThreadInStorage,
  saveAllThreads,
  setActiveThreadId,
  type AIChatMessage,
  type AIChatThread,
} from "../adapters/ai/chatHistoryStorage";
import { type RateLimitStatus, type WeeklyBudgetSnapshot } from "../core/models/ai";
import { type IAIEngine } from "../core/ports/IAIEngine";

export { type AIChatMessage, type AIChatThread };

interface AIState {
  isOpen: boolean;
  initialQuestion: string;
  isLoading: boolean;
  error: string | null;
  rateLimit: RateLimitStatus | null;
  sidebarOpen: boolean;
  threads: AIChatThread[];
  activeThreadId: string;
  messages: AIChatMessage[];

  // Modal & layout controls
  openModal: () => void;
  openWithQuestion: (question: string) => void;
  closeModal: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // History / Session actions
  initStore: () => void;
  selectThread: (threadId: string) => void;
  createNewThread: (title?: string) => string;
  renameThread: (threadId: string, newTitle: string) => void;
  deleteThread: (threadId: string) => void;
  clearAllChats: () => void;

  // Advisory execution
  askBudgetQuestion: (
    engine: IAIEngine,
    prompt: string,
    snapshot: WeeklyBudgetSnapshot,
    onSuccess?: (messages: AIChatMessage[]) => void
  ) => Promise<void>;
  checkRateLimit: (engine: IAIEngine) => Promise<void>;

  // Backwards compatibility helpers
  setMessages: (messages: AIChatMessage[]) => void;
  clearMessages: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  isOpen: false,
  initialQuestion: "",
  isLoading: false,
  error: null,
  rateLimit: null,
  sidebarOpen: true,
  threads: [],
  activeThreadId: "",
  messages: [],

  openModal: () => {
    // If uninitialized, hydrate from storage
    if (get().threads.length === 0) {
      get().initStore();
    }
    set({ isOpen: true, error: null, initialQuestion: "" });
  },

  openWithQuestion: (question) => {
    get().openModal();
    const { threads } = get();
    const draft = threads.find((thread) => thread.messages.length === 0) ?? createEmptyThread();
    set({
      threads: threads.some((thread) => thread.id === draft.id) ? threads : [draft, ...threads],
      activeThreadId: draft.id,
      messages: [],
      initialQuestion: question,
    });
  },

  closeModal: () => set({ isOpen: false, initialQuestion: "" }),

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  initStore: () => {
    const { threads, activeThreadId } = loadAllThreads();
    const active = threads.find((t) => t.id === activeThreadId) || threads[0] || createEmptyThread();
    set({
      threads,
      activeThreadId: active.id,
      messages: active.messages,
      error: null,
    });
  },

  selectThread: (threadId: string) => {
    const thread = get().threads.find((t) => t.id === threadId);
    if (!thread) return;
    setActiveThreadId(threadId);
    set({
      activeThreadId: threadId,
      messages: thread.messages,
      error: null,
    });
  },

  createNewThread: (title?: string) => {
    const newThread = createEmptyThread(title);
    const updated = [newThread, ...get().threads];
    saveAllThreads(updated);
    setActiveThreadId(newThread.id);
    set({
      threads: updated,
      activeThreadId: newThread.id,
      messages: newThread.messages,
      error: null,
    });
    return newThread.id;
  },

  renameThread: (threadId: string, newTitle: string) => {
    const updated = renameThreadInStorage(threadId, newTitle);
    set((state) => {
      const active = updated.find((t) => t.id === state.activeThreadId) || updated[0];
      return {
        threads: updated,
        messages: active?.messages || [],
      };
    });
  },

  deleteThread: (threadId: string) => {
    const { threads, activeThreadId } = deleteThreadFromStorage(threadId);
    const active = threads.find((t) => t.id === activeThreadId) || threads[0];
    set({
      threads,
      activeThreadId,
      messages: active?.messages || [],
      error: null,
    });
  },

  clearAllChats: () => {
    const { threads, activeThreadId } = clearAllChatThreads();
    set({
      threads,
      activeThreadId,
      messages: [],
      error: null,
    });
  },

  checkRateLimit: async (engine: IAIEngine) => {
    try {
      const status = await engine.getRateLimitStatus();
      set({ rateLimit: status });
    } catch {
      // Non-fatal if offline
    }
  },

  askBudgetQuestion: async (
    engine: IAIEngine,
    prompt: string,
    snapshot: WeeklyBudgetSnapshot,
    onSuccess?: (messages: AIChatMessage[]) => void
  ) => {
    let { threads, activeThreadId } = get();

    // Ensure we have an active thread
    let activeThread = threads.find((t) => t.id === activeThreadId);
    if (!activeThread) {
      activeThread = createEmptyThread();
      threads = [activeThread, ...threads];
      activeThreadId = activeThread.id;
      setActiveThreadId(activeThreadId);
    }

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;

    // Auto-update thread title on first user message if title is default
    let updatedTitle = activeThread.title;
    if (activeThread.messages.length === 0 || activeThread.title === "New Consultation" || activeThread.title === "New Chat") {
      updatedTitle = generateThreadTitle(trimmedPrompt);
    }

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedPrompt,
      timestamp: new Date().toISOString(),
    };

    const previousHistory = activeThread.messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const messagesWithUser = [...activeThread.messages, userMsg];
    const nowIso = new Date().toISOString();

    const updatedActiveThread: AIChatThread = {
      ...activeThread,
      title: updatedTitle,
      updatedAt: nowIso,
      messages: messagesWithUser,
    };

    const updatedThreadsWithUser = threads.map((t) =>
      t.id === activeThreadId ? updatedActiveThread : t
    );

    saveAllThreads(updatedThreadsWithUser);
    setActiveThreadId(activeThreadId);

    set({
      threads: updatedThreadsWithUser,
      activeThreadId,
      messages: messagesWithUser,
      isLoading: true,
      error: null,
    });

    try {
      const response = await engine.askWeeklyBudget({
        userPrompt: trimmedPrompt,
        context: snapshot,
        history: previousHistory,
      });

      const assistantMsg: AIChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.answerMarkdown,
        timestamp: new Date().toISOString(),
        modelUsed: response.modelUsed,
      };

      const finalMessages = [...messagesWithUser, assistantMsg];
      const finalActiveThread: AIChatThread = {
        ...updatedActiveThread,
        updatedAt: new Date().toISOString(),
        messages: finalMessages,
      };

      const finalThreads = get().threads.map((t) =>
        t.id === activeThreadId ? finalActiveThread : t
      );

      saveAllThreads(finalThreads);

      set({
        threads: finalThreads,
        messages: finalMessages,
        isLoading: false,
      });

      if (onSuccess) {
        try {
          onSuccess(finalMessages);
        } catch {
          // Non-fatal
        }
      }

      // Refresh rate limit
      const updatedStatus = await engine.getRateLimitStatus().catch(() => null);
      if (updatedStatus) {
        set({ rateLimit: updatedStatus });
      }
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.message || "Failed to generate budgeting advice.",
      });
    }
  },

  // Backwards-compatible methods
  setMessages: (messages: AIChatMessage[]) => {
    const { threads, activeThreadId } = get();
    const updated = threads.map((t) =>
      t.id === activeThreadId ? { ...t, messages, updatedAt: new Date().toISOString() } : t
    );
    saveAllThreads(updated);
    set({ threads: updated, messages });
  },

  clearMessages: () => {
    const { threads, activeThreadId } = get();
    const updated = threads.map((t) =>
      t.id === activeThreadId ? { ...t, messages: [], updatedAt: new Date().toISOString() } : t
    );
    saveAllThreads(updated);
    set({ threads: updated, messages: [], error: null });
  },
}));
