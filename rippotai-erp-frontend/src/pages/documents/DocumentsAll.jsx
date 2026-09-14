import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
} from "lucide-react";

import { Shell, Card, Input, downloadDocument } from "../../hooks/shared";

import {
  useGetProjectDocumentPhasesQuery,
  useGetProjectDocumentPhaseTreeQuery,
} from "../../api/documents/document.api";

import { useGetProjectsQuery } from "../../api/projects/project.api";

/* ============================================================
   HELPERS
============================================================ */

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

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

const getPhaseId = (phase, index = 0) => {
  return (
    phase?.id ||
    phase?.projectPhaseId ||
    phase?.phaseCode ||
    phase?.phase_code ||
    `phase-${index}`
  );
};

const getProjectId = (project) => {
  return project?.id || project?.projectId || project?.project_id || "";
};

const getDocumentTypeId = (documentType) => {
  return (
    documentType?.documentTypeId ||
    documentType?.id ||
    documentType?.document_type_id ||
    ""
  );
};

const getUploadCount = (documentType) => {
  if (typeof documentType?.uploadCount === "number") {
    return documentType.uploadCount;
  }

  if (Array.isArray(documentType?.documents)) {
    return documentType.documents.length;
  }

  if (Array.isArray(documentType?.documentIds)) {
    return documentType.documentIds.length;
  }

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

  if (documentType?.latestDocumentId) {
    return [documentType.latestDocumentId];
  }

  return [];
};

const getLatestDocumentId = (documentType) => {
  return (
    documentType?.latestDocumentId || getDocumentIds(documentType)[0] || null
  );
};

const isRequiredDocument = (documentType) => {
  return (
    String(documentType?.requirementType || "REQUIRED").toUpperCase() ===
    "REQUIRED"
  );
};

const getPhaseDocuments = (phase) => {
  if (Array.isArray(phase?.documents)) {
    return phase.documents;
  }

  if (Array.isArray(phase?.documentTypes)) {
    return phase.documentTypes;
  }

  return [];
};

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
    <div className="border-t border-[rgba(31,69,59,0.08)] px-4 py-3 hover:bg-[#F8FAF9] transition-colors">
      <div className="flex items-center gap-3">
        {/* STATUS */}

        <div className="shrink-0">
          {isUploaded ? (
            <CheckCircle2
              size={18}
              className="text-[#4CAF50]"
              title="Uploaded"
            />
          ) : (
            <Circle
              size={18}
              className={isRequired ? "text-[#B04D26]" : "text-[#B5C4B6]"}
              title={isRequired ? "Required — pending" : "Pending"}
            />
          )}
        </div>

        {/* DOCUMENT ICON */}

        <div
          className={[
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            isUploaded ? "bg-[#E7F1EA]" : "bg-[#F1F3F3]",
          ].join(" ")}
        >
          <FileText
            size={15}
            className={isUploaded ? "text-[#1F453B]" : "text-[#8A9697]"}
          />
        </div>

        {/* INFORMATION */}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[13.5px] text-[#333333]">
              {documentType?.name || "Untitled document"}
            </span>

            {documentType?.code && (
              <span className="text-[10.5px] text-[#8A9697]">
                {documentType.code}
              </span>
            )}

            {isRequired ? (
              <span className="px-1.5 py-0.5 rounded-full bg-[#F4E1D6] text-[#8A4B2A] text-[10px] font-bold">
                REQUIRED
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-[#EAEEF0] text-[#6B7B7C] text-[10px] font-semibold">
                OPTIONAL
              </span>
            )}
          </div>

          {documentType?.description && (
            <div className="text-[11.5px] text-[#8A9697] mt-0.5 truncate">
              {documentType.description}
            </div>
          )}

          <div className="flex items-center gap-3 mt-1 text-[11px] text-[#8A9697] flex-wrap">
            <span>
              {isUploaded
                ? `${uploadCount} upload${uploadCount !== 1 ? "s" : ""}`
                : "Not uploaded"}
            </span>

            {documentType?.latestUploadedAt && (
              <span>Latest: {formatDate(documentType.latestUploadedAt)}</span>
            )}

            {allowsMultiple && <span>Multiple allowed</span>}
          </div>
        </div>

        {/* STATUS */}

        <div className="hidden md:block shrink-0 min-w-[90px]">
          {isUploaded ? (
            <span className="inline-flex px-2 py-1 rounded-full bg-[#E7F1EA] text-[#2F6B3F] text-[11px] font-semibold">
              Uploaded
            </span>
          ) : (
            <span
              className={[
                "inline-flex px-2 py-1 rounded-full text-[11px] font-semibold",
                isRequired
                  ? "bg-[#F4E1D6] text-[#A34D27]"
                  : "bg-[#EAEEF0] text-[#6B7B7C]",
              ].join(" ")}
            >
              Pending
            </span>
          )}
        </div>

        {/* ACTIONS */}

        <div className="shrink-0">
          {!isUploaded ? (
            <button
              type="button"
              onClick={() => onUpload(documentType, projectId)}
              className="h-8 px-3 rounded-lg bg-[#1F453B] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 hover:opacity-90"
            >
              <Upload size={13} />
              <span className="hidden sm:inline">Make / Upload</span>
              <span className="sm:hidden">Upload</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpload(documentType, projectId)}
                className="h-8 px-2.5 rounded-lg border border-[#D8E0DA] text-[#1F453B] text-[12px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#F0F4F1]"
                title="Upload another file"
              >
                <Upload size={13} />

                <span className="hidden lg:inline">
                  {allowsMultiple ? "Add" : "Replace"}
                </span>
              </button>

              {latestDocumentId && (
                <button
                  type="button"
                  onClick={() => onDownload(latestDocumentId)}
                  className="h-8 px-2.5 rounded-lg border text-[#333333] text-[12px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#EAEEF0]"
                  title="Download latest document"
                >
                  <Download size={13} />

                  <span className="hidden lg:inline">Download</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MULTIPLE UPLOADS */}

      {allowsMultiple && documentIds.length > 1 && (
        <div className="ml-[76px] mt-2 pl-3 border-l-2 border-[#D8E0DA]">
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-[#8A9697] mb-1.5">
            Uploaded files
          </div>

          <div className="flex flex-wrap gap-1.5">
            {documentIds.map((documentId, index) => (
              <button
                key={documentId}
                type="button"
                onClick={() => onDownload(documentId)}
                className="px-2 py-1 rounded-md bg-[#F4F6F7] hover:bg-[#EAEEF0] text-[11px] text-[#333333] inline-flex items-center gap-1.5"
              >
                <Download size={11} />
                File {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   PHASE CARD
============================================================ */

function DocumentPhaseCard({
  phase,
  projectId,
  collapsed,
  onToggle,
  onUpload,
  onDownload,
}) {
  const documents = getPhaseDocuments(phase);

  const summary = phase?.summary || {};

  const total =
    typeof summary.total === "number" ? summary.total : documents.length;

  const uploaded =
    typeof summary.uploaded === "number"
      ? summary.uploaded
      : documents.filter((item) => item?.isUploaded).length;

  const pending =
    typeof summary.pending === "number"
      ? summary.pending
      : Math.max(total - uploaded, 0);

  const required =
    typeof summary.required === "number"
      ? summary.required
      : documents.filter(isRequiredDocument).length;

  const uploadedRequired =
    typeof summary.uploadedRequired === "number"
      ? summary.uploadedRequired
      : documents.filter((item) => isRequiredDocument(item) && item?.isUploaded)
          .length;

  const pendingRequired =
    typeof summary.pendingRequired === "number"
      ? summary.pendingRequired
      : Math.max(required - uploadedRequired, 0);

  const completionPercentage =
    typeof summary.completionPercentage === "number"
      ? summary.completionPercentage
      : total > 0
        ? Math.round((uploaded / total) * 100)
        : 100;

  const isComplete =
    typeof phase?.isComplete === "boolean"
      ? phase.isComplete
      : pendingRequired === 0;

  return (
    <Card className="overflow-hidden">
      {/* PHASE HEADER */}

      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-4 py-3 bg-[#F0F4F1] hover:bg-[#EAF0EB] transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* CHEVRON */}

          <div className="shrink-0 text-[#1F453B]">
            {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </div>

          {/* PHASE NUMBER */}

          <div className="w-9 h-9 rounded-lg bg-white border border-[#D8E0DA] flex items-center justify-center text-[12px] font-bold text-[#1F453B] shrink-0">
            {phase?.phaseNumber || phase?.phase_number || "—"}
          </div>

          {/* PHASE INFO */}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[14px] text-[#333333]">
                {phase?.title || "Untitled Phase"}
              </span>

              {(phase?.phaseCode || phase?.phase_code) && (
                <span className="text-[10.5px] text-[#8A9697]">
                  {phase?.phaseCode || phase?.phase_code}
                </span>
              )}

              {isComplete ? (
                <span className="px-1.5 py-0.5 rounded-full bg-[#E7F1EA] text-[#2F6B3F] text-[10px] font-bold">
                  COMPLETE
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full bg-[#F4E1D6] text-[#A34D27] text-[10px] font-bold">
                  PENDING
                </span>
              )}
            </div>

            {phase?.description && (
              <div className="text-[11.5px] text-[#6B7B7C] mt-0.5 truncate">
                {phase.description}
              </div>
            )}
          </div>

          {/* PHASE STATS */}

          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-[12px] font-bold text-[#333333]">
                {uploaded}/{total}
              </div>

              <div className="text-[10px] text-[#8A9697]">uploaded</div>
            </div>

            <div className="text-right">
              <div
                className={[
                  "text-[12px] font-bold",
                  pendingRequired > 0 ? "text-[#A34D27]" : "text-[#2F6B3F]",
                ].join(" ")}
              >
                {uploadedRequired}/{required}
              </div>

              <div className="text-[10px] text-[#8A9697]">required</div>
            </div>

            <div className="w-[90px]">
              <div className="flex justify-between text-[10px] text-[#8A9697] mb-1">
                <span>Progress</span>

                <span>{completionPercentage}%</span>
              </div>

              <div className="h-1.5 rounded-full bg-[#D8E0DA] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#1F453B]"
                  style={{
                    width: `${Math.min(
                      Math.max(completionPercentage, 0),
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE STATS */}

        <div className="sm:hidden mt-3 ml-12">
          <div className="flex items-center justify-between text-[10.5px] text-[#6B7B7C] mb-1">
            <span>
              {uploaded}/{total} uploaded
            </span>

            <span>
              Required: {uploadedRequired}/{required}
            </span>

            <span>{completionPercentage}%</span>
          </div>

          <div className="h-1.5 rounded-full bg-[#D8E0DA] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#1F453B]"
              style={{
                width: `${Math.min(Math.max(completionPercentage, 0), 100)}%`,
              }}
            />
          </div>
        </div>
      </button>

      {/* DOCUMENT TYPES */}

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
            <div className="px-4 py-8 text-center text-[12px] text-[#8A9697]">
              No document types configured for this phase.
            </div>
          )}

          {/* PHASE FOOTER */}

          <div className="px-4 py-2.5 bg-[#FAFBFA] border-t border-[rgba(31,69,59,0.08)] flex items-center justify-between text-[11px]">
            <span className="text-[#8A9697]">
              {pending} pending document
              {pending !== 1 ? "s" : ""}
            </span>

            <span
              className={
                pendingRequired > 0
                  ? "text-[#A34D27] font-semibold"
                  : "text-[#2F6B3F] font-semibold"
              }
            >
              {pendingRequired > 0
                ? `${pendingRequired} required pending`
                : "All required documents uploaded"}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   PROJECT TREE CARD
============================================================ */

function ProjectTreeCard({ project, collapsed, onToggle, children }) {
  const projectId = getProjectId(project);

  const projectName = getProjectName(project, projectId || "Project");

  const summary = project?.summary || {};

  const totalPhases = summary.totalPhases ?? project?.phases?.length ?? 0;

  const completedPhases =
    summary.completedPhases ??
    project?.phases?.filter((phase) => phase?.isComplete).length ??
    0;

  const totalDocuments =
    summary.totalDocuments ??
    project?.phases?.reduce(
      (total, phase) => total + getPhaseDocuments(phase).length,
      0,
    ) ??
    0;

  const uploadedDocuments =
    summary.uploadedDocuments ??
    project?.phases?.reduce(
      (total, phase) =>
        total +
        getPhaseDocuments(phase).filter(
          (documentType) => documentType?.isUploaded,
        ).length,
      0,
    ) ??
    0;

  const completionPercentage =
    summary.completionPercentage ??
    (totalDocuments > 0
      ? Math.round((uploadedDocuments / totalDocuments) * 100)
      : 100);

  return (
    <Card className="overflow-hidden">
      {/* PROJECT HEADER */}

      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-4 py-3 bg-white hover:bg-[#F8FAF9] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0 text-[#1F453B]">
            {collapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
          </div>

          <div className="w-10 h-10 rounded-xl bg-[#E7F1EA] flex items-center justify-center shrink-0">
            {collapsed ? (
              <Folder size={18} className="text-[#1F453B]" />
            ) : (
              <FolderOpen size={18} className="text-[#1F453B]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[15px] text-[#333333]">
                {projectName}
              </span>

              {project?.code && (
                <span className="text-[10.5px] text-[#8A9697]">
                  {project.code}
                </span>
              )}
            </div>

            <div className="text-[11.5px] text-[#8A9697] mt-0.5">
              {projectId}
            </div>
          </div>

          {/* PROJECT STATS */}

          <div className="hidden md:flex items-center gap-5 shrink-0">
            <div className="text-right">
              <div className="text-[12px] font-bold text-[#333333]">
                {completedPhases}/{totalPhases}
              </div>

              <div className="text-[10px] text-[#8A9697]">phases</div>
            </div>

            <div className="text-right">
              <div className="text-[12px] font-bold text-[#333333]">
                {uploadedDocuments}/{totalDocuments}
              </div>

              <div className="text-[10px] text-[#8A9697]">documents</div>
            </div>

            <div className="w-[90px]">
              <div className="flex justify-between text-[10px] text-[#8A9697] mb-1">
                <span>Progress</span>

                <span>{completionPercentage}%</span>
              </div>

              <div className="h-1.5 rounded-full bg-[#D8E0DA] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#1F453B]"
                  style={{
                    width: `${Math.min(
                      Math.max(completionPercentage, 0),
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </button>

      {!collapsed && (
        <div className="border-t border-[rgba(31,69,59,0.08)] bg-[#FAFBFA] p-3 space-y-3">
          {children}
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

export function DocumentsAll() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const urlProjectId =
    searchParams.get("project_id") || searchParams.get("projectId") || "";

  /*
   * Empty string means ALL PROJECTS.
   *
   * If the page is opened with ?project_id=...
   * we use that project as the initial selection.
   */

  const [selectedProjectId, setSelectedProjectId] = useState(urlProjectId);

  const [q, setQ] = useState("");

  const [collapsedProjects, setCollapsedProjects] = useState({});

  const [collapsedPhases, setCollapsedPhases] = useState({});

  const [showCompleted, setShowCompleted] = useState(true);

  /* ==========================================================
     PROJECTS
  ========================================================== */

  const { data: projectsResponse, isLoading: projectsLoading } =
    useGetProjectsQuery({});

  const projects = useMemo(() => {
    if (Array.isArray(projectsResponse)) {
      return projectsResponse;
    }

    return projectsResponse?.data || projectsResponse?.projects || [];
  }, [projectsResponse]);

  /* ==========================================================
     ALL PROJECT TREE
  ========================================================== */

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

  /* ==========================================================
     SELECTED PROJECT TREE
  ========================================================== */

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

  /* ==========================================================
     NORMALIZE ALL PROJECT TREE
  ========================================================== */

  const allProjectData = useMemo(() => {
    if (!allProjectTreeResponse) {
      return {
        projects: [],
        summary: {},
      };
    }

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

  /* ==========================================================
     NORMALIZE SELECTED PROJECT
  ========================================================== */

  const selectedProjectData = useMemo(() => {
    if (!selectedProjectResponse) {
      return {
        phases: [],
        summary: {},
      };
    }

    const phases = Array.isArray(selectedProjectResponse)
      ? selectedProjectResponse
      : selectedProjectResponse?.phases ||
        selectedProjectResponse?.data?.phases ||
        [];

    const summary =
      selectedProjectResponse?.summary ||
      selectedProjectResponse?.data?.summary ||
      {};

    return {
      phases: Array.isArray(phases) ? phases : [],
      summary,
    };
  }, [selectedProjectResponse]);

  /* ==========================================================
     SELECTED PROJECT
  ========================================================== */

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) {
      return null;
    }

    return projects.find(
      (project) => String(getProjectId(project)) === String(selectedProjectId),
    );
  }, [projects, selectedProjectId]);

  const selectedProjectName = getProjectName(
    selectedProject,
    selectedProjectId || "Project",
  );

  /* ==========================================================
     PROJECT SELECTION
  ========================================================== */

  const handleProjectChange = (event) => {
    const projectId = event.target.value;

    setSelectedProjectId(projectId);

    /*
     * Keep URL in sync so opening/refreshing the page
     * preserves the selected project.
     */

    const params = new URLSearchParams(searchParams);

    if (projectId) {
      params.set("project_id", projectId);
    } else {
      params.delete("project_id");
      params.delete("projectId");
    }

    const query = params.toString();

    nav(query ? `/projects/documents?${query}` : "/projects/documents", {
      replace: true,
    });
  };

  /* ==========================================================
     SEARCH
  ========================================================== */

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
    if (!Array.isArray(phases)) {
      return [];
    }

    if (!search) {
      return phases;
    }

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

  /* ==========================================================
     ALL PROJECTS FILTERED TREE
  ========================================================== */

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

  /* ==========================================================
     SELECTED PROJECT FILTERED PHASES
  ========================================================== */

  const visiblePhases = useMemo(() => {
    const search = q.trim().toLowerCase();

    let result = filterPhases(selectedProjectData.phases, search);

    if (!showCompleted) {
      result = result.filter((phase) => !phase?.isComplete);
    }

    return result;
  }, [selectedProjectData.phases, q, showCompleted]);

  /* ==========================================================
     SUMMARY
  ========================================================== */

  const activeSummary = selectedProjectId
    ? selectedProjectData.summary || {}
    : allProjectData.summary || {};

  const totalProjects = selectedProjectId
    ? 1
    : (activeSummary.totalProjects ?? allProjectData.projects.length);

  const completedProjects = selectedProjectId
    ? activeSummary.projectComplete
      ? 1
      : 0
    : (activeSummary.completedProjects ??
      allProjectData.projects.filter((project) => project?.isComplete).length);

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

  /* ==========================================================
     UPLOAD
  ========================================================== */

  const handleUpload = (documentType, projectId) => {
    const resolvedProjectId = projectId || selectedProjectId;

    if (!resolvedProjectId) {
      toast.error("Select a project first");
      return;
    }

    const documentTypeId = getDocumentTypeId(documentType);

    if (!documentTypeId) {
      toast.error("Document type is missing");
      return;
    }

    const params = new URLSearchParams({
      project_id: resolvedProjectId,
      document_type_id: documentTypeId,
    });

    nav(`/projects/documents/upload?${params.toString()}`);
  };

  /* ==========================================================
     DOWNLOAD
  ========================================================== */

  const handleDownload = async (documentId) => {
    if (!documentId) {
      toast.error("Document is not available");
      return;
    }

    try {
      await downloadDocument(documentId);
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.data?.detail ||
          "Failed to download document",
      );
    }
  };

  /* ==========================================================
     COLLAPSE
  ========================================================== */

  const toggleProject = (projectId) => {
    setCollapsedProjects((current) => ({
      ...current,
      [projectId]: !current[projectId],
    }));
  };

  const togglePhase = (phaseKey) => {
    setCollapsedPhases((current) => ({
      ...current,
      [phaseKey]: !current[phaseKey],
    }));
  };

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

        if (projectId) {
          projectNext[projectId] = true;
        }

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
    setCollapsedProjects({});
    setCollapsedPhases({});
  };

  /* ==========================================================
     REFRESH
  ========================================================== */

  const isFetching = allTreeFetching || selectedProjectFetching;

  const isLoading =
    projectsLoading ||
    (selectedProjectId ? selectedProjectLoading : allTreeLoading);

  const isError = selectedProjectId ? selectedProjectError : allTreeError;

  const error = selectedProjectId ? selectedProjectErrorData : allTreeErrorData;

  const refetch = selectedProjectId ? refetchSelectedProject : refetchAllTree;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <Shell
      title="Project Documents"
      subtitle={
        selectedProjectId
          ? `${selectedProjectName} — document checklist`
          : "All projects — document control and checklist"
      }
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-10 px-3 rounded-lg border text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#F4F6F7] disabled:opacity-50"
            title="Refresh checklist"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              if (!selectedProjectId) {
                toast.info("Select a project before uploading a document.");
                return;
              }

              nav(`/projects/documents/upload?project_id=${selectedProjectId}`);
            }}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
          >
            <Upload size={14} />
            Upload Document
          </button>
        </div>
      }
    >
      {/* ======================================================
          PROJECT SELECTOR
      ====================================================== */}

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1 max-w-xl">
            <label className="block text-[11px] uppercase tracking-[0.14em] font-semibold text-[#8A9697] mb-1.5">
              Project
            </label>

            <select
              value={selectedProjectId}
              onChange={handleProjectChange}
              className="w-full h-11 px-3 rounded-lg border border-[#D8E0DA] bg-white text-[13px] font-semibold text-[#333333] outline-none focus:border-[#1F453B] focus:ring-2 focus:ring-[rgba(31,69,59,0.08)]"
            >
              <option value="">All Projects</option>

              {projects.map((project) => {
                const projectId = getProjectId(project);

                if (!projectId) {
                  return null;
                }

                return (
                  <option key={projectId} value={projectId}>
                    {getProjectName(project, projectId)}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="text-[11.5px] text-[#8A9697]">
            {selectedProjectId
              ? "Showing document phases for the selected project."
              : "Showing the document phase tree for every project."}
          </div>
        </div>
      </Card>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Card className="p-3">
          <div className="text-[11px] text-[#8A9697]">Projects</div>

          <div className="text-[20px] font-bold text-[#333333] mt-1">
            {selectedProjectId ? 1 : totalProjects}
          </div>

          <div className="text-[10.5px] text-[#6B7B7C]">in view</div>
        </Card>

        <Card className="p-3">
          <div className="text-[11px] text-[#8A9697]">Phases</div>

          <div className="text-[20px] font-bold text-[#333333] mt-1">
            {completedPhases}/{totalPhases}
          </div>

          <div className="text-[10.5px] text-[#6B7B7C]">completed</div>
        </Card>

        <Card className="p-3">
          <div className="text-[11px] text-[#8A9697]">Documents</div>

          <div className="text-[20px] font-bold text-[#333333] mt-1">
            {uploadedDocuments}/{totalDocuments}
          </div>

          <div className="text-[10.5px] text-[#6B7B7C]">uploaded</div>
        </Card>

        <Card className="p-3">
          <div className="text-[11px] text-[#8A9697]">Pending</div>

          <div className="text-[20px] font-bold text-[#A34D27] mt-1">
            {pendingDocuments}
          </div>

          <div className="text-[10.5px] text-[#6B7B7C]">document types</div>
        </Card>

        <Card className="p-3">
          <div className="text-[11px] text-[#8A9697]">Required</div>

          <div className="text-[20px] font-bold text-[#333333] mt-1">
            {uploadedRequiredDocuments}/{requiredDocuments}
          </div>

          <div className="text-[10.5px] text-[#6B7B7C]">uploaded</div>
        </Card>

        <Card className="p-3 col-span-2 lg:col-span-1">
          <div className="text-[11px] text-[#8A9697]">Required completion</div>

          <div className="text-[20px] font-bold text-[#1F453B] mt-1">
            {requiredCompletionPercentage}%
          </div>

          <div className="text-[10.5px] text-[#A34D27]">
            {pendingRequiredDocuments} required pending
          </div>
        </Card>
      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search project, phase, document type, code…"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          className="max-w-md"
        />

        <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#333333] cursor-pointer">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(event) => setShowCompleted(event.target.checked)}
          />
          Show completed phases
        </label>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={expandAll}
            className="h-8 px-2.5 rounded-lg border text-[11px] font-semibold hover:bg-[#F4F6F7]"
          >
            Expand all
          </button>

          <button
            type="button"
            onClick={collapseAll}
            className="h-8 px-2.5 rounded-lg border text-[11px] font-semibold hover:bg-[#F4F6F7]"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {isError && (
        <Card>
          <div className="py-10 text-center">
            <div className="text-[14px] font-semibold text-[#B04D26]">
              Failed to load document checklist
            </div>

            <div className="text-[12px] text-[#8A9697] mt-1">
              {error?.data?.message ||
                error?.data?.detail ||
                "Please try again."}
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 h-9 px-3 rounded-lg bg-[#1F453B] text-white text-[12px] font-semibold"
            >
              Retry
            </button>
          </div>
        </Card>
      )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {isLoading && (
        <Card>
          <div className="py-12 text-center text-[13px] text-[#6B7B7C]">
            Loading document checklist…
          </div>
        </Card>
      )}

      {/* ======================================================
          ALL PROJECTS TREE
      ====================================================== */}

      {!isLoading && !isError && !selectedProjectId && (
        <div className="space-y-3">
          {visibleProjects.length ? (
            visibleProjects.map((project) => {
              const projectId = getProjectId(project);

              if (!projectId) {
                return null;
              }

              const projectCollapsed = Boolean(collapsedProjects[projectId]);

              const phases = Array.isArray(project?.phases)
                ? project.phases
                : [];

              return (
                <ProjectTreeCard
                  key={projectId}
                  project={project}
                  collapsed={projectCollapsed}
                  onToggle={() => toggleProject(projectId)}
                >
                  {phases.length ? (
                    phases.map((phase, index) => {
                      const phaseId = getPhaseId(phase, index);

                      const phaseKey = `${projectId}:${phaseId}`;

                      return (
                        <DocumentPhaseCard
                          key={phaseKey}
                          phase={phase}
                          projectId={projectId}
                          collapsed={Boolean(collapsedPhases[phaseKey])}
                          onToggle={() => togglePhase(phaseKey)}
                          onUpload={handleUpload}
                          onDownload={handleDownload}
                        />
                      );
                    })
                  ) : (
                    <div className="px-4 py-10 text-center text-[12px] text-[#8A9697]">
                      No document phases configured for this project.
                    </div>
                  )}
                </ProjectTreeCard>
              );
            })
          ) : (
            <Card>
              <div className="py-12 text-center">
                <FolderOpen size={38} className="mx-auto mb-3 text-[#B5C4B6]" />

                <div className="text-[14px] font-semibold text-[#333333]">
                  No projects found
                </div>

                <div className="text-[12px] text-[#8A9697] mt-1">
                  {q ? "Try a different search." : "No projects are available."}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ======================================================
          SELECTED PROJECT TREE
      ====================================================== */}

      {!isLoading && !isError && Boolean(selectedProjectId) && (
        <div className="space-y-3">
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
              <div className="py-12 text-center">
                <FileText size={38} className="mx-auto mb-3 text-[#B5C4B6]" />

                <div className="text-[14px] font-semibold text-[#333333]">
                  No document phases found
                </div>

                <div className="text-[12px] text-[#8A9697] mt-1">
                  {q
                    ? "Try a different search."
                    : "No document phases are configured for this project."}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ======================================================
          REQUIRED WARNING
      ====================================================== */}

      {!isLoading && !isError && pendingRequiredDocuments > 0 && (
        <div className="rounded-xl border border-[rgba(176,77,38,0.18)] bg-[#FFF8F4] px-4 py-3">
          <div className="flex items-start gap-3">
            <Circle size={17} className="text-[#B04D26] mt-0.5 shrink-0" />

            <div>
              <div className="text-[13px] font-semibold text-[#7D3C22]">
                Required documents are still pending
              </div>

              <div className="text-[11.5px] text-[#8A6B5D] mt-0.5">
                {pendingRequiredDocuments} required document
                {pendingRequiredDocuments !== 1 ? "s" : ""} must be uploaded
                before the document checklist is complete.
              </div>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

/* ============================================================
   EDIT DOCUMENT MODAL
============================================================ */

export function EditDocumentModal({ doc, onClose }) {
  const [form, setForm] = useState({
    title: doc.title || "",

    /*
     * API now uses documentTypeId.
     * Keep category only as fallback for older records.
     */
    documentTypeId: doc.documentTypeId || doc.document_type_id || "",

    category: doc.category || doc.documentType?.name || "",

    remarks: doc.remarks || "",

    projectId: doc.projectId || doc.project_id || "",
  });

  const [file, setFile] = useState(null);

  /* ==========================================================
     PROJECTS
  ========================================================== */

  const { data: projectsResponse } = useGetProjectsQuery({});

  const projects = useMemo(() => {
    if (Array.isArray(projectsResponse)) {
      return projectsResponse;
    }

    return projectsResponse?.data || projectsResponse?.projects || [];
  }, [projectsResponse]);

  /* ==========================================================
     DOCUMENT TYPES
  ========================================================== */

  const { data: documentTypesResponse, isLoading: documentTypesLoading } =
    useGetDocumentTypesQuery();

  const documentTypes = useMemo(() => {
    if (Array.isArray(documentTypesResponse)) {
      return documentTypesResponse;
    }

    return (
      documentTypesResponse?.data || documentTypesResponse?.documentTypes || []
    );
  }, [documentTypesResponse]);

  /* ==========================================================
     MUTATIONS
  ========================================================== */

  const [updateDocument, { isLoading: saving }] = useUpdateDocumentMutation();

  const [replaceDocumentFile, { isLoading: replacing }] =
    useReplaceDocumentFileMutation();

  /* ==========================================================
     FORM UPDATE
  ========================================================== */

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* ==========================================================
     SAVE
  ========================================================== */

  const save = async (event) => {
    event.preventDefault();

    try {
      /*
       * Send documentTypeId rather than
       * relying on category text.
       */

      const payload = {
        title: form.title,
        documentTypeId: form.documentTypeId || undefined,
        projectId: form.projectId || undefined,
        remarks: form.remarks || "",
      };

      await updateDocument({
        id: doc.id,
        data: payload,
      }).unwrap();

      if (file) {
        await replaceDocumentFile({
          id: doc.id,
          file,
        }).unwrap();
      }

      toast.success("Document updated");

      onClose();
    } catch (error) {
      toast.error(error?.data?.message || error?.data?.detail || "Save failed");
    }
  };

  const savingAny = saving || replacing;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-[500px] max-w-full p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-[18px] font-semibold mb-4">Edit Document</div>

        <form onSubmit={save} className="grid gap-3">
          {/* ==================================================
              TITLE
          ================================================== */}

          <div>
            <label className="text-[12px] font-semibold mb-1 block">
              Title
            </label>

            <Input
              required
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
            />
          </div>

          {/* ==================================================
              DOCUMENT TYPE
          ================================================== */}

          <div>
            <label className="text-[12px] font-semibold mb-1 block">
              Document Type
            </label>

            <select
              className="bc-input"
              value={form.documentTypeId}
              onChange={(event) =>
                updateForm("documentTypeId", event.target.value)
              }
              disabled={documentTypesLoading}
              required
            >
              <option value="">
                {documentTypesLoading
                  ? "Loading document types…"
                  : "Select document type"}
              </option>

              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                  {type.code ? ` (${type.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* ==================================================
              DOCUMENT PHASE / SECTION
          ================================================== */}

          {form.documentTypeId && (
            <DocumentTypeInfo
              documentTypes={documentTypes}
              documentTypeId={form.documentTypeId}
            />
          )}

          {/* ==================================================
              PROJECT
          ================================================== */}

          <div>
            <label className="text-[12px] font-semibold mb-1 block">
              Project
            </label>

            <select
              className="bc-input"
              value={form.projectId}
              onChange={(event) => updateForm("projectId", event.target.value)}
            >
              <option value="">— Unassigned —</option>

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name ||
                    project.projectName ||
                    project.title ||
                    project.code ||
                    project.id}
                </option>
              ))}
            </select>
          </div>

          {/* ==================================================
              REMARKS
          ================================================== */}

          <div>
            <label className="text-[12px] font-semibold mb-1 block">
              Remarks
            </label>

            <textarea
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
              value={form.remarks}
              onChange={(event) => updateForm("remarks", event.target.value)}
            />
          </div>

          {/* ==================================================
              FILE
          ================================================== */}

          <div>
            <label className="text-[12px] font-semibold mb-1 block">
              Replace file
            </label>

            <input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="text-[12px]"
            />

            {file && (
              <div className="mt-1 text-[11px] text-[#6B7B7C]">
                New file: {file.name}
              </div>
            )}
          </div>

          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border text-[13px] font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={savingAny}
              className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold disabled:opacity-60"
            >
              {savingAny ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   DOCUMENT TYPE INFO
============================================================ */

function DocumentTypeInfo({ documentTypes, documentTypeId }) {
  const type = documentTypes.find((item) => item.id === documentTypeId);

  if (!type) {
    return null;
  }

  return (
    <div className="rounded-lg border border-[#DDE5DF] bg-[#F4F8F5] px-3 py-2.5">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        {type.phaseName && (
          <div>
            <span className="text-[#6B7B7C]">Phase:</span>{" "}
            <span className="font-semibold text-[#333333]">
              {type.phaseName}
            </span>
          </div>
        )}

        {type.sectionCode && (
          <div>
            <span className="text-[#6B7B7C]">Section:</span>{" "}
            <span className="font-semibold text-[#333333]">
              {type.sectionCode}
              {type.sectionName ? ` — ${type.sectionName}` : ""}
            </span>
          </div>
        )}
      </div>

      {type.description && (
        <div className="text-[11px] text-[#6B7B7C] mt-1">
          {type.description}
        </div>
      )}
    </div>
  );
}
