import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  Plus,
  MoreHorizontal,
  Edit,
  Archive,
  Trash2,
  RotateCcw,
  FileText,
  Download,
  RefreshCw,
  FolderOpen,
  ChevronRight,
  LayoutGrid,
  GitCommitHorizontal,
  Rows3,
  Layers,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  ArchiveRestore,
  Clock3,
} from "lucide-react";

import {
  Page,
  PageHeader,
  Card,
  Button,
  Stats,
  StatTile,
  Toolbar,
  ToolbarSpacer,
  SearchInput,
  Segmented,
  Tabs,
  Pill,
  StatusPill,
  EmptyState,
  Progress,
  FolderCard,
  folderToneFor,
} from "@/components/inos";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  PhaseStepper,
  PhaseLegend,
  Skeleton,
  formatDate,
  normalizeTreePhases,
  normalizeEmbeddedPhases,
  normalizeCommandCenterPhases,
  commandCenterProgress,
  phaseProgress,
} from "@/components/projects/_projects-ui";
import { useGetCommandCenterPortfolioQuery } from "@/api/projects/command-center.api";

import {
  useGetProjectsSummaryQuery,
  useGetProjectsQuery,
  useArchiveProjectMutation,
  useRestoreProjectMutation,
  useDeleteProjectMutation,
} from "../../api/projects/project.api";

import { useGetProjectDocumentPhaseTreeQuery } from "../../api/documents/document.api";

/* ============================================================
   CONSTANTS
============================================================ */

const STATUS_LABEL = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
  on_hold: "On hold",
};

const DOCUMENT_TEMPLATES = [
  {
    id: "site-visit-schedule-template",
    name: "Site visit schedule template",
    description: "Standard template for planning and recording project site visits.",
    type: "Template",
    format: "PDF",
    file: "/templates/site-visit-schedule-template.pdf",
  },
  {
    id: "how-we-work",
    name: "How we work",
    description:
      "Overview of the standard project workflow, processes, responsibilities, and ways of working.",
    type: "Guideline",
    format: "PDF",
    file: "/templates/how-we-work.pdf",
  },
];

const VIEW_KEY = "inos.projects.view";

/* ============================================================
   HELPERS — PROJECT
============================================================ */

const getProjectId = (project) => project?.id || project?.projectId || project?.project_id || "";

const getProjectName = (project) =>
  project?.name ||
  project?.projectName ||
  project?.title ||
  project?.code ||
  project?.project_code ||
  getProjectId(project) ||
  "Untitled project";

const getProjectCode = (project) => project?.code || project?.project_code || project?.slug || "";

const getClientName = (project) => project?.client?.name || project?.clientName || project?.client_name || "";

const getProjectType = (project) =>
  project?.project_type?.name ||
  project?.projectType?.name ||
  project?.project_type_name ||
  project?.projectTypeName ||
  "";

const getLocation = (project) => project?.site_location || project?.siteLocation || project?.location || "";

const getProjectStatus = (project) => String(project?.status || "active").toLowerCase();

const getEcd = (project) => project?.expected_completion_date || project?.expectedCompletionDate;

const getEmbeddedPhases = (project) => {
  const phases =
    project?.phases ||
    project?.project_phases ||
    project?.projectPhases ||
    project?.timeline ||
    project?.workflow?.phases ||
    [];
  return Array.isArray(phases) ? phases : [];
};

const findPhaseTreeProject = (project, phaseTree) => {
  const entries = Array.isArray(phaseTree?.projects) ? phaseTree.projects : Array.isArray(phaseTree) ? phaseTree : [];
  const projectId = String(getProjectId(project) || "");
  const projectName = getProjectName(project).trim().toLowerCase();
  return (
    entries.find((entry) => String(entry?.id || "") === projectId) ||
    entries.find((entry) => String(entry?.name || "").trim().toLowerCase() === projectName) ||
    null
  );
};

const getFallbackPhaseName = (project) => {
  const current = project?.current_phase || project?.currentPhase;
  if (typeof current === "string") return current;
  return current?.name || current?.title || project?.current_phase_name || project?.currentPhaseName || null;
};

const getFallbackDocumentName = (project) => {
  const document =
    project?.current_document ||
    project?.currentDocument ||
    project?.document_in_progress ||
    project?.documentInProgress ||
    project?.active_document ||
    project?.activeDocument ||
    null;
  if (typeof document === "string") return document;
  return document?.name || document?.title || project?.current_document_name || project?.currentDocumentName || null;
};

/**
 * Everything a card / row / table cell shows about a project's position,
 * derived once. Phase statuses only count as done when the data says so
 * (see treePhaseIsComplete) — no more "11 of 11 completed" on a new project.
 */
const getProjectInfo = (project, phaseTree) => {
  // Command Center rollup first — same phase / % as the Command Center and the project page.
  const cc = phaseTree?.ccById?.get(String(getProjectId(project)));
  if (cc?.phases?.length) {
    const phases = normalizeCommandCenterPhases(cc);
    const progress = commandCenterProgress(cc, phases);
    const docs = phases.reduce(
      (acc, p) => ({ uploaded: acc.uploaded + (p.docCounts?.uploaded || 0), total: acc.total + (p.docCounts?.total || 0) }),
      { uploaded: 0, total: 0 },
    );
    return {
      phases,
      progress,
      docs,
      phaseName: progress.current?.name || "Not started",
      documentName: getFallbackDocumentName(project) || null,
    };
  }
  const embedded = getEmbeddedPhases(project);
  const treeEntry = embedded.length ? null : findPhaseTreeProject(project, phaseTree);
  const phases = embedded.length ? normalizeEmbeddedPhases(embedded) : normalizeTreePhases(treeEntry?.phases || []);
  const progress = phaseProgress(phases);

  const docs = phases.reduce(
    (acc, p) => ({
      uploaded: acc.uploaded + (p.docCounts?.uploaded || 0),
      total: acc.total + (p.docCounts?.total || 0),
    }),
    { uploaded: 0, total: 0 },
  );

  const phaseName = progress.current?.name || getFallbackPhaseName(project) || (progress.total && progress.done === progress.total ? "All phases complete" : "Not started");

  return {
    phases,
    progress,
    docs,
    phaseName,
    documentName: progress.current?.pendingDocumentName || getFallbackDocumentName(project) || null,
  };
};

const readView = () => {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return ["grid", "timeline", "table"].includes(v) ? v : "grid";
  } catch {
    return "grid";
  }
};

/* ============================================================
   ROW ACTIONS MENU
============================================================ */

function ProjectMenu({ project, onArchive, onRestore, onDelete }) {
  const nav = useNavigate();
  const id = getProjectId(project);
  const name = getProjectName(project);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" icon={MoreHorizontal} aria-label={`Actions for ${name}`} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="inos-menu w-48">
        <DropdownMenuItem onSelect={() => nav(`/projects/${id}`)}>
          <ChevronRight className="mr-2 h-4 w-4" /> Open
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => nav(`/projects/${id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" /> Edit details
        </DropdownMenuItem>
        {getProjectStatus(project) !== "archived" ? (
          <DropdownMenuItem onSelect={() => onArchive(id, name)}>
            <Archive className="mr-2 h-4 w-4" /> Archive
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onRestore(id, name)}>
            <RotateCcw className="mr-2 h-4 w-4" /> Restore
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onDelete(id, name)} style={{ color: "var(--bad-fg)" }}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ============================================================
   GRID VIEW — folder cards
============================================================ */

function ProjectGrid({ projects, phaseTree }) {
  const nav = useNavigate();
  return (
    <div className="pj-grid">
      {projects.map((project) => {
        const id = getProjectId(project);
        const info = getProjectInfo(project, phaseTree);
        const { progress } = info;
        const location = getLocation(project);
        const client = getClientName(project);
        return (
          <FolderCard
            key={id}
            tone={folderToneFor(id)}
            title={getProjectName(project)}
            subtitle={[location, client].filter(Boolean).join(" · ") || "No site location"}
            badge={<StatusPill status={getProjectStatus(project)} size="sm" />}
            onClick={() => nav(`/projects/${id}`)}
            meta={
              <span className="pj-meta">
                <FileText aria-hidden />
                {info.docs.total ? `${info.docs.uploaded}/${info.docs.total} docs` : "No docs yet"}
              </span>
            }
            footer={
              <span className="pj-meta pj-muted">
                <Clock3 aria-hidden />
                {formatDate(project?.updated_at || project?.created_at)}
              </span>
            }
          >
            <div className="pj-folder-body">
              <div className="pj-folder-phase">
                <span className="pj-folder-phase__name" style={progress.started ? undefined : { color: "var(--text-3)", fontWeight: 550 }}>
                  {info.phaseName}
                </span>
                {progress.total > 0 && (
                  <span className="pj-folder-phase__count">
                    {progress.done}/{progress.total} phases
                  </span>
                )}
              </div>
              <Progress value={progress.percent} tone={progress.percent === 100 ? "ok" : undefined} />
            </div>
          </FolderCard>
        );
      })}
    </div>
  );
}

/* ============================================================
   TIMELINE VIEW — compact rows with a slim stepper
============================================================ */

function ProjectTimeline({ projects, phaseTree, actions }) {
  const nav = useNavigate();
  return (
    <Card flush title="Phase timeline" subtitle="Where every project sits across the 11 delivery phases" actions={<PhaseLegend />}>
      {projects.map((project) => {
        const id = getProjectId(project);
        const info = getProjectInfo(project, phaseTree);
        const { progress } = info;
        const location = getLocation(project);
        return (
          <div className="pj-trow" key={id}>
            <div style={{ minWidth: 0 }}>
              <button type="button" className="pj-trow__name" onClick={() => nav(`/projects/${id}`)}>
                {getProjectName(project)}
              </button>
              <div className="pj-trow__sub pj-truncate">
                {[location, getClientName(project)].filter(Boolean).join(" · ") || "No site location"}
              </div>
            </div>

            <div className="pj-trow__phase">
              <div className="pj-trow__phase-top">
                <span className="pj-truncate">
                  {progress.started ? (
                    <>
                      <span className="pj-muted">Now · </span>
                      <b style={{ fontWeight: 600 }}>{info.phaseName}</b>
                    </>
                  ) : (
                    <span className="pj-muted">{info.phaseName}</span>
                  )}
                  {info.documentName && <span className="pj-muted"> — {info.documentName}</span>}
                </span>
                {progress.total > 0 && (
                  <span className="pj-muted tabular" style={{ flexShrink: 0 }}>
                    {progress.done}/{progress.total}
                  </span>
                )}
              </div>
              {progress.total > 0 ? (
                <PhaseStepper phases={info.phases} label={`${getProjectName(project)} phases`} />
              ) : (
                <span className="pj-muted" style={{ fontSize: 12 }}>
                  Phases not configured
                </span>
              )}
            </div>

            <div className="pj-trow__stat">
              <StatusPill status={getProjectStatus(project)} size="sm" />
              <span className="pj-muted">ECD {formatDate(getEcd(project))}</span>
            </div>

            <ProjectMenu project={project} {...actions} />
          </div>
        );
      })}
    </Card>
  );
}

/* ============================================================
   TABLE VIEW
============================================================ */

function ProjectTable({ projects, phaseTree, actions }) {
  const nav = useNavigate();
  return (
    <Card flush>
      <div className="inos-table-wrap">
        <table className="inos-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Client</th>
              <th>Current phase</th>
              <th>Progress</th>
              <th>Status</th>
              <th>ECD</th>
              <th className="actions" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const id = getProjectId(project);
              const info = getProjectInfo(project, phaseTree);
              return (
                <tr key={id} className="is-clickable" onClick={() => nav(`/projects/${id}`)}>
                  <td style={{ maxWidth: 260 }}>
                    <div className="pj-cell-title pj-truncate">{getProjectName(project)}</div>
                    <div className="pj-cell-sub pj-truncate">{getLocation(project) || getProjectCode(project)}</div>
                  </td>
                  <td className={getClientName(project) ? "" : "muted"}>{getClientName(project) || "—"}</td>
                  <td style={{ maxWidth: 240 }}>
                    <div className="pj-truncate" style={{ fontWeight: 550 }}>{info.phaseName}</div>
                    {info.documentName && <div className="pj-cell-sub pj-truncate">{info.documentName}</div>}
                  </td>
                  <td>
                    <div className="pj-progress-cell">
                      <Progress value={info.progress.percent} />
                      <span>{info.progress.percent}%</span>
                    </div>
                  </td>
                  <td>
                    <StatusPill status={getProjectStatus(project)} />
                  </td>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>
                    {formatDate(getEcd(project))}
                  </td>
                  <td className="actions" onClick={(e) => e.stopPropagation()}>
                    <ProjectMenu project={project} {...actions} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ============================================================
   DOCUMENTS TAB
============================================================ */

function DocumentsView() {
  const nav = useNavigate();
  return (
    <Card
      flush
      title="Templates & guidelines"
      subtitle="Approved templates available to every project team."
      actions={
        <Button variant="secondary" size="sm" icon={FolderOpen} onClick={() => nav("/projects/documents/all")}>
          Project documents
        </Button>
      }
    >
      <div className="inos-table-wrap">
        <table className="inos-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Type</th>
              <th>Format</th>
              <th className="actions" aria-label="Download" />
            </tr>
          </thead>
          <tbody>
            {DOCUMENT_TEMPLATES.map((document) => (
              <tr key={document.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <span className="inos-icon-tile inos-icon-tile--sm">
                      <FileText aria-hidden />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="pj-cell-title">{document.name}</div>
                      <div className="pj-cell-sub">{document.description}</div>
                    </div>
                  </div>
                </td>
                <td className="muted">{document.type}</td>
                <td>
                  <Pill tone="brand" dot={false} size="sm">
                    {document.format}
                  </Pill>
                </td>
                <td className="actions">
                  <a href={document.file} download className="inos-btn inos-btn--soft inos-btn--sm">
                    <Download aria-hidden />
                    <span>Download</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ============================================================
   MAIN
============================================================ */

export default function ProjectsDashboard() {
  const nav = useNavigate();

  const [tab, setTab] = useState("all");
  const [view, setViewState] = useState(readView);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const setView = (v) => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* per-viewer convenience only */
    }
  };

  /* -------------------------------------------------- Queries */

  const { data: summary, isFetching: summaryLoading, isError: summaryError } = useGetProjectsSummaryQuery();

  const {
    data: projectsResponse,
    isFetching: projectsLoading,
    isError: projectsError,
    refetch,
  } = useGetProjectsQuery({});

  const { data: docPhaseTree, isFetching: phaseTreeLoading, isError: phaseTreeError } =
    useGetProjectDocumentPhaseTreeQuery();
  const { data: portfolio } = useGetCommandCenterPortfolioQuery({});
  // phase source for every card/row: Command Center rollup by project id, document tree as fallback
  const phaseTree = useMemo(
    () => ({
      projects: Array.isArray(docPhaseTree) ? docPhaseTree : docPhaseTree?.projects || [],
      ccById: new Map((Array.isArray(portfolio) ? portfolio : []).map((r) => [String(r.id), r])),
    }),
    [docPhaseTree, portfolio],
  );

  const projects = useMemo(() => {
    if (Array.isArray(projectsResponse)) return projectsResponse;
    return projectsResponse?.data || projectsResponse?.projects || [];
  }, [projectsResponse]);

  /* -------------------------------------------------- Mutations */

  const [archiveProject] = useArchiveProjectMutation();
  const [restoreProject] = useRestoreProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();

  /* -------------------------------------------------- Errors */

  useEffect(() => {
    if (summaryError || projectsError) toast.error("Projects could not be loaded.");
  }, [summaryError, projectsError]);

  useEffect(() => {
    if (phaseTreeError) toast.error("Project timeline phases could not be loaded.");
  }, [phaseTreeError]);

  /* -------------------------------------------------- Filter */

  const filteredProjects = useMemo(() => {
    const search = q.trim().toLowerCase();
    return projects.filter((project) => {
      const status = getProjectStatus(project);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!search) return true;
      const { phaseName, documentName } = getProjectInfo(project, phaseTree);
      return [
        getProjectName(project),
        getProjectCode(project),
        getClientName(project),
        getProjectType(project),
        getLocation(project),
        phaseName,
        documentName,
      ].some((value) => String(value || "").toLowerCase().includes(search));
    });
  }, [projects, q, statusFilter, phaseTree]);

  /* -------------------------------------------------- Actions */

  const handleStatusCardClick = (status) => {
    setTab("all");
    setStatusFilter((prev) => (prev === status ? "all" : status));
  };

  const handleArchive = async (id, name) => {
    if (!window.confirm(`Archive project "${name}"?`)) return;
    try {
      await archiveProject({ id, archived_by: "current_user" }).unwrap();
      toast.success(`"${name}" has been archived.`);
    } catch (error) {
      toast.error(error?.data?.message || "The project could not be archived.");
    }
  };

  const handleRestore = async (id, name) => {
    if (!window.confirm(`Restore project "${name}"?`)) return;
    try {
      await restoreProject(id).unwrap();
      toast.success(`"${name}" has been restored.`);
    } catch (error) {
      toast.error(error?.data?.message || "The project could not be restored.");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Permanently delete "${name}"?\n\nThis action cannot be undone.`)) return;
    try {
      await deleteProject(id).unwrap();
      toast.success(`"${name}" was deleted.`);
    } catch (error) {
      toast.error(error?.data?.message || "The project could not be deleted.");
    }
  };

  const actions = { onArchive: handleArchive, onRestore: handleRestore, onDelete: handleDelete };
  const loading = summaryLoading || projectsLoading;

  /* -------------------------------------------------- Summary */

  const countBy = (s) => projects.filter((project) => getProjectStatus(project) === s).length;
  const total = summary?.total ?? projects.length;
  const active = summary?.active ?? countBy("active");
  const completed = summary?.completed ?? countBy("completed");
  const onHold = summary?.on_hold ?? countBy("on_hold");
  const archived = summary?.archived ?? countBy("archived");

  const tiles = [
    { key: "all", label: "All projects", value: total, meta: "In the workspace", icon: <Layers />, tone: undefined },
    { key: "active", label: "Active", value: active, meta: "Currently running", icon: <PlayCircle />, tone: "ok" },
    { key: "on_hold", label: "On hold", value: onHold, meta: "Need attention", icon: <PauseCircle />, tone: "peach" },
    { key: "completed", label: "Completed", value: completed, meta: "Handed over", icon: <CheckCircle2 />, tone: "info" },
    { key: "archived", label: "Archived", value: archived, meta: "Out of view", icon: <ArchiveRestore />, tone: "lilac" },
  ];

  const showSkeleton = loading || (view !== "table" && phaseTreeLoading && !phaseTree);

  /* -------------------------------------------------- Render */

  return (
    <Page className="pj-page">
      <PageHeader
        title="Projects"
        subtitle="Every project from brief to handover — see where each one stands and open its workspace."
        actions={
          <>
            <Button
              variant="ghost"
              icon={RefreshCw}
              onClick={() => refetch()}
              disabled={loading}
              aria-label="Refresh projects"
              title="Refresh"
            />
            <Button variant="primary" icon={Plus} onClick={() => nav("/projects/new")} data-testid="btn-new-project">
              New project
            </Button>
          </>
        }
      />

      <Stats>
        {tiles.map((t) => (
          <StatTile
            key={t.key}
            label={t.label}
            value={loading && !projects.length ? "—" : t.value}
            meta={t.meta}
            icon={t.icon}
            tone={t.tone}
            active={tab === "all" && statusFilter === t.key}
            onClick={() => handleStatusCardClick(t.key)}
          />
        ))}
      </Stats>

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "all", label: "Projects", count: projects.length },
          { value: "documents", label: "Documents", count: DOCUMENT_TEMPLATES.length },
        ]}
      />

      {tab === "documents" ? (
        <DocumentsView />
      ) : (
        <>
          <Toolbar>
            <SearchInput value={q} onChange={setQ} placeholder="Search project, client, location, phase…" />
            <Segmented
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "on_hold", label: "On hold" },
                { value: "completed", label: "Completed" },
                { value: "archived", label: "Archived" },
              ]}
            />
            <ToolbarSpacer />
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: "grid", label: "Grid", icon: LayoutGrid },
                { value: "timeline", label: "Timeline", icon: GitCommitHorizontal },
                { value: "table", label: "Table", icon: Rows3 },
              ]}
            />
          </Toolbar>

          {showSkeleton ? (
            view === "grid" ? (
              <div className="pj-grid">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} height={236} />
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                <Skeleton height={64} />
                <Skeleton height={64} />
                <Skeleton height={64} />
              </div>
            )
          ) : !filteredProjects.length ? (
            <Card>
              <EmptyState
                icon={FolderOpen}
                title={projects.length ? "No projects match" : "No projects yet"}
                text={
                  q
                    ? "Try a different search term."
                    : statusFilter !== "all"
                      ? `There are no ${String(STATUS_LABEL[statusFilter] || statusFilter).toLowerCase()} projects right now.`
                      : "Create your first project to start tracking phases, documents and handover."
                }
                action={
                  q ? (
                    <Button variant="secondary" onClick={() => setQ("")}>
                      Clear search
                    </Button>
                  ) : statusFilter !== "all" ? (
                    <Button variant="secondary" onClick={() => setStatusFilter("all")}>
                      Show all projects
                    </Button>
                  ) : (
                    <Button variant="primary" icon={Plus} onClick={() => nav("/projects/new")}>
                      New project
                    </Button>
                  )
                }
              />
            </Card>
          ) : view === "grid" ? (
            <ProjectGrid projects={filteredProjects} phaseTree={phaseTree} />
          ) : view === "timeline" ? (
            <ProjectTimeline projects={filteredProjects} phaseTree={phaseTree} actions={actions} />
          ) : (
            <ProjectTable projects={filteredProjects} phaseTree={phaseTree} actions={actions} />
          )}

          {!showSkeleton && filteredProjects.length > 0 && (
            <p className="pj-muted" style={{ fontSize: 12.5, margin: "-8px 0 0" }}>
              Showing {filteredProjects.length} of {projects.length} project{projects.length !== 1 ? "s" : ""}
              {statusFilter !== "all" ? ` · ${STATUS_LABEL[statusFilter] || statusFilter}` : ""}
            </p>
          )}
        </>
      )}
    </Page>
  );
}
