import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { fmtINR, relativeTime, StatusChip } from "@/lib/format";
// Blob downloads (PDF/Excel export) aren't covered by the RTK Query slice below,
// so those two calls still go through the plain axios client.
import api from "@/lib/api";
import {
  useGetQuotationByIdQuery,
  useSubmitQuotationMutation,
  useApproveQuotationMutation,
  useReturnQuotationMutation,
  useDeclineQuotationMutation,
  useCancelQuotationMutation,
  useRestoreQuotationMutation,
  useSoftDeleteQuotationMutation,
  useCreateQuotationItemMutation,
  useUpdateQuotationItemMutation,
  useDeleteQuotationItemMutation,
  useGetQuotationVersionsQuery,
  useCreateQuotationVersionMutation,
  useRestoreQuotationVersionMutation,
  useDeleteQuotationVersionMutation,
} from "../../api/quotation.api"; // adjust to wherever quotationApi.js actually lives
import {
  ArrowLeft,
  Download,
  Copy,
  Send,
  CheckCircle2,
  XCircle,
  Trash2,
  Upload,
  FileText,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Archive,
} from "lucide-react";

const TABS = [
  "Items",
  "Commercial Terms",
  "Approval History",
  "Versions",


];

export default function QuotationDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const {
    data: q,
    isLoading,
    isError,
  } = useGetQuotationByIdQuery(id, { skip: !id });

  const [submitQuotation, { isLoading: submitting }] =
    useSubmitQuotationMutation();
  const [approveQuotation, { isLoading: approving }] =
    useApproveQuotationMutation();
  const [returnQuotation, { isLoading: returning }] =
    useReturnQuotationMutation();
  const [declineQuotation, { isLoading: declining }] =
    useDeclineQuotationMutation();
  const [cancelQuotation, { isLoading: cancelling }] =
    useCancelQuotationMutation();
  const [restoreQuotation] = useRestoreQuotationMutation();
  const [softDeleteQuotation] = useSoftDeleteQuotationMutation();

  const [createQuotationItem] = useCreateQuotationItemMutation();
  const [updateQuotationItem] = useUpdateQuotationItemMutation();
  const [deleteQuotationItem] = useDeleteQuotationItemMutation();

  const [tab, setTab] = useState("Items");
  const [remarkModal, setRemarkModal] = useState(null); // { label, onConfirm(remarks) }
  const [remark, setRemark] = useState("");
  const busy = submitting || approving || returning || declining || cancelling;

  if (isLoading) return <div className="p-8 text-[#6B7B7C]">Loading…</div>;
  if (isError || !q)
    return (
      <div className="p-8 text-[#6B7B7C]">Couldn't load this quotation.</div>
    );

  // --- Derived values, mapped from the real payload shape ---
  const vendor = q.vendor || q.vendorSnapshot || {};
  const project = q.project || q.projectSnapshot || {};
  const readOnly = q.status === "approved" && !isAdmin;
  const editable = !readOnly && ["draft", "returned"].includes(q.status);
  const isDeleted = !!q.deletedAt;

  const subtotal = Number(q.subtotal || 0);
  const taxAmount = Number(q.taxAmount || 0);
  const additionalCharges = Number(q.additionalCharges || 0);
  const discountValue = Number(q.discount ?? q.globalDiscountValue ?? 0);
  const total = Number(q.totalAmount || 0);

  const runAction = async (mutationFn, args, successMsg = "Done") => {
    try {
      await mutationFn(args).unwrap();
      toast.success(successMsg);
      setRemarkModal(null);
      setRemark("");
    } catch (e) {
      toast.error(e?.data?.detail || e?.error || "Action failed");
    }
  };

  const handleSubmit = () =>
    runAction(
      submitQuotation,
      { id, submitted_by: user?.id },
      "Sent for review",
    );
  const handleApprove = (remarks) =>
    runAction(approveQuotation, { id, remarks }, "Approved");
  const handleReturn = (remarks) =>
    runAction(returnQuotation, { id, remarks }, "Returned for revision");
  const handleDecline = (remarks) =>
    runAction(declineQuotation, { id, remarks }, "Declined");
  const handleCancel = () =>
    runAction(cancelQuotation, { id, updated_by: user?.id }, "Cancelled");
  const handleRestore = () => runAction(restoreQuotation, id, "Restored");
  const handleSoftDelete = () =>
    runAction(
      softDeleteQuotation,
      { id, deleted_by: user?.id },
      "Moved to trash",
    );

  const addItem = async () => {
    try {
      await createQuotationItem({
        quotationId: id,
        particular: "New item",
        quantity: 1,
        rate: 0,
        remarks: "",
      }).unwrap();
    } catch {
      toast.error("Failed to add item");
    }
  };
  const patchItem = async (itemId, patch) => {
    try {
      await updateQuotationItem({ itemId, ...patch }).unwrap();
    } catch {
      toast.error("Failed to update item");
    }
  };
  const delItem = async (itemId) => {
    try {
      await deleteQuotationItem(itemId).unwrap();
    } catch {
      toast.error("Failed to delete item");
    }
  };


  const exportPdf = async () => {
    const res = await api.post(
      `/quotations/${id}/export/pdf`,
      {},
      { responseType: "blob" },
    );
    const url = URL.createObjectURL(
      new Blob([res.data], { type: "application/pdf" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `Quotation_${q.quotationNumber}.pdf`;
    a.click();
  };
  const exportXlsx = async () => {
    const res = await api.get(`/quotations/${id}/export/excel`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `Quotation_${q.quotationNumber}.xlsx`;
    a.click();
  };

  return (
    <div className="max-w-[1440px] mx-auto p-6">
      <button
        onClick={() => nav("/quotations")}
        className="text-[13px] text-[#6B7B7C] hover:text-[#333333] inline-flex items-center gap-1 mb-3"
        data-testid="btn-back-quotations"
      >
        <ArrowLeft size={14} /> Estimates
      </button>

      {isDeleted && (
        <div className="mb-3 flex items-center justify-between bg-[#EAEEF0] border border-[#B5C4B6] rounded-lg px-4 py-2 text-[13px]">
          <span className="text-[#333333]">
            This quotation was deleted{q.deletedBy ? ` by ${q.deletedBy}` : ""}.
          </span>
          {isAdmin && (
            <button
              onClick={handleRestore}
              className="inline-flex items-center gap-1 font-semibold text-[#1F453B]"
            >
              <RotateCcw size={13} /> Restore
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-[#B5C4B6] rounded-xl p-5">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] uppercase tracking-widest text-[#B5C4B6] font-semibold">
                QUOTATION
              </span>
              <StatusChip status={q.status} />
              <span className="text-[11px] font-semibold text-[#333333] bg-[#EAEEF0] px-1.5 py-0.5 rounded">
                V{q.currentVersion ?? 1}
              </span>
            </div>
            <h1
              className="text-[36px] font-bold text-[#333333] mt-1.5"
              data-testid="quotation-title"
            >
              {project.name || "Untitled Project"}
            </h1>
            <div className="text-[13px] text-[#6B7B7C] mt-1 space-x-3">
              <Link
                to={`/vendors/${q.vendorId || q.vendor_id}`}
                className="hover:text-[#333333]"
              >
                <span className="font-semibold">{vendor.name || "—"}</span>
              </Link>
              {vendor.company_name && (
                <>
                  <span className="text-[#B5C4B6]">·</span>
                  <span>{vendor.company_name}</span>
                </>
              )}
              {vendor.vendorCategory?.name && (
                <>
                  <span className="text-[#B5C4B6]">·</span>
                  <span>{vendor.vendorCategory.name}</span>
                </>
              )}
            </div>
            <div className="text-[12px] text-[#B5C4B6] mt-1">
              {q.quotationNumber} · {q.quotationDate}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
              Estimate Total
            </div>
            <div
              className="text-[34px] font-bold text-[#333333] leading-none mt-1"
              data-testid="quotation-total"
            >
              {fmtINR(total)}
            </div>
            <div className="text-[11px] text-[#6B7B7C] mt-1">
              Subtotal {fmtINR(subtotal)} · Tax ({q.taxPercent || 0}%){" "}
              {fmtINR(taxAmount)}
            </div>
            {(discountValue > 0 || additionalCharges > 0) && (
              <div className="text-[11px] text-[#6B7B7C] mt-0.5">
                {discountValue > 0 &&
                  `Discount ${q.globalDiscountType === "percent" ? `${discountValue}%` : fmtINR(discountValue)}`}
                {discountValue > 0 && additionalCharges > 0 && " · "}
                {additionalCharges > 0 &&
                  `Additional charges ${fmtINR(additionalCharges)}`}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#B5C4B6]">
          <button
            onClick={exportPdf}
            data-testid="btn-export-pdf"
            className="px-3 py-1.5 rounded-lg border border-[#B5C4B6] text-[12.5px] font-semibold inline-flex items-center gap-1"
          >
            <Download size={13} /> PDF
          </button>
          <button
            onClick={exportXlsx}
            data-testid="btn-export-excel"
            className="px-3 py-1.5 rounded-lg border border-[#B5C4B6] text-[12.5px] font-semibold inline-flex items-center gap-1"
          >
            <Download size={13} /> Excel
          </button>
          <div className="ml-auto flex flex-wrap gap-2">
            {!readOnly && !isDeleted && q.status === "draft" && (
              <button
                onClick={handleSubmit}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold inline-flex items-center gap-1"
                data-testid="btn-submit"
              >
                <Send size={13} /> Submit for Review
              </button>
            )}
            {!readOnly &&
              !isDeleted &&
              ["submitted", "under_review", "awaiting_approval"].includes(
                q.status,
              ) && (
                <>
                  <button
                    onClick={() =>
                      setRemarkModal({
                        label: "Approve",
                        onConfirm: handleApprove,
                      })
                    }
                    disabled={busy}
                    className="px-3 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold inline-flex items-center gap-1"
                    data-testid="btn-approve"
                  >
                    <CheckCircle2 size={13} /> Approve
                  </button>
                  <button
                    onClick={() =>
                      setRemarkModal({
                        label: "Return for Revision",
                        onConfirm: handleReturn,
                      })
                    }
                    disabled={busy}
                    className="px-3 py-1.5 rounded-lg border border-[#B5C4B6] text-[12.5px] font-semibold"
                  >
                    Return
                  </button>
                  <button
                    onClick={() =>
                      setRemarkModal({
                        label: "Decline",
                        onConfirm: handleDecline,
                      })
                    }
                    disabled={busy}
                    className="px-3 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold inline-flex items-center gap-1"
                  >
                    <XCircle size={13} /> Decline
                  </button>
                </>
              )}
            {!isDeleted &&
              ["approved", "submitted", "under_review"].includes(q.status) && (
                <button
                  onClick={handleCancel}
                  disabled={busy}
                  className="px-3 py-1.5 rounded-lg border border-[#B5C4B6] text-[12.5px] font-semibold"
                >
                  Cancel
                </button>
              )}
            {isAdmin && !isDeleted && (
              <button
                onClick={handleSoftDelete}
                className="px-3 py-1.5 rounded-lg border border-[#B5C4B6] text-[12.5px] font-semibold inline-flex items-center gap-1 text-[#333333]"
                title="Move to trash"
              >
                <Archive size={13} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-[#B5C4B6] overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            data-testid={`detail-tab-${t.replace(/\s+/g, "-").toLowerCase()}`}
            className={`px-4 py-2 text-[13px] font-semibold whitespace-nowrap ${tab === t ? "text-[#333333] border-b-2 border-[#1F453B]" : "text-[#6B7B7C]"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "Items" && (
          <div className="bg-white border border-[#B5C4B6] rounded-xl p-4">
            <div className="flex justify-between mb-3">
              <div className="text-[13px] font-semibold text-[#333333]">
                {q.items?.length || 0} items
              </div>
              {editable && (
                <button
                  onClick={addItem}
                  className="px-3 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12px] font-semibold"
                  data-testid="btn-add-item"
                >
                  + Add Item
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead className="text-[11px] uppercase tracking-wider text-[#B5C4B6]">
                  <tr className="border-b border-[#B5C4B6]">
                    <th className="text-left py-2 pr-2">#</th>
                    <th className="text-left py-2 pr-2">Particular</th>
                    <th className="text-right py-2 pr-2">Qty</th>
                    <th className="text-right py-2 pr-2">Rate</th>
                    <th className="text-right py-2 pr-2">Amount</th>
                    <th className="text-left py-2 pr-2">Remarks</th>
                    {editable && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {(q.items || []).map((it) => (
                    <tr key={it.id} className="border-b border-[#EAEEF0]">
                      <td className="py-2 pr-2 text-[#B5C4B6]">{it.sno}</td>
                      <td className="py-2 pr-2">
                        {editable ? (
                          <input
                            value={it.particular || ""}
                            onChange={(e) =>
                              patchItem(it.id, { particular: e.target.value })
                            }
                            className="w-full px-2 py-1 border border-transparent hover:border-[#B5C4B6] rounded"
                          />
                        ) : (
                          it.particular
                        )}
                      </td>
                      <td className="py-2 pr-2 text-right">
                        {editable ? (
                          <input
                            type="number"
                            value={it.quantity}
                            onChange={(e) =>
                              patchItem(it.id, {
                                quantity: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-20 px-2 py-1 border border-transparent hover:border-[#B5C4B6] rounded text-right"
                          />
                        ) : (
                          Number(it.quantity)
                        )}
                      </td>
                      <td className="py-2 pr-2 text-right">
                        {editable ? (
                          <input
                            type="number"
                            value={it.rate}
                            onChange={(e) =>
                              patchItem(it.id, {
                                rate: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-24 px-2 py-1 border border-transparent hover:border-[#B5C4B6] rounded text-right"
                          />
                        ) : (
                          fmtINR(it.rate)
                        )}
                      </td>
                      <td className="py-2 pr-2 text-right font-semibold">
                        {fmtINR(it.amount || 0)}
                      </td>
                      <td className="py-2 pr-2">
                        {editable ? (
                          <input
                            value={it.remarks || ""}
                            onChange={(e) =>
                              patchItem(it.id, { remarks: e.target.value })
                            }
                            className="w-full px-2 py-1 border border-transparent hover:border-[#B5C4B6] rounded"
                          />
                        ) : (
                          it.remarks || "—"
                        )}
                      </td>
                      {editable && (
                        <td className="py-2">
                          <button
                            onClick={() => delItem(it.id)}
                            className="text-[#333333]"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="text-[12.5px]">
                    <td
                      colSpan={4}
                      className="py-2 pr-2 text-right font-semibold text-[#6B7B7C]"
                    >
                      Subtotal
                    </td>
                    <td className="py-2 pr-2 text-right font-semibold">
                      {fmtINR(subtotal)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {tab === "Commercial Terms" && (
          <div className="bg-white border border-[#B5C4B6] rounded-xl p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#B5C4B6]">
                  Tax
                </div>
                <div className="text-[#333333] font-semibold">
                  {q.taxPercent || 0}% ({fmtINR(taxAmount)})
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#B5C4B6]">
                  Discount
                </div>
                <div className="text-[#333333] font-semibold">
                  {discountValue > 0
                    ? q.globalDiscountType === "percent"
                      ? `${discountValue}%`
                      : fmtINR(discountValue)
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#B5C4B6]">
                  Additional Charges
                </div>
                <div className="text-[#333333] font-semibold">
                  {fmtINR(additionalCharges)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#B5C4B6]">
                  Created
                </div>
                <div className="text-[#333333] font-semibold">
                  {relativeTime(q.created_at)}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[11px] uppercase tracking-wider text-[#B5C4B6]">
                  Terms &amp; Conditions
                </div>
                <div className="text-[#333333] whitespace-pre-wrap">
                  {q.termsConditions || "—"}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "Approval History" && (
          <div className="bg-white border border-[#B5C4B6] rounded-xl p-5">
            <ApprovalHistory q={q} />
          </div>
        )}

        {tab === "Versions" && (
          <VersionsTab
            id={id}
            currentVersion={q.currentVersion}
            isAdmin={isAdmin}
          />
        )}

    
      </div>

      {remarkModal && (
        <div
          className="fixed inset-0 z-50 bg-[#1F453B]/40 flex items-center justify-center p-4"
          onClick={() => setRemarkModal(null)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[15px] font-bold mb-2">
              {remarkModal.label}
            </div>
            <textarea
              autoFocus
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={4}
              placeholder="Add remarks (optional)…"
              className="w-full px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
              data-testid="remark-input"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setRemarkModal(null)}
                className="px-3 py-1.5 rounded-lg border border-[#B5C4B6] text-[12.5px]"
              >
                Cancel
              </button>
              <button
                onClick={() => remarkModal.onConfirm(remark)}
                disabled={busy}
                className="px-4 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold"
                data-testid="btn-confirm-remark"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalHistory({ q }) {
  const events = [];
  if (q.submittedAt) {
    events.push({
      id: "submitted",
      action: "submitted",
      actor: q.submittedBy,
      at: q.submittedAt,
    });
  }
  if (q.reviewedAt) {
    events.push({
      id: "reviewed",
      action: q.status === "approved" ? "approved" : "reviewed",
      actor: q.reviewedBy,
      at: q.reviewedAt,
      remarks: q.reviewRemarks,
    });
  }

  if (events.length === 0) {
    return (
      <div className="text-[#B5C4B6] text-center py-6">
        No approval events yet.
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {events.map((a) => (
        <li key={a.id} className="flex gap-3">
          <div className="w-2 h-2 rounded-full bg-[#1F453B] mt-1.5" />
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-[#333333]">
              {a.action.replace(/_/g, " ")}
            </div>
            <div className="text-[12px] text-[#6B7B7C]">
              {a.actor || "—"} · {relativeTime(a.at)}
            </div>
            {a.remarks && (
              <div className="text-[12px] text-[#6B7B7C] mt-1">
                &ldquo;{a.remarks}&rdquo;
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function VersionsTab({ id, currentVersion, isAdmin }) {
  const { data: rows = [], isLoading } = useGetQuotationVersionsQuery(id, {
    skip: !id,
  });
  const [createQuotationVersion, { isLoading: creating }] =
    useCreateQuotationVersionMutation();
  const [restoreQuotationVersion] = useRestoreQuotationVersionMutation();
  const [deleteQuotationVersion] = useDeleteQuotationVersionMutation();
  const { user } = useAuth();

  const [openId, setOpenId] = useState(null);
  const [remarkModal, setRemarkModal] = useState(false);
  const [remark, setRemark] = useState("");

  const handleCreateVersion = async () => {
    try {
      await createQuotationVersion({
        quotationId: id,
        created_by: user?.id,
        remarks: remark,
      }).unwrap();
      toast.success("Version saved");
      setRemarkModal(false);
      setRemark("");
    } catch {
      toast.error("Failed to save version");
    }
  };

  const handleRestoreVersion = async (versionId) => {
    try {
      await restoreQuotationVersion({
        id: versionId,
        restored_by: user?.id,
      }).unwrap();
      toast.success("Version restored");
    } catch {
      toast.error("Failed to restore version");
    }
  };

  const handleDeleteVersion = async (versionId) => {
    try {
      await deleteQuotationVersion(versionId).unwrap();
      toast.success("Version deleted");
    } catch {
      toast.error("Failed to delete version");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-[#B5C4B6] rounded-xl p-5">
        <div className="text-[#B5C4B6] text-center py-6">Loading versions…</div>
      </div>
    );
  }

  const sorted = [...rows].sort((a, b) => b.version - a.version);

  return (
    <div className="bg-white border border-[#B5C4B6] rounded-xl p-5">
      <div className="flex justify-between items-center mb-3">
        <div className="text-[13px] font-semibold text-[#333333]">
          {rows.length} version{rows.length === 1 ? "" : "s"}
        </div>
        <button
          onClick={() => setRemarkModal(true)}
          disabled={creating}
          className="px-3 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12px] font-semibold inline-flex items-center gap-1"
        >
          <Copy size={12} /> Save Version
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-[#B5C4B6] text-center py-6">No versions yet.</div>
      ) : (
        <div className="space-y-2">
          {sorted.map((r) => {
            const isOpen = openId === r.id;
            const snap = r.snapshot || {};
            return (
              <div
                key={r.id}
                className="border border-[#B5C4B6] rounded-lg overflow-hidden"
              >
                <div className="w-full flex justify-between items-center p-3 hover:bg-[#FAF8F5]">
                  <button
                    onClick={() => setOpenId(isOpen ? null : r.id)}
                    className="flex items-center gap-2 text-left flex-1"
                  >
                    {isOpen ? (
                      <ChevronDown size={14} className="text-[#B5C4B6]" />
                    ) : (
                      <ChevronRight size={14} className="text-[#B5C4B6]" />
                    )}
                    <div>
                      <div className="text-[13px] font-semibold text-[#333333] flex items-center gap-2">
                        V{r.version}
                        {r.version === currentVersion && (
                          <span className="text-[10px] font-semibold text-[#1F453B] bg-[#EAEEF0] px-1.5 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                        <StatusChip status={snap.status} />
                      </div>
                      <div className="text-[12px] text-[#6B7B7C]">
                        {r.remarks || "No remarks"} ·{" "}
                        {relativeTime(r.created_at)}
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="text-[14px] font-bold text-[#333333]">
                      {fmtINR(snap.totalAmount || 0)}
                    </div>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleRestoreVersion(r.id)}
                          title="Restore this version"
                          className="text-[#6B7B7C] hover:text-[#1F453B]"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteVersion(r.id)}
                          title="Delete this version"
                          className="text-[#6B7B7C] hover:text-[#333333]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-[#EAEEF0] p-3 bg-[#FAF8F5]">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px] mb-3">
                      <div>
                        <div className="text-[10px] uppercase text-[#B5C4B6]">
                          Subtotal
                        </div>
                        <div className="font-semibold text-[#333333]">
                          {fmtINR(snap.subtotal || 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-[#B5C4B6]">
                          Tax
                        </div>
                        <div className="font-semibold text-[#333333]">
                          {fmtINR(snap.taxAmount || 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-[#B5C4B6]">
                          Discount
                        </div>
                        <div className="font-semibold text-[#333333]">
                          {snap.discount ? fmtINR(snap.discount) : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-[#B5C4B6]">
                          Items
                        </div>
                        <div className="font-semibold text-[#333333]">
                          {snap.items?.length || 0}
                        </div>
                      </div>
                    </div>
                    <table className="w-full text-[12px]">
                      <thead className="text-[10px] uppercase text-[#B5C4B6]">
                        <tr className="border-b border-[#B5C4B6]">
                          <th className="text-left py-1">#</th>
                          <th className="text-left py-1">Particular</th>
                          <th className="text-right py-1">Qty</th>
                          <th className="text-right py-1">Rate</th>
                          <th className="text-right py-1">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(snap.items || []).map((it) => (
                          <tr key={it.id} className="border-b border-[#EAEEF0]">
                            <td className="py-1 text-[#B5C4B6]">{it.sno}</td>
                            <td className="py-1">{it.particular}</td>
                            <td className="py-1 text-right">
                              {Number(it.quantity)}
                            </td>
                            <td className="py-1 text-right">
                              {fmtINR(it.rate)}
                            </td>
                            <td className="py-1 text-right font-semibold">
                              {fmtINR(it.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {remarkModal && (
        <div
          className="fixed inset-0 z-50 bg-[#1F453B]/40 flex items-center justify-center p-4"
          onClick={() => setRemarkModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[15px] font-bold mb-2">Save Version</div>
            <textarea
              autoFocus
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={4}
              placeholder="Add remarks (optional)…"
              className="w-full px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setRemarkModal(false)}
                className="px-3 py-1.5 rounded-lg border border-[#B5C4B6] text-[12.5px]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVersion}
                disabled={creating}
                className="px-4 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
