import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import {
  Button,
  Card,
  EmptyState,
  Page,
  PageHeader,
  SearchInput,
  Toolbar,
  ToolbarSpacer,
  prettyStatus,
  toneFor,
} from '@/components/inos';
import { useGetDocCapabilitiesQuery, useGetDocMetaQuery } from '@/api/doc-flow/doc-flow.api';
import { useGetProjectsQuery } from '@/api/projects/project.api';
import { HistoryDrawer, ReviewMenu, ReviewStatusPill } from './review';
import { fmtDate } from './doc-utils';
import { docCode } from '@/components/record-context/codes';
import './doc-list.css';

const RANK = { none: 0, view: 1, edit: 2, create: 3, full: 4 };

const isArchived = (row, meta) =>
  meta?.state === 'archive' || String(row.status ?? '').toLowerCase() === 'archived';

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
  nameColumn,
  // Optional second filter on row.group (e.g. drawing name on Tender / Working lists).
  groupFilter,
}) {
  const nav = useNavigate();
  const location = useLocation();
  const urlProject =
    new URLSearchParams(location.search).get('projectId') ||
    new URLSearchParams(location.search).get('project_id') ||
    '';
  const [q, setQ] = useState('');
  const [project, setProject] = useState(fixedProjectId || urlProject);
  const [archived, setArchived] = useState(false);
  const [history, setHistory] = useState(null);
  const [sort, setSort] = useState('new');
  const [group, setGroup] = useState('');

  const { data: meta = {} } = useGetDocMetaQuery(type, { skip: !type });
  const { data: caps } = useGetDocCapabilitiesQuery(type, { skip: !type });
  const { data: projectList } = useGetProjectsQuery({ includeArchived: true });
  const projectNames = useMemo(() => {
    const m = new Map();
    // "PRJ-001 · Name" (project codes, proto-records).
    for (const p of Array.isArray(projectList) ? projectList : (projectList?.data ?? []))
      m.set(p.id, { name: p.code ? `${p.code} · ${p.name}` : p.name, code: p.code });
    return m;
  }, [projectList]);
  const level = RANK[caps?.level ?? 'view'] ?? 1;
  const canReview = !!caps?.canReview;
  const canCreate = canCreateProp ?? level >= RANK.create;
  // Edit / Delete moved to the document page (DocActions); kept as props so callers need no change.
  void [canEditProp, canDeleteProp, editTo, onEdit, onDelete];

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
    for (const r of mapped)
      if (r.projectId) m.set(r.projectId, r.projectName || 'Untitled project');
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [mapped]);

  const groups = useMemo(() => {
    if (!groupFilter) return [];
    const scoped = mapped.filter((r) => !project || r.projectId === project);
    return [...new Set(scoped.map((r) => r.group).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b), undefined, { sensitivity: 'base', numeric: true }),
    );
  }, [mapped, groupFilter, project]);
  const activeGroup = groups.includes(group) ? group : '';

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return mapped
      .filter((r) => (archived ? isArchived(r, r.meta) : !isArchived(r, r.meta)))
      .filter((r) => !project || r.projectId === project)
      .filter((r) => !activeGroup || r.group === activeGroup)
      .filter(
        (r) =>
          !term ||
          [r.code, r.name, r.projectName, r.status, r.search, `v${r.version}`]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(term),
      )
      .sort((a, b) => {
        if (sort === 'az')
          return (
            String(a.projectName || '').localeCompare(String(b.projectName || ''), undefined, {
              sensitivity: 'base',
              numeric: true,
            }) ||
            String(a.name || '').localeCompare(String(b.name || ''), undefined, {
              sensitivity: 'base',
              numeric: true,
            })
          );
        const d = new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        return sort === 'old' ? -d : d;
      });
  }, [mapped, q, project, archived, sort, activeGroup]);

  const go = (to, fn, row) => (fn ? fn(row) : to && nav(typeof to === 'function' ? to(row) : to));
  const createAction =
    canCreate && (createTo || onCreate) ? (
      <Button
        variant="primary"
        icon={Plus}
        onClick={() => (onCreate ? onCreate() : nav(createTo))}
        data-testid="doc-list-create"
      >
        {createLabel || `New ${title}`}
      </Button>
    ) : null;

  const table = (
    <Card flush className="dl-card">
      <div className="dl-filters">
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder={`Search ${title}`} />
          {!fixedProjectId && (
            <select
              className="inos-select dl-project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              aria-label="Project"
            >
              <option value="">All projects</option>
              {projects.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          )}
          {groupFilter && (
            <select
              className="inos-select dl-group"
              value={activeGroup}
              onChange={(e) => setGroup(e.target.value)}
              aria-label={groupFilter}
              data-testid="doc-list-group"
            >
              <option value="">{groupFilter}</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          )}
          <select
            className="inos-select dl-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort"
            data-testid="doc-list-sort"
          >
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
            <option value="az">A – Z</option>
          </select>
          <label className="dl-archived">
            <input
              type="checkbox"
              checked={archived}
              onChange={(e) => setArchived(e.target.checked)}
            />
            Archived
          </label>
          <ToolbarSpacer />
          {embedded && createAction}
        </Toolbar>
      </div>
      {error ? (
        <EmptyState
          title={`Could not load ${title}`}
          text={error?.data?.message || 'Try again in a moment.'}
        />
      ) : loading ? (
        <div className="dl-loading">Loading…</div>
      ) : !shown.length ? (
        <EmptyState
          icon={Icon}
          title={archived ? 'Nothing archived' : `No ${title} yet`}
          text={emptyText}
          action={!archived && !q ? createAction : null}
        />
      ) : (
        <div className="inos-table-wrap">
          <table className="inos-table dl-table" data-testid="doc-list-table">
            <thead>
              <tr>
                <th className="dl-col-sno">S.No</th>
                <th>Project name</th>
                {nameColumn && <th>{nameColumn}</th>}
                <th className="dl-col-date">Date</th>
                <th className="dl-col-status">Status</th>
                <th className="dl-col-review">Review</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr
                  key={r.id}
                  data-testid="doc-list-row"
                  className="dl-row"
                  onClick={(e) =>
                    !e.target.closest('button, a, .dl-review') && go(viewTo, onView, r)
                  }
                >
                  <td className="dl-col-sno tabular">{i + 1}</td>
                  <td className="dl-name">
                    <button
                      type="button"
                      className="dl-link"
                      onClick={() => go(viewTo, onView, r)}
                      title={`Open ${r.name || title}`}
                    >
                      {r.projectName || 'No project'}
                    </button>
                  </td>
                  {nameColumn && (
                    <td className="dl-project-cell">
                      <button
                        type="button"
                        className="dl-link dl-link--plain"
                        onClick={() => go(viewTo, onView, r)}
                      >
                        {r.name || title}
                      </button>
                    </td>
                  )}
                  <td className="dl-date dl-col-date">{fmtDate(r.updatedAt)}</td>
                  <td className="dl-col-status">
                    <ReviewStatusPill
                      state={r.meta?.state}
                      status={r.status}
                      prettyStatus={prettyStatus}
                      toneFor={toneFor}
                    />
                  </td>
                  <td className="dl-col-review">
                    <div className="dl-review-cell">
                      <ReviewMenu
                        type={type}
                        id={r.id}
                        name={r.name}
                        canReview={canReview}
                        count={r.meta?.reviews || 0}
                        onOpenHistory={() => setHistory({ row: r, tab: 'reviews' })}
                      />
                    </div>
                  </td>
                </tr>
              ))}
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
      earlier={history.row.earlier?.map((e) => ({
        id: e.id,
        version: e.version,
        updatedAt: e.updatedAt,
        row: e,
      }))}
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
      <PageHeader
        title={title}
        actions={
          <>
            {headerActions}
            {createAction}
          </>
        }
      />
      {table}
      {drawer}
    </Page>
  );
}
