import React from "react";
import { formatINR } from "@/lib/format";

export function CostSummaryPanel({ boq, disabled, onLockedEdit, onSaveTerms, onSaveMiscPct }) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bc-card p-6">
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-2">Notes & Terms</div>
        <textarea
          className="bc-input min-h-[140px] text-[13px] leading-relaxed"
          readOnly={disabled}
          onClick={() => disabled && onLockedEdit()}
          value={(boq.terms_html || "").replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n").trim()}
          onChange={(e) => {
            if (disabled) return onLockedEdit();
            onSaveTerms(
              "<ol>" +
                e.target.value.split("\n").filter(Boolean).map((l) => `<li>${l}</li>`).join("") +
                "</ol>",
            );
          }}
          data-testid="terms-textarea"
        />
      </div>
      <div className="bc-card p-6" data-testid="project-total-panel">
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-3">Cost Summary</div>
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between">
            <span className="text-[#6B7B7C]">Project Total</span>
            <span className="font-semibold text-[#333333]">{formatINR(boq.project_total || 0)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#6B7B7C] flex items-center gap-2">
              Misc
              <input
                type="number"
                readOnly={disabled}
                onClick={() => disabled && onLockedEdit()}
                className="bc-input h-7 w-14 py-0 text-[11.5px]"
                value={boq.misc_pct ?? 10}
                onChange={(e) => {
                  if (disabled) return onLockedEdit();
                  onSaveMiscPct(Number(e.target.value));
                }}
                data-testid="misc-pct-input"
              />
              %
            </span>
            <span className="font-semibold text-[#333333]" data-testid="misc-amount">{formatINR(boq.misc_amount || 0)}</span>
          </div>
          {boq.design_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-[#6B7B7C]">Design Fees</span>
              <span className="font-semibold">{formatINR(boq.design_amount)}</span>
            </div>
          )}
          {boq.execution_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-[#6B7B7C]">Execution</span>
              <span className="font-semibold">{formatINR(boq.execution_amount)}</span>
            </div>
          )}
          {boq.supervisor_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-[#6B7B7C]">Supervisor</span>
              <span className="font-semibold">{formatINR(boq.supervisor_amount)}</span>
            </div>
          )}
          {boq.additional_total > 0 && (
            <div className="flex justify-between">
              <span className="text-[#6B7B7C]">Additional</span>
              <span className="font-semibold">{formatINR(boq.additional_total)}</span>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-[#B5C4B6] flex items-baseline justify-between">
          <span className="text-[11.5px] uppercase tracking-widest text-[#B5C4B6]">Total Amount</span>
          <span className="text-[34px] font-bold text-[#333333]" data-testid="cost-final-total">{formatINR(boq.final_total || 0)}</span>
        </div>
      </div>
    </section>
  );
}