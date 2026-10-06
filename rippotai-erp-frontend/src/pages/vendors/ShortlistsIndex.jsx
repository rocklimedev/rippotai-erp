import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, Bookmark } from "lucide-react";
import { useGetProjectShortlistsQuery } from "@/api/vendors/vendor-shortlist.api";
import { useGetProjectsQuery } from "@/api/projects/project.api";
import {
  Page,
  PageHeader,
  Card,
  Button,
  EmptyState,
  Field,
  SelectInput,
  SearchInput,
} from "@/components/inos";

const workspaceUrl = (projectId) =>
  `/procurement/vendors/shortlists-workspace?projectId=${encodeURIComponent(projectId)}`;
const normalizeRows = (response) =>
  Array.isArray(response)
    ? response
    : response?.data?.data || response?.data || [];
const projectName = (project) =>
  project?.name || project?.project_name || project?.title;
const typeLabel = (type) => (type === "MATERIAL" ? "Material" : "Vendor");
const updatedDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN") : "—";

export default function ShortlistsIndex() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState("");
  const [workspaceProjectId, setWorkspaceProjectId] = useState("");
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetProjectShortlistsQuery();
  const {
    data: projectResponse,
    isLoading: projectsLoading,
    isError: projectsError,
    refetch: retryProjects,
  } = useGetProjectsQuery({ includeArchived: true });
  const lists = useMemo(() => normalizeRows(response), [response]);
  const projects = useMemo(() => {
    const byId = new Map(
      normalizeRows(projectResponse).map((project) => [project.id, project]),
    );
    for (const list of lists) {
      if (!byId.has(list.project_id))
        byId.set(
          list.project_id,
          list.project || { id: list.project_id, name: list.project_id },
        );
    }
    return [...byId.values()].sort((a, b) =>
      (projectName(a) || "").localeCompare(projectName(b) || ""),
    );
  }, [projectResponse, lists]);
  const names = useMemo(
    () =>
      new Map(projects.map((project) => [project.id, projectName(project)])),
    [projects],
  );
  const visibleLists = useMemo(
    () =>
      lists.filter((list) => {
        if (projectId && list.project_id !== projectId) return false;
        if (type && list.shortlist_type !== type) return false;
        const text = `${list.title || ""} ${projectName(list.project) || names.get(list.project_id) || ""} ${typeLabel(list.shortlist_type)}`;
        return text.toLowerCase().includes(search.trim().toLowerCase());
      }),
    [lists, projectId, type, search, names],
  );
  const options = projects.map((project) => (
    <option key={project.id} value={project.id}>
      {projectName(project)}
    </option>
  ));

  return (
    <Page>
      <PageHeader
        eyebrow="Procurement · Vendors"
        title="Vendor & material shortlists"
        subtitle="Browse shortlists across all projects. Open a project workspace to create, edit and manage its vendor and material selections."
      />
      <Card
        title="Open project workspace"
        subtitle="Choose any project to manage its shortlists, including projects without an existing shortlist."
      >
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Project">
            <SelectInput
              value={workspaceProjectId}
              onChange={(event) => setWorkspaceProjectId(event.target.value)}
              disabled={projectsLoading}
            >
              <option value="">
                {projectsLoading ? "Loading projects…" : "Choose a project"}
              </option>
              {options}
            </SelectInput>
          </Field>
          <Button
            variant="primary"
            iconRight={ArrowUpRight}
            disabled={!workspaceProjectId}
            onClick={() => navigate(workspaceUrl(workspaceProjectId))}
          >
            Open workspace
          </Button>
          {projectsError && (
            <>
              <p role="alert">Could not load all projects.</p>
              <Button onClick={retryProjects}>Retry projects</Button>
            </>
          )}
        </div>
      </Card>
      <Card
        title="All shortlists"
        subtitle={`${lists.length} shortlists across ${new Set(lists.map((list) => list.project_id)).size} projects`}
      >
        <div className="flex flex-wrap items-end gap-3 mb-5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search project or shortlist"
          />
          <Field label="Project">
            <SelectInput
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            >
              <option value="">All projects</option>
              {options}
            </SelectInput>
          </Field>
          <Field label="Shortlist type">
            <SelectInput
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="">Vendor & material</option>
              <option value="VENDOR">Vendor</option>
              <option value="MATERIAL">Material</option>
            </SelectInput>
          </Field>
          {(search || projectId || type) && (
            <Button
              onClick={() => {
                setSearch("");
                setProjectId("");
                setType("");
              }}
            >
              Clear filters
            </Button>
          )}
          <Button loading={isFetching} onClick={refetch}>
            Refresh
          </Button>
        </div>
        {isLoading ? (
          <p role="status">Loading shortlists…</p>
        ) : isError ? (
          <EmptyState
            title="Could not load shortlists"
            text="Please retry to load the project shortlist list."
            action={<Button onClick={refetch}>Retry</Button>}
          />
        ) : !visibleLists.length ? (
          <EmptyState
            icon={Bookmark}
            title={
              lists.length ? "No matching shortlists" : "No shortlists yet"
            }
            text={
              lists.length
                ? "Change or clear the filters to see more shortlists."
                : "Choose a project above to create its vendor and material shortlists."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table
              className="inos-table w-full text-left"
              data-testid="shortlists-index"
            >
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Shortlist</th>
                  <th>Type</th>
                  <th>Entries</th>
                  <th>Selected</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Workspace</th>
                </tr>
              </thead>
              <tbody>
                {visibleLists.map((list) => (
                  <tr key={list.id} data-testid={`shortlist-row-${list.id}`}>
                    <td>
                      {projectName(list.project) ||
                        names.get(list.project_id) ||
                        list.project_id}
                    </td>
                    <td>
                      <Link
                        to={workspaceUrl(list.project_id)}
                        className="font-semibold hover:underline"
                      >
                        {list.title ||
                          `${typeLabel(list.shortlist_type)} shortlist`}
                      </Link>
                    </td>
                    <td>{typeLabel(list.shortlist_type)}</td>
                    <td>{list.entries?.length || 0}</td>
                    <td>
                      {list.entries?.filter((entry) => entry.is_selected)
                        .length || 0}
                    </td>
                    <td>{list.is_locked ? "Locked" : "Editable"}</td>
                    <td>{updatedDate(list.updated_at)}</td>
                    <td>
                      <Link
                        to={workspaceUrl(list.project_id)}
                        className="inos-btn inos-btn--secondary"
                        aria-label={`Open ${projectName(list.project) || names.get(list.project_id) || "project"} workspace`}
                      >
                        Open workspace
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  );
}
