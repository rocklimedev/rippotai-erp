// Shared project picker for the Site Operations pages (RFIs, mock-ups, visits, QC).
// Site-ops rows key projects by UUID (projects.id); the selection lives in `?project=` so
// links from the Command Center / dashboards open the page already filtered.
import React, { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SelectInput } from "@/components/inos";
import { useGetProjectsQuery } from "@/api/projects/project.api";
import { useGetWorkflowTeamsQuery } from "@/api/workflow/library.api";

export function useSiteProjects() {
  const { data, isLoading } = useGetProjectsQuery({});
  const projects = useMemo(() => {
    const rows = Array.isArray(data) ? data : data?.data || data?.items || [];
    return rows
      .filter((p) => !p.deleted_at && !p.archived_at)
      .slice()
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [data]);
  const byId = useMemo(() => new Map(projects.map((p) => [String(p.id), p])), [projects]);
  const nameOf = useCallback(
    (id, fallback) => (id ? byId.get(String(id))?.name : null) || fallback || "Unknown project",
    [byId],
  );
  return { projects, nameOf, isLoading };
}

/** [projectId, setProjectId] bound to the `?project=` query param. */
export function useProjectParam(key = "project") {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) || "";
  const set = useCallback(
    (v) => {
      const next = new URLSearchParams(params);
      if (v) next.set(key, v);
      else next.delete(key);
      setParams(next, { replace: true });
    },
    [params, setParams, key],
  );
  return [value, set];
}

/** Project name for a site-ops row: the joined project, then the projects list. */
export const rowProjectName = (row, nameOf) =>
  row?.project?.name || row?.projectName || row?.project_name || nameOf(row?.projectId ?? row?.project_id);

export function ProjectPicker({ value, onChange, allLabel = "All projects", placeholder, projects, invalid, disabled, className, style, id }) {
  const own = useSiteProjects();
  const list = projects || own.projects;
  return (
    <SelectInput
      id={id}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      invalid={invalid}
      disabled={disabled}
      className={className}
      style={style}
      aria-label="Project"
    >
      <option value="">{placeholder || allLabel}</option>
      {list.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </SelectInput>
  );
}

export function useTradeTeams() {
  const { data } = useGetWorkflowTeamsQuery();
  return useMemo(() => {
    const rows = Array.isArray(data) ? data : data?.data || [];
    // Only workflow teams have a type; UUIDs are opaque identifiers.
    return rows.filter((t) => t.type && t.is_active !== false && t.isActive !== false).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [data]);
}
