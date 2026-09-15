import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Archive,
  Trash2,
  RotateCcw,
  FileText,
  Download,
  RefreshCw,
  CheckCircle2,
  Circle,
  FolderOpen,
  ChevronRight,
  List,
  GitBranch,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Shell } from "../../hooks/shared";

import {
  useGetProjectsSummaryQuery,
  useGetProjectsQuery,
  useArchiveProjectMutation,
  useRestoreProjectMutation,
  useDeleteProjectMutation,
} from "../../api/projects/project.api";

import { useGetProjectDocumentPhaseTreeQuery } from "../../api/documents/document.api";

/* ------------------------------------------------------------------
 * Brand — centralised until these live in the tailwind theme.
 * ------------------------------------------------------------------ */
const BRAND = "bg-[#1F453B] hover:bg-[#17372f] text-white";
const BRAND_TEXT = "text-[#1F453B]";
const BRAND_SOFT = "bg-[#E7F1EA] text-[#1F453B]";

/* ============================================================
   STATUS
============================================================ */

const STATUS_LABEL = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
  on_hold: "On Hold",
};

const STATUS_CLASS = {
  active: "bg-[#E7F1EA] text-[#2F6B3F] hover:bg-[#E7F1EA]",
  completed: "bg-[#E7F1EA] text-[#2F6B3F] hover:bg-[#E7F1EA]",
  archived: "bg-muted text-muted-foreground hover:bg-muted",
  on_hold: "bg-[#F4E1D6] text-[#A34D27] hover:bg-[#F4E1D6]",
};

/* ============================================================
   DOCUMENT TEMPLATES
============================================================ */

const DOCUMENT_TEMPLATES = [
  {
    id: "site-visit-schedule-template",
    name: "Site Visit Schedule Template",
    description:
      "Standard template for planning and recording project site visits.",
    type: "Template",
    format: "PDF",
    file: "/templates/site-visit-schedule-template.pdf",
  },
  {
    id: "how-we-work",
    name: "How We Work",
    description:
      "Overview of the standard project workflow, processes, responsibilities, and ways of working.",
    type: "Guideline",
    format: "PDF",
    file: "/templates/how-we-work.pdf",
  },
];

/* ============================================================
   HELPERS — PROJECT
============================================================ */

const getProjectId = (project) =>
  project?.id || project?.projectId || project?.project_id || "";

const getProjectName = (project) =>
  project?.name ||
  project?.projectName ||
  project?.title ||
  project?.code ||
  project?.project_code ||
  getProjectId(project) ||
  "Untitled project";

const getProjectCode = (project) =>
  project?.code || project?.project_code || project?.slug || "";

const getClientName = (project) =>
  project?.client?.name || project?.clientName || project?.client_name || "—";

const getProjectType = (project) =>
  project?.project_type?.name ||
  project?.projectType?.name ||
  project?.project_type_name ||
  project?.projectTypeName ||
  "—";

const getProjectStatus = (project) =>
  String(project?.status || "active").toLowerCase();

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

/*
 * If a project object ever carries its own embedded phases (legacy /
 * alternate backend shape), this keeps the timeline UI independent from
 * the exact serialization.
 */
const getProjectPhases = (project) => {
  const phases =
    project?.phases ||
    project?.project_phases ||
    project?.projectPhases ||
    project?.timeline ||
    project?.workflow?.phases ||
    [];

  return Array.isArray(phases) ? phases : [];
};

const getPhaseName = (phase) =>
  phase?.name ||
  phase?.title ||
  phase?.phase_name ||
  phase?.phaseName ||
  phase?.label ||
  phase?.process_name ||
  "Untitled phase";

const getPhaseId = (phase, index) =>
  phase?.id ||
  phase?.phaseId ||
  phase?.phase_id ||
  phase?.code ||
  phase?.phase_code ||
  `phase-${index}`;

const getPhaseStatus = (phase) => {
  const explicitStatus = String(
    phase?.status || phase?.phase_status || phase?.state || "",
  ).toLowerCase();

  if (
    ["completed", "complete", "cleared", "done", "finished"].includes(
      explicitStatus,
    )
  ) {
    return "completed";
  }

  if (
    ["current", "active", "in_progress", "in-progress", "working"].includes(
      explicitStatus,
    )
  ) {
    return "current";
  }

  if (
    ["pending", "upcoming", "locked", "ready", "not_started"].includes(
      explicitStatus,
    )
  ) {
    return "upcoming";
  }

  if (phase?.completed === true || phase?.isComplete === true)
    return "completed";
  if (
    phase?.current === true ||
    phase?.isCurrent === true ||
    phase?.active === true
  )
    return "current";

  return "upcoming";
};

/*
 * Fallback current-phase / current-document readers for projects that
 * don't resolve against the phase tree at all (e.g. tree fetch failed,
 * or the project isn't present in the tree response for some reason).
 */
const getCurrentPhaseName = (project) => {
  const phases = getProjectPhases(project);

  const current =
    project?.current_phase ||
    project?.currentPhase ||
    (project?.current_phase_name && { name: project.current_phase_name }) ||
    phases.find((phase) => getPhaseStatus(phase) === "current") ||
    null;

  return (
    current?.name ||
    current?.title ||
    current?.phase_name ||
    current?.phaseName ||
    project?.current_phase_name ||
    project?.currentPhaseName ||
    "Phase not started"
  );
};

const getCurrentDocumentName = (project) => {
  const document =
    project?.current_document ||
    project?.currentDocument ||
    project?.document_in_progress ||
    project?.documentInProgress ||
    project?.active_document ||
    project?.activeDocument ||
    project?.documentBeingPrepared ||
    null;

  if (typeof document === "string") return document;

  return (
    document?.name ||
    document?.title ||
    document?.document_name ||
    document?.documentName ||
    project?.current_document_name ||
    project?.currentDocumentName ||
    "No document currently being prepared"
  );
};

/*
 * ============================================================
 * PHASE TREE (getProjectDocumentPhaseTree)
 *
 * GET /document-types/project-phase-tree returns:
 *
 *   {
 *     "projects": [
 *       {
 *         "id": "<project uuid>",
 *         "name": "<project name>",
 *         "phases": [
 *           {
 *             "id": "...",
 *             "phaseNumber": 1,
 *             "phaseCode": "01_BRIEF",
 *             "title": "01 BRIEF",
 *             "sortOrder": 1,
 *             "isComplete": false,
 *             "summary": {
 *               "total": 2, "uploaded": 0, "pending": 2,
 *               "required": 2, "uploadedRequired": 0, "pendingRequired": 2,
 *               "completionPercentage": 0, "requiredCompletionPercentage": 0
 *             },
 *             "documents": [
 *               {
 *                 "name": "Client Brief",
 *                 "sequence": 1,
 *                 "requirementType": "REQUIRED",
 *                 "isUploaded": false,
 *                 ...
 *               }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 *
 * This is the source of truth for phase order, completion, and which
 * document should be worked on next within a phase. It's matched to a
 * project from useGetProjectsQuery by id (falling back to name).
 * ============================================================
 */

const normalizePhaseTreeProjects = (tree) => {
  if (Array.isArray(tree?.projects)) return tree.projects;
  if (Array.isArray(tree)) return tree;
  return [];
};

const findPhaseTreeProject = (project, phaseTree) => {
  const entries = normalizePhaseTreeProjects(phaseTree);
  const projectId = String(getProjectId(project) || "");
  const projectName = getProjectName(project).trim().toLowerCase();

  return (
    entries.find((entry) => String(entry?.id || "") === projectId) ||
    entries.find(
      (entry) =>
        String(entry?.name || "")
          .trim()
          .toLowerCase() === projectName,
    ) ||
    null
  );
};

const getTreePhases = (entry) =>
  Array.isArray(entry?.phases) ? entry.phases : [];

const getTreePhaseId = (phase, index) =>
  phase?.id || phase?.phaseCode || phase?.code || `phase-${index}`;

const getTreePhaseName = (phase) =>
  phase?.title || phase?.phaseCode || phase?.name || "Untitled phase";

const getTreePhaseOrder = (phase, index) =>
  phase?.sortOrder ?? phase?.phaseNumber ?? index;

const getTreePhaseComplete = (phase) => Boolean(phase?.isComplete);

const getTreePhaseDocCounts = (phase) => {
  const summary = phase?.summary;
  if (!summary) return null;

  return {
    uploaded: summary.uploaded ?? 0,
    total: summary.total ?? 0,
    required: summary.required ?? 0,
    uploadedRequired: summary.uploadedRequired ?? 0,
    pendingRequired: summary.pendingRequired ?? 0,
  };
};

/*
 * The next document to work on within a phase: the earliest REQUIRED
 * document (by sequence) not yet uploaded, falling back to any pending
 * document if nothing required is outstanding.
 */
const getTreePhasePendingDocument = (phase) => {
  const documents = Array.isArray(phase?.documents) ? phase.documents : [];

  const pending = documents
    .filter((doc) => !doc?.isUploaded)
    .slice()
    .sort((a, b) => (a?.sequence ?? 0) - (b?.sequence ?? 0));

  const requiredPending = pending.find(
    (doc) => doc?.requirementType === "REQUIRED",
  );

  return (requiredPending || pending[0])?.name || null;
};

/*
 * Builds the normalized phases array rendered by <ProjectTimeline> /
 * consumed by the table + search. Each item: { id, name, status,
 * docCounts, pendingDocumentName }.
 *
 * Priority:
 *   1. Project's own embedded phases, if present (legacy shape).
 *   2. The matching entry in the phase tree response.
 */
const buildTimelinePhases = (project, phaseTree) => {
  const ownPhases = getProjectPhases(project);

  if (ownPhases.length) {
    return ownPhases.map((phase, index) => ({
      id: getPhaseId(phase, index),
      name: getPhaseName(phase),
      status: getPhaseStatus(phase),
      docCounts: null,
      pendingDocumentName: null,
    }));
  }

  const treeEntry = findPhaseTreeProject(project, phaseTree);
  const treePhases = getTreePhases(treeEntry)
    .slice()
    .sort((a, b) => getTreePhaseOrder(a, 0) - getTreePhaseOrder(b, 0));

  if (!treePhases.length) return [];

  const firstIncompleteIndex = treePhases.findIndex(
    (phase) => !getTreePhaseComplete(phase),
  );

  return treePhases.map((phase, index) => ({
    id: getTreePhaseId(phase, index),
    name: getTreePhaseName(phase),
    status: getTreePhaseComplete(phase)
      ? "completed"
      : index === firstIncompleteIndex
        ? "current"
        : "upcoming",
    docCounts: getTreePhaseDocCounts(phase),
    pendingDocumentName:
      index === firstIncompleteIndex
        ? getTreePhasePendingDocument(phase)
        : null,
  }));
};

/*
 * Resolves what a project's card / row should show for "current phase"
 * and "document being prepared", preferring the phase tree and falling
 * back to whatever the project object itself carries.
 */
const getProjectCurrentInfo = (project, phaseTree) => {
  const phases = buildTimelinePhases(project, phaseTree);
  const current = phases.find((phase) => phase.status === "current");

  return {
    phases,
    phaseName: current?.name || getCurrentPhaseName(project),
    documentName:
      current?.pendingDocumentName || getCurrentDocumentName(project),
  };
};

const getPhaseProgress = (phases) => {
  if (!phases.length) return { completed: 0, current: 0, percentage: 0 };

  const completed = phases.filter(
    (phase) => getPhaseStatus(phase) === "completed",
  ).length;
  const current = phases.findIndex(
    (phase) => getPhaseStatus(phase) === "current",
  );
  const currentIndex =
    current >= 0 ? current + 1 : completed > 0 ? completed : 0;

  return {
    completed,
    current: currentIndex,
    percentage: Math.round((currentIndex / phases.length) * 100),
  };
};

const clampPercent = (value) => Math.min(Math.max(value, 0), 100);

/* ============================================================
   STATUS CHIP
============================================================ */

function StatusChip({ status }) {
  const normalized = String(status || "active").toLowerCase();

  return (
    <Badge
      className={cn(
        "rounded-full text-[10.5px] font-bold",
        STATUS_CLASS[normalized] || STATUS_CLASS.active,
      )}
    >
      {STATUS_LABEL[normalized] || normalized}
    </Badge>
  );
}

/* ============================================================
   PHASE DOT
============================================================ */

function PhaseDot({ status }) {
  if (status === "completed") {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#BBD5C1] bg-[#E7F1EA]">
        <CheckCircle2 className="h-[15px] w-[15px] text-[#2F6B3F]" />
      </div>
    );
  }

  if (status === "current") {
    return (
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-4 border-[#D8E0DA]",
          BRAND,
        )}
      >
        <div className="h-1.5 w-1.5 rounded-full bg-white" />
      </div>
    );
  }

  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#D8E0DA] bg-background">
      <Circle className="h-[11px] w-[11px] text-muted-foreground" />
    </div>
  );
}

/* ============================================================
   PROJECT TIMELINE
============================================================ */

function ProjectTimeline({ project, phaseTree }) {
  const { phases, phaseName, documentName } = useMemo(
    () => getProjectCurrentInfo(project, phaseTree),
    [project, phaseTree],
  );

  const progress = getPhaseProgress(phases);

  return (
    <Card className="overflow-hidden py-0">
      {/* Project header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              BRAND_SOFT,
            )}
          >
            <FolderOpen className="h-[18px] w-[18px]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="link"
                className={cn(
                  "h-auto p-0 text-[15px] font-bold text-foreground hover:no-underline hover:text-[#1F453B]",
                )}
                onClick={() =>
                  (window.location.href = `/projects/${getProjectId(project)}`)
                }
              >
                {getProjectName(project)}
              </Button>

              {getProjectCode(project) && (
                <span className="text-[10.5px] text-muted-foreground">
                  {getProjectCode(project)}
                </span>
              )}

              <StatusChip status={getProjectStatus(project)} />
            </div>

            <div className="mt-0.5 text-[11.5px] text-muted-foreground">
              {getClientName(project)}
            </div>
          </div>

          <div className="hidden shrink-0 text-right sm:block">
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              ECD
            </div>
            <div className="mt-0.5 text-xs font-semibold">
              {formatDate(
                project?.expected_completion_date ||
                  project?.expectedCompletionDate,
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Current work */}
      <div className="border-b bg-muted/30 px-4 py-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border bg-background px-3 py-2.5">
            <div className="flex items-center gap-2">
              <GitBranch className={cn("h-[14px] w-[14px]", BRAND_TEXT)} />
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Current phase
              </span>
            </div>
            <div className="mt-1 text-[13px] font-bold">{phaseName}</div>
          </div>

          <div className="rounded-lg border bg-background px-3 py-2.5">
            <div className="flex items-center gap-2">
              <FileText className={cn("h-[14px] w-[14px]", BRAND_TEXT)} />
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Document being prepared
              </span>
            </div>
            <div className="mt-1 truncate text-[13px] font-bold">
              {documentName}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 py-5">
        {phases.length ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold">Project timeline</div>
                <div className="mt-0.5 text-[10.5px] text-muted-foreground">
                  {progress.completed} of {phases.length} phases completed
                </div>
              </div>
              <div className={cn("text-xs font-bold", BRAND_TEXT)}>
                {progress.percentage}%
              </div>
            </div>

            <Progress
              value={clampPercent(progress.percentage)}
              className="mb-6 h-1.5"
            />

            <div className="overflow-x-auto pb-2">
              <div
                className="relative min-w-[720px]"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${phases.length}, minmax(130px, 1fr))`,
                }}
              >
                <div className="absolute left-4 right-4 top-[13px] h-[2px] bg-[#D8E0DA]" />

                {phases.map((phase, index) => {
                  const status = getPhaseStatus(phase);

                  return (
                    <div
                      key={getPhaseId(phase, index)}
                      className="relative px-2"
                    >
                      <div className="flex justify-center">
                        <PhaseDot status={status} />
                      </div>

                      <div className="mt-2 text-center">
                        <div
                          className={cn(
                            "text-[11.5px] font-semibold leading-tight",
                            status === "current"
                              ? BRAND_TEXT
                              : status === "completed"
                                ? "text-foreground"
                                : "text-muted-foreground",
                          )}
                        >
                          {getPhaseName(phase)}
                        </div>

                        <div className="mt-1 text-[9.5px] text-muted-foreground/80">
                          {status === "completed"
                            ? "Completed"
                            : status === "current"
                              ? "In progress"
                              : "Upcoming"}
                        </div>

                        {phase.docCounts && (
                          <div className="mt-0.5 text-[9.5px] text-muted-foreground/80">
                            {phase.docCounts.uploaded}/{phase.docCounts.total}{" "}
                            docs
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center">
            <GitBranch className="mx-auto mb-2 h-[30px] w-[30px] text-muted-foreground/50" />
            <div className="text-[13px] font-semibold">
              Timeline not configured
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Project phases will appear here once configured.
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ============================================================
   PROJECT TABLE
============================================================ */

function ProjectTable({
  projects,
  loading,
  phaseTree,
  onArchive,
  onRestore,
  onDelete,
}) {
  const nav = useNavigate();

  return (
    <Card className="overflow-hidden py-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Current phase</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>ECD</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  Loading projects...
                </TableCell>
              </TableRow>
            )}

            {!loading && !projects.length && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <FolderOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <div className="text-[13px] font-semibold">
                    No projects found
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Try changing your search or status filter.
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              projects.map((project) => {
                const projectId = getProjectId(project);
                const { phaseName, documentName } = getProjectCurrentInfo(
                  project,
                  phaseTree,
                );

                return (
                  <TableRow key={projectId}>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => nav(`/projects/${projectId}`)}
                        className="min-w-0 text-left"
                      >
                        <div
                          className={cn(
                            "max-w-[220px] truncate font-semibold hover:text-[#1F453B]",
                          )}
                        >
                          {getProjectName(project)}
                        </div>
                        <div className="mt-0.5 max-w-[220px] truncate text-[10.5px] text-muted-foreground">
                          {getProjectCode(project)}
                        </div>
                      </button>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {getClientName(project)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GitBranch
                          className={cn(
                            "h-[13px] w-[13px] shrink-0",
                            BRAND_TEXT,
                          )}
                        />
                        <span className="max-w-[180px] truncate font-semibold">
                          {phaseName}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-[13px] w-[13px] shrink-0 text-muted-foreground" />
                        <span className="max-w-[210px] truncate text-muted-foreground">
                          {documentName}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusChip status={getProjectStatus(project)} />
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(
                        project?.expected_completion_date ||
                          project?.expectedCompletionDate,
                      )}
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Project actions"
                          >
                            <MoreHorizontal className="h-[17px] w-[17px]" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onSelect={() => nav(`/projects/${projectId}`)}
                          >
                            <ChevronRight className="mr-2 h-[15px] w-[15px]" />
                            View
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onSelect={() => nav(`/projects/${projectId}/edit`)}
                          >
                            <Edit className="mr-2 h-[15px] w-[15px]" />
                            Edit
                          </DropdownMenuItem>

                          {getProjectStatus(project) !== "archived" ? (
                            <DropdownMenuItem
                              onSelect={() =>
                                onArchive(projectId, getProjectName(project))
                              }
                              className="text-amber-700"
                            >
                              <Archive className="mr-2 h-[15px] w-[15px]" />
                              Archive
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onSelect={() =>
                                onRestore(projectId, getProjectName(project))
                              }
                              className="text-emerald-700"
                            >
                              <RotateCcw className="mr-2 h-[15px] w-[15px]" />
                              Restore
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onSelect={() =>
                              onDelete(projectId, getProjectName(project))
                            }
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-[15px] w-[15px]" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

/* ============================================================
   DOCUMENTS VIEW
============================================================ */

function DocumentsView() {
  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="border-b py-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              BRAND_SOFT,
            )}
          >
            <FileText className="h-[17px] w-[17px]" />
          </div>
          <div>
            <div className="text-sm font-bold">Project documents</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              Approved templates and documents available for download.
            </div>
          </div>
        </div>
      </CardHeader>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Document</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Format</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {DOCUMENT_TEMPLATES.map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        BRAND_SOFT,
                      )}
                    >
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold">{document.name}</div>
                      <div className="mt-0.5 text-[10.5px] text-muted-foreground">
                        {document.description}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {document.type}
                </TableCell>

                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-md text-[10px] font-bold",
                      BRAND_TEXT,
                    )}
                  >
                    {document.format}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <Button asChild size="sm" className={BRAND}>
                    <a href={document.file} download>
                      <Download className="h-[13px] w-[13px]" />
                      Download
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({ label, value, sub, valueClassName }) {
  return (
    <Card className="p-3">
      <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-1 text-[22px] font-bold", valueClassName)}>
        {value}
      </div>
      <div className="text-[10.5px] text-muted-foreground">{sub}</div>
    </Card>
  );
}

/* ============================================================
   MAIN
============================================================ */

const TABS = [
  ["all", "Projects"],
  ["active", "Active"],
  ["completed", "Completed"],
  ["on_hold", "On Hold"],
  ["archived", "Archived"],
  ["documents", "Documents"],
];

export default function ProjectsDashboard() {
  const nav = useNavigate();

  const [tab, setTab] = useState("all");
  const [view, setView] = useState("timeline");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  /* -------------------------------------------------- Queries */

  const {
    data: summary,
    isFetching: summaryLoading,
    isError: summaryError,
  } = useGetProjectsSummaryQuery();

  const {
    data: projectsResponse,
    isFetching: projectsLoading,
    isError: projectsError,
    refetch,
  } = useGetProjectsQuery({});

  /*
   * { projects: [ { id, name, phases: [...] } ] } — per-project phase
   * and document completion, used to drive the timeline view, the
   * table's Phase/Document columns, and search.
   */
  const {
    data: phaseTree,
    isFetching: phaseTreeLoading,
    isError: phaseTreeError,
  } = useGetProjectDocumentPhaseTreeQuery();

  /* -------------------------------------------------- Normalize */

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
    if (summaryError || projectsError) {
      toast.error("Projects could not be loaded.");
    }
  }, [summaryError, projectsError]);

  useEffect(() => {
    if (phaseTreeError) {
      toast.error("Project timeline phases could not be loaded.");
    }
  }, [phaseTreeError]);

  /* -------------------------------------------------- Filter */

  const filteredProjects = useMemo(() => {
    const search = q.trim().toLowerCase();

    return projects.filter((project) => {
      const status = getProjectStatus(project);

      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!search) return true;

      const { phaseName, documentName } = getProjectCurrentInfo(
        project,
        phaseTree,
      );

      const values = [
        getProjectName(project),
        getProjectCode(project),
        getClientName(project),
        getProjectType(project),
        phaseName,
        documentName,
      ];

      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(search),
      );
    });
  }, [projects, q, statusFilter, phaseTree]);

  /* -------------------------------------------------- Actions */

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
    if (
      !window.confirm(
        `Permanently delete "${name}"?\n\nThis action cannot be undone.`,
      )
    )
      return;

    try {
      await deleteProject(id).unwrap();
      toast.success(`"${name}" was deleted.`);
    } catch (error) {
      toast.error(error?.data?.message || "The project could not be deleted.");
    }
  };

  const loading = summaryLoading || projectsLoading;

  /* -------------------------------------------------- Summary fallbacks */

  const total = summary?.total ?? projects.length;

  const active =
    summary?.active ??
    projects.filter((project) => getProjectStatus(project) === "active").length;

  const completed =
    summary?.completed ??
    projects.filter((project) => getProjectStatus(project) === "completed")
      .length;

  const onHold =
    summary?.on_hold ??
    projects.filter((project) => getProjectStatus(project) === "on_hold")
      .length;

  const archived =
    summary?.archived ??
    projects.filter((project) => getProjectStatus(project) === "archived")
      .length;

  /* -------------------------------------------------- Render */

  return (
    <Shell
      title="Projects"
      subtitle="Manage every project from briefing to final handover through one connected workspace."
      action={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw
              className={cn("h-[14px] w-[14px]", loading && "animate-spin")}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            type="button"
            className={BRAND}
            onClick={() => nav("/projects/new")}
          >
            <Plus className="h-[14px] w-[14px]" />
            Create project
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* -------------------------------------------- Summary */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <SummaryCard
            label="Total projects"
            value={total}
            sub="in workspace"
          />
          <SummaryCard
            label="Active"
            value={active}
            valueClassName={BRAND_TEXT}
            sub="currently running"
          />
          <SummaryCard
            label="On hold"
            value={onHold}
            valueClassName="text-[#A34D27]"
            sub="require attention"
          />
          <SummaryCard
            label="Completed"
            value={completed}
            valueClassName="text-[#2F6B3F]"
            sub="handed over"
          />
          <SummaryCard
            label="Archived"
            value={archived}
            valueClassName="text-muted-foreground"
            sub="archived projects"
          />
        </div>

        {/* -------------------------------------------- Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b bg-transparent p-0">
            {TABS.map(([key, label]) => (
              <TabsTrigger
                key={key}
                value={key}
                className={cn(
                  "rounded-t-lg rounded-b-none border-0 px-3 py-2 text-xs font-semibold shadow-none",
                  "data-[state=active]:bg-[#EAF0EB] data-[state=active]:text-[#1F453B] data-[state=active]:shadow-none",
                )}
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* -------------------------------------------- Documents */}
        {tab === "documents" ? (
          <DocumentsView />
        ) : (
          <>
            {/* Filter / view bar */}
            <Card className="p-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative max-w-xl flex-1">
                  <Search className="absolute left-3 top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    placeholder="Search project, client, phase, document..."
                    className="pl-9"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full font-semibold lg:w-[170px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center rounded-lg border bg-muted/30 p-1 lg:ml-auto">
                  <Button
                    type="button"
                    size="sm"
                    variant={view === "timeline" ? "default" : "ghost"}
                    onClick={() => setView("timeline")}
                    className={cn(
                      "h-8 gap-1.5 text-[11.5px]",
                      view === "timeline" && BRAND,
                    )}
                  >
                    <GitBranch className="h-[13px] w-[13px]" />
                    Timeline
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant={view === "table" ? "default" : "ghost"}
                    onClick={() => setView("table")}
                    className={cn(
                      "h-8 gap-1.5 text-[11.5px]",
                      view === "table" && BRAND,
                    )}
                  >
                    <List className="h-[13px] w-[13px]" />
                    Table
                  </Button>
                </div>
              </div>
            </Card>

            {/* Result info */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-semibold">
                  {tab === "all"
                    ? "Project workspace"
                    : `${STATUS_LABEL[tab] || tab} projects`}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {filteredProjects.length} project
                  {filteredProjects.length !== 1 ? "s" : ""} in view
                </div>
              </div>

              {view === "timeline" && (
                <div className="hidden items-center gap-3 text-[10.5px] text-muted-foreground sm:flex">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-[#2F6B3F]" />
                    Completed
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className={cn("h-2.5 w-2.5 rounded-full", BRAND)} />
                    Current
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Circle className="h-3 w-3 text-muted-foreground" />
                    Upcoming
                  </span>
                </div>
              )}
            </div>

            {/* Loading */}
            {(loading || (view === "timeline" && phaseTreeLoading)) && (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            )}

            {/* Empty */}
            {!loading && !filteredProjects.length && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FolderOpen className="mx-auto mb-3 h-[38px] w-[38px] text-muted-foreground/50" />
                  <div className="text-sm font-semibold">No projects found</div>
                  <div className="mt-1 text-[11.5px] text-muted-foreground">
                    {q
                      ? "Try a different search."
                      : "No projects are available."}
                  </div>
                  {q && (
                    <Button
                      type="button"
                      size="sm"
                      className={cn(BRAND, "mt-4")}
                      onClick={() => setQ("")}
                    >
                      Clear search
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            {!loading &&
              !phaseTreeLoading &&
              filteredProjects.length > 0 &&
              view === "timeline" && (
                <div className="space-y-3">
                  {filteredProjects.map((project) => (
                    <ProjectTimeline
                      key={getProjectId(project)}
                      project={project}
                      phaseTree={phaseTree}
                    />
                  ))}
                </div>
              )}

            {/* Table */}
            {!loading && filteredProjects.length > 0 && view === "table" && (
              <ProjectTable
                projects={filteredProjects}
                loading={loading}
                phaseTree={phaseTree}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onDelete={handleDelete}
              />
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
