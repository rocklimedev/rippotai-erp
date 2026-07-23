import React, { useEffect, useState } from "react";
import { formatINR } from "@/lib/format";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

function htmlToPlainText(html) {
  return (html || "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/\n+/g, "\n")
    .trim();
}

function plainTextToHtml(text) {
  return (
    "<ol>" +
    text
      .split("\n")
      .filter(Boolean)
      .map((l) => `<li>${l}</li>`)
      .join("") +
    "</ol>"
  );
}

export function CostSummaryPanel({
  boq,
  disabled,
  onLockedEdit,
  onSaveTerms,
  onSaveMiscPct,
}) {
  // Local buffer for the textarea so typing isn't clobbered by prop
  // updates that lag behind the save request.
  const [termsText, setTermsText] = useState(() =>
    htmlToPlainText(boq.terms_html),
  );

  // Only resync from the prop when we're looking at a *different* BOQ,
  // not on every terms_html change (which would fight with local typing).
  useEffect(() => {
    setTermsText(htmlToPlainText(boq.terms_html));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boq.id]);

  const debouncedSaveTerms = useDebouncedCallback((text) => {
    onSaveTerms(plainTextToHtml(text));
  }, 500);

  const handleTermsChange = (e) => {
    const value = e.target.value;
    setTermsText(value);
    debouncedSaveTerms(value);
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bc-card p-6">
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-2">
          Notes & Terms
        </div>
        <textarea
          className="bc-input min-h-[140px] text-[13px] leading-relaxed"
          value={termsText}
          onChange={handleTermsChange}
          data-testid="terms-textarea"
        />
      </div>
      <div className="bc-card p-6" data-testid="project-total-panel">
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-3">
          Cost Summary
        </div>
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between">
            <span className="text-[#6B7B7C]">Project Total</span>
            <span className="font-semibold text-[#333333]">
              {formatINR(boq.project_total || 0)}
            </span>
          </div>
          {/* <div className="flex items-center justify-between gap-2">
            <span className="text-[#6B7B7C] flex items-center gap-2">
              Misc
              <input
                type="number"
                readOnly={disabled}
                onClick={() => disabled && onLockedEdit()}
                className="bc-input h-7 w-14 py-0 text-[11.5px]"
                value={boq.misc_pct ?? 0}
                onChange={(e) => {
                  if (disabled) return onLockedEdit();
                  onSaveMiscPct(Number(e.target.value));
                }}
                data-testid="misc-pct-input"
              />
              %
            </span>
            <span
              className="font-semibold text-[#333333]"
              data-testid="misc-amount"
            >
              {formatINR(boq.misc_amount || 0)}
            </span>
          </div> */}
          {boq.design_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-[#6B7B7C]">Design Fees</span>
              <span className="font-semibold">
                {formatINR(boq.design_amount)}
              </span>
            </div>
          )}
          {boq.execution_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-[#6B7B7C]">Execution</span>
              <span className="font-semibold">
                {formatINR(boq.execution_amount)}
              </span>
            </div>
          )}
          {boq.supervisor_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-[#6B7B7C]">Supervisor</span>
              <span className="font-semibold">
                {formatINR(boq.supervisor_amount)}
              </span>
            </div>
          )}
          {boq.additional_total > 0 && (
            <div className="flex justify-between">
              <span className="text-[#6B7B7C]">Additional</span>
              <span className="font-semibold">
                {formatINR(boq.additional_total)}
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-[#B5C4B6] flex items-baseline justify-between">
          <span className="text-[11.5px] uppercase tracking-widest text-[#B5C4B6]">
            Total Amount
          </span>
          <span
            className="text-[34px] font-bold text-[#333333]"
            data-testid="cost-final-total"
          >
            {formatINR(boq.final_total || 0)}
          </span>
        </div>
      </div>
    </section>
  );
}
