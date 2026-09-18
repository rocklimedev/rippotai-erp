import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Shell } from "../../hooks/shared";
import { Button } from "@/components/ui/button";
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

const array = (response) =>
  Array.isArray(response) ? response : response?.data || [];
export function ProjectPlannerWorkspace() {
  const params = useParams();
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState("");
  const [view, setView] = useState("Overview");
  const [locationName, setLocationName] = useState("");
  const [parent, setParent] = useState("");
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const { data: plannerResponse } = useGetPlannerByIdQuery(params.plannerId, {
    skip: !params.plannerId,
  });
  const planner = plannerResponse?.data || plannerResponse;
  const projectId = params.projectId || planner?.project_id || selectedProject;
  const { data: projects } = useGetProjectsQuery();
  const {
    data: response,
    isFetching,
    error,
    refetch,
  } = useGetProjectPlannerOverviewQuery(projectId, { skip: !projectId });
  const overview = response?.data || response;
  const [initialize] = useInitializeProjectPlannersMutation();
  const [generate] = useGeneratePlannerFromTemplateMutation();
  const [createLocation] = useCreateLocationMutation();
  const [download, { isLoading: downloading }] =
    useDownloadPlannerWorkbookMutation();
  const initializePlanner = async () => {
    setBusy(true);
    try {
      const planners = array(
        await initialize({ projectId, data: {} }).unwrap(),
      );
      await generate({ plannerId: planners[0].id, data: {} }).unwrap();
      await refetch();
      toast.success("Project planner updated across all four sheets");
    } catch (err) {
      toast.error(err?.data?.message || "Could not initialize planner");
    } finally {
      setBusy(false);
    }
  };
  const addLocation = async () => {
    if (!locationName.trim()) return;
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
      await refetch();
      toast.success("Location added");
    } catch (err) {
      toast.error(err?.data?.message || "Could not add location");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell
      title="Project planner"
      subtitle="One project planner with the four views from the Excel template."
      action={
        <Button
          variant="outline"
          onClick={() => navigate("/projects/planner/list")}
        >
          Back
        </Button>
      }
    >
      <div className="planner-workspace space-y-5">
        <div className="planner-toolbar">
          {overview?.planners?.length > 0 && (
            <Button
              variant="outline"
              disabled={pdfBusy || isFetching || busy}
              onClick={async () => {
                setPdfBusy(true);
                try {
                  await downloadPlannerPdf();
                } catch (err) {
                  toast.error(err.message || "Could not download PDF");
                } finally {
                  setPdfBusy(false);
                }
              }}
            >
              {pdfBusy ? "Rendering…" : "Download current sheet PDF"}
            </Button>
          )}
          {!params.plannerId && !params.projectId && (
            <select
              aria-label="Project"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">Select project</option>
              {array(projects).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          {projectId && (
            <>
              <Button disabled={busy || isFetching} onClick={initializePlanner}>
                {busy
                  ? "Updating…"
                  : overview?.planners?.some((p) => p.type === "PROJECT")
                    ? "Sync template & locations"
                    : "Initialize project planner"}
              </Button>
              <Button
                variant="outline"
                disabled={
                  downloading ||
                  isFetching ||
                  busy ||
                  !overview?.planners?.length
                }
                onClick={async () => {
                  try {
                    await download(projectId).unwrap();
                  } catch {
                    toast.error("Could not download workbook");
                  }
                }}
              >
                {downloading ? "Downloading…" : "Download Excel"}
              </Button>
            </>
          )}
        </div>
        {projectId && (
          <div className="planner-toolbar">
            <input
              aria-label="Location name"
              placeholder="Floor or room name"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
            <select
              aria-label="Location parent"
              value={parent}
              onChange={(e) => setParent(e.target.value)}
            >
              <option value="">New floor</option>
              {(overview?.locations || [])
                .filter((l) => l.type === "FLOOR")
                .map((f) => (
                  <option value={f.id} key={f.id}>
                    Room in {f.name}
                  </option>
                ))}
            </select>
            <Button
              variant="outline"
              disabled={busy || !locationName.trim()}
              onClick={addLocation}
            >
              Add location
            </Button>
            <span className="text-xs text-muted-foreground">
              Cells save when you leave them. Status changes save immediately.
            </span>
          </div>
        )}
        {error ? (
          <p role="alert">
            Could not load the planner. <button onClick={refetch}>Retry</button>
          </p>
        ) : !projectId ? (
          <p>Select a project to open its planner.</p>
        ) : !overview ? (
          <p>Loading planner…</p>
        ) : (
          <>
            <div
              className="planner-view-tabs"
              role="tablist"
              aria-label="Planner sheets"
            >
              {WORKBOOK_VIEWS.map((name) => (
                <button
                  key={name}
                  role="tab"
                  aria-selected={view === name}
                  onClick={() => setView(name)}
                >
                  {name}
                </button>
              ))}
            </div>
            <PlannerWorkbook
              key={projectId}
              overview={overview}
              view={view}
              refresh={refetch}
            />
            <PlannerRowActions
              key={`${projectId}:${view}`}
              overview={overview}
              view={view}
              refresh={refetch}
            />
          </>
        )}
      </div>
    </Shell>
  );
}
export default ProjectPlannerWorkspace;
