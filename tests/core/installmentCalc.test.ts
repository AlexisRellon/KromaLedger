import { describe, expect, it } from "vitest";
import { calculateInstallmentPlan } from "../../src/core/engine/installmentCalc";

describe("calculateInstallmentPlan", () => {
  it("splits evenly and caps the final month at the centavo remainder", () => {
    expect(calculateInstallmentPlan(10000, 0, 3)).toEqual({
      financedPrincipal: 10000,
      monthlyAmortization: 3333.33,
      finalMonthPayment: 3333.34,
      totalPayable: 10000,
      impliedInterest: 0,
    });
  });

  it("keeps exact splits without a rounding bump", () => {
    expect(calculateInstallmentPlan(1200, 0, 6)).toMatchObject({
      financedPrincipal: 1200,
      monthlyAmortization: 200,
      finalMonthPayment: 200,
      totalPayable: 1200,
      impliedInterest: 0,
    });
  });

  it("deducts the downpayment from the financed principal", () => {
    expect(calculateInstallmentPlan(10000, 2500, 6)).toMatchObject({
      financedPrincipal: 7500,
      monthlyAmortization: 1250,
      finalMonthPayment: 1250,
      totalPayable: 10000,
      impliedInterest: 0,
    });
  });

  it("honours a manual monthly override and reports implied interest", () => {
    const plan = calculateInstallmentPlan(10000, 0, 6, 1800);
    expect(plan).toMatchObject({
      financedPrincipal: 10000,
      monthlyAmortization: 1800,
      finalMonthPayment: 1800,
      totalPayable: 10800,
      impliedInterest: 800,
    });
  });

  it("adds the downpayment to the manually quoted total payable", () => {
    expect(calculateInstallmentPlan(10000, 2000, 6, 1500)).toMatchObject({
      financedPrincipal: 8000,
      totalPayable: 11000,
      impliedInterest: 1000,
    });
  });

  it("never reports negative implied interest when the quote is cheaper", () => {
    expect(calculateInstallmentPlan(10000, 0, 5, 1900)).toMatchObject({
      totalPayable: 9500,
      impliedInterest: 0,
    });
  });

  it("rounds overridden monthly payments to centavos", () => {
    expect(calculateInstallmentPlan(1000, 0, 3, 333.336)).toMatchObject({
      monthlyAmortization: 333.34,
      totalPayable: 1000.02,
      impliedInterest: 0.02,
    });
  });

  it("clamps negative and zero inputs", () => {
    expect(calculateInstallmentPlan(-500, -100, 0)).toEqual({
      financedPrincipal: 0,
      monthlyAmortization: 0,
      finalMonthPayment: 0,
      totalPayable: 0,
      impliedInterest: 0,
    });
    expect(calculateInstallmentPlan(0, 0, 3)).toMatchObject({
      financedPrincipal: 0,
      monthlyAmortization: 0,
      finalMonthPayment: 0,
      totalPayable: 0,
    });
  });

  it("caps a downpayment larger than the total at the full amount", () => {
    expect(calculateInstallmentPlan(1000, 5000, 3)).toMatchObject({
      financedPrincipal: 0,
      monthlyAmortization: 0,
      finalMonthPayment: 0,
      totalPayable: 1000,
    });
  });

  it("treats a tenor below one month as a single month", () => {
    expect(calculateInstallmentPlan(1500, 0, 0)).toMatchObject({
      monthlyAmortization: 1500,
      finalMonthPayment: 1500,
      totalPayable: 1500,
    });
    expect(calculateInstallmentPlan(1500, 0, -4)).toMatchObject({
      monthlyAmortization: 1500,
      finalMonthPayment: 1500,
    });
  });

  it("floors fractional tenors to whole months", () => {
    expect(calculateInstallmentPlan(1000, 0, 3.9)).toMatchObject({
      monthlyAmortization: 333.33,
      finalMonthPayment: 333.34,
    });
  });
});
