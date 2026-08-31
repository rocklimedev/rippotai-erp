import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Edit3, Trash2, Download, Lock, Unlock } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { Shell, Card } from "../../hooks/shared";

import {
  useGetBudgetEstimateQuery,
  useDeleteBudgetEstimateMutation,
  useLockBudgetEstimateMutation,
  useUnlockBudgetEstimateMutation,
} from "../../api/budget-estimates.api";

import logo from "../../assets/rippotai_logo.png";

// ============================================================
// BRAND TOKENS
// ============================================================

const GREEN = "#16352A";
const GOLD = "#C6A15B";
const HAIRLINE = "#DCCFAE";
const INK = "#1F2937";
const MUTED = "#6B7280";
const RED = "#B04D26";

// ============================================================
// HELPERS
// ============================================================

const money = (value) => {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (value) => {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

const itemAmount = (item) => {
  if (item?.amount !== null && item?.amount !== undefined) {
    return Number(item.amount);
  }

  return Number(item?.quantity || 0) * Number(item?.rate || 0);
};

const categoryAmount = (category) => {
  return (category?.items || [])
    .filter((item) => !item.hidden)
    .reduce((sum, item) => sum + itemAmount(item), 0);
};

const statusBadgeClass = (status, locked) => {
  if (locked) {
    return "bg-[#E8E8E8] text-[#333333]";
  }

  switch (status) {
    case "approved":
      return "bg-[#E4F3E8] text-[#1F7A3D]";

    case "submitted":
      return "bg-[#EAF0F8] text-[#315A87]";

    case "in_progress":
      return "bg-[#FDEFD9] text-[#B0740F]";

    case "rejected":
      return "bg-[#FBE7E7] text-[#A83232]";

    case "cancelled":
      return "bg-[#F2EAEA] text-[#8A3F3F]";

    case "revised":
      return "bg-[#EEE8F8] text-[#684A91]";

    case "draft":
    default:
      return "bg-[#EAEEF0] text-[#333333]";
  }
};

const chunkItems = (items, size = 10) => {
  const chunks = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
};

// ============================================================
// TERMS PARSER
// Supports:
// <ol><li>...</li></ol>
// and also:
// <h3>Title</h3><p>Body</p>
// ============================================================

function parseTermsHtml(html) {
  if (!html) return [];

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");

    // --------------------------------------------------------
    // Standard ordered list
    // --------------------------------------------------------

    const liNodes = Array.from(doc.querySelectorAll("ol > li"));

    if (liNodes.length > 0) {
      return liNodes.map((li) => ({
        title: "",
        body: [li.textContent?.trim()].filter(Boolean),
      }));
    }

    // --------------------------------------------------------
    // Heading based terms
    // --------------------------------------------------------

    const nodes = Array.from(doc.body.children);

    const items = [];
    let current = null;

    nodes.forEach((node) => {
      const tag = node.tagName?.toLowerCase();
      const text = node.textContent?.trim();

      if (!text) return;

      if (tag === "h2") {
        return;
      }

      if (tag === "h3") {
        current = {
          title: text.replace(/^\d+\.\s*/, "").trim(),
          body: [],
        };

        items.push(current);
        return;
      }

      if (current) {
        current.body.push(text);
      } else {
        items.push({
          title: "",
          body: [text],
        });
      }
    });

    return items;
  } catch (error) {
    console.error("Failed to parse terms HTML:", error);
    return [];
  }
}

// ============================================================
// LOGO
// ============================================================

const LogoMark = () => (
  <img src={logo} alt="Rippotai" className="h-[110px] w-auto object-contain" />
);

// ============================================================
// FIELD COMPONENTS
// ============================================================

const FieldRow = ({ children }) => (
  <div
    className="grid grid-cols-2 gap-8 py-3 poa-avoid-break"
    style={{
      borderBottom: `1px solid ${HAIRLINE}`,
    }}
  >
    {children}
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <span
      className="text-[10px] tracking-wide uppercase"
      style={{ color: MUTED }}
    >
      {label}:{" "}
    </span>

    <span className="text-[13px] font-semibold" style={{ color: INK }}>
      {value || "—"}
    </span>
  </div>
);

// ============================================================
// PAGE SETTINGS
// ============================================================

const A4_WIDTH_PX = 794;
const A4_MIN_HEIGHT_PX = 1123;

// ============================================================
// PRINT STYLES
// ============================================================

const PrintStyles = () => (
  <style>{`
    .budget-preview-backdrop {
      background: #57595c;
      padding: 40px 0 64px;
    }

    .budget-page {
      width: ${A4_WIDTH_PX}px;
      min-height: ${A4_MIN_HEIGHT_PX}px;
      margin: 0 auto 40px;
      background: #fff;
      box-shadow: 0 8px 30px rgba(0,0,0,.35);
      position: relative;
      box-sizing: border-box;
    }

    .budget-page-label {
      position: absolute;
      top: -24px;
      left: 0;
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        sans-serif;
      font-size: 11px;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: #d6d6d6;
    }

    .budget-table-header,
    .budget-table-row {
      display: grid;
      grid-template-columns:
        34px
        minmax(0, 1fr)
        58px
        85px
        105px;
      column-gap: 12px;
    }

    @media print {
      body * {
        visibility: hidden;
      }

      .budget-print-area,
      .budget-print-area * {
        visibility: visible;
      }

      .budget-print-area {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        margin: 0;
        padding: 0;
      }

      @page {
        size: A4;
        margin: 0;
      }

      .budget-preview-backdrop {
        background: none;
        padding: 0;
      }

      .budget-page {
        width: auto;
        min-height: 0;
        margin: 0;
        box-shadow: none;
        break-after: page;
        page-break-after: always;
      }

      .budget-page-cover {
        height: 297mm;
        box-sizing: border-box;
        overflow: hidden;
      }

      .budget-page-label {
        display: none;
      }

      .budget-page-last {
        break-after: auto;
        page-break-after: auto;
      }

      .poa-avoid-break {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
  `}</style>
);

// ============================================================
// PAGE LABEL
// ============================================================

const PageLabel = ({ index, title }) => (
  <div className="budget-page-label print:hidden">
    Page {index} · {title}
  </div>
);

// ============================================================
// ITEM ROW
// ============================================================

const EstimateItemRow = ({ item, index }) => {
  const quantity = Number(item.quantity || 0);
  const rate = Number(item.rate || 0);
  const amount = itemAmount(item);

  return (
    <div
      className="budget-table-row items-start py-4 poa-avoid-break"
      style={{
        borderBottom: `1px solid ${HAIRLINE}`,
        opacity: item.hidden ? 0.5 : 1,
      }}
    >
      <div className="text-[10px]" style={{ color: MUTED }}>
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="min-w-0">
        <div className="text-[12px] font-semibold" style={{ color: INK }}>
          {item.name || "Unnamed Item"}
        </div>

        {item.location && (
          <div className="text-[10px] mt-1" style={{ color: MUTED }}>
            Location: {item.location}
          </div>
        )}

        {item.notes && (
          <div
            className="text-[10px] mt-1 leading-relaxed"
            style={{ color: MUTED }}
          >
            {item.notes}
          </div>
        )}

        {item.calc_type && (
          <div
            className="text-[9px] mt-1 uppercase tracking-wide"
            style={{ color: GOLD }}
          >
            Calculation: {item.calc_type}
          </div>
        )}

        {item.boqItem && (
          <div
            className="text-[9px] mt-1 tracking-wide"
            style={{ color: GOLD }}
          >
            BOQ ITEM: {item.boqItem.name || "Linked BOQ Item"}
          </div>
        )}

        {item.libraryItem && (
          <div
            className="text-[9px] mt-1 tracking-wide"
            style={{ color: GREEN }}
          >
            LIBRARY ITEM
          </div>
        )}

        {item.hidden && (
          <div className="text-[9px] mt-1 font-semibold" style={{ color: RED }}>
            HIDDEN FROM TOTAL
          </div>
        )}
      </div>

      <div className="text-[11px] text-right" style={{ color: INK }}>
        {quantity}
      </div>

      <div className="text-[11px] text-right" style={{ color: INK }}>
        ₹{money(rate)}
      </div>

      <div
        className="text-[11px] text-right font-semibold"
        style={{ color: INK }}
      >
        ₹{money(amount)}
      </div>
    </div>
  );
};

// ============================================================
// SUMMARY LINE
// ============================================================

const SummaryLine = ({
  label,
  value,
  bold = false,
  accent = false,
  negative = false,
}) => (
  <div
    className="flex items-center justify-between py-2"
    style={{
      borderBottom: `1px solid ${HAIRLINE}`,
    }}
  >
    <span
      className={`text-[11px] ${bold ? "font-semibold" : ""}`}
      style={{
        color: accent ? GREEN : INK,
      }}
    >
      {label}
    </span>

    <span
      className={`text-[11px] ${bold ? "font-semibold" : ""}`}
      style={{
        color: accent ? GREEN : INK,
      }}
    >
      {negative ? "- " : ""}₹{money(Math.abs(Number(value || 0)))}
    </span>
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

export function BudgetEstimateView() {
  const { id } = useParams();
  const nav = useNavigate();

  const {
    data: estimate,
    isFetching,
    isError,
  } = useGetBudgetEstimateQuery(id, {
    skip: !id,
  });

  const [deleteBudgetEstimate, { isLoading: deleting }] =
    useDeleteBudgetEstimateMutation();

  const [lockBudgetEstimate, { isLoading: locking }] =
    useLockBudgetEstimateMutation();

  const [unlockBudgetEstimate, { isLoading: unlocking }] =
    useUnlockBudgetEstimateMutation();

  const [exporting, setExporting] = useState(false);

  // ============================================================
  // NORMALIZED DATA
  // ============================================================

  const project = estimate?.project || {};
  const boq = estimate?.boq || {};

  const categories = useMemo(() => {
    return [...(estimate?.categories || [])].sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
    );
  }, [estimate?.categories]);

  const allItems = useMemo(() => {
    return categories.flatMap((category) => category.items || []);
  }, [categories]);

  const visibleItems = useMemo(() => {
    return allItems.filter((item) => !item.hidden);
  }, [allItems]);

  const calculatedSubtotal = useMemo(() => {
    return visibleItems.reduce((sum, item) => {
      return sum + itemAmount(item);
    }, 0);
  }, [visibleItems]);

  const termItems = useMemo(() => {
    return parseTermsHtml(
      estimate?.terms_html ||
        estimate?.terms_content_snapshot ||
        boq?.terms_html ||
        "",
    );
  }, [estimate?.terms_html, estimate?.terms_content_snapshot, boq?.terms_html]);

  // ============================================================
  // SUMMARY VALUES
  // API VALUES ARE AUTHORITATIVE
  // ============================================================

  const subtotal = Number(estimate?.subtotal ?? calculatedSubtotal ?? 0);

  const miscPercentage = Number(estimate?.misc_percentage || 0);
  const miscAmount = Number(estimate?.misc_amount || 0);

  const designAmount = Number(estimate?.design_amount || 0);
  const executionAmount = Number(estimate?.execution_amount || 0);
  const supervisorAmount = Number(estimate?.supervisor_amount || 0);
  const additionalAmount = Number(estimate?.additional_amount || 0);

  const discountAmount = Number(estimate?.discount_amount || 0);

  const taxPercentage = Number(estimate?.tax_percentage || 0);
  const taxAmount = Number(estimate?.tax_amount || 0);

  const totalAmount = Number(estimate?.total_amount || 0);

  const miscellaneous = Array.isArray(estimate?.miscellaneous)
    ? estimate.miscellaneous
    : [];

  const miscellaneousTotal = miscellaneous.reduce(
    (sum, item) => sum + Number(item?.value || 0),
    0,
  );

  // ============================================================
  // PAGE NUMBERING
  // ============================================================

  const categoryPageStart = useMemo(() => {
    let page = 3;

    return categories.map((category) => {
      const result = page;
      const itemPages = Math.max(
        1,
        Math.ceil((category.items || []).length / 10),
      );

      page += itemPages;

      return result;
    });
  }, [categories]);

  const commercialPage =
    3 +
    categories.reduce((total, category) => {
      return total + Math.max(1, Math.ceil((category.items || []).length / 10));
    }, 0);

  const termsPage = commercialPage + 1;

  // ============================================================
  // DELETE
  // ============================================================

  const removeEstimate = async () => {
    if (
      !window.confirm("Delete this Budget Estimate? This cannot be undone.")
    ) {
      return;
    }

    try {
      await deleteBudgetEstimate(id).unwrap();

      toast.success("Budget Estimate deleted successfully");

      nav("/crm/budget-estimates/all");
    } catch (error) {
      toast.error(
        error?.data?.detail ||
          error?.data?.message ||
          "Failed to delete Budget Estimate",
      );
    }
  };

  // ============================================================
  // LOCK
  // ============================================================

  const lockEstimate = async () => {
    if (
      !window.confirm(
        "Lock this Budget Estimate? You will need to unlock it before editing.",
      )
    ) {
      return;
    }

    try {
      await lockBudgetEstimate(id).unwrap();

      toast.success("Budget Estimate locked");
    } catch (error) {
      toast.error(
        error?.data?.detail ||
          error?.data?.message ||
          "Failed to lock Budget Estimate",
      );
    }
  };

  // ============================================================
  // UNLOCK
  // ============================================================

  const unlockEstimate = async () => {
    try {
      await unlockBudgetEstimate(id).unwrap();

      toast.success("Budget Estimate unlocked");
    } catch (error) {
      toast.error(
        error?.data?.detail ||
          error?.data?.message ||
          "Failed to unlock Budget Estimate",
      );
    }
  };

  // ============================================================
  // PDF EXPORT
  // ============================================================

  const exportPdf = async () => {
    const pageEls = Array.from(
      document.querySelectorAll(".budget-print-area .budget-page"),
    );

    if (!pageEls.length) {
      toast.error("No pages available for export");
      return;
    }

    setExporting(true);

    try {
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      const PAGE_W_MM = 210;
      const PAGE_H_MM = 297;

      for (let i = 0; i < pageEls.length; i++) {
        const canvas = await html2canvas(pageEls[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,

          ignoreElements: (element) =>
            element.classList?.contains("budget-page-label"),
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imgData,
          "JPEG",
          0,
          0,
          PAGE_W_MM,
          PAGE_H_MM,
          undefined,
          "FAST",
        );
      }

      const safeName = (project.name || estimate?.title || "budget-estimate")
        .trim()
        .replace(/[^\w-]+/g, "_");

      pdf.save(`${safeName}_Budget_Estimate.pdf`);

      toast.success("Budget Estimate PDF exported");
    } catch (error) {
      console.error("Budget estimate PDF error:", error);

      toast.error("Failed to export Budget Estimate PDF");
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (isFetching) {
    return (
      <Shell title="Budget Estimate">
        <div className="text-[13px] text-[#6B7B7C]">Loading…</div>
      </Shell>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (isError || !estimate) {
    return (
      <Shell title="Budget Estimate">
        <Card>
          <div className="text-center text-[#B5C4B6] py-8">
            Budget Estimate not found, or you don't have access to it.
          </div>
        </Card>
      </Shell>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Shell
      title="Budget Estimate"
      subtitle={`${project.name || "Project"} • ${
        estimate.estimate_number || "Estimate"
      }`}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/crm/budget-estimates/all")}
            className="h-10 px-4 rounded-lg border border-[#DDD8CE] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          {!estimate.locked && (
            <button
              onClick={() => nav(`/crm/forms/budget-estimate/${id}/edit`)}
              className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
            >
              <Edit3 size={14} />
              Edit
            </button>
          )}

          <button
            onClick={exportPdf}
            disabled={exporting}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download size={14} />

            {exporting ? "Exporting…" : "Export PDF"}
          </button>

          {!estimate.locked ? (
            <button
              onClick={lockEstimate}
              disabled={locking}
              className="h-10 px-4 rounded-lg border border-[#C6A15B] text-[13px] font-semibold text-[#8A6B2F] inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Lock size={14} />

              {locking ? "Locking…" : "Lock"}
            </button>
          ) : (
            <button
              onClick={unlockEstimate}
              disabled={unlocking}
              className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Unlock size={14} />

              {unlocking ? "Unlocking…" : "Unlock"}
            </button>
          )}

          <button
            onClick={removeEstimate}
            disabled={deleting || estimate.locked}
            className="h-10 px-4 rounded-lg border border-[#E3B7A4] text-[13px] font-semibold text-[#B04D26] inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 size={14} />

            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      }
    >
      <PrintStyles />

      <div className="budget-preview-backdrop budget-print-area">
        {/* ======================================================
            STATUS
        ====================================================== */}

        <div className="flex justify-end max-w-[794px] mx-auto mb-4 print:hidden">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(
              estimate.status,
              estimate.locked,
            )}`}
          >
            {estimate.locked
              ? "LOCKED"
              : (estimate.status || "DRAFT").toUpperCase()}
          </span>
        </div>

        {/* ======================================================
            PAGE 1 — COVER
        ====================================================== */}

        <div className="budget-page budget-page-cover px-16 pt-10 pb-24 flex flex-col items-center">
          <PageLabel index={1} title="Budget Estimate" />

          <div className="flex flex-col items-center justify-center flex-1 w-full">
            <LogoMark />

            <div
              className="mt-6 text-center font-serif tracking-[0.25em] text-3xl"
              style={{ color: GREEN }}
            >
              RIPPŌTAI
            </div>

            <div
              className="text-center tracking-[0.2em] text-sm mt-1"
              style={{ color: MUTED }}
            >
              BUDGET ESTIMATE
            </div>

            <div className="w-full mt-16">
              <FieldRow>
                <Field label="Project" value={project.name} />

                <Field label="Estimate No." value={estimate.estimate_number} />
              </FieldRow>

              <FieldRow>
                <Field label="Client" value={estimate.client_name} />

                <Field
                  label="Location"
                  value={estimate.location || project.site_location}
                />
              </FieldRow>

              <FieldRow>
                <Field
                  label="Estimate Date"
                  value={formatDate(estimate.estimate_date)}
                />

                <Field label="Prepared By" value={estimate.prepared_by} />
              </FieldRow>

              <FieldRow>
                <Field label="Version" value={`V${estimate.version || 1}`} />

                <Field
                  label="Status"
                  value={
                    estimate.locked
                      ? "Locked"
                      : (estimate.status || "Draft")
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())
                  }
                />
              </FieldRow>
            </div>

            <div className="w-full mt-16">
              <div
                className="text-[10px] tracking-[0.18em] font-semibold"
                style={{ color: GREEN }}
              >
                ESTIMATE VALUE
              </div>

              <div className="text-5xl font-normal mt-3" style={{ color: INK }}>
                ₹{money(totalAmount)}
              </div>

              <div className="text-[11px] mt-2" style={{ color: MUTED }}>
                Total estimated project value including applicable taxes.
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            PAGE 2 — ESTIMATE SUMMARY
        ====================================================== */}

        <div className="budget-page px-16 py-16">
          <PageLabel index={2} title="Estimate Summary" />

          <div className="text-3xl font-normal" style={{ color: INK }}>
            Estimate Summary
          </div>

          <div
            className="mt-6 pt-6"
            style={{
              borderTop: `1px solid ${INK}`,
            }}
          />

          <div className="grid grid-cols-2 gap-16 mt-8">
            <div>
              <div
                className="text-[10px] tracking-[0.15em] font-semibold"
                style={{ color: GREEN }}
              >
                ESTIMATE NUMBER
              </div>

              <div className="text-2xl mt-2" style={{ color: INK }}>
                {estimate.estimate_number}
              </div>
            </div>

            <div>
              <div
                className="text-[10px] tracking-[0.15em] font-semibold"
                style={{ color: GREEN }}
              >
                TOTAL VALUE
              </div>

              <div className="text-2xl mt-2" style={{ color: INK }}>
                ₹{money(totalAmount)}
              </div>
            </div>
          </div>

          {/* SUMMARY */}

          <div className="mt-12">
            <SummaryLine label="Items Subtotal" value={subtotal} />

            {miscPercentage > 0 && (
              <SummaryLine
                label={`Miscellaneous (${miscPercentage}%)`}
                value={miscAmount}
              />
            )}

            {miscellaneousTotal > 0 && (
              <SummaryLine
                label="Additional Miscellaneous"
                value={miscellaneousTotal}
              />
            )}

            {designAmount > 0 && (
              <SummaryLine label="Design" value={designAmount} />
            )}

            {executionAmount > 0 && (
              <SummaryLine label="Execution" value={executionAmount} />
            )}

            {supervisorAmount > 0 && (
              <SummaryLine label="Supervisor" value={supervisorAmount} />
            )}

            {additionalAmount > 0 && (
              <SummaryLine label="Additional Amount" value={additionalAmount} />
            )}

            {discountAmount > 0 && (
              <SummaryLine label="Discount" value={discountAmount} negative />
            )}

            {taxAmount > 0 && (
              <SummaryLine
                label={`Tax (${taxPercentage}%)`}
                value={taxAmount}
              />
            )}

            <div
              className="flex items-center justify-between py-5 mt-3"
              style={{
                borderTop: `2px solid ${INK}`,
              }}
            >
              <span className="text-sm font-semibold" style={{ color: GREEN }}>
                GRAND TOTAL
              </span>

              <span className="text-xl font-semibold" style={{ color: INK }}>
                ₹{money(totalAmount)}
              </span>
            </div>
          </div>

          {/* CATEGORY SUMMARY */}

          <div className="mt-14">
            <div
              className="text-[10px] tracking-[0.15em] font-semibold mb-5"
              style={{ color: GREEN }}
            >
              CATEGORY BREAKDOWN
            </div>

            {categories.map((category, index) => {
              const categoryTotal = categoryAmount(category);

              return (
                <div
                  key={category.id || index}
                  className="flex justify-between py-3"
                  style={{
                    borderBottom: `1px solid ${HAIRLINE}`,
                  }}
                >
                  <span className="text-[12px]" style={{ color: INK }}>
                    {category.name}
                  </span>

                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: INK }}
                  >
                    ₹{money(categoryTotal)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================
            CATEGORY / ITEM PAGES
        ====================================================== */}

        {categories.map((category, categoryIndex) => {
          const items = category.items || [];

          const itemPages = chunkItems(items, 10);

          const pages = itemPages.length ? itemPages : [[]];

          return pages.map((pageItems, pageIndex) => {
            const pageStart = pageIndex * 10;

            const currentPageNumber =
              categoryPageStart[categoryIndex] + pageIndex;

            return (
              <div
                key={`${category.id}-${pageIndex}`}
                className="budget-page px-16 py-16"
              >
                <PageLabel index={currentPageNumber} title={category.name} />

                <div
                  className="text-[10px] tracking-[0.15em] font-semibold"
                  style={{
                    color: GREEN,
                  }}
                >
                  CATEGORY {String(categoryIndex + 1).padStart(2, "0")}
                </div>

                <div
                  className="text-3xl font-normal mt-2"
                  style={{
                    color: INK,
                  }}
                >
                  {category.name || "Untitled Category"}
                </div>

                {items.length > 0 && (
                  <div
                    className="text-[10px] mt-2"
                    style={{
                      color: MUTED,
                    }}
                  >
                    Items {pageStart + 1}–
                    {Math.min(pageStart + pageItems.length, items.length)} of{" "}
                    {items.length}
                  </div>
                )}

                <div className="mt-8">
                  <div
                    className="budget-table-header py-3"
                    style={{
                      borderBottom: `2px solid ${INK}`,
                    }}
                  >
                    <div
                      className="text-[9px] tracking-wide font-semibold"
                      style={{
                        color: GREEN,
                      }}
                    >
                      #
                    </div>

                    <div
                      className="text-[9px] tracking-wide font-semibold"
                      style={{
                        color: GREEN,
                      }}
                    >
                      ITEM
                    </div>

                    <div
                      className="text-[9px] tracking-wide font-semibold text-right"
                      style={{
                        color: GREEN,
                      }}
                    >
                      QTY
                    </div>

                    <div
                      className="text-[9px] tracking-wide font-semibold text-right"
                      style={{
                        color: GREEN,
                      }}
                    >
                      RATE
                    </div>

                    <div
                      className="text-[9px] tracking-wide font-semibold text-right"
                      style={{
                        color: GREEN,
                      }}
                    >
                      AMOUNT
                    </div>
                  </div>

                  {pageItems.map((item, localIndex) => (
                    <EstimateItemRow
                      key={
                        item.id || `${category.id}-${pageStart + localIndex}`
                      }
                      item={item}
                      index={pageStart + localIndex}
                    />
                  ))}

                  {!pageItems.length && (
                    <div
                      className="py-10 text-[11px]"
                      style={{
                        color: MUTED,
                      }}
                    >
                      No items have been added to this category.
                    </div>
                  )}
                </div>

                {pageIndex === pages.length - 1 && (
                  <div
                    className="mt-8 pt-4 flex justify-between"
                    style={{
                      borderTop: `1px solid ${GOLD}`,
                    }}
                  >
                    <span
                      className="text-[10px] tracking-wide"
                      style={{
                        color: MUTED,
                      }}
                    >
                      CATEGORY TOTAL
                    </span>

                    <span
                      className="text-[12px] font-semibold"
                      style={{
                        color: INK,
                      }}
                    >
                      ₹{money(categoryAmount(category))}
                    </span>
                  </div>
                )}
              </div>
            );
          });
        })}

        {/* ======================================================
            COMMERCIAL SUMMARY
        ====================================================== */}

        <div className="budget-page px-16 py-16">
          <PageLabel index={commercialPage} title="Commercial Summary" />

          <div className="text-3xl font-normal" style={{ color: INK }}>
            Commercial Summary
          </div>

          <div
            className="mt-6 pt-6"
            style={{
              borderTop: `1px solid ${INK}`,
            }}
          />

          <div className="mt-8">
            <div
              className="text-[10px] tracking-[0.15em] font-semibold mb-5"
              style={{ color: GREEN }}
            >
              ADDITIONAL COMMERCIAL VALUES
            </div>

            <SummaryLine label="Items Subtotal" value={subtotal} bold />

            {miscPercentage > 0 && (
              <SummaryLine
                label={`Miscellaneous (${miscPercentage}%)`}
                value={miscAmount}
              />
            )}

            {designAmount > 0 && (
              <SummaryLine label="Design Amount" value={designAmount} />
            )}

            {executionAmount > 0 && (
              <SummaryLine label="Execution Amount" value={executionAmount} />
            )}

            {supervisorAmount > 0 && (
              <SummaryLine label="Supervisor Amount" value={supervisorAmount} />
            )}

            {additionalAmount > 0 && (
              <SummaryLine label="Additional Amount" value={additionalAmount} />
            )}

            {discountAmount > 0 && (
              <SummaryLine label="Discount" value={discountAmount} negative />
            )}

            {taxAmount > 0 && (
              <SummaryLine
                label={`Tax (${taxPercentage}%)`}
                value={taxAmount}
              />
            )}

            <div
              className="flex justify-between py-5 mt-4"
              style={{
                borderTop: `2px solid ${INK}`,
                borderBottom: `2px solid ${INK}`,
              }}
            >
              <span className="text-sm font-semibold" style={{ color: GREEN }}>
                TOTAL ESTIMATE
              </span>

              <span className="text-xl font-semibold" style={{ color: INK }}>
                ₹{money(totalAmount)}
              </span>
            </div>
          </div>

          {miscellaneous.length > 0 && (
            <div className="mt-12">
              <div
                className="text-[10px] tracking-[0.15em] font-semibold mb-5"
                style={{ color: GREEN }}
              >
                MISCELLANEOUS ITEMS
              </div>

              {miscellaneous.map((item, index) => (
                <div
                  key={item.id || `misc-${index}`}
                  className="py-4"
                  style={{
                    borderBottom: `1px solid ${HAIRLINE}`,
                  }}
                >
                  <div className="flex justify-between gap-8">
                    <div>
                      <div
                        className="text-[12px] font-semibold"
                        style={{
                          color: INK,
                        }}
                      >
                        {item.name || "Miscellaneous Item"}
                      </div>

                      {item.notes && (
                        <div
                          className="text-[10px] mt-1"
                          style={{
                            color: MUTED,
                          }}
                        >
                          {item.notes}
                        </div>
                      )}
                    </div>

                    <div
                      className="text-[12px] font-semibold whitespace-nowrap"
                      style={{
                        color: INK,
                      }}
                    >
                      ₹{money(item.value)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ======================================================
            TERMS & CONDITIONS
        ====================================================== */}

        <div className="budget-page budget-page-last px-16 py-16">
          <PageLabel index={termsPage} title="Terms & Conditions" />

          <div className="text-3xl font-normal mb-8" style={{ color: INK }}>
            Terms & Conditions
          </div>

          <div>
            {termItems.map((item, index) => {
              const isLast = index === termItems.length - 1;

              const sepColor = index % 2 === 0 ? GOLD : HAIRLINE;

              return (
                <div
                  key={index}
                  className="grid grid-cols-[40px_1fr] gap-4 py-5 poa-avoid-break"
                  style={
                    !isLast
                      ? {
                          borderBottom: `1px solid ${sepColor}`,
                        }
                      : undefined
                  }
                >
                  <div
                    className="text-sm font-semibold"
                    style={{
                      color: GREEN,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div>
                    {item.title && (
                      <div
                        className="text-sm font-semibold"
                        style={{
                          color: INK,
                        }}
                      >
                        {item.title}
                      </div>
                    )}

                    {item.body.map((paragraph, j) => (
                      <p
                        key={j}
                        className="text-[13px] leading-relaxed mt-1"
                        style={{
                          color: "#374151",
                        }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}

            {termItems.length === 0 && (
              <div
                className="text-sm"
                style={{
                  color: MUTED,
                }}
              >
                No terms have been applied to this Budget Estimate yet.
              </div>
            )}
          </div>

          {/* FINAL TOTAL */}

          <div
            className="mt-16 pt-6"
            style={{
              borderTop: `2px solid ${INK}`,
            }}
          >
            <div className="flex justify-between items-end">
              <div>
                <div
                  className="text-[10px] tracking-[0.15em] font-semibold"
                  style={{
                    color: GREEN,
                  }}
                >
                  FINAL ESTIMATE VALUE
                </div>

                <div
                  className="text-[11px] mt-2"
                  style={{
                    color: MUTED,
                  }}
                >
                  {estimate.estimate_number}
                </div>
              </div>

              <div
                className="text-2xl font-semibold"
                style={{
                  color: INK,
                }}
              >
                ₹{money(totalAmount)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export default BudgetEstimateView;
