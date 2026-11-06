import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type AriaAttributes,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from "react";

type FieldControlProps = Pick<AriaAttributes, "aria-describedby" | "aria-invalid"> & { id?: string };

export type FieldRenderProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export type FieldProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  label: ReactNode;
  help?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactElement<FieldControlProps> | ((props: FieldRenderProps) => ReactNode);
};

export function Field({
  label,
  help,
  hint,
  error,
  required,
  id: explicitId,
  children,
  className = "",
  ...props
}: FieldProps) {
  const [validationError, setValidationError] = useState("");
  const generatedId = useId();
  const childId = isValidElement(children) ? (children.props as FieldControlProps).id : undefined;
  const id = explicitId ?? childId ?? generatedId;
  const helpText = help ?? hint;
  const helpId = helpText ? `${id}-help` : undefined;
  const fieldError = error || validationError;
  const errorId = fieldError ? `${id}-error` : undefined;

  const childDescribedBy = isValidElement(children) ? (children.props as FieldControlProps)["aria-describedby"] : undefined;
  const describedBy = [childDescribedBy, helpId, errorId].filter(Boolean).join(" ") || undefined;
  const isInvalid = fieldError ? true : isValidElement(children) ? (children.props as FieldControlProps)["aria-invalid"] : undefined;

  return (
    <div {...props} onInvalidCapture={(event) => {
      const control = event.target as HTMLInputElement;
      setValidationError(control.validationMessage);
      control.setAttribute("aria-invalid", "true");
      const descriptions = (control.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
      control.setAttribute("aria-describedby", [...new Set([...descriptions, `${id}-error`])].join(" "));
    }} onInputCapture={(event) => {
      const control = event.target as HTMLInputElement;
      if (control.validity?.valid) {
        setValidationError("");
        control.removeAttribute("aria-invalid");
        const descriptions = (control.getAttribute("aria-describedby") || "").split(/\s+/).filter((value) => value && value !== `${id}-error`);
        if (descriptions.length) control.setAttribute("aria-describedby", descriptions.join(" "));
        else control.removeAttribute("aria-describedby");
      }
    }} className={`flex flex-col gap-1.5 ${validationError ? "[&_input:invalid]:!border-red-700 [&_select:invalid]:!border-red-700 [&_textarea:invalid]:!border-red-700" : ""} ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
          {label} {required && <span className="text-[var(--status-danger-text)]">*</span>}
        </label>
        {hint && !help && !error && (
          <span id={helpId} className="text-[11px] font-semibold text-[var(--text-tertiary)]">
            {hint}
          </span>
        )}
      </div>

      {typeof children === "function"
        ? children({
            id,
            "aria-describedby": describedBy,
            "aria-invalid": Boolean(fieldError),
          })
        : cloneElement(children, {
            id,
            "aria-describedby": describedBy,
            "aria-invalid": isInvalid,
          })}

      {help && <p id={helpId} className="text-xs text-[var(--text-tertiary)] font-medium">{help}</p>}
      {fieldError && (
        <p id={errorId} role="alert" className="text-xs font-bold text-[var(--status-danger-text)]">
          {fieldError}
        </p>
      )}
    </div>
  );
}

export const FormField = Field;
export type FormFieldProps = FieldProps;

export function FormActions({ className = "", ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={`flex flex-wrap items-center justify-end gap-3 ${className}`} />;
}
