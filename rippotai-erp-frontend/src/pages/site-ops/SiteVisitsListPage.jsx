import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Calendar, Filter, RefreshCw } from "lucide-react";
import {
  useGetSiteVisitsQuery,
  useGenerateProjectVisitsMutation,
} from "../../api/site-ops/site-ops.api";
import { useGetProjectsQuery } from "../../api/projects/project.api";
import { PageHeader } from "@/components/site-ops/PageHeader";
import { StatusBadge } from "@/components/site-ops/StatusBadge";
import { Button } from "@/components/ui/button";
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
import { ARCHITECT_VISIT_STATUS_OPTIONS } from "../../hooks/site-ops.types";
import { toast } from "sonner";

function normalizeList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.data || data.items || [];
}

export default function SiteVisitsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("project_id") || undefined;
  const status = searchParams.get("status") || undefined;
  const [pendingHold, setPendingHold] = useState(
    searchParams.get("pending_hold") === "true",
  );

  const { data, isLoading, isFetching, refetch } = useGetSiteVisitsQuery({
    project_id: projectId,
    status,
    pending_hold: pendingHold || undefined,
    limit: 100,
  });

  const { data: projectsData } = useGetProjectsQuery({});
  const projects = useMemo(() => {
    if (!projectsData) return [];
    if (Array.isArray(projectsData)) return projectsData;
    return projectsData.data || projectsData.items || [];
  }, [projectsData]);

  const [generateVisits, { isLoading: generating }] =
    useGenerateProjectVisitsMutation();

  const visits = normalizeList(data);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const handleGenerate = async () => {
    if (!projectId) {
      toast.error("Select a project first");
      return;
    }
    try {
      await generateVisits({ project_id: projectId }).unwrap();
      toast.success("Visits generated for project");
      refetch();
    } catch (e) {
      toast.error(e?.data?.message || "Failed to generate visits");
    }
  };

  return (
    <div className="bg-page min-h-full p-6">
      <PageHeader
        title="Architect Site Visits"
        description="Schedule, track and complete mandatory / hold-point site visits."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="bc-btn-secondary"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {projectId && (
              <Button
                variant="outline"
                size="sm"
                className="bc-btn-secondary"
                onClick={handleGenerate}
                disabled={generating}
              >
                Generate standard visits
              </Button>
            )}
            <Button asChild className="bc-btn-primary">
              <Link to="/site-ops/visits/new">
                <Plus className="h-4 w-4 mr-1.5" />
                New visit
              </Link>
            </Button>
          </>
        }
      />

      <div className="bc-card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-[var(--muted)]" />
          <Select
            value={projectId || "all"}
            onValueChange={(v) =>
              setFilter("project_id", v === "all" ? undefined : v)
            }
          >
            <SelectTrigger className="bc-input w-[220px] h-10">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name || p.code || p.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status || "all"}
            onValueChange={(v) =>
              setFilter("status", v === "all" ? undefined : v)
            }
          >
            <SelectTrigger className="bc-input w-[180px] h-10">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ARCHITECT_VISIT_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 text-sm text-[var(--ink-green)] cursor-pointer">
            <input
              type="checkbox"
              checked={pendingHold}
              onChange={(e) => {
                setPendingHold(e.target.checked);
                setFilter(
                  "pending_hold",
                  e.target.checked ? "true" : undefined,
                );
              }}
              className="rounded border-[var(--stroke)]"
            />
            Pending hold points only
          </label>
        </div>
      </div>

      <div className="table-container bc-card">
        <div className="bc-table-scroll">
          <Table className="bc-table">
            <TableHeader>
              <TableRow className="bg-[var(--mist-soft)]">
                <TableHead>Stage</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Visited</TableHead>
                <TableHead className="actions">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-[var(--muted)]"
                  >
                    Loading visits…
                  </TableCell>
                </TableRow>
              ) : visits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="bc-empty-state">
                      <Calendar className="h-10 w-10 mx-auto mb-3 text-[var(--sage)]" />
                      <p className="text-[var(--muted)]">
                        No visits found. Create one or generate the standard
                        schedule for a project.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visits.map((v) => (
                  <TableRow
                    key={v.id}
                    className="hover:bg-[var(--mist-soft)]/60"
                  >
                    <TableCell className="font-medium text-[var(--ink-green)]">
                      {v.stage?.name || v.stage_id}
                    </TableCell>
                    <TableCell className="truncate-cell max-w-[180px]">
                      {v.project?.name || v.project_id}
                    </TableCell>
                    <TableCell>
                      {v.stage?.visit_type ? (
                        <StatusBadge status={v.stage.visit_type} />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} />
                    </TableCell>
                    <TableCell className="nowrap">
                      {v.scheduled_date
                        ? new Date(v.scheduled_date).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="nowrap">
                      {v.visited_date
                        ? new Date(v.visited_date).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="actions">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/site-ops/visits/${v.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
