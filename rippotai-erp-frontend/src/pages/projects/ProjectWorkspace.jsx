import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  DollarSign,
  FileText,
  ListChecks,
  RefreshCw,
  Share2,
  ShieldAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { fmtINR, relativeTime } from "@/lib/format";

import { useGetProjectByIdQuery } from "../../api/projects/project.api";
import { useGetBoqsQuery } from "../../api/boq/boq.api";
import { useGetQuotationsQuery } from "../../api/procuerment/quotation.api";
import {
  useGetDocumentsQuery,
  useUpdateDocumentMutation,
} from "../../api/documents/document.api";

const BRAND = {
  ink: "#19352d",
  green: "#2f6655",
  greenSoft: "#eef4f0",
  line: "#e4e8e5",
  lineSoft: "#edf0ee",
  surface: "#f5f7f5",
};

const WORK_BUCKETS = [
  ["delayed", "Delayed"],
  ["due_today", "Due today"],
  ["due_this_week", "Due this week"],
  ["awaiting_approval", "Awaiting approval"],
  ["awaiting_client", "Awaiting client"],
  ["blocked", "Blocked"],
  ["upcoming", "Upcoming"],
];

const cn = (...classes) => classes.filter(Boolean).join(" ");

function getStatusMeta(status) {
  const key = String(status || "").toLowerCase();
  if (["delayed", "at_risk", "blocked"].includes(key)) {
    return {
      label: key.replace(/_/g, " "),
      className: "bg-red-50 text-red-700 border-red-200",
      dot: "bg-red-500",
    };
  }
  if (["completed", "complete", "done"].includes(key)) {
    return {
      label: key.replace(/_/g, " "),
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    };
  }
  if (["on_hold", "hold"].includes(key)) {
    return {
      label: key.replace(/_/g, " "),
      className: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    };
  }
  return {
    label: key.replace(/_/g, " ") || "on track",
    className: "bg-[#eef4f0] text-[#2f6655] border-[#c9d7cf]",
    dot: "bg-[#2f6655]",
  };
}

function StatusBadge({ status }) {
  const meta = getStatusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize",
        meta.className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

function SectionHeader({ eyebrow, title, description, action, onAction }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {eyebrow}
          </div>
        ) : null}
        <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#19352d]">
          {title}
        </div>
        {description ? (
          <div className="mt-0.5 text-[10px] text-slate-400">{description}</div>
        ) : null}
      </div>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2f6655] hover:text-[#19352d]"
        >
          {action}
          <ArrowRight size={12} />
        </button>
      ) : null}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, meta, tone = "brand" }) {
  const iconTone =
    tone === "danger"
      ? "bg-red-50 text-red-600"
      : tone === "warn"
        ? "bg-amber-50 text-amber-600"
        : tone === "blue"
          ? "bg-blue-50 text-blue-600"
          : "bg-[#f0f5f2] text-[#2f6655]";

  return (
    <div className="rounded-xl border border-[#e4e8e5] bg-white p-4 shadow-none">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          iconTone,
        )}
      >
        <Icon size={15} strokeWidth={1.8} />
      </div>
      <div className="mt-3 text-[22px] font-semibold tracking-[-0.04em] text-[#19352d]">
        {value}
      </div>
      <div className="mt-0.5 text-[10px] font-medium text-slate-500">
        {label}
      </div>
      {meta ? (
        <div className="mt-2 text-[9px] text-slate-400">{meta}</div>
      ) : null}
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div className="px-4 py-8 text-center text-[10px] text-slate-400">
      {children}
    </div>
  );
}

function ProjectProgress({ data }) {
  if (!data) return <EmptyState>Loading project phases…</EmptyState>;

  const currentPhase =
    data.phases?.find((phase) => !phase.complete) ||
    data.phases?.[data.phases.length - 1];

  return (
    <div className="rounded-xl border border-[#e4e8e5] bg-white p-4">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Current execution position
          </div>
          <div className="mt-1 text-[16px] font-semibold text-[#19352d]">
            {currentPhase?.name || "Project phases"}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            {data.completed_subphases || 0} of {data.total_subphases || 0} units
            complete
          </div>
        </div>
        <div className="text-right">
          <div className="text-[28px] font-semibold tracking-[-0.04em] text-[#19352d]">
            {data.progress_pct || 0}%
          </div>
          <div className="text-[9px] text-slate-400">Overall progress</div>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#2f6655] transition-all"
          style={{
            width: `${Math.min(Math.max(data.progress_pct || 0, 0), 100)}%`,
          }}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
        {(data.phases || []).map((phase, index) => {
          const done = !!phase.complete;
          const active = !done && currentPhase?.key === phase.key;
          return (
            <div
              key={phase.key || index}
              className={cn(
                "rounded-lg border p-3",
                active
                  ? "border-[#aebfb5] bg-[#f7faf8]"
                  : done
                    ? "border-emerald-100 bg-emerald-50/50"
                    : "border-[#edf0ee] bg-[#fafbfa]",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-[10px] font-semibold leading-4 text-slate-700">
                  {phase.name}
                </div>
                <span
                  className={cn(
                    "mt-0.5 h-2 w-2 flex-shrink-0 rounded-full",
                    done
                      ? "bg-emerald-500"
                      : active
                        ? "bg-[#2f6655]"
                        : "bg-slate-300",
                  )}
                />
              </div>
              <div className="mt-2 text-[8px] uppercase tracking-[0.08em] text-slate-400">
                {phase.subphase_count
                  ? `${phase.completed_subphases || 0}/${phase.subphase_count} complete`
                  : done
                    ? "Completed"
                    : active
                      ? "Current"
                      : "Pending"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionRequired({ work, docs, onOpenDocuments }) {
  const delayed = work.delayed || [];
  const blocked = work.blocked || [];
  const awaitingApproval = work.awaiting_approval || [];
  const awaitingClient = work.awaiting_client || [];

  const items = [
    ...delayed.map((item) => ({ ...item, type: "Delayed", severe: true })),
    ...blocked.map((item) => ({ ...item, type: "Blocked", severe: true })),
    ...awaitingApproval.map((item) => ({
      ...item,
      type: "Approval",
      severe: false,
    })),
    ...awaitingClient.map((item) => ({
      ...item,
      type: "Client",
      severe: false,
    })),
  ].slice(0, 7);

  const missingDocs = docs.filter(
    (doc) => doc.status === "MISSING" || doc.required_missing,
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[#e4e8e5] bg-white">
      <div className="flex items-center justify-between border-b border-[#edf0ee] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500">
            <AlertCircle size={14} />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-[#19352d]">
              Action Required
            </div>
            <div className="text-[9px] text-slate-400">
              Items that can hold up this project
            </div>
          </div>
        </div>
        <span className="rounded-full bg-red-50 px-2 py-1 text-[9px] font-bold text-red-600">
          {items.length + missingDocs.length}
        </span>
      </div>

      {items.map((item, index) => (
        <div
          key={item.id || `${item.type}-${index}`}
          className="flex gap-3 border-b border-[#edf0ee] px-4 py-3"
        >
          <span
            className={cn(
              "mt-1 h-2 w-2 flex-shrink-0 rounded-full",
              item.severe ? "bg-red-500" : "bg-amber-500",
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[10.5px] font-medium text-slate-700">
              {item.title || item.name || item.description}
            </div>
            <div className="mt-1 text-[9px] text-[#2f6655]">{item.type}</div>
            <div className="mt-0.5 text-[8px] text-slate-400">
              {item.assignee ? `${item.assignee} · ` : ""}
              {item.due_date ? `Due ${item.due_date}` : "Requires attention"}
            </div>
          </div>
        </div>
      ))}

      {missingDocs.slice(0, 3).map((doc) => (
        <button
          type="button"
          key={doc.id}
          onClick={onOpenDocuments}
          className="flex w-full items-start gap-3 border-b border-[#edf0ee] px-4 py-3 text-left hover:bg-[#fbfcfb]"
        >
          <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[10.5px] font-medium text-slate-700">
              {doc.name}
            </div>
            <div className="mt-1 text-[9px] text-red-500">Missing document</div>
          </div>
          <ArrowRight size={12} className="mt-1 text-slate-300" />
        </button>
      ))}

      {items.length === 0 && missingDocs.length === 0 ? (
        <EmptyState>No blockers or pending approvals right now.</EmptyState>
      ) : null}
    </div>
  );
}

function WorkloadSnapshot({ work }) {
  const cards = WORK_BUCKETS.map(([key, label]) => ({
    key,
    label,
    count: work[key]?.length || 0,
  }));

  return (
    <div className="overflow-hidden rounded-xl border border-[#e4e8e5] bg-white">
      <div className="border-b border-[#edf0ee] px-4 py-3">
        <div className="text-[12px] font-semibold text-[#19352d]">
          Work & Commitments
        </div>
        <div className="mt-0.5 text-[9px] text-slate-400">
          Current project workload by urgency
        </div>
      </div>
      <div className="grid grid-cols-2">
        {cards.map((item, index) => (
          <div
            key={item.key}
            className={cn(
              "p-3",
              index % 2 === 0 && "border-r border-[#edf0ee]",
              index < cards.length - 2 && "border-b border-[#edf0ee]",
            )}
          >
            <div
              className={cn(
                "text-[18px] font-semibold",
                ["delayed", "blocked"].includes(item.key)
                  ? item.count
                    ? "text-red-500"
                    : "text-[#19352d]"
                  : ["due_today", "awaiting_approval"].includes(item.key)
                    ? item.count
                      ? "text-amber-600"
                      : "text-[#19352d]"
                    : "text-[#19352d]",
              )}
            >
              {item.count}
            </div>
            <div className="mt-0.5 text-[9px] text-slate-400">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentSnapshot({ docs, loading, onToggleVisibility, onOpenAll }) {
  const clientVisible = docs.filter((doc) => !!doc.client_visible).length;
  const missing = docs.filter(
    (doc) => doc.status === "MISSING" || doc.required_missing,
  ).length;

  return (
    <div className="overflow-hidden rounded-xl border border-[#e4e8e5] bg-white">
      <div className="flex items-center justify-between border-b border-[#edf0ee] px-4 py-3">
        <div>
          <div className="text-[12px] font-semibold text-[#19352d]">
            Document Control
          </div>
          <div className="mt-0.5 text-[9px] text-slate-400">
            Project evidence and client visibility
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenAll}
          className="text-[9px] font-semibold text-[#2f6655]"
        >
          Open module
        </button>
      </div>

      <div className="grid grid-cols-3 border-b border-[#edf0ee]">
        <div className="border-r border-[#edf0ee] p-3">
          <div className="text-[17px] font-semibold text-[#19352d]">
            {docs.length}
          </div>
          <div className="text-[8px] text-slate-400">Uploaded</div>
        </div>
        <div className="border-r border-[#edf0ee] p-3">
          <div className="text-[17px] font-semibold text-emerald-600">
            {clientVisible}
          </div>
          <div className="text-[8px] text-slate-400">Client-visible</div>
        </div>
        <div className="p-3">
          <div className="text-[17px] font-semibold text-red-500">
            {missing}
          </div>
          <div className="text-[8px] text-slate-400">Missing</div>
        </div>
      </div>

      {loading ? (
        <EmptyState>Loading documents…</EmptyState>
      ) : docs.length === 0 ? (
        <EmptyState>No documents yet.</EmptyState>
      ) : (
        docs.slice(0, 5).map((doc) => (
          <div
            key={doc.id}
            className="flex items-center gap-3 border-b border-[#edf0ee] px-4 py-3 last:border-0"
          >
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#f3f6f4] text-[#2f6655]">
              <FileText size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[10px] font-medium text-slate-700">
                {doc.name}
              </div>
              <div className="mt-0.5 truncate text-[8px] text-slate-400">
                {doc.category || "Document"} · {doc.uploaded_by || "—"}
              </div>
            </div>
            <label className="flex flex-shrink-0 items-center gap-1.5 text-[8px] text-slate-400">
              <input
                type="checkbox"
                checked={!!doc.client_visible}
                onChange={(e) => onToggleVisibility(doc.id, e.target.checked)}
              />
              Client
            </label>
          </div>
        ))
      )}
    </div>
  );
}

function CommercialSnapshot({
  financial,
  boqs,
  quotes,
  vendors,
  onOpenBoq,
  onOpenQuotes,
}) {
  const approvedBoq = financial?.approved_boq_estimate || 0;
  const committed = financial?.committed_cost || 0;
  const projected = financial?.projected_final_cost || 0;
  const variation = financial?.cost_variation_pct;

  return (
    <div className="overflow-hidden rounded-xl border border-[#e4e8e5] bg-white">
      <div className="border-b border-[#edf0ee] px-4 py-3">
        <div className="text-[12px] font-semibold text-[#19352d]">
          Commercial & Procurement
        </div>
        <div className="mt-0.5 text-[9px] text-slate-400">
          BOQ, quotations, commitments and engaged vendors
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4">
        {[
          ["Approved BOQ", fmtINR(approvedBoq)],
          ["Committed", fmtINR(committed)],
          ["Projected Final", fmtINR(projected)],
          [
            "Variation",
            variation == null
              ? "—"
              : `${variation > 0 ? "+" : ""}${variation}%`,
          ],
        ].map(([label, value], index) => (
          <div
            key={label}
            className={cn(
              "p-4",
              index < 3 && "lg:border-r lg:border-[#edf0ee]",
              index % 2 === 0 && "border-r border-[#edf0ee] lg:border-r",
              index < 2 && "border-b border-[#edf0ee] lg:border-b-0",
            )}
          >
            <div className="text-[14px] font-semibold text-[#19352d]">
              {value}
            </div>
            <div className="mt-0.5 text-[8px] text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 border-t border-[#edf0ee] md:grid-cols-3">
        <button
          type="button"
          onClick={onOpenBoq}
          className="flex items-center justify-between border-b border-[#edf0ee] px-4 py-3 text-left hover:bg-[#fbfcfb] md:border-b-0 md:border-r"
        >
          <div>
            <div className="text-[15px] font-semibold text-[#19352d]">
              {boqs.length}
            </div>
            <div className="text-[8px] text-slate-400">BOQ versions</div>
          </div>
          <ArrowRight size={13} className="text-slate-300" />
        </button>
        <button
          type="button"
          onClick={onOpenQuotes}
          className="flex items-center justify-between border-b border-[#edf0ee] px-4 py-3 text-left hover:bg-[#fbfcfb] md:border-b-0 md:border-r"
        >
          <div>
            <div className="text-[15px] font-semibold text-[#19352d]">
              {quotes.length}
            </div>
            <div className="text-[8px] text-slate-400">Quotations</div>
          </div>
          <ArrowRight size={13} className="text-slate-300" />
        </button>
        <div className="px-4 py-3">
          <div className="text-[15px] font-semibold text-[#19352d]">
            {vendors.engaged?.length || 0}
          </div>
          <div className="text-[8px] text-slate-400">Engaged vendors</div>
        </div>
      </div>
    </div>
  );
}

function MilestonesPanel({ milestones }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e4e8e5] bg-white">
      <div className="border-b border-[#edf0ee] px-4 py-3">
        <div className="text-[12px] font-semibold text-[#19352d]">
          Milestones
        </div>
        <div className="mt-0.5 text-[9px] text-slate-400">
          Upcoming project commitments
        </div>
      </div>
      {milestones.length === 0 ? (
        <EmptyState>No milestones configured.</EmptyState>
      ) : (
        milestones.slice(0, 6).map((milestone) => (
          <div
            key={milestone.id}
            className="flex items-center gap-3 border-b border-[#edf0ee] px-4 py-3 last:border-0"
          >
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#f3f6f4] text-[#2f6655]">
              <CalendarDays size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[10px] font-medium text-slate-700">
                {milestone.name}
              </div>
              <div className="mt-0.5 text-[8px] text-slate-400">
                {milestone.planned_end || "No date"} ·{" "}
                {milestone.assignee || "Unassigned"}
              </div>
            </div>
            <StatusBadge status={milestone.status} />
          </div>
        ))
      )}
    </div>
  );
}

function RecentActivity({ rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e4e8e5] bg-white">
      <div className="flex items-center justify-between border-b border-[#edf0ee] px-4 py-3">
        <div>
          <div className="text-[12px] font-semibold text-[#19352d]">
            Recent Activity
          </div>
          <div className="mt-0.5 text-[9px] text-slate-400">
            Latest changes on this project
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[8px] text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live record
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState>No activity yet.</EmptyState>
      ) : (
        rows.slice(0, 8).map((row, index) => (
          <div
            key={row.id || index}
            className="flex gap-3 border-b border-[#edf0ee] px-4 py-3 last:border-0"
          >
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#f3f6f4] text-[#2f6655]">
              <RefreshCw size={12} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[10px] font-medium text-slate-700">
                {row.description || row.action}
              </div>
              <div className="mt-0.5 text-[8px] text-slate-400">
                {row.actor || row.user || "—"} ·{" "}
                {relativeTime(row.at || row.created_at)}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ShareClientModal({
  open,
  onClose,
  form,
  setForm,
  createdLink,
  onCreate,
  onCopy,
  onDone,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#19352d]/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[16px] font-semibold text-[#19352d]">
          Share with Client
        </div>
        <div className="mt-1 text-[10px] text-slate-400">
          Generate a controlled client link for this project.
        </div>

        {!createdLink ? (
          <>
            <label className="mt-4 block text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Purpose
            </label>
            <select
              value={form.purpose}
              onChange={(e) =>
                setForm((current) => ({ ...current, purpose: e.target.value }))
              }
              className="mt-1.5 h-9 w-full rounded-lg border border-[#dfe5e1] bg-white px-3 text-[11px] text-slate-700 outline-none"
            >
              <option value="project_view">Project View</option>
              <option value="boq_approval">BOQ Approval</option>
              <option value="quotation_selection">Quotation Selection</option>
              <option value="handover_acceptance">Handover Acceptance</option>
            </select>

            <label className="mt-3 block text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Client Name
            </label>
            <input
              value={form.client_name}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  client_name: e.target.value,
                }))
              }
              className="mt-1.5 h-9 w-full rounded-lg border border-[#dfe5e1] px-3 text-[11px] outline-none focus:border-[#2f6655]"
            />

            <label className="mt-3 block text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Client Email
            </label>
            <input
              type="email"
              value={form.client_email}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  client_email: e.target.value,
                }))
              }
              className="mt-1.5 h-9 w-full rounded-lg border border-[#dfe5e1] px-3 text-[11px] outline-none focus:border-[#2f6655]"
            />

            <div className="mt-4 space-y-2 text-[10px] text-slate-600">
              {[
                ["show_rates", "Show rates on BOQ"],
                ["show_vendor_names", "Show vendor names"],
                ["show_ratings", "Show vendor ratings"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!form[key]}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        [key]: e.target.checked,
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#dfe5e1] px-3 py-2 text-[10px] font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onCreate}
                className="rounded-lg bg-[#19352d] px-4 py-2 text-[10px] font-semibold text-white"
              >
                Create Link
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-semibold text-emerald-600">
              Link generated
            </div>
            <div className="break-all rounded-lg border border-[#e4e8e5] bg-[#f7f9f7] p-3 text-[10px] text-slate-500">
              {createdLink.url}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onCopy(createdLink.url)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#dfe5e1] px-3 py-2 text-[10px] font-semibold text-slate-600"
              >
                <Copy size={11} /> Copy
              </button>
              <a
                href={createdLink.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-[#19352d] px-3 py-2 text-[10px] font-semibold text-white"
              >
                Open
              </a>
              <button
                type="button"
                onClick={onDone}
                className="rounded-lg bg-[#19352d] px-3 py-2 text-[10px] font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectWorkspace() {
  const { id } = useParams();
  const nav = useNavigate();

  const {
    data: projectData,
    isLoading,
    error,
    refetch: refetchProject,
  } = useGetProjectByIdQuery(id, { skip: !id });

  const {
    data: boqs = [],
    isFetching: boqsLoading,
    refetch: refetchBoqs,
  } = useGetBoqsQuery({ project_id: id }, { skip: !id });

  const {
    data: docs = [],
    isFetching: docsLoading,
    refetch: refetchDocs,
  } = useGetDocumentsQuery({ project_id: id }, { skip: !id });

  const [updateDocument] = useUpdateDocumentMutation();

  const {
    data: quotesFromApi = [],
    isFetching: quotesLoading,
    refetch: refetchQuotes,
  } = useGetQuotationsQuery({ project_id: id }, { skip: !id });

  const quotes =
    quotesFromApi.length > 0 ? quotesFromApi : projectData?.quotations || [];

  const [phaseData, setPhaseData] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [work, setWork] = useState({});
  const [vendors, setVendors] = useState({ engaged: [], attached: [] });
  const [financial, setFinancial] = useState(null);
  const [activityRows, setActivityRows] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [shareModal, setShareModal] = useState(false);
  const [shareForm, setShareForm] = useState({
    purpose: "project_view",
    client_email: "",
    client_name: "",
    show_rates: true,
    show_vendor_names: true,
    show_ratings: true,
  });
  const [createdLink, setCreatedLink] = useState(null);

  const loadSupplementary = async () => {
    if (!id) return;

    const [phase, ms, wk, vd, fn, activity] = await Promise.all([
      api.get(`/projects/${id}/phases`).catch(() => ({ data: null })),
      api.get(`/projects/${id}/milestones`).catch(() => ({ data: [] })),
      api.get(`/projects/${id}/pending-work`).catch(() => ({ data: {} })),
      api
        .get(`/projects/${id}/vendors`)
        .catch(() => ({ data: { engaged: [], attached: [] } })),
      api.get(`/projects/${id}/financial`).catch(() => ({ data: null })),
      api
        .get(`/projects/activity?limit=50&project_id=${id}`)
        .catch(() => ({ data: projectData?.recent_activity || [] })),
    ]);

    setPhaseData(phase.data);
    setMilestones(ms.data || []);
    setWork(wk.data || {});
    setVendors(vd.data || { engaged: [], attached: [] });
    setFinancial(fn.data);
    setActivityRows(activity.data || projectData?.recent_activity || []);
  };

  useEffect(() => {
    if (!id || !projectData) return;

    loadSupplementary();

    setShareForm((current) => ({
      ...current,
      client_email: projectData.client?.email || "",
      client_name:
        projectData.client?.name || projectData.client?.contact_person || "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, projectData]);

  const toggleDocVisibility = async (docId, client_visible) => {
    try {
      await updateDocument({ id: docId, data: { client_visible } }).unwrap();
    } catch {
      toast.error("Failed to update document visibility");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        refetchProject(),
        refetchBoqs(),
        refetchDocs(),
        refetchQuotes(),
        loadSupplementary(),
      ]);
      toast.success("Project dashboard refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  const createLink = async () => {
    const payload = {
      project_id: id,
      purpose: shareForm.purpose,
      client_email: shareForm.client_email,
      client_name: shareForm.client_name,
      expires_days: 30,
      options: {
        show_rates: shareForm.show_rates,
        show_vendor_names: shareForm.show_vendor_names,
        show_ratings: shareForm.show_ratings,
      },
    };

    try {
      const { data } = await api.post("/client-links", payload);
      setCreatedLink(data);
      toast.success("Client link created");
    } catch {
      toast.error("Failed to create client link");
    }
  };

  const copyUrl = async (url) => {
    await navigator.clipboard.writeText(url);
    toast.success("Copied");
  };

  const stats = useMemo(() => {
    const delayed = work.delayed?.length || 0;
    const blocked = work.blocked?.length || 0;
    const approvals = work.awaiting_approval?.length || 0;
    const missingDocs = docs.filter(
      (doc) => doc.status === "MISSING" || doc.required_missing,
    ).length;

    return {
      progress: phaseData?.progress_pct ?? projectData?.progress ?? 0,
      openActions: delayed + blocked + approvals + missingDocs,
      docs: docs.length,
      quotes: quotes.length,
      vendors: vendors.engaged?.length || 0,
    };
  }, [work, docs, phaseData, projectData, quotes, vendors]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7f5] p-8 text-[12px] text-slate-400">
        Loading project dashboard…
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className="min-h-screen bg-[#f5f7f5] p-8 text-[12px] text-red-600">
        Failed to load project.
      </div>
    );
  }

  const p = projectData;
  const projectStatus = p.status?.toLowerCase() || "on_track";

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#19352d]">
      <main className="mx-auto max-w-[1700px] px-5 py-6 lg:px-7">
        <button
          type="button"
          onClick={() => nav("/projects")}
          className="mb-4 inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400 hover:text-[#19352d]"
        >
          <ArrowLeft size={12} />
          Projects
        </button>

        {/* PROJECT HEADER */}
        <div className="rounded-2xl border border-[#e4e8e5] bg-white p-5">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={projectStatus} />
                <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  {p.slug?.toUpperCase() || p.id?.slice(0, 8)}
                </span>
                <span className="rounded-md bg-[#f1f4f2] px-2 py-1 text-[9px] font-semibold text-slate-500">
                  {p.priority || "Medium"} priority
                </span>
              </div>

              <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.04em] text-[#19352d] lg:text-[32px]">
                {p.name}
              </h1>

              <div className="mt-1.5 text-[11px] text-slate-400">
                {p.client?.name || p.client?.contact_person || "No client"} ·{" "}
                {p.site_location || "No site location"} ·{" "}
                {p.project_type?.name || p.project_type || "Project"}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShareModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#19352d] px-3 py-2 text-[10px] font-semibold text-white hover:bg-[#0f231d]"
                >
                  <Share2 size={12} />
                  Share with Client
                </button>
                <button
                  type="button"
                  onClick={() => nav(`/projects/${id}/handover`)}
                  className="rounded-lg border border-[#dfe5e1] bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 hover:border-[#aebfb5]"
                >
                  Handover Package
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfe5e1] bg-white px-3 py-2 text-[10px] font-semibold text-slate-500 hover:border-[#aebfb5]"
                >
                  <RefreshCw
                    size={12}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 md:grid-cols-4 xl:w-auto xl:min-w-[540px]">
              {[
                ["Current phase", (p.phase || "—").replace(/_/g, " ")],
                ["Progress", `${stats.progress}%`],
                ["ECD", p.expected_completion_date || "—"],
                ["Open actions", stats.openActions],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[#f7f9f7] p-3">
                  <div className="text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    {label}
                  </div>
                  <div className="mt-1 text-[13px] font-semibold text-[#19352d]">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            icon={BriefcaseBusiness}
            label="Project Progress"
            value={`${stats.progress}%`}
            meta="Across configured phases"
          />
          <MetricCard
            icon={AlertCircle}
            label="Action Required"
            value={stats.openActions}
            meta="Blockers, approvals, missing docs"
            tone={stats.openActions ? "danger" : "brand"}
          />
          <MetricCard
            icon={FileText}
            label="Documents"
            value={stats.docs}
            meta={docsLoading ? "Refreshing…" : "Project documents"}
          />
          <MetricCard
            icon={DollarSign}
            label="Approved BOQ"
            value={
              financial ? fmtINR(financial.approved_boq_estimate || 0) : "—"
            }
            meta={`${boqs.length} BOQ version${boqs.length === 1 ? "" : "s"}`}
          />
          <MetricCard
            icon={ListChecks}
            label="Quotations"
            value={stats.quotes}
            meta={quotesLoading ? "Refreshing…" : "Project estimates"}
            tone="blue"
          />
          <MetricCard
            icon={Users}
            label="Engaged Vendors"
            value={stats.vendors}
            meta="Selected / engaged"
          />
        </div>

        {/* EXECUTION POSITION */}
        <section className="mt-7">
          <SectionHeader
            eyebrow="Execution"
            title="Project Progress & Phases"
            description="Single view of the project's current execution position"
          />
          <ProjectProgress data={phaseData} />
        </section>

        {/* PRIORITY ROW */}
        <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.8fr]">
          <ActionRequired
            work={work}
            docs={docs}
            onOpenDocuments={() => nav(`/documents?project=${id}`)}
          />
          <WorkloadSnapshot work={work} />
        </section>

        {/* CONTROL ROW */}
        <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <DocumentSnapshot
            docs={docs}
            loading={docsLoading}
            onToggleVisibility={toggleDocVisibility}
            onOpenAll={() => nav(`/documents?project=${id}`)}
          />
          <CommercialSnapshot
            financial={financial}
            boqs={boqs}
            quotes={quotes}
            vendors={vendors}
            onOpenBoq={() => nav(`/boq?project=${id}`)}
            onOpenQuotes={() => nav(`/quotations?project=${id}`)}
          />
        </section>

        {/* MILESTONE + ACTIVITY */}
        <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <MilestonesPanel milestones={milestones} />
          <RecentActivity
            rows={activityRows.length ? activityRows : p.recent_activity || []}
          />
        </section>

        {/* DETAIL LISTS */}
        <section className="mt-7">
          <SectionHeader
            eyebrow="Commercial detail"
            title="Latest BOQ & Quotations"
            description="Fast access without leaving the project dashboard"
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-[#e4e8e5] bg-white">
              <div className="flex items-center justify-between border-b border-[#edf0ee] px-4 py-3">
                <div>
                  <div className="text-[12px] font-semibold text-[#19352d]">
                    BOQ Versions
                  </div>
                  <div className="mt-0.5 text-[9px] text-slate-400">
                    Budget and costing history
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => nav(`/boq?project=${id}`)}
                  className="text-[9px] font-semibold text-[#2f6655]"
                >
                  View all
                </button>
              </div>

              {boqsLoading ? (
                <EmptyState>Loading BOQs…</EmptyState>
              ) : boqs.length === 0 ? (
                <EmptyState>No BOQs for this project.</EmptyState>
              ) : (
                boqs.slice(0, 5).map((boq) => (
                  <Link
                    key={boq.id}
                    to={`/boq/${boq.id}`}
                    className="flex items-center justify-between gap-4 border-b border-[#edf0ee] px-4 py-3 last:border-0 hover:bg-[#fbfcfb]"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[10px] font-semibold text-slate-700">
                        BOQ V{boq.version} · {boq.status}
                      </div>
                      <div className="mt-0.5 text-[8px] text-slate-400">
                        {relativeTime(boq.updated_at || boq.created_at)}
                      </div>
                    </div>
                    <div className="text-[10px] font-semibold text-[#19352d]">
                      {fmtINR(boq.total_amount || 0)}
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-[#e4e8e5] bg-white">
              <div className="flex items-center justify-between border-b border-[#edf0ee] px-4 py-3">
                <div>
                  <div className="text-[12px] font-semibold text-[#19352d]">
                    Quotations
                  </div>
                  <div className="mt-0.5 text-[9px] text-slate-400">
                    Vendor estimates and selection
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => nav(`/quotations?project=${id}`)}
                  className="text-[9px] font-semibold text-[#2f6655]"
                >
                  View all
                </button>
              </div>

              {quotesLoading ? (
                <EmptyState>Loading quotations…</EmptyState>
              ) : quotes.length === 0 ? (
                <EmptyState>No quotations for this project.</EmptyState>
              ) : (
                quotes.slice(0, 5).map((quote) => (
                  <Link
                    key={quote.id}
                    to={`/quotations/${quote.id}`}
                    className="flex items-center justify-between gap-4 border-b border-[#edf0ee] px-4 py-3 last:border-0 hover:bg-[#fbfcfb]"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[10px] font-semibold text-slate-700">
                        {quote.quotationNumber ||
                          quote.quotation_number ||
                          "Quotation"}{" "}
                        · {quote.vendor?.name || quote.vendor_name || "Vendor"}
                      </div>
                      <div className="mt-0.5 text-[8px] text-slate-400">
                        {quote.vendor?.vendorCategory?.name ||
                          quote.work_category ||
                          "—"}{" "}
                        · {quote.status || "—"}
                      </div>
                    </div>
                    <div className="text-[10px] font-semibold text-[#19352d]">
                      {fmtINR(
                        quote.totalAmount ||
                          quote.subtotal ||
                          quote.subtotals?.total ||
                          0,
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <ShareClientModal
        open={shareModal}
        onClose={() => setShareModal(false)}
        form={shareForm}
        setForm={setShareForm}
        createdLink={createdLink}
        onCreate={createLink}
        onCopy={copyUrl}
        onDone={() => {
          setCreatedLink(null);
          setShareModal(false);
        }}
      />
    </div>
  );
}
