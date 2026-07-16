import React, { useEffect, useState } from "react";
import api from "@/lib/api";

/* ============================ LAYOUT PRIMITIVES ============================ */
export const Shell = ({ label, title, subtitle, action, children }) => (
  <div className="space-y-5 min-w-0">
    <div className="flex items-start justify-between flex-wrap gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5 font-semibold">
          {label}
        </div>
        <h1
          title={title}
          className="text-[34px] font-bold text-[#333333] truncate"
          style={{ fontFamily: "Poppins" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            title={subtitle}
            className="text-[14px] text-[#6B7B7C] mt-1 line-clamp-2"
          >
            {subtitle}
          </p>
        )}
      </div>
      <div className="shrink-0">{action}</div>
    </div>
    {children}
  </div>
);

export const Card = ({ children, className = "" }) => (
  <div className={`bc-card p-5 ${className}`}>{children}</div>
);

export const Input = (p) => (
  <input {...p} className={`bc-input h-10 w-full ${p.className || ""}`} />
);

export const TextArea = (p) => (
  <textarea
    {...p}
    className={`bc-input w-full text-[14px] ${p.className || ""}`}
  />
);

export const Btn = ({ children, ...p }) => (
  <button
    {...p}
    className={`h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-60 ${p.className || ""}`}
  >
    {children}
  </button>
);

export const BtnGhost = ({ children, ...p }) => (
  <button
    {...p}
    className={`h-9 px-3 rounded-lg border border-[rgba(31,69,59,0.14)] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5 ${p.className || ""}`}
  >
    {children}
  </button>
);

/* ============================ STYLE TOKENS ============================ */
export const PRIORITY_COLOURS = {
  low: "bg-[#EAEEF0] text-[#6B7B7C]",
  medium: "bg-[#EFF2F9] text-[#333333]",
  high: "bg-[#D9AF61] text-[#333333]",
  critical: "bg-[#F1D9D3] text-[#7A2E1A]",
};

export const STATUS_COLOURS = {
  todo: "bg-[#EAEEF0] text-[#6B7B7C]",
  in_progress: "bg-[#D8E0DA] text-[#333333]",
  blocked: "bg-[#F1D9D3] text-[#7A2E1A]",
  awaiting_approval: "bg-[#EDE0F5] text-[#6E3EAA]",
  completed: "bg-[#D3E7D3] text-[#2A6B45]",
};

/* ============================ FORMATTERS ============================ */
export const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
};

export const fmtDT = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

/* ============================ SHARED DATA HOOKS ============================ */
export function useProjects() {
  const [projects, setP] = useState([]);
  useEffect(() => {
    api
      .get("/projects")
      .then((r) => setP(r.data || []))
      .catch(() => {});
  }, []);
  return projects;
}
