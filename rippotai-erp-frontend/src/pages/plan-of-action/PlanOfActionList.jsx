import { ListChecks } from "lucide-react";
import DocumentListPage from "@/components/doc-list/DocumentListPage";
import { rowProjectId, rowProjectName, rowUpdated } from "@/components/doc-list/doc-utils";
import { useFindAllPlanOfActionsQuery, useDeletePlanOfActionMutation } from "../../api/documents/plan-of-actions.api";

export default function PlanOfActionList() {
  const { data: rows = [], isLoading, error } = useFindAllPlanOfActionsQuery(undefined);
  const [deletePlanOfAction] = useDeletePlanOfActionMutation();
  return (
    <DocumentListPage
      type="plan-of-action"
      title="Plan of Action"
      icon={ListChecks}
      rows={rows}
      loading={isLoading}
      error={error}
      getRow={(r) => ({
        id: r.id,
        name: r.title || "Plan of Action",
        projectId: rowProjectId(r),
        projectName: rowProjectName(r),
        version: r.version,
        status: r.status || (r.is_published ? "published" : "draft"),
        updatedAt: rowUpdated(r),
      })}
      viewTo={(r) => `/crm/plan-of-action/${r.id}`}
      editTo={(r) => `/crm/forms/plan-of-action/${r.id}/edit`}
      onDelete={(r) => deletePlanOfAction(r.id).unwrap()}
      createTo="/crm/forms/plan-of-action"
    />
  );
}
