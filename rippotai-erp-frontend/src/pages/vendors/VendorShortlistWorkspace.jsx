import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import ListShortlist from "./ListShortlist";
import ProjectVendorShortlistView from "./ProjectVendorShortlistView";
import ShortlistPackages from "./ShortlistPackages";

import { useGetProjectsQuery } from "../../api/projects/project.api";

/**
 * VendorShortlistWorkspace
 *
 * Project-aware workspace for Vendor + Material shortlists.
 *
 * Behaviour:
 * 1. If projectId exists in route params:
 *    - load that project
 *    - show it as selected in the selector
 *    - allow switching to another project
 *
 * 2. If projectId does not exist:
 *    - show project selector
 *    - user must select a project
 *
 * Routes:
 *   /projects/:projectId/shortlists
 *   /projects/shortlists
 *
 * Props:
 *   - projectName?: string
 *   - initialShortlistId?: string
 *   - readOnly?: boolean
 */
export default function VendorShortlistWorkspace(props) {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const selectedProjectId = projectId || searchParams.get("projectId") || "";
  return <ProjectShortlistWorkspace key={`${selectedProjectId}:${props.initialShortlistId || ''}`} {...props} />;
}

function ProjectShortlistWorkspace({
  projectName,
  initialShortlistId = null,
  readOnly = false,
}) {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams();
  const [searchParams] = useSearchParams();

  /**
   * Optional project ID can also be supplied through:
   *
   * /shortlists?projectId=xxxx
   *
   * Route param always takes precedence.
   */
  const queryProjectId = searchParams.get("projectId");

  const selectedProjectId = routeProjectId || queryProjectId || null;

  const [activeShortlist, setActiveShortlist] = useState(
    initialShortlistId ? { id: initialShortlistId } : null,
  );

  /**
   * Load projects for the selector.
   */
  const {
    data: projectsResponse,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
    refetch: refetchProjects,
  } = useGetProjectsQuery({
    includeArchived: false,
  });

  /**
   * Your projects API may return either:
   *
   * [
   *   ...
   * ]
   *
   * or:
   *
   * {
   *   data: [...]
   * }
   *
   * Normalize both forms.
   */
  const projects = useMemo(() => {
    if (Array.isArray(projectsResponse)) {
      return projectsResponse;
    }

    if (Array.isArray(projectsResponse?.data)) {
      return projectsResponse.data;
    }

    if (Array.isArray(projectsResponse?.data?.data)) {
      return projectsResponse.data.data;
    }

    return [];
  }, [projectsResponse]);

  /**
   * Currently selected project object.
   */
  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;

    return (
      projects.find(
        (project) => String(project.id) === String(selectedProjectId),
      ) || null
    );
  }, [projects, selectedProjectId]);

  /**
   * Display name.
   *
   * Supports common project response shapes.
   */
  const selectedProjectName = useMemo(() => {
    return (
      selectedProject?.name ||
      selectedProject?.project_name ||
      selectedProject?.title ||
      projectName ||
      ""
    );
  }, [selectedProject, projectName]);

  /**
   * Select another project.
   */
  const handleProjectChange = useCallback(
    (event) => {
      const nextProjectId = event.target.value;

      if (!nextProjectId) {
        setActiveShortlist(null);

        navigate("/procurement/vendors/shortlists", {
          replace: true,
        });

        return;
      }

      setActiveShortlist(null);

      // Project ID is now passed through the URL query parameter.
      navigate(
        `/procurement/vendors/shortlists?projectId=${encodeURIComponent(
          nextProjectId,
        )}`,
      );
    },
    [navigate],
  );
  /**
   * Open shortlist.
   */
  const handleOpen = useCallback((shortlist) => {
    setActiveShortlist(shortlist);
  }, []);

  /**
   * Back from shortlist grid to shortlist cards.
   */
  const handleBack = useCallback(() => {
    setActiveShortlist(null);
  }, []);

  /**
   * ------------------------------------------------------------
   * No project selected
   * ------------------------------------------------------------
   */
  if (!selectedProjectId) {
    return (
      <div className="bg-page min-h-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <div className="mb-6">
            <p className="eyebrow mb-1">Procurement</p>

            <h1 className="text-2xl font-semibold text-[var(--ink-green)]">
              Vendor & Material Shortlists
            </h1>

            <p className="text-sm text-[var(--muted)] mt-1">
              Select a project to manage vendor and material shortlists.
            </p>
          </div>

          <ProjectSelector
            projects={projects}
            value=""
            onChange={handleProjectChange}
            isLoading={isProjectsLoading}
            isError={isProjectsError}
            onRetry={refetchProjects}
          />
        </div>
      </div>
    );
  }

  /**
   * ------------------------------------------------------------
   * Project selected but projects list still loading
   * ------------------------------------------------------------
   *
   * We can still render the shortlist workspace because projectId
   * already exists in the route.
   */
  return (
    <div className="bg-page min-h-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {/* =====================================================
            PROJECT SELECTOR
        ====================================================== */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow mb-1">Procurement</p>

              <h1 className="text-2xl font-semibold text-[var(--ink-green)]">
                Vendor & Material Shortlists
              </h1>

              <p className="text-sm text-[var(--muted)] mt-1 truncate">
                {selectedProjectName
                  ? `Project: ${selectedProjectName}`
                  : `Project ID: ${selectedProjectId}`}
              </p>
            </div>

            <div className="w-full lg:w-[360px]">
              <ProjectSelector
                projects={projects}
                value={selectedProjectId}
                onChange={handleProjectChange}
                isLoading={isProjectsLoading}
                isError={isProjectsError}
                onRetry={refetchProjects}
              />
            </div>
          </div>
        </div>

        <ShortlistPackages key={selectedProjectId} projectId={selectedProjectId} readOnly={readOnly} />
        {/* =====================================================
            SHORTLIST WORKSPACE
        ====================================================== */}
        {activeShortlist ? (
          <ProjectVendorShortlistView
            shortlistId={activeShortlist.id}
            onBack={handleBack}
            title={activeShortlist.title}
            readOnly={readOnly}
          />
        ) : (
          <ListShortlist
            projectId={selectedProjectId}
            projectName={selectedProjectName}
            onOpenShortlist={handleOpen}
          />
        )}
      </div>
    </div>
  );
}

/**
 * ============================================================
 * PROJECT SELECTOR
 * ============================================================
 *
 * Reusable project selector used both:
 *
 * - when no project is selected
 * - when a project is already selected
 */
function ProjectSelector({
  projects = [],
  value = "",
  onChange,
  isLoading = false,
  isError = false,
  onRetry,
}) {
  return (
    <div className="w-full">
      <label
        htmlFor="shortlist-project-selector"
        className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1.5"
      >
        Select Project
      </label>

      {isError ? (
        <div className="flex items-center gap-2">
          <div className="bc-input flex-1 text-sm text-red-600">
            Failed to load projects.
          </div>

          <button
            type="button"
            className="bc-btn-secondary shrink-0"
            onClick={onRetry}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="relative">
          <select
            id="shortlist-project-selector"
            value={value || ""}
            onChange={onChange}
            disabled={isLoading}
            className="bc-input w-full appearance-none pr-10"
          >
            <option value="">
              {isLoading ? "Loading projects..." : "Select a project..."}
            </option>

            {projects.map((project) => {
              const id = project.id;

              const name =
                project.name ||
                project.project_name ||
                project.title ||
                "Untitled Project";

              return (
                <option key={id} value={id}>
                  {name}
                </option>
              );
            })}
          </select>

          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 9l6 6 6-6"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
