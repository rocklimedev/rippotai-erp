import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Eye, Edit3, Trash2, ClipboardList } from "lucide-react";
import { Shell, Card, Input } from "../../hooks/shared";
import {
  useGetSiteReccesQuery,
  useDeleteSiteRecceMutation,
} from "../../api/reki.api";

const STATUS_OPTIONS = ["draft", "submitted", "approved", "in_progress"];

const statusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "bg-[#E4F3E8] text-[#1F7A3D]";
    case "submitted":
      return "bg-[#FDEFD9] text-[#B0740F]";
    case "in_progress":
      return "bg-[#E0F2FE] text-[#0C4A6E]";
    default:
      return "bg-[#EAEEF0] text-[#333333]";
  }
};

export default function SiteRecceList() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [collapsed, setCollapsed] = useState({});

  const projectFilter =
    new URLSearchParams(window.location.search).get("project_id") || "";

  const { data: rows = [], isFetching } = useGetSiteReccesQuery({
    projectId: projectFilter,
    status,
  });

  const [deleteSiteRecce] = useDeleteSiteRecceMutation();

  // Client-side search
  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((r) => {
      const projectName = r.project_name || r.project?.name || "";
      const title = r.title || "";
      return (
        projectName.toLowerCase().includes(term) ||
        title.toLowerCase().includes(term)
      );
    });
  }, [rows, q]);

  // Group by project
  const groups = useMemo(() => {
    const g= {};

    for (const r of filteredRows) {
      const key = r.project_name || r.project?.name || "Unassigned";
      if (!g[key]) g[key] = [];
      g[key].push(r);
    }

    return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredRows]);

  const removeRecce = async (r) => {
    if (!window.confirm(`Delete site recce for "${r.project_name || "this project"}"?`))
      return;

    try {
      await deleteSiteRecce(r.id).unwrap();
      toast.success("Site recce deleted");
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to delete");
    }
  };

  return (
    <Shell>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Site Recces</h1>
          <p className="text-sm text-gray-500">Manage site reconnaissance reports</p>
        </div>

        <button
          onClick={() => nav("/site-recce/new")}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
          data-testid="site-recce-new-btn"
        >
          <Plus className="w-4 h-4" />
          New Site Recce
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Input
          placeholder="Search by project or title..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>

        {projectFilter && (
          <button
            onClick={() => {
              nav("/site-recce");
              window.location.reload();
            }}
            className="text-[13px] text-[#333333] font-semibold flex items-center gap-1"
          >
            Clear project filter ×
          </button>
        )}
      </div>

      {/* Table Header */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-12 bg-[#F8F9FA] border-b text-xs font-medium text-[#666666] py-3 px-6">
          <div className="col-span-5">Project / Recce</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Floors</div>
          <div className="col-span-2">Created By</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {groups.map(([proj, items]) => {
          const isCollapsed = !!collapsed[proj];

          return (
            <div key={proj} className="border-b last:border-0">
              {/* Project Group Header */}
              <div
                onClick={() =>
                  setCollapsed((c) => ({ ...c, [proj]: !isCollapsed }))
                }
                className="px-6 py-4 flex items-center gap-3 bg-white hover:bg-[#F9FAFB] cursor-pointer"
              >
                <span className="text-lg">{isCollapsed ? "▸" : "▾"}</span>
                <div className="font-semibold text-[#1F453B] flex-1">
                  {proj}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    · {items.length} recce{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <ClipboardList className="w-5 h-5 text-gray-400" />
              </div>

              {/* Recce Rows */}
              {!isCollapsed &&
                items.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => nav(`/documents/site-recce/${r.id}`)}
                    className="grid grid-cols-12 border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer px-6 py-4 items-center text-sm"
                    data-testid={`site-recce-row-${r.id}`}
                  >
                    <div className="col-span-5">
                      <div className="font-medium">
                        {r.project_name || r.title || "Untitled Recce"}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        ID: {r.id.slice(0, 8)}...
                      </div>
                    </div>

                    <div className="col-span-1">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${statusBadgeClass(
                          r.status
                        )}`}
                      >
                        {r.status?.replace("_", " ") || "Draft"}
                      </span>
                    </div>

                    <div className="col-span-1 font-mono text-sm">
                      {r.floors?.length ?? 0}
                    </div>

                    <div className="col-span-2 text-sm text-gray-600">
                      {r.createdByName || r.created_by?.slice(0, 8) + "..." || "—"}
                    </div>

                    <div className="col-span-2 text-sm text-gray-600">
                      {(r.created_at || r.recce_date || "").slice(0, 10)}
                    </div>

                    <div
                      className="col-span-1 flex justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => nav(`/site-recce/${r.id}`)}
                        className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333]"
                        title="View"
                        data-testid={`site-recce-view-${r.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => nav(`/site-recce/${r.id}/edit`)}
                        className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333]"
                        title="Edit"
                        data-testid={`site-recce-edit-${r.id}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => removeRecce(r)}
                        className="p-1.5 rounded hover:bg-[#F4E1D6] text-[#B04D26]"
                        title="Delete"
                        data-testid={`site-recce-delete-${r.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          );
        })}

        {!isFetching && filteredRows.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No site recces yet. Start one from a project.
          </div>
        )}
      </Card>
    </Shell>
  );
}