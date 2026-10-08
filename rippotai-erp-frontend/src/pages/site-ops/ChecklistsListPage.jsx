import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useGetProjectsQuery } from "../../api/projects/project.api";
import {
  useGetQualityChecklistsQuery,
  useLazyExportQualityChecklistJsonQuery,
} from "../../api/site-ops/site-ops.api";

export default function ChecklistsListPage() {
  const [projectId, setProjectId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data: projectsResponse } = useGetProjectsQuery({
    includeArchived: false,
  });
  const projects = Array.isArray(projectsResponse)
    ? projectsResponse
    : projectsResponse?.data?.data || projectsResponse?.data || [];
  const {
    currentData: list,
    isFetching,
    error,
    refetch,
  } = useGetQualityChecklistsQuery({
    page,
    limit: 20,
    ...(projectId && { project_id: projectId }),
    ...(search && { search }),
    ...(status && { status }),
  });
  const [exportChecklist, { isFetching: exporting }] =
    useLazyExportQualityChecklistJsonQuery();
  const workspace = (row) =>
    `/site-operations/checklists/workspace?${new URLSearchParams({ projectId: row.project_id, checklistId: row.id })}`;
  async function download(row) {
    try {
      const data = await exportChecklist(row.id, false).unwrap();
      const { downloadQualityWorkbook } =
        await import("./qualityChecklistExcel");
      await downloadQualityWorkbook(data, row.checklist_name);
    } catch (error) {
      toast.error(
        String(
          error?.data?.message || error?.error || "Could not download Excel",
        ),
      );
    }
  }
  return (
    <div className="bg-page min-h-full p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <p className="eyebrow">Site operations</p>
          <h1 className="text-2xl font-semibold text-[var(--ink-green)]">
            Checklists
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Saved project checklists. Open the workspace to create or update
            checks.
          </p>
        </div>
        <Link
          className="bc-btn-primary"
          to={`/site-operations/checklists/workspace${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""}`}
        >
          Open checklist workspace
        </Link>
      </div>
      <div className="flex flex-wrap gap-3">
        <input
          aria-label="Search checklists"
          className="bc-input"
          placeholder="Search checklists…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Filter by project"
          className="bc-input"
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name || p.project_name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          className="bc-input"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {[
            "PENDING",
            "IN_PROGRESS",
            "COMPLETED",
            "PASSED",
            "FAILED",
            "ON_HOLD",
          ].map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <button className="bc-btn-secondary" onClick={refetch}>
          Could not load checklists. Retry
        </button>
      ) : isFetching ? (
        <p>Loading checklists…</p>
      ) : !list?.data?.length ? (
        <div className="bc-card p-8 text-center">
          No saved checklists found. Create a checklist in the workspace.
        </div>
      ) : (
        <div className="bc-card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-4">Checklist</th>
                <th className="p-4">Project</th>
                <th className="p-4">Status</th>
                <th className="p-4">Inspected</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="p-4">
                    <Link className="font-semibold" to={workspace(row)}>
                      {row.checklist_name}
                    </Link>
                    <p className="text-[var(--muted)]">
                      {row.checklist_items?.length || 0} checkpoints
                    </p>
                  </td>
                  <td className="p-4">{row.project?.name || row.project_id}</td>
                  <td className="p-4">{row.status.replaceAll("_", " ")}</td>
                  <td className="p-4">{Number(row.completion_percentage)}%</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Link className="bc-btn-secondary" to={workspace(row)}>
                        Open workspace
                      </Link>
                      <button
                        className="bc-btn-secondary"
                        disabled={exporting}
                        onClick={() => download(row)}
                      >
                        Download Excel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list?.totalPages > 1 && (
        <div className="flex gap-3 items-center">
          <button
            className="bc-btn-secondary"
            disabled={page === 1 || isFetching}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {list.totalPages}
          </span>
          <button
            className="bc-btn-secondary"
            disabled={page >= list.totalPages || isFetching}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
