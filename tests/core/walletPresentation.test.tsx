import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PresentationProvider, type PresentationComponents } from "../../src/state/presentation/PresentationContext";
import { WalletOverviewPanel } from "../../src/state/presentation/WalletOverviewPanel";

const components: PresentationComponents = {
  Box: ({ children, surface }) => createElement("section", { "data-surface": surface }, children),
  Text: ({ children, as = "span", tone }) => createElement(as, { "data-tone": tone }, children),
  Button: ({ children, onPress, accessibilityLabel }) => createElement("button", { onClick: onPress, "aria-label": accessibilityLabel }, children),
  Icon: ({ name, label }) => createElement("span", { "data-icon": name, "aria-label": label }),
  Input: () => createElement("input"),
  Modal: ({ children }) => createElement("div", { role: "dialog" }, children),
};

describe("portable wallet presentation", () => {
  it("renders the wallet summary through accessible semantic components", () => {
    const view = createElement(PresentationProvider, { components },
      createElement(WalletOverviewPanel, {
        walletCount: 2,
        primaryWalletName: "Daily cash",
        totalBalanceMinor: 1234567,
        currency: "PHP",
        onAddWallet: () => {},
      }));
    const html = renderToStaticMarkup(view);
    expect(html).toContain("Liquid Wallets &amp; Accounts");
    expect(html).toContain("Daily cash");
    expect(html).toContain("12,345.67");
    expect(html).toContain('aria-label="Add New Card"');
    expect(html).toContain('data-icon="plus"');
  });
});
