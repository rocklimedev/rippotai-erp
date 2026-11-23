import { useRef, useState } from 'react';
import PlannerDocument from '../../components/projects/PlannerDocument';
import { OFFSCREEN_STYLE } from '@/components/print-document/commerce';
import { useParams, useSearchParams } from 'react-router-dom';
import RecordContext from '@/components/record-context/RecordContext';
import VersionHistory from '@/components/record-context/VersionHistory';
import { useRecordInfo } from '@/components/record-context/useRecordInfo';
import { toast } from 'sonner';
import { AlertCircle, Download, FileDown, Loader2, MapPin, RefreshCw } from 'lucide-react';

import { Page, PageHeader, Card, Button, Tabs, EmptyState, SelectInput } from '@/components/inos';
import { Skeleton } from '@/components/projects/_projects-ui';

import { useGetProjectsQuery } from '../../api/projects/project.api';

import {
  useGetPlannerByIdQuery,
  useGetProjectPlannerOverviewQuery,
  useInitializeProjectPlannersMutation,
  useGeneratePlannerFromTemplateMutation,
  useDownloadPlannerWorkbookMutation,
} from '../../api/documents/project-planner.api';

import { PlannerWorkbook } from '../../components/projects/PlannerWorkbook';
import {
  PLANNER_VIEWS,
  normalizeView,
  viewCounts,
  viewRows,
} from '../../components/projects/plannerModel';
import { PlannerRowActions } from '../../components/projects/PlannerRowActions';
import { downloadPlannerPdf } from '../../components/projects/plannerWorkbookPdf';

// ============================================================
// HELPERS
// ============================================================

const array = (response) => (Array.isArray(response) ? response : response?.data || []);

// ============================================================
// COMPONENT
// ============================================================

export function ProjectPlannerWorkspace() {
  const params = useParams();
  const recordInfo = useRecordInfo('project-planner', params.plannerId);

  // ==========================================================
  // STATE
  // ==========================================================

  const [searchParams] = useSearchParams();
  const [selectedProject, setSelectedProject] = useState(
    () => searchParams.get('projectId') || searchParams.get('project_id') || '',
  );
  const [view, setView] = useState(() => normalizeView(searchParams.get('view')));

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

  const [download, { isLoading: downloading }] = useDownloadPlannerWorkbookMutation();

  // ==========================================================
  // INITIALIZE / SYNC
  // ==========================================================

  const initializePlanner = async () => {
    if (!projectId) {
      toast.error('Please select a project');
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
        throw new Error('Planner initialization did not return a planner');
      }

      await generate({
        plannerId: planners[0].id,
        data: {},
      }).unwrap();

      await refetch();

      toast.success('Project planner updated — Design, Build and Procurement');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Could not initialize planner');
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

      toast.success('PDF downloaded');
    } catch (err) {
      toast.error(err?.message || 'Could not download PDF');
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

      toast.success('Workbook downloaded');
    } catch (err) {
      toast.error(err?.data?.message || 'Could not download workbook');
    }
  };

  // ==========================================================
  // PROJECT LIST
  // ==========================================================

  const projectList = array(projects);

  // ==========================================================
  // RENDER
  // ==========================================================

  const projectName =
    overview?.project?.name || projectList.find((pr) => String(pr.id) === String(projectId))?.name;
  const hasProjectPlanner = overview?.planners?.some(
    (plannerItem) => plannerItem.type === 'PROJECT',
  );

  return (
    <Page>
      <PageHeader
        crumbs={[
          { label: 'Projects', to: '/projects' },
          { label: 'Planners', to: '/projects/planner/list' },
          { label: projectName || 'Planner' },
        ]}
        title={projectName ? `${projectName} planner` : 'Project planner'}
        info={params.plannerId ? recordInfo : undefined}
        actions={
          <>
            {overview?.planners?.length > 0 && (
              <Button
                variant="secondary"
                icon={pdfBusy ? Loader2 : FileDown}
                disabled={pdfBusy || isFetching || busy}
                onClick={handleDownloadPdf}
              >
                {pdfBusy ? 'Preparing PDF…' : 'Download PDF'}
              </Button>
            )}
            {projectId && (
              <Button
                variant="secondary"
                icon={downloading ? Loader2 : Download}
                disabled={downloading || isFetching || busy || !overview?.planners?.length}
                onClick={handleDownloadExcel}
              >
                {downloading ? 'Downloading…' : 'Excel'}
              </Button>
            )}
            {projectId && (
              <Button
                variant="primary"
                icon={busy ? Loader2 : RefreshCw}
                disabled={busy || isFetching}
                onClick={initializePlanner}
              >
                {busy ? 'Updating…' : hasProjectPlanner ? 'Sync template' : 'Initialize planner'}
              </Button>
            )}
          </>
        }
      />
      {params.plannerId && <RecordContext type="project-planner" id={params.plannerId} />}

      {!params.plannerId && !params.projectId && (
        <Card title="Project" subtitle="Choose the project this planner belongs to.">
          <SelectInput
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={projectsLoading || busy}
            aria-label="Project"
            style={{ maxWidth: 420 }}
          >
            <option value="">
              {projectsLoading
                ? 'Loading projects…'
                : projectList.length
                  ? 'Select project'
                  : 'No projects found'}
            </option>
            {projectList.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </SelectInput>
        </Card>
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
          <EmptyState
            icon={MapPin}
            title="Select a project"
            text="Pick a project above to open its planner."
          />
        </Card>
      ) : !overview ? (
        <Skeleton height={320} />
      ) : (
        <>
          <Tabs
            value={view}
            onChange={setView}
            options={PLANNER_VIEWS.map((name) => {
              const c = viewCounts(viewRows(overview, name));
              return { value: name, label: c.late ? `${name} · ${c.late} late` : name };
            })}
          />

          <PlannerWorkbook key={projectId} overview={overview} view={view} refresh={refetch} />

          <PlannerRowActions
            key={`${projectId}:${view}`}
            overview={overview}
            view={view}
            refresh={refetch}
          />
          {pdfBusy && (
            <div style={OFFSCREEN_STYLE} aria-hidden>
              <PlannerDocument
                ref={pdfRef}
                overview={overview}
                view={view}
                project={projectList.find((pr) => String(pr.id) === String(projectId))}
              />
            </div>
          )}
        </>
      )}
      {params.plannerId && <VersionHistory type="project-planner" id={params.plannerId} />}
    </Page>
  );
}

export default ProjectPlannerWorkspace;
