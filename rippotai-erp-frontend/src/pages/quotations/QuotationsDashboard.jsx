import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { fmtINR, relativeTime, StatusChip } from "@/lib/format";
import { useGetQuotationsQuery } from "../../api/quotation.api";
import {
  useSoftDeleteQuotationMutation,
  useRestoreQuotationMutation,
  useDeleteQuotationPermanentMutation,
} from "../../api/quotation.api";
import {
  Plus,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  MoreHorizontal,
  Edit,
  Archive,
  Trash2,
  RotateCcw,
} from "lucide-react";

const TABS = [
  { k: "all", l: "All" },
  { k: "draft", l: "Draft" },
  { k: "requested", l: "Requested" },
  { k: "received", l: "Received" },
  { k: "under_review", l: "Under Review" },
  { k: "awaiting_approval", l: "Awaiting Approval" },
  { k: "returned", l: "Returned" },
  { k: "approved", l: "Approved" },
  { k: "rejected", l: "Rejected" },
  { k: "selected", l: "Selected" },
  { k: "not_selected", l: "Not Selected" },
  { k: "expired", l: "Expired" },
  { k: "archived", l: "Archived" },
];

function SummaryCard({ label, value, onClick }) {
  return (
    <button
      onClick={onClick}
      data-testid={`summary-card-${label.replace(/\s+/g, "-").toLowerCase()}`}
      className="text-left bg-white border border-[#B5C4B6] rounded-xl p-4 hover:border-[#B5C4B6] hover:shadow-sm transition-all"
    >
      <div className="text-[11px] uppercase tracking-wider text-[#B5C4B6] mb-1">
        {label}
      </div>
      <div className="text-[36px] font-bold leading-none text-[#333333]">
        {value}
      </div>
    </button>
  );
}

function ActionCard({ icon: Icon, label, count, tone, onClick }) {
  return (
    <button
      onClick={onClick}
      data-testid={`action-${label.replace(/\s+/g, "-").toLowerCase()}`}
      className="text-left bg-white border border-[#B5C4B6] rounded-xl p-4 hover:border-[#1F453B] hover:shadow-sm transition-all flex items-start gap-3"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: tone.bg, color: tone.fg }}
      >
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold text-[#333333]">
          {label}
        </div>
        <div className="text-[36px] font-bold text-[#333333] mt-0.5">
          {count}
        </div>
      </div>
    </button>
  );
}

function isExpiringSoon(q) {
  if (!q?.validUntil) return false;
  const diffDays = (new Date(q.validUntil).getTime() - Date.now()) / 86400000;
  return diffDays >= 0 && diffDays <= 7;
}

export default function QuotationsDashboard() {
  const nav = useNavigate();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const queryArgs = useMemo(
    () => ({ status: tab !== "all" ? tab : undefined }),
    [tab]
  );

  const {
    data: quotations = [],
    isLoading,
    isFetching,
    isError,
  } = useGetQuotationsQuery(queryArgs);

  const [softDeleteQuotation] = useSoftDeleteQuotationMutation();
  const [restoreQuotation] = useRestoreQuotationMutation();
  const [deleteQuotationPermanent] = useDeleteQuotationPermanentMutation();

  useEffect(() => {
    if (isError) toast.error("Failed to load quotations");
  }, [isError]);

  const rows = useMemo(() => {
    if (!searchTerm) return quotations;
    const s = searchTerm.toLowerCase();
    return quotations.filter((r) => {
      return (
        r.quotationNumber?.toLowerCase().includes(s) ||
        r.vendorSnapshot?.name?.toLowerCase().includes(s) ||
        r.vendorSnapshot?.company_name?.toLowerCase().includes(s) ||
        r.projectSnapshot?.name?.toLowerCase().includes(s)
      );
    });
  }, [quotations, searchTerm]);

  const summary = useMemo(() => {
    const counts = {
      total: quotations.length,
      drafts: 0,
      requested: 0,
      received: 0,
      under_review: 0,
      awaiting_approval: 0,
      approved: 0,
      expiring_soon: 0,
    };
    quotations.forEach((r) => {
      switch (r.status) {
        case "draft":
          counts.drafts++;
          break;
        case "requested":
          counts.requested++;
          break;
        case "received":
          counts.received++;
          break;
        case "under_review":
          counts.under_review++;
          break;
        case "awaiting_approval":
          counts.awaiting_approval++;
          break;
        case "approved":
          counts.approved++;
          break;
        default:
          break;
      }
      if (isExpiringSoon(r)) counts.expiring_soon++;
    });
    return counts;
  }, [quotations]);

  const awaiting = useMemo(
    () => ({
      needs_review: quotations.filter((r) => r.status === "under_review").length,
      returned: quotations.filter((r) => r.status === "returned").length,
      expiring: summary.expiring_soon,
      missing_response: quotations.filter((r) => r.status === "requested").length,
      pending_approval: quotations.filter((r) => r.status === "awaiting_approval").length,
    }),
    [quotations, summary.expiring_soon]
  );

  const onSearch = (e) => {
    e.preventDefault();
    setSearchTerm(q);
  };

  const loading = isLoading || isFetching;

  // Action Handlers
  const handleSoftDelete = async (id, number) => {
    if (!window.confirm(`Move quotation ${number} to trash?`)) return;
    try {
      await softDeleteQuotation({ id, deleted_by: "current_user" }).unwrap();
      toast.success(`Quotation ${number} moved to trash`);
    } catch (err) {
      toast.error("Failed to delete quotation");
    }
  };

  const handleRestore = async (id, number) => {
    if (!window.confirm(`Restore quotation ${number}?`)) return;
    try {
      await restoreQuotation(id).unwrap();
      toast.success(`Quotation ${number} restored`);
    } catch (err) {
      toast.error("Failed to restore quotation");
    }
  };

  const handlePermanentDelete = async (id, number) => {
    if (!window.confirm(`PERMANENTLY DELETE quotation ${number}?\n\nThis cannot be undone.`)) return;
    try {
      await deleteQuotationPermanent(id).unwrap();
      toast.success(`Quotation ${number} permanently deleted`);
    } catch (err) {
      toast.error("Failed to permanently delete quotation");
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[34px] font-bold text-[#333333] tracking-tight">
            Quotations
          </h1>
          <p className="text-[13.5px] text-[#6B7B7C] mt-1 max-w-[600px]">
            Create, upload, compare and approve project quotations in one
            structured workspace.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => nav("/quotations/new")}
            data-testid="btn-create-quotation"
            className="px-4 py-2 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Create Estimate
          </button>
        </div>
      </div>


      {/* Summary strip - unchanged */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <SummaryCard label="Total" value={summary.total} onClick={() => setTab("all")} />
        <SummaryCard label="Drafts" value={summary.drafts} onClick={() => setTab("draft")} />
        <SummaryCard label="Requested" value={summary.requested} onClick={() => setTab("requested")} />
        <SummaryCard label="Received" value={summary.received} onClick={() => setTab("received")} />
        <SummaryCard label="Under Review" value={summary.under_review} onClick={() => setTab("under_review")} />
        <SummaryCard label="Awaiting Approval" value={summary.awaiting_approval} onClick={() => setTab("awaiting_approval")} />
        <SummaryCard label="Approved" value={summary.approved} onClick={() => setTab("approved")} />
        <SummaryCard label="Expiring Soon" value={summary.expiring_soon} />
      </div>

      {/* Awaiting Action - unchanged */}
      <div className="bg-white border border-[#B5C4B6] rounded-xl p-5">
        <h2 className="text-[15px] font-bold text-[#333333] mb-3">Awaiting Action</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <ActionCard icon={Clock} label="Needs Review" count={awaiting.needs_review} tone={{ bg: "#EAEEF0", fg: "#1F453B" }} onClick={() => setTab("under_review")} />
          <ActionCard icon={AlertTriangle} label="Returned" count={awaiting.returned} tone={{ bg: "#EAEEF0", fg: "#1F453B" }} onClick={() => setTab("returned")} />
          <ActionCard icon={Clock} label="Expiring Soon" count={awaiting.expiring} tone={{ bg: "#EAEEF0", fg: "#1F453B" }} />
          <ActionCard icon={Send} label="Missing Response" count={awaiting.missing_response} tone={{ bg: "#EAEEF0", fg: "#1F453B" }} onClick={() => setTab("requested")} />
          <ActionCard icon={CheckCircle2} label="Pending Approval" count={awaiting.pending_approval} tone={{ bg: "#EAEEF0", fg: "#1F453B" }} onClick={() => setTab("awaiting_approval")} />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#B5C4B6] rounded-xl">
        <div className="border-b border-[#B5C4B6] overflow-x-auto">
          <div className="flex gap-1 p-2 min-w-max">
            {TABS.map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                data-testid={`tab-${t.k}`}
                className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold whitespace-nowrap ${tab === t.k ? "bg-[#EAEEF0] text-[#333333]" : "text-[#6B7B7C] hover:bg-[#EAEEF0]"}`}
              >
                {t.l}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          <form onSubmit={onSearch} className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B5C4B6]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search quotations…"
                data-testid="quotation-search"
                className="w-full pl-9 pr-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
              />
            </div>
            <button type="submit" className="px-3 py-2 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold">
              Search
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="text-[11px] uppercase tracking-wider text-[#B5C4B6]">
                <tr className="border-b border-[#B5C4B6]">
                  <th className="text-left py-2 pr-3">Estimate #</th>
                  <th className="text-left py-2 pr-3">Vendor</th>
                  <th className="text-left py-2 pr-3">Project</th>
                  <th className="text-left py-2 pr-3">Category</th>
                  <th className="text-right py-2 pr-3">Amount</th>
                  <th className="text-left py-2 pr-3">Status</th>
                  <th className="text-left py-2 pr-3">Quotation Date</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-[#B5C4B6]">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#B5C4B6]">
                      No quotations match this filter.
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-[#EAEEF0] hover:bg-[#EAEEF0] group"
                    >
                      <td
                        className="py-2.5 pr-3 font-semibold text-[#333333] cursor-pointer"
                        onClick={() => nav(`/quotations/${r.id}`)}
                      >
                        {r.quotationNumber}
                      </td>
                      <td
                        className="py-2.5 pr-3 text-[#6B7B7C] cursor-pointer"
                        onClick={() => nav(`/quotations/${r.id}`)}
                      >
                        {r.vendorSnapshot?.name || r.vendorSnapshot?.company_name || "—"}
                      </td>
                      <td
                        className="py-2.5 pr-3 text-[#6B7B7C] cursor-pointer"
                        onClick={() => nav(`/quotations/${r.id}`)}
                      >
                        {r.projectSnapshot?.name || "—"}
                      </td>
                      <td
                        className="py-2.5 pr-3 text-[#6B7B7C] cursor-pointer"
                        onClick={() => nav(`/quotations/${r.id}`)}
                      >
                        {r.vendorSnapshot?.businessType?.name || r.vendorSnapshot?.vendorCategory?.name || "—"}
                      </td>
                      <td
                        className="py-2.5 pr-3 text-right font-semibold text-[#333333] cursor-pointer"
                        onClick={() => nav(`/quotations/${r.id}`)}
                      >
                        {fmtINR(Number(r.totalAmount || 0))}
                      </td>
                      <td
                        className="py-2.5 pr-3 cursor-pointer"
                        onClick={() => nav(`/quotations/${r.id}`)}
                      >
                        <StatusChip status={r.status} />
                      </td>
                      <td
                        className="py-2.5 pr-3 text-[#6B7B7C] cursor-pointer"
                        onClick={() => nav(`/quotations/${r.id}`)}
                      >
                        {r.quotationDate ? r.quotationDate : r.submittedAt ? relativeTime(r.submittedAt) : "—"}
                      </td>

                      {/* ACTIONS COLUMN */}
                      <td className="py-2.5">
                        <div className="relative">
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg hover:bg-[#EAEEF0] text-[#6B7B7C] hover:text-[#333333] opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {/* Dropdown */}
                          <div className="absolute right-0 top-10 w-48 bg-white border border-[#B5C4B6] rounded-xl shadow-xl py-1 z-20 hidden group-hover:block">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                nav(`/quotations/${r.id}`);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-[#EAEEF0] flex items-center gap-2 text-[13px]"
                            >
                              <Edit size={16} /> View / Edit
                            </button>

                            {r.status !== "archived" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSoftDelete(r.id, r.quotationNumber);
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-[#EAEEF0] flex items-center gap-2 text-[13px] text-amber-700"
                              >
                                <Archive size={16} /> Archive / Trash
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestore(r.id, r.quotationNumber);
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-[#EAEEF0] flex items-center gap-2 text-[13px] text-emerald-700"
                              >
                                <RotateCcw size={16} /> Restore
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePermanentDelete(r.id, r.quotationNumber);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-[#EAEEF0] flex items-center gap-2 text-[13px] text-red-600"
                            >
                              <Trash2 size={16} /> Permanent Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}