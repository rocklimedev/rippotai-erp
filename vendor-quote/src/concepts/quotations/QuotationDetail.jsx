import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetQuotationByIdQuery,
  useApproveQuotationMutation,
  useReturnQuotationMutation,
  useDeclineQuotationMutation,
  useSoftDeleteQuotationMutation,
  useGetQuotationVersionsQuery, // ← add this to your quotation.api if not present
} from "../../api/quotation.api";

import { useGetSignatureQuery } from "../../api/user-signatures.api";
import { useGetSettingByKeyQuery } from "../../api/settings.api";

import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusConfig,
} from "../../utils/helpers";
import { useAuth } from "../../store/use-auth";
import {
  Edit,
  Printer,
  CheckCircle,
  RotateCcw,
  XCircle,
  ArrowLeft,
  Trash2,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers — normalise the camelCase API response into a consistent shape
// ---------------------------------------------------------------------------
function normaliseQuotation(q) {
  if (!q) return null;
  return {
    id: q.id,
    quotation_number: q.quotationNumber,
    quotation_date: q.quotationDate,
    status: q.status,
    current_version: q.currentVersion ?? q.current_version ?? 0,

    project_snapshot: q.projectSnapshot ?? q.project_snapshot ?? {},
    vendor_snapshot: q.vendorSnapshot ?? q.vendor_snapshot ?? {},

    subtotal: Number(q.subtotal) || 0,
    additional_charges:
      Number(q.additionalCharges ?? q.additional_charges) || 0,
    global_discount_type:
      q.globalDiscountType ?? q.global_discount_type ?? "fixed",
    global_discount_value:
      Number(q.globalDiscountValue ?? q.global_discount_value) || 0,
    discount: Number(q.discount) || 0,
    tax_percent: Number(q.taxPercent ?? q.tax_percent) || 0,
    tax_amount: Number(q.taxAmount ?? q.tax_amount) || 0,
    total_amount: Number(q.totalAmount ?? q.total_amount) || 0,

    terms_conditions: q.termsConditions ?? q.terms_conditions ?? "",
    items: (q.items ?? []).map((item) => ({
      ...item,
      rate: Number(item.rate) || 0,
      quantity: Number(item.quantity) || 0,
      amount: Number(item.amount) || 0,
    })),

    created_by: q.createdBy ?? q.created_by,
    approved_by_name: q.approvedByName ?? q.approved_by_name,
    approved_at: q.approvedAt ?? q.approved_at,
    submitted_at: q.submittedAt ?? q.submitted_at,
    review_remarks: q.reviewRemarks ?? q.review_remarks,
    created_at: q.created_at,
    updated_at: q.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Confirm Dialog
// ---------------------------------------------------------------------------
function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  placeholder,
  requireText = false,
}) {
  const [remarks, setRemarks] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#333333]">{title}</h3>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-gray-600 mb-3">{message}</p>
          {requireText && (
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={placeholder || "Enter remarks..."}
              rows={3}
              className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#E31E24] resize-none"
              autoFocus
            />
          )}
        </div>
        <div className="px-5 py-3 border-t border-[#E5E7EB] flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm border border-[#E5E7EB] rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(remarks)}
            disabled={requireText && !remarks.trim()}
            className="px-4 py-1.5 text-sm bg-[#E31E24] text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Printable Quotation
// ---------------------------------------------------------------------------
function PrintableQuotation({ quotation, adminSignature, termsConditions }) {
  if (!quotation) return null;
  const isApproved = quotation.status === "approved";
  const q = quotation; // already normalised

  return (
    <div
      className="print-quotation-content p-8 bg-white"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      {/* Header */}
      <div className="text-center border-b-2 border-[#333333] pb-4 mb-4">
        <h1 className="text-xl font-bold text-[#333333]">QUOTATION</h1>
        <div className="text-sm text-gray-600 mt-1">
          {q.quotation_number}
          {q.current_version > 0 && ` | V${q.current_version}`}
          {!isApproved && (
            <span className="ml-2 text-red-600 font-bold">[DRAFT]</span>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-6 mb-4 text-sm">
        <div>
          <div className="font-semibold mb-1">Vendor:</div>
          <div>{q.vendor_snapshot?.name}</div>
          <div>{q.vendor_snapshot?.company_name}</div>
          <div>{q.vendor_snapshot?.contact_number}</div>
          <div>{q.vendor_snapshot?.address}</div>
        </div>
        <div className="text-right">
          <div>
            <span className="font-semibold">Date:</span>{" "}
            {formatDate(q.quotation_date)}
          </div>
          <div className="mt-1">
            <span className="font-semibold">Project:</span>{" "}
            {q.project_snapshot?.name}
          </div>
          <div>
            <span className="font-semibold">Site:</span>{" "}
            {q.project_snapshot?.site_location}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse text-sm mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-400 px-2 py-1.5 text-left w-8">
              #
            </th>
            <th className="border border-gray-400 px-2 py-1.5 text-left">
              Particular
            </th>
            <th className="border border-gray-400 px-2 py-1.5 text-right w-24">
              Rate (₹)
            </th>
            <th className="border border-gray-400 px-2 py-1.5 text-right w-16">
              Qty
            </th>
            <th className="border border-gray-400 px-2 py-1.5 text-right w-28">
              Amount (₹)
            </th>
            <th className="border border-gray-400 px-2 py-1.5 text-left w-28">
              Remarks
            </th>
          </tr>
        </thead>
        <tbody>
          {q.items.map((item, i) => (
            <tr key={i}>
              <td className="border border-gray-300 px-2 py-1.5 text-center">
                {item.sno}
              </td>
              <td className="border border-gray-300 px-2 py-1.5">
                {item.particular}
              </td>
              <td className="border border-gray-300 px-2 py-1.5 text-right">
                {formatCurrency(item.rate)}
              </td>
              <td className="border border-gray-300 px-2 py-1.5 text-right">
                {item.quantity}
              </td>
              <td className="border border-gray-300 px-2 py-1.5 text-right font-medium">
                {formatCurrency(item.amount)}
              </td>
              <td className="border border-gray-300 px-2 py-1.5 text-xs">
                {item.remarks}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-72 space-y-1">
          <div className="flex justify-between text-sm py-1 border-b border-gray-200">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(q.subtotal)}</span>
          </div>
          {q.additional_charges > 0 && (
            <div className="flex justify-between text-sm py-1 border-b border-gray-200">
              <span className="text-gray-600">Additional Charges</span>
              <span>{formatCurrency(q.additional_charges)}</span>
            </div>
          )}
          {q.discount > 0 && (
            <div className="flex justify-between text-sm py-1 border-b border-gray-200">
              <span className="text-gray-600">
                Discount
                {q.global_discount_type === "percentage"
                  ? ` (${q.global_discount_value}%)`
                  : ""}
              </span>
              <span className="text-red-600">
                - {formatCurrency(q.discount)}
              </span>
            </div>
          )}
          {q.tax_percent > 0 && (
            <div className="flex justify-between text-sm py-1 border-b border-gray-200">
              <span className="text-gray-600">Tax ({q.tax_percent}%)</span>
              <span>{formatCurrency(q.tax_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm py-1.5 font-bold border-t-2 border-[#333333]">
            <span>Grand Total</span>
            <span>{formatCurrency(q.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      {(termsConditions || q.terms_conditions) && (
        <div className="mb-6">
          <div className="font-semibold text-sm mb-1">Terms & Conditions:</div>
          <div className="text-xs text-gray-600 whitespace-pre-line border border-gray-200 rounded p-2">
            {termsConditions || q.terms_conditions}
          </div>
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mt-8">
        <div className="border-t-2 border-[#333333] pt-2">
          <div className="text-xs font-semibold mb-1">Approved By</div>
          {isApproved && adminSignature?.signature_url ? (
            <div>
              <img
                src={adminSignature.signature_url}
                alt="Admin Signature"
                style={{
                  maxHeight: "70px",
                  maxWidth: "180px",
                  objectFit: "contain",
                }}
              />
              <div className="text-xs mt-1 font-medium">
                {adminSignature.signer_name || q.approved_by_name}
              </div>
              <div className="text-xs text-gray-500">
                {adminSignature.signer_designation || "Administrator"}
              </div>
              <div className="text-xs text-gray-400">
                {formatDateTime(q.approved_at)}
              </div>
            </div>
          ) : isApproved ? (
            <div className="text-xs text-gray-500">Signature not available</div>
          ) : (
            <div className="h-12" />
          )}
        </div>
        <div className="border-t-2 border-[#333333] pt-2">
          <div className="text-xs font-semibold">Contractor's Signature</div>
          <div className="h-12" />
        </div>
      </div>

      <div className="text-xs text-gray-400 text-center mt-6">
        Generated on {formatDateTime(new Date().toISOString())}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Details Tab
// ---------------------------------------------------------------------------
function DetailsTab({ quotation: q }) {
  const cfg = getStatusConfig(q.status);

  return (
    <div className="space-y-5">
      {/* Basic Info Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Basic Information
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Quotation Number</div>
            <div className="font-medium text-[#333333]">
              {q.quotation_number}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Date</div>
            <div className="font-medium text-[#333333]">
              {formatDate(q.quotation_date)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Status</div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              {cfg.label}
            </span>
          </div>
          {q.submitted_at && (
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Submitted At</div>
              <div className="font-medium text-[#333333]">
                {formatDateTime(q.submitted_at)}
              </div>
            </div>
          )}
          {q.approved_at && (
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Approved At</div>
              <div className="font-medium text-[#333333]">
                {formatDateTime(q.approved_at)}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Last Updated</div>
            <div className="font-medium text-[#333333]">
              {formatDateTime(q.updated_at)}
            </div>
          </div>
        </div>

        {q.review_remarks && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
            <div className="text-xs font-semibold text-amber-700 mb-0.5">
              Review Remarks
            </div>
            <div className="text-sm text-amber-800">{q.review_remarks}</div>
          </div>
        )}
      </div>

      {/* Vendor Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Vendor
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Name</div>
            <div className="font-medium text-[#333333]">
              {q.vendor_snapshot?.name}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Company</div>
            <div className="font-medium text-[#333333]">
              {q.vendor_snapshot?.company_name}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Contact</div>
            <div className="font-medium text-[#333333]">
              {q.vendor_snapshot?.contact_number}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-gray-400 mb-0.5">Address</div>
            <div className="font-medium text-[#333333]">
              {q.vendor_snapshot?.address}
            </div>
          </div>
        </div>
      </div>

      {/* Project Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Project
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Project Name</div>
            <div className="font-medium text-[#333333]">
              {q.project_snapshot?.name}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Site Location</div>
            <div className="font-medium text-[#333333]">
              {q.project_snapshot?.site_location}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Items
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-[#E5E7EB] rounded-md overflow-hidden">
            <thead className="bg-[#F9FAFB]">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-10">
                  #
                </th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB]">
                  Particular
                </th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-24">
                  Rate (₹)
                </th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-20">
                  Qty
                </th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-28">
                  Amount (₹)
                </th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-32">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {q.items.map((item, i) => (
                <tr
                  key={i}
                  className="border-b border-[#F3F4F6] hover:bg-gray-50"
                >
                  <td className="px-3 py-2 text-gray-400 text-center">
                    {item.sno}
                  </td>
                  <td className="px-3 py-2 text-[#333333]">
                    {item.particular}
                  </td>
                  <td className="px-3 py-2 text-right text-[#333333]">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="px-3 py-2 text-right text-[#333333]">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-[#333333]">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-3 py-2 text-gray-500 text-xs">
                    {item.remarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-[#333333]">
                {formatCurrency(q.subtotal)}
              </span>
            </div>
            {q.additional_charges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Additional Charges</span>
                <span className="text-[#333333]">
                  {formatCurrency(q.additional_charges)}
                </span>
              </div>
            )}
            {q.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Discount
                  {q.global_discount_type === "percentage"
                    ? ` (${q.global_discount_value}%)`
                    : ` (Fixed)`}
                </span>
                <span className="text-red-500">
                  - {formatCurrency(q.discount)}
                </span>
              </div>
            )}
            {q.tax_percent > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({q.tax_percent}%)</span>
                <span className="text-[#333333]">
                  {formatCurrency(q.tax_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t border-[#E5E7EB] pt-2">
              <span className="text-[#333333]">Grand Total</span>
              <span className="text-[#E31E24] text-base">
                {formatCurrency(q.total_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      {q.terms_conditions && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Terms & Conditions
          </h2>
          <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
            {q.terms_conditions}
          </pre>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Version History Tab
// ---------------------------------------------------------------------------
function VersionHistoryTab({ quotationId }) {
  const [expandedId, setExpandedId] = useState(null);

  // Assumes your quotation API has a versions endpoint.
  // If not yet implemented, this shows a graceful empty state.
  const { data: versions = [], isLoading } = useGetQuotationVersionsQuery(
    quotationId,
    {
      skip: !quotationId,
    },
  );

  if (isLoading) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-8 text-center text-sm text-gray-400">
        Loading version history...
      </div>
    );
  }

  if (!versions.length) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-8 text-center">
        <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-400">
          No version history available yet.
        </p>
        <p className="text-xs text-gray-300 mt-1">
          Versions are created each time this quotation is edited and
          resubmitted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((v, idx) => {
        const normV = normaliseQuotation(v);
        const cfg = getStatusConfig(normV.status);
        const isExpanded = expandedId === v.id;
        const isLatest = idx === 0;

        return (
          <div
            key={v.id}
            className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden"
          >
            {/* Version Header — always visible */}
            <button
              className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : v.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E31E24]/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-[#E31E24]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#333333]">
                      Version{" "}
                      {normV.current_version > 0
                        ? normV.current_version
                        : idx + 1}
                    </span>
                    {isLatest && (
                      <span className="text-xs bg-[#E31E24] text-white px-1.5 py-0.5 rounded font-medium">
                        Latest
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {formatDateTime(normV.updated_at || normV.created_at)}
                    {normV.review_remarks && (
                      <span className="ml-2 text-amber-600">
                        · Remarks: {normV.review_remarks}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-[#E31E24]">
                  {formatCurrency(normV.total_amount)}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded Detail */}
            {isExpanded && (
              <div className="border-t border-[#E5E7EB] px-5 py-4 bg-gray-50">
                {/* Items mini-table */}
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm border border-[#E5E7EB] rounded overflow-hidden bg-white">
                    <thead className="bg-[#F9FAFB]">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-10">
                          #
                        </th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB]">
                          Particular
                        </th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-24">
                          Rate (₹)
                        </th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-20">
                          Qty
                        </th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-28">
                          Amount (₹)
                        </th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-32">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {normV.items.map((item, i) => (
                        <tr key={i} className="border-b border-[#F3F4F6]">
                          <td className="px-3 py-2 text-gray-400 text-center">
                            {item.sno}
                          </td>
                          <td className="px-3 py-2 text-[#333333]">
                            {item.particular}
                          </td>
                          <td className="px-3 py-2 text-right text-[#333333]">
                            {formatCurrency(item.rate)}
                          </td>
                          <td className="px-3 py-2 text-right text-[#333333]">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-[#333333]">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="px-3 py-2 text-gray-500 text-xs">
                            {item.remarks}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Version Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span>{formatCurrency(normV.subtotal)}</span>
                    </div>
                    {normV.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Discount</span>
                        <span className="text-red-500">
                          - {formatCurrency(normV.discount)}
                        </span>
                      </div>
                    )}
                    {normV.tax_percent > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          Tax ({normV.tax_percent}%)
                        </span>
                        <span>{formatCurrency(normV.tax_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold border-t border-[#E5E7EB] pt-1">
                      <span>Total</span>
                      <span className="text-[#E31E24]">
                        {formatCurrency(normV.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function QuotationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const printRef = useRef();

  const [activeTab, setActiveTab] = useState("details");
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState("");

  // Fetch raw data
  const {
    data: rawQuotation,
    isLoading,
    error: queryError,
  } = useGetQuotationByIdQuery(id);

  // Normalise once
  const quotation = normaliseQuotation(rawQuotation);

  // Admin signature — only when approved and user is ADMIN
  const { data: adminSignature } = useGetSignatureQuery(user?.id, {
    skip:
      !user?.id || user?.role !== "ADMIN" || quotation?.status !== "approved",
  });

  // Global Terms & Conditions from settings for the printout
  const { data: termsSetting } = useGetSettingByKeyQuery("terms");
  const termsConditions = termsSetting?.value?.default_terms;

  const [approveQuotation, { isLoading: approving }] =
    useApproveQuotationMutation();
  const [returnQuotation, { isLoading: returning }] =
    useReturnQuotationMutation();
  const [declineQuotation, { isLoading: declining }] =
    useDeclineQuotationMutation();
  const [softDeleteQuotation, { isLoading: deleting }] =
    useSoftDeleteQuotationMutation();

  const actionLoading = approving || returning || declining || deleting;

  const handleApprove = async (remarks) => {
    try {
      await approveQuotation({ id, remarks }).unwrap();
      setDialog(null);
    } catch (err) {
      setError(err?.data?.message || "Failed to approve");
    }
  };

  const handleReturn = async (remarks) => {
    if (!remarks?.trim()) return;
    try {
      await returnQuotation({ id, remarks }).unwrap();
      setDialog(null);
    } catch (err) {
      setError(err?.data?.message || "Failed to return");
    }
  };

  const handleDecline = async (remarks) => {
    if (!remarks?.trim()) return;
    try {
      await declineQuotation({ id, remarks }).unwrap();
      setDialog(null);
    } catch (err) {
      setError(err?.data?.message || "Failed to decline");
    }
  };

  const handleDelete = async () => {
    try {
      await softDeleteQuotation({ id, deleted_by: user?.id }).unwrap();
      navigate("/quotations");
    } catch (err) {
      setError(err?.data?.message || "Failed to delete");
    }
  };

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-400">Loading quotation...</div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-6 text-sm text-red-500">
        {error || queryError?.data?.message || "Quotation not found"}
      </div>
    );
  }

  const cfg = getStatusConfig(quotation.status);

  const canEdit =
    (quotation.status === "draft" ||
      quotation.status === "returned_for_editing") &&
    (user?.role === "ADMIN" || quotation.created_by === user?.id);

  const canDelete =
    user?.role === "ADMIN" ||
    ((quotation.status === "draft" ||
      quotation.status === "returned_for_editing") &&
      quotation.created_by === user?.id);

  const canApprove =
    user?.role === "ADMIN" &&
    ["submitted", "resubmitted"].includes(quotation.status);

  const TABS = [
    { key: "details", label: "Details" },
    { key: "print", label: "Print Preview" },
    { key: "versions", label: "Version History" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Dialogs */}
      {dialog && (
        <ConfirmDialog
          title={
            dialog === "approve"
              ? "Approve Quotation"
              : dialog === "return"
                ? "Return for Editing"
                : dialog === "decline"
                  ? "Decline Quotation"
                  : "Delete Quotation"
          }
          message={`Are you sure you want to ${dialog} quotation ${quotation.quotation_number}?`}
          onConfirm={
            dialog === "approve"
              ? handleApprove
              : dialog === "return"
                ? handleReturn
                : dialog === "decline"
                  ? handleDecline
                  : handleDelete
          }
          onCancel={() => setDialog(null)}
          placeholder={
            dialog === "return" || dialog === "decline"
              ? "Enter remarks (required)..."
              : ""
          }
          requireText={dialog === "return" || dialog === "decline"}
        />
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between mb-5 no-print">
        <div>
          <button
            onClick={() => navigate("/quotations")}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#333333] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Quotations
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[#333333]">
              {quotation.quotation_number}
            </h1>
            {quotation.current_version > 0 && (
              <span className="text-sm font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                V{quotation.current_version}
              </span>
            )}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {canEdit && (
            <button
              onClick={() => navigate(`/quotations/${id}/edit`)}
              className="flex items-center gap-1.5 border border-[#E5E7EB] text-sm font-medium px-3 py-2 rounded-md hover:bg-gray-50"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 border border-[#E5E7EB] text-sm font-medium px-3 py-2 rounded-md hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" /> Print / PDF
          </button>
          {canApprove && (
            <>
              <button
                onClick={() => setDialog("approve")}
                disabled={actionLoading}
                className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-green-700 disabled:opacity-60"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => setDialog("return")}
                disabled={actionLoading}
                className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
              >
                <RotateCcw className="w-4 h-4" /> Return
              </button>
              <button
                onClick={() => setDialog("decline")}
                disabled={actionLoading}
                className="flex items-center gap-1.5 bg-red-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-red-700 disabled:opacity-60"
              >
                <XCircle className="w-4 h-4" /> Decline
              </button>
            </>
          )}
          {canDelete && (
            <button
              onClick={() => setDialog("delete")}
              disabled={actionLoading}
              className="flex items-center gap-1.5 border border-red-200 text-red-600 text-sm font-medium px-3 py-2 rounded-md hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded mb-4 no-print">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#E5E7EB] mb-5 no-print">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#E31E24] text-[#E31E24]"
                  : "border-transparent text-gray-500 hover:text-[#333333]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="no-print">
        {activeTab === "details" && <DetailsTab quotation={quotation} />}
        {activeTab === "versions" && <VersionHistoryTab quotationId={id} />}
      </div>

      {/* Print Preview Tab + actual print target */}
      <div
        ref={printRef}
        className={
          activeTab === "print" ? "no-print block" : "hidden print:block"
        }
      >
        <PrintableQuotation
          quotation={quotation}
          adminSignature={adminSignature}
          termsConditions={termsConditions}
        />
      </div>
    </div>
  );
}
