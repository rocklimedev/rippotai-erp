import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Eye,
  Edit3,
  FileText,
  MapPin,
  CalendarDays,
  RefreshCw,
  Trash2,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

import { Shell } from "../../hooks/shared";
import {
  useGetProjectBriefsQuery,
  useUpdateProjectBriefStatusMutation,
  useDeleteProjectBriefMutation,
} from "../../api/documents/brief.api";

export default function ProjectBriefList() {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // =========================================================
  // PROJECT FILTER
  // =========================================================

  const projectFilter =
    new URLSearchParams(window.location.search).get("projectId") ||
    new URLSearchParams(window.location.search).get("project_id") ||
    "";

  // =========================================================
  // API
  // =========================================================

  const {
    data: rows = [],
    isFetching,
    isLoading,
  } = useGetProjectBriefsQuery(projectFilter || undefined);

  const [updateProjectBriefStatus] = useUpdateProjectBriefStatusMutation();
  const [deleteProjectBrief] = useDeleteProjectBriefMutation();

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((brief) => {
      const searchable = [
        brief.project?.name,
        brief.projectName,
        brief.siteAddress,
        brief.propertyType,
        brief.relationshipToClient,
        brief.referredBySource,
        brief.status,
        brief.budgetCurrency,
        brief.fundingStage,
        brief.siteType,
        brief.ownershipStatus,
        brief.version,
      ]
        .filter(
          (value) => value !== null && value !== undefined && value !== "",
        )
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [rows, q]);

  // =========================================================
  // HELPERS
  // =========================================================

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getProjectName = (brief) => {
    return (
      brief.project?.name ||
      brief.projectName ||
      brief.siteAddress ||
      "Untitled Project"
    );
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "SIGNED_OFF":
      case "APPROVED":
        return "default";
      case "SUBMITTED":
        return "outline";
      case "IN_REVIEW":
        return "secondary";
      case "REJECTED":
        return "destructive";
      case "DRAFT":
      default:
        return "secondary";
    }
  };

  const formatStatus = (status) => {
    return (status || "DRAFT")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // =========================================================
  // STATUS OPTIONS
  // =========================================================

  const STATUS_OPTIONS = [
    { value: "DRAFT", label: "Draft" },
    { value: "IN_REVIEW", label: "In Review" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "APPROVED", label: "Approved" },
    { value: "SIGNED_OFF", label: "Signed Off" },
    { value: "REJECTED", label: "Rejected" },
  ];

  // =========================================================
  // UPDATE STATUS
  // =========================================================

  const handleStatusChange = async (brief, status) => {
    if (!brief?.id) return;
    if ((brief.status || "DRAFT") === status) return;

    try {
      setUpdatingStatusId(brief.id);

      await updateProjectBriefStatus({
        id: brief.id,
        status,
      }).unwrap();

      toast.success(`Project brief status updated to ${formatStatus(status)}`);
    } catch (error) {
      console.error("Failed to update project brief status:", error);
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to update project brief status",
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (brief) => {
    if (!brief?.id) return;

    const projectName = getProjectName(brief);

    const confirmed = window.confirm(
      `Are you sure you want to delete "${projectName}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(brief.id);
      await deleteProjectBrief(brief.id).unwrap();
      toast.success("Project brief deleted successfully");
    } catch (error) {
      console.error("Failed to delete project brief:", error);
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to delete project brief",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Shell
      title="Project Briefs"
      subtitle={`${rows.length} brief${
        rows.length !== 1 ? "s" : ""
      } across the workspace`}
      action={
        <Button
          onClick={() => nav("/crm/forms/project-brief")}
          data-testid="project-brief-new-btn"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Project Brief
        </Button>
      }
    >
      {/* FILTER BAR */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search project briefs…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />

        {projectFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => nav("/crm/brief/all")}
          >
            Clear project filter ×
          </Button>
        )}
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table data-testid="project-brief-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Brief Date</TableHead>
                  <TableHead className="w-[160px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* LOADING */}
                {isFetching && !rows.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading project briefs...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((brief) => {
                    const currentStatus = brief.status || "DRAFT";
                    const isUpdating = updatingStatusId === brief.id;
                    const isDeleting = deletingId === brief.id;

                    return (
                      <TableRow
                        key={brief.id}
                        onClick={() => nav(`/crm/brief/${brief.id}`)}
                        className="cursor-pointer"
                        data-testid={`project-brief-row-${brief.id}`}
                      >
                        {/* PROJECT */}
                        <TableCell>
                          <div className="flex min-w-[220px] items-start gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <div className="max-w-[280px] truncate font-semibold text-foreground">
                                {getProjectName(brief)}
                              </div>
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                {brief.propertyType ||
                                  brief.siteType ||
                                  "Project Brief"}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* VERSION */}
                        <TableCell>
                          <Badge variant="secondary">
                            v{brief.version ?? 1}
                          </Badge>
                        </TableCell>

                        {/* STATUS */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={currentStatus}
                            disabled={isUpdating}
                            onValueChange={(value) =>
                              handleStatusChange(brief, value)
                            }
                          >
                            <SelectTrigger
                              className="h-8 w-[130px] border-0"
                              data-testid={`project-brief-status-${brief.id}`}
                            >
                              <SelectValue>
                                <Badge
                                  variant={getStatusVariant(currentStatus)}
                                >
                                  {isUpdating ? (
                                    <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                                  ) : null}
                                  {formatStatus(currentStatus)}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* SITE */}
                        <TableCell>
                          <div className="flex max-w-[280px] items-start gap-1.5">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate text-muted-foreground">
                              {brief.siteAddress || "No site address"}
                            </span>
                          </div>
                        </TableCell>

                        {/* DATE */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(
                              brief.briefDate ||
                                brief.updatedAt ||
                                brief.createdAt,
                            )}
                          </div>
                        </TableCell>

                        {/* ACTIONS */}
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => nav(`/crm/brief/${brief.id}`)}
                              title="View"
                              data-testid={`project-brief-view-${brief.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => nav(`/crm/brief/${brief.id}/edit`)}
                              title="Edit"
                              data-testid={`project-brief-edit-${brief.id}`}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(brief)}
                              disabled={isDeleting}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title="Delete"
                              data-testid={`project-brief-delete-${brief.id}`}
                            >
                              {isDeleting ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}

                {/* EMPTY STATE */}
                {!isFetching && !filteredRows.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-sm font-semibold text-foreground">
                          {q
                            ? "No matching project briefs"
                            : "No project briefs yet"}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {q
                            ? "Try a different search term."
                            : "Create the first brief from a project."}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}
