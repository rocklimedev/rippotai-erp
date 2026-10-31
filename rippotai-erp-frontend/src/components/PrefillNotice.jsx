import { Link2 } from "lucide-react";

/**
 * Subtle "Filled from <document>" line for forms using useSharedProjectData.
 * Pass the hook's return value; renders nothing when no value was inherited.
 */
export function PrefillNotice({ prefill, className = "" }) {
  const sources = prefill?.filledFrom || [];
  if (!sources.length) return null;
  const count = Object.keys(prefill.filled || {}).length;
  return (
    // A span (display:flex) so it can sit inside PageHeader's subtitle <p>.
    <span
      role="status"
      className={`mt-1.5 flex items-center gap-1.5 text-xs ${className}`}
      style={{ color: "var(--text-3)" }}
    >
      <Link2 size={13} aria-hidden="true" />
      <span>
        Filled from {sources.join(", ")}
        {count > 1 ? ` · ${count} fields` : ""}. Edit anything to override.
      </span>
    </span>
  );
}

/** Inline per-field hint: <FieldPrefillHint prefill={prefill} field="site_address" /> */
export function FieldPrefillHint({ prefill, field }) {
  const source = prefill?.filled?.[field];
  if (!source) return null;
  return (
    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
      Filled from {source}
    </span>
  );
}

export default PrefillNotice;
