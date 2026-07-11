import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { fmtINR, relativeTime, StatusChip } from "@/lib/format";
import {
  Plus,
  Upload,
  Send,
  FileText,
  GitCompare,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  X,
  Filter,
  Search,
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

function SummaryCard({ label, value, tone = "muted", onClick }) {
  const tones = {
    muted: "text-[#333333]",
    deep: "text-[#333333]",
    green: "text-[#333333]",
    red: "text-[#333333]",
    blue: "text-[#333333]",
  };
  return (
    <button
      onClick={onClick}
      data-testid={`summary-card-${label.replace(/\s+/g, "-").toLowerCase()}`}
      className="text-left bg-white border border-[#B5C4B6] rounded-xl p-4 hover:border-[#B5C4B6] hover:shadow-sm transition-all"
    >
      <div className="text-[11px] uppercase tracking-wider text-[#B5C4B6] mb-1">
        {label}
      </div>
      <div className={`text-[36px] font-bold leading-none ${tones[tone]}`}>
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
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}
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

export default function QuotationsDashboard() {
  const nav = useNavigate();
  const [summary, setSummary] = useState(null);
  const [awaiting, setAwaiting] = useState(null);
  const [comparisons, setComparisons] = useState([]);
  const [cont, setCont] = useState([]);
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  const load = async () => {
    try {
      const [s, a, c, cw] = await Promise.all([
        api.get("/quotations/summary"),
        api.get("/quotations/awaiting-action"),
        api.get("/quotations/recent-comparisons"),
        api.get("/quotations/continue-working"),
      ]);
      setSummary(s.data);
      setAwaiting(a.data);
      setComparisons(c.data);
      setCont(cw.data);
    } catch (e) {
      toast.error("Failed to load dashboard");
    }
    reloadList("all", "");
  };

  const reloadList = async (currTab, currQ) => {
    setLoading(true);
    try {
      const params = {};
      if (currTab !== "all") params.status = currTab;
      if (currQ) params.q = currQ;
      const { data } = await api.get("/quotations", { params });
      setRows(data);
    } catch {
      toast.error("Failed to load quotations");
    }
    setLoading(false);
  };

  useEffect(() => {
    reloadList(tab, q);
  }, [tab]); // eslint-disable-line

  const onSearch = (e) => {
    e.preventDefault();
    reloadList(tab, q);
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
            className="px-4 py-2 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold hover:bg-[#1F453B] inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Create Estimate
          </button>
        </div>
      </div>

      {/* Summary strip */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <SummaryCard
            label="Total"
            value={summary.total}
            onClick={() => setTab("all")}
          />
          <SummaryCard
            label="Drafts"
            value={summary.drafts}
            tone="muted"
            onClick={() => setTab("draft")}
          />
          <SummaryCard
            label="Requested"
            value={summary.requested}
            tone="blue"
            onClick={() => setTab("requested")}
          />
          <SummaryCard
            label="Received"
            value={summary.received}
            tone="green"
            onClick={() => setTab("received")}
          />
          <SummaryCard
            label="Under Review"
            value={summary.under_review}
            tone="deep"
            onClick={() => setTab("under_review")}
          />
          <SummaryCard
            label="Awaiting Approval"
            value={summary.awaiting_approval}
            tone="deep"
            onClick={() => setTab("awaiting_approval")}
          />
          <SummaryCard
            label="Approved"
            value={summary.approved}
            tone="green"
            onClick={() => setTab("approved")}
          />
          <SummaryCard
            label="Expiring Soon"
            value={summary.expiring_soon}
            tone="red"
          />
        </div>
      )}

      {/* Continue Working removed per Phase G */}

      {/* Awaiting Action */}
      {awaiting && (
        <div className="bg-white border border-[#B5C4B6] rounded-xl p-5">
          <h2 className="text-[15px] font-bold text-[#333333] mb-3">
            Awaiting Action
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <ActionCard
              icon={Clock}
              label="Needs Review"
              count={awaiting.needs_review}
              tone={{ bg: "#EAEEF0", fg: "#1F453B" }}
              onClick={() => setTab("under_review")}
            />
            <ActionCard
              icon={AlertTriangle}
              label="Returned"
              count={awaiting.returned}
              tone={{ bg: "#EAEEF0", fg: "#1F453B" }}
              onClick={() => setTab("returned")}
            />
            <ActionCard
              icon={Clock}
              label="Expiring Soon"
              count={awaiting.expiring}
              tone={{ bg: "#EAEEF0", fg: "#1F453B" }}
            />
            <ActionCard
              icon={Send}
              label="Missing Response"
              count={awaiting.missing_response}
              tone={{ bg: "#EAEEF0", fg: "#1F453B" }}
              onClick={() => setTab("requested")}
            />
            <ActionCard
              icon={CheckCircle2}
              label="Pending Approval"
              count={awaiting.pending_approval}
              tone={{ bg: "#EAEEF0", fg: "#1F453B" }}
              onClick={() => setTab("awaiting_approval")}
            />
          </div>
        </div>
      )}

      {/* Tabs + Quick List */}
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
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B5C4B6]"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search quotations…"
                data-testid="quotation-search"
                className="w-full pl-9 pr-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
              />
            </div>
            <button className="px-3 py-2 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold">
              Search
            </button>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="text-[11px] uppercase tracking-wider text-[#B5C4B6]">
                <tr className="border-b border-[#B5C4B6]">
                  <th className="text-left py-2 pr-3">Estimate #</th>
                  <th className="text-left py-2 pr-3">Title</th>
                  <th className="text-left py-2 pr-3">Vendor</th>
                  <th className="text-left py-2 pr-3">Project</th>
                  <th className="text-left py-2 pr-3">Category</th>
                  <th className="text-right py-2 pr-3">Amount</th>
                  <th className="text-right py-2 pr-3">BOQ Δ</th>
                  <th className="text-left py-2 pr-3">Status</th>
                  <th className="text-left py-2 pr-3">Valid Until</th>
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
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => nav(`/quotations/${r.id}`)}
                    data-testid={`quotation-row-${r.id}`}
                    className="border-b border-[#EAEEF0] cursor-pointer hover:bg-[#EAEEF0]"
                  >
                    <td className="py-2.5 pr-3 font-semibold text-[#333333]">
                      {r.quotation_number}
                    </td>
                    <td className="py-2.5 pr-3 text-[#333333]">{r.title}</td>
                    <td className="py-2.5 pr-3 text-[#6B7B7C]">
                      {r.vendor_name || "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-[#6B7B7C]">
                      {r.project_name || "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-[#6B7B7C]">
                      {r.work_category}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-semibold text-[#333333]">
                      {fmtINR(r.subtotals?.total || 0)}
                    </td>
                    <td
                      className={`py-2.5 pr-3 text-right font-semibold ${r.boq_variation_pct == null ? "text-[#B5C4B6]" : r.boq_variation_pct > 10 ? "text-[#333333]" : r.boq_variation_pct > 0 ? "text-[#333333]" : "text-[#333333]"}`}
                    >
                      {r.boq_variation_pct == null
                        ? "—"
                        : `${r.boq_variation_pct > 0 ? "+" : ""}${r.boq_variation_pct}%`}
                    </td>
                    <td className="py-2.5 pr-3">
                      <StatusChip status={r.status} />
                    </td>
                    <td className="py-2.5 pr-3 text-[#6B7B7C]">
                      {r.valid_until || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Comparisons */}
      {comparisons.length > 0 && (
        <div className="bg-white border border-[#B5C4B6] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-[#333333] inline-flex items-center gap-2">
              <GitCompare size={16} /> Recent Comparisons
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {comparisons.map((c) => (
              <button
                key={c.id}
                onClick={() =>
                  nav(`/quotations/compare?ids=${c.quotation_ids.join(",")}`)
                }
                data-testid={`comparison-${c.id}`}
                className="text-left border border-[#B5C4B6] hover:border-[#1F453B] rounded-lg p-3"
              >
                <div className="text-[13px] font-semibold text-[#333333] line-clamp-1">
                  {c.name}
                </div>
                <div className="text-[12px] text-[#6B7B7C] mt-1">
                  {c.project_name || "—"} · {c.work_category}
                </div>
                <div className="text-[11.5px] text-[#B5C4B6] mt-1.5">
                  {c.vendor_count} quotations · {relativeTime(c.saved_at)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
