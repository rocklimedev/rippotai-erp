import { useRef, useState } from "react";
import PlannerDocument from "../../components/projects/PlannerDocument";
import { OFFSCREEN_STYLE } from "@/components/print-document/commerce";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  Download,
  FileDown,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
} from "lucide-react";

import {
  Page,
  PageHeader,
  Card,
  Button,
  Tabs,
  EmptyState,
  SelectInput,
  TextInput,
  Toolbar,
  ToolbarSpacer,
} from "@/components/inos";
import { Skeleton } from "@/components/projects/_projects-ui";

import { useGetProjectsQuery } from "../../api/projects/project.api";

import {
  useGetPlannerByIdQuery,
  useGetProjectPlannerOverviewQuery,
  useInitializeProjectPlannersMutation,
  useGeneratePlannerFromTemplateMutation,
  useCreateLocationMutation,
  useDownloadPlannerWorkbookMutation,
} from "../../api/documents/project-planner.api";

import { PlannerWorkbook } from "../../components/projects/PlannerWorkbook";
import { WORKBOOK_VIEWS } from "../../components/projects/plannerWorkbookFormat";
import { PlannerRowActions } from "../../components/projects/PlannerRowActions";
import { downloadPlannerPdf } from "../../components/projects/plannerWorkbookPdf";

// ============================================================
// HELPERS
// ============================================================

const array = (response) =>
  Array.isArray(response) ? response : response?.data || [];

// ============================================================
// COMPONENT
// ============================================================

export function ProjectPlannerWorkspace() {
  const params = useParams();
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [searchParams] = useSearchParams();
  const [selectedProject, setSelectedProject] = useState(() => searchParams.get('projectId') || searchParams.get('project_id') || '');
  const [view, setView] = useState(() => searchParams.get('view') || 'Overview');

  const [locationName, setLocationName] = useState("");
  const [parent, setParent] = useState("");

  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const pdfRef = useRef(null);

  // ==========================================================
  // PLANNER
  // ==========================================================

  const { data: plannerResponse } = useGetPlannerByIdQuery(params.plannerId, {
    skip: !params.plannerId,
  });

  const planner = plannerResponse?.data || plannerResponse;

  const projectId = params.projectId || planner?.project_id || selectedProject;

  // ==========================================================
  // PROJECTS
  // ==========================================================

  const { data: projects, isLoading: projectsLoading } = useGetProjectsQuery();

  // ==========================================================
  // OVERVIEW
  // ==========================================================

  const {
    data: response,
    isFetching,
    error,
    refetch,
  } = useGetProjectPlannerOverviewQuery(projectId, {
    skip: !projectId,
  });

  const overview = response?.data || response;

  // ==========================================================
  // MUTATIONS
  // ==========================================================

  const [initialize] = useInitializeProjectPlannersMutation();

  const [generate] = useGeneratePlannerFromTemplateMutation();

  const [createLocation] = useCreateLocationMutation();

  const [download, { isLoading: downloading }] =
    useDownloadPlannerWorkbookMutation();

  // ==========================================================
  // INITIALIZE / SYNC
  // ==========================================================

  const initializePlanner = async () => {
    if (!projectId) {
      toast.error("Please select a project");
      return;
    }

    setBusy(true);

    try {
      const planners = array(
        await initialize({
          projectId,
          data: {},
        }).unwrap(),
      );

      if (!planners?.length || !planners[0]?.id) {
        throw new Error("Planner initialization did not return a planner");
      }

      await generate({
        plannerId: planners[0].id,
        data: {},
      }).unwrap();

      await refetch();

      toast.success("Project planner updated across all four sheets");
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || "Could not initialize planner",
      );
    } finally {
      setBusy(false);
    }
  };

  // ==========================================================
  // ADD LOCATION
  // ==========================================================

  const addLocation = async () => {
    if (!projectId) {
      toast.error("Please select a project");
      return;
    }

    if (!locationName.trim()) {
      return;
    }

    setBusy(true);

    try {
      await createLocation({
        projectId,
        data: {
          name: locationName.trim(),
          type: parent ? "ROOM" : "FLOOR",
          parent_id: parent || undefined,
          sort_order: (overview?.locations || []).length,
        },
      }).unwrap();

      setLocationName("");
      setParent("");

      await refetch();

      toast.success("Location added");
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || "Could not add location",
      );
    } finally {
      setBusy(false);
    }
  };

  // ==========================================================
  // DOWNLOAD PDF
  // ==========================================================

  const handleDownloadPdf = async () => {
    setPdfBusy(true);

    try {
      await downloadPlannerPdf(() => pdfRef.current, overview?.project?.name, view);

      toast.success("PDF downloaded");
    } catch (err) {
      toast.error(err?.message || "Could not download PDF");
    } finally {
      setPdfBusy(false);
    }
  };

  // ==========================================================
  // DOWNLOAD EXCEL
  // ==========================================================

  const handleDownloadExcel = async () => {
    if (!projectId) {
      return;
    }

    try {
      await download(projectId).unwrap();

      toast.success("Workbook downloaded");
    } catch (err) {
      toast.error(err?.data?.message || "Could not download workbook");
    }
  };

  // ==========================================================
  // PROJECT LIST
  // ==========================================================

  const projectList = array(projects);

  // ==========================================================
  // FLOOR LIST
  // ==========================================================

  const floors = Array.isArray(overview?.locations)
    ? overview.locations.filter((location) => location.type === "FLOOR")
    : [];

  // ==========================================================
  // RENDER
  // ==========================================================

  const projectName = overview?.project?.name || projectList.find((pr) => String(pr.id) === String(projectId))?.name;
  const hasProjectPlanner = overview?.planners?.some((plannerItem) => plannerItem.type === "PROJECT");

  return (
    <Page>
      <PageHeader
        crumbs={[
          { label: "Projects", to: "/projects" },
          { label: "Planners", to: "/projects/planner/list" },
          { label: projectName || "Planner" },
        ]}
        title={projectName ? `${projectName} planner` : "Project planner"}
        subtitle="One planner with the four views from the Excel template. Cells save when you leave them; status changes save immediately."
        actions={
          <>
            {overview?.planners?.length > 0 && (
              <Button variant="secondary" icon={pdfBusy ? Loader2 : FileDown} disabled={pdfBusy || isFetching || busy} onClick={handleDownloadPdf}>
                {pdfBusy ? "Preparing PDF…" : "Download PDF"}
              </Button>
            )}
            {projectId && (
              <Button
                variant="secondary"
                icon={downloading ? Loader2 : Download}
                disabled={downloading || isFetching || busy || !overview?.planners?.length}
                onClick={handleDownloadExcel}
              >
                {downloading ? "Downloading…" : "Excel"}
              </Button>
            )}
            {projectId && (
              <Button variant="primary" icon={busy ? Loader2 : RefreshCw} disabled={busy || isFetching} onClick={initializePlanner}>
                {busy ? "Updating…" : hasProjectPlanner ? "Sync template & locations" : "Initialize planner"}
              </Button>
            )}
          </>
        }
      />

      {!params.plannerId && !params.projectId && (
        <Card title="Project" subtitle="Choose the project this planner belongs to.">
          <SelectInput
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={projectsLoading || busy}
            aria-label="Project"
            style={{ maxWidth: 420 }}
          >
            <option value="">{projectsLoading ? "Loading projects…" : projectList.length ? "Select project" : "No projects found"}</option>
            {projectList.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </SelectInput>
        </Card>
      )}

      {projectId && (
        <Toolbar>
          <span className="inos-icon-tile inos-icon-tile--sm" aria-hidden>
            <MapPin />
          </span>
          <TextInput
            aria-label="Location name"
            placeholder="Floor or room name, e.g. Ground floor"
            value={locationName}
            onChange={(event) => setLocationName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !busy && locationName.trim()) addLocation();
            }}
            disabled={busy}
            style={{ maxWidth: 280 }}
          />
          <SelectInput value={parent} onChange={(e) => setParent(e.target.value)} disabled={busy} aria-label="Location parent" style={{ maxWidth: 240 }}>
            <option value="">New floor</option>
            {floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                Room in {floor.name}
              </option>
            ))}
          </SelectInput>
          <Button variant="soft" icon={Plus} disabled={busy || !locationName.trim()} onClick={addLocation}>
            Add location
          </Button>
          <ToolbarSpacer />
          {floors.length > 0 && (
            <span className="pj-muted" style={{ fontSize: 13 }}>
              {floors.length} floor{floors.length === 1 ? "" : "s"}
            </span>
          )}
        </Toolbar>
      )}

      {error ? (
        <Card>
          <EmptyState
            icon={AlertCircle}
            title="Could not load the planner"
            text="Something went wrong while loading the planner data."
            action={
              <Button variant="secondary" icon={RefreshCw} onClick={refetch}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : !projectId ? (
        <Card>
          <EmptyState icon={MapPin} title="Select a project" text="Pick a project above to open its planner." />
        </Card>
      ) : !overview ? (
        <Skeleton height={320} />
      ) : (
        <>
          <Tabs value={view} onChange={setView} options={WORKBOOK_VIEWS.map((name) => ({ value: name, label: name }))} />

          <PlannerWorkbook key={projectId} overview={overview} view={view} refresh={refetch} />

          <PlannerRowActions key={`${projectId}:${view}`} overview={overview} view={view} refresh={refetch} />
          {pdfBusy && (
            <div style={OFFSCREEN_STYLE} aria-hidden>
              <PlannerDocument ref={pdfRef} overview={overview} view={view} project={projectList.find((pr) => String(pr.id) === String(projectId))} />
            </div>
          )}
        </>
      )}
    </Page>
  );
}

export default ProjectPlannerWorkspace;
