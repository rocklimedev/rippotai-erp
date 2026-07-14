import React, { useEffect, useState } from "react";

export function EditableCell({
  value,
  onChange,
  type = "text",
  disabled,
  align = "left",
  format,
  className = "",
  testid,
  onLockedEdit,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);
  const commit = () => {
    setEditing(false);
    const val = type === "number" ? (draft === "" ? 0 : Number(draft)) : draft;
    if (val !== value) onChange(val);
  };
  return (
    <td
      className={`boq-cell ${!disabled ? "editable" : "boq-cell-locked"} ${editing ? "editing" : ""} ${className}`}
      style={{ textAlign: align }}
      onClick={() => {
        if (disabled) {
          onLockedEdit && onLockedEdit();
          return;
        }
        setEditing(true);
      }}
      data-testid={testid}
    >
      {editing ? (
        <input
          autoFocus
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              setDraft(value ?? "");
              setEditing(false);
            }
          }}
          style={{ textAlign: align }}
        />
      ) : (
        <span
          title={
            value !== "" && value != null
              ? String(format ? format(value) : value)
              : undefined
          }
          className="block max-w-full truncate"
        >
          {format ? (
            format(value)
          ) : value === "" || value == null ? (
            <span className="text-[#B5C4B6]">—</span>
          ) : (
            String(value)
          )}
        </span>
      )}
    </td>
  );
}