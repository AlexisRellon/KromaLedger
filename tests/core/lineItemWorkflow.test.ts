import { describe, expect, it } from "vitest";
import { addLineItem, lineTotalMinor, previewLineItems, removeLineItem, updateLineItem, type LineItemDraft } from "../../src/core/engine/lineItemWorkflow";

describe("line item workflow", () => {
  const lines: LineItemDraft[] = [{ id: "a", description: "Design", quantity: 2, unitPriceMinor: 5000 }];
  it("adds a validated draft line with an injected stable identity", () => {
    expect(addLineItem(lines, { description: "  Print  ", quantity: 3, unitPriceMinor: 250 }, () => "b")).toEqual([...lines, { id: "b", description: "Print", quantity: 3, unitPriceMinor: 250 }]);
    expect(() => addLineItem(lines, { description: "", quantity: 1, unitPriceMinor: 0 }, () => "x")).toThrow();
  });
  it("updates and removes lines immutably without touching sibling lines", () => {
    const changed = updateLineItem(lines, "a", { quantity: 4 });
    expect(changed).toEqual([{ ...lines[0], quantity: 4 }]);
    expect(lines[0]?.quantity).toBe(2);
    expect(removeLineItem([...lines, { id: "b", description: "Print", quantity: 1, unitPriceMinor: 100 }], "a")).toEqual([{ id: "b", description: "Print", quantity: 1, unitPriceMinor: 100 }]);
    expect(() => updateLineItem(lines, "missing", { quantity: 3 })).toThrow();
  });
  it("rounds fractional line totals in integer minor units", () => {
    expect(lineTotalMinor({ quantity: 0.5, unitPriceMinor: 101 })).toBe(51);
    expect(() => lineTotalMinor({ quantity: 0.0001, unitPriceMinor: 100 })).toThrow();
  });
  it("previews subtotal, tax and discount through shared integer-safe invoice math", () => {
    expect(previewLineItems(lines, { taxRateBps: 1200, discountMinor: 500, dueDate: "2026-10-24", currentDate: "2026-10-20" })).toMatchObject({ subtotalMinor: 10000, taxMinor: 1140, discountMinor: 500, totalMinor: 10640 });
  });
});
