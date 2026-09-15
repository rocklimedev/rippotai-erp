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
  AlertTriangle,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Shell, downloadDocument } from "../../hooks/shared";

import {
  useGetProjectDocumentPhasesQuery,
  useGetProjectDocumentPhaseTreeQuery,
  useGetDocumentTypesQuery,
  useUpdateDocumentMutation,
  useReplaceDocumentFileMutation,
} from "../../api/documents/document.api";

import { useGetProjectsQuery } from "../../api/projects/project.api";

/* ------------------------------------------------------------------
 * Brand — centralised until these live in the tailwind theme.
 * ------------------------------------------------------------------ */
const BRAND = "bg-[#1F453B] hover:bg-[#17372f] text-white";
const BRAND_TEXT = "text-[#1F453B]";
const BRAND_SOFT = "bg-[#E7F1EA] text-[#1F453B]";
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

function StatPill({ label, value, sub, tone }) {
  return (
    <div className="text-right">
      <div
        className={cn(
          "text-xs font-semibold tabular-nums",
          tone === "warning" ? "text-[#A34D27]" : "text-foreground",
        )}
      >
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      {sub}
    </div>
  );
}

function ProgressStat({ percentage, width = "w-[90px]" }) {
  return (
    <div className={width}>
      <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
        <span>Progress</span>
        <span>{percentage}%</span>
      </div>
      <Progress value={clampPercent(percentage)} className="h-1.5" />
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
    <div className="border-t px-4 py-3 transition-colors hover:bg-muted/40">
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          {isUploaded ? (
            <CheckCircle2
              className="h-[18px] w-[18px] text-emerald-600"
              aria-label="Uploaded"
            />
          ) : (
            <Circle
              className={cn(
                "h-[18px] w-[18px]",
                isRequired ? "text-[#B04D26]" : "text-muted-foreground",
              )}
              aria-label={isRequired ? "Required, pending" : "Pending"}
            />
          )}
        </div>

        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            isUploaded ? "bg-[#E7F1EA]" : "bg-muted",
          )}
        >
          <FileText
            className={cn(
              "h-[15px] w-[15px]",
              isUploaded ? BRAND_TEXT : "text-muted-foreground",
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] font-semibold">
              {documentType?.name || "Untitled document"}
            </span>

            {documentType?.code && (
              <span className="text-[10.5px] text-muted-foreground">
                {documentType.code}
              </span>
            )}

            {isRequired ? (
              <Badge className="h-4 rounded-full bg-[#F4E1D6] px-1.5 text-[10px] font-bold text-[#8A4B2A] hover:bg-[#F4E1D6]">
                Required
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="h-4 rounded-full px-1.5 text-[10px] font-semibold"
              >
                Optional
              </Badge>
            )}
          </div>

          {documentType?.description && (
            <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
              {documentType.description}
            </div>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
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

        <div className="hidden min-w-[90px] shrink-0 md:block">
          {isUploaded ? (
            <Badge className="rounded-full bg-[#E7F1EA] text-[11px] font-semibold text-[#2F6B3F] hover:bg-[#E7F1EA]">
              Uploaded
            </Badge>
          ) : (
            <Badge
              className={cn(
                "rounded-full text-[11px] font-semibold",
                isRequired
                  ? "bg-[#F4E1D6] text-[#A34D27] hover:bg-[#F4E1D6]"
                  : "bg-muted text-muted-foreground hover:bg-muted",
              )}
            >
              Pending
            </Badge>
          )}
        </div>

        <div className="shrink-0">
          {!isUploaded ? (
            <Button
              type="button"
              size="sm"
              onClick={() => onUpload(documentType, projectId)}
              className={BRAND}
            >
              <Upload className="h-[13px] w-[13px]" />
              <span className="hidden sm:inline">Make / upload</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onUpload(documentType, projectId)}
                title="Upload another file"
              >
                <Upload className="h-[13px] w-[13px]" />
                <span className="hidden lg:inline">
                  {allowsMultiple ? "Add" : "Replace"}
                </span>
              </Button>

              {latestDocumentId && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onDownload(latestDocumentId)}
                  title="Download latest document"
                >
                  <Download className="h-[13px] w-[13px]" />
                  <span className="hidden lg:inline">Download</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {allowsMultiple && documentIds.length > 1 && (
        <div className="ml-[76px] mt-2 border-l-2 pl-3">
          <div className="mb-1.5 text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
            Uploaded files
          </div>
          <div className="flex flex-wrap gap-1.5">
            {documentIds.map((documentId, index) => (
              <Button
                key={documentId}
                type="button"
                variant="secondary"
                size="sm"
                className="h-7 gap-1.5 px-2 text-[11px]"
                onClick={() => onDownload(documentId)}
              >
                <Download className="h-[11px] w-[11px]" />
                File {index + 1}
              </Button>
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
    <Collapsible open={!collapsed} onOpenChange={onToggle} asChild>
      <Card className="overflow-hidden py-0">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full bg-muted/60 px-4 py-3 text-left transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <div className={cn("shrink-0", BRAND_TEXT)}>
                {collapsed ? (
                  <ChevronRight className="h-[18px] w-[18px]" />
                ) : (
                  <ChevronDown className="h-[18px] w-[18px]" />
                )}
              </div>

              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background text-xs font-bold",
                  BRAND_TEXT,
                )}
              >
                {phase?.phaseNumber || phase?.phase_number || "—"}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">
                    {phase?.title || "Untitled phase"}
                  </span>

                  {(phase?.phaseCode || phase?.phase_code) && (
                    <span className="text-[10.5px] text-muted-foreground">
                      {phase?.phaseCode || phase?.phase_code}
                    </span>
                  )}

                  {isComplete ? (
                    <Badge className="h-4 rounded-full bg-[#E7F1EA] px-1.5 text-[10px] font-bold text-[#2F6B3F] hover:bg-[#E7F1EA]">
                      Complete
                    </Badge>
                  ) : (
                    <Badge className="h-4 rounded-full bg-[#F4E1D6] px-1.5 text-[10px] font-bold text-[#A34D27] hover:bg-[#F4E1D6]">
                      Pending
                    </Badge>
                  )}
                </div>

                {phase?.description && (
                  <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                    {phase.description}
                  </div>
                )}
              </div>

              <div className="hidden shrink-0 items-center gap-4 sm:flex">
                <StatPill label="uploaded" value={`${uploaded}/${total}`} />
                <StatPill
                  label="required"
                  value={`${uploadedRequired}/${required}`}
                  tone={pendingRequired > 0 ? "warning" : "default"}
                />
                <ProgressStat percentage={completionPercentage} />
              </div>
            </div>

            <div className="ml-12 mt-3 sm:hidden">
              <div className="mb-1 flex items-center justify-between text-[10.5px] text-muted-foreground">
                <span>
                  {uploaded}/{total} uploaded
                </span>
                <span>
                  Required: {uploadedRequired}/{required}
                </span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress
                value={clampPercent(completionPercentage)}
                className="h-1.5"
              />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
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
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              No document types configured for this phase.
            </div>
          )}

          <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2.5 text-[11px]">
            <span className="text-muted-foreground">
              {pending} pending document{pending !== 1 ? "s" : ""}
            </span>
            <span
              className={
                pendingRequired > 0
                  ? "font-semibold text-[#A34D27]"
                  : "font-semibold text-[#2F6B3F]"
              }
            >
              {pendingRequired > 0
                ? `${pendingRequired} required pending`
                : "All required documents uploaded"}
            </span>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
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
    <Collapsible open={!collapsed} onOpenChange={onToggle} asChild>
      <Card className="overflow-hidden py-0">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full bg-background px-4 py-3 text-left transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center gap-3">
              <div className={cn("shrink-0", BRAND_TEXT)}>
                {collapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F1EA]">
                {collapsed ? (
                  <Folder className={cn("h-[18px] w-[18px]", BRAND_TEXT)} />
                ) : (
                  <FolderOpen className={cn("h-[18px] w-[18px]", BRAND_TEXT)} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-bold">{projectName}</span>
                  {project?.code && (
                    <span className="text-[10.5px] text-muted-foreground">
                      {project.code}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                  {projectId}
                </div>
              </div>

              <div className="hidden shrink-0 items-center gap-5 md:flex">
                <StatPill
                  label="phases"
                  value={`${completedPhases}/${totalPhases}`}
                />
                <StatPill
                  label="documents"
                  value={`${uploadedDocuments}/${totalDocuments}`}
                />
                <ProgressStat percentage={completionPercentage} />
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-3 border-t bg-muted/20 p-3">{children}</div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  label,
  value,
  sub,
  valueClassName,
  subClassName,
  className,
}) {
  return (
    <Card className={cn("p-3", className)}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-xl font-bold", valueClassName)}>
        {value}
      </div>
      <div className={cn("text-[10.5px] text-muted-foreground", subClassName)}>
        {sub}
      </div>
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
    nav(query ? `/projects/documents?${query}` : "/projects/documents", {
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
    setCollapsedProjects({});
    setCollapsedPhases({});
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
    <Shell
      title="Project documents"
      subtitle={
        selectedProjectId
          ? `${selectedProjectName} — document checklist`
          : "All projects — document control and checklist"
      }
      action={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("h-[14px] w-[14px]", isFetching && "animate-spin")}
            />
            Refresh
          </Button>

          <Button
            type="button"
            className={BRAND}
            onClick={() => {
              if (!selectedProjectId) {
                toast.info("Select a project before uploading a document.");
                return;
              }
              nav(`/projects/documents/upload?project_id=${selectedProjectId}`);
            }}
          >
            <Upload className="h-[14px] w-[14px]" />
            Upload document
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* -------------------------------------------- Project selector */}
        <Card className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="max-w-xl flex-1 space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Project
              </Label>

              <Select
                value={selectedProjectId || ALL_PROJECTS}
                onValueChange={handleProjectChange}
              >
                <SelectTrigger className="h-11 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_PROJECTS}>All projects</SelectItem>
                  {projects.map((project) => {
                    const projectId = getProjectId(project);
                    if (!projectId) return null;
                    return (
                      <SelectItem key={projectId} value={String(projectId)}>
                        {getProjectName(project, projectId)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <p className="text-[11.5px] text-muted-foreground">
              {selectedProjectId
                ? "Showing document phases for the selected project."
                : "Showing the document phase tree for every project."}
            </p>
          </div>
        </Card>

        {/* -------------------------------------------- Summary */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <SummaryCard
            label="Projects"
            value={selectedProjectId ? 1 : totalProjects}
            sub="in view"
          />
          <SummaryCard
            label="Phases"
            value={`${completedPhases}/${totalPhases}`}
            sub="completed"
          />
          <SummaryCard
            label="Documents"
            value={`${uploadedDocuments}/${totalDocuments}`}
            sub="uploaded"
          />
          <SummaryCard
            label="Pending"
            value={pendingDocuments}
            valueClassName="text-[#A34D27]"
            sub="document types"
          />
          <SummaryCard
            label="Required"
            value={`${uploadedRequiredDocuments}/${requiredDocuments}`}
            sub="uploaded"
          />
          <SummaryCard
            label="Required completion"
            value={`${requiredCompletionPercentage}%`}
            valueClassName={BRAND_TEXT}
            sub={`${pendingRequiredDocuments} required pending`}
            subClassName="text-[#A34D27]"
            className="col-span-2 lg:col-span-1"
          />
        </div>

        {/* -------------------------------------------- Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search project, phase, document type, code..."
            value={q}
            onChange={(event) => setQ(event.target.value)}
            className="max-w-md"
          />

          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold">
            <Checkbox
              checked={showCompleted}
              onCheckedChange={(checked) => setShowCompleted(Boolean(checked))}
            />
            Show completed phases
          </label>

          <div className="ml-auto flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={expandAll}
            >
              Expand all
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={collapseAll}
            >
              Collapse all
            </Button>
          </div>
        </div>

        {/* -------------------------------------------- Error */}
        {isError && (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm font-semibold text-destructive">
                Failed to load document checklist
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {error?.data?.message ||
                  error?.data?.detail ||
                  "Please try again."}
              </p>
              <Button
                type="button"
                size="sm"
                className={cn(BRAND, "mt-4")}
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* -------------------------------------------- Loading */}
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        )}

        {/* -------------------------------------------- All projects */}
        {!isLoading && !isError && !selectedProjectId && (
          <div className="space-y-3">
            {visibleProjects.length ? (
              visibleProjects.map((project) => {
                const projectId = getProjectId(project);
                if (!projectId) return null;

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
                      <div className="px-4 py-10 text-center text-xs text-muted-foreground">
                        No document phases configured for this project.
                      </div>
                    )}
                  </ProjectTreeCard>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FolderOpen className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
                  <p className="text-sm font-semibold">No projects found</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {q
                      ? "Try a different search."
                      : "No projects are available."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* -------------------------------------------- Selected project */}
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
                <CardContent className="py-12 text-center">
                  <FileText className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
                  <p className="text-sm font-semibold">
                    No document phases found
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {q
                      ? "Try a different search."
                      : "No document phases are configured for this project."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* -------------------------------------------- Required warning */}
        {!isLoading && !isError && pendingRequiredDocuments > 0 && (
          <Alert className="border-[rgba(176,77,38,0.18)] bg-[#FFF8F4]">
            <AlertTriangle className="h-4 w-4 text-[#B04D26]" />
            <AlertTitle className="text-[#7D3C22]">
              Required documents are still pending
            </AlertTitle>
            <AlertDescription className="text-[#8A6B5D]">
              {pendingRequiredDocuments} required document
              {pendingRequiredDocuments !== 1 ? "s" : ""} must be uploaded
              before the document checklist is complete.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Shell>
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
            <Button type="submit" disabled={savingAny} className={BRAND}>
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
    <div className="rounded-lg border bg-[#F4F8F5] px-3 py-2.5">
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
