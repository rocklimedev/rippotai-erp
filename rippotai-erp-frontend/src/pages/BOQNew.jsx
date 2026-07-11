import React from "react";
import { Link } from "react-router-dom";
import { FileSpreadsheet, ArrowLeft } from "lucide-react";

export default function BOQNew() {
  return (
    <div
      data-testid="boq-new-page"
      className="min-h-[60vh] flex items-center justify-center"
    >
      <div className="bc-card p-10 max-w-lg w-full text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EAEEF0] flex items-center justify-center mb-5">
          <FileSpreadsheet size={22} className="text-[#333333]" />
        </div>
        <div className="inline-block text-[10px] font-semibold uppercase tracking-widest text-[#333333] bg-[#EAEEF0] px-2 py-1 rounded mb-3">
          Core Module · Phase 2
        </div>
        <h1 className="text-2xl font-bold text-[#333333] tracking-tight">
          New BOQ
        </h1>
        <p className="text-[13.5px] text-[#6B7B7C] mt-2">
          The BOQ Workspace with categories, items, units and rates is the next
          phase of INOS. You'll be able to create a complete project BOQ in
          minutes.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[#B5C4B6] hover:bg-[#EAEEF0] text-[13px] font-semibold text-[#6B7B7C]"
        >
          <ArrowLeft size={15} /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
