import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import type { ActionResult } from "./action-result";

/** Lleva los errores de validación del servidor a los campos del formulario. */
export function applyServerErrors<T extends FieldValues>(
  form: UseFormReturn<T, unknown, unknown>,
  result: Extract<ActionResult<unknown>, { ok: false }>,
) {
  for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
    if (messages?.length) form.setError(field as Path<T>, { message: messages[0] });
  }
}
