import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";

import {
  ArrowLeft,
  Download,
  Send,
  CheckCircle2,
  XCircle,
  Trash2,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  X,
  FileText,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { fmtINR, relativeTime, StatusChip } from "@/lib/format";

import {
  useGetQuotationByIdQuery,
  useSubmitQuotationMutation,
  useApproveQuotationMutation,
  useReturnQuotationMutation,
  useDeclineQuotationMutation,
  useSoftDeleteQuotationMutation,
} from "../../api/procuerment/quotation.api";

import html2pdf from "html2pdf.js";

import PrintableQuotation from "../../components/quotations/PrintableQuotation";

/* ============================================================
   CONSTANTS
============================================================ */

const TABS = ["Items", "Commercial Terms", "Approval History", "Versions"];

/* ============================================================
   SMALL HELPERS
============================================================ */

function safeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function quotationNumberOf(quotation, fallback = "") {
  return quotation?.quotationNumber || quotation?.quotation_number || fallback;
}

function getErrorMessage(error, fallback) {
  return error?.data?.message || error?.data?.error || error?.error || fallback;
}

/* ============================================================
   PREVIEW MODAL
============================================================ */

function QuotationPreviewModal({
  quotation,
  adminSignature,
  quotationNumber,
  onClose,
}) {
  const [downloading, setDownloading] = useState(false);

  const downloadPdf = async () => {
    const source = document.getElementById("quotation-preview-document");

    if (!source) {
      toast.error("Quotation preview is not ready");
      return;
    }

    setDownloading(true);

    try {
      /* --------------------------------------------------------
         Wait for images
      -------------------------------------------------------- */

      const images = Array.from(source.querySelectorAll("img"));

      await Promise.all(
        images.map((img) => {
          if (img.complete) {
            return Promise.resolve();
          }

          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }),
      );

      /* --------------------------------------------------------
         Wait for browser layout / paint
      -------------------------------------------------------- */

      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      const filenameNumber = quotationNumber || "quotation";

      const options = {
        margin: 0,

        filename: `Quotation_${filenameNumber}.pdf`,

        image: {
          type: "jpeg",
          quality: 0.96,
        },

        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,

          scrollX: 0,
          scrollY: 0,

          windowWidth: source.scrollWidth,
          width: source.scrollWidth,
        },

        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
          compress: true,
        },

        pagebreak: {
          mode: ["css", "legacy", "avoid-all"],

          avoid: [
            "tr",
            "td",
            "th",
            ".quotation-items",
            ".quotation-totals",
            ".terms-box",
            ".signature-row",
            ".no-break",
          ],
        },
      };

      await html2pdf().set(options).from(source).save();

      toast.success("Quotation PDF downloaded");
    } catch (error) {
      console.error("Quotation PDF export error:", error);

      toast.error("Failed to generate quotation PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 flex flex-col"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {/* ======================================================
          PREVIEW HEADER
      ====================================================== */}

      <div className="h-14 shrink-0 bg-white border-b border-[#D5DDD7] px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#103E31] text-white flex items-center justify-center shrink-0">
            <FileText size={15} />
          </div>

          <div className="min-w-0">
            <div className="text-[14px] font-bold text-[#202724] truncate">
              Quotation Preview
            </div>

            <div className="text-[10.5px] text-[#748078] truncate">
              {quotationNumber || "Quotation"}
            </div>
          </div>

          <span className="hidden sm:inline-flex px-2 py-1 rounded-full bg-[#EEF3EF] text-[#103E31] text-[9px] font-bold tracking-[0.12em] uppercase">
            A4
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={downloadPdf}
            disabled={downloading}
            className="
              h-9
              px-3.5
              rounded-lg
              bg-[#103E31]
              text-white
              text-[11.5px]
              font-semibold
              inline-flex
              items-center
              gap-2
              shadow-sm
              hover:bg-[#0B3026]
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            <Download size={14} />

            {downloading ? "Generating PDF…" : "Download PDF"}
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Close preview"
            className="
              w-9
              h-9
              rounded-lg
              border
              border-[#C8D1CA]
              bg-white
              text-[#333]
              inline-flex
              items-center
              justify-center
              hover:bg-[#F3F5F3]
            "
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* ======================================================
          PREVIEW CANVAS
      ====================================================== */}

      <div
        className="
          flex-1
          overflow-auto
          bg-[#525659]
          px-3
          py-5
          sm:px-6
          sm:py-8
        "
      >
        <div className="min-w-fit flex justify-center items-start pb-12">
          <div
            id="quotation-preview-document"
            className="bg-white shadow-[0_12px_45px_rgba(0,0,0,0.30)]"
            style={{
              width: "210mm",
              minHeight: "297mm",
              background: "#ffffff",
            }}
          >
            <PrintableQuotation
              quotation={quotation}
              termsConditions={quotation.terms_conditions}
              adminSignature={adminSignature}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState("Items");

  const [remarkModal, setRemarkModal] = useState(null);

  const [remark, setRemark] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);

  const [expandedItems, setExpandedItems] = useState({});

  /* ==========================================================
     QUOTATION QUERY
  ========================================================== */

  const {
    data: quotationResponse,
    isLoading,
    isFetching,
    error: quotationError,
  } = useGetQuotationByIdQuery(id, {
    skip: !id,
  });

  /*
   * Supports both:
   *
   * {
   *   data: quotation
   * }
   *
   * and:
   *
   * quotation
   */

  const q =
    quotationResponse?.data?.data ??
    quotationResponse?.data ??
    quotationResponse ??
    null;

  /* ==========================================================
     MUTATIONS
  ========================================================== */

  const [submitQuotation, { isLoading: isSubmitting }] =
    useSubmitQuotationMutation();

  const [approveQuotationMutation, { isLoading: isApproving }] =
    useApproveQuotationMutation();

  const [returnQuotationMutation, { isLoading: isReturning }] =
    useReturnQuotationMutation();

  const [declineQuotationMutation, { isLoading: isDeclining }] =
    useDeclineQuotationMutation();

  const [softDeleteQuotation, { isLoading: isDeleting }] =
    useSoftDeleteQuotationMutation();

  /* ==========================================================
     QUERY ERROR
  ========================================================== */

  useEffect(() => {
    if (!quotationError) {
      return;
    }

    console.error("Failed to load quotation:", quotationError);

    toast.error(getErrorMessage(quotationError, "Failed to load quotation"));
  }, [quotationError]);

  /* ==========================================================
     DERIVED DATA
  ========================================================== */

  const vendor = q?.vendor || q?.vendorSnapshot || {};

  const project = q?.project || q?.projectSnapshot || {};

  const isAdmin =
    user?.role === "ADMIN" ||
    user?.roleName === "ADMIN" ||
    user?.isAdmin === true;

  const readOnly = q?.status === "approved" && !isAdmin;

  const editable = !readOnly && ["draft", "returned"].includes(q?.status);

  const isDeleted = !!q?.deletedAt;

  const items = safeArray(q?.items);

  const subtotal = safeNumber(q?.subtotal);

  const taxAmount = safeNumber(q?.taxAmount);

  const additionalCharges = safeNumber(q?.additionalCharges);

  const discountValue = safeNumber(q?.discount ?? q?.globalDiscountValue);

  const total = safeNumber(q?.totalAmount);

  /* ==========================================================
     PRINTABLE NORMALIZATION
  ========================================================== */

  const printableQuotation = useMemo(() => {
    if (!q) {
      return null;
    }

    const quotationItems = safeArray(q.items);

    return {
      quotation_number: q.quotationNumber || q.quotation_number || "",

      quotation_date: q.quotationDate || q.quotation_date || "",

      status: q.status || "",

      vendor_type:
        vendor.businessType?.name || vendor.vendorCategory?.name || "",

      vendor_name: vendor.name || "",

      phone_number: vendor.contact_number || vendor.phone || "",

      address: vendor.address || "",

      project_name: project.name || "",

      project_address: project.site_location || project.address || "",

      client_name: q.client_name || q.clientName || "",

      client_phone: q.client_phone || q.clientPhone || "",

      client_address: q.client_address || q.clientAddress || "",

      items: quotationItems.map((item, index) => ({
        id: item.id,

        sno: item.sno || index + 1,

        particular: item.particular || item.description || item.name || "",

        rate: safeNumber(item.rate),

        quantity: safeNumber(item.quantity),

        amount: safeNumber(item.amount),

        remarks: item.remarks || "",
      })),

      subtotal: safeNumber(q.subtotal),

      tax_percent: safeNumber(q.taxPercent),

      tax_amount: safeNumber(q.taxAmount),

      additional_charges: safeNumber(q.additionalCharges),

      discount: safeNumber(q.discount ?? q.globalDiscountValue),

      discount_type: q.globalDiscountType || "fixed",

      grand_total: safeNumber(q.totalAmount),

      payment_terms: q.paymentTerms || q.payment_terms || [],

      terms_conditions: q.termsConditions || q.terms_conditions || "",
    };
  }, [q, vendor, project]);

  /* ==========================================================
     ACTION STATE
  ========================================================== */

  const actionLoading =
    isSubmitting || isApproving || isReturning || isDeclining || isDeleting;

  /* ==========================================================
     SUBMIT / SEND FOR APPROVAL
  ========================================================== */

  const handleSubmitQuotation = async () => {
    if (!id) {
      return;
    }

    try {
      await submitQuotation({
        id,
        submitted_by: user?.id,
      }).unwrap();

      toast.success("Quotation submitted for approval");
    } catch (error) {
      console.error("Submit quotation error:", error);

      toast.error(getErrorMessage(error, "Failed to submit quotation"));
    }
  };

  /* ==========================================================
     APPROVE
  ========================================================== */

  const handleApproveQuotation = async () => {
    if (!id) {
      return;
    }

    try {
      await approveQuotationMutation({
        id,
      }).unwrap();

      toast.success("Quotation approved");
    } catch (error) {
      console.error("Approve quotation error:", error);

      toast.error(getErrorMessage(error, "Failed to approve quotation"));
    }
  };

  /* ==========================================================
     DECLINE
  ========================================================== */

  const handleDeclineQuotation = async () => {
    if (!id) {
      return;
    }

    try {
      await declineQuotationMutation({
        id,
        remark: remark.trim(),
      }).unwrap();

      toast.success("Quotation declined");

      setRemarkModal(null);
      setRemark("");
    } catch (error) {
      console.error("Decline quotation error:", error);

      toast.error(getErrorMessage(error, "Failed to decline quotation"));
    }
  };

  /* ==========================================================
     RETURN
  ========================================================== */

  const handleReturnQuotation = async () => {
    if (!id) {
      return;
    }

    try {
      await returnQuotationMutation({
        id,
        remark: remark.trim(),
      }).unwrap();

      toast.success("Quotation returned");

      setRemarkModal(null);
      setRemark("");
    } catch (error) {
      console.error("Return quotation error:", error);

      toast.error(getErrorMessage(error, "Failed to return quotation"));
    }
  };

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDeleteQuotation = async () => {
    if (!id) {
      return;
    }

    const confirmed = window.confirm("Delete this quotation?");

    if (!confirmed) {
      return;
    }

    try {
      await softDeleteQuotation({
        id,
        deleted_by: user?.id,
      }).unwrap();

      toast.success("Quotation deleted");

      navigate("/quotations");
    } catch (error) {
      console.error("Delete quotation error:", error);

      toast.error(getErrorMessage(error, "Failed to delete quotation"));
    }
  };

  /* ==========================================================
     TOGGLE ITEM
  ========================================================== */

  const toggleItem = (itemId) => {
    setExpandedItems((current) => ({
      ...current,
      [itemId]: !current[itemId],
    }));
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-[13px] text-[#66736B]">Loading quotation…</div>
      </div>
    );
  }

  /* ==========================================================
     NOT FOUND
  ========================================================== */

  if (!q) {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() => navigate("/quotations")}
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#103E31]"
        >
          <ArrowLeft size={15} />
          Back to quotations
        </button>

        <div className="mt-8 rounded-xl border border-[#D5DDD7] bg-white p-8 text-center">
          <div className="text-[15px] font-semibold text-[#333]">
            Quotation not found
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     MAIN UI
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#F7F8F7]">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="sticky top-0 z-30 bg-white border-b border-[#D9E0DA]">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate("/quotations")}
                className="inline-flex items-center gap-1.5 text-[11px] text-[#6D7871] hover:text-[#103E31] mb-1"
              >
                <ArrowLeft size={13} />
                Quotations
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[18px] font-bold text-[#202724]">
                  {quotationNumberOf(q, id)}
                </h1>

                <StatusChip status={q.status} />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* ==================================================
                  PDF PREVIEW
              ================================================== */}

              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                disabled={!printableQuotation}
                data-testid="btn-export-pdf"
                className="
                  px-3
                  py-1.5
                  rounded-lg
                  border
                  border-[#B5C4B6]
                  text-[12px]
                  font-semibold
                  inline-flex
                  items-center
                  gap-1.5
                  bg-white
                  hover:bg-[#F2F5F2]
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                <FileText size={13} />
                PDF Preview
              </button>

              {editable && (
                <Link
                  to={`/quotations/${id}/edit`}
                  className="
                    px-3
                    py-1.5
                    rounded-lg
                    bg-[#103E31]
                    text-white
                    text-[12px]
                    font-semibold
                  "
                >
                  Edit
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ====================================================
            TABS
        ==================================================== */}

        <div className="px-4 sm:px-6 flex gap-5 overflow-x-auto">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={`
                py-2.5
                text-[12px]
                font-semibold
                whitespace-nowrap
                border-b-2
                ${
                  tab === name
                    ? "border-[#103E31] text-[#103E31]"
                    : "border-transparent text-[#748078]"
                }
              `}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================
          PAGE CONTENT
      ====================================================== */}

      <div className="p-4 sm:p-6 max-w-[1500px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
          <div className="space-y-5">
            {/* =================================================
                QUOTATION INFO
            ================================================= */}

            <div className="bg-white border border-[#D9E0DA] rounded-xl">
              <div className="px-5 py-4 border-b border-[#E2E7E3]">
                <h2 className="text-[14px] font-bold text-[#25302B]">
                  Quotation Details
                </h2>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                <Info
                  label="Quotation Number"
                  value={quotationNumberOf(q, "—")}
                />

                <Info
                  label="Quotation Date"
                  value={q.quotationDate || q.quotation_date || "—"}
                />

                <Info label="Status" value={<StatusChip status={q.status} />} />

                <Info label="Vendor" value={vendor.name || "—"} />

                <Info
                  label="Vendor Type"
                  value={
                    vendor.businessType?.name ||
                    vendor.vendorCategory?.name ||
                    "—"
                  }
                />

                <Info
                  label="Vendor Phone"
                  value={vendor.contact_number || vendor.phone || "—"}
                />

                <Info label="Project" value={project.name || "—"} />

                <Info
                  label="Project Address"
                  value={project.site_location || project.address || "—"}
                />

                <Info
                  label="Client"
                  value={q.client_name || q.clientName || "—"}
                />
              </div>
            </div>

            {/* =================================================
                ITEMS
            ================================================= */}

            {tab === "Items" && (
              <div className="bg-white border border-[#D9E0DA] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#E2E7E3] flex items-center justify-between">
                  <div>
                    <h2 className="text-[14px] font-bold text-[#25302B]">
                      Items
                    </h2>

                    <div className="text-[11px] text-[#78837D] mt-0.5">
                      {items.length} item
                      {items.length === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#F5F7F5] border-b border-[#D9E0DA]">
                        <th className="px-4 py-3 text-[10px] uppercase tracking-wide text-[#6F7A73]">
                          #
                        </th>

                        <th className="px-4 py-3 text-[10px] uppercase tracking-wide text-[#6F7A73]">
                          Particular
                        </th>

                        <th className="px-4 py-3 text-[10px] uppercase tracking-wide text-[#6F7A73] text-right">
                          Qty
                        </th>

                        <th className="px-4 py-3 text-[10px] uppercase tracking-wide text-[#6F7A73] text-right">
                          Rate
                        </th>

                        <th className="px-4 py-3 text-[10px] uppercase tracking-wide text-[#6F7A73] text-right">
                          Amount
                        </th>

                        <th className="w-10" />
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item, index) => {
                        const itemId = item.id || index;

                        const expanded = expandedItems[itemId];

                        return (
                          <React.Fragment key={itemId}>
                            <tr className="border-b border-[#E7EBE8]">
                              <td className="px-4 py-3 text-[12px] text-[#68736D]">
                                {item.sno || index + 1}
                              </td>

                              <td className="px-4 py-3">
                                <div className="text-[12px] font-semibold text-[#29332E]">
                                  {item.particular ||
                                    item.description ||
                                    item.name ||
                                    "—"}
                                </div>

                                {item.remarks && (
                                  <div className="text-[10.5px] text-[#78837D] mt-1">
                                    {item.remarks}
                                  </div>
                                )}
                              </td>

                              <td className="px-4 py-3 text-[12px] text-right">
                                {safeNumber(item.quantity)}
                              </td>

                              <td className="px-4 py-3 text-[12px] text-right">
                                {fmtINR(safeNumber(item.rate))}
                              </td>

                              <td className="px-4 py-3 text-[12px] font-semibold text-right">
                                {fmtINR(safeNumber(item.amount))}
                              </td>

                              <td className="px-2">
                                {item.remarks && (
                                  <button
                                    type="button"
                                    onClick={() => toggleItem(itemId)}
                                    className="w-7 h-7 flex items-center justify-center"
                                  >
                                    {expanded ? (
                                      <ChevronDown size={14} />
                                    ) : (
                                      <ChevronRight size={14} />
                                    )}
                                  </button>
                                )}
                              </td>
                            </tr>

                            {expanded && item.remarks && (
                              <tr className="bg-[#FAFBFA]">
                                <td />

                                <td colSpan={5} className="px-4 py-3">
                                  <div className="text-[10px] uppercase tracking-wide font-semibold text-[#718078] mb-1">
                                    Remarks
                                  </div>

                                  <div className="text-[12px] text-[#3B4640]">
                                    {item.remarks}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}

                      {items.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-10 text-center text-[12px] text-[#78837D]"
                          >
                            No quotation items found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================================================
                COMMERCIAL TERMS
            ================================================= */}

            {tab === "Commercial Terms" && (
              <div className="bg-white border border-[#D9E0DA] rounded-xl">
                <div className="px-5 py-4 border-b border-[#E2E7E3]">
                  <h2 className="text-[14px] font-bold text-[#25302B]">
                    Commercial Terms
                  </h2>
                </div>

                <div className="p-5 space-y-5">
                  <Info
                    label="Payment Terms"
                    value={
                      Array.isArray(q.paymentTerms || q.payment_terms)
                        ? (q.paymentTerms || q.payment_terms || [])
                            .map((term) =>
                              typeof term === "string"
                                ? term
                                : term?.label || term?.name || "",
                            )
                            .filter(Boolean)
                            .join(", ") || "—"
                        : q.paymentTerms || q.payment_terms || "—"
                    }
                  />

                  <div>
                    <div className="text-[10px] uppercase tracking-wide font-semibold text-[#758078] mb-2">
                      Terms & Conditions
                    </div>

                    <div className="rounded-lg bg-[#F7F9F7] border border-[#E0E6E1] p-4 whitespace-pre-wrap text-[12px] leading-6 text-[#354039]">
                      {q.termsConditions ||
                        q.terms_conditions ||
                        "No terms and conditions specified."}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                APPROVAL HISTORY
            ================================================= */}

            {tab === "Approval History" && (
              <div className="bg-white border border-[#D9E0DA] rounded-xl">
                <div className="px-5 py-4 border-b border-[#E2E7E3]">
                  <h2 className="text-[14px] font-bold text-[#25302B]">
                    Approval History
                  </h2>
                </div>

                <div className="p-5">
                  {safeArray(q.approvalHistory || q.approval_history).length ===
                  0 ? (
                    <div className="text-[12px] text-[#78837D]">
                      No approval history available.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {safeArray(q.approvalHistory || q.approval_history).map(
                        (history, index) => (
                          <div key={history.id || index} className="flex gap-3">
                            <div className="w-7 h-7 rounded-full bg-[#EEF3EF] flex items-center justify-center text-[#103E31] shrink-0">
                              <CheckCircle2 size={14} />
                            </div>

                            <div>
                              <div className="text-[12px] font-semibold text-[#303A34]">
                                {history.action || history.status || "Updated"}
                              </div>

                              <div className="text-[10.5px] text-[#7B857F] mt-0.5">
                                {history.user?.name ||
                                  history.userName ||
                                  history.actorName ||
                                  "System"}

                                {" · "}

                                {history.createdAt
                                  ? relativeTime(history.createdAt)
                                  : ""}
                              </div>

                              {history.remark && (
                                <div className="mt-2 text-[11.5px] text-[#4C5750]">
                                  {history.remark}
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =================================================
                VERSIONS
            ================================================= */}

            {tab === "Versions" && (
              <div className="bg-white border border-[#D9E0DA] rounded-xl">
                <div className="px-5 py-4 border-b border-[#E2E7E3]">
                  <h2 className="text-[14px] font-bold text-[#25302B]">
                    Versions
                  </h2>
                </div>

                <div className="p-5">
                  {safeArray(q.versions).length === 0 ? (
                    <div className="text-[12px] text-[#78837D]">
                      No versions available.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {safeArray(q.versions).map((version, index) => (
                        <div
                          key={version.id || index}
                          className="border border-[#E2E7E3] rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-[12px] font-semibold">
                              Version {version.version || index + 1}
                            </div>

                            <div className="text-[10.5px] text-[#7A847E]">
                              {version.createdAt
                                ? relativeTime(version.createdAt)
                                : ""}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ==================================================
              RIGHT SUMMARY
          ================================================== */}

          <div className="space-y-5">
            {/* =================================================
                COMMERCIAL SUMMARY
            ================================================= */}

            <div className="bg-white border border-[#D9E0DA] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E7E3]">
                <h2 className="text-[14px] font-bold text-[#25302B]">
                  Commercial Summary
                </h2>
              </div>

              <div className="p-5 space-y-3">
                <SummaryRow label="Subtotal" value={fmtINR(subtotal)} />

                <SummaryRow
                  label={`Tax ${safeNumber(q.taxPercent)}%`}
                  value={fmtINR(taxAmount)}
                />

                <SummaryRow
                  label="Additional Charges"
                  value={fmtINR(additionalCharges)}
                />

                <SummaryRow
                  label="Discount"
                  value={`- ${fmtINR(discountValue)}`}
                />

                <div className="pt-3 mt-3 border-t border-[#DCE3DD]">
                  <SummaryRow
                    label="Grand Total"
                    value={fmtINR(total)}
                    strong
                  />
                </div>
              </div>
            </div>

            {/* =================================================
                ACTIONS
            ================================================= */}

            {!isDeleted && (
              <div className="bg-white border border-[#D9E0DA] rounded-xl p-5">
                <div className="text-[11px] uppercase tracking-wide font-bold text-[#758078] mb-3">
                  Actions
                </div>

                <div className="space-y-2">
                  {/* ------------------------------------------------
                      DRAFT → SUBMIT
                  ------------------------------------------------ */}

                  {q.status === "draft" && (
                    <button
                      type="button"
                      onClick={handleSubmitQuotation}
                      disabled={actionLoading}
                      className="
                        w-full
                        h-9
                        rounded-lg
                        bg-[#103E31]
                        text-white
                        text-[12px]
                        font-semibold
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                      "
                    >
                      <Send size={14} />

                      {isSubmitting ? "Submitting…" : "Send for Approval"}
                    </button>
                  )}

                  {/* ------------------------------------------------
                      PENDING APPROVAL
                  ------------------------------------------------ */}

                  {q.status === "pending_approval" && (
                    <>
                      <button
                        type="button"
                        onClick={handleApproveQuotation}
                        disabled={actionLoading}
                        className="
                          w-full
                          h-9
                          rounded-lg
                          bg-[#103E31]
                          text-white
                          text-[12px]
                          font-semibold
                          inline-flex
                          items-center
                          justify-center
                          gap-2
                          disabled:opacity-50
                          disabled:cursor-not-allowed
                        "
                      >
                        <CheckCircle2 size={14} />

                        {isApproving ? "Approving…" : "Approve"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setRemarkModal("reject")}
                        disabled={actionLoading}
                        className="
                          w-full
                          h-9
                          rounded-lg
                          border
                          border-[#D8BABA]
                          text-[#8B3434]
                          text-[12px]
                          font-semibold
                          inline-flex
                          items-center
                          justify-center
                          gap-2
                          disabled:opacity-50
                        "
                      >
                        <XCircle size={14} />
                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() => setRemarkModal("return")}
                        disabled={actionLoading}
                        className="
                          w-full
                          h-9
                          rounded-lg
                          border
                          border-[#C9D3CB]
                          text-[#3C4942]
                          text-[12px]
                          font-semibold
                          inline-flex
                          items-center
                          justify-center
                          gap-2
                          disabled:opacity-50
                        "
                      >
                        <RotateCcw size={14} />
                        Return
                      </button>
                    </>
                  )}

                  {/* ------------------------------------------------
                      RETURNED
                  ------------------------------------------------ */}

                  {q.status === "returned" && (
                    <button
                      type="button"
                      onClick={() => navigate(`/quotations/${id}/edit`)}
                      className="
                        w-full
                        h-9
                        rounded-lg
                        bg-[#103E31]
                        text-white
                        text-[12px]
                        font-semibold
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                      "
                    >
                      <RotateCcw size={14} />
                      Revise Quotation
                    </button>
                  )}

                  {/* ------------------------------------------------
                      ADMIN DELETE
                  ------------------------------------------------ */}

                  {isAdmin && !isDeleted && (
                    <button
                      type="button"
                      onClick={handleDeleteQuotation}
                      disabled={actionLoading}
                      className="
                          w-full
                          h-9
                          rounded-lg
                          border
                          border-[#E1CACA]
                          text-[#913B3B]
                          text-[12px]
                          font-semibold
                          inline-flex
                          items-center
                          justify-center
                          gap-2
                          disabled:opacity-50
                          disabled:cursor-not-allowed
                        "
                    >
                      <Trash2 size={14} />

                      {isDeleting ? "Deleting…" : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          BACKGROUND FETCH INDICATOR
      ====================================================== */}

      {isFetching && !isLoading && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="px-3 py-2 rounded-lg bg-[#103E31] text-white text-[11px] font-semibold shadow-lg">
            Updating quotation…
          </div>
        </div>
      )}

      {/* ======================================================
          REMARK MODAL
      ====================================================== */}

      {remarkModal && (
        <div className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-[520px] rounded-xl bg-white shadow-2xl border border-[#D7DED8]">
            <div className="px-5 py-4 border-b border-[#E1E6E2] flex items-center justify-between">
              <div>
                <div className="text-[14px] font-bold text-[#29332E]">
                  {remarkModal === "reject"
                    ? "Reject Quotation"
                    : "Return Quotation"}
                </div>

                <div className="text-[11px] text-[#7B857F] mt-0.5">
                  Add a remark for the quotation.
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRemarkModal(null);

                  setRemark("");
                }}
                className="
                  w-8
                  h-8
                  rounded-lg
                  border
                  border-[#D6DED7]
                  flex
                  items-center
                  justify-center
                "
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5">
              <textarea
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                rows={5}
                placeholder="Enter remark…"
                className="
                  w-full
                  rounded-lg
                  border
                  border-[#CBD5CE]
                  px-3
                  py-2.5
                  text-[12px]
                  outline-none
                  focus:border-[#103E31]
                  resize-none
                "
              />

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRemarkModal(null);

                    setRemark("");
                  }}
                  className="
                    px-3
                    py-2
                    rounded-lg
                    border
                    border-[#CBD5CE]
                    text-[12px]
                    font-semibold
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={
                    remarkModal === "reject"
                      ? handleDeclineQuotation
                      : handleReturnQuotation
                  }
                  className="
                    px-3
                    py-2
                    rounded-lg
                    bg-[#103E31]
                    text-white
                    text-[12px]
                    font-semibold
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  {remarkModal === "reject"
                    ? isDeclining
                      ? "Rejecting…"
                      : "Reject"
                    : isReturning
                      ? "Returning…"
                      : "Return"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          VISIBLE QUOTATION PREVIEW
      ====================================================== */}

      {previewOpen && printableQuotation && (
        <QuotationPreviewModal
          quotation={printableQuotation}
          adminSignature={q.adminSignature}
          quotationNumber={quotationNumberOf(q, id)}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}

/* ============================================================
   INFO COMPONENT
============================================================ */

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide font-semibold text-[#78837D] mb-1">
        {label}
      </div>

      <div className="text-[12px] font-medium text-[#303A34] break-words">
        {value}
      </div>
    </div>
  );
}

/* ============================================================
   SUMMARY ROW
============================================================ */

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div
        className={
          strong
            ? "text-[13px] font-bold text-[#26322C]"
            : "text-[11.5px] text-[#68736D]"
        }
      >
        {label}
      </div>

      <div
        className={
          strong
            ? "text-[15px] font-bold text-[#103E31]"
            : "text-[12px] font-semibold text-[#354039]"
        }
      >
        {value}
      </div>
    </div>
  );
}
