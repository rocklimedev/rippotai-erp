import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit3, FileText } from "lucide-react";
import { Shell, Card, Input } from "../../hooks/shared"; // adjust to wherever these live
import { useGetProjectBriefsQuery } from "../../api/brief.api"; // adjust to wherever briefApi is exported from

export default function ProjectBriefList() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  // Read ?project_id= to auto-filter, same convention as the other list pages.
  const projectFilter =
    new URLSearchParams(window.location.search).get("project_id") || "";

  const { data: rows = [], isFetching } = useGetProjectBriefsQuery({
    project_id: projectFilter,
  });

  // No free-text search param on the list endpoint, so filter client-side.
  const filteredRows = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      (r.project_name || r.title || "").toLowerCase().includes(term),
    );
  }, [rows, q]);

  return (
    <Shell
      title="Project Briefs"
      subtitle={`${rows.length} brief${rows.length !== 1 ? "s" : ""} across the workspace`}
      action={
        <button
          onClick={() => nav("/project-brief/new")}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
          data-testid="project-brief-new-btn"
        >
          <Plus size={14} /> New Project Brief
        </button>
      }
    >
      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search by project…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        {projectFilter && (
          <button
            onClick={() => {
              nav("/project-brief");
              window.location.reload();
            }}
            className="text-[13px] text-[#333333] font-semibold"
          >
            Clear project filter ×
          </button>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]" data-testid="project-brief-table">
            <thead className="bg-[#F4F6F7]">
              <tr>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Project
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Sections
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Updated By
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Date
                </th>
                <th className="text-right px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C] w-[110px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => nav(`/documents/brief/${r.id}`)}
                  className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
                  data-testid={`project-brief-row-${r.id}`}
                >
                  <td className="px-3 py-2.5 font-semibold text-[#333333] max-w-[280px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText size={14} className="shrink-0 text-[#B5C4B6]" />
                      <span className="truncate">
                        {r.project_name || "Untitled"}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[#6B7B7C]">
                    {r.sections?.length ?? 0}
                  </td>
                  <td className="px-3 py-2.5 text-[#6B7B7C]">
                    {r.updatedByName || r.createdByName || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-[#6B7B7C]">
                    {(r.updatedAt || r.createdAt || "").slice(0, 10)}
                  </td>
                  <td
                    className="px-3 py-2.5 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center gap-0.5">
                      <button
                        onClick={() => nav(`/documents/brief/${r.id}`)}
                        className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333]"
                        title="View"
                        data-testid={`project-brief-view-${r.id}`}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => nav(`/project-brief/${r.id}/edit`)}
                        className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333]"
                        title="Edit"
                        data-testid={`project-brief-edit-${r.id}`}
                      >
                        <Edit3 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isFetching && !filteredRows.length && (
                <tr>
                  <td colSpan={5} className="text-center text-[#B5C4B6] py-8">
                    No project briefs yet. Create the first one from a project.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}