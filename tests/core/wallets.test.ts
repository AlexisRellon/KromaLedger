import { describe, it, expect } from "vitest";
import { walletSchema } from "../../src/core/models";
import { WALLET_PALETTES, getWalletPalette, hexToRgb } from "../../src/ui/components/WalletFormModal";

describe("Wallets and Stacked Deck palettes", () => {
  it("validates a standard wallet record correctly", () => {
    const valid = walletSchema.parse({
      id: "wallet-test",
      name: "BDO Checking",
      type: "BANK",
      currency: "PHP",
      balanceMinor: 250000,
      color: "#6366F1",
      institution: "BDO",
      accountNumber: "•• 4019",
      isDefault: true,
    });
    expect(valid.name).toBe("BDO Checking");
    expect(valid.balanceMinor).toBe(250000);
    expect(valid.isDefault).toBe(true);
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
    expect(custom.style?.background).toContain("linear-gradient");
    expect(custom.style?.borderColor).toContain("rgba(59, 130, 246, 0.35)");
  });

  it("parses 3-digit and 6-digit hex values accurately", () => {
    expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("#D9F938")).toEqual({ r: 217, g: 249, b: 56 });
    expect(hexToRgb("invalid")).toBeNull();
  });
});
