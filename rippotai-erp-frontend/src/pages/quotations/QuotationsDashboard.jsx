import { appConfirm } from "@/lib/app-dialog";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { fmtINR, relativeTime, StatusChip } from "@/lib/format";
import { Button, PageHeader, StatTile, Stats } from "@/components/inos";
import { useGetQuotationsQuery } from "../../api/procuerment/quotation.api";
import {
  useSoftDeleteQuotationMutation,
  useRestoreQuotationMutation,
  useDeleteQuotationPermanentMutation,
} from "../../api/procuerment/quotation.api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Archive,
  Trash2,
  RotateCcw,
  Scale,
} from "lucide-react";

const TABS = [
  { k: "all", l: "All" },
  { k: "draft", l: "Draft" },
  { k: "awaiting_approval", l: "Awaiting Approval" },
  { k: "returned_for_editing", l: "Returned" },
  { k: "approved", l: "Approved" },
  { k: "cancelled", l: "Cancelled" },
];

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
  const [selectedIds, setSelectedIds] = useState(new Set());

  const queryArgs = useMemo(
    () => ({ status: tab !== "all" ? tab : undefined }),
    [tab],
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

  // Reset selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [tab, searchTerm]);

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
      needs_review: quotations.filter((r) => r.status === "under_review")
        .length,
      returned: quotations.filter((r) => r.status === "returned").length,
      expiring: summary.expiring_soon,
      missing_response: quotations.filter((r) => r.status === "requested")
        .length,
      pending_approval: quotations.filter(
        (r) => r.status === "awaiting_approval",
      ).length,
    }),
    [quotations, summary.expiring_soon],
  );

  const onSearch = (e) => {
    e.preventDefault();
    setSearchTerm(q);
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === rows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    }
  };

  const handleCompare = () => {
    if (selectedIds.size < 2) {
      toast.error("Select at least 2 quotations to compare");
      return;
    }
    const idsParam = Array.from(selectedIds).join(",");
    nav(`/procurement/estimates/compare?ids=${idsParam}`);
  };

  const loading = isLoading || isFetching;

  const handleSoftDelete = async (id, number) => {
    if (!(await appConfirm(`Move quotation ${number} to trash?`))) return;
    try {
      await softDeleteQuotation({ id, deleted_by: "current_user" }).unwrap();
      toast.success(`Quotation ${number} moved to trash`);
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (err) {
      toast.error("Failed to delete quotation");
    }
  };

  const handleRestore = async (id, number) => {
    if (!(await appConfirm(`Restore quotation ${number}?`))) return;
    try {
      await restoreQuotation(id).unwrap();
      toast.success(`Quotation ${number} restored`);
    } catch (err) {
      toast.error("Failed to restore quotation");
    }
  };

  const handlePermanentDelete = async (id, number) => {
    if (
      !(await appConfirm(
        `PERMANENTLY DELETE quotation ${number}?\n\nThis cannot be undone.`,
      ))
    )
      return;
    try {
      await deleteQuotationPermanent(id).unwrap();
      toast.success(`Quotation ${number} permanently deleted`);
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (err) {
      toast.error("Failed to permanently delete quotation");
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 py-6 md:px-6 space-y-6">
      <PageHeader
        title="Quotations"
        subtitle="Create, upload, compare and approve project quotations."
        actions={
          <>
            {selectedIds.size > 0 && (
              <Button icon={Scale} onClick={handleCompare}>
                Compare ({selectedIds.size})
              </Button>
            )}
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => nav("/procurement/estimates/new")}
              data-testid="btn-create-quotation"
            >
              Create Estimate
            </Button>
          </>
        }
      />

      {/* Summary — the four states people act on; the rest live in tabs */}
      <Stats>
        {[
          ["Total", summary.total, "all"],
          ["Drafts", summary.drafts, "draft"],
          ["Awaiting approval", summary.awaiting_approval, "awaiting_approval"],
          ["Approved", summary.approved, "approved"],
        ].map(([label, value, k]) => (
          <StatTile
            key={k}
            label={label}
            value={value}
            active={tab === k}
            onClick={() => setTab(k)}
          />
        ))}
      </Stats>

      {/* Needs attention — only the non-zero items, as one quiet row */}
      {(() => {
        const items = [
          ["Needs review", awaiting.needs_review, Clock, "under_review"],
          ["Returned", awaiting.returned, AlertTriangle, "returned"],
          ["Expiring soon", awaiting.expiring, Clock, null],
          ["Missing response", awaiting.missing_response, Send, "requested"],
          ["Received", summary.received, CheckCircle2, "received"],
        ].filter(([, n]) => Number(n) > 0);
        if (!items.length) return null;
        return (
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="quotations-attention"
          >
            <span className="text-[12.5px] font-semibold text-[var(--text-3)] mr-1">
              Needs attention
            </span>
            {items.map(([label, n, Icon, k]) => (
              <Button
                key={label}
                size="sm"
                variant="secondary"
                icon={Icon}
                onClick={k ? () => setTab(k) : undefined}
              >
                {label} · {n}
              </Button>
            ))}
          </div>
        );
      })()}

      {/* Main Table */}
      <div className="bg-white border border-[var(--line)] rounded-xl">
        <div className="border-b border-[var(--line)] overflow-x-auto">
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
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B5C4B6]"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search quotations…"
                data-testid="quotation-search"
                className="w-full pl-9 pr-3 py-2 border border-[var(--line)] rounded-lg text-[13px] bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold"
            >
              Search
            </button>
          </form>

          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between bg-[#EAEEF0] border border-[var(--line)] rounded-lg px-4 py-2 mb-3 text-[13px]">
              <div className="font-medium">
                {selectedIds.size} quotation{selectedIds.size > 1 ? "s" : ""}{" "}
                selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-[#6B7B7C] hover:text-[#333333] underline text-sm"
                >
                  Clear
                </button>
                <button
                  onClick={handleCompare}
                  className="bg-[#1F453B] text-white px-4 py-1 rounded-lg font-semibold text-sm flex items-center gap-1"
                >
                  <Scale size={14} /> Compare Selected
                </button>
              </div>
            </div>
          )}

          {/* table-fixed + colgroup so columns use available width
              consistently instead of shrinking to content */}
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-[12.5px]">
              <colgroup>
                <col className="w-8" /> {/* checkbox */}
                <col className="w-[14%]" /> {/* Estimate # */}
                <col className="w-[16%]" /> {/* Vendor */}
                <col className="w-[16%]" /> {/* Project */}
                <col className="w-[14%]" /> {/* Category */}
                <col className="w-[12%]" /> {/* Amount */}
                <col className="w-[12%]" /> {/* Status */}
                <col className="w-auto" /> {/* Quotation Date — flexible */}
                <col className="w-10" /> {/* Actions */}
              </colgroup>
              <thead className="text-[11px] uppercase tracking-wider text-[#B5C4B6]">
                <tr className="border-b border-[var(--line)]">
                  <th className="w-8 py-2">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === rows.length && rows.length > 0
                      }
                      onChange={selectAll}
                      className="w-4 h-4 accent-[#1F453B]"
                    />
                  </th>
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
                    <td colSpan={9} className="py-6 text-center text-[#B5C4B6]">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#B5C4B6]">
                      No quotations match this filter.
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((r) => {
                    const isSelected = selectedIds.has(r.id);
                    return (
                      <tr
                        key={r.id}
                        className={`border-b border-[#EAEEF0] hover:bg-[#EAEEF0] group ${isSelected ? "bg-[#F0F4F2]" : ""}`}
                      >
                        <td className="py-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(r.id)}
                            className="w-4 h-4 accent-[#1F453B]"
                          />
                        </td>
                        <td
                          className="py-2.5 pr-3 font-semibold text-[#333333] cursor-pointer truncate"
                          onClick={() => nav(`/procurement/estimates/${r.id}`)}
                        >
                          {r.quotationNumber}
                        </td>
                        <td
                          className="py-2.5 pr-3 text-[#6B7B7C] cursor-pointer truncate"
                          onClick={() => nav(`/procurement/estimates/${r.id}`)}
                        >
                          {r.vendorSnapshot?.name ||
                            r.vendorSnapshot?.company_name ||
                            "—"}
                        </td>
                        <td
                          className="py-2.5 pr-3 text-[#6B7B7C] cursor-pointer truncate"
                          onClick={() => nav(`/procurement/estimates/${r.id}`)}
                        >
                          {r.projectSnapshot?.name || "—"}
                        </td>
                        <td
                          className="py-2.5 pr-3 text-[#6B7B7C] cursor-pointer truncate"
                          onClick={() => nav(`/procurement/estimates/${r.id}`)}
                        >
                          {r.vendorSnapshot?.businessType?.name ||
                            r.vendorSnapshot?.vendorCategory?.name ||
                            "—"}
                        </td>
                        <td
                          className="py-2.5 pr-3 text-right font-semibold text-[#333333] cursor-pointer"
                          onClick={() => nav(`/procurement/estimates/${r.id}`)}
                        >
                          {fmtINR(Number(r.totalAmount || 0))}
                        </td>
                        <td
                          className="py-2.5 pr-3 cursor-pointer"
                          onClick={() => nav(`/procurement/estimates/${r.id}`)}
                        >
                          <StatusChip status={r.status} />
                        </td>
                        <td
                          className="py-2.5 pr-3 text-[#6B7B7C] cursor-pointer truncate"
                          onClick={() => nav(`/procurement/estimates/${r.id}`)}
                        >
                          {r.quotationDate
                            ? r.quotationDate
                            : r.submittedAt
                              ? relativeTime(r.submittedAt)
                              : "—"}
                        </td>

                        {/* Actions Column — same fix as ProjectsDashboard:
                            Radix DropdownMenu instead of a hover-only,
                            hardcoded `absolute top-10` div. Portaled to
                            document.body so it can't be clipped by the
                            table's overflow-x-auto container and won't
                            force a vertical scrollbar on bottom rows. */}
                        <td className="py-2.5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 rounded-lg hover:bg-[#EAEEF0] text-[#6B7B7C] hover:text-[#333333] opacity-0 group-hover:opacity-100 transition-all"
                                data-testid={`quotation-actions-${r.id}`}
                              >
                                <MoreHorizontal size={18} />
                              </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-48">
                              {/* View and Edit are now separate routes:
                                  view stays on the detail page, edit
                                  goes to /quotations/:id/edit */}
                              <DropdownMenuItem
                                onSelect={() =>
                                  nav(`/procurement/estimates/${r.id}`)
                                }
                              >
                                <Eye size={16} className="mr-2" /> View
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onSelect={() =>
                                  nav(`/procurement/estimates/${r.id}/edit`)
                                }
                              >
                                <Edit size={16} className="mr-2" /> Edit
                              </DropdownMenuItem>

                              {r.status !== "archived" ? (
                                <DropdownMenuItem
                                  onSelect={() =>
                                    handleSoftDelete(r.id, r.quotationNumber)
                                  }
                                  className="text-amber-700"
                                >
                                  <Archive size={16} className="mr-2" /> Archive
                                  / Trash
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onSelect={() =>
                                    handleRestore(r.id, r.quotationNumber)
                                  }
                                  className="text-emerald-700"
                                >
                                  <RotateCcw size={16} className="mr-2" />{" "}
                                  Restore
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onSelect={() =>
                                  handlePermanentDelete(r.id, r.quotationNumber)
                                }
                                className="text-red-600"
                              >
                                <Trash2 size={16} className="mr-2" /> Permanent
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
