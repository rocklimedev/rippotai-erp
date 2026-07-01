import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetQuotationByIdQuery,
  useApproveQuotationMutation,
  useReturnQuotationMutation,
  useDeclineQuotationMutation,
  useSoftDeleteQuotationMutation,
} from "../../api/quotation.api";

import { useGetSignatureQuery } from "../../api/user-signatures.api";
import { useGetSettingByKeyQuery } from "../../api/settings.api";

import { getStatusConfig } from "../../utils/helpers";
import { useAuth } from "../../store/use-auth";
import {
  Edit,
  Printer,
  CheckCircle,
  RotateCcw,
  XCircle,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { normaliseQuotation } from "../../utils/normaliseQuotation";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import PrintableQuotation from "../../components/quotations/PrintableQuotation";
import DetailsTab from "../../components/quotations/DetailsTab";
import VersionHistoryTab from "../../components/quotations/VersionHistoryTab";

export default function QuotationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const printRef = useRef(null);

  const [activeTab, setActiveTab] = useState("details");
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState("");

  // Fetch data
  const {
    data: rawQuotation,
    isLoading,
    error: queryError,
  } = useGetQuotationByIdQuery(id);

  const quotation = normaliseQuotation(rawQuotation);

  // Admin signature
  const { data: adminSignature } = useGetSignatureQuery(user?.id, {
    skip:
      !user?.id || user?.role !== "ADMIN" || quotation?.status !== "approved",
  });

  // Settings
  const { data: termsSetting } = useGetSettingByKeyQuery("terms");
  const { data: companySetting } = useGetSettingByKeyQuery("company");

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

  // Print Handler - Only PrintableQuotation
  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;

    const originalContent = document.body.innerHTML;

    document.body.innerHTML = `
      <div style="margin:0; padding:0; background:white;">
        ${printContent}
      </div>
    `;

    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Restore React
  };

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-400">Loading quotation...</div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-6 text-sm text-[#1A3C34]">
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
        <div className="flex items-center gap-2 flex-wrap justify-end no-print">
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
                className="flex items-center gap-1.5 bg-[#1A3C34] text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-[#122B25] disabled:opacity-60"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => setDialog("return")}
                disabled={actionLoading}
                className="flex items-center gap-1.5 bg-[#4C7A6B] text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-[#3D6459] disabled:opacity-60"
              >
                <RotateCcw className="w-4 h-4" /> Return
              </button>
              <button
                onClick={() => setDialog("decline")}
                disabled={actionLoading}
                className="flex items-center gap-1.5 bg-[#0F241F] text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-[#0A1815] disabled:opacity-60"
              >
                <XCircle className="w-4 h-4" /> Decline
              </button>
            </>
          )}

          {canDelete && (
            <button
              onClick={() => setDialog("delete")}
              disabled={actionLoading}
              className="flex items-center gap-1.5 border border-[#1A3C34]/30 text-[#1A3C34] text-sm font-medium px-3 py-2 rounded-md hover:bg-[#E7F0EC] disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-[#E7F0EC] border border-[#1A3C34]/20 text-[#1A3C34] text-sm px-4 py-2 rounded mb-4 no-print">
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
                  ? "border-[#1A3C34] text-[#1A3C34]"
                  : "border-transparent text-gray-500 hover:text-[#333333]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="no-print">
        {activeTab === "details" && <DetailsTab quotation={quotation} />}
        {activeTab === "versions" && <VersionHistoryTab quotationId={id} />}
      </div>

      {/* Print Preview Tab + Print Target */}
      <div
        ref={printRef}
        className={activeTab === "print" ? "block" : "hidden print:block"}
      >
        <PrintableQuotation
          quotation={quotation}
          adminSignature={adminSignature}
          termsConditions={termsSetting?.value?.default_terms}
          company={companySetting?.value}
        />
      </div>
    </div>
  );
}
