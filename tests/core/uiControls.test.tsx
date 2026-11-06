import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Button, Input, Select, Textarea, Toggle } from "../../src/ui/primitives/controls";
import { BrandLogo } from "../../src/ui/primitives";
import { Field, FormActions } from "../../src/ui/primitives/forms";

describe("shared controls", () => {
  it("defaults to a non-submit button and preserves explicit submit semantics", () => {
    expect(renderToStaticMarkup(<Button>Cancel</Button>)).toContain('type="button"');
    const html = renderToStaticMarkup(<Button type="submit" name="action" value="save">Save</Button>);
    expect(html).toContain('type="submit"');
    expect(html).toContain('name="action"');
    expect(html).toContain('value="save"');
  });

  it("disables busy buttons and keeps their accessible name", () => {
    const html = renderToStaticMarkup(<Button busy disabled={false}>Saving changes</Button>);
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Saving changes");
    expect(renderToStaticMarkup(<Button disabled>Save</Button>)).toContain('disabled=""');
    expect(renderToStaticMarkup(<Button>Save</Button>)).not.toContain('disabled=""');
  });

  it("passes native refs, event handlers and attributes to the underlying elements", () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const input = Input({ ref, onChange, name: "amount", inputMode: "decimal", required: true });
    expect(input.type).toBe("input");
    expect(input.props).toMatchObject({ ref, onChange, name: "amount", inputMode: "decimal", required: true });
    const buttonRef = createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    expect(Button({ ref: buttonRef, onClick }).props).toMatchObject({ ref: buttonRef, onClick });
    const selectRef = createRef<HTMLSelectElement>();
    expect(Select({ ref: selectRef, onChange, multiple: true }).props).toMatchObject({ ref: selectRef, onChange, multiple: true });
    const textareaRef = createRef<HTMLTextAreaElement>();
    expect(Textarea({ ref: textareaRef, onChange, rows: 4 }).props).toMatchObject({ ref: textareaRef, onChange, rows: 4 });
  });

  it("keeps native select options, textarea values and custom classes", () => {
    expect(renderToStaticMarkup(<Select defaultValue="php" disabled><option value="php">Peso</option></Select>)).toContain('selected=""');
    const html = renderToStaticMarkup(<Textarea defaultValue="Notes" rows={3} className="custom" />);
    expect(html).toContain('rows="3"');
    expect(html).toContain("custom");
    expect(html).toContain(">Notes</textarea>");
  });

  it("renders accessible Toggle switch with role='switch' and aria-checked", () => {
    const onToggle = vi.fn();
    const htmlChecked = renderToStaticMarkup(<Toggle checked={true} onChange={onToggle} label="High contrast" />);
    expect(htmlChecked).toContain('role="switch"');
    expect(htmlChecked).toContain('aria-checked="true"');
    expect(htmlChecked).toContain('aria-label="High contrast"');

    const htmlUnchecked = renderToStaticMarkup(<Toggle checked={false} onChange={onToggle} label="Reduced motion" />);
    expect(htmlUnchecked).toContain('aria-checked="false"');
  });
});

describe("shared forms", () => {
  it("associates explicit labels, help and errors while retaining existing descriptions", () => {
    const html = renderToStaticMarkup(
      <Field id="amount" label="Amount" help="In pesos" error="Enter an amount">
        <Input aria-describedby="currency" required />
      </Field>,
    );
    expect(html).toContain('for="amount"');
    expect(html).toContain('id="amount"');
    expect(html).toContain('aria-describedby="currency amount-help amount-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('id="amount-help"');
    expect(html).toContain('id="amount-error" role="alert"');
  });

  it("uses the child id and preserves native invalid state without an error", () => {
    const html = renderToStaticMarkup(<Field label="Wallet"><Select id="wallet" aria-invalid="grammar" /></Field>);
    expect(html).toContain('for="wallet"');
    expect(html).toContain('aria-invalid="grammar"');
    expect(html).not.toContain("aria-describedby");
    expect(html).not.toContain('role="alert"');
  });

  it("generates unique matching ids when callers omit them", () => {
    const html = renderToStaticMarkup(<><Field label="First"><Input /></Field><Field label="Second"><Textarea /></Field></>);
    const labels = [...html.matchAll(/for="([^"]+)"/g)].map((match) => match[1]);
    expect(labels).toHaveLength(2);
    expect(new Set(labels).size).toBe(2);
    for (const id of labels) expect(html).toContain(`id="${id}"`);
  });

  it("keeps action layout native attributes and children", () => {
    const html = renderToStaticMarkup(<FormActions aria-label="Invoice actions"><Button>Cancel</Button></FormActions>);
    expect(html).toContain('aria-label="Invoice actions"');
    expect(html).toContain("Cancel</button>");
  });
});

describe("BrandLogo adaptive wordmark", () => {
  it("uses the Baulito small cut across badge colours and explicit variants", () => {
    for (const badgeColor of ["gold", "plum", "chestnut", "white"] as const) {
      for (const variant of ["color", "ivory", "black", "white"] as const) {
        const html = renderToStaticMarkup(<BrandLogo badgeColor={badgeColor} variant={variant} />);
        expect(html).toContain("/kaban-symbol-small.svg");
        expect(html).toContain("-webkit-mask:");
        expect(html).toContain('alt="Kaban"');
        expect(html).toContain('aria-hidden="true"');
      }
    }
  });

  it("renders both black and ivory wordmarks with dark-hidden/dark-block by default", () => {
    const html = renderToStaticMarkup(<BrandLogo />);
    expect(html).toContain('src="/kaban-wordmark-black.svg"');
    expect(html).toContain('dark-hidden');
    expect(html).toContain('src="/kaban-wordmark-ivory.svg"');
    expect(html).toContain('dark-block');
  });

  it("renders single explicit wordmark when variant is ivory or black", () => {
    const htmlIvory = renderToStaticMarkup(<BrandLogo variant="ivory" />);
    expect(htmlIvory).toContain('src="/kaban-wordmark-ivory.svg"');
    expect(htmlIvory).not.toContain('src="/kaban-wordmark-black.svg"');
    expect(htmlIvory).not.toContain('dark-hidden');

    const htmlBlack = renderToStaticMarkup(<BrandLogo variant="black" />);
    expect(htmlBlack).toContain('src="/kaban-wordmark-black.svg"');
    expect(htmlBlack).not.toContain('src="/kaban-wordmark-ivory.svg"');
  });
});
