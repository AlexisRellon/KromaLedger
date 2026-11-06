import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { Button, Input, KabanMascot } from "../primitives";

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
  const [inputText, setInputText] = useState(() => useAIStore.getState().initialQuestion);
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

  useLayoutEffect(() => {
    const resize = () => {
      const input = inputRef.current;
      if (!input) return;
      input.style.height = "auto";
      input.style.height = `${input.scrollHeight}px`;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [inputText]);

  // Store state & actions
  const threads = useAIStore((s) => s.threads);
  const activeThreadId = useAIStore((s) => s.activeThreadId);
  const messages = useAIStore((s) => s.messages);
  const isLoading = useAIStore((s) => s.isLoading);
  const error = useAIStore((s) => s.error);
  const rateLimit = useAIStore((s) => s.rateLimit);
  const sidebarOpen = useAIStore((s) => s.sidebarOpen);

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

  // Check the rate limit on mount
  useEffect(() => {
    void checkRateLimit(adapter);
  }, [adapter, checkRateLimit]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when modal opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLoading, onClose]);

  // Find active thread object
  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) || null,
    [threads, activeThreadId]
  );

  // Send question handler
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

  const handleSelectThread = (threadId: string) => {
    selectThread(threadId);
    setSidebarOpen(false);
  };

  const handleCreateNewChat = () => {
    createNewThread();
    setSidebarOpen(false);
    inputRef.current?.focus();
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Kaban Intelligence Advisory"
        className="relative flex flex-col md:flex-row w-full max-w-5xl h-[92vh] max-h-[820px] rounded-3xl border-3 border-neutral-900 bg-[#FAF8F5] shadow-[6px_6px_0px_#18181B] overflow-hidden"
      >
        {/* MOBILE SIDEBAR BACKDROP */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 z-20 bg-neutral-900/40 backdrop-blur-xs"
          />
        )}

        {/* SIDEBAR: CONVERSATION HISTORY */}
        <aside
          className={`
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            ${sidebarOpen ? "w-72 sm:w-80" : "w-0 md:w-0"}
            fixed md:relative inset-y-0 left-0 z-30 md:z-auto
            flex flex-col border-r-2 border-neutral-900 bg-[#F4F1EA] transition-all duration-200 ease-in-out
            overflow-hidden select-none
          `}
          style={{ width: sidebarOpen ? undefined : 0 }}
        >
          {/* Sidebar Top: New Chat Button & Search */}
          <div className="p-3.5 border-b-2 border-neutral-900 space-y-2.5 bg-white">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateNewChat}
                className="flex-1"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>New Advisory</span>
              </Button>

              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border-2 border-neutral-900 bg-white text-neutral-900 cursor-pointer"
                title="Close sidebar"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search advisories..."
                className="pl-8 text-xs py-2 placeholder:text-neutral-600"
              />
              <svg
                className="w-3.5 h-3.5 absolute left-2.5 top-3 text-neutral-600"
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
                <div className="px-2 pb-1 text-xs font-mono font-bold uppercase tracking-[0.15em] text-neutral-700">
                  Search Results ({filteredThreads.length})
                </div>
                {filteredThreads.length === 0 ? (
                  <div className="px-3 py-6 flex flex-col items-center gap-1.5 text-center text-xs text-neutral-600 font-mono">
                    <KabanMascot pose="idle-sleep" size={56} />
                    <span>No consultations found</span>
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
                      <div className="px-2.5 pb-1 text-xs font-mono font-bold uppercase tracking-[0.15em] text-neutral-700">
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
          <div className="p-3 border-t-2 border-neutral-900 bg-white flex items-center justify-between text-xs text-neutral-700 font-mono font-bold">
            <span>
              {threads.length} session{threads.length === 1 ? "" : "s"}
            </span>
            <button
              onClick={handleClearAll}
              className="text-[#BE123C] hover:underline cursor-pointer"
              title="Delete all history"
            >
              Clear all
            </button>
          </div>
        </aside>

        {/* MAIN CHAT VIEW */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#FAF8F5]">
          {/* Header Bar */}
          <header className="flex items-center justify-between border-b-2 border-neutral-900 bg-white px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Toggle Sidebar Button */}
              <button
                onClick={toggleSidebar}
                title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-neutral-900 bg-[#F4F1EA] text-neutral-900 shadow-[1px_1px_0px_#18181B] hover:bg-white transition cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
              </button>

              {/* Title & Status */}
              <KabanMascot
                pose={isLoading ? "calculating" : error ? "alert-peek" : "standalone"}
                size={36}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-sm sm:text-base font-black text-neutral-900 tracking-tight truncate max-w-[220px] sm:max-w-[360px]">
                    {activeThread?.title || "Kaban Intelligence Advisory"}
                  </h2>
                  <span className="hidden sm:inline-block h-2 w-2 rounded-full border border-neutral-900 bg-[#047857]" />
                </div>
                <p className="text-[10px] text-neutral-600 font-mono font-bold uppercase tracking-[0.15em] truncate">
                  {activeThread?.messages.length || 0} MESSAGES • BAULITO LOCAL VAULT TELEMETRY
                </p>
              </div>
            </div>

            {/* Actions: Rate limit, Export, Close */}
            <div className="flex items-center gap-2">
              {rateLimit && (
                <div
                  title="Allotted hourly quota"
                  className={`hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold tabular-nums px-2.5 py-1 rounded-xl border-2 border-neutral-900 ${
                    rateLimit.isLimited
                      ? "bg-[#FFE4E6] text-[#BE123C]"
                      : "bg-[#EDE9FE] text-neutral-900"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      rateLimit.isLimited ? "bg-[#BE123C] animate-pulse" : "bg-[#047857]"
                    }`}
                  />
                  <span>
                    {rateLimit.isLimited
                      ? `Cooldown (~${Math.ceil(rateLimit.resetsInSeconds / 60)}m)`
                      : `${rateLimit.remainingCalls}/${rateLimit.totalLimit}`}
                  </span>
                </div>
              )}

              <Button
                type="button"
                variant="subtle"
                size="sm"
                onClick={handleExportMarkdown}
                disabled={!activeThread || activeThread.messages.length === 0}
                title="Export active consultation as Markdown"
                className="!py-1.5 !px-2.5 text-xs"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span className="hidden sm:inline">{copiedExport ? "Copied" : "Export"}</span>
              </Button>

              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-neutral-900 bg-white text-neutral-900 shadow-[1px_1px_0px_#18181B] hover:bg-[#F4F1EA] transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
                <KabanMascot pose="welcome" size={96} className="mb-2" />
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full border border-neutral-900 bg-[#F59E0B]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-[0.15em] text-[#4A154B]">
                    BAULITO • KABAN LOCAL VAULT
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-black tracking-tight text-neutral-900 mt-1">
                  Kaban Intelligence Advisory
                </h3>
                <p className="mt-2 text-sm text-neutral-800 font-medium leading-relaxed max-w-md">
                  Baulito is standing by with deterministic on-device budgeting telemetry—contextualized against active accounts, upcoming commitments, and historical run rates.
                </p>

                {/* Quick Prompts Grid */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                  {STARTER_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(item.prompt)}
                      disabled={isLoading}
                      className="group flex flex-col p-4 rounded-2xl border-2 border-neutral-900 bg-white hover:bg-[#FEF3C7] shadow-[2px_2px_0px_#18181B] neo-btn-interactive transition text-left cursor-pointer disabled:opacity-40"
                    >
                      <div className="flex items-center justify-between text-sm font-bold text-neutral-900 group-hover:text-[#4A154B]">
                        <span>{item.title}</span>
                        <svg className="w-3.5 h-3.5 text-neutral-600 group-hover:text-[#4A154B] transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                        </svg>
                      </div>
                      <span className="mt-1 text-xs text-neutral-700 font-medium leading-relaxed">
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
                        ? "max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 text-sm bg-[#EDE9FE] border-2 border-neutral-900 shadow-[2px_2px_0px_#18181B] text-neutral-900"
                        : "w-full max-w-[65ch] text-sm text-neutral-900 py-1"
                    }`}
                  >
                    {/* Header Label */}
                    <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-neutral-300 text-xs font-mono font-bold uppercase tracking-[0.15em] text-neutral-700">
                      <span className={`flex items-center gap-1.5 ${m.role === "user" ? "text-[#4A154B] font-black" : "text-neutral-900"}`}>
                        {m.role === "assistant" && <KabanMascot pose="saving-up" size={24} />}
                        <span>{m.role === "user" ? "VAULT OPERATOR" : "BAULITO • KABAN INTELLIGENCE"}</span>
                      </span>
                      <span className="tabular-nums font-mono text-neutral-600 font-semibold">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Content */}
                    {m.role === "assistant" ? (
                      <MarkdownRenderer content={m.content} />
                    ) : (
                      <p className="whitespace-pre-wrap font-sans text-sm font-semibold leading-relaxed text-neutral-900">
                        {m.content}
                      </p>
                    )}

                    {/* Assistant footer action */}
                    {m.role === "assistant" && (
                      <div className="mt-3 pt-2 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-600 font-mono">
                        <span className="uppercase tracking-wider">{m.modelUsed || "gemini-2.5-flash-lite"}</span>
                        <button
                          onClick={() => handleCopyMessage(m.content, m.id)}
                          className="hover:text-[var(--text-primary)] font-bold transition px-2.5 py-1 rounded-lg border border-[var(--border-ink)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] shadow-[1px_1px_0px_var(--shadow-ink)] cursor-pointer"
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
              <div className="flex items-center gap-3 max-w-[65ch] rounded-2xl border-2 border-neutral-900 bg-[#FEF3C7] p-4 text-sm shadow-[2px_2px_0px_#18181B]">
                <KabanMascot pose="calculating" size={52} />
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-2 text-neutral-900">
                    <span className="h-2 w-2 rounded-full border border-neutral-900 bg-[#F59E0B] animate-ping" />
                    <span className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-neutral-900">
                      Baulito is synthesizing on-device ledger telemetry...
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden mt-1 border border-neutral-900">
                    <div className="h-full bg-[#4A154B] rounded-full animate-pulse w-3/4" />
                  </div>
                  <p className="text-xs text-neutral-800 font-medium leading-relaxed">
                    Evaluating liquid balances, upcoming commitments, and discretionary ceilings
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border-2 border-neutral-900 bg-[#FFE4E6] p-4 text-sm text-[#BE123C] shadow-[2px_2px_0px_#18181B] flex items-center gap-3">
                <KabanMascot pose="alert-peek" size={48} />
                <div className="flex-1 leading-relaxed">
                  <p className="font-bold font-mono text-xs uppercase tracking-wider text-[#9F1239]">Telemetry Error</p>
                  <p className="mt-0.5 font-medium">{error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3.5 sm:p-4 border-t-2 border-neutral-900 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
              className="flex items-end gap-2.5"
            >
              <div className="relative flex-1 rounded-2xl border-2 border-neutral-900 bg-white shadow-[2px_2px_0px_#18181B] focus-within:ring-2 focus-within:ring-[#4A154B] transition">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  rows={1}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Inquire about safe spend, commitments, or burn trajectory..."
                  disabled={isLoading}
                  className="block w-full resize-none overflow-y-auto bg-transparent px-4 py-3 text-sm font-medium text-neutral-900 placeholder:text-neutral-600 focus:outline-none max-h-32 min-h-[44px]"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!inputText.trim() || isLoading}
                aria-label="Send message"
                className="h-11 px-5"
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
              </Button>
            </form>

            <div className="mt-2.5 flex items-center justify-between text-xs font-mono font-bold uppercase tracking-[0.15em] text-neutral-600 px-1">
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
        <div key={thread.id} className="p-2 rounded-xl border-2 border-neutral-900 bg-white space-y-2 shadow-[2px_2px_0px_#18181B]">
          <input
            ref={renameInputRef}
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveRename(thread.id);
              if (e.key === "Escape") setEditingThreadId(null);
            }}
            className="w-full text-sm font-medium bg-[#F4F1EA] px-2.5 py-1.5 rounded-lg text-neutral-900 border border-neutral-900 focus:outline-none placeholder:text-neutral-600"
          />
          <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-bold uppercase tracking-wider">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSaveRename(thread.id)}
              className="!py-1 !px-2"
            >
              Save
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditingThreadId(null)}
              className="!py-1 !px-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    if (isDeleting) {
      return (
        <div key={thread.id} className="p-2.5 rounded-xl border-2 border-neutral-900 bg-[#FFE4E6] space-y-2 shadow-[2px_2px_0px_#18181B]">
          <p className="text-xs text-[#BE123C] font-mono font-bold uppercase tracking-wider">Delete consultation?</p>
          <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-bold uppercase tracking-wider">
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => handleConfirmDelete(thread.id, e)}
              className="!py-1 !px-2"
            >
              Delete
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDeleteId(null);
              }}
              className="!py-1 !px-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={thread.id}
        onClick={() => handleSelectThread(thread.id)}
        className={`group relative flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition border-2 ${
          isActive
            ? "border-neutral-900 bg-white text-neutral-900 shadow-[2px_2px_0px_#18181B]"
            : "border-transparent text-neutral-700 hover:border-neutral-400 hover:bg-white/60"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className={`truncate font-sans font-bold text-sm leading-snug ${isActive ? "text-[#4A154B]" : "text-neutral-900"}`}>
            {thread.title}
          </p>
          <span className="text-xs font-mono tabular-nums text-neutral-600 font-semibold">
            {formatRelativeTime(thread.updatedAt || thread.createdAt)}
          </span>
        </div>

        {/* Hover action icons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => handleStartRename(thread, e)}
            title="Rename"
            className="p-1 rounded-md hover:bg-[var(--bg-muted)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button
            onClick={(e) => handleDeleteClick(thread.id, e)}
            title="Delete"
            className="p-1 rounded-md hover:bg-[var(--status-danger-bg)] text-[var(--text-tertiary)] hover:text-[var(--status-danger-text)] cursor-pointer"
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
