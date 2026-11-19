import { useNavigate } from 'react-router-dom';
import { BookOpen, LayoutTemplate, Table2 } from 'lucide-react';
import { Button } from '@/components/inos';
import DocumentListPage from '@/components/doc-list/DocumentListPage';
import { rowProjectId, rowProjectName, rowUpdated } from '@/components/doc-list/doc-utils';
import { useGetBoqsQuery, useDeleteBoqMutation } from '../../api/boq/boq.api';

export default function BoqDashboard() {
  const nav = useNavigate();
  const { data: rows = [], isLoading, error } = useGetBoqsQuery({});
  const [deleteBoq] = useDeleteBoqMutation();
  return (
    <DocumentListPage
      type="boq"
      title="BOQ"
      icon={Table2}
      rows={rows}
      loading={isLoading}
      error={error}
      getRow={(r) => ({
        id: r.id,
        name: r.title || r.boq_number || 'BOQ',
        code: r.boq_number || null,
        projectId: rowProjectId(r),
        projectName: rowProjectName(r),
        version: r.version,
        status: r.status,
        updatedAt: rowUpdated(r),
        search: [r.boq_number, r.client_name].filter(Boolean).join(' '),
      })}
      viewTo={(r) => `/ledger/boq/${r.id}/preview`}
      editTo={(r) => `/ledger/boq/${r.id}`}
      onDelete={(r) => deleteBoq(r.id).unwrap()}
      createTo="/ledger/boq/new"
      headerActions={
        <>
          <Button icon={LayoutTemplate} onClick={() => nav('/ledger/boq/templates')}>
            Templates
          </Button>
          <Button icon={BookOpen} onClick={() => nav('/ledger/boq/rate-and-item-library')}>
            Rate library
          </Button>
        </>
      }
    />
  );
}
