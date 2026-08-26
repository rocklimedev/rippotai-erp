import React from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

import { Input } from "../ui/Field";

export default function EditableList({
  items = [],
  onChange,
  placeholder = "New item",
  addLabel = "Add item",
  disabled = false,
  maxItems,
}) {
  const list = Array.isArray(items) ? items : [];

  /* ============================================================
     UPDATE
  ============================================================ */

  const update = (index, value) => {
    const next = list.map((item, i) => (i === index ? value : item));

    onChange(next);
  };

  /* ============================================================
     REMOVE
  ============================================================ */

  const remove = (index) => {
    const next = list.filter((_, i) => i !== index);

    onChange(next);
  };

  /* ============================================================
     ADD
  ============================================================ */

  const add = () => {
    if (disabled || (maxItems !== undefined && list.length >= maxItems)) {
      return;
    }

    onChange([...list, ""]);
  };

  const canAdd =
    !disabled && (maxItems === undefined || list.length < maxItems);

  return (
    <div className="space-y-2">
      {/* ======================================================
          ITEMS
      ====================================================== */}

      {list.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {/* Drag indicator */}

          <GripVertical
            className={`h-4 w-4 shrink-0 ${
              disabled ? "text-[var(--muted)] opacity-50" : "text-[var(--sage)]"
            }`}
            aria-hidden="true"
          />

          {/* Input */}

          <Input
            value={item ?? ""}
            onChange={(event) => update(index, event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1"
          />

          {/* Remove */}

          <button
            type="button"
            onClick={() => remove(index)}
            disabled={disabled}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--mist-soft)] hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Remove item ${index + 1}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {list.length === 0 && (
        <p className="py-2 text-sm text-[var(--muted)]">No items added yet.</p>
      )}

      {/* ======================================================
          ADD
      ====================================================== */}

      {canAdd && (
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-[var(--ink-green)] transition-colors hover:bg-[var(--mist-soft)]"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      )}

      {/* ======================================================
          MAX ITEMS
      ====================================================== */}

      {maxItems !== undefined && list.length >= maxItems && (
        <p className="text-xs text-[var(--muted)]">
          Maximum of {maxItems} items reached.
        </p>
      )}
    </div>
  );
}
