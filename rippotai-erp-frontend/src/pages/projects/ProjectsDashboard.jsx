import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Search, CheckCircle2, Circle, MoreHorizontal, Edit, Archive, Trash2, RotateCcw } from "lucide-react";
import {
  useGetProjectsSummaryQuery,
  useGetProjectsQuery,
  useGetProjectStatusChecklistQuery,
  useArchiveProjectMutation,
  useRestoreProjectMutation,
  useDeleteProjectMutation,
} from "../../api/project.api";

const STATUS_LABEL = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
  on_hold: "On Hold",
};

const STATUS_TONE = {
  active: { bg: "#EAEEF0", fg: "#1F453B" },
  completed: { bg: "#EAEEF0", fg: "#1F453B" },
  archived: { bg: "#B5C4B6", fg: "#6B7B7C" },
  on_hold: { bg: "#B5C4B6", fg: "#6B7B7C" },
};

function StatusChip({ status }) {
  const t = STATUS_TONE[status] || STATUS_TONE.active;
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: t.bg, color: t.fg }}
    >
      {STATUS_LABEL[status] || status || "—"}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  const n = Number(value);
  if (!value || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
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

  const [archiveProject] = useArchiveProjectMutation();
  const [restoreProject] = useRestoreProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();

  useEffect(() => {
    if (summaryError || rowsError) {
      toast.error("Failed to load projects");
    }
  }, [summaryError, rowsError]);

  const loading = summaryLoading || rowsLoading;

  const filtered = rows.filter((r) => {
    if (tab === "active" && r.status !== "active") return false;
    if (tab === "completed" && r.status !== "completed") return false;
    if (tab === "on_hold" && r.status !== "on_hold") return false;
    if (tab === "archived" && r.status !== "archived") return false;

    if (
      q &&
      !r.name?.toLowerCase().includes(q.toLowerCase()) &&
      !r.client?.name?.toLowerCase().includes(q.toLowerCase())
    )
      return false;
    return true;
  });

  // Action Handlers
  const handleArchive = async (id, name) => {
    if (!window.confirm(`Archive project "${name}"?`)) return;
    try {
      await archiveProject({ id, archived_by: "current_user" }).unwrap();
      toast.success(`Project "${name}" has been archived`);
    } catch (err) {
      toast.error("Failed to archive project");
    }
  };

  const handleRestore = async (id, name) => {
    if (!window.confirm(`Restore project "${name}"?`)) return;
    try {
      await restoreProject(id).unwrap();
      toast.success(`Project "${name}" has been restored`);
    } catch (err) {
      toast.error("Failed to restore project");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`PERMANENTLY DELETE "${name}"?\n\nThis action cannot be undone.`)) return;
    try {
      await deleteProject(id).unwrap();
      toast.success(`Project "${name}" deleted successfully`);
    } catch (err) {
      toast.error("Failed to delete project");
    }
  };

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
              ["completed", "Completed"],
              ["on_hold", "On Hold"],
              ["archived", "Archived"],
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
                    <th className="text-left py-2 pr-3">Status</th>
                    <th className="text-left py-2 pr-3">ECD</th>
   
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-[#B5C4B6]">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-[#B5C4B6]">
                        No projects match.
                      </td>
                    </tr>
                  )}

                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-[#EAEEF0] hover:bg-[#EAEEF0] group"
                    >
                      <td
                        className="py-2.5 pr-3 cursor-pointer"
                        onClick={() => nav(`/projects/${p.id}`)}
                      >
                        <div className="font-semibold text-[#333333]">{p.name}</div>
                        <div className="text-[11px] text-[#B5C4B6]">{p.slug || ""}</div>
                      </td>
                      <td
                        className="py-2.5 pr-3 text-[#6B7B7C] cursor-pointer"
                        onClick={() => nav(`/projects/${p.id}`)}
                      >
                        {p.client?.name || "—"}
                      </td>
                      <td
                        className="py-2.5 pr-3 text-[#6B7B7C] cursor-pointer"
                        onClick={() => nav(`/projects/${p.id}`)}
                      >
                        {p.project_type?.name || "—"}
                      </td>
                      <td
                        className="py-2.5 pr-3 cursor-pointer"
                        onClick={() => nav(`/projects/${p.id}`)}
                      >
                        <StatusChip status={p.status} />
                      </td>
                      <td
                        className="py-2.5 pr-3 text-[#6B7B7C] cursor-pointer"
                        onClick={() => nav(`/projects/${p.id}`)}
                      >
                        {formatDate(p.expected_completion_date)}
                      </td>
      

                      {/* Actions Column */}
                      <td className="py-2.5">
                        <div className="relative">
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg hover:bg-[#EAEEF0] text-[#6B7B7C] hover:text-[#333333] opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {/* Dropdown Menu */}
                          <div className="absolute right-0 top-10 w-48 bg-white border border-[#B5C4B6] rounded-xl shadow-xl py-1 z-20 hidden group-hover:block">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                nav(`/projects/${p.id}`);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-[#EAEEF0] flex items-center gap-2 text-[13px]"
                            >
                              <Edit size={16} /> View / Edit
                            </button>

                            {p.status !== "archived" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchive(p.id, p.name);
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-[#EAEEF0] flex items-center gap-2 text-[13px] text-amber-700"
                              >
                                <Archive size={16} /> Archive
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestore(p.id, p.name);
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-[#EAEEF0] flex items-center gap-2 text-[13px] text-emerald-700"
                              >
                                <RotateCcw size={16} /> Restore
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(p.id, p.name);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-[#EAEEF0] flex items-center gap-2 text-[13px] text-red-600"
                            >
                              <Trash2 size={16} /> Delete
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