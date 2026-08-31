import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  FolderKanban,
  Image,
  Layers3,
  LayoutDashboard,
  MessageSquare,
  MoreHorizontal,
  Palette,
  PenTool,
  Plus,
  RefreshCw,
  Ruler,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

// ============================================================
// MOCK DATA
// ============================================================

const MOCK_DATA = {
  overview: {
    activeProjects: 18,
    activeProjectsChange: 12.5,

    designTasks: 64,
    designTasksChange: 8.2,

    pendingApprovals: 9,
    pendingApprovalsChange: -14.3,

    teamUtilization: 78,
    teamUtilizationChange: 5.4,
  },

  projectStats: {
    concept: 5,
    designDevelopment: 7,
    workingDrawings: 4,
    completed: 12,
  },

  projects: [
    {
      id: "DS-001",
      name: "Verma Residence",
      client: "Aarav Verma",
      type: "Residential",
      stage: "Design Development",
      progress: 72,
      priority: "HIGH",
      dueDate: "2026-09-05",
      team: "Architecture",
      color: "bg-[#EAF1F8]",
      icon: Ruler,
    },
    {
      id: "DS-002",
      name: "Oakwood Villa",
      client: "Rohan Mehta",
      type: "Residential",
      stage: "Concept Design",
      progress: 45,
      priority: "MEDIUM",
      dueDate: "2026-09-08",
      team: "Interior",
      color: "bg-[#F4EEE8]",
      icon: Palette,
    },
    {
      id: "DS-003",
      name: "North Square Office",
      client: "North Square Pvt Ltd",
      type: "Commercial",
      stage: "Working Drawings",
      progress: 86,
      priority: "HIGH",
      dueDate: "2026-09-02",
      team: "Architecture",
      color: "bg-[#E8F3EE]",
      icon: PenTool,
    },
    {
      id: "DS-004",
      name: "Green Park Apartment",
      client: "Kunal Shah",
      type: "Residential",
      stage: "Design Development",
      progress: 61,
      priority: "LOW",
      dueDate: "2026-09-14",
      team: "Interior",
      color: "bg-[#F1F3F4]",
      icon: Layers3,
    },
    {
      id: "DS-005",
      name: "Studio 47",
      client: "Studio Forty Seven",
      type: "Commercial",
      stage: "Concept Design",
      progress: 32,
      priority: "MEDIUM",
      dueDate: "2026-09-18",
      team: "Architecture",
      color: "bg-[#FFF4DC]",
      icon: BriefcaseBusiness,
    },
  ],

  approvals: [
    {
      id: "APR-001",
      title: "Ground Floor Layout",
      project: "Verma Residence",
      type: "Drawing",
      submittedBy: "Ananya",
      submittedAt: "Today, 10:30 AM",
      status: "PENDING",
    },
    {
      id: "APR-002",
      title: "Living Room Material Palette",
      project: "Oakwood Villa",
      type: "Material",
      submittedBy: "Riya",
      submittedAt: "Today, 09:15 AM",
      status: "PENDING",
    },
    {
      id: "APR-003",
      title: "Office Furniture Layout",
      project: "North Square Office",
      type: "Layout",
      submittedBy: "Dhruv",
      submittedAt: "Yesterday, 04:40 PM",
      status: "PENDING",
    },
    {
      id: "APR-004",
      title: "Bedroom 02 3D View",
      project: "Green Park Apartment",
      type: "3D Visual",
      submittedBy: "Karan",
      submittedAt: "Yesterday, 02:20 PM",
      status: "PENDING",
    },
  ],

  tasks: [
    {
      id: "TASK-001",
      title: "Finalize kitchen elevations",
      project: "Verma Residence",
      assignee: "Ananya",
      dueDate: "2026-09-01",
      priority: "HIGH",
      status: "IN_PROGRESS",
    },
    {
      id: "TASK-002",
      title: "Prepare furniture layout",
      project: "North Square Office",
      assignee: "Dhruv",
      dueDate: "2026-09-02",
      priority: "HIGH",
      status: "TODO",
    },
    {
      id: "TASK-003",
      title: "Material board revision",
      project: "Oakwood Villa",
      assignee: "Riya",
      dueDate: "2026-09-04",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
    },
    {
      id: "TASK-004",
      title: "3D living room render",
      project: "Green Park Apartment",
      assignee: "Karan",
      dueDate: "2026-09-05",
      priority: "MEDIUM",
      status: "REVIEW",
    },
    {
      id: "TASK-005",
      title: "Concept presentation",
      project: "Studio 47",
      assignee: "Ananya",
      dueDate: "2026-09-06",
      priority: "LOW",
      status: "TODO",
    },
  ],

  activities: [
    {
      id: 1,
      user: "Ananya",
      action: "submitted a drawing for approval",
      target: "Ground Floor Layout",
      project: "Verma Residence",
      time: "12 min ago",
      type: "approval",
    },
    {
      id: 2,
      user: "Riya",
      action: "uploaded a new material board",
      target: "Living Room Palette",
      project: "Oakwood Villa",
      time: "35 min ago",
      type: "upload",
    },
    {
      id: 3,
      user: "Dhruv",
      action: "completed a task",
      target: "Office Zoning",
      project: "North Square Office",
      time: "1 hr ago",
      type: "completed",
    },
    {
      id: 4,
      user: "Karan",
      action: "updated 3D visualization",
      target: "Bedroom 02",
      project: "Green Park Apartment",
      time: "2 hrs ago",
      type: "design",
    },
    {
      id: 5,
      user: "Ananya",
      action: "created a new design task",
      target: "Facade Options",
      project: "Studio 47",
      time: "3 hrs ago",
      type: "task",
    },
    {
      id: 6,
      user: "Riya",
      action: "uploaded revised drawings",
      target: "Furniture Plan",
      project: "Oakwood Villa",
      time: "4 hrs ago",
      type: "upload",
    },
  ],

  upcoming: [
    {
      id: 1,
      title: "North Square Office — Working Drawings",
      date: "2026-09-02",
      type: "Project Deadline",
      priority: "HIGH",
    },
    {
      id: 2,
      title: "Verma Residence — Kitchen Elevations",
      date: "2026-09-01",
      type: "Design Task",
      priority: "HIGH",
    },
    {
      id: 3,
      title: "Oakwood Villa — Client Presentation",
      date: "2026-09-08",
      type: "Presentation",
      priority: "MEDIUM",
    },
    {
      id: 4,
      title: "Green Park Apartment — Material Approval",
      date: "2026-09-10",
      type: "Approval",
      priority: "MEDIUM",
    },
  ],

  team: [
    {
      id: 1,
      name: "Ananya Sharma",
      role: "Senior Architect",
      activeTasks: 8,
      completed: 23,
      utilization: 86,
    },
    {
      id: 2,
      name: "Dhruv Verma",
      role: "Architect",
      activeTasks: 6,
      completed: 19,
      utilization: 79,
    },
    {
      id: 3,
      name: "Riya Kapoor",
      role: "Interior Designer",
      activeTasks: 7,
      completed: 21,
      utilization: 82,
    },
    {
      id: 4,
      name: "Karan Mehta",
      role: "3D Visualizer",
      activeTasks: 5,
      completed: 17,
      utilization: 73,
    },
  ],

  workload: [
    { label: "Mon", value: 68 },
    { label: "Tue", value: 76 },
    { label: "Wed", value: 81 },
    { label: "Thu", value: 74 },
    { label: "Fri", value: 88 },
    { label: "Sat", value: 52 },
    { label: "Sun", value: 34 },
  ],
};

// ============================================================
// HELPERS
// ============================================================

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const getPriorityClass = (priority) => {
  switch (priority) {
    case "HIGH":
      return "bg-[#FBEAEA] text-[#9B3D3D]";

    case "MEDIUM":
      return "bg-[#FFF4DC] text-[#8A6500]";

    case "LOW":
    default:
      return "bg-[#E8F3EE] text-[#1F453B]";
  }
};

const getStageClass = (stage) => {
  switch (stage) {
    case "Concept Design":
      return "bg-[#F4EEE8] text-[#765C45]";

    case "Design Development":
      return "bg-[#EAF1F8] text-[#315A7D]";

    case "Working Drawings":
      return "bg-[#E8F3EE] text-[#1F453B]";

    default:
      return "bg-[#F4F6F7] text-[#6B7B7C]";
  }
};

const getActivityIcon = (type) => {
  switch (type) {
    case "approval":
      return FileCheck2;

    case "upload":
      return FileText;

    case "completed":
      return CheckCircle2;

    case "design":
      return Palette;

    case "task":
      return Target;

    default:
      return LayoutDashboard;
  }
};

// ============================================================
// STAT CARD
// ============================================================

function StatCard({ icon: Icon, title, value, change, suffix, description }) {
  const positive = change >= 0;

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-[#EEF3F0] flex items-center justify-center">
          <Icon size={18} className="text-[#1F453B]" />
        </div>

        <div
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${
            positive
              ? "bg-[#E8F3EE] text-[#1F453B]"
              : "bg-[#FBEAEA] text-[#9B3D3D]"
          }`}
        >
          <TrendingUp size={11} />
          {positive ? "+" : ""}
          {change}%
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[28px] leading-none font-bold text-[#25302F]">
          {value}
          {suffix && (
            <span className="text-[16px] ml-1 text-[#6B7B7C]">{suffix}</span>
          )}
        </div>

        <div className="mt-2 text-[13px] font-semibold text-[#4F5B5D]">
          {title}
        </div>

        {description && (
          <div className="mt-1 text-[11px] text-[#8A9697]">{description}</div>
        )}
      </div>
    </Card>
  );
}

// ============================================================
// MAIN
// ============================================================

export default function DesignStudioDashboard() {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [projectStage, setProjectStage] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

  // ------------------------------------------------------------
  // Search Projects
  // ------------------------------------------------------------

  const filteredProjects = useMemo(() => {
    const term = q.trim().toLowerCase();

    return MOCK_DATA.projects.filter((project) => {
      const matchesStage =
        projectStage === "ALL" || project.stage === projectStage;

      const searchable = [
        project.name,
        project.client,
        project.type,
        project.stage,
        project.team,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || searchable.includes(term);

      return matchesStage && matchesSearch;
    });
  }, [q, projectStage]);

  // ------------------------------------------------------------
  // Refresh Mock Data
  // ------------------------------------------------------------

  const handleRefresh = () => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 700);
  };

  // ------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------

  const quickActions = [
    {
      label: "New Project",
      icon: Plus,
      path: "/crm/projects/new",
    },
    {
      label: "New Design Task",
      icon: PenTool,
      path: "/crm/design/tasks/new",
    },
    {
      label: "Upload Drawing",
      icon: FileText,
      path: "/crm/documents/upload",
    },
    {
      label: "Material Board",
      icon: Palette,
      path: "/crm/design/material-board/new",
    },
  ];

  return (
    <Shell
      title="Design Studio"
      subtitle="Design operations, projects, approvals and team workload"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="h-10 w-10 rounded-lg border border-[rgba(31,69,59,0.12)] bg-white flex items-center justify-center text-[#4F5B5D] hover:bg-[#F4F6F7] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => nav("/crm/design/projects")}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#17382F] transition-colors"
          >
            <FolderKanban size={15} />
            Design Projects
          </button>
        </div>
      }
    >
      {/* ========================================================
          TOP STATS
      ======================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={FolderKanban}
          title="Active Projects"
          value={MOCK_DATA.overview.activeProjects}
          change={MOCK_DATA.overview.activeProjectsChange}
          description="Currently in design production"
        />

        <StatCard
          icon={PenTool}
          title="Design Tasks"
          value={MOCK_DATA.overview.designTasks}
          change={MOCK_DATA.overview.designTasksChange}
          description="Open design tasks"
        />

        <StatCard
          icon={FileCheck2}
          title="Pending Approvals"
          value={MOCK_DATA.overview.pendingApprovals}
          change={MOCK_DATA.overview.pendingApprovalsChange}
          description="Waiting for review"
        />

        <StatCard
          icon={Users}
          title="Team Utilization"
          value={MOCK_DATA.overview.teamUtilization}
          suffix="%"
          change={MOCK_DATA.overview.teamUtilizationChange}
          description="Average team workload"
        />
      </div>

      {/* ========================================================
          QUICK ACTIONS
      ======================================================== */}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] font-bold text-[#25302F]">
              Quick Actions
            </h2>

            <p className="text-[12px] text-[#8A9697] mt-0.5">
              Start common design studio workflows
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.label}
                onClick={() => nav(action.path)}
                className="bg-white border border-[rgba(31,69,59,0.10)] rounded-xl p-4 text-left hover:bg-[#F8FAF9] hover:border-[rgba(31,69,59,0.18)] transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EEF3F0] flex items-center justify-center">
                  <Icon size={16} className="text-[#1F453B]" />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#333333]">
                    {action.label}
                  </span>

                  <ArrowUpRight
                    size={14}
                    className="text-[#A0AAAA] group-hover:text-[#1F453B]"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          PROJECT PIPELINE
      ======================================================== */}

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1.65fr_1fr] gap-4">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-[15px] font-bold text-[#25302F]">
                Design Pipeline
              </h2>

              <p className="text-[12px] text-[#8A9697] mt-0.5">
                Current projects by design stage
              </p>
            </div>

            <button
              onClick={() => nav("/crm/design/projects")}
              className="text-[12px] font-semibold text-[#1F453B] inline-flex items-center gap-1"
            >
              View all
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <button
              onClick={() => setProjectStage("Concept Design")}
              className={`rounded-xl p-3 text-left border transition-colors ${
                projectStage === "Concept Design"
                  ? "bg-[#F4EEE8] border-[#DCCBBC]"
                  : "bg-[#FAFBFB] border-transparent"
              }`}
            >
              <div className="text-[22px] font-bold text-[#765C45]">
                {MOCK_DATA.projectStats.concept}
              </div>
              <div className="text-[11px] font-semibold text-[#765C45] mt-1">
                Concept
              </div>
            </button>

            <button
              onClick={() => setProjectStage("Design Development")}
              className={`rounded-xl p-3 text-left border transition-colors ${
                projectStage === "Design Development"
                  ? "bg-[#EAF1F8] border-[#C8D8E5]"
                  : "bg-[#FAFBFB] border-transparent"
              }`}
            >
              <div className="text-[22px] font-bold text-[#315A7D]">
                {MOCK_DATA.projectStats.designDevelopment}
              </div>
              <div className="text-[11px] font-semibold text-[#315A7D] mt-1">
                Design Development
              </div>
            </button>

            <button
              onClick={() => setProjectStage("Working Drawings")}
              className={`rounded-xl p-3 text-left border transition-colors ${
                projectStage === "Working Drawings"
                  ? "bg-[#E8F3EE] border-[#C6DDD1]"
                  : "bg-[#FAFBFB] border-transparent"
              }`}
            >
              <div className="text-[22px] font-bold text-[#1F453B]">
                {MOCK_DATA.projectStats.workingDrawings}
              </div>
              <div className="text-[11px] font-semibold text-[#1F453B] mt-1">
                Working Drawings
              </div>
            </button>

            <button
              onClick={() => setProjectStage("ALL")}
              className={`rounded-xl p-3 text-left border transition-colors ${
                projectStage === "ALL"
                  ? "bg-[#F1F3F4] border-[#DDE2E3]"
                  : "bg-[#FAFBFB] border-transparent"
              }`}
            >
              <div className="text-[22px] font-bold text-[#4F5B5D]">
                {MOCK_DATA.projectStats.completed}
              </div>
              <div className="text-[11px] font-semibold text-[#4F5B5D] mt-1">
                Completed
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA7A8]"
              />

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search projects..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[rgba(31,69,59,0.12)] bg-[#FAFBFB] text-[12px] outline-none focus:border-[#1F453B]"
              />
            </div>

            {projectStage !== "ALL" && (
              <button
                onClick={() => setProjectStage("ALL")}
                className="text-[11px] font-semibold text-[#1F453B]"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="space-y-2">
            {filteredProjects.map((project) => {
              const ProjectIcon = project.icon;

              return (
                <div
                  key={project.id}
                  onClick={() => nav(`/crm/design/projects/${project.id}`)}
                  className="border border-[rgba(31,69,59,0.08)] rounded-xl p-3 hover:bg-[#F8FAF9] cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg ${project.color} flex items-center justify-center shrink-0`}
                    >
                      <ProjectIcon size={16} className="text-[#4F5B5D]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-[13px] text-[#333333] truncate">
                            {project.name}
                          </div>

                          <div className="text-[11px] text-[#8A9697] mt-0.5">
                            {project.client} · {project.type}
                          </div>
                        </div>

                        <span
                          className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-bold ${getPriorityClass(
                            project.priority,
                          )}`}
                        >
                          {project.priority}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`px-2 py-1 rounded-md text-[10px] font-semibold ${getStageClass(
                              project.stage,
                            )}`}
                          >
                            {project.stage}
                          </span>

                          <span className="text-[11px] font-semibold text-[#6B7B7C]">
                            {project.progress}%
                          </span>
                        </div>

                        <div className="h-1.5 bg-[#EEF1F1] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1F453B] rounded-full transition-all"
                            style={{
                              width: `${project.progress}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#8A9697]">
                        <span>{project.team}</span>

                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={11} />
                          {formatDate(project.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!filteredProjects.length && (
              <div className="text-center py-8 text-[12px] text-[#8A9697]">
                No projects match your filters.
              </div>
            )}
          </div>
        </Card>

        {/* ======================================================
            WORKLOAD
        ====================================================== */}

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#25302F]">
                Studio Workload
              </h2>

              <p className="text-[12px] text-[#8A9697] mt-0.5">
                Team utilization this week
              </p>
            </div>

            <MoreHorizontal size={17} className="text-[#8A9697]" />
          </div>

          <div className="mt-7 h-[190px] flex items-end gap-2">
            {MOCK_DATA.workload.map((item) => (
              <div
                key={item.label}
                className="flex-1 h-full flex flex-col items-center justify-end"
              >
                <div className="text-[10px] font-semibold text-[#6B7B7C] mb-2">
                  {item.value}%
                </div>

                <div className="w-full max-w-[30px] h-[145px] bg-[#F1F3F4] rounded-t-lg overflow-hidden flex items-end">
                  <div
                    className="w-full bg-[#1F453B] rounded-t-lg"
                    style={{
                      height: `${item.value}%`,
                    }}
                  />
                </div>

                <div className="mt-2 text-[10px] text-[#8A9697]">
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-[rgba(31,69,59,0.08)]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#6B7B7C]">
                Average utilization
              </span>

              <span className="text-[13px] font-bold text-[#1F453B]">
                68.9%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* ========================================================
          APPROVALS + DEADLINES
      ======================================================== */}

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* APPROVALS */}

        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-bold text-[#25302F]">
                Pending Approvals
              </h2>

              <p className="text-[12px] text-[#8A9697] mt-0.5">
                Design work waiting for review
              </p>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-[#FFF4DC] text-[#8A6500] text-[11px] font-bold">
              {MOCK_DATA.approvals.length} pending
            </span>
          </div>

          <div className="space-y-2">
            {MOCK_DATA.approvals.map((approval) => (
              <div
                key={approval.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFBFB] border border-[rgba(31,69,59,0.07)]"
              >
                <div className="w-9 h-9 rounded-lg bg-[#FFF4DC] flex items-center justify-center shrink-0">
                  <FileCheck2 size={16} className="text-[#8A6500]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[12px] text-[#333333] truncate">
                    {approval.title}
                  </div>

                  <div className="text-[11px] text-[#8A9697] mt-0.5 truncate">
                    {approval.project} · {approval.type}
                  </div>

                  <div className="text-[10px] text-[#A0AAAA] mt-1">
                    By {approval.submittedBy} · {approval.submittedAt}
                  </div>
                </div>

                <button
                  onClick={() => nav(`/crm/design/approvals/${approval.id}`)}
                  className="shrink-0 h-8 px-3 rounded-lg bg-[#1F453B] text-white text-[11px] font-semibold"
                >
                  Review
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => nav("/crm/design/approvals")}
            className="w-full mt-4 h-9 rounded-lg border border-[rgba(31,69,59,0.12)] text-[11px] font-semibold text-[#1F453B] hover:bg-[#F4F6F7]"
          >
            View all approvals
          </button>
        </Card>

        {/* DEADLINES */}

        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-bold text-[#25302F]">
                Upcoming Deadlines
              </h2>

              <p className="text-[12px] text-[#8A9697] mt-0.5">
                Projects and design deliverables
              </p>
            </div>

            <Clock3 size={17} className="text-[#8A9697]" />
          </div>

          <div className="space-y-3">
            {MOCK_DATA.upcoming.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="w-10 text-center shrink-0">
                  <div className="text-[15px] font-bold text-[#25302F]">
                    {new Date(item.date).getDate()}
                  </div>

                  <div className="text-[9px] uppercase font-bold text-[#8A9697]">
                    {new Date(item.date).toLocaleDateString("en-IN", {
                      month: "short",
                    })}
                  </div>
                </div>

                <div className="flex-1 border-l border-[rgba(31,69,59,0.10)] pl-3 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[12px] font-semibold text-[#333333]">
                        {item.title}
                      </div>

                      <div className="text-[10px] text-[#8A9697] mt-1">
                        {item.type}
                      </div>
                    </div>

                    <span
                      className={`shrink-0 px-2 py-1 rounded-md text-[9px] font-bold ${getPriorityClass(
                        item.priority,
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => nav("/crm/calendar")}
            className="w-full mt-2 h-9 rounded-lg border border-[rgba(31,69,59,0.12)] text-[11px] font-semibold text-[#1F453B] hover:bg-[#F4F6F7]"
          >
            Open calendar
          </button>
        </Card>
      </div>

      {/* ========================================================
          DESIGN TASKS
      ======================================================== */}

      <div className="mt-6">
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-bold text-[#25302F]">
                Design Tasks
              </h2>

              <p className="text-[12px] text-[#8A9697] mt-0.5">
                Tasks requiring attention
              </p>
            </div>

            <button
              onClick={() => nav("/crm/design/tasks")}
              className="text-[12px] font-semibold text-[#1F453B] inline-flex items-center gap-1"
            >
              Manage tasks
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-[#F4F6F7]">
                <tr>
                  <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-[0.12em] text-[#6B7B7C]">
                    Task
                  </th>

                  <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-[0.12em] text-[#6B7B7C]">
                    Project
                  </th>

                  <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-[0.12em] text-[#6B7B7C]">
                    Assignee
                  </th>

                  <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-[0.12em] text-[#6B7B7C]">
                    Due
                  </th>

                  <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-[0.12em] text-[#6B7B7C]">
                    Priority
                  </th>

                  <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-[0.12em] text-[#6B7B7C]">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {MOCK_DATA.tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => nav(`/crm/design/tasks/${task.id}`)}
                    className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F8FAF9] cursor-pointer"
                  >
                    <td className="px-3 py-3">
                      <div className="font-semibold text-[#333333]">
                        {task.title}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-[#6B7B7C]">{task.project}</td>

                    <td className="px-3 py-3 text-[#6B7B7C]">
                      {task.assignee}
                    </td>

                    <td className="px-3 py-3 text-[#6B7B7C]">
                      {formatDate(task.dueDate)}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-md text-[9px] font-bold ${getPriorityClass(
                          task.priority,
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-right">
                      <span className="inline-flex px-2 py-1 rounded-md bg-[#F1F3F4] text-[#5F6B6D] text-[9px] font-semibold">
                        {task.status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ========================================================
          TEAM + ACTIVITY
      ======================================================== */}

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_1.3fr] gap-4">
        {/* TEAM */}

        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-bold text-[#25302F]">
                Studio Team
              </h2>

              <p className="text-[12px] text-[#8A9697] mt-0.5">
                Current workload by team member
              </p>
            </div>

            <Users size={17} className="text-[#8A9697]" />
          </div>

          <div className="space-y-4">
            {MOCK_DATA.team.map((member) => (
              <div key={member.id}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#EEF3F0] flex items-center justify-center text-[11px] font-bold text-[#1F453B]">
                    {member.name
                      .split(" ")
                      .map((x) => x[0])
                      .join("")
                      .slice(0, 2)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-[#333333] truncate">
                        {member.name}
                      </span>

                      <span className="text-[10px] font-bold text-[#1F453B]">
                        {member.utilization}%
                      </span>
                    </div>

                    <div className="text-[10px] text-[#8A9697] mt-0.5">
                      {member.role} · {member.activeTasks} active tasks
                    </div>

                    <div className="mt-2 h-1.5 rounded-full bg-[#F1F3F4] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#1F453B]"
                        style={{
                          width: `${member.utilization}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ACTIVITY */}

        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-bold text-[#25302F]">
                Recent Activity
              </h2>

              <p className="text-[12px] text-[#8A9697] mt-0.5">
                Latest activity across the design studio
              </p>
            </div>

            <MessageSquare size={17} className="text-[#8A9697]" />
          </div>

          <div className="space-y-1">
            {MOCK_DATA.activities.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type);

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#F8FAF9]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#EEF3F0] flex items-center justify-center shrink-0">
                    <ActivityIcon size={14} className="text-[#1F453B]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-[#4F5B5D] leading-5">
                      <span className="font-semibold text-[#333333]">
                        {activity.user}
                      </span>{" "}
                      {activity.action}{" "}
                      <span className="font-semibold text-[#333333]">
                        {activity.target}
                      </span>
                    </div>

                    <div className="text-[10px] text-[#8A9697] mt-0.5">
                      {activity.project} · {activity.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </Shell>
  );
}
