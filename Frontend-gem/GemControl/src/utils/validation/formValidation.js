import { useEffect, useRef } from "react";

// Shared pattern for the web forms (Items, Raw Materials, ...). The forms keep
// their existing `formErrors` state and pure `getErrors(values)` rules; this
// module only adds WHEN validation runs:
//   * on blur   -> validateFieldOnBlur   (show the error as the user leaves)
//   * on change -> useRevalidateOnChange (a field that already shows an error
//                  is re-checked on every edit, so it clears the moment it is
//                  valid -- and nothing is shown before the user touches it)
//   * on submit -> the form's own validate-all (unchanged)
// Backend validation stays authoritative; mapServerErrorToField puts a
// server message on the right field when we can tell which one it is.

// Fields that currently show an error are re-validated against the latest
// values whenever they change. `fields` limits this to keys the rules can
// produce, so unrelated errors (e.g. an upload error) are left alone.
export function useRevalidateOnChange(values, getErrors, setErrors, fields) {
  useEffect(() => {
    setErrors((prev) => {
      const active = fields.filter((key) => prev[key]);
      if (active.length === 0) return prev;
      const fresh = getErrors(values);
      let changed = false;
      const next = { ...prev };
      for (const key of active) {
        const message = fresh[key] || null;
        if (message !== prev[key]) {
          next[key] = message;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [values, getErrors, setErrors, fields]);
}

// True only after the user has really interacted (pointer or keyboard) since
// `active` last turned on (e.g. a dialog opened). Programmatic focus changes
// -- a dialog's autoFocus or focus-trap moving focus around -- must NOT count
// as "the user left the field", otherwise a fresh form opens already red.
export function useUserInteracted(active) {
  const interacted = useRef(false);
  useEffect(() => {
    interacted.current = false;
    if (!active) return undefined;
    const mark = () => {
      interacted.current = true;
    };
    document.addEventListener("pointerdown", mark, true);
    document.addEventListener("keydown", mark, true);
    return () => {
      document.removeEventListener("pointerdown", mark, true);
      document.removeEventListener("keydown", mark, true);
    };
  }, [active]);
  return interacted;
}

// Validates a single field using the full rule set (so cross-field rules such
// as "less weight cannot exceed gross weight" stay correct) and shows/clears
// only that field's error.
export function validateFieldOnBlur(name, values, getErrors, setErrors, fields, interacted) {
  if (!name || !fields.includes(name)) return;
  if (interacted && !interacted.current) return;
  const message = getErrors(values)[name] || null;
  setErrors((prev) => (prev[name] === message ? prev : { ...prev, [name]: message }));
}

// rules: [[RegExp, fieldName], ...]. The backend replies with { message }
// only, so we match its known, stable messages.
export function mapServerErrorToField(message, rules) {
  if (!message) return null;
  for (const [pattern, field] of rules) {
    if (pattern.test(message)) return field;
  }
  return null;
}
