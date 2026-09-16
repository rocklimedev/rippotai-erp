import React, { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  Edit3,
  FileText,
  Loader2,
  ShieldCheck,
  X,
  XCircle,
  Ban,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";

import { Card } from "../../hooks/shared";

import {
  useGetPurchaseOrdersQuery,
  useUpdatePurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
} from "../../api/procuerment/purchase-order.api";

/* ==========================================================================
   CONFIGURATION
   ========================================================================== */

const STATUS_OPTIONS = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "SENT",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
];

/* ==========================================================================
   TERMS FROM PURCHASE ORDER PDF
   ========================================================================== */

const TERMS = [
  "This PO is issued only against an approved BOQ line or an accepted Quotation.",
  "Material must match the approved sample / specification exactly — brand, batch and grade.",
  "Delivery only against this PO number; unannounced deliveries may be refused at site.",
  "Invoice must reference this PO number and be accompanied by the signed Delivery Challan.",
  "Any variation in rate, quantity or specification requires written approval before dispatch.",
];

/* ==========================================================================
   HELPERS
   ========================================================================== */

function formatCurrency(value) {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value, decimals = 3) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

function formatDate(value) {
  if (!value) return "—";

  const stringValue = String(value);

  /*
   * DATEONLY values must not be timezone shifted.
   */
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    const [year, month, day] = stringValue.split("-");

    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return stringValue;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getStatusClass(status) {
  switch (String(status || "").toUpperCase()) {
    case "APPROVED":
      return "bg-[#E7F3EC] text-[#1F6B45] border-[#BBDAC8]";

    case "PENDING_APPROVAL":
      return "bg-[#FFF7E5] text-[#946C19] border-[#EBD59D]";

    case "REJECTED":
      return "bg-[#FDECEC] text-[#A23A3A] border-[#E5BABA]";

    case "SENT":
      return "bg-[#EAF2F7] text-[#37657D] border-[#C4D8E3]";

    case "PARTIALLY_RECEIVED":
      return "bg-[#FFF7E5] text-[#946C19] border-[#EBD59D]";

    case "RECEIVED":
      return "bg-[#E7F3EC] text-[#1F6B45] border-[#BBDAC8]";

    case "CANCELLED":
      return "bg-[#F2F2F2] text-[#777777] border-[#D7D7D7]";

    case "DRAFT":
    default:
      return "bg-[#F4F6F7] text-[#647273] border-[#DCE3E1]";
  }
}

function chunkItems(items, size = 10) {
  const result = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  /*
   * Always render at least one page.
   */
  if (!result.length) {
    result.push([]);
  }

  return result;
}

/* ==========================================================================
   MAIN PAGE
   ========================================================================== */

export default function PurchaseOrderView() {
  const { id } = useParams();
  const nav = useNavigate();

  const pdfRef = useRef(null);

  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const [approvalAction, setApprovalAction] = useState(null);

  const [approvalReason, setApprovalReason] = useState("");

  const [showCancelModal, setShowCancelModal] = useState(false);

  const [cancelReason, setCancelReason] = useState("");

  const [downloading, setDownloading] = useState(false);

  /* ==========================================================================
     API
     ========================================================================== */

  const {
    data: rows = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetPurchaseOrdersQuery();

  const [updatePurchaseOrder, { isLoading: updating }] =
    useUpdatePurchaseOrderMutation();

  const [approvePurchaseOrder, { isLoading: approving }] =
    useApprovePurchaseOrderMutation();

  const [cancelPurchaseOrder, { isLoading: cancelling }] =
    useCancelPurchaseOrderMutation();

  const actionLoading = updating || approving || cancelling || downloading;

  /* ==========================================================================
     FIND PO
     ========================================================================== */

  const po = useMemo(() => {
    return rows.find((item) => String(item.id) === String(id));
  }, [rows, id]);

  /* ==========================================================================
     ITEMS
     ========================================================================== */

  const items = useMemo(() => {
    if (!po || !Array.isArray(po.items)) {
      return [];
    }

    return [...po.items].sort(
      (a, b) => Number(a.line_number || 0) - Number(b.line_number || 0),
    );
  }, [po]);

  /*
   * The original PDF contains exactly 10 item rows.
   *
   * For larger POs we create:
   *
   * Page 1  -> items 1-10
   * Page 2  -> items 11-20
   * Page 3  -> items 21-30
   * ...
   */
  const itemPages = useMemo(() => {
    return chunkItems(items, 10);
  }, [items]);

  /* ==========================================================================
     TOTALS
     ========================================================================== */

  const calculatedTotals = useMemo(() => {
    if (!po) {
      return {
        subtotal: 0,
        discount: 0,
        gstPercent: 0,
        gstAmount: 0,
        cartage: 0,
        total: 0,
      };
    }

    const subtotalFromItems = items.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    const subtotal =
      po.subtotal !== null && po.subtotal !== undefined && po.subtotal !== ""
        ? Number(po.subtotal)
        : subtotalFromItems;

    const discount = Number(po.discount || 0);

    const gstPercent = Number(po.gst_percent || 0);

    const gstAmount =
      po.gst_amount !== null &&
      po.gst_amount !== undefined &&
      po.gst_amount !== ""
        ? Number(po.gst_amount)
        : ((subtotal - discount) * gstPercent) / 100;

    const cartage = Number(po.cartage || 0);

    const total =
      po.total_amount !== null &&
      po.total_amount !== undefined &&
      po.total_amount !== ""
        ? Number(po.total_amount)
        : subtotal - discount + gstAmount + cartage;

    return {
      subtotal,
      discount,
      gstPercent,
      gstAmount,
      cartage,
      total,
    };
  }, [po, items]);

  /* ==========================================================================
     CURRENT STATUS
     ========================================================================== */

  const currentStatus = String(po?.status || "DRAFT").toUpperCase();

  const canApprove =
    currentStatus === "DRAFT" ||
    currentStatus === "PENDING_APPROVAL" ||
    currentStatus === "REJECTED";

  const canReject =
    currentStatus === "DRAFT" || currentStatus === "PENDING_APPROVAL";

  const canCancel =
    currentStatus !== "CANCELLED" && currentStatus !== "RECEIVED";

  /* ==========================================================================
     UPDATE STATUS
     ========================================================================== */

  const handleUpdateStatus = async (status) => {
    if (!po?.id || status === currentStatus) {
      return;
    }

    try {
      await updatePurchaseOrder({
        id: po.id,
        status,
      }).unwrap();

      toast.success(
        `Purchase order status updated to ${status.replaceAll("_", " ")}.`,
      );

      setShowStatusMenu(false);

      await refetch();
    } catch (error) {
      console.error("Purchase order status update:", error);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to update purchase order status.",
      );
    }
  };

  /* ==========================================================================
     APPROVE
     ========================================================================== */

  const handleApprove = async () => {
    if (!po?.id) return;

    try {
      await approvePurchaseOrder(po.id).unwrap();

      toast.success("Purchase order approved.");

      setShowApprovalModal(false);
      setApprovalAction(null);
      setApprovalReason("");

      await refetch();
    } catch (error) {
      console.error("Approve purchase order:", error);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to approve purchase order.",
      );
    }
  };

  /* ==========================================================================
     REJECT
     ========================================================================== */

  const handleReject = async () => {
    if (!po?.id) return;

    if (!approvalReason.trim()) {
      toast.error("Please enter a rejection reason.");

      return;
    }

    try {
      /*
       * Your current API already supports PATCH /:id.
       *
       * We use that endpoint for REJECTED rather than
       * inventing a /reject endpoint which is not present
       * in the supplied purchase-order API.
       */
      await updatePurchaseOrder({
        id: po.id,
        status: "REJECTED",
        rejection_reason: approvalReason.trim(),
      }).unwrap();

      toast.success("Purchase order rejected.");

      setShowApprovalModal(false);
      setApprovalAction(null);
      setApprovalReason("");

      await refetch();
    } catch (error) {
      console.error("Reject purchase order:", error);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to reject purchase order.",
      );
    }
  };

  /* ==========================================================================
     CANCEL
     ========================================================================== */

  const handleCancel = async () => {
    if (!po?.id) return;

    try {
      await cancelPurchaseOrder(po.id).unwrap();

      toast.success("Purchase order cancelled.");

      setShowCancelModal(false);
      setCancelReason("");

      await refetch();
    } catch (error) {
      console.error("Cancel purchase order:", error);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to cancel purchase order.",
      );
    }
  };

  /* ==========================================================================
     OPEN APPROVAL MODAL
     ========================================================================== */

  const openApprovalModal = (action) => {
    setApprovalAction(action);
    setApprovalReason("");
    setShowApprovalModal(true);
    setShowStatusMenu(false);
  };

  const closeApprovalModal = () => {
    if (actionLoading) return;

    setShowApprovalModal(false);
    setApprovalAction(null);
    setApprovalReason("");
  };

  /* ==========================================================================
     DOWNLOAD PDF
     ========================================================================== */

  const handleDownloadPDF = async () => {
    if (!pdfRef.current || !po) {
      return;
    }

    setDownloading(true);

    try {
      /*
       * html2pdf renders the actual document DOM into a PDF.
       *
       * Unlike window.print():
       *
       * - no print dialog
       * - no browser print UI
       * - direct .pdf download
       * - A4 page size
       * - multiple document pages supported
       */
      const element = pdfRef.current;

      const filename = `${po.po_number || "purchase-order"}.pdf`;

      const options = {
        margin: 0,

        filename,

        image: {
          type: "jpeg",
          quality: 0.98,
        },

        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",

          /*
           * Gives html2canvas enough width to render
           * the exact A4 document.
           */
          windowWidth: 794,
        },

        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
          compress: true,
        },

        pagebreak: {
          mode: ["css", "legacy"],

          before: ".pdf-page-break-before",

          after: ".pdf-page-break-after",

          avoid: [
            ".po-party-grid",
            ".po-items-table",
            ".po-total-wrapper",
            ".po-terms",
            ".po-signature-grid",
          ],
        },
      };

      await html2pdf().set(options).from(element).save();

      toast.success(`${po.po_number || "Purchase Order"} downloaded.`);
    } catch (error) {
      console.error("Purchase order PDF download:", error);

      toast.error("Unable to generate the Purchase Order PDF.");
    } finally {
      setDownloading(false);
    }
  };

  /* ==========================================================================
     LOADING
     ========================================================================== */

  if (isLoading || isFetching) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#6B7B7C]">
          <Loader2 size={18} className="animate-spin" />
          Loading purchase order...
        </div>
      </div>
    );
  }

  /* ==========================================================================
     NOT FOUND
     ========================================================================== */

  if (!po) {
    return (
      <div className="p-6">
        <Card>
          <div className="py-16 text-center">
            <FileText size={36} className="mx-auto text-[#B5C4B6]" />

            <h2 className="mt-4 text-lg font-semibold text-[#1F453B]">
              Purchase order not found
            </h2>

            <p className="mt-1 text-sm text-[#7A898A]">
              The purchase order may have been deleted or is not available.
            </p>

            <button
              type="button"
              onClick={() => nav("/materials/purchase-orders")}
              className="mt-5 h-9 px-4 rounded-lg bg-[#1F453B] text-white text-sm font-semibold"
            >
              Back to Purchase Orders
            </button>
          </div>
        </Card>
      </div>
    );
  }

  /* ==========================================================================
     PDF PAGE COMPONENT
     ========================================================================== */

  const renderPdfPage = (pageItems, pageIndex) => {
    const isFirstPage = pageIndex === 0;

    const isLastPage = pageIndex === itemPages.length - 1;

    return (
      <div
        key={`pdf-page-${pageIndex}`}
        className={`purchase-order-document pdf-page ${
          !isFirstPage ? "pdf-page-continuation" : ""
        } ${!isLastPage ? "pdf-page-break-after" : ""}`}
      >
        {/* ================================================================
            HEADER
            ================================================================ */}

        <div className="po-header">
          <div className="po-company">
            <img src="/rippotai_logo.png" alt="Rippotai" className="po-logo" />

            <div className="po-company-name">RIPPOTAI</div>

            <div className="po-company-subtitle">
              ARCHITECTURE · INTERIORS · TURNKEY
            </div>

            <div className="po-company-contact">
              Address: b-3/33,Mianwali Nagar, New Delhi 110087
            </div>

            <div className="po-company-contact">
              Phone:8882830560 | Email: sagar@rippotai.in
            </div>

            <div className="po-company-contact">
              GSTIN: {po.vendor_gstin || ""}
            </div>
          </div>

          <div className="po-title-block">
            <div className="po-title">PURCHASE ORDER</div>

            <div className="po-material">MATERIAL</div>

            <div className="po-meta">
              <div>
                <span>PO ID:</span>

                <strong>{po.po_number || ""}</strong>
              </div>

              <div>
                <span>Date:</span>

                <strong>{formatDate(po.po_date)}</strong>
              </div>

              <div>
                <span>Target delivery:</span>

                <strong>{formatDate(po.target_delivery_date)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            CONTINUATION PAGE INDICATOR
            ================================================================ */}

        {!isFirstPage && (
          <div className="po-continuation-bar">
            <div>PURCHASE ORDER</div>

            <div>{po.po_number}</div>

            <div>
              Page {pageIndex + 1} of {itemPages.length}
            </div>
          </div>
        )}

        {/* ================================================================
            VENDOR / SHIP TO
            FIRST PAGE ONLY
            ================================================================ */}

        {isFirstPage && (
          <div className="po-party-grid">
            <div className="po-party-heading">VENDOR</div>

            <div className="po-party-heading">SHIP TO</div>

            <div className="po-party">
              <div className="po-party-row">
                <div className="po-party-label">AGENCY</div>

                <div className="po-party-value">{po.agency_name || ""}</div>
              </div>

              <div className="po-party-row">
                <div className="po-party-label">CONTACT PERSON</div>

                <div className="po-party-value">{po.contact_person || ""}</div>
              </div>

              <div className="po-party-row">
                <div className="po-party-label">PHONE</div>

                <div className="po-party-value">{po.phone || ""}</div>
              </div>

              <div className="po-party-row">
                <div className="po-party-label">EMAIL</div>

                <div className="po-party-value">{po.email || ""}</div>
              </div>

              <div className="po-party-row">
                <div className="po-party-label">GSTIN</div>

                <div className="po-party-value">{po.vendor_gstin || ""}</div>
              </div>

              <div className="po-party-row">
                <div className="po-party-label">PAN</div>

                <div className="po-party-value">{po.vendor_pan || ""}</div>
              </div>
            </div>

            <div className="po-party">
              <div className="po-party-row">
                <div className="po-party-label">NAME</div>

                <div className="po-party-value">{po.contact_person || ""}</div>
              </div>

              <div className="po-party-row po-tall-row">
                <div className="po-party-label">SITE ADDRESS</div>

                <div className="po-party-value po-address">
                  {po.ship_to_address || ""}
                </div>
              </div>

              <div className="po-party-row">
                <div className="po-party-label">CONTACT PERSON</div>

                <div className="po-party-value">{po.contact_person || ""}</div>
              </div>

              <div className="po-party-row">
                <div className="po-party-label">CONTACT</div>

                <div className="po-party-value">{po.phone || ""}</div>
              </div>

              <div className="po-ship-empty" />
            </div>
          </div>
        )}

        {/* ================================================================
            ITEMS TABLE
            ================================================================ */}

        <div className={!isFirstPage ? "po-continuation-items" : ""}>
          <table className="po-items-table">
            <thead>
              <tr>
                <th className="po-sno">S.No</th>

                <th className="po-description">DESCRIPTION OF MATERIAL</th>

                <th className="po-qty">Qty</th>

                <th className="po-rate">Rate (₹)</th>

                <th className="po-amount">Amount (₹)</th>
              </tr>
            </thead>

            <tbody>
              {Array.from({
                length: 10,
              }).map((_, index) => {
                const item = pageItems[index];

                const material = item?.material || {};

                /*
                 * Global serial number.
                 */
                const serialNumber = pageIndex * 10 + index + 1;

                return (
                  <tr key={item?.id || `empty-${pageIndex}-${index}`}>
                    <td className="po-sno">{serialNumber}</td>

                    <td className="po-description">
                      {item ? (
                        <div className="po-item-description">
                          <div className="po-item-name">
                            {item.description || material.name || ""} :{" "}
                            {item.specification || material.specification ? (
                              <>
                                {item.specification || material.specification}
                              </>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </td>

                    <td className="po-qty">
                      {item ? formatNumber(item.ordered_quantity) : ""}
                    </td>

                    <td className="po-rate">
                      {item ? formatCurrency(item.rate) : ""}
                    </td>

                    <td className="po-amount">
                      {item ? formatCurrency(item.amount) : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ================================================================
            TOTALS
            LAST PAGE ONLY
            ================================================================ */}

        {isLastPage && (
          <>
            <div className="po-total-wrapper">
              <div className="po-total-box">
                <div className="po-total-row">
                  <span>SUB TOTAL</span>

                  <strong>{formatCurrency(calculatedTotals.subtotal)}</strong>
                </div>

                <div className="po-total-row">
                  <span>DISCOUNT</span>

                  <strong>{formatCurrency(calculatedTotals.discount)}</strong>
                </div>

                <div className="po-total-row">
                  <span>GST%</span>

                  <strong>
                    {formatNumber(calculatedTotals.gstPercent, 2)}%
                  </strong>
                </div>

                <div className="po-total-row">
                  <span>CARTAGE</span>

                  <strong>{formatCurrency(calculatedTotals.cartage)}</strong>
                </div>

                <div className="po-total-final">
                  <span>TOTAL</span>

                  <strong>{formatCurrency(calculatedTotals.total)}</strong>
                </div>
              </div>
            </div>

            {/* ============================================================
                TERMS
                ============================================================ */}

            <div className="po-terms">
              <div className="po-section-heading">TERMS & CONDITION</div>

              <ol>
                {TERMS.map((term, index) => (
                  <li key={index}>
                    <span className="po-term-number">{index + 1}.</span>

                    <span>{term}</span>
                  </li>
                ))}
              </ol>

              {po.notes ? (
                <div className="po-notes">
                  <strong>Notes:</strong> {po.notes}
                </div>
              ) : null}
            </div>

            {/* ============================================================
                SIGNATURE HEADINGS
                ============================================================ */}

            <div className="po-signature-headings">
              <div>FOR RIPPOTAI</div>

              <div>VENDOR ACKNOWLEDGEMENT</div>
            </div>

            {/* ============================================================
                SIGNATURE AREA
                ============================================================ */}

            <div className="po-signature-grid">
              <div className="po-signature">
                <div className="po-signature-label">Authorised Signatory</div>

                <div className="po-signature-field">
                  Name ·
                  <span />
                </div>

                <div className="po-signature-field">
                  Date ·
                  <span />
                </div>
              </div>

              <div className="po-signature">
                <div className="po-signature-label">Signature & Stamp</div>

                <div className="po-signature-field">
                  Name ·
                  <span />
                </div>

                <div className="po-signature-field">
                  Date ·
                  <span />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  /* ==========================================================================
     RETURN
     ========================================================================== */

  return (
    <>
      {/* ======================================================================
          APPLICATION PAGE
          ====================================================================== */}

      <div className="po-page min-h-screen bg-[#F5F7F6] p-4 md:p-6">
        {/* ====================================================================
            TOOLBAR
            ==================================================================== */}

        <div className="po-toolbar max-w-[1500px] mx-auto mb-4">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            {/* ---------------------------------------------------------------
                LEFT
                --------------------------------------------------------------- */}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => nav("/materials/purchase-orders")}
                className="h-9 w-9 rounded-lg border border-[#DCE3E1] bg-white flex items-center justify-center text-[#1F453B] hover:bg-[#F4F6F7]"
                title="Back"
              >
                <ArrowLeft size={17} />
              </button>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[19px] font-semibold text-[#1F453B]">
                    {po.po_number || "Purchase Order"}
                  </h1>

                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md border text-[11px] font-bold ${getStatusClass(
                      currentStatus,
                    )}`}
                  >
                    {currentStatus.replaceAll("_", " ")}
                  </span>
                </div>

                <p className="text-xs text-[#7A898A] mt-0.5">
                  Purchase Order · {po.agency_name || "No vendor"}
                </p>
              </div>
            </div>

            {/* ---------------------------------------------------------------
                ACTIONS
                --------------------------------------------------------------- */}

            <div className="flex flex-wrap items-center gap-2">
              {/* EDIT */}

              <button
                type="button"
                onClick={() => nav(`/materials/purchase-orders/${po.id}/edit`)}
                disabled={actionLoading}
                className="h-9 px-3 rounded-lg border border-[#DCE3E1] bg-white text-[#1F453B] text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#F4F6F7] disabled:opacity-50"
              >
                <Edit3 size={15} />
                Edit
              </button>

              {/* DOWNLOAD */}

              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={actionLoading}
                className="h-9 px-3 rounded-lg bg-[#1F453B] text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#17382F] disabled:opacity-50"
              >
                {downloading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Download size={15} />
                )}

                {downloading ? "Generating..." : "Download PDF"}
              </button>

              {/* APPROVE */}

              {canApprove && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => openApprovalModal("APPROVE")}
                  className="h-9 px-3 rounded-lg bg-[#1F453B] text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#17382F] disabled:opacity-50"
                >
                  <Check size={15} />
                  Approve
                </button>
              )}

              {/* REJECT */}

              {canReject && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => openApprovalModal("REJECT")}
                  className="h-9 px-3 rounded-lg bg-[#A33A3A] text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#8E3030] disabled:opacity-50"
                >
                  <XCircle size={15} />
                  Reject
                </button>
              )}

              {/* CANCEL */}

              {canCancel && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    setCancelReason("");
                    setShowCancelModal(true);
                    setShowStatusMenu(false);
                  }}
                  className="h-9 px-3 rounded-lg border border-[#E5BABA] bg-white text-[#A33A3A] text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#FDECEC] disabled:opacity-50"
                >
                  <Ban size={15} />
                  Cancel
                </button>
              )}

              {/* STATUS */}

              <div className="relative">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowStatusMenu((value) => !value)}
                  className="h-9 px-3 rounded-lg bg-white border border-[#DCE3E1] text-[#1F453B] text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={15} />
                  )}
                  Update Status
                  <ChevronDown size={14} />
                </button>

                {showStatusMenu && (
                  <div className="absolute right-0 top-11 z-50 w-60 rounded-xl border border-[#DCE3E1] bg-white shadow-xl p-1.5">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        type="button"
                        key={status}
                        disabled={status === currentStatus}
                        onClick={() => handleUpdateStatus(status)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                          status === currentStatus
                            ? "bg-[#F4F6F7] text-[#9AA5A5]"
                            : "text-[#1F453B] hover:bg-[#F4F6F7]"
                        }`}
                      >
                        <span>{status.replaceAll("_", " ")}</span>

                        {status === currentStatus && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================
            DOCUMENT PREVIEW
            ==================================================================== */}

        <div className="max-w-[950px] mx-auto overflow-x-auto pb-10">
          <div ref={pdfRef} className="purchase-order-pdf-wrapper">
            {itemPages.map((pageItems, pageIndex) =>
              renderPdfPage(pageItems, pageIndex),
            )}
          </div>
        </div>
      </div>

      {/* ======================================================================
          APPROVAL / REJECTION MODAL
          ====================================================================== */}

      {showApprovalModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeApprovalModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden">
            {/* HEADER */}

            <div className="px-5 py-4 border-b border-[#E5EAEA] flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-semibold text-[#1F453B]">
                  {approvalAction === "APPROVE"
                    ? "Approve Purchase Order"
                    : "Reject Purchase Order"}
                </h2>

                <p className="text-xs text-[#7A898A] mt-1">{po.po_number}</p>
              </div>

              <button
                type="button"
                onClick={closeApprovalModal}
                disabled={actionLoading}
                className="p-2 rounded-lg hover:bg-[#F4F6F7]"
              >
                <X size={18} />
              </button>
            </div>

            {/* BODY */}

            <div className="p-5">
              {approvalAction === "APPROVE" ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-[#E7F3EC] flex items-center justify-center">
                    <Check size={23} className="text-[#1F6B45]" />
                  </div>

                  <h3 className="mt-4 text-[15px] font-semibold text-[#1F453B]">
                    Approve this purchase order?
                  </h3>

                  <p className="mt-1.5 text-sm text-[#6B7B7C] leading-6">
                    This will mark <strong>{po.po_number}</strong> as approved
                    and allow it to proceed to the next procurement stage.
                  </p>
                </>
              ) : (
                <>
                  <div className="h-12 w-12 rounded-full bg-[#FDECEC] flex items-center justify-center">
                    <XCircle size={23} className="text-[#A33A3A]" />
                  </div>

                  <h3 className="mt-4 text-[15px] font-semibold text-[#1F453B]">
                    Reject this purchase order?
                  </h3>

                  <p className="mt-1.5 text-sm text-[#6B7B7C] leading-6">
                    Enter the reason for rejecting this purchase order.
                  </p>

                  <textarea
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                    placeholder="Enter rejection reason..."
                    rows={4}
                    className="mt-4 w-full rounded-lg border border-[#DCE3E1] px-3 py-2.5 text-sm outline-none resize-none focus:border-[#1F453B] focus:ring-1 focus:ring-[#1F453B]"
                  />
                </>
              )}
            </div>

            {/* FOOTER */}

            <div className="px-5 py-4 border-t border-[#E5EAEA] bg-[#FAFBFB] flex justify-end gap-2">
              <button
                type="button"
                onClick={closeApprovalModal}
                disabled={actionLoading}
                className="h-9 px-4 rounded-lg border border-[#DCE3E1] bg-white text-[#1F453B] text-sm font-semibold"
              >
                Cancel
              </button>

              {approvalAction === "APPROVE" ? (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="h-9 px-4 rounded-lg bg-[#1F453B] text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {approving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Check size={15} />
                  )}
                  Approve PO
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={actionLoading || !approvalReason.trim()}
                  className="h-9 px-4 rounded-lg bg-[#A33A3A] text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updating ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <XCircle size={15} />
                  )}
                  Reject PO
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          CANCEL MODAL
          ====================================================================== */}

      {showCancelModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              if (!actionLoading) {
                setShowCancelModal(false);
              }
            }
          }}
        >
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5EAEA] flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-semibold text-[#1F453B]">
                  Cancel Purchase Order
                </h2>

                <p className="text-xs text-[#7A898A] mt-1">{po.po_number}</p>
              </div>

              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={actionLoading}
                className="p-2 rounded-lg hover:bg-[#F4F6F7]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <div className="h-12 w-12 rounded-full bg-[#FDECEC] flex items-center justify-center">
                <Ban size={22} className="text-[#A33A3A]" />
              </div>

              <h3 className="mt-4 text-[15px] font-semibold text-[#1F453B]">
                Cancel this purchase order?
              </h3>

              <p className="mt-1.5 text-sm text-[#6B7B7C] leading-6">
                This will cancel <strong>{po.po_number}</strong>.
              </p>

              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Cancellation reason (optional)..."
                rows={3}
                className="mt-4 w-full rounded-lg border border-[#DCE3E1] px-3 py-2.5 text-sm outline-none resize-none focus:border-[#1F453B] focus:ring-1 focus:ring-[#1F453B]"
              />
            </div>

            <div className="px-5 py-4 border-t border-[#E5EAEA] bg-[#FAFBFB] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={actionLoading}
                className="h-9 px-4 rounded-lg border border-[#DCE3E1] bg-white text-[#1F453B] text-sm font-semibold"
              >
                Keep PO
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="h-9 px-4 rounded-lg bg-[#A33A3A] text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {cancelling ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Ban size={15} />
                )}
                Cancel PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          DOCUMENT CSS
          ====================================================================== */}

      <style>{`
        /* ======================================================================
           PDF WRAPPER
           ====================================================================== */

        .purchase-order-pdf-wrapper {
          width: 210mm;
          margin: 0 auto;
        }

        /*
         * Every .pdf-page is EXACTLY one A4 page.
         *
         * This is important for html2pdf.
         */

        .pdf-page {
          width: 210mm;
          height: 297mm;

          min-height: 297mm;
          max-height: 297mm;

          padding: 8mm;

          box-sizing: border-box;

          color: #171717;

          background: #ffffff;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          position: relative;

          overflow: hidden;

          box-shadow:
            0 8px 30px
              rgba(0, 0, 0, 0.08);

          margin-bottom: 15px;
        }

        /*
         * html2pdf page separation.
         */

        .pdf-page-break-after {
          page-break-after: always;
          break-after: page;
        }

        /* ======================================================================
           HEADER
           ====================================================================== */

        .po-header {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          min-height: 34mm;
        }

        .po-company {
          padding:
            1mm
            1mm
            0
            1mm;
        }

        .po-logo {
          width: 17mm;
          height: 17mm;

          object-fit: contain;

          object-position:
            left top;

          margin-bottom: 1mm;
        }

        .po-company-name {
          font-size: 16px;

          line-height: 1;

          color: #536765;

          font-weight: 400;

          letter-spacing: 0.2px;
        }

        .po-company-subtitle {
          margin-top: 2mm;

          font-size: 11px;

          color: #536765;

          font-weight: 500;
        }

        .po-company-contact {
          margin-top: 1mm;

          font-size: 8px;

          line-height: 1.2;

          color: #202020;
        }

        .po-title-block {
          text-align: right;

          position: relative;
        }

        .po-title {
          color: #164D3D;

          font-size: 25px;

          line-height: 1;

          font-weight: 700;

          letter-spacing: -0.5px;
        }

        .po-material {
          color: #164D3D;

          font-size: 17px;

          margin-top: 1.5mm;

          font-weight: 400;
        }

        .po-meta {
          position: absolute;

          right: 0;

          bottom: 0;

          width: 62mm;

          text-align: left;

          font-size: 9px;

          line-height: 1.5;
        }

        .po-meta div {
          display: flex;
        }

        .po-meta span {
          width: 25mm;
        }

        .po-meta strong {
          font-weight: 400;
        }

        /* ======================================================================
           CONTINUATION PAGE
           ====================================================================== */

        .po-continuation-bar {
          height: 8mm;

          display: grid;

          grid-template-columns:
            1fr 1fr 1fr;

          align-items: center;

          padding:
            0
            2mm;

          border:
            1px solid #171717;

          background:
            #0E4939;

          color: #ffffff;

          font-size: 8.5px;

          font-weight: 700;
        }

        .po-continuation-bar div:nth-child(2) {
          text-align: center;
        }

        .po-continuation-bar div:last-child {
          text-align: right;
        }

        .pdf-page-continuation
          .po-header {
          min-height: 29mm;
        }

        /* ======================================================================
           VENDOR / SHIP TO
           ====================================================================== */

        .po-party-grid {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          border-top:
            1px solid #171717;

          border-left:
            1px solid #171717;

          border-right:
            1px solid #171717;
        }

        .po-party-heading {
          background:
            #0E4939;

          color: white;

          height: 7mm;

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 11px;

          font-weight: 700;

          letter-spacing: 0.3px;

          border-right:
            1px solid #171717;
        }

        .po-party-heading:nth-child(2) {
          border-right: none;
        }

        .po-party {
          min-height: 47mm;

          border-right:
            1px solid #171717;
        }

        .po-party:last-child {
          border-right: none;
        }

        .po-party-row {
          display: grid;

          grid-template-columns:
            30mm 1fr;

          min-height: 6.8mm;

          border-bottom:
            1px solid #777;
        }

        .po-party-row:last-of-type {
          border-bottom: none;
        }

        .po-party-label {
          padding:
            1.5mm
            1mm;

          font-size: 9px;

          line-height: 1.2;

          border-right:
            1px solid #777;
        }

        .po-party-value {
          padding:
            1.5mm
            1.5mm;

          font-size: 9px;

          line-height: 1.2;

          overflow-wrap: anywhere;
        }

        .po-address {
          min-height: 13.6mm;
        }

        .po-tall-row {
          min-height: 13.6mm;
        }

        .po-ship-empty {
          min-height: 6mm;
        }

        /* ======================================================================
           ITEMS TABLE
           ====================================================================== */

        .po-items-table {
          width: 100%;

          border-collapse:
            collapse;

          table-layout:
            fixed;

          font-size: 9px;
        }

        .po-items-table th,
        .po-items-table td {
          border:
            1px solid #171717;
        }

        .po-items-table thead th {
          height: 8mm;

          font-size: 9.5px;

          font-weight: 700;

          vertical-align:
            middle;

          text-align: center;
        }

        .po-items-table tbody tr {
          height: 7mm;
        }

        .po-items-table tbody td {
          height: 7mm;

          padding: 1mm;

          vertical-align:
            middle;
        }

        .po-sno {
          width: 8mm;

          text-align:
            left !important;
        }

        .po-description {
          width: auto;

          text-align: left;
        }

        .po-qty {
          width: 14mm;

          text-align: center;
        }

        .po-rate {
          width: 23mm;

          text-align: right;
        }

        .po-amount {
          width: 25mm;

          text-align: right;
        }

        .po-item-description {
          line-height: 1.1;
        }

        .po-item-name {
          font-size: 8.5px;
        }

        .po-item-spec {
          color: #555;

          font-size: 7px;

          margin-top: 0.5mm;
        }

        .po-item-code {
          color: #777;

          font-size: 6.5px;

          margin-top: 0.3mm;
        }

        .po-item-brand {
          color: #555;

          font-size: 6.5px;
        }

        .po-continuation-items {
          margin-top: 3mm;
        }

        /* ======================================================================
           TOTALS
           ====================================================================== */

        .po-total-wrapper {
          display: flex;

          justify-content: flex-end;
        }

        .po-total-box {
          width: 48mm;
        }

        .po-total-row {
          display: grid;

          grid-template-columns:
            1fr 24mm;

          min-height: 7mm;

          border-left:
            1px solid #171717;

          border-right:
            1px solid #171717;

          border-bottom:
            1px solid #777;

          font-size: 9px;
        }

        .po-total-row span {
          padding: 1.5mm;

          text-align: right;
        }

        .po-total-row strong {
          padding: 1.5mm;

          text-align: right;

          font-weight: 400;
        }

        .po-total-final {
          display: grid;

          grid-template-columns:
            1fr 24mm;

          min-height: 8mm;

          border-bottom:
            1px solid #171717;

          border-left:
            1px solid #171717;

          border-right:
            1px solid #171717;

          font-size: 10px;

          color: #0E4939;

          font-weight: 700;
        }

        .po-total-final span {
          padding: 1.5mm;

          text-align: right;
        }

        .po-total-final strong {
          padding: 1.5mm;

          text-align: right;
        }

        /* ======================================================================
           TERMS
           ====================================================================== */

        .po-terms {
          margin-top: 13mm;

          min-height: 34mm;
        }

        .po-section-heading {
          color: #164D3D;

          font-size: 11px;

          font-weight: 700;

          margin-bottom: 2mm;
        }

        .po-terms ol {
          padding: 0;

          margin: 0;

          list-style: none;

          counter-reset: terms;
        }

        .po-terms li {
          counter-increment:
            terms;

          display: grid;

          grid-template-columns:
            8mm 1fr;

          font-size: 9px;

          line-height: 1.55;
        }

        .po-term-number {
          text-align: left;
        }

        .po-notes {
          margin-top: 2mm;

          font-size: 8.5px;

          line-height: 1.4;
        }

        /* ======================================================================
           SIGNATURE HEADINGS
           ====================================================================== */

        .po-signature-headings {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          margin-top: 5mm;

          color: #164D3D;

          font-size: 10px;

          font-weight: 700;
        }

        .po-signature-headings div:last-child {
          text-align: left;
        }

        /* ======================================================================
           SIGNATURE AREA
           ====================================================================== */

        .po-signature-grid {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          min-height: 30mm;

          border-top:
            1px solid #171717;

          border-left:
            1px solid #171717;

          border-right:
            1px solid #171717;

          border-bottom:
            1px solid #171717;

          margin-top: 0;
        }

        .po-signature {
          padding:
            3mm
            1mm;
        }

        .po-signature:first-child {
          border-right:
            1px solid #171717;
        }

        .po-signature-label {
          color: #657775;

          font-size: 9px;

          margin-bottom: 3mm;
        }

        .po-signature-field {
          display: flex;

          align-items: center;

          gap: 2mm;

          color: #657775;

          font-size: 9px;

          margin-top: 2mm;
        }

        .po-signature-field span {
          display: inline-block;

          width: 27mm;

          border-bottom:
            1px solid #777;

          height: 4mm;
        }

        /* ======================================================================
           SCREEN
           ====================================================================== */

        @media screen and (max-width: 950px) {
          .purchase-order-pdf-wrapper {
            margin-left: 0;
            margin-right: 0;
          }

          .pdf-page {
            box-shadow:
              0 5px 20px
                rgba(0, 0, 0, 0.08);
          }
        }

        /* ======================================================================
           PDF / HTML2PDF
           ====================================================================== */

        @media print {
          .po-toolbar {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
