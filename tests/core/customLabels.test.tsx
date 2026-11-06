import { isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mergeCustomLabel } from "../../src/ui/components/CustomLabelPicker";
import { QuickAddDrawer } from "../../src/ui/components/QuickAddDrawer";
import { ENTRY_FIELD_META } from "../../src/state/entryDraft";
import { useUIStore } from "../../src/state/useUIStore";

const hooks = vi.hoisted(() => ({ values: [] as unknown[], cursor: 0, save: vi.fn() }));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.values)) hooks.values[index] = initial;
    return [hooks.values[index], (value: unknown) => { hooks.values[index] = value; }];
  },
  useRef: (current: unknown) => ({ current }),
  useMemo: (compute: () => unknown) => compute(),
  useEffect: () => {},
}));
vi.mock("../../src/state/useUIStore", async (original) => {
  const actual = await original<typeof import("../../src/state/useUIStore")>();
  return { ...actual, useUIStore: Object.assign(
    (select: (state: ReturnType<typeof actual.useUIStore.getState>) => unknown) => select(actual.useUIStore.getState()),
    actual.useUIStore,
  ) };
});
vi.mock("../../src/state/queries", () => {
  const mutation = () => ({ mutateAsync: hooks.save, isPending: false });
  return {
    useCategories: () => ({ data: [] }),
    useWallets: () => ({ data: [{ id: "wallet", name: "Test wallet", type: "BANK", currency: "PHP" }] }),
    useSaveAttachment: mutation, useSaveCategory: mutation, useSaveTransaction: mutation,
    useSaveSubscription: mutation, useSaveInvoice: mutation,
  };
});

function elements(node: ReactNode): ReactElement<Record<string, any>>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, any>>(node)) return [];
  return [node, ...elements(node.props.children)];
}

beforeEach(() => {
  hooks.values = [];
  hooks.cursor = 0;
  hooks.save.mockReset().mockResolvedValue(undefined);
  useUIStore.setState({ quickAddMode: "INCOME", quickAddPrefill: undefined });
});

describe("custom labels", () => {
  it.each([
    [[], "  Side gig  ", ["#Side gig"]],
    [["#ClientWork"], "#TaxDeductible", ["#ClientWork", "#TaxDeductible"]],
    [["#ClientWork"], " clientwork ", ["#ClientWork"]],
    [["#ClientWork"], "  ", ["#ClientWork"]],
  ])("merges %j with %j", (selected, draft, expected) => {
    expect(mergeCustomLabel(selected, draft)).toEqual(expected);
  });

  it.each(["INCOME", "SUBSCRIPTION", "INVOICE"] as const)(
    "saves a typed category and assigns it in %s mode",
    async (mode) => {
      useUIStore.setState({ quickAddMode: mode });
      const render = () => {
        hooks.cursor = 0;
        return elements(QuickAddDrawer({ onClose: () => {} }));
      };
      let tree = render();
      tree.find((node) => node.type === "input" && node.props.placeholder === "0.00")!.props.onChange({ target: { value: "100" } });
      tree.find((node) => node.type === "input" && node.props.placeholder === ENTRY_FIELD_META[mode].titlePlaceholder)!.props.onChange({ target: { value: "Label regression" } });
      tree.find((node) => node.type === "button" && node.key === "wallet")!.props.onClick();
      tree.find((node) => node.type === "button" && node.props.children === "+ Custom Category")!.props.onClick();
      tree = render();
      tree.find((node) => node.type === "input" && node.props["aria-label"] === "New custom category")!.props.onChange({ target: { value: "  SavingInterest  " } });
      tree = render();
      tree.find((node) => node.type === "button" && node.props.children === "Save Entry")!.props.onClick();
      await vi.waitFor(() => expect(hooks.save).toHaveBeenCalledTimes(2));
      const category = hooks.save.mock.calls[0]![0];
      const saved = hooks.save.mock.calls[1]![0];
      expect(category).toMatchObject({ name: "SavingInterest", type: "BOTH" });
      expect((mode === "INVOICE" ? saved.invoice : saved).categoryId).toBe(category.id);
    },
  );

  it("offers a saved custom category for another entry", async () => {
    const render = () => {
      hooks.cursor = 0;
      return elements(QuickAddDrawer({ onClose: () => {}, categories: [{ id: "saved-category", name: "SavingInterest", type: "BOTH" }] }));
    };
    let tree = render();
    tree.find((node) => node.type === "input" && node.props.placeholder === "0.00")!.props.onChange({ target: { value: "100" } });
    tree.find((node) => node.type === "input" && node.props.placeholder === ENTRY_FIELD_META.INCOME.titlePlaceholder)!.props.onChange({ target: { value: "Interest" } });
    tree.find((node) => node.type === "button" && node.key === "wallet")!.props.onClick();
    tree.find((node) => node.type === "button" && node.key === "saved-category")!.props.onClick();
    tree = render();
    tree.find((node) => node.type === "button" && node.props.children === "Save Entry")!.props.onClick();
    await vi.waitFor(() => expect(hooks.save).toHaveBeenCalledTimes(1));
    expect(hooks.save.mock.calls[0]![0].categoryId).toBe("saved-category");
  });
});
