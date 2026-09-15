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
  Clock3,
  CalendarDays,
  FolderOpen,
  ChevronRight,
  List,
  GitBranch,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Shell, Card } from "../../hooks/shared";

import {
  useGetProjectsSummaryQuery,
  useGetProjectsQuery,
  useArchiveProjectMutation,
  useRestoreProjectMutation,
  useDeleteProjectMutation,
} from "../../api/projects/project.api";

import { useGetProjectDocumentPhaseTreeQuery } from "../../api/documents/document.api";

/* ============================================================================
   STATUS
============================================================================ */

const STATUS_LABEL = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
  on_hold: "On Hold",
};

const STATUS_TONE = {
  active: {
    bg: "#E7F1EA",
    fg: "#2F6B3F",
  },
  completed: {
    bg: "#E7F1EA",
    fg: "#2F6B3F",
  },
  archived: {
    bg: "#EAEEF0",
    fg: "#6B7B7C",
  },
  on_hold: {
    bg: "#F4E1D6",
    fg: "#A34D27",
  },
};

/* ============================================================================
   DOCUMENT TEMPLATES
============================================================================ */

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

/* ============================================================================
   HELPERS — PROJECT
============================================================================ */

const getProjectId = (project) => {
  return project?.id || project?.projectId || project?.project_id || "";
};

const getProjectName = (project) => {
  return (
    project?.name ||
    project?.projectName ||
    project?.title ||
    project?.code ||
    project?.project_code ||
    getProjectId(project) ||
    "Untitled Project"
  );
};

const getProjectCode = (project) => {
  return project?.code || project?.project_code || project?.slug || "";
};

const getClientName = (project) => {
  return (
    project?.client?.name || project?.clientName || project?.client_name || "—"
  );
};

const getProjectType = (project) => {
  return (
    project?.project_type?.name ||
    project?.projectType?.name ||
    project?.project_type_name ||
    project?.projectTypeName ||
    "—"
  );
};

const getProjectStatus = (project) => {
  return String(project?.status || "active").toLowerCase();
};

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

const getPhaseName = (phase) => {
  return (
    phase?.name ||
    phase?.title ||
    phase?.phase_name ||
    phase?.phaseName ||
    phase?.label ||
    phase?.process_name ||
    "Untitled Phase"
  );
};

const getPhaseId = (phase, index) => {
  return (
    phase?.id ||
    phase?.phaseId ||
    phase?.phase_id ||
    phase?.code ||
    phase?.phase_code ||
    `phase-${index}`
  );
};

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

  if (phase?.completed === true || phase?.isComplete === true) {
    return "completed";
  }

  if (
    phase?.current === true ||
    phase?.isCurrent === true ||
    phase?.active === true
  ) {
    return "current";
  }

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

  if (typeof document === "string") {
    return document;
  }

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
 * ============================================================================
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
 * ============================================================================
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

const getTreePhases = (entry) => {
  return Array.isArray(entry?.phases) ? entry.phases : [];
};

const getTreePhaseId = (phase, index) => {
  return phase?.id || phase?.phaseCode || phase?.code || `phase-${index}`;
};

const getTreePhaseName = (phase) => {
  return phase?.title || phase?.phaseCode || phase?.name || "Untitled Phase";
};

const getTreePhaseOrder = (phase, index) => {
  return phase?.sortOrder ?? phase?.phaseNumber ?? index;
};

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

  if (!treePhases.length) {
    return [];
  }

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
  if (!phases.length) {
    return {
      completed: 0,
      current: 0,
      percentage: 0,
    };
  }

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

/* ============================================================================
   STATUS CHIP
============================================================================ */

function StatusChip({ status }) {
  const normalized = String(status || "active").toLowerCase();

  const tone = STATUS_TONE[normalized] || STATUS_TONE.active;

  return (
    <span
      className="inline-flex items-center px-2 py-1 rounded-full text-[10.5px] font-bold"
      style={{
        background: tone.bg,
        color: tone.fg,
      }}
    >
      {STATUS_LABEL[normalized] || normalized}
    </span>
  );
}

/* ============================================================================
   PHASE DOT
============================================================================ */

function PhaseDot({ status }) {
  if (status === "completed") {
    return (
      <div className="w-7 h-7 rounded-full bg-[#E7F1EA] border border-[#BBD5C1] flex items-center justify-center shrink-0">
        <CheckCircle2 size={15} className="text-[#2F6B3F]" />
      </div>
    );
  }

  if (status === "current") {
    return (
      <div className="w-7 h-7 rounded-full bg-[#1F453B] border-4 border-[#D8E0DA] flex items-center justify-center shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-white" />
      </div>
    );
  }

  return (
    <div className="w-7 h-7 rounded-full bg-white border-2 border-[#D8E0DA] flex items-center justify-center shrink-0">
      <Circle size={11} className="text-[#B5C4B6]" />
    </div>
  );
}

/* ============================================================================
   PROJECT TIMELINE
============================================================================ */

function ProjectTimeline({ project, phaseTree }) {
  const { phases, phaseName, documentName } = useMemo(
    () => getProjectCurrentInfo(project, phaseTree),
    [project, phaseTree],
  );

  const progress = getPhaseProgress(phases);

  return (
    <Card className="overflow-hidden">
      {/* PROJECT HEADER */}

      <div className="px-4 py-3 border-b border-[rgba(31,69,59,0.08)] bg-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E7F1EA] flex items-center justify-center shrink-0">
            <FolderOpen size={18} className="text-[#1F453B]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                className="font-bold text-[15px] text-[#333333] hover:text-[#1F453B] text-left"
                onClick={() =>
                  (window.location.href = `/projects/${getProjectId(project)}`)
                }
              >
                {getProjectName(project)}
              </button>

              {getProjectCode(project) && (
                <span className="text-[10.5px] text-[#8A9697]">
                  {getProjectCode(project)}
                </span>
              )}

              <StatusChip status={getProjectStatus(project)} />
            </div>

            <div className="text-[11.5px] text-[#8A9697] mt-0.5">
              {getClientName(project)}
            </div>
          </div>

          <div className="hidden sm:block text-right shrink-0">
            <div className="text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
              ECD
            </div>

            <div className="text-[12px] font-semibold text-[#333333] mt-0.5">
              {formatDate(
                project?.expected_completion_date ||
                  project?.expectedCompletionDate,
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CURRENT WORK */}

      <div className="px-4 py-3 bg-[#FAFBFA] border-b border-[rgba(31,69,59,0.08)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg bg-white border border-[#D8E0DA] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <GitBranch size={14} className="text-[#1F453B]" />

              <span className="text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
                Current Phase
              </span>
            </div>

            <div className="text-[13px] font-bold text-[#333333] mt-1">
              {phaseName}
            </div>
          </div>

          <div className="rounded-lg bg-white border border-[#D8E0DA] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[#1F453B]" />

              <span className="text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
                Document Being Prepared
              </span>
            </div>

            <div className="text-[13px] font-bold text-[#333333] mt-1 truncate">
              {documentName}
            </div>
          </div>
        </div>
      </div>

      {/* TIMELINE */}

      <div className="px-5 py-5">
        {phases.length ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[12px] font-semibold text-[#333333]">
                  Project Timeline
                </div>

                <div className="text-[10.5px] text-[#8A9697] mt-0.5">
                  {progress.completed} of {phases.length} phases completed
                </div>
              </div>

              <div className="text-[12px] font-bold text-[#1F453B]">
                {progress.percentage}%
              </div>
            </div>

            {/* PROGRESS BAR */}

            <div className="h-1.5 rounded-full bg-[#E5EAE7] overflow-hidden mb-6">
              <div
                className="h-full rounded-full bg-[#1F453B] transition-all"
                style={{
                  width: `${Math.min(Math.max(progress.percentage, 0), 100)}%`,
                }}
              />
            </div>

            {/* PHASE TRACK */}

            <div className="overflow-x-auto pb-2">
              <div
                className="min-w-[720px] relative"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${phases.length}, minmax(130px, 1fr))`,
                }}
              >
                {/* CONNECTOR */}

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

                      <div className="text-center mt-2">
                        <div
                          className={[
                            "text-[11.5px] font-semibold leading-tight",
                            status === "current"
                              ? "text-[#1F453B]"
                              : status === "completed"
                                ? "text-[#333333]"
                                : "text-[#8A9697]",
                          ].join(" ")}
                        >
                          {getPhaseName(phase)}
                        </div>

                        <div className="text-[9.5px] text-[#A0AAAB] mt-1">
                          {status === "completed"
                            ? "Completed"
                            : status === "current"
                              ? "In progress"
                              : "Upcoming"}
                        </div>

                        {phase.docCounts && (
                          <div className="text-[9.5px] text-[#A0AAAB] mt-0.5">
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
            <GitBranch size={30} className="mx-auto mb-2 text-[#B5C4B6]" />

            <div className="text-[13px] font-semibold text-[#333333]">
              Timeline not configured
            </div>

            <div className="text-[11px] text-[#8A9697] mt-1">
              Project phases will appear here once configured.
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ============================================================================
   PROJECT TABLE
============================================================================ */

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
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="bg-[#FAFBFA]">
            <tr className="border-b border-[#D8E0DA]">
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697] font-semibold">
                Project
              </th>

              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697] font-semibold">
                Client
              </th>

              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697] font-semibold">
                Current Phase
              </th>

              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697] font-semibold">
                Document
              </th>

              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697] font-semibold">
                Status
              </th>

              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697] font-semibold">
                ECD
              </th>

              <th className="w-12" />
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#8A9697]">
                  Loading projects…
                </td>
              </tr>
            )}

            {!loading && !projects.length && (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <FolderOpen
                    size={32}
                    className="mx-auto mb-2 text-[#B5C4B6]"
                  />

                  <div className="text-[13px] font-semibold text-[#333333]">
                    No projects found
                  </div>

                  <div className="text-[11px] text-[#8A9697] mt-1">
                    Try changing your search or status filter.
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              projects.map((project) => {
                const projectId = getProjectId(project);

                const { phaseName, documentName } = getProjectCurrentInfo(
                  project,
                  phaseTree,
                );

                return (
                  <tr
                    key={projectId}
                    className="border-b border-[rgba(31,69,59,0.08)] hover:bg-[#F8FAF9] transition-colors"
                  >
                    {/* PROJECT */}

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => nav(`/projects/${projectId}`)}
                        className="text-left min-w-0"
                      >
                        <div className="font-semibold text-[#333333] hover:text-[#1F453B] truncate max-w-[220px]">
                          {getProjectName(project)}
                        </div>

                        <div className="text-[10.5px] text-[#8A9697] mt-0.5 truncate max-w-[220px]">
                          {getProjectCode(project)}
                        </div>
                      </button>
                    </td>

                    {/* CLIENT */}

                    <td className="px-4 py-3 text-[#6B7B7C]">
                      {getClientName(project)}
                    </td>

                    {/* PHASE */}

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <GitBranch
                          size={13}
                          className="text-[#1F453B] shrink-0"
                        />

                        <span className="font-semibold text-[#333333] truncate max-w-[180px]">
                          {phaseName}
                        </span>
                      </div>
                    </td>

                    {/* DOCUMENT */}

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText
                          size={13}
                          className="text-[#8A9697] shrink-0"
                        />

                        <span className="text-[#6B7B7C] truncate max-w-[210px]">
                          {documentName}
                        </span>
                      </div>
                    </td>

                    {/* STATUS */}

                    <td className="px-4 py-3">
                      <StatusChip status={getProjectStatus(project)} />
                    </td>

                    {/* ECD */}

                    <td className="px-4 py-3 text-[#6B7B7C] whitespace-nowrap">
                      {formatDate(
                        project?.expected_completion_date ||
                          project?.expectedCompletionDate,
                      )}
                    </td>

                    {/* ACTIONS */}

                    <td className="px-2 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[#6B7B7C] hover:bg-[#EAEEF0] hover:text-[#333333]"
                          >
                            <MoreHorizontal size={17} />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onSelect={() => nav(`/projects/${projectId}`)}
                          >
                            <ChevronRight size={15} className="mr-2" />
                            View
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onSelect={() => nav(`/projects/${projectId}/edit`)}
                          >
                            <Edit size={15} className="mr-2" />
                            Edit
                          </DropdownMenuItem>

                          {getProjectStatus(project) !== "archived" ? (
                            <DropdownMenuItem
                              onSelect={() =>
                                onArchive(projectId, getProjectName(project))
                              }
                              className="text-amber-700"
                            >
                              <Archive size={15} className="mr-2" />
                              Archive
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onSelect={() =>
                                onRestore(projectId, getProjectName(project))
                              }
                              className="text-emerald-700"
                            >
                              <RotateCcw size={15} className="mr-2" />
                              Restore
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onSelect={() =>
                              onDelete(projectId, getProjectName(project))
                            }
                            className="text-red-600"
                          >
                            <Trash2 size={15} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

/* ============================================================================
   DOCUMENTS VIEW
============================================================================ */

function DocumentsView() {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-4 border-b border-[rgba(31,69,59,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#E7F1EA] flex items-center justify-center">
            <FileText size={17} className="text-[#1F453B]" />
          </div>

          <div>
            <div className="text-[14px] font-bold text-[#333333]">
              Project Documents
            </div>

            <div className="text-[11px] text-[#8A9697] mt-0.5">
              Approved templates and documents available for download.
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="bg-[#FAFBFA]">
            <tr className="border-b border-[#D8E0DA]">
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
                Document
              </th>

              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
                Type
              </th>

              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
                Format
              </th>

              <th className="text-right px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-[#8A9697]">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {DOCUMENT_TEMPLATES.map((document) => (
              <tr
                key={document.id}
                className="border-b border-[rgba(31,69,59,0.08)] last:border-0 hover:bg-[#F8FAF9]"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#E7F1EA] flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-[#1F453B]" />
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-[#333333]">
                        {document.name}
                      </div>

                      <div className="text-[10.5px] text-[#8A9697] mt-0.5">
                        {document.description}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4 text-[#6B7B7C]">{document.type}</td>

                <td className="px-4 py-4">
                  <span className="inline-flex px-2 py-1 rounded-md bg-[#EAEEF0] text-[#1F453B] text-[10px] font-bold">
                    {document.format}
                  </span>
                </td>

                <td className="px-4 py-4 text-right">
                  <a
                    href={document.file}
                    download
                    className="inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-[#1F453B] text-white text-[11.5px] font-semibold hover:opacity-90"
                  >
                    <Download size={13} />
                    Download
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

/* ============================================================================
   MAIN
============================================================================ */

export default function ProjectsDashboard() {
  const nav = useNavigate();

  const [tab, setTab] = useState("all");
  const [view, setView] = useState("timeline");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  /* --------------------------------------------------------------------------
     QUERIES
  -------------------------------------------------------------------------- */

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

  /* --------------------------------------------------------------------------
     NORMALIZE
  -------------------------------------------------------------------------- */

  const projects = useMemo(() => {
    if (Array.isArray(projectsResponse)) {
      return projectsResponse;
    }

    return projectsResponse?.data || projectsResponse?.projects || [];
  }, [projectsResponse]);

  /* --------------------------------------------------------------------------
     MUTATIONS
  -------------------------------------------------------------------------- */

  const [archiveProject] = useArchiveProjectMutation();

  const [restoreProject] = useRestoreProjectMutation();

  const [deleteProject] = useDeleteProjectMutation();

  /* --------------------------------------------------------------------------
     ERROR
  -------------------------------------------------------------------------- */

  useEffect(() => {
    if (summaryError || projectsError) {
      toast.error("Failed to load projects");
    }
  }, [summaryError, projectsError]);

  useEffect(() => {
    if (phaseTreeError) {
      toast.error("Failed to load project timeline phases");
    }
  }, [phaseTreeError]);

  /* --------------------------------------------------------------------------
     FILTER
  -------------------------------------------------------------------------- */

  const filteredProjects = useMemo(() => {
    const search = q.trim().toLowerCase();

    return projects.filter((project) => {
      const status = getProjectStatus(project);

      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }

      if (!search) {
        return true;
      }

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

  /* --------------------------------------------------------------------------
     ACTIONS
  -------------------------------------------------------------------------- */

  const handleArchive = async (id, name) => {
    if (!window.confirm(`Archive project "${name}"?`)) {
      return;
    }

    try {
      await archiveProject({
        id,
        archived_by: "current_user",
      }).unwrap();

      toast.success(`Project "${name}" has been archived`);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to archive project");
    }
  };

  const handleRestore = async (id, name) => {
    if (!window.confirm(`Restore project "${name}"?`)) {
      return;
    }

    try {
      await restoreProject(id).unwrap();

      toast.success(`Project "${name}" has been restored`);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to restore project");
    }
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `PERMANENTLY DELETE "${name}"?\n\nThis action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await deleteProject(id).unwrap();

      toast.success(`Project "${name}" deleted successfully`);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete project");
    }
  };

  const loading = summaryLoading || projectsLoading;

  /* --------------------------------------------------------------------------
     SUMMARY FALLBACKS
  -------------------------------------------------------------------------- */

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

  /* --------------------------------------------------------------------------
     RENDER
  -------------------------------------------------------------------------- */

  return (
    <Shell
      title="Projects"
      subtitle="Manage every project from briefing to final handover through one connected workspace."
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={loading}
            className="h-10 px-3 rounded-lg border border-[#D8E0DA] text-[12.5px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#F4F6F7] disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />

            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => nav("/projects/new")}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 hover:opacity-90"
          >
            <Plus size={14} />
            Create Project
          </button>
        </div>
      }
    >
      {/* =====================================================================
          SUMMARY
      ====================================================================== */}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="p-3">
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-[#8A9697]">
            Total Projects
          </div>

          <div className="text-[22px] font-bold text-[#333333] mt-1">
            {total}
          </div>

          <div className="text-[10.5px] text-[#6B7B7C]">in workspace</div>
        </Card>

        <Card className="p-3">
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-[#8A9697]">
            Active
          </div>

          <div className="text-[22px] font-bold text-[#1F453B] mt-1">
            {active}
          </div>

          <div className="text-[10.5px] text-[#6B7B7C]">currently running</div>
        </Card>

        <Card className="p-3">
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-[#8A9697]">
            On Hold
          </div>

          <div className="text-[22px] font-bold text-[#A34D27] mt-1">
            {onHold}
          </div>

          <div className="text-[10.5px] text-[#6B7B7C]">require attention</div>
        </Card>

        <Card className="p-3">
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-[#8A9697]">
            Completed
          </div>

          <div className="text-[22px] font-bold text-[#2F6B3F] mt-1">
            {completed}
          </div>

          <div className="text-[10.5px] text-[#6B7B7C]">handed over</div>
        </Card>

        <Card className="p-3">
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-[#8A9697]">
            Archived
          </div>

          <div className="text-[22px] font-bold text-[#6B7B7C] mt-1">
            {archived}
          </div>

          <div className="text-[10.5px] text-[#6B7B7C]">archived projects</div>
        </Card>
      </div>

      {/* =====================================================================
          TABS
      ====================================================================== */}

      <div className="flex items-center gap-1 border-b border-[#D8E0DA]">
        {[
          ["all", "Projects"],
          ["active", "Active"],
          ["completed", "Completed"],
          ["on_hold", "On Hold"],
          ["archived", "Archived"],
          ["documents", "Documents"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={[
              "px-3 py-2 rounded-t-lg text-[12px] font-semibold transition-colors",
              tab === key
                ? "bg-[#EAF0EB] text-[#1F453B]"
                : "text-[#6B7B7C] hover:bg-[#F4F6F7]",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* =====================================================================
          DOCUMENTS
      ====================================================================== */}

      {tab === "documents" ? (
        <DocumentsView />
      ) : (
        <>
          {/* ================================================================
              FILTER / VIEW BAR
          ================================================================ */}

          <Card className="p-3">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
              {/* SEARCH */}

              <div className="relative flex-1 max-w-xl">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9697]"
                />

                <input
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder="Search project, client, phase, document…"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#D8E0DA] bg-white text-[12.5px] outline-none focus:border-[#1F453B] focus:ring-2 focus:ring-[rgba(31,69,59,0.08)]"
                />
              </div>

              {/* STATUS */}

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 px-3 rounded-lg border border-[#D8E0DA] bg-white text-[12px] font-semibold text-[#333333] outline-none"
              >
                <option value="all">All Statuses</option>

                <option value="active">Active</option>

                <option value="on_hold">On Hold</option>

                <option value="completed">Completed</option>

                <option value="archived">Archived</option>
              </select>

              {/* VIEW TOGGLE */}

              <div className="lg:ml-auto flex items-center border border-[#D8E0DA] rounded-lg p-1 bg-[#FAFBFA]">
                <button
                  type="button"
                  onClick={() => setView("timeline")}
                  className={[
                    "h-8 px-3 rounded-md text-[11.5px] font-semibold inline-flex items-center gap-1.5",
                    view === "timeline"
                      ? "bg-[#1F453B] text-white"
                      : "text-[#6B7B7C] hover:bg-[#EAEEF0]",
                  ].join(" ")}
                >
                  <GitBranch size={13} />
                  Timeline
                </button>

                <button
                  type="button"
                  onClick={() => setView("table")}
                  className={[
                    "h-8 px-3 rounded-md text-[11.5px] font-semibold inline-flex items-center gap-1.5",
                    view === "table"
                      ? "bg-[#1F453B] text-white"
                      : "text-[#6B7B7C] hover:bg-[#EAEEF0]",
                  ].join(" ")}
                >
                  <List size={13} />
                  Table
                </button>
              </div>
            </div>
          </Card>

          {/* ================================================================
              RESULT INFO
          ================================================================ */}

          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-[#333333]">
                {tab === "all"
                  ? "Project Workspace"
                  : `${STATUS_LABEL[tab] || tab} Projects`}
              </div>

              <div className="text-[11px] text-[#8A9697] mt-0.5">
                {filteredProjects.length} project
                {filteredProjects.length !== 1 ? "s" : ""} in view
              </div>
            </div>

            {view === "timeline" && (
              <div className="hidden sm:flex items-center gap-3 text-[10.5px] text-[#8A9697]">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-[#2F6B3F]" />
                  Completed
                </span>

                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1F453B]" />
                  Current
                </span>

                <span className="inline-flex items-center gap-1">
                  <Circle size={12} className="text-[#B5C4B6]" />
                  Upcoming
                </span>
              </div>
            )}
          </div>

          {/* ================================================================
              LOADING
          ================================================================ */}

          {(loading || (view === "timeline" && phaseTreeLoading)) && (
            <Card>
              <div className="py-12 text-center text-[12px] text-[#8A9697]">
                Loading project workspace…
              </div>
            </Card>
          )}

          {/* ================================================================
              EMPTY
          ================================================================ */}

          {!loading && !filteredProjects.length && (
            <Card>
              <div className="py-12 text-center">
                <FolderOpen size={38} className="mx-auto mb-3 text-[#B5C4B6]" />

                <div className="text-[14px] font-semibold text-[#333333]">
                  No projects found
                </div>

                <div className="text-[11.5px] text-[#8A9697] mt-1">
                  {q ? "Try a different search." : "No projects are available."}
                </div>

                {q && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="mt-4 h-8 px-3 rounded-lg bg-[#1F453B] text-white text-[11.5px] font-semibold"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* ================================================================
              TIMELINE
          ================================================================ */}

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

          {/* ================================================================
              TABLE
          ================================================================ */}

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
    </Shell>
  );
}
