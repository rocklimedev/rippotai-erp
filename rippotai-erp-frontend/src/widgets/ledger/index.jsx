import React from "react";
import { useNavigate } from "react-router-dom";
import { WidgetShell, Stat, RowList, useEndpoint } from "../common/hooks";

/* -------- Phase I: Ledger widgets --------
 * Mirrors the shape of ./boqs, ./vendors, ./quots, ./materials, ./siteops, ./calendar:
 * small dashboard-grid widgets backed by useEndpoint("/ledger/dashboard").
 *
 * Expected shape of GET /ledger/dashboard (adjust to match the real API):
 * {
 *   summary: {
 *     total_contract_value, total_payable, total_paid, outstanding,
 *     active_schedules, pending_milestones,
 *     overdue_payments, completed_schedules,
 *     collection_rate,
 *   },
 *   payment_schedules: [{ id, title, project_name, contract_value, payable, paid, status, next_due, next_amount }],
 *   upcoming_payments: [{ id, project_name, milestone, due_date, amount, priority }],
 *   overdue_payments: [{ id, project_name, milestone, due_date, amount, days_overdue }],
 *   recent_payments: [{ id, project_name, milestone, amount, date, method }],
 *   activity: [{ id, type, title, description, time }],
 * }
 */

const formatCurrency = (value, compact = true) => {
  const number = Number(value || 0);
  if (value == null) return "—";

  if (compact) {
    if (number >= 10000000) return `₹${(number / 10000000).toFixed(2)}Cr`;
    if (number >= 100000) return `₹${(number / 100000).toFixed(2)}L`;
    if (number >= 1000) return `₹${(number / 1000).toFixed(1)}K`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

/* ============================================================
   STAT WIDGETS
============================================================ */

export const LedgerTotalContractValue = () => {
  const nav = useNavigate();
  const d = useEndpoint("/ledger/dashboard");
  return (
    <WidgetShell
      title="Total Contract Value"
      onClick={() => nav("/ledger/payment-schedule/all")}
    >
      <Stat
        value={formatCurrency(d?.summary?.total_contract_value)}
        sub="across active & completed schedules"
      />
    </WidgetShell>
  );
};

export const LedgerTotalPayable = () => {
  const d = useEndpoint("/ledger/dashboard");
  return (
    <WidgetShell title="Total Payable">
      <Stat
        value={formatCurrency(d?.summary?.total_payable)}
        sub={
          d?.summary?.collection_rate != null
            ? `${d.summary.collection_rate}% collected`
            : undefined
        }
      />
    </WidgetShell>
  );
};

export const LedgerTotalCollected = () => {
  const d = useEndpoint("/ledger/dashboard");
  return (
    <WidgetShell title="Total Collected">
      <Stat
        value={formatCurrency(d?.summary?.total_paid)}
        sub="payments received"
      />
    </WidgetShell>
  );
};

export const LedgerOutstanding = () => {
  const nav = useNavigate();
  const d = useEndpoint("/ledger/dashboard");
  return (
    <WidgetShell
      title="Outstanding"
      onClick={() => nav("/ledger/payment-schedule/all")}
    >
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-[28px] font-bold text-[#9B3D3D] leading-none">
          {formatCurrency(d?.summary?.outstanding)}
        </div>
        <div className="text-[11px] text-[#6B7B7C] mt-1">
          {d?.summary?.overdue_payments != null
            ? `${d.summary.overdue_payments} overdue payments`
            : "outstanding balance"}
        </div>
      </div>
    </WidgetShell>
  );
};

export const LedgerActiveSchedules = () => {
  const nav = useNavigate();
  const d = useEndpoint("/ledger/dashboard");
  return (
    <WidgetShell
      title="Active Schedules"
      onClick={() => nav("/ledger/payment-schedule/all?status=active")}
    >
      <Stat value={d?.summary?.active_schedules ?? "—"} />
    </WidgetShell>
  );
};

export const LedgerPendingMilestones = () => {
  const d = useEndpoint("/ledger/dashboard");
  return (
    <WidgetShell title="Pending Milestones">
      <Stat value={d?.summary?.pending_milestones ?? "—"} />
    </WidgetShell>
  );
};

export const LedgerCompletedSchedules = () => {
  const nav = useNavigate();
  const d = useEndpoint("/ledger/dashboard");
  return (
    <WidgetShell
      title="Completed Schedules"
      onClick={() => nav("/ledger/payment-schedule/all?status=completed")}
    >
      <Stat value={d?.summary?.completed_schedules ?? "—"} />
    </WidgetShell>
  );
};

export const LedgerCollectionRate = () => {
  const d = useEndpoint("/ledger/dashboard");
  return (
    <WidgetShell title="Collection Rate">
      <Stat
        value={
          d?.summary?.collection_rate != null
            ? `${d.summary.collection_rate}%`
            : "—"
        }
        sub="of total payable collected"
      />
    </WidgetShell>
  );
};

/* ============================================================
   LIST / ROW WIDGETS
============================================================ */

export const LedgerPaymentSchedulesList = () => {
  const nav = useNavigate();
  const d = useEndpoint("/ledger/dashboard");
  const rows = (d?.payment_schedules || []).slice(0, 6).map((s) => ({
    id: s.id,
    title: s.title,
    subtitle: `${s.project_name || "—"} · ${formatCurrency(s.payable)} payable`,
    right: s.status,
  }));
  return (
    <WidgetShell title="Payment Schedules">
      <RowList
        rows={rows}
        onClick={() => nav("/ledger/payment-schedule/all")}
        empty="No payment schedules yet"
      />
    </WidgetShell>
  );
};

export const LedgerUpcomingPaymentsList = () => {
  const nav = useNavigate();
  const d = useEndpoint("/ledger/dashboard");
  const rows = (d?.upcoming_payments || []).slice(0, 6).map((p) => ({
    id: p.id,
    title: p.project_name,
    subtitle: `${p.milestone || "—"} · due ${formatDate(p.due_date)}`,
    right: formatCurrency(p.amount),
  }));
  return (
    <WidgetShell title="Upcoming Payments">
      <RowList
        rows={rows}
        onClick={() => nav("/ledger/payment-schedule/all")}
        empty="No upcoming payments"
      />
    </WidgetShell>
  );
};

export const LedgerOverduePaymentsList = () => {
  const nav = useNavigate();
  const d = useEndpoint("/ledger/dashboard");
  const rows = (d?.overdue_payments || []).slice(0, 6).map((p) => ({
    id: p.id,
    title: p.project_name,
    subtitle: `${p.milestone || "—"} · ${p.days_overdue ?? "—"} days overdue`,
    right: formatCurrency(p.amount),
  }));
  return (
    <WidgetShell title="Overdue Payments">
      <RowList
        rows={rows}
        onClick={() => nav("/ledger/payment-schedule/all")}
        empty="No overdue payments"
      />
    </WidgetShell>
  );
};

export const LedgerRecentPaymentsList = () => {
  const nav = useNavigate();
  const d = useEndpoint("/ledger/dashboard");
  const rows = (d?.recent_payments || []).slice(0, 6).map((p) => ({
    id: p.id,
    title: p.project_name,
    subtitle: `${p.milestone || "—"} · ${p.method || "—"}`,
    right: `+${formatCurrency(p.amount)}`,
  }));
  return (
    <WidgetShell title="Recent Payments">
      <RowList
        rows={rows}
        onClick={() => nav("/ledger/payment-schedule/all")}
        empty="No payments received yet"
      />
    </WidgetShell>
  );
};

export const LedgerRecentActivity = () => {
  const d = useEndpoint("/ledger/dashboard");
  const rows = (d?.activity || []).slice(0, 6).map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: a.description,
    right: a.time,
  }));
  return (
    <WidgetShell title="Recent Activity">
      <RowList rows={rows} empty="No recent ledger activity" />
    </WidgetShell>
  );
};
