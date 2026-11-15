import { Calculator } from "lucide-react";
import DocumentListPage from "@/components/doc-list/DocumentListPage";
import { rowProjectId, rowProjectName, rowUpdated } from "@/components/doc-list/doc-utils";
import { useGetBudgetGuidesQuery, useDeleteBudgetGuideMutation } from "@/api/documents/budget-guides.api";

export default function BudgetGuideList() {
  const { data, isLoading, error } = useGetBudgetGuidesQuery({ page: 1, limit: 100 });
  const [remove] = useDeleteBudgetGuideMutation();
  const rows = Array.isArray(data) ? data : data?.items || [];
  return (
    <DocumentListPage
      type="budget-guide"
      title="Budget Guide"
      icon={Calculator}
      rows={rows}
      loading={isLoading}
      error={error}
      getRow={(r) => ({
        id: r.id,
        name: r.title || "Budget Guide",
        projectId: rowProjectId(r),
        projectName: rowProjectName(r),
        version: r.revision,
        status: r.status,
        updatedAt: rowUpdated(r),
        search: r.project_type,
      })}
      viewTo={(r) => `/ledger/budget-guides/${r.id}`}
      editTo={(r) => `/ledger/budget-guides/${r.id}/edit`}
      onDelete={(r) => remove({ id: r.id, revision: r.raw.revision }).unwrap()}
      createTo="/ledger/budget-guides/new"
    />
  );
}
