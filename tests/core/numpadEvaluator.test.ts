import { describe, expect, it } from "vitest";
import { evaluateNumpad } from "../../src/core/engine/numpadEvaluator";

describe("evaluateNumpad", () => {
  it("evaluates arithmetic with precedence and decimals", () => {
    expect(evaluateNumpad("150 + 45 * 2")).toBe(240);
    expect(evaluateNumpad("10.50 - 0.25")).toBe(10.25);
  });
  it("rejects malformed, non-finite and executable expressions", () => {
    for (const expression of ["", "1/0", "2 +", "window.alert(1)", "1e999"]) expect(() => evaluateNumpad(expression)).toThrow();
  });
});
