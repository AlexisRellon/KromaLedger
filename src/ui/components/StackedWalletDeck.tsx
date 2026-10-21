import { useState, useRef, useMemo } from "react";
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
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const startYRef = useRef(0);
  const saveWalletMutation = useSaveWallet();

  const totalBalanceMinor = useMemo(
    () => wallets.reduce((sum, w) => sum + w.balanceMinor, 0),
    [wallets]
  );

  // Safe active index in case wallets count changes
  const safeIndex = wallets.length > 0 ? activeIndex % wallets.length : 0;
  const currentWallet = wallets[safeIndex];

  const handlePointerDown = (e: React.PointerEvent) => {
    if (wallets.length <= 1) return;
    startYRef.current = e.clientY;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startYRef.current;
    // Apply slight dampening for a tactile feel
    setDragY(deltaY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(false);

    const threshold = 45;
    if (dragY < -threshold) {
      // Dragged UP -> cycle forward
      setActiveIndex((prev) => (prev + 1) % wallets.length);
    } else if (dragY > threshold) {
      // Dragged DOWN -> cycle backward
      setActiveIndex((prev) => (prev - 1 + wallets.length) % wallets.length);
    }
    setDragY(0);
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
            className="relative mx-auto w-full max-w-[420px] aspect-[85.6/53.98] touch-pan-x cursor-grab active:cursor-grabbing"
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

              // Physical stack transformations
              let translateY = 0;
              let scale = 1;
              let zIndex = 30;
              let opacity = 1;
              let filter = "brightness(1)";

              if (isTop) {
                translateY = dragY;
                scale = 1 - Math.min(Math.abs(dragY) * 0.0008, 0.08);
                zIndex = 30;
                opacity = 1;
              } else if (isSecond) {
                const dragInfluence = isDragging && dragY < 0 ? Math.min(Math.abs(dragY) * 0.25, 14) : 0;
                translateY = 18 - dragInfluence;
                scale = 0.94 + (dragInfluence / 14) * 0.06;
                zIndex = 20;
                opacity = 0.9;
                filter = "brightness(0.78)";
              } else if (isThird) {
                translateY = 36;
                scale = 0.88;
                zIndex = 10;
                opacity = 0.68;
                filter = "brightness(0.55)";
              }

              const rotate = isTop && isDragging ? `${dragY * 0.035}deg` : "0deg";

              return (
                <div
                  key={wallet.id}
                  className="absolute inset-0"
                  style={{
                    transform: `translate3d(0, ${translateY}px, 0) scale(${scale}) rotate(${rotate})`,
                    zIndex,
                    opacity,
                    filter,
                    transition: isDragging
                      ? "none"
                      : "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease, filter 0.45s ease",
                  }}
                >
                  <PhysicalWalletCard
                    wallet={wallet}
                    index={idx}
                    interactive={!isTop}
                    isStacked={!isTop}
                    onClick={() => {
                      if (!isTop && !isDragging) {
                        setActiveIndex(idx);
                      }
                    }}
                    className={isTop ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
                    style={{
                      boxShadow: isTop
                        ? "0 26px 50px -12px rgba(0,0,0,0.9), inset 0 1px 1px 0 rgba(255,255,255,0.22)"
                        : "0 12px 28px -10px rgba(0,0,0,0.7), inset 0 1px 1px 0 rgba(255,255,255,0.12)",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Drag instruction & pagination dots */}
          <div className="mt-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <svg className="h-3.5 w-3.5 text-[#D9F938]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
              <span>Drag up or down to cycle cards</span>
            </div>

            {/* Pagination dots & Edit Card Button */}
            <div className="flex items-center gap-3">
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
                  className="text-xs font-semibold text-neutral-400 hover:text-white transition"
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
