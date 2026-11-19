import { CalendarRange } from 'lucide-react';
import DocumentListPage from '@/components/doc-list/DocumentListPage';
import { useGetDocRowsQuery } from '@/api/doc-flow/doc-flow.api';
import { useDeletePlannerMutation } from '../../api/documents/project-planner.api';

export default function ProjectPlannerList() {
  const { data: rows = [], isLoading, error, refetch } = useGetDocRowsQuery('project-planner');
  const [deletePlanner] = useDeletePlannerMutation();
  return (
    <DocumentListPage
      type="project-planner"
      title="Project Planner"
      icon={CalendarRange}
      rows={rows}
      loading={isLoading}
      error={error}
      getRow={(r) => ({
        id: r.id,
        name: r.name || 'Project Planner',
        projectId: r.project_id,
        updatedAt: r.updated_at,
      })}
      viewTo={(r) => `/projects/planner/${r.id}`}
      editTo={(r) => `/projects/planner/${r.id}?mode=edit`}
      onDelete={async (r) => {
        await deletePlanner(r.id).unwrap();
        refetch();
      }}
      createTo="/projects/planner/create"
    />
  );
}
