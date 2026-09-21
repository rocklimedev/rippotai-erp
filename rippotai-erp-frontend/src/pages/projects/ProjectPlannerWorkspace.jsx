import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  FileDown,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
} from "lucide-react";

import { Shell } from "../../hooks/shared";

import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Card, CardContent } from "@/components/ui/card";

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

  const [selectedProject, setSelectedProject] = useState("");
  const [view, setView] = useState("Overview");

  const [locationName, setLocationName] = useState("");
  const [parent, setParent] = useState("");

  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

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
      await downloadPlannerPdf();

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

  return (
    <Shell
      title="Project planner"
      subtitle="One project planner with the four views from the Excel template."
      action={
        <Button
          variant="outline"
          onClick={() => navigate("/projects/planner/list")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      }
    >
      <div className="space-y-5">
        {/* ====================================================
            TOP TOOLBAR
        ===================================================== */}

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                {/* PROJECT SELECTOR */}

                {!params.plannerId && !params.projectId && (
                  <div className="min-w-[260px]">
                    <Select
                      value={selectedProject}
                      onValueChange={setSelectedProject}
                      disabled={projectsLoading || busy}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            projectsLoading
                              ? "Loading projects..."
                              : "Select project"
                          }
                        />
                      </SelectTrigger>

                      <SelectContent>
                        {projectList.length === 0 ? (
                          <SelectItem value="__empty__" disabled>
                            No projects found
                          </SelectItem>
                        ) : (
                          projectList.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* INITIALIZE / SYNC */}

                {projectId && (
                  <Button
                    disabled={busy || isFetching}
                    onClick={initializePlanner}
                  >
                    {busy ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating…
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />

                        {overview?.planners?.some(
                          (plannerItem) => plannerItem.type === "PROJECT",
                        )
                          ? "Sync template & locations"
                          : "Initialize project planner"}
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* DOWNLOAD ACTIONS */}

              <div className="flex flex-wrap items-center gap-2">
                {overview?.planners?.length > 0 && (
                  <Button
                    variant="outline"
                    disabled={pdfBusy || isFetching || busy}
                    onClick={handleDownloadPdf}
                  >
                    {pdfBusy ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Rendering…
                      </>
                    ) : (
                      <>
                        <FileDown className="mr-2 h-4 w-4" />
                        Download PDF
                      </>
                    )}
                  </Button>
                )}

                {projectId && (
                  <Button
                    variant="outline"
                    disabled={
                      downloading ||
                      isFetching ||
                      busy ||
                      !overview?.planners?.length
                    }
                    onClick={handleDownloadExcel}
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Downloading…
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download Excel
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ====================================================
            LOCATION TOOLBAR
        ===================================================== */}

        {projectId && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="h-4 w-4 text-primary" />
                  Locations
                </div>

                <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                  {/* LOCATION NAME */}

                  <Input
                    aria-label="Location name"
                    placeholder="Floor or room name"
                    value={locationName}
                    onChange={(event) => setLocationName(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !busy &&
                        locationName.trim()
                      ) {
                        addLocation();
                      }
                    }}
                    disabled={busy}
                    className="sm:max-w-[280px]"
                  />

                  {/* LOCATION PARENT */}

                  <Select
                    value={parent || "__floor__"}
                    onValueChange={(value) =>
                      setParent(value === "__floor__" ? "" : value)
                    }
                    disabled={busy}
                  >
                    <SelectTrigger className="sm:max-w-[280px]">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="__floor__">New floor</SelectItem>

                      {floors.map((floor) => (
                        <SelectItem key={floor.id} value={floor.id}>
                          Room in {floor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* ADD */}

                  <Button
                    variant="outline"
                    disabled={busy || !locationName.trim()}
                    onClick={addLocation}
                  >
                    {busy ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Add location
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground xl:max-w-[320px]">
                  Cells save when you leave them. Status changes save
                  immediately.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ====================================================
            ERROR
        ===================================================== */}

        {error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="rounded-full bg-red-50 p-3">
                <RefreshCw className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <p className="font-medium text-gray-900">
                  Could not load the planner
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Something went wrong while loading the planner data.
                </p>
              </div>

              <Button variant="outline" onClick={refetch}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : !projectId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <MapPin className="mb-3 h-10 w-10 text-gray-300" />

              <p className="font-medium text-gray-900">Select a project</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Select a project above to open its planner.
              </p>
            </CardContent>
          </Card>
        ) : !overview ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading planner…
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ================================================
                PLANNER SHEET TABS
            ================================================= */}

            <div className="overflow-x-auto">
              <Tabs value={view} onValueChange={setView}>
                <TabsList className="w-max min-w-full justify-start">
                  {WORKBOOK_VIEWS.map((name) => (
                    <TabsTrigger key={name} value={name}>
                      {name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* ================================================
                WORKBOOK
            ================================================= */}

            <PlannerWorkbook
              key={projectId}
              overview={overview}
              view={view}
              refresh={refetch}
            />

            {/* ================================================
                ROW ACTIONS
            ================================================= */}

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
