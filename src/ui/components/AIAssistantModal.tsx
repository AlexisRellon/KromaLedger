import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  exportThreadAsMarkdown,
  groupThreadsByDate,
  type AIChatThread,
} from "../../adapters/ai/chatHistoryStorage";
import { NetlifyGemmaAdapter } from "../../adapters/ai/NetlifyGemmaAdapter";
import { buildWeeklyBudgetSnapshot } from "../../core/engine/aiBudgetSnapshot";
import {
  useAllTransactions,
  useCategories,
  useInvoices,
  useProfile,
  useSubscriptions,
  useWallets,
} from "../../state/queries";
import { useAIStore } from "../../state/useAIStore";
import { MarkdownRenderer } from "./MarkdownRenderer";

const STARTER_PROMPTS = [
  {
    title: "Weekly Safe Spend",
    description: "Calculate safe daily discretionary ceiling for remaining days",
    prompt: "For the current week, calculate my safe daily discretionary spending limit based on my liquid cash and commitments.",
  },
  {
    title: "Commitment Risk",
    description: "Review upcoming subscriptions and unpaid invoices",
    prompt: "Review my upcoming subscriptions and unpaid invoices due this week. Do I risk a cash shortfall?",
  },
  {
    title: "Spending Velocity",
    description: "Compare current burn rate against 30-day baseline",
    prompt: "Compare my spending rate this week against my 30-day historical baseline. Am I burning cash too fast?",
  },
  {
    title: "Expense Trimming",
    description: "Identify largest outflow category and reduction targets",
    prompt: "Analyze my top spending categories and recommend 2-3 concrete tactical actions to preserve cash.",
  },
];

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function AIAssistantModal({ onClose }: { onClose: () => void }) {
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [copiedExport, setCopiedExport] = useState(false);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const adapter = useMemo(() => new NetlifyGemmaAdapter(), []);

  // Store state & actions
  const threads = useAIStore((s) => s.threads);
  const activeThreadId = useAIStore((s) => s.activeThreadId);
  const messages = useAIStore((s) => s.messages);
  const isLoading = useAIStore((s) => s.isLoading);
  const error = useAIStore((s) => s.error);
  const rateLimit = useAIStore((s) => s.rateLimit);
  const sidebarOpen = useAIStore((s) => s.sidebarOpen);

  const initStore = useAIStore((s) => s.initStore);
  const toggleSidebar = useAIStore((s) => s.toggleSidebar);
  const setSidebarOpen = useAIStore((s) => s.setSidebarOpen);
  const selectThread = useAIStore((s) => s.selectThread);
  const createNewThread = useAIStore((s) => s.createNewThread);
  const renameThread = useAIStore((s) => s.renameThread);
  const deleteThread = useAIStore((s) => s.deleteThread);
  const clearAllChats = useAIStore((s) => s.clearAllChats);
  const askBudgetQuestion = useAIStore((s) => s.askBudgetQuestion);
  const checkRateLimit = useAIStore((s) => s.checkRateLimit);

  // Queries to construct the snapshot
  const walletsQuery = useWallets();
  const subscriptionsQuery = useSubscriptions();
  const invoicesQuery = useInvoices();
  const transactionsQuery = useAllTransactions();
  const categoriesQuery = useCategories();
  const profileQuery = useProfile();

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) || threads[0],
    [threads, activeThreadId]
  );

  // Initialize on mount
  useEffect(() => {
    initStore();
    void checkRateLimit(adapter);
  }, [adapter, checkRateLimit, initStore]);

  // Focus rename input when editing starts
  useEffect(() => {
    if (editingThreadId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [editingThreadId]);

  // Focus input and escape key listener
  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        if (editingThreadId) {
          setEditingThreadId(null);
          return;
        }
        if (confirmDeleteId) {
          setConfirmDeleteId(null);
          return;
        }
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, isLoading, editingThreadId, confirmDeleteId]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend ?? inputText).trim();
    if (!prompt || isLoading) return;

    const today = new Date().toISOString().slice(0, 10);
    const snapshot = buildWeeklyBudgetSnapshot({
      today,
      currency: profileQuery.data?.defaultCurrency ?? "PHP",
      wallets: walletsQuery.data ?? [],
      subscriptions: subscriptionsQuery.data ?? [],
      invoices: invoicesQuery.data ?? [],
      transactions: transactionsQuery.data ?? [],
      categories: categoriesQuery.data ?? [],
    });

    setInputText("");
    await askBudgetQuestion(adapter, prompt, snapshot);
  };

  const handleCreateNewChat = () => {
    createNewThread();
    setConfirmDeleteId(null);
    setEditingThreadId(null);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelectThread = (id: string) => {
    selectThread(id);
    setConfirmDeleteId(null);
    setEditingThreadId(null);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleStartRename = (thread: AIChatThread, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingThreadId(thread.id);
    setEditingTitle(thread.title);
    setConfirmDeleteId(null);
  };

  const handleSaveRename = (threadId: string) => {
    if (editingTitle.trim()) {
      renameThread(threadId, editingTitle.trim());
    }
    setEditingThreadId(null);
  };

  const handleDeleteClick = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(threadId);
    setEditingThreadId(null);
  };

  const handleConfirmDelete = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteThread(threadId);
    setConfirmDeleteId(null);
  };

  const handleClearAll = () => {
    if (window.confirm("Delete all consultation threads and chat history?")) {
      clearAllChats();
      setConfirmDeleteId(null);
      setEditingThreadId(null);
    }
  };

  const handleExportMarkdown = async () => {
    if (!activeThread) return;
    const markdown = exportThreadAsMarkdown(activeThread);
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 2000);
    } catch {
      // Non-fatal
    }
  };

  const handleCopyMessage = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 1800);
    } catch {
      // Non-fatal
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // Filter threads for search or group by recency
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase().trim();
    return threads.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.messages.some((m) => m.content.toLowerCase().includes(query))
    );
  }, [threads, searchQuery]);

  const dateGroups = useMemo(() => {
    if (filteredThreads !== null) return null;
    return groupThreadsByDate(threads);
  }, [threads, filteredThreads]);

  return createPortal(
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Kroma Prism Financial Advisory"
        className="relative flex flex-col md:flex-row w-full max-w-5xl h-[92vh] max-h-[820px] rounded-3xl border border-white/[0.12] bg-[#0A0D08] shadow-[0_24px_80px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.08)] overflow-hidden"
      >
        {/* MOBILE SIDEBAR BACKDROP */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 z-20 bg-black/60 backdrop-blur-sm"
          />
        )}

        {/* SIDEBAR: CONVERSATION HISTORY */}
        <aside
          className={`
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            ${sidebarOpen ? "w-72 sm:w-80" : "w-0 md:w-0"}
            fixed md:relative inset-y-0 left-0 z-30 md:z-auto
            flex flex-col border-r border-white/[0.08] bg-[#070906] transition-all duration-200 ease-in-out
            overflow-hidden select-none
          `}
          style={{ width: sidebarOpen ? undefined : 0 }}
        >
          {/* Sidebar Top: New Chat Button & Search */}
          <div className="p-3.5 border-b border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleCreateNewChat}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-[#D9F938] hover:brightness-105 text-[#070806] text-sm font-semibold tracking-wide transition active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>New Consultation</span>
              </button>

              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-neutral-400 hover:text-white"
                title="Close sidebar"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search consultations..."
                className="w-full h-9 pl-8 pr-3 text-sm rounded-xl border border-white/[0.08] bg-white/[0.03] text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#D9F938]/50"
              />
              <svg
                className="w-4 h-4 absolute left-2.5 top-2.5 text-neutral-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>

          {/* Thread List Feed */}
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
            {/* Search results view */}
            {filteredThreads !== null && (
              <div className="space-y-1">
                <div className="px-2 pb-1 text-xs font-mono font-bold uppercase tracking-[0.15em] text-neutral-500">
                  Search Results ({filteredThreads.length})
                </div>
                {filteredThreads.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs text-neutral-500 font-mono">
                    No consultations found
                  </div>
                ) : (
                  filteredThreads.map((thread) => renderThreadItem(thread))
                )}
              </div>
            )}

            {/* Date-grouped view */}
            {dateGroups !== null && (
              <>
                {Object.entries(dateGroups).map(([groupTitle, groupItems]) => {
                  if (groupItems.length === 0) return null;
                  return (
                    <div key={groupTitle} className="space-y-1">
                      <div className="px-2.5 pb-1 text-xs font-mono font-bold uppercase tracking-[0.15em] text-neutral-500">
                        {groupTitle}
                      </div>
                      {groupItems.map((thread: AIChatThread) => renderThreadItem(thread))}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-500 font-mono">
            <span>
              {threads.length} session{threads.length === 1 ? "" : "s"}
            </span>
            <button
              onClick={handleClearAll}
              className="text-neutral-500 hover:text-red-400 transition"
              title="Delete all history"
            >
              Clear all
            </button>
          </div>
        </aside>

        {/* MAIN CHAT VIEW */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0A0D08]">
          {/* Header Bar */}
          <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Toggle Sidebar Button */}
              <button
                onClick={toggleSidebar}
                title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.04] transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
              </button>

              {/* Title & Status */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[220px] sm:max-w-[360px]">
                    {activeThread?.title || "Kroma Prism Advisory"}
                  </h2>
                  <span className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-[#D9F938]" />
                </div>
                <p className="text-xs text-neutral-400 font-mono font-bold uppercase tracking-[0.15em] truncate">
                  {activeThread?.messages.length || 0} MESSAGES • ON-DEVICE TELEMETRY
                </p>
              </div>
            </div>

            {/* Actions: Rate limit, Export, Close */}
            <div className="flex items-center gap-2">
              {rateLimit && (
                <div
                  title="Allotted hourly quota"
                  className={`hidden sm:flex items-center gap-1.5 text-xs font-mono font-semibold tabular-nums px-2.5 py-1 rounded-full border ${
                    rateLimit.isLimited
                      ? "border-red-500/40 bg-red-500/10 text-red-300"
                      : "border-white/10 bg-white/[0.04] text-neutral-300"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      rateLimit.isLimited ? "bg-red-400 animate-pulse" : "bg-[#D9F938]"
                    }`}
                  />
                  <span>
                    {rateLimit.isLimited
                      ? `Cooldown (~${Math.ceil(rateLimit.resetsInSeconds / 60)}m)`
                      : `${rateLimit.remainingCalls}/${rateLimit.totalLimit}`}
                  </span>
                </div>
              )}

              <button
                onClick={handleExportMarkdown}
                disabled={!activeThread || activeThread.messages.length === 0}
                title="Export active consultation as Markdown"
                className="flex items-center gap-1.5 text-xs font-mono font-medium text-neutral-300 hover:text-white px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition disabled:opacity-30 disabled:pointer-events-none"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span className="hidden sm:inline">{copiedExport ? "Copied" : "Export"}</span>
              </button>

              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.06] transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </header>

          {/* Message Thread Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Empty State: Starter prompts */}
            {(!activeThread || activeThread.messages.length === 0) && (
              <div className="h-full flex flex-col justify-center items-center max-w-xl mx-auto text-center py-6 px-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-[#D9F938]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-[0.15em] text-[#D9F938]">
                    OBSIDIAN TELEMETRY
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                  Kroma Prism Advisory
                </h3>
                <p className="mt-2 text-sm text-neutral-300 font-sans leading-relaxed max-w-md">
                  Deterministic on-device budgeting telemetry. Contextualized against active wallets, upcoming commitments, and historical run rates.
                </p>

                {/* Quick Prompts Grid */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                  {STARTER_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(item.prompt)}
                      disabled={isLoading}
                      className="group flex flex-col p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:border-[#D9F938]/40 hover:bg-[#D9F938]/[0.04] transition text-left disabled:opacity-40"
                    >
                      <div className="flex items-center justify-between text-sm font-semibold text-white group-hover:text-[#D9F938]">
                        <span>{item.title}</span>
                        <svg className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#D9F938] transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                        </svg>
                      </div>
                      <span className="mt-1 text-xs text-neutral-400 font-sans leading-relaxed">
                        {item.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {activeThread &&
              activeThread.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`group relative leading-relaxed ${
                      m.role === "user"
                        ? "max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 text-sm bg-[#141A0E] border border-[#D9F938]/25 text-white"
                        : "w-full max-w-[65ch] text-sm text-neutral-200 py-1"
                    }`}
                  >
                    {/* Header Label */}
                    <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-white/[0.06] text-xs font-mono font-bold uppercase tracking-[0.15em] text-neutral-400">
                      <span className={m.role === "user" ? "text-[#D9F938]" : "text-neutral-300"}>
                        {m.role === "user" ? "OPERATOR" : "KROMA PRISM"}
                      </span>
                      <span className="tabular-nums font-mono text-neutral-500 font-normal">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Content */}
                    {m.role === "assistant" ? (
                      <MarkdownRenderer content={m.content} />
                    ) : (
                      <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white">
                        {m.content}
                      </p>
                    )}

                    {/* Assistant footer action */}
                    {m.role === "assistant" && (
                      <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-500 font-mono">
                        <span className="uppercase tracking-wider">{m.modelUsed || "gemini-3.5-flash-lite"}</span>
                        <button
                          onClick={() => handleCopyMessage(m.content, m.id)}
                          className="hover:text-white transition px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08]"
                        >
                          {copiedMessageId === m.id ? "Copied" : "Copy"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

            {/* Analytical Thinking State */}
            {isLoading && (
              <div className="flex flex-col gap-2 max-w-[65ch] rounded-2xl border border-[#D9F938]/20 bg-[#D9F938]/[0.02] p-4 text-sm">
                <div className="flex items-center gap-2 text-neutral-300">
                  <span className="h-2 w-2 rounded-full bg-[#D9F938] animate-ping" />
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-[#D9F938]">
                    Synthesizing on-device ledger telemetry...
                  </span>
                </div>
                <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-[#D9F938] rounded-full animate-pulse w-3/4" />
                </div>
                <p className="text-sm text-neutral-400 font-sans leading-relaxed">
                  Evaluating liquid balances, upcoming commitments, and discretionary ceilings
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-200 flex items-start gap-2.5">
                <span className="text-red-400 font-bold font-mono">!</span>
                <div className="flex-1 leading-relaxed">
                  <p className="font-semibold text-red-300 font-mono text-xs uppercase tracking-wider">Telemetry Error</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3.5 sm:p-4 border-t border-white/[0.08]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
              className="flex items-end gap-2.5"
            >
              <div className="relative flex-1 rounded-2xl border border-white/10 bg-white/[0.03] focus-within:border-[#D9F938]/60 focus-within:ring-1 focus-within:ring-[#D9F938]/30 transition">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  rows={1}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Inquire about safe spend, commitments, or burn trajectory..."
                  disabled={isLoading}
                  className="w-full resize-none bg-transparent px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none max-h-32 min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                aria-label="Send message"
                className="flex h-11 px-4 sm:px-5 items-center justify-center rounded-2xl bg-[#D9F938] text-sm font-semibold text-[#070806] transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">...</span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>Send</span>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            <div className="mt-2.5 flex items-center justify-between text-xs font-mono font-bold uppercase tracking-[0.15em] text-neutral-500 px-1">
              <span>Enter to send • Shift+Enter for newline</span>
              <span>100% on-device telemetry</span>
            </div>
          </div>
        </main>
      </div>
    </div>,
    document.body
  );

  // Helper to render individual thread item in sidebar
  function renderThreadItem(thread: AIChatThread) {
    const isActive = thread.id === activeThreadId;
    const isEditing = editingThreadId === thread.id;
    const isDeleting = confirmDeleteId === thread.id;

    if (isEditing) {
      return (
        <div key={thread.id} className="p-2 rounded-xl border border-[#D9F938]/40 bg-[#141A0E] space-y-2">
          <input
            ref={renameInputRef}
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveRename(thread.id);
              if (e.key === "Escape") setEditingThreadId(null);
            }}
            className="w-full text-sm bg-black/40 px-2.5 py-1.5 rounded-lg text-white border border-white/10 focus:outline-none focus:border-[#D9F938]"
          />
          <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-bold uppercase tracking-wider">
            <button
              onClick={() => handleSaveRename(thread.id)}
              className="px-2.5 py-1 rounded bg-[#D9F938] text-black font-semibold hover:brightness-105"
            >
              Save
            </button>
            <button
              onClick={() => setEditingThreadId(null)}
              className="px-2.5 py-1 rounded text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    if (isDeleting) {
      return (
        <div key={thread.id} className="p-2.5 rounded-xl border border-red-500/40 bg-red-950/20 space-y-2">
          <p className="text-xs text-red-300 font-mono font-bold uppercase tracking-wider">Delete consultation?</p>
          <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-bold uppercase tracking-wider">
            <button
              onClick={(e) => handleConfirmDelete(thread.id, e)}
              className="px-2.5 py-1 rounded bg-red-600 text-white font-semibold hover:bg-red-500"
            >
              Delete
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDeleteId(null);
              }}
              className="px-2.5 py-1 rounded text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={thread.id}
        onClick={() => handleSelectThread(thread.id)}
        className={`group relative flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition ${
          isActive
            ? "bg-white/[0.08] text-white"
            : "text-neutral-300 hover:bg-white/[0.03] hover:text-white"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className={`truncate font-sans font-medium text-sm leading-snug ${isActive ? "text-white" : "text-neutral-300"}`}>
            {thread.title}
          </p>
          <span className="text-xs font-mono tabular-nums text-neutral-400">
            {formatRelativeTime(thread.updatedAt || thread.createdAt)}
          </span>
        </div>

        {/* Hover action icons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => handleStartRename(thread, e)}
            title="Rename"
            className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button
            onClick={(e) => handleDeleteClick(thread.id, e)}
            title="Delete"
            className="p-1 rounded hover:bg-red-500/20 text-neutral-400 hover:text-red-300"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    );
  }
}
