// ONE list format for every flow document (Client Brief … Admin DPR and the
// upload-type documents). Columns: Icon · Name · Project · Version · Status
// (read-only, from the review workflow) · Date (last edited) · Review · View ·
// Edit · Delete. Filters: one search box + project (+ Archived).
//
// Usage — keep the page's own data hook, map each row once:
//   <DocumentListPage type="client-brief" title="Client Brief" icon={FileText}
//     rows={data} loading={isLoading}
//     getRow={(r) => ({ id, name, projectId, projectName, version, status, updatedAt })}
//     viewTo={(row) => `/crm/brief/${row.id}`} editTo={(row) => …}
//     onDelete={(row) => deleteBrief(row.id).unwrap()}
//     createTo="/crm/forms/project-brief" />
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { Button, Card, EmptyState, Page, PageHeader, SearchInput, Toolbar, ToolbarSpacer, prettyStatus, toneFor } from "@/components/inos";
import { appConfirm } from "@/lib/app-dialog";
import { useGetDocCapabilitiesQuery, useGetDocMetaQuery } from "@/api/doc-flow/doc-flow.api";
import { useGetProjectsQuery } from "@/api/projects/project.api";
import { HistoryDrawer, ReviewMenu, ReviewStatusPill } from "./review";
import { fmtDate } from "./doc-utils";
import { docCode } from "@/components/record-context/codes";
import "./doc-list.css";

const RANK = { none: 0, view: 1, edit: 2, create: 3, full: 4 };

const isArchived = (row, meta) => meta?.state === "archive" || String(row.status ?? "").toLowerCase() === "archived";

export default function DocumentListPage({
  type,
  title,
  icon: Icon = FileText,
  rows = [],
  loading,
  error,
  getRow,
  viewTo,
  onView,
  editTo,
  onEdit,
  onDelete,
  createTo,
  onCreate,
  createLabel,
  canCreate: canCreateProp,
  canEdit: canEditProp,
  canDelete: canDeleteProp,
  latestPerProject,
  headerActions,
  embedded,
  projectId: fixedProjectId,
  emptyText,
}) {
  const nav = useNavigate();
  const location = useLocation();
  const urlProject = new URLSearchParams(location.search).get("projectId") || new URLSearchParams(location.search).get("project_id") || "";
  const [q, setQ] = useState("");
  const [project, setProject] = useState(fixedProjectId || urlProject);
  const [archived, setArchived] = useState(false);
  const [history, setHistory] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data: meta = {} } = useGetDocMetaQuery(type, { skip: !type });
  const { data: caps } = useGetDocCapabilitiesQuery(type, { skip: !type });
  const { data: projectList } = useGetProjectsQuery({ includeArchived: true });
  const projectNames = useMemo(() => {
    const m = new Map();
    // "PRJ-001 · Name" (project codes, proto-records).
    for (const p of Array.isArray(projectList) ? projectList : projectList?.data ?? []) m.set(p.id, { name: p.code ? `${p.code} · ${p.name}` : p.name, code: p.code });
    return m;
  }, [projectList]);
  const level = RANK[caps?.level ?? "view"] ?? 1;
  const canReview = !!caps?.canReview;
  const canCreate = canCreateProp ?? level >= RANK.create;
  const canEdit = canEditProp ?? level >= RANK.edit;
  const canDelete = canDeleteProp ?? level >= RANK.full;

  const mapped = useMemo(() => {
    const list = (Array.isArray(rows) ? rows : []).map((raw) => {
      const r = getRow(raw);
      const proj = r.projectId ? projectNames.get(r.projectId) : null;
      if (proj) r.projectName = proj.name;
      r.code = r.code ?? docCode(type, null, proj?.code);
      const m = meta[r.id];
      const version = r.version ?? m?.snapshotVersion ?? 1;
      return { ...r, raw, meta: m, version: Number(version) || 1 };
    });
    if (!latestPerProject) return list.map((r) => ({ ...r, earlier: [] }));
    // Row-based versions (one row per version): show only the latest per project.
    const groups = new Map();
    for (const r of list) {
      const k = r.projectId || r.id;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(r);
    }
    return [...groups.values()].map((g) => {
      g.sort((a, b) => b.version - a.version || new Date(b.updatedAt) - new Date(a.updatedAt));
      return { ...g[0], earlier: g.slice(1) };
    });
  }, [rows, getRow, meta, latestPerProject, projectNames, type]);

  const projects = useMemo(() => {
    const m = new Map();
    // Inventory registers only exist after the first stock movement, but the
    // project filter must also offer projects whose inventory is still empty.
    if (type === "site-inventory") {
      for (const [id, project] of projectNames) m.set(id, project.name || "Untitled project");
    }
    for (const r of mapped) if (r.projectId) m.set(r.projectId, r.projectName || "Untitled project");
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [mapped, projectNames, type]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return mapped
      .filter((r) => (archived ? isArchived(r, r.meta) : !isArchived(r, r.meta)))
      .filter((r) => !project || r.projectId === project)
      .filter((r) => !term || [r.code, r.name, r.projectName, r.status, r.search, `v${r.version}`].filter(Boolean).join(" ").toLowerCase().includes(term))
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }, [mapped, q, project, archived]);

  const go = (to, fn, row) => (fn ? fn(row) : to && nav(typeof to === "function" ? to(row) : to));
  const remove = async (row) => {
    if (!(await appConfirm(`Delete ${row.name || title}? This cannot be undone.`))) return;
    setDeleting(row.id);
    try {
      await onDelete(row);
      toast.success(`${title} deleted`);
    } catch (e) {
      toast.error(e?.data?.message || e?.message || "Delete failed");
    } finally {
      setDeleting(null);
    }
  };
  const createAction =
    canCreate && (createTo || onCreate) ? (
      <Button variant="primary" icon={Plus} onClick={() => (onCreate ? onCreate() : nav(createTo))} data-testid="doc-list-create">
        {createLabel || `New ${title}`}
      </Button>
    ) : null;

  const table = (
    <Card flush className="dl-card">
      <div className="dl-filters">
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder={`Search ${title}`} />
          {!fixedProjectId && (
            <select className="inos-select dl-project" value={project} onChange={(e) => setProject(e.target.value)} aria-label="Project">
              <option value="">All projects</option>
              {projects.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          )}
          <label className="dl-archived">
            <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
            Archived
          </label>
          <ToolbarSpacer />
          {embedded && createAction}
        </Toolbar>
      </div>
      {error ? (
        <EmptyState title={`Could not load ${title}`} text={error?.data?.message || "Try again in a moment."} />
      ) : loading ? (
        <div className="dl-loading">Loading…</div>
      ) : !shown.length ? (
        <EmptyState icon={Icon} title={archived ? "Nothing archived" : `No ${title} yet`} text={emptyText} action={!archived && !q ? createAction : null} />
      ) : (
        <div className="inos-table-wrap">
          <table className="inos-table dl-table" data-testid="doc-list-table">
            <thead>
              <tr>
                <th className="dl-col-icon" aria-label="Type" />
                <th>Name</th>
                <th>Project name</th>
                <th>Version</th>
                <th>Status</th>
                <th>Date</th>
                <th>Review</th>
                <th className="dl-col-act">View</th>
                <th className="dl-col-act">Edit</th>
                <th className="dl-col-act">Delete</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const editable = canEdit && r.editable !== false && (editTo || onEdit);
                const deletable = canDelete && r.deletable !== false && onDelete;
                return (
                  <tr key={r.id} data-testid="doc-list-row">
                    <td className="dl-col-icon">
                      <span className="inos-icon-tile inos-icon-tile--sm">
                        <Icon aria-hidden />
                      </span>
                    </td>
                    <td className="dl-name">
                      <button type="button" className="dl-link" onClick={() => go(viewTo, onView, r)}>
                        {r.code && r.code !== r.name && <span className="dl-code">{r.code} · </span>}
                        {r.name || title}
                      </button>
                    </td>
                    <td className="dl-project-cell">{r.projectName || "—"}</td>
                    <td>
                      <button
                        type="button"
                        className="dl-version"
                        title="Revisions"
                        onClick={() => setHistory({ row: r, tab: "revisions" })}
                      >
                        v{r.version}
                      </button>
                    </td>
                    <td>
                      <ReviewStatusPill state={r.meta?.state} status={r.status} prettyStatus={prettyStatus} toneFor={toneFor} />
                    </td>
                    <td className="dl-date">{fmtDate(r.updatedAt)}</td>
                    <td>
                      <ReviewMenu
                        type={type}
                        id={r.id}
                        name={r.name}
                        canReview={canReview}
                        count={r.meta?.reviews || 0}
                        onOpenHistory={() => setHistory({ row: r, tab: "reviews" })}
                      />
                    </td>
                    <td className="dl-col-act">
                      <button type="button" className="dl-icon-btn" title="View" aria-label={`View ${r.name}`} onClick={() => go(viewTo, onView, r)} data-testid="doc-view">
                        <Eye aria-hidden />
                      </button>
                    </td>
                    <td className="dl-col-act">
                      <button
                        type="button"
                        className="dl-icon-btn"
                        title={editable ? "Edit" : "No edit access"}
                        aria-label={`Edit ${r.name}`}
                        disabled={!editable}
                        onClick={() => go(editTo, onEdit, r)}
                        data-testid="doc-edit"
                      >
                        <Pencil aria-hidden />
                      </button>
                    </td>
                    <td className="dl-col-act">
                      <button
                        type="button"
                        className="dl-icon-btn dl-icon-btn--danger"
                        title={deletable ? "Delete" : "No delete access"}
                        aria-label={`Delete ${r.name}`}
                        disabled={!deletable || deleting === r.id}
                        onClick={() => remove(r)}
                        data-testid="doc-delete"
                      >
                        <Trash2 aria-hidden />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const drawer = history && (
    <HistoryDrawer
      type={type}
      id={history.row.id}
      name={history.row.name}
      version={history.row.version}
      canReview={canReview}
      initialTab={history.tab}
      earlier={history.row.earlier?.map((e) => ({ id: e.id, version: e.version, updatedAt: e.updatedAt, row: e }))}
      onViewEarlier={(e) => go(viewTo, onView, e.row)}
      onClose={() => setHistory(null)}
    />
  );

  if (embedded)
    return (
      <>
        {table}
        {drawer}
      </>
    );
  return (
    <Page>
      <PageHeader title={title} actions={<>{headerActions}{createAction}</>} />
      {table}
      {drawer}
    </Page>
  );
}
