import type { ReactNode } from "react";

export function Field({
  id,
  label,
  optional = false,
  error,
  hint,
  children,
  className = "",
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={id}>
        {label}
        {optional ? (
          <span className="optional-label">Valfrjálst</span>
        ) : (
          <><span className="required-mark" aria-hidden="true">*</span><span className="sr-only">Má fylla út síðar</span></>
        )}
      </label>
      {children}
      {error ? (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
