import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { TextInput, SelectInput } from "@/components/inos";

/**
 * Click-to-edit value (Bigin-style). Saves on Enter / blur, Esc cancels.
 * type: text | date | select | money
 */
export default function EditableField({ value, display, type = "text", options, placeholder = "Add", onSave, parse, testId }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const ref = useRef(null);

  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const commit = async (next = draft) => {
    setEditing(false);
    const parsed = parse ? parse(next) : next;
    if (parsed === undefined) return; // invalid → keep old value
    if (String(parsed ?? "") === String(value ?? "")) return;
    await onSave(parsed);
  };

  if (editing) {
    if (type === "select") {
      return (
        <SelectInput
          ref={ref}
          className="crm-edit-input"
          value={draft ?? ""}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
          data-testid={testId ? `${testId}-input` : undefined}
        >
          <option value="">—</option>
          {(options || []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectInput>
      );
    }
    return (
      <TextInput
        ref={ref}
        className="crm-edit-input"
        type={type === "date" ? "date" : "text"}
        value={draft ?? ""}
        placeholder={type === "money" ? "45 L or 1.2 Cr" : placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit()}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value ?? "");
            setEditing(false);
          }
        }}
        data-testid={testId ? `${testId}-input` : undefined}
      />
    );
  }

  const empty = value == null || value === "";
  return (
    <div
      role="button"
      tabIndex={0}
      className={`crm-edit ${empty ? "is-empty" : ""}`}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => e.key === "Enter" && setEditing(true)}
      data-testid={testId}
    >
      <span style={{ minWidth: 0 }}>{empty ? placeholder : display ?? value}</span>
      <Pencil aria-hidden />
    </div>
  );
}
