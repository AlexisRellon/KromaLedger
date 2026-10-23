import { useState, useRef, useMemo, useEffect } from "react";
import type { Wallet } from "../../core/models";
import { formatCurrency } from "../../core/models";
import { WalletFormModal } from "./WalletFormModal";
import { PhysicalWalletCard } from "./PhysicalWalletCard";
import { useSaveWallet } from "../../state/queries";

export function StackedWalletDeck({
  wallets,
  defaultCurrency = "PHP",
}: {
  wallets: Wallet[];
  defaultCurrency?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentDeltaXRef = useRef(0);
  const currentDeltaYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const startTimeRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  const topCardRef = useRef<HTMLDivElement | null>(null);
  const secondCardRef = useRef<HTMLDivElement | null>(null);

  const saveWalletMutation = useSaveWallet();

  // Cancel any pending animation frame on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const totalBalanceMinor = useMemo(
    () => wallets.reduce((sum, w) => sum + w.balanceMinor, 0),
    [wallets]
  );

  // Safe active index in case wallets count changes
  const safeIndex = wallets.length > 0 ? activeIndex % wallets.length : 0;
  const currentWallet = wallets[safeIndex];

  const handlePointerDown = (e: React.PointerEvent) => {
    if (wallets.length <= 1) return;
    if (e.button !== 0) return;

    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    currentDeltaXRef.current = 0;
    currentDeltaYRef.current = 0;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startTimeRef.current = performance.now();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Disable CSS transitions during active drag for instant 1:1 hardware tracking
    if (topCardRef.current) {
      topCardRef.current.style.transition = "none";
    }
    if (secondCardRef.current) {
      secondCardRef.current.style.transition = "none";
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;
    currentDeltaXRef.current = deltaX;
    currentDeltaYRef.current = deltaY;

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasMovedRef.current = true;
    }

    // Throttle style updates directly to display refresh rate without React re-renders
    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (!isDraggingRef.current) return;

        const dX = currentDeltaXRef.current;
        const dY = currentDeltaYRef.current;
        const isHorizontal = Math.abs(dX) >= Math.abs(dY);
        const primaryDelta = isHorizontal ? dX : dY;

        if (topCardRef.current) {
          const scale = 1 - Math.min(Math.abs(primaryDelta) * 0.0008, 0.08);
          const rotate = isHorizontal ? dX * 0.04 : dY * 0.035;
          const translateX = isHorizontal ? dX : 0;
          const translateY = isHorizontal ? 0 : dY;
          topCardRef.current.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale}) rotate(${rotate}deg)`;
        }

        if (secondCardRef.current) {
          const dragInfluence = isHorizontal ? Math.abs(dX) : dY < 0 ? Math.abs(dY) : 0;
          const influenceCapped = Math.min(dragInfluence * 0.25, 14);
          const translateY = 18 - influenceCapped;
          const scale = 0.94 + (influenceCapped / 14) * 0.06;
          secondCardRef.current.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale}) rotate(0deg)`;
        }
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    const finalDeltaX = currentDeltaXRef.current;
    const finalDeltaY = currentDeltaYRef.current;
    const isHorizontal = Math.abs(finalDeltaX) >= Math.abs(finalDeltaY);
    const primaryDelta = isHorizontal ? finalDeltaX : finalDeltaY;
    const elapsed = performance.now() - startTimeRef.current;
    const velocity = Math.abs(primaryDelta) / (elapsed || 1);
    const threshold = 35;
    const isFlick = velocity > 0.4 && Math.abs(primaryDelta) > 15;

    if (primaryDelta < -threshold || (primaryDelta < -15 && isFlick)) {
      // Dragged LEFT or UP -> cycle forward
      if (topCardRef.current) {
        topCardRef.current.style.transition = "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease";
      }
      if (secondCardRef.current) {
        secondCardRef.current.style.transition = "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease";
      }
      setActiveIndex((prev) => (prev + 1) % wallets.length);
    } else if (primaryDelta > threshold || (primaryDelta > 15 && isFlick)) {
      // Dragged RIGHT or DOWN -> cycle backward
      if (topCardRef.current) {
        topCardRef.current.style.transition = "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease";
      }
      if (secondCardRef.current) {
        secondCardRef.current.style.transition = "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease";
      }
      setActiveIndex((prev) => (prev - 1 + wallets.length) % wallets.length);
    } else {
      // Below threshold -> spring smoothly back to neutral
      if (topCardRef.current) {
        topCardRef.current.style.transition = "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)";
        topCardRef.current.style.transform = "translate3d(0, 0px, 0) scale(1) rotate(0deg)";
      }
      if (secondCardRef.current) {
        secondCardRef.current.style.transition = "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)";
        secondCardRef.current.style.transform = "translate3d(0, 18px, 0) scale(0.94) rotate(0deg)";
      }
    }

    currentDeltaXRef.current = 0;
    currentDeltaYRef.current = 0;
  };

  const handleCycleNext = () => {
    if (wallets.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % wallets.length);
  };

  const handleCyclePrev = () => {
    if (wallets.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + wallets.length) % wallets.length);
  };

  return (
    <section aria-label="Liquid Wallets Deck" className="space-y-4">
      {/* Header with Title, Total Balance, and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-bold text-white">Wallets & Accounts</h2>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-mono font-medium text-neutral-300">
              {wallets.length}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-neutral-400">
            Total Liquid:{" "}
            <span className="font-mono font-semibold text-[#D9F938]">
              {formatCurrency(totalBalanceMinor, defaultCurrency)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {wallets.length > 1 && (
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-0.5">
              <button
                type="button"
                onClick={handleCyclePrev}
                aria-label="Previous card"
                className="grid h-7 w-7 place-items-center rounded-full text-neutral-400 transition hover:bg-white/10 hover:text-white active:scale-95"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleCycleNext}
                aria-label="Next card"
                className="grid h-7 w-7 place-items-center rounded-full text-neutral-400 transition hover:bg-white/10 hover:text-white active:scale-95"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingWallet(null);
              setWalletModalOpen(true);
            }}
            aria-label="Add new card or wallet"
            className="flex items-center gap-1.5 rounded-xl bg-[#D9F938] px-3 py-1.5 text-xs font-bold text-[#070806] transition hover:brightness-110 active:scale-95"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">Add Card</span>
          </button>
        </div>
      </div>

      {/* Stacked Cards Canvas */}
      {wallets.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center backdrop-blur-xl">
          <p className="text-sm text-neutral-400">No custom wallets created yet.</p>
          <button
            type="button"
            onClick={() => {
              setEditingWallet(null);
              setWalletModalOpen(true);
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#D9F938]/40 bg-[#D9F938]/10 px-4 py-2 text-xs font-semibold text-[#D9F938] transition hover:bg-[#D9F938]/20"
          >
            + Create your first card
          </button>
        </div>
      ) : (
        <div className="relative pt-1 select-none">
          {/* Card stack viewport container with standard physical card aspect ratio (ISO/IEC 7810 ID-1: 85.6mm x 53.98mm) */}
          <div
            className="relative mx-auto w-full max-w-[420px] aspect-[85.6/53.98] touch-pan-y cursor-grab active:cursor-grabbing"
            style={{
              marginBottom: wallets.length > 2 ? "38px" : wallets.length > 1 ? "22px" : "8px",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {wallets.map((wallet, idx) => {
              // Calculate stack offset relative to active card
              const offset = (idx - safeIndex + wallets.length) % wallets.length;

              // Only render up to top 3 visible stacked cards for peak performance
              if (offset > 2) {
                return (
                  <div
                    key={wallet.id}
                    className="pointer-events-none absolute inset-0 opacity-0"
                    aria-hidden="true"
                  />
                );
              }

              const isTop = offset === 0;
              const isSecond = offset === 1;
              const isThird = offset === 2;

              // Physical stack resting transformations
              let translateY = 0;
              let scale = 1;
              let zIndex = 30;
              let opacity = 1;
              let overlayOpacity = 0;

              if (isTop) {
                translateY = 0;
                scale = 1;
                zIndex = 30;
                opacity = 1;
                overlayOpacity = 0;
              } else if (isSecond) {
                translateY = 18;
                scale = 0.94;
                zIndex = 20;
                opacity = 0.92;
                overlayOpacity = 0.22;
              } else if (isThird) {
                translateY = 36;
                scale = 0.88;
                zIndex = 10;
                opacity = 0.72;
                overlayOpacity = 0.45;
              }

              return (
                <div
                  key={wallet.id}
                  ref={(el) => {
                    if (isTop) topCardRef.current = el;
                    else if (isSecond) secondCardRef.current = el;
                  }}
                  className="absolute inset-0"
                  style={{
                    transform: `translate3d(0, ${translateY}px, 0) scale(${scale}) rotate(0deg)`,
                    zIndex,
                    opacity,
                    transition:
                      "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease",
                    willChange: "transform",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <PhysicalWalletCard
                    wallet={wallet}
                    index={idx}
                    interactive={!isTop}
                    isStacked={!isTop}
                    onClick={() => {
                      if (!isTop && !hasMovedRef.current) {
                        setActiveIndex(idx);
                      }
                    }}
                    className={isTop ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
                    style={{
                      boxShadow: isTop
                        ? "0 20px 38px -10px rgba(0,0,0,0.85), inset 0 1px 1px 0 rgba(255,255,255,0.22)"
                        : "0 10px 20px -8px rgba(0,0,0,0.65), inset 0 1px 1px 0 rgba(255,255,255,0.12)",
                    }}
                  />
                  {/* Hardware-accelerated dimming overlay for stacked cards (replaces costly CSS filter: brightness) */}
                  <div
                    className="pointer-events-none absolute inset-0 z-30 rounded-[18px] sm:rounded-[22px] bg-black transition-opacity duration-300"
                    style={{ opacity: overlayOpacity }}
                    aria-hidden="true"
                  />
                </div>
              );
            })}
          </div>

          {/* Drag instruction & pagination dots */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              {/* Mobile: horizontal swipe indicator */}
              <svg className="h-3.5 w-3.5 text-[#D9F938] shrink-0 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              {/* Desktop: vertical/horizontal drag indicator */}
              <svg className="h-3.5 w-3.5 text-[#D9F938] shrink-0 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
              <span className="hidden sm:inline">Drag or swipe cards to cycle</span>
              <span className="sm:hidden">Swipe left/right or tap to cycle</span>
            </div>

            {/* Pagination dots & Edit Card Button */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1">
                {wallets.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    aria-label={`Jump to card ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === safeIndex ? "w-4 bg-[#D9F938]" : "w-1.5 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>

              {currentWallet && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingWallet(currentWallet);
                    setWalletModalOpen(true);
                  }}
                  className="text-xs font-semibold text-neutral-400 hover:text-white transition shrink-0"
                >
                  Edit Card
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {walletModalOpen && (
        <WalletFormModal
          wallet={editingWallet}
          defaultCurrency={defaultCurrency}
          onClose={() => {
            setWalletModalOpen(false);
            setEditingWallet(null);
          }}
          onSave={async (saved) => {
            await saveWalletMutation.mutateAsync(saved);
            setWalletModalOpen(false);
            setEditingWallet(null);
          }}
        />
      )}
    </section>
  );
}
