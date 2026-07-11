import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { fmtINR, relativeTime, StatusChip } from "@/lib/format";
import {
  ArrowLeft,
  Download,
  GitCompare,
  Copy,
  Send,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Trash2,
  Archive,
  Upload,
  FileText,
} from "lucide-react";

const TABS = [
  "Items",
  "Commercial Terms",
  "BOQ Comparison",
  "Approval History",
  "Versions",
  "Attachments",
  "Activity",
  "Notes",
];

function DaysPill({ q }) {
  const d = q.days_remaining;
  if (d == null) return null;
  const s =
    d < 0
      ? { l: "Expired", bg: "#EAEEF0", fg: "#1F453B" }
      : d <= 7
        ? { l: `Expires in ${d}d`, bg: "#EAEEF0", fg: "#1F453B" }
        : { l: `${d}d left`, bg: "#EAEEF0", fg: "#1F453B" };
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.l}
    </span>
  );
}

export default function QuotationDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [q, setQ] = useState(null);
  const [tab, setTab] = useState("Items");
  const [busy, setBusy] = useState(false);
  const [remarkModal, setRemarkModal] = useState(null); // { action, label }
  const [remark, setRemark] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get(`/quotations/${id}`);
      setQ(data);
    } catch {
      toast.error("Failed");
    }
  };
  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line

  if (!q) return <div className="p-8 text-[#6B7B7C]">Loading…</div>;

  const readOnly = q.status === "approved" && !isAdmin;
  const editable = !readOnly && ["draft", "returned"].includes(q.status);
  const total = q.subtotals?.total || 0;

  const doAction = async (action, remarks = "") => {
    setBusy(true);
    try {
      if (action === "approve") {
        // Phase G: signature-aware approve
        await api.post(`/quotations/${id}/approve-with-signature`);
      } else {
        await api.post(`/quotations/${id}/${action}`, { remarks });
      }
      toast.success("Done");
      setRemarkModal(null);
      setRemark("");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Action failed");
    }
    setBusy(false);
  };

  const duplicate = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/quotations/${id}/duplicate-version`);
      toast.success(`V${data.version} created`);
      nav(`/quotations/${data.id}`);
    } catch {
      toast.error("Failed");
    }
    setBusy(false);
  };

  const patchItem = async (iid, patch) => {
    await api.patch(`/quotations/${id}/items/${iid}`, patch);
    load();
  };
  const delItem = async (iid) => {
    await api.delete(`/quotations/${id}/items/${iid}`);
    load();
  };
  const addItem = async () => {
    await api.post(`/quotations/${id}/items`, {
      description: "New item",
      unit: "Nos.",
      quantity: 1,
      rate: 0,
      tax_pct: 18,
      calc_type: "M",
    });
    load();
  };

  const uploadAtt = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", "attachment");
    await api.post(`/quotations/${id}/attachments`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success("Attached");
    load();
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
    a.download = `Quotation_${q.quotation_number}.pdf`;
    a.click();
  };
  const exportXlsx = async () => {
    const res = await api.get(`/quotations/${id}/export/excel`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `Quotation_${q.quotation_number}.xlsx`;
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
                V{q.version}
              </span>
              {q.locked && (
                <span className="text-[11px] font-semibold text-[#333333] bg-[#EAEEF0] px-1.5 py-0.5 rounded">
                  Locked
                </span>
              )}
              <DaysPill q={q} />
            </div>
            <h1
              className="text-[36px] font-bold text-[#333333] mt-1.5"
              data-testid="quotation-title"
            >
              {q.title}
            </h1>
            <div className="text-[13px] text-[#6B7B7C] mt-1 space-x-3">
              <Link
                to={`/vendors/${q.vendor_id}`}
                className="hover:text-[#333333]"
              >
                <span className="font-semibold">{q.vendor_name || "—"}</span>
              </Link>
              <span className="text-[#B5C4B6]">·</span>
              <span>{q.project_name || "—"}</span>
              <span className="text-[#B5C4B6]">·</span>
              <span>{q.work_category}</span>
            </div>
            <div className="text-[12px] text-[#B5C4B6] mt-1">
              {q.quotation_number} · {q.quotation_date} · Valid until{" "}
              {q.valid_until}
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
              Base {fmtINR(q.subtotals?.base || 0)} · Tax{" "}
              {fmtINR(q.subtotals?.tax || 0)}
            </div>
            {q.boq_variation_pct != null && (
              <div
                className={`text-[12px] font-semibold mt-1 ${q.boq_variation_pct > 10 ? "text-[#333333]" : q.boq_variation_pct > 0 ? "text-[#333333]" : "text-[#333333]"}`}
              >
                {q.boq_variation_pct > 0 ? "+" : ""}
                {q.boq_variation_pct}% vs BOQ
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#B5C4B6]">
          <button
            onClick={duplicate}
            className="px-3 py-1.5 rounded-lg border border-[#B5C4B6] text-[12.5px] font-semibold inline-flex items-center gap-1"
          >
            <Copy size={13} /> Duplicate Version
          </button>
          <button
            onClick={() => nav(`/quotations/compare?ids=${id}`)}
            className="px-3 py-1.5 rounded-lg border border-[#B5C4B6] text-[12.5px] font-semibold inline-flex items-center gap-1"
          >
            <GitCompare size={13} /> Compare
          </button>
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
            {!readOnly && q.status === "draft" && (
              <>
                <button
                  onClick={() => doAction("send-to-reviewer")}
                  className="px-3 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold inline-flex items-center gap-1"
                  data-testid="btn-send-reviewer"
                >
                  <Send size={13} /> Send to Reviewer
                </button>
                <button
                  onClick={() => doAction("send-to-vendor")}
                  className="px-3 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold inline-flex items-center gap-1"
                >
                  <Send size={13} /> Send to Vendor
                </button>
              </>
            )}
            {!readOnly &&
              (q.status === "under_review" ||
                q.status === "awaiting_approval") && (
                <>
                  <button
                    onClick={() =>
                      setRemarkModal({ action: "approve", label: "Approve" })
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold inline-flex items-center gap-1"
                    data-testid="btn-approve"
                  >
                    <CheckCircle2 size={13} /> Approve
                  </button>
                  <button
                    onClick={() =>
                      setRemarkModal({
                        action: "return",
                        label: "Return for Revision",
                      })
                    }
                    className="px-3 py-1.5 rounded-lg border border-[#B5C4B6] text-[12.5px] font-semibold"
                  >
                    Return
                  </button>
                  <button
                    onClick={() =>
                      setRemarkModal({ action: "reject", label: "Reject" })
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold inline-flex items-center gap-1"
                  >
                    <XCircle size={13} /> Reject
                  </button>
                  <button
                    onClick={() =>
                      setRemarkModal({
                        action: "request-clarification",
                        label: "Request Clarification",
                      })
                    }
                    className="px-3 py-1.5 rounded-lg border border-[#B5C4B6] text-[12.5px] font-semibold inline-flex items-center gap-1"
                  >
                    <MessageSquare size={13} /> Clarify
                  </button>
                </>
              )}
            {q.status === "approved" && (
              <>
                <button
                  onClick={() =>
                    setRemarkModal({
                      action: "mark-selected",
                      label: "Mark as Selected",
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold"
                  data-testid="btn-mark-selected"
                >
                  Mark as Selected
                </button>
                <button
                  onClick={() =>
                    setRemarkModal({
                      action: "mark-not-selected",
                      label: "Mark as Not Selected",
                    })
                  }
                  className="px-3 py-1.5 rounded-lg border border-[#B5C4B6] text-[12.5px] font-semibold"
                >
                  Not Selected
                </button>
              </>
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
                    <th className="text-left py-2 pr-2">Description</th>
                    <th className="text-left py-2 pr-2">Unit</th>
                    <th className="text-right py-2 pr-2">Qty</th>
                    <th className="text-right py-2 pr-2">Rate</th>
                    <th className="text-right py-2 pr-2">Amount</th>
                    <th className="text-right py-2 pr-2">Tax %</th>
                    <th className="text-right py-2 pr-2">BOQ Δ</th>
                    {editable && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {(q.items || []).map((it, idx) => (
                    <tr key={it.id} className="border-b border-[#EAEEF0]">
                      <td className="py-2 pr-2 text-[#B5C4B6]">{idx + 1}</td>
                      <td className="py-2 pr-2">
                        {editable ? (
                          <input
                            value={it.description || ""}
                            onChange={(e) =>
                              patchItem(it.id, { description: e.target.value })
                            }
                            className="w-full px-2 py-1 border border-transparent hover:border-[#B5C4B6] rounded"
                          />
                        ) : (
                          it.description
                        )}
                        {it.boq_ref && (
                          <div className="text-[11px] text-[#B5C4B6]">
                            BOQ: {it.boq_ref}
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-2">{it.unit}</td>
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
                          it.quantity
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
                      <td className="py-2 pr-2 text-right">{it.tax_pct}%</td>
                      <td
                        className={`py-2 pr-2 text-right font-semibold ${it.variation_pct == null ? "text-[#B5C4B6]" : it.variation_pct > 10 ? "text-[#333333]" : it.variation_pct > 0 ? "text-[#333333]" : "text-[#333333]"}`}
                      >
                        {it.variation_pct == null
                          ? "—"
                          : `${it.variation_pct > 0 ? "+" : ""}${it.variation_pct}%`}
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
              </table>
            </div>
          </div>
        )}

        {tab === "Commercial Terms" && (
          <div className="bg-white border border-[#B5C4B6] rounded-xl p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
              {Object.entries(q.commercial_terms || {}).map(([k, v]) => (
                <div key={k}>
                  <div className="text-[11px] uppercase tracking-wider text-[#B5C4B6]">
                    {k.replace(/_/g, " ")}
                  </div>
                  <div className="text-[#333333] font-semibold">
                    {typeof v === "boolean"
                      ? v
                        ? "Yes"
                        : "No"
                      : Array.isArray(v)
                        ? v.join(", ")
                        : String(v || "—")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "BOQ Comparison" && (
          <div className="bg-white border border-[#B5C4B6] rounded-xl p-5">
            {(q.items || []).filter((i) => i.boq_ref_data).length === 0 ? (
              <div className="text-[13px] text-[#B5C4B6] text-center py-8">
                No BOQ-linked items in this quotation.
              </div>
            ) : (
              <table className="w-full text-[12.5px]">
                <thead className="text-[11px] uppercase text-[#B5C4B6]">
                  <tr className="border-b border-[#B5C4B6]">
                    <th className="text-left py-2">Item</th>
                    <th className="text-right py-2">BOQ Rate</th>
                    <th className="text-right py-2">BOQ Amount</th>
                    <th className="text-right py-2">Quoted Rate</th>
                    <th className="text-right py-2">Quoted Amount</th>
                    <th className="text-right py-2">Δ ₹</th>
                    <th className="text-right py-2">Δ %</th>
                  </tr>
                </thead>
                <tbody>
                  {(q.items || [])
                    .filter((i) => i.boq_ref_data)
                    .map((it) => {
                      const b = it.boq_ref_data;
                      const dRs = (it.amount || 0) - (b.boq_amount || 0);
                      return (
                        <tr key={it.id} className="border-b border-[#EAEEF0]">
                          <td className="py-2 pr-2">{it.description}</td>
                          <td className="py-2 pr-2 text-right">
                            {fmtINR(b.boq_rate)}
                          </td>
                          <td className="py-2 pr-2 text-right">
                            {fmtINR(b.boq_amount)}
                          </td>
                          <td className="py-2 pr-2 text-right">
                            {fmtINR(it.rate)}
                          </td>
                          <td className="py-2 pr-2 text-right">
                            {fmtINR(it.amount)}
                          </td>
                          <td
                            className={`py-2 pr-2 text-right font-semibold ${dRs > 0 ? "text-[#333333]" : "text-[#333333]"}`}
                          >
                            {dRs > 0 ? "+" : ""}
                            {fmtINR(dRs)}
                          </td>
                          <td
                            className={`py-2 pr-2 text-right font-semibold ${it.variation_pct > 10 ? "text-[#333333]" : it.variation_pct > 0 ? "text-[#333333]" : "text-[#333333]"}`}
                          >
                            {it.variation_pct == null
                              ? "—"
                              : `${it.variation_pct > 0 ? "+" : ""}${it.variation_pct}%`}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "Approval History" && (
          <div className="bg-white border border-[#B5C4B6] rounded-xl p-5">
            {(q.approval_history || []).length === 0 ? (
              <div className="text-[#B5C4B6] text-center py-6">
                No approval events yet.
              </div>
            ) : (
              <ol className="space-y-3">
                {(q.approval_history || []).map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#1F453B] mt-1.5" />
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-[#333333]">
                        {a.action.replace(/_/g, " ")}
                      </div>
                      <div className="text-[12px] text-[#6B7B7C]">
                        {a.actor} · {relativeTime(a.at)}
                      </div>
                      {a.meta?.remarks && (
                        <div className="text-[12px] text-[#6B7B7C] mt-1">
                          "{a.meta.remarks}"
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {tab === "Versions" && <VersionsTab id={id} />}
        {tab === "Attachments" && (
          <div className="bg-white border border-[#B5C4B6] rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <div className="text-[13px] font-semibold">
                Attachments ({q.attachments?.length || 0})
              </div>
              <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12px] font-semibold inline-flex items-center gap-1">
                <Upload size={12} /> Upload
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && uploadAtt(e.target.files[0])
                  }
                  data-testid="att-upload"
                />
              </label>
            </div>
            <div className="space-y-2">
              {(q.attachments || []).map((a) => (
                <div
                  key={a.id}
                  className="flex justify-between items-center border border-[#B5C4B6] rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-[#333333]" />
                    <div>
                      <div className="text-[13px] font-semibold text-[#333333]">
                        {a.filename}
                      </div>
                      <div className="text-[11px] text-[#B5C4B6]">
                        {a.uploaded_by} · {relativeTime(a.uploaded_at)} ·{" "}
                        {(a.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(q.attachments || []).length === 0 && (
                <div className="text-center py-6 text-[#B5C4B6]">
                  No attachments.
                </div>
              )}
            </div>
          </div>
        )}
        {tab === "Activity" && (
          <div className="bg-white border border-[#B5C4B6] rounded-xl p-5">
            <ol className="space-y-2">
              {(q.activity || []).map((a) => (
                <li
                  key={a.id}
                  className="text-[13px] flex justify-between border-b border-[#EAEEF0] py-2"
                >
                  <div>
                    <span className="font-semibold text-[#333333]">
                      {a.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-[#6B7B7C]"> · {a.actor}</span>
                  </div>
                  <span className="text-[12px] text-[#B5C4B6]">
                    {relativeTime(a.at)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {tab === "Notes" && (
          <div className="bg-white border border-[#B5C4B6] rounded-xl p-5 text-[13px] text-[#6B7B7C]">
            Internal notes will be shared privately across your team. (Coming
            soon)
          </div>
        )}
      </div>

      {/* Approval & Signature block (Phase G) */}
      <div
        className="mt-6 bg-white border border-[#DDD8CE] rounded-2xl p-5"
        data-testid="detail-approval-block"
      >
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] font-semibold mb-3">
          Approval &amp; Signature
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-[12px] font-semibold text-[#333333] mb-2">
              Approved By
            </div>
            <div
              className="border border-[#DDD8CE] rounded-lg p-4 min-h-[120px] bg-[#FAF8F5]"
              data-testid="detail-approved-by"
            >
              {q.status === "approved" ? (
                <>
                  {q.approved_by_signature_url ? (
                    <img
                      alt="signature"
                      src={q.approved_by_signature_url}
                      className="max-h-14 mb-2"
                    />
                  ) : (
                    <div className="text-[11.5px] text-[#B5C4B6] italic mb-2">
                      No signature on file for the approver.
                    </div>
                  )}
                  <div className="text-[13px] font-semibold text-[#333333]">
                    {q.approved_by_name || q.approved_by || "—"}
                  </div>
                  <div className="text-[11.5px] text-[#6B7B7C]">
                    {(q.approved_at || "").slice(0, 10)}
                  </div>
                </>
              ) : (
                <div className="text-[13px] text-[#B5C4B6] italic">
                  Awaiting approval — will populate once an admin approves this
                  estimate.
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="text-[12px] font-semibold text-[#333333] mb-2">
              Contractor&apos;s Sign
            </div>
            <div className="border border-[#DDD8CE] rounded-lg p-4 min-h-[120px] bg-[#FAF8F5] flex items-end">
              <div className="text-[11.5px] text-[#B5C4B6]">
                Signature block for print
              </div>
            </div>
          </div>
        </div>
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
                onClick={() => doAction(remarkModal.action, remark)}
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

function VersionsTab({ id }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get(`/quotations/${id}/versions`).then((r) => setRows(r.data));
  }, [id]);
  return (
    <div className="bg-white border border-[#B5C4B6] rounded-xl p-5">
      {rows.length === 0 ? (
        <div className="text-[#B5C4B6] text-center py-6">No versions yet.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Link
              key={r.id}
              to={`/quotations/${r.id}`}
              className="flex justify-between items-center border border-[#B5C4B6] rounded-lg p-3 hover:border-[#1F453B]"
            >
              <div>
                <div className="text-[13px] font-semibold text-[#333333]">
                  V{r.version} · {r.quotation_number}
                </div>
                <div className="text-[12px] text-[#6B7B7C]">
                  {r.status} · {relativeTime(r.updated_at)}
                </div>
              </div>
              <div className="text-[14px] font-bold text-[#333333]">
                {fmtINR(r.subtotals?.total || 0)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
