// Bill of Quantities — "Budget Breakdown", the user's BOQ template (client / internal /
// quantity-only / vendor-enquiry copies, and BOQ templates).
//
// Layout + pagination live in ./boqBudgetLayout.js, a generated copy of the backend's
// src/modules/boqs/boq-budget-layout.ts, so the preview, "Download PDF", the copy attached on
// approval and the server export (POST /boqs/:id/export/pdf) are the same document.
// Renders .pd-page A4 sheets, so downloadDocumentPdf / usePdfDownload work unchanged.
import { forwardRef, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import monogram from "../../assets/brand/rippotai-monogram.png";
import { useGetTermsTemplateQuery } from "@/api/meta/terms.api";
import {
  BUDGET_CSS,
  BUDGET_VARIANT_LABELS,
  buildBudgetModel,
  paginateBudget,
  renderBudgetFlow,
} from "./boqBudgetLayout";

export const BOQ_VARIANTS = BUDGET_VARIANT_LABELS;

export const boqFileName = (boq, variant = "client", template = false) => {
  const base = template
    ? `BOQ-Template_${String(boq?.name || "template").replace(/[^\w-]+/g, "-")}`
    : `BOQ_${String(boq?.boq_number || `${boq?.project?.name || "boq"}-v${boq?.version || 1}`).replace(/[^\w-]+/g, "-")}`;
  return `${base}${template ? "" : `_${variant.replace(/_/g, "-")}`}.pdf`;
};

const has = (v) => typeof v === "string" && v.trim().length > 0;

// On-screen only: sheets stacked with a gap (the shared .pd-page shadow), none while capturing.
const SCREEN_CSS = `
.bb-doc--screen{display:flex;flex-direction:column;align-items:center;gap:16px;}
.bb-doc.is-capturing .pd-page{box-shadow:none;}
.bb-doc .bb-flow{background:#fff;}
`;

/**
 * props: boq (BOQ or template), variant ("client" | "internal" | "quantity_only" | "vendor_enquiry"),
 *        template (bool) — render a BOQ template (no project).
 */
const BoqDocument = forwardRef(function BoqDocument({ boq, variant = "client", template = false }, ref) {
  const termsId = !template && !has(boq?.terms_html) ? boq?.terms_template_id : null;
  const { data: termsTpl } = useGetTermsTemplateQuery(termsId, { skip: !termsId });
  const terms = has(boq?.terms_html)
    ? boq.terms_html
    : termsTpl?.content_html || termsTpl?.data?.content_html || "";

  const html = useMemo(
    () =>
      boq
        ? renderBudgetFlow(
            buildBudgetModel(boq, { variant, template, terms, monogramSrc: monogram }),
          )
        : "",
    [boq, variant, template, terms],
  );

  const hostRef = useRef(null);
  const setRef = useCallback(
    (el) => {
      hostRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  // Render the flow, then pack it onto A4 sheets (same algorithm as the server export).
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = html;
    paginateBudget(host);
  }, [html]);

  if (!boq) return null;
  return (
    <>
      <style>{BUDGET_CSS + SCREEN_CSS}</style>
      <div ref={setRef} className="bb-doc bb-doc--screen" data-page-height="297" />
    </>
  );
});

export default BoqDocument;
