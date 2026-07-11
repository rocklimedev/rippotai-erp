import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Search, CheckCircle2, Circle } from "lucide-react";
import {
  useGetProjectsSummaryQuery,
  useGetProjectsFullQuery,
  useGetProjectsQuery,
  useGetProjectStatusChecklistQuery,
} from "../../api/project.api"; // adjust import path to wherever projectsApi.js lives

const STATUS_LABEL = {
  on_track: "On Track",
  ahead: "Ahead",
  at_risk: "At Risk",
  delayed: "Delayed",
  completed: "Completed",
  on_hold: "On Hold",
};
const STATUS_TONE = {
  on_track: { bg: "#EAEEF0", fg: "#1F453B" },
  ahead: { bg: "#EAEEF0", fg: "#1F453B" },
  at_risk: { bg: "#EAEEF0", fg: "#1F453B" },
  delayed: { bg: "#EAEEF0", fg: "#1F453B" },
  completed: { bg: "#EAEEF0", fg: "#1F453B" },
  on_hold: { bg: "#B5C4B6", fg: "#6B7B7C" },
};

function TimelineChip({ status }) {
  const t = STATUS_TONE[status] || STATUS_TONE.on_track;
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: t.bg, color: t.fg }}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function PhaseTracker({ phase }) {
  const phases = [
    "pre_design",
    "design",
    "pre_execution",
    "execution",
    "handover",
    "completed",
  ];
  const idx = phases.indexOf(phase);
  return (
    <div className="flex gap-1">
      {phases.slice(0, 5).map((p, i) => (
        <div
          key={p}
          className="h-1.5 flex-1 rounded-full"
          style={{
            background: i < idx ? "#1F453B" : i === idx ? "#1F453B" : "#B5C4B6",
          }}
        />
      ))}
    </div>
  );
}

export default function ProjectsDashboard() {
  const nav = useNavigate();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  const {
    data: summary,
    isFetching: summaryLoading,
    isError: summaryError,
  } = useGetProjectsSummaryQuery();

  const {
    data: rows = [],
    isFetching: rowsLoading,
    isError: rowsError,
  } = useGetProjectsQuery();

  // Surface fetch errors the same way the old axios catch blocks did.
  useEffect(() => {
    if (summaryError || rowsError) {
      toast.error("Failed to load projects");
    }
  }, [summaryError, rowsError]);

  const loading = summaryLoading || rowsLoading;

  const filtered = rows.filter((r) => {
    if (
      tab === "active" &&
      (r.status === "completed" || r.status === "archived")
    )
      return false;
    if (
      tab === "on_time" &&
      !["on_track", "ahead"].includes(r.timeline?.status)
    )
      return false;
    if (tab === "delayed" && r.timeline?.status !== "delayed") return false;
    if (tab === "near_handover" && r.progress < 85) return false;
    if (tab === "completed" && r.progress < 100 && r.status !== "completed")
      return false;
    if (
      q &&
      !r.name.toLowerCase().includes(q.toLowerCase()) &&
      !r.client_name?.toLowerCase().includes(q.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="max-w-[1440px] mx-auto p-6 space-y-5">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-[34px] font-bold text-[#333333] tracking-tight">
            Projects
          </h1>
          <p className="text-[13.5px] text-[#6B7B7C] mt-1 max-w-[620px]">
            Manage every project from initial briefing to final handover through
            one connected workspace.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.info("Project templates coming soon")}
            className="px-3.5 py-2 rounded-lg border border-[#B5C4B6] bg-white text-[13px] font-semibold"
          >
            Project Templates
          </button>
          <button
            onClick={() => nav("/projects/new")}
            className="px-4 py-2 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold inline-flex items-center gap-1.5"
            data-testid="btn-create-project"
          >
            <Plus size={14} /> Create Project
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            ["Total", summary.total],
            ["Active", summary.active],
            ["On Time", summary.on_time],
            ["Delayed", summary.delayed],
            ["Awaiting Action", summary.awaiting_action],
            ["Near Handover", summary.near_handover],
            ["Completed", summary.completed],
          ].map(([l, v]) => (
            <div
              key={l}
              className="bg-white border border-[#B5C4B6] rounded-xl p-4"
              data-testid={`project-summary-${l.replace(/\s+/g, "-").toLowerCase()}`}
            >
              <div className="text-[11px] uppercase tracking-wider text-[#B5C4B6]">
                {l}
              </div>
              <div className="text-[34px] font-bold text-[#333333] mt-1 leading-none">
                {v}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <div className="bg-white border border-[#B5C4B6] rounded-xl">
          <div className="border-b border-[#B5C4B6] flex gap-1 p-2 overflow-x-auto">
            {[
              ["all", "All"],
              ["active", "Active"],
              ["on_time", "On Time"],
              ["delayed", "Delayed"],
              ["near_handover", "Near Handover"],
              ["completed", "Completed"],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                data-testid={`project-tab-${k}`}
                className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold ${tab === k ? "bg-[#EAEEF0] text-[#333333]" : "text-[#6B7B7C] hover:bg-[#EAEEF0]"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="p-4">
            <div className="relative mb-3 max-w-md">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B5C4B6]"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search projects…"
                className="w-full pl-9 pr-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
                data-testid="project-search"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead className="text-[11px] uppercase text-[#B5C4B6]">
                  <tr className="border-b border-[#B5C4B6]">
                    <th className="text-left py-2 pr-3">Project</th>
                    <th className="text-left py-2 pr-3">Client</th>
                    <th className="text-left py-2 pr-3">Type</th>
                    <th className="text-left py-2 pr-3 min-w-[180px]">
                      Progress
                    </th>
                    <th className="text-left py-2 pr-3">Timeline</th>
                    <th className="text-left py-2 pr-3">ECD</th>
                    <th className="text-right py-2 pr-3">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-6 text-center text-[#B5C4B6]"
                      >
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-6 text-center text-[#B5C4B6]"
                      >
                        No projects match.
                      </td>
                    </tr>
                  )}
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => nav(`/projects/${p.id}`)}
                      data-testid={`project-row-${p.id}`}
                      className="border-b border-[#EAEEF0] cursor-pointer hover:bg-[#EAEEF0]"
                    >
                      <td className="py-2.5 pr-3">
                        <div className="font-semibold text-[#333333]">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-[#B5C4B6]">
                          {p.code || ""}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-[#6B7B7C]">
                        {p.client_name || "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-[#6B7B7C]">
                        {p.project_type || "—"}
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="text-[11px] text-[#6B7B7C] mb-1">
                          {p.progress || 0}% · {p.phase || "—"}
                        </div>
                        <PhaseTracker phase={p.phase} />
                      </td>
                      <td className="py-2.5 pr-3">
                        <TimelineChip status={p.timeline?.status} />
                      </td>
                      <td className="py-2.5 pr-3 text-[#6B7B7C]">
                        {p.expected_completion || "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-semibold text-[#333333]">
                        {p.pending_actions || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <ProjectStatusWidget projects={rows} />
      </div>
    </div>
  );
}

function ProjectStatusWidget({ projects }) {
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!projects || projects.length === 0) return;
    if (!selectedId) setSelectedId(projects[0].id);
  }, [projects, selectedId]);

  const {
    data,
    isFetching: loading,
    isError,
  } = useGetProjectStatusChecklistQuery(selectedId, {
    skip: !selectedId,
  });

  return (
    <div
      className="bg-white border border-[#B5C4B6] rounded-xl p-4 h-fit lg:sticky lg:top-4"
      data-testid="project-status-widget"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B7B7C] font-semibold">
          Project Status
        </div>
        {data && (
          <div className="text-[11.5px] text-[#333333] font-semibold">
            {data.completed_count}/{data.total} · {data.progress_pct}%
          </div>
        )}
      </div>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full h-9 px-2 rounded-lg border border-[#B5C4B6] bg-[#FAF8F5] text-[13px] mb-3"
        data-testid="project-status-select"
      >
        {(projects || []).map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {data && (
        <div className="h-1.5 rounded-full bg-[#EAEEF0] overflow-hidden mb-3">
          <div
            className="h-full bg-[#1F453B]"
            style={{ width: `${data.progress_pct}%` }}
          />
        </div>
      )}
      {loading && (
        <div className="text-[12px] text-[#B5C4B6] py-4 text-center">
          Loading…
        </div>
      )}
      {!loading && isError && (
        <div className="text-[12px] text-[#B5C4B6] py-4 text-center">
          Couldn't load checklist.
        </div>
      )}
      {!loading && data && (
        <ol className="space-y-1.5" data-testid="project-status-list">
          {data.items.map((it, i) => (
            <li
              key={it.key}
              className="flex items-center gap-2 text-[12.5px]"
              data-testid={`project-status-item-${it.key}`}
            >
              {it.completed ? (
                <CheckCircle2
                  size={15}
                  style={{ color: "#4CAF50" }}
                  className="shrink-0"
                />
              ) : (
                <Circle size={15} className="text-[#B5C4B6] shrink-0" />
              )}
              <span className="text-[#6B7B7C] w-5 text-right shrink-0">
                {i + 1}.
              </span>
              <span
                className={
                  it.completed
                    ? "text-[#333333] font-semibold"
                    : "text-[#6B7B7C]"
                }
              >
                {it.label}
              </span>
            </li>
          ))}
        </ol>
      )}
      {!loading && !data && !isError && (
        <div className="text-[12px] text-[#B5C4B6] py-4 text-center">
          Select a project
        </div>
      )}
    </div>
  );
}
