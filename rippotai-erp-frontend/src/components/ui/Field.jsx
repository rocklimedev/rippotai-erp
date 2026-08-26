import React from "react";
import { Check } from "lucide-react";

/* ============================================================
   FIELD
============================================================ */

export function Field({ label, hint, children, className = "" }) {
  return (
    <div className={`block ${className}`}>
      {label && <div className="eyebrow mb-1.5 block">{label}</div>}

      {children}

      {hint && (
        <div className="mt-1 block text-xs text-[var(--muted)]">{hint}</div>
      )}
    </div>
  );
}

/* ============================================================
   INPUT
============================================================ */

export function Input({ className = "", ...props }) {
  return <input {...props} className={`bc-input ${className}`} />;
}

/* ============================================================
   TEXTAREA
============================================================ */

export function Textarea({ className = "", rows = 3, ...props }) {
  return (
    <textarea
      {...props}
      rows={rows}
      className={`bc-input resize-y ${className}`}
    />
  );
}

/* ============================================================
   SELECT
============================================================ */

export function Select({ className = "", children, ...props }) {
  return (
    <select {...props} className={`bc-input ${className}`}>
      {children}
    </select>
  );
}

/* ============================================================
   CHECKBOX
============================================================ */

export function Checkbox({
  checked = false,
  onChange,
  label,
  className = "",
  disabled = false,
  name,
  id,
}) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-2.5 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${className}`}
    >
      {/* Hidden native checkbox */}

      <input
        id={id}
        name={name}
        type="checkbox"
        checked={Boolean(checked)}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="peer sr-only"
      />

      {/* Visual checkbox */}

      <span
        aria-hidden="true"
        className={`
          mt-0.5
          flex
          h-[18px]
          w-[18px]
          shrink-0
          items-center
          justify-center
          rounded-[5px]
          border
          transition-all

          ${
            checked
              ? "border-[var(--ink-green)] bg-[var(--ink-green)]"
              : "border-[var(--stroke)] bg-white"
          }

          peer-focus-visible:ring-2
          peer-focus-visible:ring-[var(--ink-green)]/20
          peer-focus-visible:ring-offset-1
        `}
      >
        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </span>

      {label && (
        <span className="text-[15px] leading-snug text-[var(--ink-green)]">
          {label}
        </span>
      )}
    </label>
  );
}
