import React from "react";
import { Loader2, Cloud, CloudOff } from "lucide-react";
import { STATUS_META } from "../../hooks/constants";

export function SaveChip({ state }) {
  if (state === "saving")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#333333]">
        <Loader2 size={12} className="animate-spin" /> Saving…
      </span>
    );
  if (state === "saved")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#333333]">
        <Cloud size={12} /> All changes saved
      </span>
    );
  if (state === "error")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#333333]">
        <CloudOff size={12} /> Save failed — Retry
      </span>
    );
  return null;
}

export function StatusChip({ status }) {
  const s = STATUS_META[status] || STATUS_META.draft;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}