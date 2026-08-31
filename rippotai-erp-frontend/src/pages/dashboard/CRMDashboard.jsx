import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  CreditCard,
  FileCheck2,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MapPin,
  Plus,
  RefreshCw,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  AlertCircle,
  CircleDollarSign,
} from "lucide-react";

import { Shell, Card } from "../../hooks/shared";

/* ==========================================================================
   MOCK DATA
   ========================================================================== */

const MOCK_DASHBOARD = {
  leads: {
    total: 128,
    new: 18,
    active: 74,
    won: 27,
    lost: 9,
    previousTotal: 116,
    conversionRate: 21.1,
  },

  projects: {
    total: 42,
    active: 16,
    upcoming: 9,
    completed: 17,
  },

  projectBriefs: {
    total: 31,
    drafts: 8,
    underReview: 6,
    approved: 17,
  },

  siteRecce: {
    total: 24,
    pending: 7,
    completed: 17,
  },

  plansOfAction: {
    total: 19,
    active: 12,
    overduePhases: 4,
    completed: 7,
  },

  scopeOfWork: {
    total: 28,
    drafts: 7,
    review: 5,
    approved: 16,
  },

  paymentSchedules: {
    total: 18,
    active: 13,
    payableAmount: 18450000,
    pendingMilestones: 8,
  },

  recentActivity: [
    {
      id: 1,
      type: "lead",
      title: "New lead created",
      description: "Aarav Mehta added as a new commercial lead",
      user: "Priya Sharma",
      time: "12 min ago",
      icon: UserPlus,
    },
    {
      id: 2,
      type: "brief",
      title: "Project Brief approved",
      description: "Verde Residence — Project Brief v3 approved",
      user: "Rohan Kapoor",
      time: "38 min ago",
      icon: FileCheck2,
    },
    {
      id: 3,
      type: "recce",
      title: "Site Recce completed",
      description: "Palm Avenue Residence site recce marked completed",
      user: "Amit Singh",
      time: "1 hr ago",
      icon: MapPin,
    },
    {
      id: 4,
      type: "scope",
      title: "Scope of Work submitted",
      description: "Skyline Office — SOW moved to review",
      user: "Neha Verma",
      time: "2 hrs ago",
      icon: FileText,
    },
    {
      id: 5,
      type: "payment",
      title: "Payment milestone updated",
      description: "₹4,50,000 milestone marked as payable",
      user: "Finance Team",
      time: "3 hrs ago",
      icon: CreditCard,
    },
    {
      id: 6,
      type: "plan",
      title: "Plan of Action updated",
      description: "Execution plan updated with 3 new phases",
      user: "Rohan Kapoor",
      time: "5 hrs ago",
      icon: ClipboardList,
    },
  ],

  upcomingDeadlines: [
    {
      id: 1,
      title: "Site Recce",
      project: "Green Valley Residence",
      date: "31 Aug 2026",
      time: "11:00 AM",
      type: "recce",
      priority: "high",
    },
    {
      id: 2,
      title: "Scope of Work review",
      project: "Palm Avenue Residence",
      date: "01 Sep 2026",
      time: "03:00 PM",
      type: "scope",
      priority: "high",
    },
    {
      id: 3,
      title: "Payment milestone",
      project: "Verde Residence",
      date: "02 Sep 2026",
      time: "10:00 AM",
      type: "payment",
      priority: "medium",
    },
    {
      id: 4,
      title: "Plan phase deadline",
      project: "Skyline Office",
      date: "03 Sep 2026",
      time: "06:00 PM",
      type: "plan",
      priority: "medium",
    },
    {
      id: 5,
      title: "Project Brief approval",
      project: "Urban Nest",
      date: "04 Sep 2026",
      time: "12:00 PM",
      type: "brief",
      priority: "low",
    },
  ],
};

/* ==========================================================================
   HELPERS
   ========================================================================== */

const formatCurrency = (value) => {
  if (value === null || value === undefined) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-IN").format(value || 0);
};

const getActivityIconClass = (type) => {
  switch (type) {
    case "lead":
      return "bg-[#EAF1F8] text-[#315A7D]";

    case "brief":
      return "bg-[#E8F3EE] text-[#1F453B]";

    case "recce":
      return "bg-[#FFF4DC] text-[#8A6500]";

    case "scope":
      return "bg-[#F0ECF8] text-[#684A8A]";

    case "payment":
      return "bg-[#EAF1F8] text-[#315A7D]";

    case "plan":
      return "bg-[#F4F6F7] text-[#5F6B6D]";

    default:
      return "bg-[#F4F6F7] text-[#5F6B6D]";
  }
};

const getDeadlineIcon = (type) => {
  switch (type) {
    case "recce":
      return MapPin;

    case "scope":
      return FileText;

    case "payment":
      return CreditCard;

    case "plan":
      return ClipboardList;

    case "brief":
      return FileCheck2;

    default:
      return CalendarDays;
  }
};

const getPriorityClass = (priority) => {
  switch (priority) {
    case "high":
      return "bg-[#FBEAEA] text-[#9B3D3D]";

    case "medium":
      return "bg-[#FFF4DC] text-[#8A6500]";

    default:
      return "bg-[#EAF1F8] text-[#315A7D]";
  }
};

/* ==========================================================================
   SMALL COMPONENTS
   ========================================================================== */

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  href,
}) {
  const nav = useNavigate();

  return (
    <button
      type="button"
      onClick={() => href && nav(href)}
      className="text-left w-full group"
    >
      <Card className="h-full hover:border-[rgba(31,69,59,0.2)] hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7A8889]">
              {title}
            </div>

            <div className="mt-2 text-[27px] leading-none font-bold text-[#263335]">
              {value}
            </div>

            {subtitle && (
              <div className="mt-2 text-[12px] text-[#7A8889]">{subtitle}</div>
            )}
          </div>

          <div className="w-10 h-10 rounded-xl bg-[#EEF3F0] flex items-center justify-center shrink-0">
            <Icon size={18} className="text-[#1F453B]" />
          </div>
        </div>

        {trend !== undefined && (
          <div className="mt-4 flex items-center gap-1.5">
            {trend >= 0 ? (
              <ArrowUpRight size={14} className="text-[#276749]" />
            ) : (
              <ArrowDownRight size={14} className="text-[#9B3D3D]" />
            )}

            <span
              className={`text-[12px] font-semibold ${
                trend >= 0 ? "text-[#276749]" : "text-[#9B3D3D]"
              }`}
            >
              {Math.abs(trend)}%
            </span>

            <span className="text-[12px] text-[#8A9697]">
              {trendLabel || "vs last period"}
            </span>
          </div>
        )}

        {href && (
          <div className="mt-4 flex items-center gap-1 text-[12px] font-semibold text-[#1F453B] opacity-0 group-hover:opacity-100 transition-opacity">
            View details
            <ChevronRight size={13} />
          </div>
        )}
      </Card>
    </button>
  );
}

function SectionHeader({ title, subtitle, href, action = "View all" }) {
  const nav = useNavigate();

  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <div>
        <h2 className="text-[16px] font-bold text-[#263335]">{title}</h2>

        {subtitle && (
          <p className="text-[12px] text-[#8A9697] mt-0.5">{subtitle}</p>
        )}
      </div>

      {href && (
        <button
          type="button"
          onClick={() => nav(href)}
          className="text-[12px] font-semibold text-[#1F453B] inline-flex items-center gap-1 hover:underline"
        >
          {action}
          <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
}

function ProgressBar({ value, total }) {
  const percentage =
    total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

  return (
    <div className="mt-3">
      <div className="h-1.5 bg-[#EDF0EF] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1F453B] rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-1.5 text-[11px] text-[#8A9697]">
        {percentage}% complete
      </div>
    </div>
  );
}

/* ==========================================================================
   DASHBOARD
   ========================================================================== */

export default function CRMDashboard() {
  const nav = useNavigate();
  const [activityFilter, setActivityFilter] = useState("ALL");

  const data = MOCK_DASHBOARD;

  const filteredActivity = useMemo(() => {
    if (activityFilter === "ALL") {
      return data.recentActivity;
    }

    return data.recentActivity.filter(
      (activity) => activity.type === activityFilter,
    );
  }, [activityFilter, data.recentActivity]);

  return (
    <Shell
      title="CRM Dashboard"
      subtitle="Overview of your sales, projects and delivery workflow"
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-10 px-3 rounded-lg border border-[#DDE4E0] bg-white text-[#4E5A5C] text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#F7F9F8]"
          >
            <RefreshCw size={14} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => nav("/crm/leads/new")}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#17382F]"
          >
            <Plus size={14} />
            New Lead
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ================================================================
            TOP OVERVIEW
        ================================================================= */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Leads"
            value={formatNumber(data.leads.total)}
            subtitle={`${data.leads.new} new this period`}
            icon={Users}
            trend={10.3}
            href="/crm/leads"
          />

          <StatCard
            title="Active Projects"
            value={formatNumber(data.projects.active)}
            subtitle={`${data.projects.upcoming} upcoming`}
            icon={BriefcaseBusiness}
            trend={6.7}
            href="/projects"
          />

          <StatCard
            title="Active Plans"
            value={formatNumber(data.plansOfAction.active)}
            subtitle={`${data.plansOfAction.overduePhases} overdue phases`}
            icon={ClipboardList}
            trend={4.2}
            href="/plan-of-actions"
          />

          <StatCard
            title="Payable Amount"
            value={formatCurrency(data.paymentSchedules.payableAmount)}
            subtitle={`${data.paymentSchedules.pendingMilestones} pending milestones`}
            icon={CircleDollarSign}
            trend={-2.4}
            href="/ledger/payment-schedule/all"
          />
        </div>

        {/* ================================================================
            LEADS + PROJECTS
        ================================================================= */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Leads */}

          <Card>
            <SectionHeader
              title="Leads"
              subtitle="Current sales pipeline"
              href="/crm/leads"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-[#F7F9F8] p-3">
                <div className="text-[11px] uppercase tracking-[0.1em] text-[#8A9697]">
                  Total
                </div>

                <div className="mt-1 text-[21px] font-bold text-[#263335]">
                  {data.leads.total}
                </div>
              </div>

              <div className="rounded-xl bg-[#EAF1F8] p-3">
                <div className="text-[11px] uppercase tracking-[0.1em] text-[#315A7D]">
                  New
                </div>

                <div className="mt-1 text-[21px] font-bold text-[#263335]">
                  {data.leads.new}
                </div>
              </div>

              <div className="rounded-xl bg-[#FFF4DC] p-3">
                <div className="text-[11px] uppercase tracking-[0.1em] text-[#8A6500]">
                  Active
                </div>

                <div className="mt-1 text-[21px] font-bold text-[#263335]">
                  {data.leads.active}
                </div>
              </div>

              <div className="rounded-xl bg-[#E8F3EE] p-3">
                <div className="text-[11px] uppercase tracking-[0.1em] text-[#276749]">
                  Won
                </div>

                <div className="mt-1 text-[21px] font-bold text-[#263335]">
                  {data.leads.won}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#6B7B7C]">
                    Won / Total
                  </span>

                  <span className="text-[12px] font-semibold text-[#1F453B]">
                    {data.leads.conversionRate}%
                  </span>
                </div>

                <ProgressBar value={data.leads.won} total={data.leads.total} />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#6B7B7C]">Lost</span>

                  <span className="text-[12px] font-semibold text-[#9B3D3D]">
                    {data.leads.lost}
                  </span>
                </div>

                <ProgressBar value={data.leads.lost} total={data.leads.total} />
              </div>
            </div>
          </Card>

          {/* Projects */}

          <Card>
            <SectionHeader
              title="Projects"
              subtitle="Project portfolio overview"
              href="/projects"
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-[#E6EBE8] p-3">
                <div className="w-9 h-9 rounded-lg bg-[#E8F3EE] flex items-center justify-center">
                  <FolderKanban size={17} className="text-[#1F453B]" />
                </div>

                <div>
                  <div className="text-[20px] font-bold text-[#263335]">
                    {data.projects.active}
                  </div>

                  <div className="text-[11px] text-[#8A9697]">
                    Active projects
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-[#E6EBE8] p-3">
                <div className="w-9 h-9 rounded-lg bg-[#EAF1F8] flex items-center justify-center">
                  <CalendarDays size={17} className="text-[#315A7D]" />
                </div>

                <div>
                  <div className="text-[20px] font-bold text-[#263335]">
                    {data.projects.upcoming}
                  </div>

                  <div className="text-[11px] text-[#8A9697]">Upcoming</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-[#E6EBE8] p-3">
                <div className="w-9 h-9 rounded-lg bg-[#F4F6F7] flex items-center justify-center">
                  <CheckCircle2 size={17} className="text-[#5F6B6D]" />
                </div>

                <div>
                  <div className="text-[20px] font-bold text-[#263335]">
                    {data.projects.completed}
                  </div>

                  <div className="text-[11px] text-[#8A9697]">Completed</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-[#E6EBE8] p-3">
                <div className="w-9 h-9 rounded-lg bg-[#F0ECF8] flex items-center justify-center">
                  <BriefcaseBusiness size={17} className="text-[#684A8A]" />
                </div>

                <div>
                  <div className="text-[20px] font-bold text-[#263335]">
                    {data.projects.total}
                  </div>

                  <div className="text-[11px] text-[#8A9697]">
                    Total projects
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ================================================================
            WORKFLOW PIPELINE
        ================================================================= */}

        <Card>
          <SectionHeader
            title="Project Workflow"
            subtitle="Status across project documentation and execution"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Project Brief */}

            <button
              type="button"
              onClick={() => nav("/crm/brief/all")}
              className="text-left rounded-xl border border-[#E5EBE7] p-4 hover:bg-[#F8FAF9] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-[#E8F3EE] flex items-center justify-center">
                  <FileText size={17} className="text-[#1F453B]" />
                </div>

                <ChevronRight size={15} className="text-[#A0AAAB]" />
              </div>

              <div className="mt-3 text-[14px] font-bold text-[#333333]">
                Project Briefs
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-[22px] font-bold text-[#263335]">
                    {data.projectBriefs.total}
                  </div>

                  <div className="text-[11px] text-[#8A9697]">total briefs</div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-[#6B7B7C]">Draft</div>

                  <div className="text-[13px] font-semibold">
                    {data.projectBriefs.drafts}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-1">
                <div
                  className="h-1.5 rounded-full bg-[#B7C9BF]"
                  style={{
                    width: `${
                      (data.projectBriefs.drafts / data.projectBriefs.total) *
                      100
                    }%`,
                  }}
                />

                <div
                  className="h-1.5 rounded-full bg-[#8EA9B8]"
                  style={{
                    width: `${
                      (data.projectBriefs.underReview /
                        data.projectBriefs.total) *
                      100
                    }%`,
                  }}
                />

                <div
                  className="h-1.5 rounded-full bg-[#1F453B]"
                  style={{
                    width: `${
                      (data.projectBriefs.approved / data.projectBriefs.total) *
                      100
                    }%`,
                  }}
                />
              </div>

              <div className="mt-2 flex justify-between text-[10px] text-[#8A9697]">
                <span>{data.projectBriefs.drafts} drafts</span>
                <span>{data.projectBriefs.underReview} review</span>
                <span>{data.projectBriefs.approved} approved</span>
              </div>
            </button>

            {/* Site Recce */}

            <button
              type="button"
              onClick={() => nav("/site-recce")}
              className="text-left rounded-xl border border-[#E5EBE7] p-4 hover:bg-[#F8FAF9] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-[#FFF4DC] flex items-center justify-center">
                  <MapPin size={17} className="text-[#8A6500]" />
                </div>

                <ChevronRight size={15} className="text-[#A0AAAB]" />
              </div>

              <div className="mt-3 text-[14px] font-bold text-[#333333]">
                Site Recce
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-[22px] font-bold text-[#263335]">
                    {data.siteRecce.total}
                  </div>

                  <div className="text-[11px] text-[#8A9697]">total recce</div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-[#6B7B7C]">Pending</div>

                  <div className="text-[13px] font-semibold text-[#8A6500]">
                    {data.siteRecce.pending}
                  </div>
                </div>
              </div>

              <ProgressBar
                value={data.siteRecce.completed}
                total={data.siteRecce.total}
              />

              <div className="text-[11px] text-[#6B7B7C]">
                {data.siteRecce.completed} completed
              </div>
            </button>

            {/* Plan of Action */}

            <button
              type="button"
              onClick={() => nav("/plan-of-actions")}
              className="text-left rounded-xl border border-[#E5EBE7] p-4 hover:bg-[#F8FAF9] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-[#F4F6F7] flex items-center justify-center">
                  <ClipboardList size={17} className="text-[#5F6B6D]" />
                </div>

                <ChevronRight size={15} className="text-[#A0AAAB]" />
              </div>

              <div className="mt-3 text-[14px] font-bold text-[#333333]">
                Plans of Action
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-[22px] font-bold text-[#263335]">
                    {data.plansOfAction.active}
                  </div>

                  <div className="text-[11px] text-[#8A9697]">active plans</div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-[#9B3D3D]">Overdue</div>

                  <div className="text-[13px] font-semibold text-[#9B3D3D]">
                    {data.plansOfAction.overduePhases}
                  </div>
                </div>
              </div>

              <ProgressBar
                value={data.plansOfAction.completed}
                total={data.plansOfAction.total}
              />
            </button>

            {/* Scope of Work */}

            <button
              type="button"
              onClick={() => nav("/scope-of-work")}
              className="text-left rounded-xl border border-[#E5EBE7] p-4 hover:bg-[#F8FAF9] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-[#F0ECF8] flex items-center justify-center">
                  <FileCheck2 size={17} className="text-[#684A8A]" />
                </div>

                <ChevronRight size={15} className="text-[#A0AAAB]" />
              </div>

              <div className="mt-3 text-[14px] font-bold text-[#333333]">
                Scope of Work
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-[22px] font-bold text-[#263335]">
                    {data.scopeOfWork.total}
                  </div>

                  <div className="text-[11px] text-[#8A9697]">
                    total documents
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-[#6B7B7C]">Review</div>

                  <div className="text-[13px] font-semibold">
                    {data.scopeOfWork.review}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 text-[11px]">
                <span className="text-[#6B7B7C]">
                  {data.scopeOfWork.drafts} drafts
                </span>

                <span className="text-[#684A8A]">
                  {data.scopeOfWork.review} review
                </span>

                <span className="text-[#1F453B]">
                  {data.scopeOfWork.approved} approved
                </span>
              </div>
            </button>
          </div>
        </Card>

        {/* ================================================================
            PAYMENT + DEADLINES
        ================================================================= */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Payment Schedule */}

          <Card className="xl:col-span-1">
            <SectionHeader
              title="Payment Schedules"
              subtitle="Financial commitments"
              href="/ledger/payment-schedule/all"
            />

            <div className="rounded-xl bg-[#F7F9F8] p-4">
              <div className="text-[11px] uppercase tracking-[0.1em] text-[#8A9697]">
                Total Payable
              </div>

              <div className="mt-1 text-[25px] font-bold text-[#263335]">
                {formatCurrency(data.paymentSchedules.payableAmount)}
              </div>

              <div className="mt-2 text-[12px] text-[#6B7B7C]">
                Across {data.paymentSchedules.active} active schedules
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#6B7B7C]">
                  Active schedules
                </span>

                <span className="font-semibold text-[#263335]">
                  {data.paymentSchedules.active}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#6B7B7C]">
                  Pending milestones
                </span>

                <span className="font-semibold text-[#8A6500]">
                  {data.paymentSchedules.pendingMilestones}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#6B7B7C]">
                  Total schedules
                </span>

                <span className="font-semibold text-[#263335]">
                  {data.paymentSchedules.total}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => nav("/ledger/payment-schedule/all")}
              className="mt-5 w-full h-9 rounded-lg border border-[#DCE4DF] text-[12px] font-semibold text-[#1F453B] hover:bg-[#F7F9F8]"
            >
              Manage payment schedules
            </button>
          </Card>

          {/* Upcoming deadlines */}

          <Card className="xl:col-span-2">
            <SectionHeader
              title="Upcoming Deadlines"
              subtitle="Items requiring attention"
              href="/calendar"
            />

            <div className="divide-y divide-[#EDF0EF]">
              {data.upcomingDeadlines.map((item) => {
                const Icon = getDeadlineIcon(item.type);

                return (
                  <button
                    type="button"
                    key={item.id}
                    className="w-full text-left py-3 flex items-center gap-3 hover:bg-[#FAFBFA] transition-colors rounded-lg px-2"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#F4F6F7] flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-[#5F6B6D]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[#333333] truncate">
                        {item.title}
                      </div>

                      <div className="text-[11px] text-[#8A9697] mt-0.5 truncate">
                        {item.project}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[12px] font-semibold text-[#4E5A5C]">
                        {item.date}
                      </div>

                      <div className="text-[11px] text-[#8A9697] mt-0.5">
                        {item.time}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${getPriorityClass(
                        item.priority,
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ================================================================
            ACTIVITY + QUICK ACTIONS
        ================================================================= */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Recent Activity */}

          <Card className="xl:col-span-2">
            <SectionHeader
              title="Recent Activity"
              subtitle="Latest changes across your CRM"
            />

            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
              {[
                ["ALL", "All"],
                ["lead", "Leads"],
                ["brief", "Briefs"],
                ["recce", "Recce"],
                ["scope", "SOW"],
                ["payment", "Payments"],
                ["plan", "Plans"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setActivityFilter(value)}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${
                    activityFilter === value
                      ? "bg-[#1F453B] text-white"
                      : "bg-[#F4F6F7] text-[#667375] hover:bg-[#EAEEEC]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              {filteredActivity.map((activity) => {
                const Icon = activity.icon;

                return (
                  <div
                    key={activity.id}
                    className="flex gap-3 p-3 rounded-xl hover:bg-[#FAFBFA] transition-colors"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${getActivityIconClass(
                        activity.type,
                      )}`}
                    >
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-[13px] font-semibold text-[#333333]">
                          {activity.title}
                        </div>

                        <div className="text-[10px] text-[#9AA5A6] whitespace-nowrap">
                          {activity.time}
                        </div>
                      </div>

                      <div className="text-[12px] text-[#6B7B7C] mt-0.5">
                        {activity.description}
                      </div>

                      <div className="text-[10px] text-[#9AA5A6] mt-1">
                        by {activity.user}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Quick Actions */}

          <Card>
            <SectionHeader
              title="Quick Actions"
              subtitle="Start common workflows"
            />

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => nav("/crm/leads/new")}
                className="group flex items-center gap-3 p-3 rounded-xl border border-[#E5EBE7] hover:bg-[#F7F9F8] text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EAF1F8] flex items-center justify-center">
                  <UserPlus size={16} className="text-[#315A7D]" />
                </div>

                <div className="flex-1">
                  <div className="text-[12px] font-semibold text-[#333333]">
                    New Lead
                  </div>

                  <div className="text-[10px] text-[#8A9697]">
                    Add a new opportunity
                  </div>
                </div>

                <ChevronRight
                  size={14}
                  className="text-[#A0AAAB] group-hover:translate-x-0.5 transition-transform"
                />
              </button>

              <button
                type="button"
                onClick={() => nav("/crm/forms/project-brief")}
                className="group flex items-center gap-3 p-3 rounded-xl border border-[#E5EBE7] hover:bg-[#F7F9F8] text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-[#E8F3EE] flex items-center justify-center">
                  <FileText size={16} className="text-[#1F453B]" />
                </div>

                <div className="flex-1">
                  <div className="text-[12px] font-semibold text-[#333333]">
                    Project Brief
                  </div>

                  <div className="text-[10px] text-[#8A9697]">
                    Create a new project brief
                  </div>
                </div>

                <ChevronRight
                  size={14}
                  className="text-[#A0AAAB] group-hover:translate-x-0.5 transition-transform"
                />
              </button>

              <button
                type="button"
                onClick={() => nav("/crm/forms/plan-of-action")}
                className="group flex items-center gap-3 p-3 rounded-xl border border-[#E5EBE7] hover:bg-[#F7F9F8] text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-[#F4F6F7] flex items-center justify-center">
                  <ClipboardList size={16} className="text-[#5F6B6D]" />
                </div>

                <div className="flex-1">
                  <div className="text-[12px] font-semibold text-[#333333]">
                    Plan of Action
                  </div>

                  <div className="text-[10px] text-[#8A9697]">
                    Start an execution plan
                  </div>
                </div>

                <ChevronRight
                  size={14}
                  className="text-[#A0AAAB] group-hover:translate-x-0.5 transition-transform"
                />
              </button>

              <button
                type="button"
                onClick={() => nav("/crm/forms/scope-of-work")}
                className="group flex items-center gap-3 p-3 rounded-xl border border-[#E5EBE7] hover:bg-[#F7F9F8] text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-[#F0ECF8] flex items-center justify-center">
                  <FileCheck2 size={16} className="text-[#684A8A]" />
                </div>

                <div className="flex-1">
                  <div className="text-[12px] font-semibold text-[#333333]">
                    Scope of Work
                  </div>

                  <div className="text-[10px] text-[#8A9697]">
                    Create project scope
                  </div>
                </div>

                <ChevronRight
                  size={14}
                  className="text-[#A0AAAB] group-hover:translate-x-0.5 transition-transform"
                />
              </button>

              <button
                type="button"
                onClick={() => nav("/ledger/forms/payment-schedule")}
                className="group flex items-center gap-3 p-3 rounded-xl border border-[#E5EBE7] hover:bg-[#F7F9F8] text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EAF1F8] flex items-center justify-center">
                  <CreditCard size={16} className="text-[#315A7D]" />
                </div>

                <div className="flex-1">
                  <div className="text-[12px] font-semibold text-[#333333]">
                    Payment Schedule
                  </div>

                  <div className="text-[10px] text-[#8A9697]">
                    Create payment milestones
                  </div>
                </div>

                <ChevronRight
                  size={14}
                  className="text-[#A0AAAB] group-hover:translate-x-0.5 transition-transform"
                />
              </button>
            </div>
          </Card>
        </div>

        {/* ================================================================
            ATTENTION STRIP
        ================================================================= */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => nav("/plan-of-actions")}
            className="flex items-center gap-3 p-4 rounded-xl border border-[#F0DADA] bg-[#FEF9F9] text-left hover:bg-[#FDF5F5]"
          >
            <div className="w-9 h-9 rounded-lg bg-[#FBEAEA] flex items-center justify-center">
              <AlertCircle size={17} className="text-[#9B3D3D]" />
            </div>

            <div>
              <div className="text-[13px] font-bold text-[#333333]">
                {data.plansOfAction.overduePhases} overdue phases
              </div>

              <div className="text-[11px] text-[#8A9697] mt-0.5">
                Require immediate attention
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => nav("/site-recce")}
            className="flex items-center gap-3 p-4 rounded-xl border border-[#F1E5C7] bg-[#FFFDF7] text-left hover:bg-[#FFF9EC]"
          >
            <div className="w-9 h-9 rounded-lg bg-[#FFF4DC] flex items-center justify-center">
              <Clock3 size={17} className="text-[#8A6500]" />
            </div>

            <div>
              <div className="text-[13px] font-bold text-[#333333]">
                {data.siteRecce.pending} pending site recce
              </div>

              <div className="text-[11px] text-[#8A9697] mt-0.5">
                Schedule the next visits
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => nav("/ledger/payment-schedule/all")}
            className="flex items-center gap-3 p-4 rounded-xl border border-[#DDE8EF] bg-[#F9FCFE] text-left hover:bg-[#F3F9FC]"
          >
            <div className="w-9 h-9 rounded-lg bg-[#EAF1F8] flex items-center justify-center">
              <Target size={17} className="text-[#315A7D]" />
            </div>

            <div>
              <div className="text-[13px] font-bold text-[#333333]">
                {data.paymentSchedules.pendingMilestones} payment milestones
              </div>

              <div className="text-[11px] text-[#8A9697] mt-0.5">
                Pending processing
              </div>
            </div>
          </button>
        </div>
      </div>
    </Shell>
  );
}
