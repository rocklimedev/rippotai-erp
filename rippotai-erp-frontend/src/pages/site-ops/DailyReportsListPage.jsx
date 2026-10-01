import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ClipboardList, RefreshCw } from "lucide-react";

import { useGetDailySiteReportsByProjectQuery } from "../../api/site-ops/site-ops.api";

import { useGetProjectsQuery } from "../../api/projects/project.api";

import { PageHeader } from "@/components/site-ops/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DailyReportsListPage() {
  const [projectId, setProjectId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [queryId, setQueryId] = useState(null);

  const { data: projectsResponse, isLoading: projectsLoading } =
    useGetProjectsQuery({
      includeArchived: false,
    });

  const projects = Array.isArray(projectsResponse)
    ? projectsResponse
    : projectsResponse?.data || [];

  const {
    data: reports = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetDailySiteReportsByProjectQuery(
    {
      projectId: queryId,
      from: from || undefined,
      to: to || undefined,
    },
    {
      skip: !queryId,
    },
  );

  const load = () => {
    if (!projectId) return;
    setQueryId(Number(projectId));
  };

  return (
    <div className="bg-page min-h-full p-6">
      <PageHeader
        title="Daily Site Reports"
        description="Weather, work completed, manpower and issues for each day."
        actions={
          <>
            {queryId && (
              <Button
                variant="outline"
                size="sm"
                className="bc-btn-secondary"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1.5 ${
                    isFetching ? "animate-spin" : ""
                  }`}
                />
                Refresh{" "}
              </Button>
            )}

            <Button asChild className="bc-btn-primary">
              <Link to="/site-ops/daily-reports/new">
                <Plus className="h-4 w-4 mr-1.5" />
                New report
              </Link>
            </Button>
          </>
        }
      />

      <div className="bc-card p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Project */}
          <div className="space-y-1">
            <label className="text-xs text-[var(--muted)]">Project</label>

            <select
              className="bc-input h-10 w-[280px] rounded-md border px-3 text-sm"
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setQueryId(null);
              }}
              disabled={projectsLoading}
            >
              <option value="">
                {projectsLoading ? "Loading projects..." : "Select project"}
              </option>

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name ||
                    project.projectName ||
                    `Project #${project.id}`}
                  {project.code ? ` (${project.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* From */}
          <div className="space-y-1">
            <label className="text-xs text-[var(--muted)]">From</label>

            <Input
              type="date"
              className="bc-input w-[150px] h-10"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          {/* To */}
          <div className="space-y-1">
            <label className="text-xs text-[var(--muted)]">To</label>

            <Input
              type="date"
              className="bc-input w-[150px] h-10"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <Button
            className="bc-btn-primary h-10"
            onClick={load}
            disabled={!projectId}
          >
            Load reports
          </Button>
        </div>
      </div>

      <div className="table-container bc-card">
        <div className="bc-table-scroll">
          <Table className="bc-table">
            <TableHeader>
              <TableRow className="bg-[var(--mist-soft)]">
                <TableHead>Date</TableHead>
                <TableHead>Weather</TableHead>
                <TableHead>Work completed</TableHead>
                <TableHead>Reported by</TableHead>
                <TableHead>Shared</TableHead>
                <TableHead className="actions">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!queryId ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="bc-empty-state">
                      <ClipboardList className="h-10 w-10 mx-auto mb-3 text-[var(--sage)]" />

                      <p className="text-[var(--muted)]">
                        Select a project to load daily reports.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-[var(--muted)]"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-[var(--muted)]"
                  >
                    No reports found.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((r) => (
                  <TableRow
                    key={r.id}
                    className="hover:bg-[var(--mist-soft)]/60"
                  >
                    <TableCell className="nowrap font-medium">
                      {r.reportDate
                        ? new Date(r.reportDate).toLocaleDateString()
                        : "—"}
                    </TableCell>

                    <TableCell>{r.weatherCondition || "—"}</TableCell>

                    <TableCell className="max-w-[280px]">
                      <span className="line-clamp-2">
                        {r.workCompleted || "—"}
                      </span>
                    </TableCell>

                    <TableCell>{r.reportedBy || "—"}</TableCell>

                    <TableCell>
                      {r.sharedAt
                        ? new Date(r.sharedAt).toLocaleDateString()
                        : "—"}
                    </TableCell>

                    <TableCell className="actions">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/site-ops/daily-reports/${r.id}`}>View</Link>
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
