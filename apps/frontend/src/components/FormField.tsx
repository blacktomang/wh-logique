import type { ReactNode } from "react";
import { Field } from "./Field";

interface FormFieldProps {
  label: string;
  id: string;
  error?: string | undefined;
  children: ReactNode;
}

/**
 * A form field that renders its label, control, and an associated validation
 * message. The control is expected to wire `aria-describedby` to `${id}-error`
 * and `aria-invalid` when `error` is set.
 */
export function FormField({ label, id, error, children }: FormFieldProps) {
  return (
    <Field label={label}>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </Field>
  );
}
