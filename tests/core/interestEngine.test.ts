import { describe, expect, it } from "vitest";
import {
  calculatePeriodInterest,
  estimateMonthlyAccruedMinor,
  evaluateInterestRules,
} from "../../src/core/engine/interestEngine";
import {
  addDaysManila,
  getTodayManila,
  msUntilNextManilaMidnight,
} from "../../src/core/engine/manilaDate";
import { matchBankPreset } from "../../src/core/engine/phBankRegistry";
import { interestRuleSchema, type InterestRule, type Wallet } from "../../src/core/models";

const makeWallet = (overrides: Partial<Wallet> = {}): Wallet => ({
  id: "w_mari",
  name: "MariBank Savings",
  institution: "MariBank",
  type: "BANK",
  currency: "PHP",
  balanceMinor: 12_000_000, // ₱120,000.00
  color: "#FF6B00",
  isDefault: false,
  ...overrides,
});

const makeMariRule = (overrides: Partial<InterestRule> = {}): InterestRule => ({
  id: "rule_mari",
  walletId: "w_mari",
  enabled: true,
  presetId: "ph-maribank",
  presetVersion: 1,
  tiers: [
    { upToMinor: 10_000_000, rateBps: 325 },
    { upToMinor: null, rateBps: 375 },
  ],
  tierMode: "MARGINAL",
  promoBoostBps: 0,
  withholdingTaxBps: 2000,
  dayCountBasis: 365,
  payoutFrequency: "DAILY",
  rounding: "FLOOR",
  startDate: "2026-11-10",
  ...overrides,
});

describe("manilaDate & phBankRegistry", () => {
  it("converts UTC timestamps to Asia/Manila (UTC+8) calendar dates", () => {
    // 2026-11-14 16:05:00 UTC == 2026-11-15 00:05:00 Asia/Manila
    const utc = new Date("2026-11-14T16:05:00.000Z");
    expect(getTodayManila(utc)).toBe("2026-11-15");
    expect(msUntilNextManilaMidnight(utc)).toBe((23 * 60 + 55) * 60 * 1000);
    expect(addDaysManila("2026-11-15", -1)).toBe("2026-11-14");
  });

  it("matches PH bank presets by institution alias", () => {
    expect(matchBankPreset("MariBank")?.presetId).toBe("ph-maribank");
    expect(matchBankPreset("Maya Bank")?.presetId).toBe("ph-maya-bank");
    expect(matchBankPreset("GoTyme")?.presetId).toBe("ph-gotyme");
    expect(matchBankPreset("Unknown Bank")).toBeUndefined();
  });

  it("validates interestRuleSchema tier ordering", () => {
    expect(() =>
      interestRuleSchema.parse(
        makeMariRule({
          tiers: [
            { upToMinor: null, rateBps: 325 },
            { upToMinor: 10_000_000, rateBps: 375 },
          ],
        })
      )
    ).toThrow();
  });
});

describe("calculatePeriodInterest", () => {
  it("computes marginal MariBank tiers with 20% FWT and FLOOR rounding", () => {
    // First ₱100k @ 3.25% + ₱20k @ 3.75% = ₱3,250 + ₱750 = ₱4,000/yr = ₱10.9589/day = 1095 minor gross
    // 20% tax on 1095 = 219 minor -> 876 minor net (₱8.76)
    const rule = makeMariRule();
    const res = calculatePeriodInterest(12_000_000, rule, "2026-11-14", 1);
    expect(res).toEqual({ grossMinor: 1095, taxMinor: 219, netMinor: 876 });
  });

  it("supports HALF_UP rounding and promo boost cap", () => {
    const rule = makeMariRule({
      tiers: [{ upToMinor: null, rateBps: 350 }],
      tierMode: "WHOLE_BALANCE",
      promoBoostBps: 650,
      promoCapMinor: 10_000_000,
      promoExpiresOn: "2026-11-30",
      rounding: "HALF_UP",
    });
    const active = calculatePeriodInterest(12_000_000, rule, "2026-11-14", 1);
    expect(active.netMinor).toBeGreaterThan(0);

    const expired = calculatePeriodInterest(12_000_000, rule, "2026-12-01", 1);
    expect(expired.grossMinor).toBeLessThan(active.grossMinor);
  });

  it("returns 0 for zero or negative balances", () => {
    const rule = makeMariRule();
    expect(calculatePeriodInterest(0, rule, "2026-11-14", 1)).toEqual({
      grossMinor: 0,
      taxMinor: 0,
      netMinor: 0,
    });
    expect(calculatePeriodInterest(-5000, rule, "2026-11-14", 1)).toEqual({
      grossMinor: 0,
      taxMinor: 0,
      netMinor: 0,
    });
  });
});

describe("evaluateInterestRules", () => {
  it("posts daily catch-up entries up to yesterdayManila and advances lastPostedPeriodKey", () => {
    const wallet = makeWallet();
    const rule = makeMariRule({ startDate: "2026-11-12" });
    const result = evaluateInterestRules({
      rules: [rule],
      wallets: [wallet],
      existingTransactions: [],
      todayManila: "2026-11-15",
    });

    // Should post 2026-11-12, 2026-11-13, 2026-11-14 (3 days)
    expect(result.transactions).toHaveLength(3);
    expect(result.transactions.map((t) => t.date)).toEqual([
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
    ]);
    expect(result.transactions[0]?.interestMeta?.isEstimated).toBe(true);
    expect(result.transactions[0]?.interestMeta?.locked).toBe(false);
    expect(result.rules[0]?.lastPostedPeriodKey).toBe("2026-11-14");
    expect(result.walletBalanceDeltas[wallet.id]).toBe(
      result.transactions.reduce((sum, t) => sum + t.amountMinor, 0)
    );
  });

  it("recalculates unverified in-window entry but never mutates locked or verified entries", () => {
    const wallet = makeWallet({ balanceMinor: 20_000_000 });
    const rule = makeMariRule({ startDate: "2026-11-13", lastPostedPeriodKey: "2026-11-14" });

    const estimatedTx = {
      id: "interest:w_mari:2026-11-14",
      date: "2026-11-14",
      title: "Daily Interest",
      amountMinor: 876,
      currency: "PHP",
      type: "INTEREST" as const,
      walletId: "w_mari",
      interestMeta: {
        ruleId: "rule_mari",
        periodKey: "2026-11-14",
        isEstimated: true,
        locked: false,
        grossMinor: 1095,
        taxMinor: 219,
      },
    };

    const recalc = evaluateInterestRules({
      rules: [rule],
      wallets: [wallet],
      existingTransactions: [estimatedTx],
      todayManila: "2026-11-15",
    });
    expect(recalc.transactions).toHaveLength(1);
    expect(recalc.transactions[0]?.amountMinor).toBeGreaterThan(876);

    const verifiedTx = {
      ...estimatedTx,
      interestMeta: { ...estimatedTx.interestMeta, isEstimated: false, locked: true },
    };
    const lockedRes = evaluateInterestRules({
      rules: [rule],
      wallets: [wallet],
      existingTransactions: [verifiedTx],
      todayManila: "2026-11-15",
    });
    expect(lockedRes.transactions).toHaveLength(0);
  });

  it("skips creating ₱0.00 clutter transactions and advances lastPostedPeriodKey", () => {
    const tinyWallet = makeWallet({ balanceMinor: 100 }); // ₱1.00
    const rule = makeMariRule({ startDate: "2026-11-14" });
    const res = evaluateInterestRules({
      rules: [rule],
      wallets: [tinyWallet],
      existingTransactions: [],
      todayManila: "2026-11-15",
    });
    expect(res.transactions).toHaveLength(0);
    expect(res.rules[0]?.lastPostedPeriodKey).toBe("2026-11-14");
  });

  it("clamps monthlyPayoutDay in shorter months and estimates monthly accrued preview", () => {
    const wallet = makeWallet({ id: "w_gotyme", institution: "GoTyme Bank", balanceMinor: 10_000_000 });
    const rule = makeMariRule({
      id: "rule_gotyme",
      walletId: "w_gotyme",
      tiers: [{ upToMinor: null, rateBps: 350 }],
      tierMode: "WHOLE_BALANCE",
      payoutFrequency: "MONTHLY",
      monthlyPayoutDay: 31,
      startDate: "2026-02-01",
    });

    const preview = estimateMonthlyAccruedMinor(rule, wallet, [], "2026-02-15");
    expect(preview).toBeGreaterThan(0);

    const febEnd = evaluateInterestRules({
      rules: [rule],
      wallets: [wallet],
      existingTransactions: [],
      todayManila: "2026-02-28",
    });
    expect(febEnd.transactions).toHaveLength(1);
    expect(febEnd.transactions[0]?.date).toBe("2026-02-28");
    expect(febEnd.transactions[0]?.interestMeta?.periodKey).toBe("2026-02");
  });
});
