import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Edit3,
  Eye,
  Folder,
  FolderOpen,
  Package,
  Plus,
  RefreshCw,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

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

import { Shell } from "../../hooks/shared";

import { useGetMaterialRequirementsByProjectQuery } from "../../api/procuerment/material-requirement.api";

import { useGetProjectsQuery } from "../../api/projects/project.api";

/* ============================================================
   BRAND
============================================================ */

const BRAND = "bg-[#1F453B] hover:bg-[#17372f] text-white";
const BRAND_TEXT = "text-[#1F453B]";
const BRAND_SOFT = "bg-[#E7F1EA] text-[#1F453B]";

const ALL_PROJECTS = "__all__";

/* ============================================================
   STATUS
============================================================ */

const COMPLETED_STATUSES = ["COMPLETED", "CLOSED"];

const ACTIVE_READY_STATUSES = ["READY"];

const IN_PROGRESS_STATUSES = ["IN_PROGRESS"];

const CANCELLED_STATUSES = ["CANCELLED", "REJECTED"];

/* ============================================================
   HELPERS
============================================================ */

const getProjectId = (project) =>
  project?.id || project?.projectId || project?.project_id || "";

const getProjectName = (project, fallback = "Project") => {
  if (!project) return fallback;

  return (
    project.name ||
    project.projectName ||
    project.project_name ||
    project.title ||
    project.code ||
    project.project_code ||
    project.id ||
    fallback
  );
};

const getRequirementId = (requirement) =>
  requirement?.id ||
  requirement?.materialRequirementId ||
  requirement?.material_requirement_id ||
  "";

const getRequirementProjectId = (requirement) =>
  requirement?.projectId ||
  requirement?.project_id ||
  requirement?.project?.id ||
  "";

const getItemName = (requirement) =>
  requirement?.itemName ||
  requirement?.item_name ||
  requirement?.material?.name ||
  requirement?.material?.materialName ||
  requirement?.material?.material_name ||
  "Untitled Material";

const getCategory = (requirement) =>
  requirement?.category || requirement?.material?.category || "—";

const getSelection = (requirement) =>
  requirement?.selection ||
  requirement?.description ||
  requirement?.material?.description ||
  "—";

const getStyle = (requirement) =>
  requirement?.style || requirement?.material?.style || "";

const getFunctionalNeeds = (requirement) =>
  requirement?.functionalNeeds || requirement?.functional_needs || "";

const getMaterialCode = (requirement) =>
  requirement?.material?.materialCode ||
  requirement?.material?.material_code ||
  requirement?.materialCode ||
  requirement?.material_code ||
  "";

const getMaterialName = (requirement) =>
  requirement?.material?.name ||
  requirement?.material?.materialName ||
  requirement?.material?.material_name ||
  "";

const getStatus = (requirement) =>
  String(requirement?.status || "DRAFT").toUpperCase();

const getRequirementDate = (requirement) =>
  requirement?.requirementDate || requirement?.requirement_date || "";

const getUpdatedDate = (requirement) =>
  requirement?.updatedAt ||
  requirement?.updated_at ||
  requirement?.createdAt ||
  requirement?.created_at ||
  "";

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

const normalizeArrayResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.requirements)) {
    return response.requirements;
  }

  if (Array.isArray(response?.materialRequirements)) {
    return response.materialRequirements;
  }

  return [];
};

const isCompletedStatus = (status) =>
  COMPLETED_STATUSES.includes(String(status).toUpperCase());

const getStatusClasses = (status) => {
  switch (String(status).toUpperCase()) {
    case "READY":
      return "bg-[#E7F1EA] text-[#1F453B]";

    case "IN_PROGRESS":
      return "bg-[#FFF3E8] text-[#A34D27]";

    case "COMPLETED":
      return "bg-[#E7F1EA] text-[#2F6B3F]";

    case "CANCELLED":
      return "bg-[#FCECEC] text-[#A33A3A]";

    case "REJECTED":
      return "bg-[#FCECEC] text-[#A33A3A]";

    case "CLOSED":
      return "bg-[#E7F1EA] text-[#2F6B3F]";

    case "DRAFT":
    default:
      return "bg-muted text-muted-foreground";
  }
};

/* ============================================================
   STAT PILL
============================================================ */

function StatPill({ label, value, tone }) {
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
    </div>
  );
}

/* ============================================================
   PROGRESS STAT
============================================================ */

function ProgressStat({ percentage }) {
  return (
    <div className="w-[100px]">
      <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
        <span>Completion</span>
        <span>{percentage}%</span>
      </div>

      <Progress
        value={Math.min(Math.max(percentage, 0), 100)}
        className="h-1.5"
      />
    </div>
  );
}

/* ============================================================
   REQUIREMENT ROW
============================================================ */

function MaterialRequirementRow({ requirement, onView, onEdit }) {
  const itemName = getItemName(requirement);
  const category = getCategory(requirement);
  const selection = getSelection(requirement);
  const style = getStyle(requirement);
  const status = getStatus(requirement);
  const requirementDate = formatDate(getRequirementDate(requirement));
  const updated = formatDate(getUpdatedDate(requirement));
  const materialCode = getMaterialCode(requirement);

  return (
    <div className="border-t px-4 py-3 transition-colors hover:bg-muted/40">
      <div className="flex items-center gap-3">
        {/* ICON */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            BRAND_SOFT,
          )}
        >
          <Package className={cn("h-[16px] w-[16px]", BRAND_TEXT)} />
        </div>

        {/* MAIN */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] font-semibold">{itemName}</span>

            <Badge
              className={cn(
                "h-5 rounded-full px-2 text-[10px] font-semibold hover:bg-transparent",
                getStatusClasses(status),
              )}
            >
              {status.replaceAll("_", " ")}
            </Badge>

            {materialCode && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {materialCode}
              </span>
            )}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
            <span>
              Category:{" "}
              <span className="font-medium text-foreground/80">{category}</span>
            </span>

            {style && (
              <span>
                Style:{" "}
                <span className="font-medium text-foreground/80">{style}</span>
              </span>
            )}

            <span>
              Required by:{" "}
              <span className="font-medium text-foreground/80">
                {requirementDate}
              </span>
            </span>

            <span>Updated: {updated}</span>
          </div>

          <div className="mt-1 truncate text-[11.5px] text-muted-foreground">
            {selection}
          </div>
        </div>

        {/* REQUIREMENT DATE */}
        <div className="hidden min-w-[105px] shrink-0 text-right sm:block">
          <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            Required by
          </div>

          <div className="mt-0.5 text-xs font-semibold">{requirementDate}</div>
        </div>

        {/* ACTIONS */}
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => onView(requirement)}
            title="View requirement"
          >
            <Eye className="h-[13px] w-[13px]" />

            <span className="hidden lg:inline">View</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => onEdit(requirement)}
            title="Edit requirement"
          >
            <Edit3 className="h-[13px] w-[13px]" />

            <span className="hidden lg:inline">Edit</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PROJECT CARD
============================================================ */

function MaterialProjectCard({
  project,
  requirements,
  collapsed,
  onToggle,
  onView,
  onEdit,
  onViewProject,
}) {
  const projectId = getProjectId(project);
  const projectName = getProjectName(project, projectId || "Project");

  const total = requirements.length;

  const completed = requirements.filter((item) =>
    isCompletedStatus(getStatus(item)),
  ).length;

  const pending = Math.max(total - completed, 0);

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 100;

  return (
    <Collapsible open={!collapsed} onOpenChange={onToggle} asChild>
      <Card className="overflow-hidden py-0">
        {/* PROJECT HEADER */}
        <div className="bg-background transition-colors hover:bg-muted/20">
          <div className="flex items-center gap-3 px-4 py-3">
            {/* COLLAPSE */}
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                {/* ARROW */}
                <div className={cn("shrink-0", BRAND_TEXT)}>
                  {collapsed ? (
                    <ChevronRight className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>

                {/* FOLDER */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F1EA]">
                  {collapsed ? (
                    <Folder className={cn("h-[18px] w-[18px]", BRAND_TEXT)} />
                  ) : (
                    <FolderOpen
                      className={cn("h-[18px] w-[18px]", BRAND_TEXT)}
                    />
                  )}
                </div>

                {/* PROJECT INFO */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[15px] font-bold">
                      {projectName}
                    </span>

                    {project?.code && (
                      <span className="text-[10.5px] text-muted-foreground">
                        {project.code}
                      </span>
                    )}
                  </div>

                  <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                    {projectId}
                  </div>
                </div>

                {/* DESKTOP STATS */}
                <div className="hidden shrink-0 items-center gap-5 md:flex">
                  <StatPill label="requirements" value={total} />

                  <StatPill
                    label="pending"
                    value={pending}
                    tone={pending > 0 ? "warning" : "default"}
                  />

                  <ProgressStat percentage={percentage} />
                </div>
              </button>
            </CollapsibleTrigger>

            {/* VIEW ALL */}
            {projectId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hidden shrink-0 gap-1.5 border-[#1F453B]/20 text-[#1F453B] hover:bg-[#E7F1EA] hover:text-[#1F453B] sm:flex"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onViewProject?.(project);
                }}
              >
                <Eye className="h-4 w-4" />
                <span>View All</span>
              </Button>
            )}

            {/* MOBILE VIEW ALL */}
            {projectId && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-[#1F453B] hover:bg-[#E7F1EA] hover:text-[#1F453B] sm:hidden"
                title="View all material requirements"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onViewProject?.(project);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* MOBILE STATS */}
          <div className="ml-[88px] mt-0 flex items-center gap-4 px-4 pb-3 md:hidden">
            <StatPill label="requirements" value={total} />

            <StatPill
              label="pending"
              value={pending}
              tone={pending > 0 ? "warning" : "default"}
            />

            <ProgressStat percentage={percentage} />
          </div>
        </div>

        {/* REQUIREMENTS */}
        <CollapsibleContent>
          {requirements.length ? (
            requirements.map((requirement) => (
              <MaterialRequirementRow
                key={
                  getRequirementId(requirement) ||
                  `${projectId}-${getItemName(requirement)}`
                }
                requirement={requirement}
                onView={onView}
                onEdit={onEdit}
              />
            ))
          ) : (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">
              No material requirements have been added to this project.
            </div>
          )}

          {/* FOOTER */}
          <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2.5 text-[11px]">
            <span className="text-muted-foreground">
              {total} material requirement
              {total !== 1 ? "s" : ""}
            </span>

            <span
              className={cn(
                "font-semibold",
                pending > 0 ? "text-[#A34D27]" : "text-[#2F6B3F]",
              )}
            >
              {pending > 0
                ? `${pending} pending`
                : "All requirements completed"}
            </span>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({ label, value, sub, valueClassName, className }) {
  return (
    <Card className={cn("p-3", className)}>
      <div className="text-[11px] text-muted-foreground">{label}</div>

      <div className={cn("mt-1 text-xl font-bold", valueClassName)}>
        {value}
      </div>

      <div className="text-[10.5px] text-muted-foreground">{sub}</div>
    </Card>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default function MaterialRequirementList() {
  const nav = useNavigate();

  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [q, setQ] = useState("");

  const [collapsedProjects, setCollapsedProjects] = useState({});

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

    return (
      projectsResponse?.data ||
      projectsResponse?.projects ||
      projectsResponse?.items ||
      []
    );
  }, [projectsResponse]);

  /* ==========================================================
     MATERIAL REQUIREMENTS
  ========================================================== */

  const {
    data: requirementsResponse,
    isLoading: requirementsLoading,
    isFetching: requirementsFetching,
    isError: requirementsError,
    error: requirementsErrorData,
    refetch,
  } = useGetMaterialRequirementsByProjectQuery(selectedProjectId || undefined);

  /* ==========================================================
     NORMALIZE
  ========================================================== */

  const requirements = useMemo(() => {
    return normalizeArrayResponse(requirementsResponse);
  }, [requirementsResponse]);

  /* ==========================================================
     PROJECT LOOKUP
  ========================================================== */

  const projectMap = useMemo(() => {
    const map = new Map();

    projects.forEach((project) => {
      const id = getProjectId(project);

      if (id) {
        map.set(String(id), project);
      }
    });

    return map;
  }, [projects]);

  /* ==========================================================
     GROUP REQUIREMENTS
  ========================================================== */

  const requirementsByProject = useMemo(() => {
    const grouped = new Map();

    requirements.forEach((requirement) => {
      const projectId = String(getRequirementProjectId(requirement) || "");

      if (!projectId) {
        return;
      }

      if (!grouped.has(projectId)) {
        grouped.set(projectId, []);
      }

      grouped.get(projectId).push(requirement);
    });

    return grouped;
  }, [requirements]);

  /* ==========================================================
     SEARCH
  ========================================================== */

  const searchTerm = q.trim().toLowerCase();

  const filteredProjectGroups = useMemo(() => {
    let result = [];

    /* --------------------------------------------------------
       SELECTED PROJECT
    -------------------------------------------------------- */

    if (selectedProjectId) {
      const projectId = String(selectedProjectId);

      const project = projectMap.get(projectId) || {
        id: selectedProjectId,
        name: "Selected Project",
      };

      const projectRequirements = requirementsByProject.get(projectId) || [];

      result = [
        {
          project,
          requirements: projectRequirements,
        },
      ];
    } else {
      /* ------------------------------------------------------
         ALL PROJECTS
      ------------------------------------------------------ */

      result = projects
        .map((project) => {
          const projectId = String(getProjectId(project));

          return {
            project,
            requirements: requirementsByProject.get(projectId) || [],
          };
        })
        .filter((group) => group.requirements.length > 0);

      /* ------------------------------------------------------
         ORPHAN PROJECT REQUIREMENTS
      ------------------------------------------------------ */

      requirementsByProject.forEach((projectRequirements, projectId) => {
        const exists = result.some(
          (group) => String(getProjectId(group.project)) === String(projectId),
        );

        if (!exists) {
          result.push({
            project: {
              id: projectId,
              name: "Unknown Project",
            },
            requirements: projectRequirements,
          });
        }
      });
    }

    /* --------------------------------------------------------
       SEARCH
    -------------------------------------------------------- */

    if (searchTerm) {
      result = result
        .map((group) => {
          const projectName = getProjectName(group.project, "").toLowerCase();

          const projectCode = String(
            group.project?.code || group.project?.project_code || "",
          ).toLowerCase();

          const projectId = String(getProjectId(group.project)).toLowerCase();

          const projectMatches =
            projectName.includes(searchTerm) ||
            projectCode.includes(searchTerm) ||
            projectId.includes(searchTerm);

          const filteredRequirements = group.requirements.filter(
            (requirement) => {
              const values = [
                getItemName(requirement),
                getCategory(requirement),
                getSelection(requirement),
                getStyle(requirement),
                getFunctionalNeeds(requirement),
                getStatus(requirement),
                getMaterialCode(requirement),
                getMaterialName(requirement),
                getRequirementDate(requirement),
              ];

              return values.some((value) =>
                String(value || "")
                  .toLowerCase()
                  .includes(searchTerm),
              );
            },
          );

          if (projectMatches) {
            return {
              ...group,
              requirements: group.requirements,
            };
          }

          if (filteredRequirements.length) {
            return {
              ...group,
              requirements: filteredRequirements,
            };
          }

          return null;
        })
        .filter(Boolean);
    }

    /* --------------------------------------------------------
       HIDE COMPLETED
    -------------------------------------------------------- */

    if (!showCompleted) {
      result = result
        .map((group) => ({
          ...group,
          requirements: group.requirements.filter(
            (requirement) => !isCompletedStatus(getStatus(requirement)),
          ),
        }))
        .filter((group) => group.requirements.length > 0);
    }

    return result;
  }, [
    projects,
    projectMap,
    requirements,
    requirementsByProject,
    selectedProjectId,
    searchTerm,
    showCompleted,
  ]);

  /* ==========================================================
     SUMMARY
  ========================================================== */

  const totalProjects = filteredProjectGroups.length;

  const totalRequirements = filteredProjectGroups.reduce(
    (total, group) => total + group.requirements.length,
    0,
  );

  const completedRequirements = filteredProjectGroups.reduce(
    (total, group) =>
      total +
      group.requirements.filter((requirement) =>
        isCompletedStatus(getStatus(requirement)),
      ).length,
    0,
  );

  const pendingRequirements = Math.max(
    totalRequirements - completedRequirements,
    0,
  );

  const draftRequirements = filteredProjectGroups.reduce(
    (total, group) =>
      total +
      group.requirements.filter(
        (requirement) => getStatus(requirement) === "DRAFT",
      ).length,
    0,
  );

  const readyRequirements = filteredProjectGroups.reduce(
    (total, group) =>
      total +
      group.requirements.filter((requirement) =>
        ACTIVE_READY_STATUSES.includes(getStatus(requirement)),
      ).length,
    0,
  );

  const inProgressRequirements = filteredProjectGroups.reduce(
    (total, group) =>
      total +
      group.requirements.filter((requirement) =>
        IN_PROGRESS_STATUSES.includes(getStatus(requirement)),
      ).length,
    0,
  );

  const completionPercentage =
    totalRequirements > 0
      ? Math.round((completedRequirements / totalRequirements) * 100)
      : 100;

  /* ==========================================================
     PROJECT CHANGE
  ========================================================== */

  const handleProjectChange = (value) => {
    setSelectedProjectId(value === ALL_PROJECTS ? "" : value);

    setQ("");

    setCollapsedProjects({});
  };

  /* ==========================================================
     CREATE
  ========================================================== */

  const handleCreate = () => {
    if (selectedProjectId) {
      nav(`/procurement/requirements/new?project_id=${selectedProjectId}`);

      return;
    }

    nav("/procurement/requirements/new");
  };

  /* ==========================================================
     VIEW
  ========================================================== */

  const handleView = (requirement) => {
    const id = getRequirementId(requirement);

    if (!id) {
      return;
    }

    nav(`/procurement/requirements/${id}`);
  };

  /* ==========================================================
     EDIT
  ========================================================== */

  const handleEdit = (requirement) => {
    const id = getRequirementId(requirement);

    if (!id) {
      return;
    }

    nav(`/procurement/requirements/${id}/edit`);
  };

  /* ==========================================================
     VIEW PROJECT
  ========================================================== */

  const handleViewProject = (project) => {
    const projectId = getProjectId(project);

    if (!projectId) {
      return;
    }

    nav(`/procurement/${projectId}/material-requirements`);
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

  const expandAll = () => {
    setCollapsedProjects({});
  };

  const collapseAll = () => {
    const next = {};

    filteredProjectGroups.forEach((group) => {
      const projectId = getProjectId(group.project);

      if (projectId) {
        next[String(projectId)] = true;
      }
    });

    setCollapsedProjects(next);
  };

  /* ==========================================================
     QUERY STATE
  ========================================================== */

  const isLoading = projectsLoading || requirementsLoading;

  const isFetching = requirementsFetching;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <Shell
      title="Material Requirements"
      subtitle={
        selectedProjectId
          ? "Material requirements for the selected project"
          : "All projects — material requirements and procurement planning"
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

          <Button type="button" className={BRAND} onClick={handleCreate}>
            <Plus className="h-[14px] w-[14px]" />
            New requirement
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* ====================================================
            PROJECT SELECTOR
        ==================================================== */}

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

                    if (!projectId) {
                      return null;
                    }

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
                ? "Showing material requirements for the selected project."
                : "Showing material requirements across all projects."}
            </p>
          </div>
        </Card>

        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <SummaryCard label="Projects" value={totalProjects} sub="in view" />

          <SummaryCard
            label="Requirements"
            value={totalRequirements}
            sub="total"
          />

          <SummaryCard
            label="Completed"
            value={completedRequirements}
            sub="completed"
          />

          <SummaryCard
            label="Pending"
            value={pendingRequirements}
            valueClassName="text-[#A34D27]"
            sub="requirements"
          />

          <SummaryCard
            label="Draft"
            value={draftRequirements}
            sub="requirements"
          />

          <SummaryCard
            label="Completion"
            value={`${completionPercentage}%`}
            valueClassName={BRAND_TEXT}
            sub={`${readyRequirements} ready • ${inProgressRequirements} in progress`}
          />
        </div>

        {/* ====================================================
            FILTERS
        ==================================================== */}

        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search project, material, category, selection..."
            value={q}
            onChange={(event) => setQ(event.target.value)}
            className="max-w-md"
          />

          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold">
            <Checkbox
              checked={showCompleted}
              onCheckedChange={(checked) => setShowCompleted(Boolean(checked))}
            />
            Show completed
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

        {/* ====================================================
            ERROR
        ==================================================== */}

        {requirementsError && (
          <Card>
            <CardContent className="py-10 text-center">
              <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-[#A34D27]" />

              <p className="text-sm font-semibold text-destructive">
                Failed to load material requirements
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {requirementsErrorData?.data?.message ||
                  requirementsErrorData?.data?.detail ||
                  requirementsErrorData?.error ||
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

        {/* ====================================================
            LOADING
        ==================================================== */}

        {isLoading && (
          <div className="space-y-3">
            <Card className="h-[76px] animate-pulse bg-muted/40" />
            <Card className="h-[76px] animate-pulse bg-muted/40" />
            <Card className="h-[76px] animate-pulse bg-muted/40" />
          </div>
        )}

        {/* ====================================================
            PROJECT TREE
        ==================================================== */}

        {!isLoading && !requirementsError && (
          <div className="space-y-3">
            {filteredProjectGroups.length ? (
              filteredProjectGroups.map((group) => {
                const projectId = getProjectId(group.project);

                const projectKey = String(projectId || "unknown");

                return (
                  <MaterialProjectCard
                    key={projectKey}
                    project={group.project}
                    requirements={group.requirements}
                    collapsed={Boolean(collapsedProjects[projectKey])}
                    onToggle={() => toggleProject(projectKey)}
                    onView={handleView}
                    onEdit={handleEdit}
                    onViewProject={handleViewProject}
                  />
                );
              })
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />

                  <p className="text-sm font-semibold">
                    No material requirements found
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {q
                      ? "Try a different search."
                      : selectedProjectId
                        ? "No material requirements have been added to this project."
                        : "No material requirements have been added to any project yet."}
                  </p>

                  <Button
                    type="button"
                    className={cn(BRAND, "mt-4")}
                    onClick={handleCreate}
                  >
                    <Plus className="h-[14px] w-[14px]" />
                    New requirement
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ====================================================
            FETCHING
        ==================================================== */}

        {isFetching && !isLoading && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Refreshing material requirements...
          </div>
        )}

        {/* ====================================================
            PENDING WARNING
        ==================================================== */}

        {!isLoading && !requirementsError && pendingRequirements > 0 && (
          <Card className="border-[rgba(176,77,38,0.18)] bg-[#FFF8F4]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#B04D26]" />

                <span className="text-sm font-semibold text-[#7D3C22]">
                  Material requirements need attention
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <p className="text-[11.5px] text-[#8A6B5D]">
                There are{" "}
                <span className="font-semibold">{pendingRequirements}</span>{" "}
                material requirement
                {pendingRequirements !== 1 ? "s" : ""} that are not yet
                completed.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Shell>
  );
}
