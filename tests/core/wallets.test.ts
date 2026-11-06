import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { walletSchema } from "../../src/core/models";
import { WALLET_PALETTES, getWalletPalette, hexToRgb } from "../../src/ui/components/WalletFormModal";
import { PhysicalWalletCard, WALLET_PATTERNS, WalletPatternDefs, resolveWalletPattern } from "../../src/ui/components/PhysicalWalletCard";
import { getLogoDevUrl, matchPhInstitution, PH_INSTITUTIONS, resolveCardNetwork } from "../../src/ui/components/phInstitutionLogos";

describe("Wallets and Stacked Deck palettes", () => {
  it("validates a standard wallet record correctly", () => {
    const valid = walletSchema.parse({
      id: "wallet-test",
      name: "BDO Checking",
      type: "BANK",
      currency: "PHP",
      balanceMinor: 250000,
      color: "#6366F1",
      pattern: "SOLIHIYA",
      institution: "BDO",
      accountNumber: "•• 4019",
      isDefault: true,
    });
    expect(valid.name).toBe("BDO Checking");
    expect(valid.balanceMinor).toBe(250000);
    expect(valid.pattern).toBe("SOLIHIYA");
    expect(valid.isDefault).toBe(true);

    const yakanWallet = walletSchema.parse({
      id: "wallet-yakan",
      name: "Maya Vault",
      type: "E_WALLET",
      currency: "PHP",
      balanceMinor: 50000,
      color: "#10B981",
      pattern: "YAKAN",
    });
    expect(yakanWallet.pattern).toBe("YAKAN");
  });

  it("supports all 6 neobrutalist grid patterns and auto-varies when unspecified", () => {
    expect(WALLET_PATTERNS.map((p) => p.id)).toEqual(["LEDGER", "SOLIHIYA", "BAUHAUS", "ISOMETRIC", "YAKAN", "IBALOI"]);
    expect(
      resolveWalletPattern({ id: "w-1", type: "BANK", pattern: "BAUHAUS" }, 0)
    ).toBe("BAUHAUS");
    expect(
      resolveWalletPattern({ id: "w-yakan", type: "BANK", pattern: "YAKAN" }, 0)
    ).toBe("YAKAN");
    expect(
      resolveWalletPattern({ id: "w-ibaloi", type: "BANK", pattern: "IBALOI" }, 0)
    ).toBe("IBALOI");
    const autoSet = new Set(
      [0, 1, 2, 3].map((idx) => resolveWalletPattern({ id: `w-${idx}`, type: "BANK" }, idx))
    );
    expect(autoSet.size).toBeGreaterThanOrEqual(3);
  });

  it("renders distinct visible pattern overlay for each card grid pattern choice and preserves weaveVariant override", () => {
    const patterns = ["LEDGER", "SOLIHIYA", "BAUHAUS", "ISOMETRIC", "YAKAN", "IBALOI"] as const;
    const renderedFills = patterns.map((pat) => {
      const html = renderToStaticMarkup(
        createElement(PhysicalWalletCard, {
          wallet: {
            id: `test-${pat}`,
            name: `${pat} Card`,
            type: "BANK",
            currency: "PHP",
            balanceMinor: 100000,
            color: "#D9F938",
            pattern: pat,
            isDefault: false,
          },
        })
      );
      expect(html).toContain(`data-card-pattern="${pat}"`);
      const expectedFill =
        pat === "YAKAN"
          ? "url(#pattern-yakan-diamond)"
          : `url(#pattern-card-${pat.toLowerCase()})`;
      expect(html).toContain(expectedFill);
      return expectedFill;
    });

    expect(new Set(renderedFills).size).toBe(6);

    // Focused regression assert: selecting Yakan in default grid mode renders shared pattern id
    const yakanGridHtml = renderToStaticMarkup(
      createElement(PhysicalWalletCard, {
        wallet: {
          id: "test-yakan-default-grid",
          name: "Yakan Grid Card",
          type: "BANK",
          currency: "PHP",
          balanceMinor: 100000,
          color: "#D9F938",
          pattern: "YAKAN",
          isDefault: false,
        },
      })
    );
    expect(yakanGridHtml).toContain('data-card-pattern="YAKAN"');
    expect(yakanGridHtml).toContain('data-card-weave="none"');
    expect(yakanGridHtml).toContain('url(#pattern-yakan-diamond)');

    const yakanHtml = renderToStaticMarkup(
      createElement(PhysicalWalletCard, {
        wallet: {
          id: "test-yakan",
          name: "Yakan Weave",
          type: "BANK",
          currency: "PHP",
          balanceMinor: 100000,
          color: "#D9F938",
          pattern: "LEDGER",
          isDefault: false,
        },
        weaveVariant: "yakan",
      })
    );
    expect(yakanHtml).toContain('url(#pattern-yakan-diamond)');
    expect(yakanHtml).toContain('data-card-weave="yakan"');

    const noneHtml = renderToStaticMarkup(
      createElement(PhysicalWalletCard, {
        wallet: {
          id: "test-none",
          name: "No Weave",
          type: "BANK",
          currency: "PHP",
          balanceMinor: 100000,
          color: "#D9F938",
          pattern: "LEDGER",
          isDefault: false,
        },
        weaveVariant: "none",
      })
    );
    expect(noneHtml).not.toContain('url(#pattern-');
    expect(noneHtml).toContain('data-card-weave="none"');

    const defsHtml = renderToStaticMarkup(createElement(WalletPatternDefs));
    expect(defsHtml).toContain('id="pattern-card-ledger"');
    expect(defsHtml).toContain('id="pattern-card-solihiya"');
    expect(defsHtml).toContain('id="pattern-card-bauhaus"');
    expect(defsHtml).toContain('id="pattern-card-isometric"');
    expect(defsHtml).toContain('id="pattern-card-yakan"');
    expect(defsHtml).toContain('id="pattern-card-ibaloi"');
    expect(defsHtml).not.toContain('id="pattern-yakan-diamond"');
  });

  it("renders visible patterns on dark cards and in dark mode", () => {
    const darkWalletHtml = renderToStaticMarkup(
      createElement(PhysicalWalletCard, {
        wallet: {
          id: "dark-yakan-wallet",
          name: "Vault Yakan",
          type: "BANK",
          currency: "PHP",
          balanceMinor: 500000,
          color: "#18181B",
          pattern: "YAKAN",
          isDefault: true,
        },
      })
    );
    expect(darkWalletHtml).toContain('id="pattern-yakan-diamond"');
    expect(darkWalletHtml).toContain('text-white');
    expect(darkWalletHtml).toContain('color:#FFFFFF');

    const lightWalletHtml = renderToStaticMarkup(
      createElement(PhysicalWalletCard, {
        wallet: {
          id: "light-yakan-wallet",
          name: "Light Yakan",
          type: "BANK",
          currency: "PHP",
          balanceMinor: 500000,
          color: "#FAF8F5",
          pattern: "YAKAN",
          isDefault: true,
        },
      })
    );
    expect(lightWalletHtml).toContain('id="pattern-yakan-diamond"');
    expect(lightWalletHtml).toContain('text-[#18181B]');
    expect(lightWalletHtml).toContain('color:#18181B');

    // Regression test for Ibaloi Zigzag on yellow (e.g. MariBank) vs dark cards
    const mariBankIbaloiHtml = renderToStaticMarkup(
      createElement(PhysicalWalletCard, {
        wallet: {
          id: "maribank-ibaloi-wallet",
          name: "MariBank",
          type: "BANK",
          currency: "PHP",
          balanceMinor: 786437,
          color: "#FDE68A",
          pattern: "IBALOI",
          isDefault: true,
        },
      })
    );
    expect(mariBankIbaloiHtml).toContain('id="pattern-card-ibaloi"');
    expect(mariBankIbaloiHtml).toContain('color:#18181B');
    expect(mariBankIbaloiHtml).toContain('text-[#18181B]');

    const darkIbaloiHtml = renderToStaticMarkup(
      createElement(PhysicalWalletCard, {
        wallet: {
          id: "dark-ibaloi-wallet",
          name: "Dark Vault",
          type: "BANK",
          currency: "PHP",
          balanceMinor: 786437,
          color: "#18181B",
          pattern: "IBALOI",
          isDefault: false,
        },
      })
    );
    expect(darkIbaloiHtml).toContain('id="pattern-card-ibaloi"');
    expect(darkIbaloiHtml).toContain('color:#FFFFFF');
    expect(darkIbaloiHtml).toContain('text-white');
  });

  it("contains rich luxury gradients in WALLET_PALETTES", () => {
    expect(WALLET_PALETTES.length).toBeGreaterThanOrEqual(6);
    const volt = WALLET_PALETTES.find((p) => p.name === "Electric Volt");
    expect(volt).toBeDefined();
    expect(volt?.gradient).toContain("from-");
    expect(volt?.border).toContain("border-");
  });

  it("resolves preset palettes for matched colors", () => {
    const palette = getWalletPalette("#D9F938");
    expect(palette.name).toBe("Electric Volt");
    expect(palette.hex).toBe("#D9F938");
  });

  it("generates custom dark gradient styles for user-selected colors", () => {
    const custom = getWalletPalette("#3B82F6");
    expect(custom.name).toBe("Custom Color");
    expect(custom.hex).toBe("#3B82F6");
    expect(custom.style?.backgroundImage).toContain("linear-gradient");
    expect(custom.style?.borderColor).toContain("rgba(59, 130, 246, 0.35)");
  });

  it("parses 3-digit and 6-digit hex values accurately", () => {
    expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("#D9F938")).toEqual({ r: 217, g: 249, b: 56 });
    expect(hexToRgb("invalid")).toBeNull();
  });

  it("matches Philippine banks and e-wallets brandmarks and builds Logo.dev CDN URLs", () => {
    expect(PH_INSTITUTIONS.length).toBeGreaterThanOrEqual(15);
    expect(matchPhInstitution("GCash")?.id).toBe("gcash");
    expect(matchPhInstitution("Maya")?.id).toBe("maya");
    expect(matchPhInstitution("GoTyme")?.id).toBe("gotyme");
    expect(matchPhInstitution("MariBank")?.id).toBe("maribank");
    expect(matchPhInstitution("SeaBank")?.id).toBe("maribank");
    expect(matchPhInstitution("BDO")?.id).toBe("bdo");
    expect(matchPhInstitution("BPI")?.id).toBe("bpi");
    expect(matchPhInstitution(undefined, "My UnionBank Savings")?.id).toBe("unionbank");

    expect(getLogoDevUrl("GCash", undefined, "pk_test123")).toBe(
      "https://img.logo.dev/gcash.com?size=128&format=png&retina=true&fallback=404&token=pk_test123"
    );
    expect(getLogoDevUrl("MariBank", undefined, "pk_test123")).toBe(
      "https://img.logo.dev/seabank.ph?size=128&format=png&retina=true&fallback=404&token=pk_test123"
    );
    expect(getLogoDevUrl("EastWest", undefined, "pk_test123")).toBe(
      "https://img.logo.dev/eastwestbanker.com?size=128&format=png&retina=true&fallback=404&token=pk_test123"
    );
    expect(getLogoDevUrl("Custom Rural Bank", undefined, "pk_test123")).toBe(
      "https://img.logo.dev/name/Custom%20Rural%20Bank?size=128&format=png&retina=true&fallback=404&token=pk_test123"
    );
  });

  it("renders Visa/Mastercard networks with account number and hides account number when network is NONE", () => {
    const visaHtml = renderToStaticMarkup(
      createElement(PhysicalWalletCard, {
        wallet: {
          id: "w-visa",
          name: "GCash Card",
          type: "E_WALLET",
          currency: "PHP",
          balanceMinor: 275344,
          color: "#007DFE",
          institution: "GCash",
          accountNumber: "4515",
          cardNetwork: "VISA",
          isDefault: false,
        },
      })
    );
    expect(visaHtml).toContain("4515");
    expect(visaHtml).toContain('aria-label="Visa network"');

    const noneHtml = renderToStaticMarkup(
      createElement(PhysicalWalletCard, {
        wallet: {
          id: "w-none",
          name: "Cash Vault",
          type: "E_WALLET",
          currency: "PHP",
          balanceMinor: 275344,
          color: "#10B981",
          institution: "Maya",
          accountNumber: "4515",
          cardNetwork: "NONE",
          isDefault: false,
        },
      })
    );
    expect(noneHtml).not.toContain("4515");
    expect(noneHtml).not.toContain('aria-label="Visa network"');
    expect(noneHtml).not.toContain('aria-label="Mastercard network"');
    expect(resolveCardNetwork({ type: "CASH", name: "Vault" })).toBe("NONE");
  });
});
