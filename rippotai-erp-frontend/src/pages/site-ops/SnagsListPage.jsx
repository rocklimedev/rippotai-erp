import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, AlertTriangle, Filter, RefreshCw } from "lucide-react";
import { useGetSnagsQuery } from "../../api/site-ops/site-ops.api";
import { useGetProjectsQuery } from "../../api/projects/project.api";
import { PageHeader } from "@/components/site-ops/PageHeader";
import { StatusBadge } from "@/components/site-ops/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const STATUS_OPTIONS = ["Open", "In Progress", "Rectified", "Closed"];

function normalizeListdata(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.data || data.items || [];
}

export default function SnagsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("project_id") || undefined;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;

  const { data, isLoading, isFetching, refetch } = useGetSnagsQuery({
    project_id: projectId,
    status,
    search,
    limit: 100,
  });

  const { data: projectsData } = useGetProjectsQuery({});
  const projects = useMemo(() => {
    if (!projectsData) return [];
    if (Array.isArray(projectsData)) return projectsData;
    return projectsData.data || projectsData.items || [];
  }, [projectsData]);

  const snags = normalizeListdata(data);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="bg-page min-h-full p-6">
      <PageHeader
        title="Snag List"
        description="Track site defects and rectification progress."
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
            <Button asChild className="bc-btn-primary">
              <Link to="/site-ops/snags/new">
                <Plus className="h-4 w-4 mr-1.5" />
                New snag
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
            <SelectTrigger className="bc-input w-[160px] h-10">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            className="bc-input w-[200px] h-10"
            placeholder="Search observations…"
            defaultValue={search || ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setFilter("search", e.target.value || undefined);
              }
            }}
          />
        </div>
      </div>

      <div className="table-container bc-card">
        <div className="bc-table-scroll">
          <Table className="bc-table">
            <TableHeader>
              <TableRow className="bg-[var(--mist-soft)]">
                <TableHead>Observation</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="actions">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-[var(--muted)]"
                  >
                    Loading snags…
                  </TableCell>
                </TableRow>
              ) : snags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="bc-empty-state">
                      <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-[var(--sage)]" />
                      <p className="text-[var(--muted)]">No snags found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                snags.map((s) => (
                  <TableRow
                    key={s.id}
                    className="hover:bg-[var(--mist-soft)]/60"
                  >
                    <TableCell className="max-w-[280px]">
                      <span className="line-clamp-2 font-medium text-[var(--ink-green)]">
                        {s.observation}
                      </span>
                    </TableCell>
                    <TableCell className="nowrap">
                      {[s.floor, s.room].filter(Boolean).join(" · ") || "—"}
                    </TableCell>
                    <TableCell>{s.category || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="truncate-cell max-w-[140px]">
                      {s.project?.name || s.project_id}
                    </TableCell>
                    <TableCell className="actions">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/site-ops/snags/${s.id}`}>View</Link>
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
