export interface InstallmentBreakdown {
  financedPrincipal: number;
  monthlyAmortization: number;
  finalMonthPayment: number;
  totalPayable: number;
  impliedInterest: number;
}

export function calculateInstallmentPlan(
  totalAmount: number,
  downpayment: number,
  tenorMonths: number,
  manualMonthlyOverride?: number
): InstallmentBreakdown {
  const safeTotal = Math.max(0, totalAmount);
  const safeDown = Math.min(Math.max(0, downpayment), safeTotal);
  const safeTenor = Math.max(1, Math.floor(tenorMonths));
  const financedPrincipal = Number((safeTotal - safeDown).toFixed(2));

  if (manualMonthlyOverride && manualMonthlyOverride > 0) {
    const monthly = Number(manualMonthlyOverride.toFixed(2));
    const totalPayable = Number((safeDown + monthly * safeTenor).toFixed(2));
    return {
      financedPrincipal,
      monthlyAmortization: monthly,
      finalMonthPayment: monthly,
      totalPayable,
      impliedInterest: Math.max(0, Number((totalPayable - safeTotal).toFixed(2))),
    };
  }

  // Standard even split with centavo-accurate final month cap
  const baseMonthly = Math.floor((financedPrincipal / safeTenor) * 100) / 100;
  const previousMonthsSum = Number((baseMonthly * (safeTenor - 1)).toFixed(2));
  const finalMonthPayment = Number((financedPrincipal - previousMonthsSum).toFixed(2));

  return {
    financedPrincipal,
    monthlyAmortization: baseMonthly,
    finalMonthPayment,
    totalPayable: safeTotal,
    impliedInterest: 0,
  };
}
