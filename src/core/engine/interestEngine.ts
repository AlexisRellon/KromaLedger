import type { InterestRule, Transaction, Wallet } from "../models";
import { addDaysManila, daysBetweenManila, daysInManilaMonth, getManilaMonthKey } from "./manilaDate";

export interface PeriodInterestResult {
  grossMinor: number;
  taxMinor: number;
  netMinor: number;
}

export interface EvaluateInterestInput {
  rules: InterestRule[];
  wallets: Wallet[];
  existingTransactions: Transaction[];
  todayManila: string;
}

export interface EvaluateInterestResult {
  rules: InterestRule[];
  transactions: Transaction[];
  walletBalanceDeltas: Record<string, number>;
}

const MAX_CATCHUP_DAYS = 3660;
const MAX_CATCHUP_MONTHS = 120;

function divideBigInt(numerator: bigint, denominator: bigint, rounding: "FLOOR" | "HALF_UP"): number {
  if (denominator <= 0n) throw new RangeError("Denominator must be positive");
  if (numerator <= 0n) return 0;
  const quotient = numerator / denominator;
  if (rounding === "FLOOR") return Number(quotient);
  const remainder = numerator % denominator;
  return Number(remainder * 2n >= denominator ? quotient + 1n : quotient);
}

function nextMonthKey(monthKey: string): string {
  const [yStr, mStr] = monthKey.split("-");
  const year = Number(yStr);
  const month = Number(mStr);
  if (month === 12) return `${year + 1}-01`;
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function monthParts(monthKey: string): { year: number; month: number } {
  const [yStr, mStr] = monthKey.split("-");
  return { year: Number(yStr), month: Number(mStr) };
}

/**
 * Computes gross, withholding tax, and net interest in integer minor units (centavos).
 */
export function calculatePeriodInterest(
  principalMinor: number,
  rule: Pick<
    InterestRule,
    "tiers" | "tierMode" | "promoBoostBps" | "promoCapMinor" | "promoExpiresOn" | "withholdingTaxBps" | "dayCountBasis" | "rounding"
  >,
  periodKey: string,
  days = 1
): PeriodInterestResult {
  if (principalMinor <= 0 || days <= 0) {
    return { grossMinor: 0, taxMinor: 0, netMinor: 0 };
  }

  let weightedRateSum = 0n;
  if (rule.tierMode === "MARGINAL") {
    let prevCap = 0;
    for (const tier of rule.tiers) {
      if (principalMinor <= prevCap) break;
      const upper = tier.upToMinor === null ? principalMinor : Math.min(principalMinor, tier.upToMinor);
      const slice = Math.max(0, upper - prevCap);
      if (slice > 0) {
        weightedRateSum += BigInt(slice) * BigInt(tier.rateBps);
      }
      if (tier.upToMinor === null) break;
      prevCap = tier.upToMinor;
    }
  } else {
    const matched =
      rule.tiers.find((tier) => tier.upToMinor === null || principalMinor <= tier.upToMinor) ??
      rule.tiers[rule.tiers.length - 1];
    if (matched) {
      weightedRateSum = BigInt(principalMinor) * BigInt(matched.rateBps);
    }
  }

  const promoActive =
    rule.promoBoostBps > 0 && (!rule.promoExpiresOn || periodKey <= rule.promoExpiresOn);
  if (promoActive) {
    const boostedPrincipal =
      rule.promoCapMinor !== undefined ? Math.min(principalMinor, rule.promoCapMinor) : principalMinor;
    if (boostedPrincipal > 0) {
      weightedRateSum += BigInt(boostedPrincipal) * BigInt(rule.promoBoostBps);
    }
  }

  const grossNumerator = weightedRateSum * BigInt(days);
  const grossDenominator = BigInt(10000) * BigInt(rule.dayCountBasis);
  const grossMinor = divideBigInt(grossNumerator, grossDenominator, rule.rounding);

  const taxMinor =
    rule.withholdingTaxBps > 0
      ? divideBigInt(BigInt(grossMinor) * BigInt(rule.withholdingTaxBps), 10000n, rule.rounding)
      : 0;
  const netMinor = Math.max(0, grossMinor - taxMinor);

  return { grossMinor, taxMinor, netMinor };
}

function buildInterestTxId(walletId: string, periodKey: string): string {
  return `interest:${walletId}:${periodKey}`;
}

function isTxImmutable(tx: Transaction | undefined, currentWindowKey: string): boolean {
  if (!tx) return false;
  const meta = tx.interestMeta;
  if (!meta) return true;
  return meta.periodKey < currentWindowKey || meta.locked || !meta.isEstimated;
}

/**
 * Evaluates all enabled interest rules against `todayManila` (Asia/Manila).
 */
export function evaluateInterestRules(input: EvaluateInterestInput): EvaluateInterestResult {
  const walletMap = new Map(input.wallets.map((w) => [w.id, w]));
  const txById = new Map(input.existingTransactions.map((t) => [t.id, t]));
  const emittedTransactions: Transaction[] = [];
  const walletBalanceDeltas: Record<string, number> = {};

  const updatedRules = input.rules.map((rule) => {
    if (!rule.enabled) return rule;
    const wallet = walletMap.get(rule.walletId);
    if (!wallet) return rule;

    let runningBalance = wallet.balanceMinor;
    let delta = 0;
    let lastPostedPeriodKey = rule.lastPostedPeriodKey;

    if (rule.payoutFrequency === "DAILY") {
      const currentWindowKey = addDaysManila(input.todayManila, -1);
      if (currentWindowKey < rule.startDate) {
        return rule;
      }

      // In-window recalculation if an unverified, unlocked entry exists for currentWindowKey
      const currentTxId = buildInterestTxId(wallet.id, currentWindowKey);
      const existingCurrent = txById.get(currentTxId);
      if (existingCurrent && !isTxImmutable(existingCurrent, currentWindowKey)) {
        const preInterestPrincipal = runningBalance - existingCurrent.amountMinor;
        const calc = calculatePeriodInterest(preInterestPrincipal, rule, currentWindowKey, 1);
        if (calc.netMinor !== existingCurrent.amountMinor) {
          const diff = calc.netMinor - existingCurrent.amountMinor;
          emittedTransactions.push({
            ...existingCurrent,
            amountMinor: calc.netMinor,
            interestMeta: {
              ...existingCurrent.interestMeta!,
              grossMinor: calc.grossMinor,
              taxMinor: calc.taxMinor,
            },
          });
          runningBalance += diff;
          delta += diff;
        }
      }

      const firstPeriod = lastPostedPeriodKey ? addDaysManila(lastPostedPeriodKey, 1) : rule.startDate;
      if (firstPeriod <= currentWindowKey) {
        const totalDays = daysBetweenManila(firstPeriod, currentWindowKey) + 1;
        if (totalDays > MAX_CATCHUP_DAYS) {
          throw new RangeError(`Interest catch-up exceeds ${MAX_CATCHUP_DAYS} days`);
        }

        let cursor = firstPeriod;
        while (cursor <= currentWindowKey) {
          const txId = buildInterestTxId(wallet.id, cursor);
          if (!txById.has(txId)) {
            const calc = calculatePeriodInterest(runningBalance, rule, cursor, 1);
            if (calc.netMinor > 0) {
              emittedTransactions.push({
                id: txId,
                date: cursor,
                title: "Daily Interest",
                amountMinor: calc.netMinor,
                currency: wallet.currency,
                type: "INTEREST",
                walletId: wallet.id,
                interestMeta: {
                  ruleId: rule.id,
                  periodKey: cursor,
                  isEstimated: true,
                  locked: false,
                  grossMinor: calc.grossMinor,
                  taxMinor: calc.taxMinor,
                },
              });
              runningBalance += calc.netMinor;
              delta += calc.netMinor;
            }
          }
          lastPostedPeriodKey = cursor;
          cursor = addDaysManila(cursor, 1);
        }
      }
    } else {
      // MONTHLY payout frequency
      const currentMonthKey = getManilaMonthKey(input.todayManila);
      const startMonthKey = getManilaMonthKey(rule.startDate);
      const firstMonth = lastPostedPeriodKey ? nextMonthKey(lastPostedPeriodKey) : startMonthKey;

      let monthCursor = firstMonth;
      let monthIterations = 0;

      while (monthCursor <= currentMonthKey) {
        if (monthIterations++ >= MAX_CATCHUP_MONTHS) {
          throw new RangeError(`Monthly interest catch-up exceeds ${MAX_CATCHUP_MONTHS} months`);
        }

        const { year, month } = monthParts(monthCursor);
        const daysInMo = daysInManilaMonth(year, month);
        const payoutDay = Math.min(rule.monthlyPayoutDay ?? 1, daysInMo);
        const payoutDate = `${monthCursor}-${String(payoutDay).padStart(2, "0")}`;

        // Only post if the month has passed OR today is on/after payoutDay
        const isPastMonth = monthCursor < currentMonthKey;
        const isDueThisMonth = monthCursor === currentMonthKey && input.todayManila >= payoutDate;
        if (!isPastMonth && !isDueThisMonth) {
          break;
        }

        const txId = buildInterestTxId(wallet.id, monthCursor);
        const existingTx = txById.get(txId);

        const monthStart = `${monthCursor}-01`;
        const monthEnd = `${monthCursor}-${String(daysInMo).padStart(2, "0")}`;
        const accrueFrom = rule.startDate > monthStart ? rule.startDate : monthStart;
        const accrueTo = monthCursor === currentMonthKey && input.todayManila < monthEnd
          ? input.todayManila
          : monthEnd;

        const accruedDays = accrueFrom <= accrueTo ? daysBetweenManila(accrueFrom, accrueTo) + 1 : 0;

        if (existingTx) {
          if (!isTxImmutable(existingTx, currentMonthKey) && accruedDays > 0) {
            const preInterestPrincipal = runningBalance - existingTx.amountMinor;
            const calc = calculatePeriodInterest(preInterestPrincipal, rule, accrueTo, accruedDays);
            if (calc.netMinor !== existingTx.amountMinor) {
              const diff = calc.netMinor - existingTx.amountMinor;
              emittedTransactions.push({
                ...existingTx,
                amountMinor: calc.netMinor,
                interestMeta: {
                  ...existingTx.interestMeta!,
                  grossMinor: calc.grossMinor,
                  taxMinor: calc.taxMinor,
                },
              });
              runningBalance += diff;
              delta += diff;
            }
          }
        } else if (accruedDays > 0) {
          const calc = calculatePeriodInterest(runningBalance, rule, accrueTo, accruedDays);
          if (calc.netMinor > 0) {
            emittedTransactions.push({
              id: txId,
              date: payoutDate,
              title: "Monthly Interest",
              amountMinor: calc.netMinor,
              currency: wallet.currency,
              type: "INTEREST",
              walletId: wallet.id,
              interestMeta: {
                ruleId: rule.id,
                periodKey: monthCursor,
                isEstimated: true,
                locked: false,
                grossMinor: calc.grossMinor,
                taxMinor: calc.taxMinor,
              },
            });
            runningBalance += calc.netMinor;
            delta += calc.netMinor;
          }
        }

        lastPostedPeriodKey = monthCursor;
        monthCursor = nextMonthKey(monthCursor);
      }
    }

    if (delta !== 0) {
      walletBalanceDeltas[wallet.id] = (walletBalanceDeltas[wallet.id] ?? 0) + delta;
    }

    return lastPostedPeriodKey !== rule.lastPostedPeriodKey
      ? { ...rule, lastPostedPeriodKey }
      : rule;
  });

  return {
    rules: updatedRules,
    transactions: emittedTransactions,
    walletBalanceDeltas,
  };
}

/**
 * Pure read-only preview of month-to-date accrued interest for monthly-payout wallets.
 */
export function estimateMonthlyAccruedMinor(
  rule: InterestRule,
  wallet: Wallet,
  transactions: Transaction[],
  todayManila: string
): number {
  if (!rule.enabled || rule.payoutFrequency !== "MONTHLY" || wallet.balanceMinor <= 0) {
    return 0;
  }
  const currentMonthKey = getManilaMonthKey(todayManila);
  const postedThisMonth = transactions.some(
    (t) => t.id === buildInterestTxId(wallet.id, currentMonthKey)
  );
  if (postedThisMonth) return 0;

  const monthStart = `${currentMonthKey}-01`;
  const accrueFrom = rule.startDate > monthStart ? rule.startDate : monthStart;
  if (accrueFrom > todayManila) return 0;

  const days = daysBetweenManila(accrueFrom, todayManila) + 1;
  return calculatePeriodInterest(wallet.balanceMinor, rule, todayManila, days).netMinor;
}
