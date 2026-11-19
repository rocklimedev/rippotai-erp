import { ListTodo } from 'lucide-react';
import DocumentListPage from '@/components/doc-list/DocumentListPage';
import { asRows, rowProjectId, rowProjectName, rowUpdated } from '@/components/doc-list/doc-utils';
import {
  useListSnagDocumentsQuery,
  useDeleteSnagDocumentMutation,
} from '@/api/site-ops/snag-lists.api';

export const snagError = (e) =>
  typeof e?.data?.message === 'string'
    ? e.data.message
    : e?.data?.message?.join?.(', ') || 'Request failed. Please try again.';

export default function SnagListsPage() {
  const { data, isLoading, error } = useListSnagDocumentsQuery({ page: 1, limit: 100 });
  const [remove] = useDeleteSnagDocumentMutation();
  return (
    <DocumentListPage
      type="snag-list"
      title="Snag List"
      icon={ListTodo}
      rows={asRows(data)}
      loading={isLoading}
      error={error}
      getRow={(r) => ({
        id: r.id,
        name: r.title || 'Snag List',
        projectId: rowProjectId(r),
        projectName: rowProjectName(r),
        version: r.revision,
        updatedAt: rowUpdated(r),
      })}
      viewTo={(r) => `/site-operations/snag-lists/${r.id}`}
      editTo={(r) => `/site-operations/snag-lists/${r.id}/workspace`}
      onDelete={(r) => remove(r.id).unwrap()}
      createTo="/site-operations/snag-lists/workspace"
    />
  );
}
