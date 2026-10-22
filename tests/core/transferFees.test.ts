import { describe, expect, it } from "vitest";
import {
  findFeeRule,
  detectTransferFee,
  lookupTransferFee,
  parseTransferRouteFromText,
} from "../../src/core/engine/transferFees";

describe("bank transfer fee chart engine with regex origin to destination check", () => {
  it("auto detects fees with regex disregarding capitalization", () => {
    expect(lookupTransferFee("maribank", "gcash", "INSTAPAY")).toBe(0);
    expect(lookupTransferFee("MARIBANK", "GCASH", "INSTAPAY")).toBe(0);
    expect(lookupTransferFee("mArIbAnK", "gCaSh", "INSTAPAY")).toBe(0);

    expect(lookupTransferFee("gcash", "maribank", "INSTAPAY")).toBe(1000);
    expect(lookupTransferFee("GCASH", "MARIBANK", "INSTAPAY")).toBe(1000);
    expect(lookupTransferFee("maya", "gcash", "INSTAPAY")).toBe(1000);
    expect(lookupTransferFee("MAYA", "BDO", "INSTAPAY")).toBe(1000);
  });

  it("auto detects same-institution transfer as FREE (net zero fee)", () => {
    const gcashToGcash = detectTransferFee({ origin: "GCash Wallet", destination: "Secondary GCash" });
    expect(gcashToGcash.feeMinor).toBe(0);
    expect(gcashToGcash.isSameInstitution).toBe(true);

    const mayaToMaya = detectTransferFee({ origin: "maya", destination: "paymaya" });
    expect(mayaToMaya.feeMinor).toBe(0);
    expect(mayaToMaya.isSameInstitution).toBe(true);

    const bdoToBdo = detectTransferFee({ origin: "BDO Checking", destination: "BDO Savings" });
    expect(bdoToBdo.feeMinor).toBe(0);
    expect(bdoToBdo.isSameInstitution).toBe(true);
  });

  it("auto detects cross-institution origin to destination fees accurately", () => {
    // MariBank to GCash -> FREE
    const mariToGcash = detectTransferFee({ origin: "MariBank", destination: "GCash" });
    expect(mariToGcash.feeMinor).toBe(0);
    expect(mariToGcash.reason).toContain("FREE");

    // GCash to MariBank -> ₱10.00
    const gcashToMari = detectTransferFee({ origin: "GCash", destination: "MariBank" });
    expect(gcashToMari.feeMinor).toBe(1000);

    // PalawanPay to BDO -> ₱5.00
    const palawanToBdo = detectTransferFee({ origin: "PalawanPay", destination: "BDO" });
    expect(palawanToBdo.feeMinor).toBe(500);

    // Tonik to Maya -> ₱8.00
    const tonikToMaya = detectTransferFee({ origin: "Tonik Bank", destination: "Maya" });
    expect(tonikToMaya.feeMinor).toBe(800);

    // DBP PESONet to GCash -> ₱10.00; InstaPay is FREE
    expect(lookupTransferFee("DBP", "GCash", "PESONET")).toBe(1000);
    expect(lookupTransferFee("DBP", "GCash", "INSTAPAY")).toBe(0);
  });

  it("extracts route from title text regex disregarding capitalization", () => {
    expect(parseTransferRouteFromText("Transfer from MariBank to GCash")).toEqual({
      origin: "MariBank",
      destination: "GCash",
    });

    expect(parseTransferRouteFromText("transfer funds from gcash to maribank")).toEqual({
      origin: "gcash",
      destination: "maribank",
    });

    expect(parseTransferRouteFromText("MariBank -> Maya")).toEqual({
      origin: "MariBank",
      destination: "Maya",
    });

    // Cash-in regex
    expect(parseTransferRouteFromText("Cash-in GCash from MariBank")).toEqual({
      destination: "GCash",
      origin: "MariBank",
    });

    expect(parseTransferRouteFromText("Cash in to GCash via Maya")).toEqual({
      destination: "GCash",
      origin: "Maya",
    });
  });

  it("resolves transfer fee directly from text description", () => {
    expect(lookupTransferFee("Transfer from MariBank to GCash")).toBe(0);
    expect(lookupTransferFee("Transfer from GCash to MariBank")).toBe(1000);
    expect(lookupTransferFee("Cash-in GCash from Maya")).toBe(1000);
    expect(lookupTransferFee("Cash-in GCash from MariBank")).toBe(0);
    expect(lookupTransferFee("Transfer GCash to GCash")).toBe(0);
  });

  it("finds rules with aliases and includes notes", () => {
    const gotyme = findFeeRule("gotyme bank");
    expect(gotyme).toBeDefined();
    expect(gotyme?.notes).toContain("20 monthly");
  });
});
