import { ClipboardList } from "lucide-react";
import DocumentListPage from "@/components/doc-list/DocumentListPage";
import { rowProjectId, rowProjectName, rowUpdated } from "@/components/doc-list/doc-utils";
import { useGetScopeOfWorkQuery, useDeleteScopeOfWorkMutation } from "../../api/documents/scope-of-work.api";

export default function ScopeOfWorkList() {
  const { data: rows = [], isLoading, error } = useGetScopeOfWorkQuery();
  const [deleteScopeOfWork] = useDeleteScopeOfWorkMutation();
  return (
    <DocumentListPage
      type="scope-of-work"
      title="Scope of Work"
      icon={ClipboardList}
      rows={rows}
      loading={isLoading}
      error={error}
      getRow={(r) => ({
        id: r.id,
        name: "Scope of Work",
        projectId: rowProjectId(r),
        projectName: rowProjectName(r),
        version: r.version,
        status: r.status,
        updatedAt: rowUpdated(r),
        search: r.projectMode,
      })}
      viewTo={(r) => `/crm/scope-of-work/${r.id}`}
      editTo={(r) => `/crm/forms/scope-of-work/${r.id}/edit`}
      onDelete={(r) => deleteScopeOfWork(r.id).unwrap()}
      createTo="/crm/forms/scope-of-work"
    />
  );
}
