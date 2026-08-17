import React from "react";
import { Trash2, X } from "lucide-react";
import { UNITS } from "../../hooks/constants";
export function BulkActionBar({
  count,
  onChangeUnit,
  onDelete,
  onDeselectAll,
}) {
  if (count === 0) return null;
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bc-card px-5 py-3 flex items-center gap-3 shadow-lg"
      data-testid="bulk-action-bar"
    >
      <span className="text-[13px] font-semibold text-[#333333]">
        {count} selected
      </span>
      <div className="w-px h-5 bg-[#B5C4B6]" />
      <select
        className="bc-input h-8 py-0 max-w-[140px]"
        onChange={(e) => {
          if (e.target.value) {
            onChangeUnit(e.target.value);
            e.target.value = "";
          }
        }}
        data-testid="bulk-change-unit"
      >
        <option value="">Change unit…</option>
        {UNITS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
      <button
        onClick={onDelete}
        className="h-8 px-3 rounded-lg bg-[#EAEEF0] text-[#333333] text-[12px] font-semibold flex items-center gap-1"
        data-testid="bulk-delete"
      >
        <Trash2 size={12} /> Delete
      </button>
      <button
        onClick={onDeselectAll}
        className="h-8 px-3 rounded-lg text-[12px] font-semibold text-[#6B7B7C] hover:text-[#333333] hover:bg-[#EAEEF0]"
        data-testid="bulk-deselect-all"
      >
        Deselect all
      </button>
      <button
        onClick={onDeselectAll}
        className="h-8 px-2 rounded-lg text-[12px] text-[#6B7B7C] hover:text-[#333333]"
        aria-label="Close"
      >
        <X size={13} />
      </button>
    </div>
  );
}
