import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Download,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  FolderOpen,
  Folder,
  AlertTriangle,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { downloadDocument } from "../../hooks/shared";
import {
  Page,
  PageHeader,
  Card,
  Button as InosButton,
  Stats,
  StatTile,
  Toolbar,
  ToolbarSpacer,
  SearchInput,
  SelectInput,
  Pill,
  EmptyState,
  Progress,
  folderToneFor,
} from "@/components/inos";
import { Skeleton as PjSkeleton, cleanPhaseName } from "@/components/projects/_projects-ui";

import {
  useGetProjectDocumentPhasesQuery,
  useGetProjectDocumentPhaseTreeQuery,
  useGetDocumentTypesQuery,
  useUpdateDocumentMutation,
  useReplaceDocumentFileMutation,
} from "../../api/documents/document.api";

import { useGetProjectsQuery } from "../../api/projects/project.api";

const ALL_PROJECTS = "__all__";

/* ============================================================
   HELPERS
============================================================ */

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getProjectName = (project, fallback = "Project") => {
  if (!project) return fallback;
  return (
    project.name ||
    project.projectName ||
    project.title ||
    project.code ||
    project.project_code ||
    project.id ||
    fallback
  );
};

const getPhaseId = (phase, index = 0) =>
  phase?.id ||
  phase?.projectPhaseId ||
  phase?.phaseCode ||
  phase?.phase_code ||
  `phase-${index}`;

const getProjectId = (project) =>
  project?.id || project?.projectId || project?.project_id || "";

const getDocumentTypeId = (documentType) =>
  documentType?.documentTypeId ||
  documentType?.id ||
  documentType?.document_type_id ||
  "";

const getUploadCount = (documentType) => {
  if (typeof documentType?.uploadCount === "number")
    return documentType.uploadCount;
  if (Array.isArray(documentType?.documents))
    return documentType.documents.length;
  if (Array.isArray(documentType?.documentIds))
    return documentType.documentIds.length;
  return documentType?.isUploaded ? 1 : 0;
};

const getDocumentIds = (documentType) => {
  if (Array.isArray(documentType?.documentIds)) {
    return documentType.documentIds.filter(Boolean);
  }
  if (Array.isArray(documentType?.documents)) {
    return documentType.documents
      .map((document) => document?.id)
      .filter(Boolean);
  }
  if (documentType?.latestDocumentId) return [documentType.latestDocumentId];
  return [];
};

const getLatestDocumentId = (documentType) =>
  documentType?.latestDocumentId || getDocumentIds(documentType)[0] || null;

const isRequiredDocument = (documentType) =>
  String(documentType?.requirementType || "REQUIRED").toUpperCase() ===
  "REQUIRED";

const getPhaseDocuments = (phase) => {
  if (Array.isArray(phase?.documents)) return phase.documents;
  if (Array.isArray(phase?.documentTypes)) return phase.documentTypes;
  return [];
};

const clampPercent = (value) => Math.min(Math.max(value, 0), 100);

/* ============================================================
   SHARED BITS
============================================================ */

function ProgressStat({ percentage }) {
  return (
    <div className="pj-progress-cell" style={{ minWidth: 120 }}>
      <Progress value={clampPercent(percentage)} tone={percentage >= 100 ? "ok" : undefined} />
      <span>{percentage}%</span>
    </div>
  );
}

function Stat({ label, value, warn }) {
  return (
    <div className="pj-collapse-stat">
      <b style={warn ? { color: "var(--bad-fg)" } : undefined}>{value}</b>
      {label}
    </div>
  );
}

/* ============================================================
   DOCUMENT TYPE ROW
============================================================ */

function DocumentTypeRow({ documentType, projectId, onUpload, onDownload }) {
  const uploadCount = getUploadCount(documentType);
  const documentIds = getDocumentIds(documentType);
  const isUploaded = Boolean(documentType?.isUploaded) || uploadCount > 0;
  const isRequired = isRequiredDocument(documentType);
  const allowsMultiple = Boolean(documentType?.allowsMultiple);
  const latestDocumentId = getLatestDocumentId(documentType);

  return (
    <>
      <div className="pj-doc-row">
        <span
          className={cn("inos-icon-tile inos-icon-tile--sm", isUploaded ? "inos-icon-tile--ok" : isRequired ? "inos-icon-tile--peach" : "")}
          aria-label={isUploaded ? "Uploaded" : isRequired ? "Required, pending" : "Pending"}
        >
          {isUploaded ? <CheckCircle2 aria-hidden /> : <FileText aria-hidden />}
        </span>

        <div className="pj-list-item__main">
          <div className="pj-chip-row" style={{ gap: 8 }}>
            <span className="pj-cell-title" style={{ fontSize: 14 }}>
              {documentType?.name || "Untitled document"}
            </span>
            {documentType?.code && <span className="pj-code">{documentType.code}</span>}
            {isRequired ? (
              <Pill tone="peach" size="sm" dot={false}>
                Required
              </Pill>
            ) : (
              <Pill tone="mute" size="sm" dot={false}>
                Optional
              </Pill>
            )}
          </div>
          <div className="pj-list-item__sub">
            {[
              documentType?.description,
              isUploaded ? `${uploadCount} upload${uploadCount !== 1 ? "s" : ""}` : "Not uploaded",
              documentType?.latestUploadedAt && `Latest ${formatDate(documentType.latestUploadedAt)}`,
              allowsMultiple && "Multiple allowed",
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {!isUploaded ? (
            <InosButton size="sm" variant="primary" icon={Upload} onClick={() => onUpload(documentType, projectId)}>
              Upload
            </InosButton>
          ) : (
            <>
              <InosButton
                size="sm"
                variant="secondary"
                icon={Upload}
                onClick={() => onUpload(documentType, projectId)}
                title={allowsMultiple ? "Upload another file" : "Replace file"}
              >
                {allowsMultiple ? "Add" : "Replace"}
              </InosButton>
              {latestDocumentId && (
                <InosButton
                  size="sm"
                  variant="ghost"
                  icon={Download}
                  onClick={() => onDownload(latestDocumentId)}
                  aria-label="Download latest document"
                  title="Download latest document"
                />
              )}
            </>
          )}
        </div>
      </div>

      {allowsMultiple && documentIds.length > 1 && (
        <div className="pj-doc-files">
          {documentIds.map((documentId, index) => (
            <InosButton key={documentId} size="sm" variant="soft" icon={Download} onClick={() => onDownload(documentId)}>
              File {index + 1}
            </InosButton>
          ))}
        </div>
      )}
    </>
  );
}

/* ============================================================
   PHASE CARD
============================================================ */

function DocumentPhaseCard({ phase, projectId, collapsed, onToggle, onUpload, onDownload, nested }) {
  const documents = getPhaseDocuments(phase);
  const summary = phase?.summary || {};

  const total = typeof summary.total === "number" ? summary.total : documents.length;
  const uploaded = typeof summary.uploaded === "number" ? summary.uploaded : documents.filter((item) => item?.isUploaded).length;
  const pending = typeof summary.pending === "number" ? summary.pending : Math.max(total - uploaded, 0);
  const required = typeof summary.required === "number" ? summary.required : documents.filter(isRequiredDocument).length;
  const uploadedRequired =
    typeof summary.uploadedRequired === "number"
      ? summary.uploadedRequired
      : documents.filter((item) => isRequiredDocument(item) && item?.isUploaded).length;
  const pendingRequired =
    typeof summary.pendingRequired === "number" ? summary.pendingRequired : Math.max(required - uploadedRequired, 0);
  const completionPercentage = total > 0 ? Math.round((uploaded / total) * 100) : 0;

  // A phase with nothing configured is not "complete" — it's empty.
  const isEmpty = total === 0;
  const isComplete = !isEmpty && (typeof phase?.isComplete === "boolean" ? phase.isComplete : pendingRequired === 0) && uploaded > 0;

  return (
    <section className={nested ? "inos-card inos-card--flat" : "inos-card"} style={{ overflow: "hidden" }}>
      <button type="button" className="pj-collapse-head" aria-expanded={!collapsed} onClick={onToggle}>
        <ChevronRight className="pj-chevron" aria-hidden />
        <span className="inos-icon-tile inos-icon-tile--sm tabular" style={{ fontSize: 12, fontWeight: 700 }}>
          {phase?.phaseNumber || phase?.phase_number || "—"}
        </span>
        <div className="pj-list-item__main">
          <div className="pj-chip-row" style={{ gap: 8 }}>
            <span className="pj-cell-title">{phase?.title ? cleanPhaseName(phase.title) : "Untitled phase"}</span>
            {isEmpty ? (
              <Pill tone="mute" size="sm">
                No documents set
              </Pill>
            ) : isComplete ? (
              <Pill tone="ok" size="sm">
                Complete
              </Pill>
            ) : (
              <Pill tone="warn" size="sm">
                {pendingRequired > 0 ? `${pendingRequired} required pending` : "Pending"}
              </Pill>
            )}
          </div>
          {phase?.description && <div className="pj-list-item__sub">{phase.description}</div>}
        </div>
        {!isEmpty && (
          <div className="pj-collapse-stats">
            <Stat label="uploaded" value={`${uploaded}/${total}`} />
            <Stat label="required" value={`${uploadedRequired}/${required}`} warn={pendingRequired > 0} />
            <ProgressStat percentage={completionPercentage} />
          </div>
        )}
      </button>

      {!collapsed && (
        <div>
          {documents.length ? (
            documents.map((documentType) => (
              <DocumentTypeRow
                key={getDocumentTypeId(documentType) || documentType?.code}
                documentType={documentType}
                projectId={projectId}
                onUpload={onUpload}
                onDownload={onDownload}
              />
            ))
          ) : (
            <div className="pj-doc-row pj-muted" style={{ justifyContent: "center", fontSize: 13 }}>
              No document types configured for this phase yet.
            </div>
          )}
          {!isEmpty && (
            <div className="pj-doc-row" style={{ justifyContent: "space-between", background: "var(--surface-2)", fontSize: 12.5 }}>
              <span className="pj-muted">
                {pending} pending document{pending !== 1 ? "s" : ""}
              </span>
              <span style={{ fontWeight: 600, color: pendingRequired > 0 ? "var(--warn-fg)" : "var(--ok-fg)" }}>
                {pendingRequired > 0 ? `${pendingRequired} required pending` : "All required documents uploaded"}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   PROJECT TREE CARD
============================================================ */

function ProjectTreeCard({ project, collapsed, onToggle, children }) {
  const projectId = getProjectId(project);
  const projectName = getProjectName(project, projectId || "Project");
  const phases = Array.isArray(project?.phases) ? project.phases : [];

  const totalPhases = phases.length;
  const completedPhases = phases.filter((phase) => {
    const t = phase?.summary?.total ?? getPhaseDocuments(phase).length;
    const u = phase?.summary?.uploaded ?? getPhaseDocuments(phase).filter((d) => d?.isUploaded).length;
    return phase?.isComplete && t > 0 && u > 0;
  }).length;
  const totalDocuments = phases.reduce((total, phase) => total + (phase?.summary?.total ?? getPhaseDocuments(phase).length), 0);
  const uploadedDocuments = phases.reduce(
    (total, phase) =>
      total + (phase?.summary?.uploaded ?? getPhaseDocuments(phase).filter((documentType) => documentType?.isUploaded).length),
    0,
  );
  const completionPercentage = totalDocuments > 0 ? Math.round((uploadedDocuments / totalDocuments) * 100) : 0;

  return (
    <section className="inos-card" style={{ overflow: "hidden" }}>
      <button type="button" className="pj-collapse-head" aria-expanded={!collapsed} onClick={onToggle} style={{ padding: "16px 20px" }}>
        <ChevronRight className="pj-chevron" aria-hidden />
        <span className={cn("inos-icon-tile", folderToneFor(projectId) !== "brand" && `inos-icon-tile--${folderToneFor(projectId)}`)}>
          {collapsed ? <Folder aria-hidden /> : <FolderOpen aria-hidden />}
        </span>
        <div className="pj-list-item__main">
          <div className="pj-cell-title" style={{ fontSize: 15.5 }}>
            {projectName}
          </div>
          <div className="pj-list-item__sub">{project?.site_location || project?.code || `${totalPhases} phases`}</div>
        </div>
        <div className="pj-collapse-stats">
          <Stat label="phases" value={`${completedPhases}/${totalPhases}`} />
          <Stat label="documents" value={`${uploadedDocuments}/${totalDocuments}`} />
          <ProgressStat percentage={completionPercentage} />
        </div>
      </button>

      {!collapsed && (
        <div style={{ display: "grid", gap: 10, padding: 12, background: "var(--surface-2)", borderTop: "1px solid var(--line)" }}>
          {children}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

export function DocumentsAll() {
  const nav = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const urlProjectId =
    searchParams.get("project_id") || searchParams.get("projectId") || "";

  const [selectedProjectId, setSelectedProjectId] = useState(urlProjectId);
  const [q, setQ] = useState("");
  const [collapsedProjects, setCollapsedProjects] = useState({});
  const [collapsedPhases, setCollapsedPhases] = useState({});
  const [showCompleted, setShowCompleted] = useState(true);

  /* -------------------------------------------------- Projects */

  const { data: projectsResponse, isLoading: projectsLoading } =
    useGetProjectsQuery({});

  const projects = useMemo(() => {
    if (Array.isArray(projectsResponse)) return projectsResponse;
    return projectsResponse?.data || projectsResponse?.projects || [];
  }, [projectsResponse]);

  /* -------------------------------------------------- All-project tree */

  const {
    data: allProjectTreeResponse,
    isLoading: allTreeLoading,
    isFetching: allTreeFetching,
    isError: allTreeError,
    error: allTreeErrorData,
    refetch: refetchAllTree,
  } = useGetProjectDocumentPhaseTreeQuery(undefined, {
    skip: Boolean(selectedProjectId),
  });

  /* -------------------------------------------------- Selected project tree */

  const {
    data: selectedProjectResponse,
    isLoading: selectedProjectLoading,
    isFetching: selectedProjectFetching,
    isError: selectedProjectError,
    error: selectedProjectErrorData,
    refetch: refetchSelectedProject,
  } = useGetProjectDocumentPhasesQuery(selectedProjectId, {
    skip: !selectedProjectId,
  });

  /* -------------------------------------------------- Normalize */

  const allProjectData = useMemo(() => {
    if (!allProjectTreeResponse) return { projects: [], summary: {} };

    const projectsData = Array.isArray(allProjectTreeResponse)
      ? allProjectTreeResponse
      : allProjectTreeResponse?.projects ||
        allProjectTreeResponse?.data?.projects ||
        [];

    const summary =
      allProjectTreeResponse?.summary ||
      allProjectTreeResponse?.data?.summary ||
      {};

    return {
      projects: Array.isArray(projectsData) ? projectsData : [],
      summary,
    };
  }, [allProjectTreeResponse]);

  const selectedProjectData = useMemo(() => {
    if (!selectedProjectResponse) return { phases: [], summary: {} };

    const phases = Array.isArray(selectedProjectResponse)
      ? selectedProjectResponse
      : selectedProjectResponse?.phases ||
        selectedProjectResponse?.data?.phases ||
        [];

    const summary =
      selectedProjectResponse?.summary ||
      selectedProjectResponse?.data?.summary ||
      {};

    return { phases: Array.isArray(phases) ? phases : [], summary };
  }, [selectedProjectResponse]);

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find(
      (project) => String(getProjectId(project)) === String(selectedProjectId),
    );
  }, [projects, selectedProjectId]);

  const selectedProjectName = getProjectName(
    selectedProject,
    selectedProjectId || "Project",
  );

  /* -------------------------------------------------- Project selection */

  const handleProjectChange = (value) => {
    const projectId = value === ALL_PROJECTS ? "" : value;
    setSelectedProjectId(projectId);

    const params = new URLSearchParams(searchParams);
    if (projectId) {
      params.set("project_id", projectId);
    } else {
      params.delete("project_id");
      params.delete("projectId");
    }

    const query = params.toString();
    nav(query ? `${location.pathname}?${query}` : location.pathname, {
      replace: true,
    });
  };

  /* -------------------------------------------------- Search */

  const searchProject = (project, search) => {
    const projectName = getProjectName(project, "").toLowerCase();
    const projectCode = String(
      project?.code || project?.project_code || "",
    ).toLowerCase();
    const projectId = String(getProjectId(project)).toLowerCase();

    return (
      projectName.includes(search) ||
      projectCode.includes(search) ||
      projectId.includes(search)
    );
  };

  const filterPhases = (phases, search) => {
    if (!Array.isArray(phases)) return [];
    if (!search) return phases;

    return phases
      .map((phase) => {
        const documents = getPhaseDocuments(phase);
        const phaseTitle = String(phase?.title || "").toLowerCase();
        const phaseCode = String(
          phase?.phaseCode || phase?.phase_code || "",
        ).toLowerCase();
        const phaseMatches =
          phaseTitle.includes(search) || phaseCode.includes(search);

        const filteredDocuments = documents.filter((documentType) => {
          const name = String(documentType?.name || "").toLowerCase();
          const code = String(documentType?.code || "").toLowerCase();
          const description = String(
            documentType?.description || "",
          ).toLowerCase();
          return (
            name.includes(search) ||
            code.includes(search) ||
            description.includes(search)
          );
        });

        if (phaseMatches || filteredDocuments.length) {
          return {
            ...phase,
            documents: phaseMatches ? documents : filteredDocuments,
          };
        }

        return null;
      })
      .filter(Boolean);
  };

  const visibleProjects = useMemo(() => {
    const search = q.trim().toLowerCase();
    let result = allProjectData.projects;

    if (search) {
      result = result
        .map((project) => {
          const projectMatches = searchProject(project, search);
          const phases = Array.isArray(project?.phases) ? project.phases : [];
          const filteredPhases = filterPhases(phases, search);

          if (projectMatches || filteredPhases.length) {
            return {
              ...project,
              phases: projectMatches ? phases : filteredPhases,
            };
          }

          return null;
        })
        .filter(Boolean);
    }

    if (!showCompleted) {
      result = result.map((project) => ({
        ...project,
        phases: (Array.isArray(project?.phases) ? project.phases : []).filter(
          (phase) => !phase?.isComplete,
        ),
      }));
    }

    return result;
  }, [allProjectData.projects, q, showCompleted]);

  const visiblePhases = useMemo(() => {
    const search = q.trim().toLowerCase();
    let result = filterPhases(selectedProjectData.phases, search);

    if (!showCompleted) {
      result = result.filter((phase) => !phase?.isComplete);
    }

    return result;
  }, [selectedProjectData.phases, q, showCompleted]);

  /* -------------------------------------------------- Summary */

  const activeSummary = selectedProjectId
    ? selectedProjectData.summary || {}
    : allProjectData.summary || {};

  const totalProjects = selectedProjectId
    ? 1
    : (activeSummary.totalProjects ?? allProjectData.projects.length);

  const completedPhases =
    activeSummary.completedPhases ??
    (selectedProjectId
      ? selectedProjectData.phases.filter((phase) => phase?.isComplete).length
      : allProjectData.projects.reduce(
          (total, project) =>
            total +
            (Array.isArray(project?.phases)
              ? project.phases.filter((phase) => phase?.isComplete).length
              : 0),
          0,
        ));

  const totalPhases =
    activeSummary.totalPhases ??
    (selectedProjectId
      ? selectedProjectData.phases.length
      : allProjectData.projects.reduce(
          (total, project) =>
            total +
            (Array.isArray(project?.phases) ? project.phases.length : 0),
          0,
        ));

  const totalDocuments =
    activeSummary.totalDocuments ??
    (selectedProjectId
      ? selectedProjectData.phases.reduce(
          (total, phase) => total + getPhaseDocuments(phase).length,
          0,
        )
      : allProjectData.projects.reduce(
          (total, project) =>
            total +
            (Array.isArray(project?.phases)
              ? project.phases.reduce(
                  (phaseTotal, phase) =>
                    phaseTotal + getPhaseDocuments(phase).length,
                  0,
                )
              : 0),
          0,
        ));

  const uploadedDocuments =
    activeSummary.uploadedDocuments ??
    (selectedProjectId
      ? selectedProjectData.phases.reduce(
          (total, phase) =>
            total +
            getPhaseDocuments(phase).filter(
              (documentType) => documentType?.isUploaded,
            ).length,
          0,
        )
      : allProjectData.projects.reduce(
          (total, project) =>
            total +
            (Array.isArray(project?.phases)
              ? project.phases.reduce(
                  (phaseTotal, phase) =>
                    phaseTotal +
                    getPhaseDocuments(phase).filter(
                      (documentType) => documentType?.isUploaded,
                    ).length,
                  0,
                )
              : 0),
          0,
        ));

  const pendingDocuments =
    activeSummary.pendingDocuments ??
    Math.max(totalDocuments - uploadedDocuments, 0);

  const requiredDocuments =
    activeSummary.requiredDocuments ??
    (selectedProjectId
      ? selectedProjectData.phases.reduce(
          (total, phase) =>
            total + getPhaseDocuments(phase).filter(isRequiredDocument).length,
          0,
        )
      : allProjectData.projects.reduce(
          (total, project) =>
            total +
            (Array.isArray(project?.phases)
              ? project.phases.reduce(
                  (phaseTotal, phase) =>
                    phaseTotal +
                    getPhaseDocuments(phase).filter(isRequiredDocument).length,
                  0,
                )
              : 0),
          0,
        ));

  const uploadedRequiredDocuments =
    activeSummary.uploadedRequiredDocuments ??
    (selectedProjectId
      ? selectedProjectData.phases.reduce(
          (total, phase) =>
            total +
            getPhaseDocuments(phase).filter(
              (documentType) =>
                isRequiredDocument(documentType) && documentType?.isUploaded,
            ).length,
          0,
        )
      : allProjectData.projects.reduce(
          (total, project) =>
            total +
            (Array.isArray(project?.phases)
              ? project.phases.reduce(
                  (phaseTotal, phase) =>
                    phaseTotal +
                    getPhaseDocuments(phase).filter(
                      (documentType) =>
                        isRequiredDocument(documentType) &&
                        documentType?.isUploaded,
                    ).length,
                  0,
                )
              : 0),
          0,
        ));

  const pendingRequiredDocuments =
    activeSummary.pendingRequiredDocuments ??
    Math.max(requiredDocuments - uploadedRequiredDocuments, 0);

  const completionPercentage =
    activeSummary.completionPercentage ??
    (totalDocuments > 0
      ? Math.round((uploadedDocuments / totalDocuments) * 100)
      : 100);

  const requiredCompletionPercentage =
    activeSummary.requiredCompletionPercentage ??
    (requiredDocuments > 0
      ? Math.round((uploadedRequiredDocuments / requiredDocuments) * 100)
      : 100);

  /* -------------------------------------------------- Upload / download */

  const handleUpload = (documentType, projectId) => {
    const resolvedProjectId = projectId || selectedProjectId;

    if (!resolvedProjectId) {
      toast.error("Select a project first.");
      return;
    }

    const documentTypeId = getDocumentTypeId(documentType);

    if (!documentTypeId) {
      toast.error("Document type is missing.");
      return;
    }

    const params = new URLSearchParams({
      project_id: resolvedProjectId,
      document_type_id: documentTypeId,
    });

    nav(`/projects/documents/upload?${params.toString()}`);
  };

  const handleDownload = async (documentId) => {
    if (!documentId) {
      toast.error("Document is not available.");
      return;
    }

    try {
      await downloadDocument(documentId);
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.data?.detail ||
          "The document could not be downloaded.",
      );
    }
  };

  /* -------------------------------------------------- Collapse */

  const toggleProject = (projectId) =>
    setCollapsedProjects((current) => ({
      ...current,
      [projectId]: !current[projectId],
    }));

  const togglePhase = (phaseKey) =>
    setCollapsedPhases((current) => ({
      ...current,
      [phaseKey]: !current[phaseKey],
    }));

  // In the all-projects tree, phases start closed so the page stays scannable.
  const togglePhaseDefaultClosed = (phaseKey) =>
    setCollapsedPhases((current) => ({
      ...current,
      [phaseKey]: current[phaseKey] === undefined ? false : !current[phaseKey],
    }));

  const collapseAll = () => {
    if (selectedProjectId) {
      const next = {};
      visiblePhases.forEach((phase, index) => {
        next[getPhaseId(phase, index)] = true;
      });
      setCollapsedPhases(next);
    } else {
      const projectNext = {};
      const phaseNext = {};

      visibleProjects.forEach((project) => {
        const projectId = getProjectId(project);
        if (projectId) projectNext[projectId] = true;

        (Array.isArray(project?.phases) ? project.phases : []).forEach(
          (phase, index) => {
            phaseNext[`${projectId}:${getPhaseId(phase, index)}`] = true;
          },
        );
      });

      setCollapsedProjects(projectNext);
      setCollapsedPhases(phaseNext);
    }
  };

  const expandAll = () => {
    const projectOpen = {};
    visibleProjects.forEach((project) => {
      const projectId = getProjectId(project);
      if (projectId) projectOpen[projectId] = false;
    });
    setCollapsedProjects(projectOpen);
    if (selectedProjectId) {
      setCollapsedPhases({});
    } else {
      const phaseNext = {};
      visibleProjects.forEach((project) => {
        const projectId = getProjectId(project);
        (Array.isArray(project?.phases) ? project.phases : []).forEach((phase, index) => {
          phaseNext[`${projectId}:${getPhaseId(phase, index)}`] = false;
        });
      });
      setCollapsedPhases(phaseNext);
    }
  };

  /* -------------------------------------------------- Query state */

  const isFetching = allTreeFetching || selectedProjectFetching;
  const isLoading =
    projectsLoading ||
    (selectedProjectId ? selectedProjectLoading : allTreeLoading);
  const isError = selectedProjectId ? selectedProjectError : allTreeError;
  const error = selectedProjectId ? selectedProjectErrorData : allTreeErrorData;
  const refetch = selectedProjectId ? refetchSelectedProject : refetchAllTree;

  /* -------------------------------------------------- Render */

  return (
    <Page className="pj-page">
      <PageHeader
        crumbs={[{ label: "Projects", to: "/projects" }, { label: "Documents" }]}
        title="Project documents"
        subtitle={
          selectedProjectId
            ? `${selectedProjectName} — phase-wise document checklist`
            : "Document control across every project, phase by phase."
        }
        actions={
          <>
            <InosButton
              variant="ghost"
              icon={RefreshCw}
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh"
              title="Refresh"
            />
            <InosButton
              variant="primary"
              icon={Upload}
              onClick={() => {
                if (!selectedProjectId) {
                  toast.info("Select a project before uploading a document.");
                  return;
                }
                nav(`/projects/documents/upload?project_id=${selectedProjectId}`);
              }}
            >
              Upload document
            </InosButton>
          </>
        }
      />

      <Stats>
        <StatTile label="Projects" value={selectedProjectId ? 1 : totalProjects} meta="In view" icon={<FolderOpen />} />
        <StatTile label="Documents" value={`${uploadedDocuments}/${totalDocuments}`} meta="Uploaded" icon={<FileText />} tone="info" />
        <StatTile label="Pending" value={pendingDocuments} meta="Document types" icon={<Upload />} tone="peach" />
        <StatTile
          label="Required uploaded"
          value={`${uploadedRequiredDocuments}/${requiredDocuments}`}
          meta={requiredDocuments ? `${requiredCompletionPercentage}% · ${pendingRequiredDocuments} pending` : "None configured"}
          icon={<CheckCircle2 />}
          tone="ok"
        />
      </Stats>

      <Toolbar>
        <SelectInput
          value={selectedProjectId || ALL_PROJECTS}
          onChange={(e) => handleProjectChange(e.target.value)}
          aria-label="Project"
          style={{ width: 260, fontWeight: 600 }}
        >
          <option value={ALL_PROJECTS}>All projects</option>
          {projects.map((project) => {
            const projectId = getProjectId(project);
            if (!projectId) return null;
            return (
              <option key={projectId} value={String(projectId)}>
                {getProjectName(project, projectId)}
              </option>
            );
          })}
        </SelectInput>
        <SearchInput value={q} onChange={setQ} placeholder="Search phase, document type, code…" />
        <label className="pj-check">
          <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} />
          Show completed phases
        </label>
        <ToolbarSpacer />
        <InosButton variant="ghost" size="sm" onClick={expandAll}>
          Expand all
        </InosButton>
        <InosButton variant="ghost" size="sm" onClick={collapseAll}>
          Collapse all
        </InosButton>
      </Toolbar>

      {!isLoading && !isError && pendingRequiredDocuments > 0 && (
        <div className="pj-callout" role="status">
          <AlertTriangle aria-hidden />
          <div>
            <b>Required documents are still pending</b>
            {pendingRequiredDocuments} required document{pendingRequiredDocuments !== 1 ? "s" : ""} must be uploaded before the
            checklist is complete.
          </div>
        </div>
      )}

      {isError && (
        <Card>
          <EmptyState
            icon={AlertTriangle}
            title="Failed to load document checklist"
            text={error?.data?.message || error?.data?.detail || "Please try again."}
            action={
              <InosButton variant="secondary" icon={RefreshCw} onClick={() => refetch()}>
                Retry
              </InosButton>
            }
          />
        </Card>
      )}

      {isLoading && (
        <div style={{ display: "grid", gap: 10 }}>
          <PjSkeleton height={64} />
          <PjSkeleton height={64} />
          <PjSkeleton height={64} />
        </div>
      )}

      {!isLoading && !isError && !selectedProjectId && (
        <div style={{ display: "grid", gap: 12 }}>
          {visibleProjects.length ? (
            visibleProjects.map((project, projectIndex) => {
              const projectId = getProjectId(project);
              if (!projectId) return null;
              // First project open, the rest folded — keeps long workspaces scannable.
              const projectCollapsed = collapsedProjects[projectId] ?? projectIndex > 0;
              const phases = Array.isArray(project?.phases) ? project.phases : [];

              return (
                <ProjectTreeCard key={projectId} project={project} collapsed={projectCollapsed} onToggle={() =>
                    setCollapsedProjects((current) => ({ ...current, [projectId]: !(current[projectId] ?? projectIndex > 0) }))
                  }>
                  {phases.length ? (
                    phases.map((phase, index) => {
                      const phaseId = getPhaseId(phase, index);
                      const phaseKey = `${projectId}:${phaseId}`;
                      return (
                        <DocumentPhaseCard
                          key={phaseKey}
                          nested
                          phase={phase}
                          projectId={projectId}
                          collapsed={collapsedPhases[phaseKey] === undefined ? true : Boolean(collapsedPhases[phaseKey])}
                          onToggle={() => togglePhaseDefaultClosed(phaseKey)}
                          onUpload={handleUpload}
                          onDownload={handleDownload}
                        />
                      );
                    })
                  ) : (
                    <EmptyState icon={FileText} title="No document phases" text="No document phases are configured for this project." />
                  )}
                </ProjectTreeCard>
              );
            })
          ) : (
            <Card>
              <EmptyState icon={FolderOpen} title="No projects found" text={q ? "Try a different search." : "No projects are available."} />
            </Card>
          )}
        </div>
      )}

      {!isLoading && !isError && Boolean(selectedProjectId) && (
        <div style={{ display: "grid", gap: 10 }}>
          {visiblePhases.length ? (
            visiblePhases.map((phase, index) => {
              const phaseId = getPhaseId(phase, index);
              return (
                <DocumentPhaseCard
                  key={phaseId}
                  phase={phase}
                  projectId={selectedProjectId}
                  collapsed={Boolean(collapsedPhases[phaseId])}
                  onToggle={() => togglePhase(phaseId)}
                  onUpload={handleUpload}
                  onDownload={handleDownload}
                />
              );
            })
          ) : (
            <Card>
              <EmptyState
                icon={FileText}
                title="No document phases found"
                text={q ? "Try a different search." : "No document phases are configured for this project."}
              />
            </Card>
          )}
        </div>
      )}
    </Page>
  );
}

/* ============================================================
   EDIT DOCUMENT MODAL
============================================================ */

export function EditDocumentModal({ doc, onClose }) {
  const [form, setForm] = useState({
    title: doc.title || "",
    documentTypeId: doc.documentTypeId || doc.document_type_id || "",
    category: doc.category || doc.documentType?.name || "",
    remarks: doc.remarks || "",
    projectId: doc.projectId || doc.project_id || "",
  });

  const [file, setFile] = useState(null);

  const { data: projectsResponse } = useGetProjectsQuery({});

  const projects = useMemo(() => {
    if (Array.isArray(projectsResponse)) return projectsResponse;
    return projectsResponse?.data || projectsResponse?.projects || [];
  }, [projectsResponse]);

  const { data: documentTypesResponse, isLoading: documentTypesLoading } =
    useGetDocumentTypesQuery();

  const documentTypes = useMemo(() => {
    if (Array.isArray(documentTypesResponse)) return documentTypesResponse;
    return (
      documentTypesResponse?.data || documentTypesResponse?.documentTypes || []
    );
  }, [documentTypesResponse]);

  const [updateDocument, { isLoading: saving }] = useUpdateDocumentMutation();
  const [replaceDocumentFile, { isLoading: replacing }] =
    useReplaceDocumentFileMutation();

  const updateForm = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const save = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        title: form.title,
        documentTypeId: form.documentTypeId || undefined,
        projectId: form.projectId || undefined,
        remarks: form.remarks || "",
      };

      await updateDocument({ id: doc.id, data: payload }).unwrap();

      if (file) {
        await replaceDocumentFile({ id: doc.id, file }).unwrap();
      }

      toast.success("Document updated.");
      onClose();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.data?.detail ||
          "The document could not be saved.",
      );
    }
  };

  const savingAny = saving || replacing;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit document</DialogTitle>
        </DialogHeader>

        <form onSubmit={save} className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="doc_title">Title</Label>
            <Input
              id="doc_title"
              required
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc_type">Document type</Label>
            <Select
              value={form.documentTypeId}
              onValueChange={(value) => updateForm("documentTypeId", value)}
              disabled={documentTypesLoading}
            >
              <SelectTrigger id="doc_type">
                <SelectValue
                  placeholder={
                    documentTypesLoading
                      ? "Loading document types..."
                      : "Select document type"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.name}
                    {type.code ? ` (${type.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.documentTypeId && (
            <DocumentTypeInfo
              documentTypes={documentTypes}
              documentTypeId={form.documentTypeId}
            />
          )}

          <div className="space-y-1.5">
            <Label htmlFor="doc_project">Project</Label>
            <Select
              value={form.projectId || "__unassigned__"}
              onValueChange={(value) =>
                updateForm("projectId", value === "__unassigned__" ? "" : value)
              }
            >
              <SelectTrigger id="doc_project">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned__">Unassigned</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.name ||
                      project.projectName ||
                      project.title ||
                      project.code ||
                      project.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc_remarks">Remarks</Label>
            <Textarea
              id="doc_remarks"
              rows={3}
              value={form.remarks}
              onChange={(event) => updateForm("remarks", event.target.value)}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc_file">Replace file</Label>
            <Input
              id="doc_file"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="text-xs"
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                New file: {file.name}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={savingAny}>
              {savingAny ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   DOCUMENT TYPE INFO
============================================================ */

function DocumentTypeInfo({ documentTypes, documentTypeId }) {
  const type = documentTypes.find(
    (item) => String(item.id) === String(documentTypeId),
  );

  if (!type) return null;

  return (
    <div className="rounded-lg border bg-[var(--sage-50)] px-3 py-2.5">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        {type.phaseName && (
          <div>
            <span className="text-muted-foreground">Phase:</span>{" "}
            <span className="font-semibold">{type.phaseName}</span>
          </div>
        )}

        {type.sectionCode && (
          <div>
            <span className="text-muted-foreground">Section:</span>{" "}
            <span className="font-semibold">
              {type.sectionCode}
              {type.sectionName ? ` — ${type.sectionName}` : ""}
            </span>
          </div>
        )}
      </div>

      {type.description && (
        <div className="mt-1 text-[11px] text-muted-foreground">
          {type.description}
        </div>
      )}
    </div>
  );
}
