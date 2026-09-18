import React from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  FolderKanban,
  Layers3,
  MoreHorizontal,
  PackageCheck,
  Plus,
  ReceiptIndianRupee,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Workflow,
  AlertTriangle,
  CircleAlert,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                MOCK DATA                                   */
/* -------------------------------------------------------------------------- */

const stats = [
  {
    label: "Active Projects",
    value: "24",
    change: "+12.5%",
    trend: "up",
    description: "vs last month",
    icon: FolderKanban,
  },
  {
    label: "Open Leads",
    value: "38",
    change: "+8.2%",
    trend: "up",
    description: "across all stages",
    icon: Target,
  },
  {
    label: "Pending Approvals",
    value: "11",
    change: "-18.4%",
    trend: "down",
    description: "require attention",
    icon: ClipboardCheck,
  },
  {
    label: "Team Members",
    value: "46",
    change: "+4.5%",
    trend: "up",
    description: "active users",
    icon: Users,
  },
];

const pipeline = [
  { label: "New", value: 12, percentage: 32 },
  { label: "Qualified", value: 9, percentage: 24 },
  { label: "Proposal", value: 8, percentage: 21 },
  { label: "Negotiation", value: 5, percentage: 13 },
  { label: "Won", value: 4, percentage: 10 },
];

const projects = [
  {
    name: "Verma Residence",
    client: "Mr. & Mrs. Verma",
    stage: "Execution",
    progress: 72,
    status: "On Track",
    manager: "Dhruv",
    updated: "12 min ago",
  },
  {
    name: "Aria Commercial Tower",
    client: "Aria Developers",
    stage: "Design Development",
    progress: 48,
    status: "On Track",
    manager: "Ananya",
    updated: "38 min ago",
  },
  {
    name: "Palm Grove Villa",
    client: "Rahul Mehta",
    stage: "Site Recce",
    progress: 24,
    status: "Needs Attention",
    manager: "Rohan",
    updated: "1 hr ago",
  },
  {
    name: "Studio 27",
    client: "Studio 27 Pvt. Ltd.",
    stage: "BOQ / Estimation",
    progress: 61,
    status: "On Track",
    manager: "Priya",
    updated: "2 hrs ago",
  },
];

const activity = [
  {
    title: "Project brief approved",
    description: "Verma Residence brief was approved by the client",
    time: "12 min ago",
    icon: CheckCircle2,
    type: "success",
  },
  {
    title: "New lead created",
    description: "Aria Developers added to the sales pipeline",
    time: "28 min ago",
    icon: UserPlus,
    type: "lead",
  },
  {
    title: "Site recce completed",
    description: "Palm Grove Villa site visit has been submitted",
    time: "1 hr ago",
    icon: Building2,
    type: "site",
  },
  {
    title: "Estimate updated",
    description: "Studio 27 BOQ revised by Priya Sharma",
    time: "2 hrs ago",
    icon: ReceiptIndianRupee,
    type: "estimate",
  },
  {
    title: "Documents uploaded",
    description: "12 project documents added to Aria Commercial Tower",
    time: "3 hrs ago",
    icon: FileText,
    type: "document",
  },
];

const approvals = [
  {
    title: "3 Project Briefs",
    description: "Waiting for internal approval",
    priority: "High",
    icon: FileText,
  },
  {
    title: "2 BOQ Estimates",
    description: "Ready for review",
    priority: "Medium",
    icon: ReceiptIndianRupee,
  },
  {
    title: "4 Site Recce Reports",
    description: "Awaiting project manager review",
    priority: "Medium",
    icon: Building2,
  },
  {
    title: "2 Handover Documents",
    description: "Final verification required",
    priority: "Low",
    icon: PackageCheck,
  },
];

const team = [
  {
    name: "Dhruv Verma",
    role: "Project Manager",
    initials: "DV",
    projects: 6,
    tasks: 14,
  },
  {
    name: "Ananya Sharma",
    role: "Senior Architect",
    initials: "AS",
    projects: 5,
    tasks: 11,
  },
  {
    name: "Rohan Mehta",
    role: "Site Supervisor",
    initials: "RM",
    projects: 4,
    tasks: 9,
  },
  {
    name: "Priya Sharma",
    role: "Estimator",
    initials: "PS",
    projects: 7,
    tasks: 17,
  },
];

/* -------------------------------------------------------------------------- */
/*                              HELPER COMPONENTS                              */
/* -------------------------------------------------------------------------- */

function SectionTitle({ title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="text-[15px] font-semibold text-[#293330]">{title}</h2>

        {description && (
          <p className="text-[11.5px] text-[#84908D] mt-0.5">{description}</p>
        )}
      </div>

      {action}
    </div>
  );
}

function StatCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="bg-white border border-[#E4E9E6] rounded-2xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#7B8784]">{item.label}</p>

          <div className="flex items-end gap-2 mt-2">
            <span className="text-[28px] leading-none font-semibold tracking-[-0.03em] text-[#293330]">
              {item.value}
            </span>

            <span
              className={`inline-flex items-center gap-0.5 text-[9.5px] font-semibold mb-0.5 ${
                item.trend === "up" ? "text-[#2F7654]" : "text-[#8A6B32]"
              }`}
            >
              {item.trend === "up" ? (
                <ArrowUpRight size={11} />
              ) : (
                <ArrowDownRight size={11} />
              )}

              {item.change}
            </span>
          </div>

          <p className="text-[10px] text-[#A0AAA7] mt-2">{item.description}</p>
        </div>

        <div className="w-9 h-9 rounded-xl bg-[#EDF3EF] flex items-center justify-center shrink-0">
          <Icon size={17} className="text-[#1F453B]" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isWarning = status === "Needs Attention";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-semibold ${
        isWarning
          ? "bg-[#F8F0E5] text-[#876B2F]"
          : "bg-[#EAF3ED] text-[#356B4E]"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isWarning ? "bg-[#B18A3B]" : "bg-[#3F8A62]"
        }`}
      />
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const styles = {
    High: "bg-[#F8ECE8] text-[#8A3825]",
    Medium: "bg-[#F6F0E5] text-[#876B2F]",
    Low: "bg-[#EDF3EF] text-[#356B4E]",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-[9px] font-semibold ${
        styles[priority]
      }`}
    >
      {priority}
    </span>
  );
}

function ActivityItem({ item }) {
  const Icon = item.icon;

  const styles = {
    success: {
      bg: "#EAF3ED",
      color: "#356B4E",
    },
    lead: {
      bg: "#F1EDF7",
      color: "#674A88",
    },
    site: {
      bg: "#EEF2F5",
      color: "#4A6270",
    },
    estimate: {
      bg: "#F6F0E5",
      color: "#876B2F",
    },
    document: {
      bg: "#EDF3F2",
      color: "#356B63",
    },
  };

  const style = styles[item.type] || styles.success;

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: style.bg }}
      >
        <Icon size={14} style={{ color: style.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[11.5px] font-semibold text-[#3E4B48] truncate">
          {item.title}
        </div>

        <div className="text-[10px] text-[#8B9694] truncate mt-0.5">
          {item.description}
        </div>
      </div>

      <span className="text-[9px] text-[#A0AAA7] whitespace-nowrap">
        {item.time}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              ADMIN DASHBOARD                               */
/* -------------------------------------------------------------------------- */

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#F7F8F6] text-[#333333]">
      <div className="max-w-[1600px] mx-auto px-5 md:px-7 py-6">
        {/* ---------------------------------------------------------------- */}
        {/* HEADER                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-7">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.18em] font-semibold text-[#8B9693] mb-1">
              Rippotai ERP
            </div>

            <h1 className="text-[27px] md:text-[31px] font-semibold tracking-[-0.025em] text-[#293330]">
              Admin Dashboard
            </h1>

            <p className="text-[12.5px] text-[#7B8784] mt-1">
              Overview of projects, leads, team activity and operational
              workflows.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="h-9 px-3.5 rounded-lg border border-[#DCE2DF] bg-white text-[#40504E] text-[11.5px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#F8FAF9]">
              <Settings size={14} />
              Settings
            </button>

            <button className="h-9 px-3.5 rounded-lg bg-[#1F453B] text-white text-[11.5px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#17382F]">
              <Plus size={14} />
              New Project
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* STATS                                                            */}
        {/* ---------------------------------------------------------------- */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
          {stats.map((item) => (
            <StatCard key={item.label} item={item} />
          ))}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* MAIN ROW                                                         */}
        {/* ---------------------------------------------------------------- */}

        <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_0.85fr] gap-5 mb-6">
          {/* PROJECTS */}

          <div className="bg-white border border-[#E4E9E6] rounded-2xl p-5">
            <SectionTitle
              title="Active Projects"
              description="Projects currently moving through the delivery pipeline"
              action={
                <button className="text-[10.5px] font-semibold text-[#1F453B] inline-flex items-center gap-1 hover:underline">
                  View all
                  <ArrowRight size={12} />
                </button>
              }
            />

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-[#EEF1EF]">
                    <th className="text-left pb-2 text-[9.5px] uppercase tracking-wider font-semibold text-[#9AA4A2]">
                      Project
                    </th>
                    <th className="text-left pb-2 text-[9.5px] uppercase tracking-wider font-semibold text-[#9AA4A2]">
                      Stage
                    </th>
                    <th className="text-left pb-2 text-[9.5px] uppercase tracking-wider font-semibold text-[#9AA4A2]">
                      Progress
                    </th>
                    <th className="text-left pb-2 text-[9.5px] uppercase tracking-wider font-semibold text-[#9AA4A2]">
                      Status
                    </th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {projects.map((project) => (
                    <tr
                      key={project.name}
                      className="border-b border-[#F0F2F1] last:border-0 hover:bg-[#FAFBFA]"
                    >
                      <td className="py-3 pr-3">
                        <div className="text-[11.5px] font-semibold text-[#3E4B48]">
                          {project.name}
                        </div>
                        <div className="text-[9.5px] text-[#939E9B] mt-0.5">
                          {project.client}
                        </div>
                      </td>

                      <td className="py-3 pr-3">
                        <span className="text-[10px] text-[#687572]">
                          {project.stage}
                        </span>
                      </td>

                      <td className="py-3 pr-5 w-[150px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] text-[#909A98]">
                            {project.manager}
                          </span>

                          <span className="text-[9px] font-semibold text-[#3F4C49]">
                            {project.progress}%
                          </span>
                        </div>

                        <div className="h-1.5 rounded-full bg-[#EEF1EF] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#1F453B]"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3">
                        <StatusBadge status={project.status} />
                      </td>

                      <td className="py-3 text-right">
                        <button className="w-7 h-7 rounded-md hover:bg-[#EEF2F0] inline-flex items-center justify-center text-[#8A9693]">
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* APPROVALS */}

          <div className="bg-white border border-[#E4E9E6] rounded-2xl p-5">
            <SectionTitle
              title="Pending Approvals"
              description="Items waiting for review"
              action={
                <div className="inline-flex items-center gap-1 text-[#8A3825]">
                  <CircleAlert size={12} />
                  <span className="text-[10px] font-semibold">11 pending</span>
                </div>
              }
            />

            <div className="space-y-2">
              {approvals.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#ECEFEE] hover:bg-[#FAFBFA] text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F2F4F2] flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-[#52635F]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-[#414D4A]">
                        {item.title}
                      </div>

                      <div className="text-[9.5px] text-[#929C99] mt-0.5">
                        {item.description}
                      </div>
                    </div>

                    <PriorityBadge priority={item.priority} />

                    <ChevronRight
                      size={13}
                      className="text-[#A0AAA7] shrink-0"
                    />
                  </button>
                );
              })}
            </div>

            <button className="w-full mt-3 h-8 rounded-lg bg-[#F1F5F2] text-[#1F453B] text-[10.5px] font-semibold hover:bg-[#E8F0EB]">
              Review All Approvals
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* PIPELINE + ACTIVITY                                              */}
        {/* ---------------------------------------------------------------- */}

        <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-5 mb-6">
          {/* LEAD PIPELINE */}

          <div className="bg-white border border-[#E4E9E6] rounded-2xl p-5">
            <SectionTitle
              title="Lead Pipeline"
              description="Current sales opportunity distribution"
              action={
                <button className="text-[10.5px] font-semibold text-[#1F453B]">
                  Open CRM →
                </button>
              }
            />

            <div className="flex items-center gap-5">
              <div className="relative w-[145px] h-[145px] rounded-full border-[16px] border-[#EDF1EE] shrink-0">
                <div className="absolute inset-[-16px] rounded-full border-[16px] border-transparent border-t-[#1F453B] border-r-[#4D7669] border-b-[#7E9A8F] rotate-[-30deg]" />

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[25px] font-semibold text-[#303B38]">
                    38
                  </span>

                  <span className="text-[9px] text-[#8E9996]">Open Leads</span>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                {pipeline.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10.5px] text-[#56635F]">
                        {item.label}
                      </span>

                      <span className="text-[10px] font-semibold text-[#394542]">
                        {item.value}
                      </span>
                    </div>

                    <div className="h-1.5 bg-[#EEF1EF] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1F453B] rounded-full"
                        style={{ width: `${item.percentage * 3}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ACTIVITY */}

          <div className="bg-white border border-[#E4E9E6] rounded-2xl p-5">
            <SectionTitle
              title="Recent Activity"
              description="Latest updates across the ERP"
              action={
                <button className="text-[10.5px] font-semibold text-[#1F453B] inline-flex items-center gap-1">
                  View all
                  <ArrowRight size={12} />
                </button>
              }
            />

            <div className="divide-y divide-[#EEF1EF]">
              {activity.map((item) => (
                <ActivityItem key={item.title + item.time} item={item} />
              ))}
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* WORKFLOW SNAPSHOT                                                */}
        {/* ---------------------------------------------------------------- */}

        <div className="bg-white border border-[#E4E9E6] rounded-2xl p-5 mb-6">
          <SectionTitle
            title="Workflow Snapshot"
            description="Current workload across major Rippotai ERP modules"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
            {[
              {
                title: "Leads",
                value: "38",
                icon: Target,
              },
              {
                title: "Briefs",
                value: "7",
                icon: FileText,
              },
              {
                title: "Site Recce",
                value: "5",
                icon: Building2,
              },
              {
                title: "BOQs",
                value: "13",
                icon: ReceiptIndianRupee,
              },
              {
                title: "Estimates",
                value: "9",
                icon: TrendingUp,
              },
              {
                title: "Documents",
                value: "184",
                icon: Layers3,
              },
              {
                title: "Execution",
                value: "16",
                icon: Workflow,
              },
              {
                title: "Tasks",
                value: "42",
                icon: ClipboardCheck,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-[#E9ECEA] p-3 hover:bg-[#FAFBFA]"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#EEF3F0] flex items-center justify-center mb-2">
                    <Icon size={13} className="text-[#1F453B]" />
                  </div>

                  <div className="text-[17px] font-semibold text-[#35413E]">
                    {item.value}
                  </div>

                  <div className="text-[9.5px] text-[#8E9996] mt-0.5">
                    {item.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
