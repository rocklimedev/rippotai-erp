import React, { useMemo, useState } from "react";
import {
  CreditCard,
  IndianRupee,
  Clock3,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  FileText,
  Receipt,
  WalletCards,
  Banknote,
  ChevronRight,
  Plus,
  Eye,
  MoreHorizontal,
  RefreshCw,
  CircleDollarSign,
  Landmark,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Shell, Card } from "../../hooks/shared";

// ============================================================
// MOCK DATA
// Replace this entire section with API data later.
// ============================================================

const MOCK_DATA = {
  summary: {
    totalContractValue: 128500000,
    totalPayable: 96750000,
    totalPaid: 68425000,
    outstanding: 28325000,
    activeSchedules: 18,
    pendingMilestones: 27,
    overduePayments: 6,
    completedSchedules: 31,
  },

  monthlyCollection: [
    { month: "Mar", expected: 8500000, received: 7200000 },
    { month: "Apr", expected: 10200000, received: 9400000 },
    { month: "May", expected: 11800000, received: 10100000 },
    { month: "Jun", expected: 12600000, received: 11900000 },
    { month: "Jul", expected: 14200000, received: 12850000 },
    { month: "Aug", expected: 16800000, received: 15100000 },
  ],

  paymentSchedules: [
    {
      id: "PS-001",
      title: "Verma Residence Payment Schedule",
      project: "Verma Residence",
      contractValue: 18500000,
      payable: 14800000,
      paid: 10200000,
      pending: 4600000,
      milestones: 8,
      completedMilestones: 5,
      pendingMilestones: 3,
      status: "ACTIVE",
      nextDue: "2026-09-05",
      nextAmount: 2200000,
    },
    {
      id: "PS-002",
      title: "Arora Commercial Interior",
      project: "Arora Commercial",
      contractValue: 24600000,
      payable: 19680000,
      paid: 16400000,
      pending: 3280000,
      milestones: 10,
      completedMilestones: 8,
      pendingMilestones: 2,
      status: "ACTIVE",
      nextDue: "2026-09-08",
      nextAmount: 1640000,
    },
    {
      id: "PS-003",
      title: "Mehta Villa",
      project: "Mehta Villa",
      contractValue: 32500000,
      payable: 26000000,
      paid: 18200000,
      pending: 7800000,
      milestones: 12,
      completedMilestones: 7,
      pendingMilestones: 5,
      status: "ACTIVE",
      nextDue: "2026-09-12",
      nextAmount: 3900000,
    },
    {
      id: "PS-004",
      title: "Sharma Office Renovation",
      project: "Sharma Office",
      contractValue: 12400000,
      payable: 9920000,
      paid: 9920000,
      pending: 0,
      milestones: 6,
      completedMilestones: 6,
      pendingMilestones: 0,
      status: "COMPLETED",
      nextDue: null,
      nextAmount: 0,
    },
    {
      id: "PS-005",
      title: "Kapoor Farmhouse",
      project: "Kapoor Farmhouse",
      contractValue: 28900000,
      payable: 23120000,
      paid: 12850000,
      pending: 10270000,
      milestones: 9,
      completedMilestones: 4,
      pendingMilestones: 5,
      status: "ACTIVE",
      nextDue: "2026-09-15",
      nextAmount: 3100000,
    },
  ],

  recentPayments: [
    {
      id: "PAY-001",
      project: "Verma Residence",
      milestone: "Foundation Completion",
      amount: 2200000,
      date: "2026-08-30",
      status: "RECEIVED",
      method: "Bank Transfer",
    },
    {
      id: "PAY-002",
      project: "Arora Commercial",
      milestone: "MEP Installation",
      amount: 1640000,
      date: "2026-08-28",
      status: "RECEIVED",
      method: "Bank Transfer",
    },
    {
      id: "PAY-003",
      project: "Mehta Villa",
      milestone: "Structure Completion",
      amount: 3900000,
      date: "2026-08-25",
      status: "RECEIVED",
      method: "Cheque",
    },
    {
      id: "PAY-004",
      project: "Kapoor Farmhouse",
      milestone: "Civil Works",
      amount: 2850000,
      date: "2026-08-22",
      status: "RECEIVED",
      method: "Bank Transfer",
    },
    {
      id: "PAY-005",
      project: "Sharma Office",
      milestone: "Final Handover",
      amount: 1850000,
      date: "2026-08-20",
      status: "RECEIVED",
      method: "Bank Transfer",
    },
  ],

  upcomingPayments: [
    {
      id: "UP-001",
      project: "Verma Residence",
      milestone: "Electrical Completion",
      dueDate: "2026-09-05",
      amount: 2200000,
      priority: "HIGH",
    },
    {
      id: "UP-002",
      project: "Arora Commercial",
      milestone: "Final Finishing",
      dueDate: "2026-09-08",
      amount: 1640000,
      priority: "MEDIUM",
    },
    {
      id: "UP-003",
      project: "Mehta Villa",
      milestone: "External Works",
      dueDate: "2026-09-12",
      amount: 3900000,
      priority: "HIGH",
    },
    {
      id: "UP-004",
      project: "Kapoor Farmhouse",
      milestone: "Interior Execution",
      dueDate: "2026-09-15",
      amount: 3100000,
      priority: "MEDIUM",
    },
    {
      id: "UP-005",
      project: "Singh Residence",
      milestone: "Site Handover",
      dueDate: "2026-09-18",
      amount: 1750000,
      priority: "LOW",
    },
  ],

  overduePayments: [
    {
      id: "OD-001",
      project: "Rajput House",
      milestone: "Civil Completion",
      dueDate: "2026-08-18",
      amount: 1850000,
      daysOverdue: 13,
    },
    {
      id: "OD-002",
      project: "Malhotra Office",
      milestone: "Furniture Installation",
      dueDate: "2026-08-20",
      amount: 1250000,
      daysOverdue: 11,
    },
    {
      id: "OD-003",
      project: "Bansal Residence",
      milestone: "Final Electrical",
      dueDate: "2026-08-22",
      amount: 980000,
      daysOverdue: 9,
    },
    {
      id: "OD-004",
      project: "Khanna Villa",
      milestone: "Painting Completion",
      dueDate: "2026-08-24",
      amount: 1450000,
      daysOverdue: 7,
    },
  ],

  recentActivity: [
    {
      id: 1,
      type: "payment",
      title: "Payment received",
      description: "₹22.00L received for Verma Residence",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "schedule",
      title: "Payment schedule created",
      description: "New schedule created for Singh Residence",
      time: "5 hours ago",
    },
    {
      id: 3,
      type: "milestone",
      title: "Milestone completed",
      description: "MEP Installation completed at Arora Commercial",
      time: "Yesterday",
    },
    {
      id: 4,
      type: "payment",
      title: "Payment received",
      description: "₹39.00L received for Mehta Villa",
      time: "Yesterday",
    },
    {
      id: 5,
      type: "overdue",
      title: "Payment overdue",
      description: "Rajput House payment is 13 days overdue",
      time: "2 days ago",
    },
  ],
};

// ============================================================
// HELPERS
// ============================================================

const formatCurrency = (value, compact = false) => {
  const number = Number(value || 0);

  if (compact) {
    if (number >= 10000000) {
      return `₹${(number / 10000000).toFixed(2)}Cr`;
    }

    if (number >= 100000) {
      return `₹${(number / 100000).toFixed(2)}L`;
    }

    if (number >= 1000) {
      return `₹${(number / 1000).toFixed(1)}K`;
    }
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

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getProgress = (paid, payable) => {
  if (!payable) return 0;

  return Math.min(100, Math.round((paid / payable) * 100));
};

// ============================================================
// SMALL COMPONENTS
// ============================================================

function StatCard({ icon: Icon, title, value, subtitle, trend, trendLabel }) {
  const positive = trend >= 0;

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-lg bg-[#EEF3F0] flex items-center justify-center">
            <Icon size={17} className="text-[#1F453B]" />
          </div>

          {trend !== undefined && (
            <div
              className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                positive ? "text-[#276749]" : "text-[#9B3D3D]"
              }`}
            >
              {positive ? (
                <ArrowUpRight size={13} />
              ) : (
                <ArrowDownRight size={13} />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="text-[12px] text-[#7A8889] font-medium">{title}</div>

          <div className="mt-1 text-[23px] font-bold tracking-tight text-[#263536]">
            {value}
          </div>

          {subtitle && (
            <div className="mt-1 text-[11px] text-[#8A9697]">{subtitle}</div>
          )}

          {trendLabel && (
            <div className="mt-2 text-[11px] text-[#7A8889]">{trendLabel}</div>
          )}
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }) {
  const styles = {
    ACTIVE: "bg-[#E8F3EE] text-[#1F453B]",
    COMPLETED: "bg-[#EAF1F8] text-[#315A7D]",
    RECEIVED: "bg-[#E8F3EE] text-[#276749]",
    PENDING: "bg-[#FFF4DC] text-[#8A6500]",
    OVERDUE: "bg-[#FBEAEA] text-[#9B3D3D]",
    CANCELLED: "bg-[#FBEAEA] text-[#9B3D3D]",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wide ${
        styles[status] || "bg-[#F4F6F7] text-[#6B7B7C]"
      }`}
    >
      {String(status || "UNKNOWN").replace(/_/g, " ")}
    </span>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-[15px] font-bold text-[#2F3C3D]">{title}</h2>

        {subtitle && (
          <p className="text-[11px] text-[#8A9697] mt-0.5">{subtitle}</p>
        )}
      </div>

      {action}
    </div>
  );
}

// ============================================================
// MAIN DASHBOARD
// ============================================================

export default function LedgerDashboard() {
  const nav = useNavigate();

  const [period, setPeriod] = useState("6M");

  const data = MOCK_DATA;

  // ----------------------------------------------------------
  // Calculations
  // ----------------------------------------------------------

  const collectionRate = useMemo(() => {
    if (!data.summary.totalPayable) return 0;

    return Math.round(
      (data.summary.totalPaid / data.summary.totalPayable) * 100,
    );
  }, [data.summary]);

  const totalUpcoming = useMemo(() => {
    return data.upcomingPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
  }, []);

  const totalOverdue = useMemo(() => {
    return data.overduePayments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
  }, []);

  const maxCollection = Math.max(
    ...data.monthlyCollection.map((item) =>
      Math.max(item.expected, item.received),
    ),
  );

  // ----------------------------------------------------------
  // Navigation
  // ----------------------------------------------------------

  const goToPaymentSchedules = () => {
    nav("/ledger/payment-schedule/all");
  };

  const createPaymentSchedule = () => {
    nav("/ledger/forms/payment-schedule");
  };

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <Shell
      title="Ledger Dashboard"
      subtitle="Financial overview, payment schedules and collections"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="h-10 w-10 rounded-lg border border-[rgba(31,69,59,0.12)] bg-white flex items-center justify-center text-[#536263] hover:bg-[#F4F6F7]"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>

          <button
            onClick={createPaymentSchedule}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#17382F] transition-colors"
          >
            <Plus size={14} />
            New Payment Schedule
          </button>
        </div>
      }
    >
      {/* ======================================================
          TOP FINANCIAL CARDS
      ======================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          icon={CircleDollarSign}
          title="Total Contract Value"
          value={formatCurrency(data.summary.totalContractValue, true)}
          subtitle="Across active & completed schedules"
          trend={8.4}
          trendLabel="vs previous period"
        />

        <StatCard
          icon={WalletCards}
          title="Total Payable"
          value={formatCurrency(data.summary.totalPayable, true)}
          subtitle={`${collectionRate}% collected`}
          trend={5.8}
          trendLabel="Collection efficiency"
        />

        <StatCard
          icon={Banknote}
          title="Total Collected"
          value={formatCurrency(data.summary.totalPaid, true)}
          subtitle="Payments received"
          trend={12.6}
          trendLabel="vs previous period"
        />

        <StatCard
          icon={AlertCircle}
          title="Outstanding"
          value={formatCurrency(data.summary.outstanding, true)}
          subtitle={`${data.summary.overduePayments} overdue payments`}
          trend={-3.2}
          trendLabel="Outstanding balance"
        />
      </div>

      {/* ======================================================
          SECONDARY STATS
      ======================================================= */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EEF3F0] flex items-center justify-center">
              <CreditCard size={15} className="text-[#1F453B]" />
            </div>

            <div>
              <div className="text-[11px] text-[#7A8889]">Active Schedules</div>

              <div className="text-[19px] font-bold text-[#263536]">
                {data.summary.activeSchedules}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFF4DC] flex items-center justify-center">
              <Clock3 size={15} className="text-[#8A6500]" />
            </div>

            <div>
              <div className="text-[11px] text-[#7A8889]">
                Pending Milestones
              </div>

              <div className="text-[19px] font-bold text-[#263536]">
                {data.summary.pendingMilestones}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EAF1F8] flex items-center justify-center">
              <CheckCircle2 size={15} className="text-[#315A7D]" />
            </div>

            <div>
              <div className="text-[11px] text-[#7A8889]">
                Completed Schedules
              </div>

              <div className="text-[19px] font-bold text-[#263536]">
                {data.summary.completedSchedules}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FBEAEA] flex items-center justify-center">
              <AlertCircle size={15} className="text-[#9B3D3D]" />
            </div>

            <div>
              <div className="text-[11px] text-[#7A8889]">Overdue Amount</div>

              <div className="text-[19px] font-bold text-[#263536]">
                {formatCurrency(totalOverdue, true)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ======================================================
          COLLECTION CHART + COLLECTION SUMMARY
      ======================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_0.8fr] gap-3 mt-3">
        <Card className="p-5">
          <SectionHeader
            title="Collection Performance"
            subtitle="Expected vs received payments"
            action={
              <div className="flex items-center gap-1 bg-[#F4F6F7] rounded-lg p-1">
                {["3M", "6M", "12M"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setPeriod(item)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                      period === item
                        ? "bg-white text-[#1F453B] shadow-sm"
                        : "text-[#7A8889]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            }
          />

          <div className="h-[240px] flex items-end gap-3 pt-4">
            {data.monthlyCollection.map((item) => {
              const expectedHeight =
                maxCollection > 0 ? (item.expected / maxCollection) * 100 : 0;

              const receivedHeight =
                maxCollection > 0 ? (item.received / maxCollection) * 100 : 0;

              return (
                <div
                  key={item.month}
                  className="flex-1 h-full flex flex-col justify-end"
                >
                  <div className="flex-1 flex items-end justify-center gap-1">
                    <div
                      className="w-[18px] bg-[#DDE7E2] rounded-t-md hover:bg-[#C9D8D1] transition-all"
                      style={{ height: `${expectedHeight}%` }}
                      title={`Expected: ${formatCurrency(item.expected)}`}
                    />

                    <div
                      className="w-[18px] bg-[#1F453B] rounded-t-md hover:bg-[#17382F] transition-all"
                      style={{ height: `${receivedHeight}%` }}
                      title={`Received: ${formatCurrency(item.received)}`}
                    />
                  </div>

                  <div className="text-center text-[10px] text-[#8A9697] mt-2">
                    {item.month}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-5 mt-4 pt-3 border-t border-[rgba(31,69,59,0.08)]">
            <div className="flex items-center gap-1.5 text-[10px] text-[#7A8889]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#DDE7E2]" />
              Expected
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-[#7A8889]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#1F453B]" />
              Received
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader
            title="Collection Summary"
            subtitle="Current payment position"
          />

          <div className="flex items-center justify-center py-3">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#EEF1EF"
                  strokeWidth="10"
                />

                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#1F453B"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${collectionRate * 2.513} 251.3`}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[25px] font-bold text-[#263536]">
                  {collectionRate}%
                </div>

                <div className="text-[10px] text-[#8A9697]">Collected</div>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-2">
            <div className="flex justify-between text-[12px]">
              <span className="text-[#7A8889]">Total payable</span>
              <span className="font-semibold text-[#333333]">
                {formatCurrency(data.summary.totalPayable, true)}
              </span>
            </div>

            <div className="flex justify-between text-[12px]">
              <span className="text-[#7A8889]">Collected</span>
              <span className="font-semibold text-[#276749]">
                {formatCurrency(data.summary.totalPaid, true)}
              </span>
            </div>

            <div className="flex justify-between text-[12px]">
              <span className="text-[#7A8889]">Outstanding</span>
              <span className="font-semibold text-[#9B3D3D]">
                {formatCurrency(data.summary.outstanding, true)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* ======================================================
          PAYMENT SCHEDULES
      ======================================================= */}

      <Card className="mt-3 p-5">
        <SectionHeader
          title="Payment Schedules"
          subtitle="Overview of active financial schedules"
          action={
            <button
              onClick={goToPaymentSchedules}
              className="text-[11px] font-semibold text-[#1F453B] inline-flex items-center gap-1"
            >
              View all
              <ChevronRight size={13} />
            </button>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[rgba(31,69,59,0.08)]">
                <th className="text-left py-2.5 pr-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
                  Schedule
                </th>

                <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
                  Contract
                </th>

                <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
                  Payable
                </th>

                <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
                  Progress
                </th>

                <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
                  Next Due
                </th>

                <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
                  Status
                </th>

                <th className="text-right py-2.5 pl-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {data.paymentSchedules.map((schedule) => {
                const progress = getProgress(schedule.paid, schedule.payable);

                return (
                  <tr
                    key={schedule.id}
                    className="border-b border-[rgba(31,69,59,0.06)] last:border-0 hover:bg-[#FAFBFA]"
                  >
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-[#EEF3F0] flex items-center justify-center shrink-0">
                          <CreditCard size={13} className="text-[#1F453B]" />
                        </div>

                        <div>
                          <div className="font-semibold text-[#333333]">
                            {schedule.title}
                          </div>

                          <div className="text-[10px] text-[#8A9697] mt-0.5">
                            {schedule.project}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-[#667375] whitespace-nowrap">
                      {formatCurrency(schedule.contractValue, true)}
                    </td>

                    <td className="px-3 py-3 text-[#667375] whitespace-nowrap">
                      {formatCurrency(schedule.payable, true)}
                    </td>

                    <td className="px-3 py-3 min-w-[150px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-[#8A9697]">
                          {progress}%
                        </span>

                        <span className="text-[10px] text-[#8A9697]">
                          {formatCurrency(schedule.paid, true)}
                        </span>
                      </div>

                      <div className="h-1.5 rounded-full bg-[#EEF1EF] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#1F453B]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      {schedule.nextDue ? (
                        <div>
                          <div className="text-[#4F5B5D]">
                            {formatDate(schedule.nextDue)}
                          </div>

                          <div className="text-[10px] text-[#8A9697] mt-0.5">
                            {formatCurrency(schedule.nextAmount, true)}
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <StatusBadge status={schedule.status} />
                    </td>

                    <td className="pl-3 py-3 text-right">
                      <button
                        onClick={() =>
                          nav(`/ledger/payment-schedule/${schedule.id}`)
                        }
                        className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333]"
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ======================================================
          UPCOMING + OVERDUE
      ======================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-3">
        <Card className="p-5">
          <SectionHeader
            title="Upcoming Payments"
            subtitle={`${formatCurrency(totalUpcoming, true)} due in upcoming milestones`}
          />

          <div className="space-y-1">
            {data.upcomingPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F7F9F8] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EEF3F0] flex items-center justify-center shrink-0">
                  <CalendarDays size={14} className="text-[#1F453B]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold text-[#333333] truncate">
                    {payment.project}
                  </div>

                  <div className="text-[10px] text-[#8A9697] mt-0.5 truncate">
                    {payment.milestone}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[12px] font-semibold text-[#333333]">
                    {formatCurrency(payment.amount, true)}
                  </div>

                  <div className="text-[10px] text-[#8A9697] mt-0.5">
                    {formatDate(payment.dueDate)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={goToPaymentSchedules}
            className="w-full mt-3 h-9 rounded-lg border border-[rgba(31,69,59,0.1)] text-[11px] font-semibold text-[#1F453B] hover:bg-[#F4F6F7]"
          >
            View all upcoming payments
          </button>
        </Card>

        <Card className="p-5">
          <SectionHeader
            title="Overdue Payments"
            subtitle={`${formatCurrency(totalOverdue, true)} currently overdue`}
          />

          <div className="space-y-1">
            {data.overduePayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FCF7F7] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FBEAEA] flex items-center justify-center shrink-0">
                  <AlertCircle size={14} className="text-[#9B3D3D]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold text-[#333333] truncate">
                    {payment.project}
                  </div>

                  <div className="text-[10px] text-[#9B3D3D] mt-0.5">
                    {payment.daysOverdue} days overdue
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[12px] font-semibold text-[#9B3D3D]">
                    {formatCurrency(payment.amount, true)}
                  </div>

                  <div className="text-[10px] text-[#8A9697] mt-0.5">
                    Due {formatDate(payment.dueDate)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={goToPaymentSchedules}
            className="w-full mt-3 h-9 rounded-lg bg-[#FBEAEA] text-[#9B3D3D] text-[11px] font-semibold hover:bg-[#F8E2E2]"
          >
            Review overdue payments
          </button>
        </Card>
      </div>

      {/* ======================================================
          RECENT PAYMENTS + ACTIVITY
      ======================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-3 mt-3">
        <Card className="p-5">
          <SectionHeader
            title="Recent Payments"
            subtitle="Latest transactions received"
            action={
              <button
                onClick={goToPaymentSchedules}
                className="text-[11px] font-semibold text-[#1F453B]"
              >
                View ledger
              </button>
            }
          />

          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[rgba(31,69,59,0.08)]">
                  <th className="text-left py-2 text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
                    Project
                  </th>

                  <th className="text-left py-2 px-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
                    Milestone
                  </th>

                  <th className="text-left py-2 px-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
                    Method
                  </th>

                  <th className="text-right py-2 pl-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.recentPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-[rgba(31,69,59,0.06)] last:border-0"
                  >
                    <td className="py-3 font-semibold text-[#333333]">
                      {payment.project}
                    </td>

                    <td className="px-3 py-3 text-[#667375]">
                      {payment.milestone}
                    </td>

                    <td className="px-3 py-3 text-[#8A9697]">
                      {payment.method}
                    </td>

                    <td className="pl-3 py-3 text-right">
                      <div className="font-semibold text-[#276749]">
                        +{formatCurrency(payment.amount, true)}
                      </div>

                      <div className="text-[10px] text-[#8A9697] mt-0.5">
                        {formatDate(payment.date)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader
            title="Recent Activity"
            subtitle="Latest ledger events"
          />

          <div className="space-y-4">
            {data.recentActivity.map((activity, index) => {
              const icons = {
                payment: Banknote,
                schedule: CreditCard,
                milestone: CheckCircle2,
                overdue: AlertCircle,
              };

              const Icon = icons[activity.type] || Activity;

              return (
                <div key={activity.id} className="flex gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-lg bg-[#EEF3F0] flex items-center justify-center">
                      <Icon
                        size={14}
                        className={
                          activity.type === "overdue"
                            ? "text-[#9B3D3D]"
                            : "text-[#1F453B]"
                        }
                      />
                    </div>

                    {index < data.recentActivity.length - 1 && (
                      <div className="absolute left-1/2 top-8 w-px h-6 bg-[#E4E9E6]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold text-[#333333]">
                      {activity.title}
                    </div>

                    <div className="text-[10px] text-[#7A8889] mt-0.5 leading-4">
                      {activity.description}
                    </div>

                    <div className="text-[9px] text-[#A0AAAB] mt-1">
                      {activity.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ======================================================
          QUICK ACTIONS
      ======================================================= */}

      <Card className="mt-3 p-5">
        <SectionHeader
          title="Quick Actions"
          subtitle="Common ledger operations"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={createPaymentSchedule}
            className="p-4 rounded-lg border border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] text-left transition-colors"
          >
            <CreditCard size={17} className="text-[#1F453B]" />

            <div className="mt-3 text-[12px] font-semibold text-[#333333]">
              New Payment Schedule
            </div>

            <div className="mt-1 text-[10px] text-[#8A9697]">
              Create a milestone-based payment plan
            </div>
          </button>

          <button
            onClick={goToPaymentSchedules}
            className="p-4 rounded-lg border border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] text-left transition-colors"
          >
            <FileText size={17} className="text-[#1F453B]" />

            <div className="mt-3 text-[12px] font-semibold text-[#333333]">
              Payment Schedules
            </div>

            <div className="mt-1 text-[10px] text-[#8A9697]">
              Manage all project payment schedules
            </div>
          </button>

          <button
            onClick={goToPaymentSchedules}
            className="p-4 rounded-lg border border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] text-left transition-colors"
          >
            <Receipt size={17} className="text-[#1F453B]" />

            <div className="mt-3 text-[12px] font-semibold text-[#333333]">
              Pending Milestones
            </div>

            <div className="mt-1 text-[10px] text-[#8A9697]">
              Review pending payment milestones
            </div>
          </button>

          <button
            onClick={goToPaymentSchedules}
            className="p-4 rounded-lg border border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] text-left transition-colors"
          >
            <Landmark size={17} className="text-[#1F453B]" />

            <div className="mt-3 text-[12px] font-semibold text-[#333333]">
              Outstanding
            </div>

            <div className="mt-1 text-[10px] text-[#8A9697]">
              Review outstanding receivables
            </div>
          </button>
        </div>
      </Card>
    </Shell>
  );
}
