import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonBadge,
  SkeletonButton,
  SkeletonCard,
} from "../../src/ui/primitives/Skeleton";
import {
  DashboardSkeleton,
  WalletsSkeleton,
  PendingSkeleton,
  SettingsSkeleton,
  ScreenSkeleton,
} from "../../src/ui/components/skeletons";

describe("Skeleton Primitives", () => {
  it("renders base skeleton with subtle shimmer class and accessibility attribute", () => {
    const html = renderToStaticMarkup(createElement(Skeleton, { className: "h-6 w-32" }));
    expect(html).toContain('class="border border-white/[0.04] bg-white/[0.05] skeleton-shimmer rounded-xl h-6 w-32"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("can disable shimmer animation when animate is false", () => {
    const html = renderToStaticMarkup(
      createElement(Skeleton, { className: "h-4 w-20", animate: false })
    );
    expect(html).not.toContain("skeleton-shimmer");
  });

  it("renders multi-line SkeletonText with customized line count and last line width", () => {
    const html = renderToStaticMarkup(
      createElement(SkeletonText, { lines: 3, lastLineWidth: "50%" })
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('style="width:50%"');
  });

  it("renders SkeletonCircle with rounded-full and explicit dimension", () => {
    const html = renderToStaticMarkup(
      createElement(SkeletonCircle, { size: 48, className: "custom-circle" })
    );
    expect(html).toContain("rounded-full");
    expect(html).toContain("width:48px");
    expect(html).toContain("height:48px");
  });

  it("renders SkeletonBadge with rounded pill and border", () => {
    const html = renderToStaticMarkup(createElement(SkeletonBadge));
    expect(html).toContain("rounded-full");
    expect(html).toContain("border border-white/10");
  });

  it("renders SkeletonButton with volt-accented styling", () => {
    const html = renderToStaticMarkup(createElement(SkeletonButton));
    expect(html).toContain("border border-[#D9F938]/20 bg-[#D9F938]/[0.08]");
  });

  it("renders SkeletonCard matching SmokedCard glass styling", () => {
    const html = renderToStaticMarkup(
      createElement(SkeletonCard, {}, createElement("span", null, "content"))
    );
    expect(html).toContain("rounded-3xl border border-white/[.08] bg-white/[.035]");
    expect(html).toContain("backdrop-blur-xl");
  });
});

describe("Screen Skeleton Layouts", () => {
  it("renders DashboardSkeleton mirroring the HomeDashboard 2-column layout and cards", () => {
    const html = renderToStaticMarkup(createElement(DashboardSkeleton));
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Loading dashboard overview"');
    // Verify 2-column layout
    expect(html).toContain("lg:grid-cols-[1.25fr_.75fr]");
    // Verify financial hero placeholders
    expect(html).toContain("h-12 w-64");
    // Verify cashflow breakdown bars and timeframe pills
    expect(html).toContain("border-[#D9F938]/20 bg-[#D9F938]/10");
    // Verify stacked wallet card deck aspect ratio
    expect(html).toContain("aspect-[85.6/53.98]");
    // Verify monthly burn ring and category progress bars
    expect(html).toContain("border-[10px] border-white/[0.07]");
  });

  it("renders WalletsSkeleton mirroring WalletsScreen", () => {
    const html = renderToStaticMarkup(createElement(WalletsSkeleton));
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Loading wallets overview"');
    expect(html).toContain("lg:grid-cols-[1.1fr_0.9fr]");
  });

  it("renders PendingSkeleton mirroring PendingAndSubsHub", () => {
    const html = renderToStaticMarkup(createElement(PendingSkeleton));
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Loading commitments and pending obligations"');
    expect(html).toContain("md:grid-cols-2");
  });

  it("renders SettingsSkeleton mirroring SettingsScreen", () => {
    const html = renderToStaticMarkup(createElement(SettingsSkeleton));
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Loading settings and vault profile"');
  });

  it("ScreenSkeleton correctly routes to the respective screen skeleton based on tab prop", () => {
    const homeHtml = renderToStaticMarkup(createElement(ScreenSkeleton, { tab: "HOME" }));
    expect(homeHtml).toContain('aria-label="Loading dashboard overview"');

    const walletsHtml = renderToStaticMarkup(createElement(ScreenSkeleton, { tab: "WALLETS" }));
    expect(walletsHtml).toContain('aria-label="Loading wallets overview"');

    const pendingHtml = renderToStaticMarkup(createElement(ScreenSkeleton, { tab: "PENDING" }));
    expect(pendingHtml).toContain('aria-label="Loading commitments and pending obligations"');

    const settingsHtml = renderToStaticMarkup(createElement(ScreenSkeleton, { tab: "SETTINGS" }));
    expect(settingsHtml).toContain('aria-label="Loading settings and vault profile"');
  });
});
