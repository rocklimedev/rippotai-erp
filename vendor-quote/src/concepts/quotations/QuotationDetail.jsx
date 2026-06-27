import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetQuotationByIdQuery,
  useApproveQuotationMutation,
  useReturnQuotationMutation,
  useDeclineQuotationMutation,
  useSoftDeleteQuotationMutation,
} from "../../api/quotation.api"; // Adjust import path as needed

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
  AlertCircle,
} from "lucide-react";

// ====================== CONFIRM DIALOG ======================
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

// ====================== PRINTABLE QUOTATION ======================
function PrintableQuotation({ quotation }) {
  const isApproved = quotation?.status === "approved";
  const isDraft = !["approved"].includes(quotation?.status);

  return (
    <div
      className="print-quotation-content p-8 bg-white"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      {/* Header */}
      <div className="text-center border-b-2 border-[#333333] pb-4 mb-4">
        <h1 className="text-xl font-bold text-[#333333]">QUOTATION</h1>
        <div className="text-sm text-gray-600 mt-1">
          {quotation?.quotation_number}{" "}
          {quotation?.current_version > 0 && `| V${quotation?.current_version}`}
          {isDraft && (
            <span className="ml-2 text-red-600 font-bold">[DRAFT]</span>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-6 mb-4 text-sm">
        <div>
          <div className="font-semibold mb-1">Vendor:</div>
          <div>{quotation?.vendor_snapshot?.name}</div>
          <div>{quotation?.vendor_snapshot?.company_name}</div>
          <div>{quotation?.vendor_snapshot?.contact_number}</div>
          <div>{quotation?.vendor_snapshot?.address}</div>
        </div>
        <div className="text-right">
          <div>
            <span className="font-semibold">Date:</span>{" "}
            {formatDate(quotation?.quotation_date)}
          </div>
          <div className="mt-1">
            <span className="font-semibold">Project:</span>{" "}
            {quotation?.project_snapshot?.name}
          </div>
          <div>
            <span className="font-semibold">Site:</span>{" "}
            {quotation?.project_snapshot?.site_location}
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
          {quotation?.items?.map((item, i) => (
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
        <div className="w-64">
          <div className="flex justify-between text-sm py-1 border-b border-gray-200">
            <span>Subtotal</span>
            <span className="font-medium">
              {formatCurrency(quotation?.subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-sm py-1.5 font-bold border-t-2 border-[#333333]">
            <span>Grand Total</span>
            <span>{formatCurrency(quotation?.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      {quotation?.terms_conditions && (
        <div className="mb-6">
          <div className="font-semibold text-sm mb-1">Terms & Conditions:</div>
          <div className="text-xs text-gray-600 whitespace-pre-line border border-gray-200 rounded p-2">
            {quotation.terms_conditions}
          </div>
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mt-8">
        <div className="border-t-2 border-[#333333] pt-2">
          <div className="text-xs font-semibold mb-1">Approved By</div>
          {isApproved && quotation?.signature_data?.signature_base64 && (
            <div>
              <img
                src={`data:image/png;base64,${quotation.signature_data.signature_base64}`}
                alt="Signature"
                style={{ maxHeight: "60px", maxWidth: "150px" }}
              />
              <div className="text-xs mt-1">
                {quotation.signature_data.signer_name}
              </div>
              <div className="text-xs text-gray-500">
                {quotation.signature_data.signer_designation}
              </div>
              <div className="text-xs text-gray-400">
                {formatDateTime(quotation?.approved_at)}
              </div>
            </div>
          )}
          {!isApproved && <div className="h-12" />}
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

// ====================== MAIN COMPONENT ======================
export default function QuotationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("details");
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState("");
  const printRef = useRef();

  // RTK Query
  const {
    data: quotation,
    isLoading,
    error: queryError,
  } = useGetQuotationByIdQuery(id);

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

  if (isLoading)
    return (
      <div className="p-6 text-sm text-gray-400">Loading quotation...</div>
    );
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
    (user?.role === "admin" || quotation.created_by === user?.id);

  const canDelete =
    user?.role === "admin" ||
    ((quotation.status === "draft" ||
      quotation.status === "returned_for_editing") &&
      quotation.created_by === user?.id);

  const canApprove =
    user?.role === "admin" &&
    ["submitted", "resubmitted"].includes(quotation.status);

  const latestVersion = quotation.versions?.length
    ? quotation.versions[quotation.versions.length - 1]
    : null;

  return (
    <div className="p-6">
      {/* Dialogs */}
      {dialog === "approve" && (
        <ConfirmDialog
          title="Approve Quotation"
          message={`Approve quotation ${quotation.quotation_number}?`}
          onConfirm={handleApprove}
          onCancel={() => setDialog(null)}
          placeholder="Optional remarks..."
        />
      )}
      {dialog === "return" && (
        <ConfirmDialog
          title="Return for Editing"
          message={`Return quotation ${quotation.quotation_number} for editing?`}
          onConfirm={handleReturn}
          onCancel={() => setDialog(null)}
          placeholder="Enter remarks (required)..."
          requireText
        />
      )}
      {dialog === "decline" && (
        <ConfirmDialog
          title="Decline Quotation"
          message={`Decline quotation ${quotation.quotation_number}?`}
          onConfirm={handleDecline}
          onCancel={() => setDialog(null)}
          placeholder="Enter reason (required)..."
          requireText
        />
      )}
      {dialog === "delete" && (
        <ConfirmDialog
          title="Delete Quotation"
          message={`Permanently delete quotation ${quotation.quotation_number}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDialog(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <button
            onClick={() => navigate("/quotations")}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#333333] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Quotations
          </button>
          <div className="flex items-center gap-3">
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

        <div className="flex items-center gap-2 no-print">
          {canEdit && (
            <button
              onClick={() => navigate(`/quotations/${id}/edit`)}
              className="flex items-center gap-1.5 border border-[#E5E7EB] text-sm font-medium px-3 py-2 rounded-md hover:bg-gray-50 text-[#333333]"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 border border-[#E5E7EB] text-sm font-medium px-3 py-2 rounded-md hover:bg-gray-50 text-[#333333]"
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
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {/* Admin Remarks */}
      {latestVersion?.admin_remarks && (
        <div
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border mb-5 ${
            quotation.status === "returned_for_editing"
              ? "bg-blue-50 border-blue-200"
              : quotation.status === "declined"
                ? "bg-red-50 border-red-200"
                : "bg-green-50 border-green-200"
          }`}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
          <div>
            <div className="text-xs font-semibold text-gray-700">
              Admin Remarks
            </div>
            <div className="text-sm text-gray-600 mt-0.5">
              {latestVersion.admin_remarks}
            </div>
            {latestVersion.reviewed_by_name && (
              <div className="text-xs text-gray-400 mt-0.5">
                — {latestVersion.reviewed_by_name} on{" "}
                {formatDateTime(latestVersion.reviewed_at)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E5E7EB] mb-5 no-print">
        {["details", "versions"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? "border-[#E31E24] text-[#E31E24]"
                : "border-transparent text-gray-500 hover:text-[#333333]"
            }`}
          >
            {tab === "versions"
              ? `Version History (${quotation.versions?.length || 0})`
              : "Details"}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === "details" && (
        <div
          className={`${!["approved"].includes(quotation.status) ? "draft-watermark-wrap" : ""}`}
          ref={printRef}
        >
          <PrintableQuotation quotation={quotation} />
        </div>
      )}

      {/* Versions Tab */}
      {activeTab === "versions" && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          {!quotation.versions?.length ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No versions yet. Submit the quotation to create V1.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                    Version
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                    Submitted
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                    Admin Remarks
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                    Reviewed
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...quotation.versions].reverse().map((v) => {
                  const vcfg = getStatusConfig(v.status);
                  return (
                    <tr
                      key={v.version_number}
                      className="border-b border-[#F3F4F6]"
                    >
                      <td className="px-4 py-3 font-semibold text-[#E31E24]">
                        {quotation.quotation_number}-V{v.version_number}
                        {v.version_number === quotation.current_version && (
                          <span className="ml-1.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatDateTime(v.submitted_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#333333]">
                        {formatCurrency(v.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${vcfg.bg} ${vcfg.text} ${vcfg.border}`}
                        >
                          {vcfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">
                        {v.admin_remarks || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {v.reviewed_at ? (
                          <>
                            <div>{v.reviewed_by_name}</div>
                            <div>{formatDateTime(v.reviewed_at)}</div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
