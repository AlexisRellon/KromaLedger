import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useUIStore } from "../../state/useUIStore";

export function FloatingNavPill() {
  const active = useUIStore((s) => s.activeNavTab);
  const setTab = useUIStore((s) => s.setTab);
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  const navRef = useRef<HTMLElement>(null);

  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    ready: boolean;
  }>({ left: 0, top: 0, width: 0, height: 0, ready: false });

  const updateIndicator = () => {
    const container = navRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLButtonElement>('[data-active="true"]');
    if (activeBtn) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        top: activeBtn.offsetTop,
        width: activeBtn.offsetWidth,
        height: activeBtn.offsetHeight,
        ready: true,
      });
    }
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [active]);

  useEffect(() => {
    updateIndicator();
    const container = navRef.current;
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && container) {
      observer = new ResizeObserver(() => {
        updateIndicator();
      });
      observer.observe(container);
    }
    window.addEventListener("resize", updateIndicator);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [active]);

  return (
    <nav
      ref={navRef}
      aria-label="Main navigation"
      className="fixed bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.75rem))] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 sm:gap-2.5 rounded-full border border-white/10 bg-[#11120f]/95 p-2 sm:p-2.5 shadow-2xl backdrop-blur-xl touch-manipulation"
    >
      {/* Smooth gliding active tab highlight pill */}
      {indicatorStyle.ready && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full bg-[#D9F938] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm shadow-black/40 motion-reduce:transition-none"
          style={{
            left: `${indicatorStyle.left}px`,
            top: `${indicatorStyle.top}px`,
            width: `${indicatorStyle.width}px`,
            height: `${indicatorStyle.height}px`,
          }}
        />
      )}


      <button
        onClick={() => setTab("HOME")}
        data-active={active === "HOME"}
        aria-current={active === "HOME" ? "page" : undefined}
        aria-label="Overview"
        title="Overview"
        className={`relative z-10 flex h-12 min-h-[48px] min-w-[48px] items-center justify-center gap-2 rounded-full px-3.5 text-xs sm:text-sm tracking-wide transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9F938] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11120f] lg:px-5 lg:py-3 ${
          active === "HOME" ? "font-semibold text-[#070806]" : "font-medium text-neutral-400 hover:text-white"
        }`}
      >
        <svg className="h-6 w-6 shrink-0 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
        </svg>
        <span className="hidden lg:inline">Overview</span>
      </button>

      <button
        onClick={() => setTab("WALLETS")}
        data-active={active === "WALLETS"}
        aria-current={active === "WALLETS" ? "page" : undefined}
        aria-label="Wallets"
        title="Wallets"
        className={`relative z-10 flex h-12 min-h-[48px] min-w-[48px] items-center justify-center gap-2 rounded-full px-3.5 text-xs sm:text-sm tracking-wide transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9F938] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11120f] lg:px-5 lg:py-3 ${
          active === "WALLETS" ? "font-semibold text-[#070806]" : "font-medium text-neutral-400 hover:text-white"
        }`}
      >
        <svg className="h-6 w-6 shrink-0 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
        </svg>
        <span className="hidden lg:inline">Wallets</span>
      </button>

      <button
        onClick={() => openQuickAdd("EXPENSE")}
        aria-label="New entry"
        title="New entry"
        className="relative z-20 -my-4 -translate-y-3 sm:-translate-y-4 flex h-16 w-16 sm:h-[68px] sm:w-[68px] shrink-0 items-center justify-center rounded-full border-4 border-[#11120f] bg-[#D9F938] text-[#070806] shadow-[0_12px_28px_-6px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.45)] transition-all duration-200 hover:scale-105 active:scale-95 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9F938] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11120f]"
      >
        <svg className="h-7 w-7 stroke-[2.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      <button
        onClick={() => setTab("PENDING")}
        data-active={active === "PENDING"}
        aria-current={active === "PENDING" ? "page" : undefined}
        aria-label="Upcoming"
        title="Upcoming"
        className={`relative z-10 flex h-12 min-h-[48px] min-w-[48px] items-center justify-center gap-2 rounded-full px-3.5 text-xs sm:text-sm tracking-wide transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9F938] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11120f] lg:px-5 lg:py-3 ${
          active === "PENDING" ? "font-semibold text-[#070806]" : "font-medium text-neutral-400 hover:text-white"
        }`}
      >
        <svg className="h-6 w-6 shrink-0 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <span className="hidden lg:inline">Upcoming</span>
      </button>

      <button
        onClick={() => setTab("SETTINGS")}
        data-active={active === "SETTINGS"}
        aria-current={active === "SETTINGS" ? "page" : undefined}
        aria-label="Settings"
        title="Settings"
        className={`relative z-10 flex h-12 min-h-[48px] min-w-[48px] items-center justify-center gap-2 rounded-full px-3.5 text-xs sm:text-sm tracking-wide transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9F938] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11120f] lg:px-5 lg:py-3 ${
          active === "SETTINGS" ? "font-semibold text-[#070806]" : "font-medium text-neutral-400 hover:text-white"
        }`}
      >
        <svg className="h-6 w-6 shrink-0 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
        <span className="hidden lg:inline">Settings</span>
      </button>
    </nav>
  );
}
