import React from "react";
import api from "@/lib/api";
import { toast } from "sonner";

// Download helper — MUST use axios (with JWT header) rather than <a href> which
// hits the endpoint anonymously and gets 401 + JSON body that fails to open.
export async function downloadDocument(docId, filename) {
  try {
    const res = await api.get(`/documents/${docId}/download`, {
      responseType: "blob",
    });
    const mime = res.headers?.["content-type"] || "application/octet-stream";
    const url = URL.createObjectURL(new Blob([res.data], { type: mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `document-${docId}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  } catch (e) {
    toast.error("Download failed");
  }
}

export const Shell = ({ title, subtitle, action, children }) => (
  <div className="space-y-5">
    <div className="flex items-start justify-between flex-wrap gap-3">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5 font-semibold">
          Documents
        </div>
        <h1
          className="text-[34px] font-bold text-[#333333]"
          style={{ fontFamily: "Poppins" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[14px] text-[#6B7B7C] mt-1">{subtitle}</p>
        )}
      </div>
      {action}
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

export const CATEGORIES = [
  "Agreements",
  "Pitch",
  "Scope of Work",
  "Time and Cost",
  "Project Brief",
  "Site Reki",
  "BOQs",
  "Quotations",
  "Drawings",
  "GFC Drawings",
  "3D Views",
  "Approvals",
  "Other",
  "Handover Documents",
];
