import { ClipboardCheck } from "lucide-react";
import DocumentListPage from "@/components/doc-list/DocumentListPage";
import { asRows, rowProjectId, rowProjectName, rowUpdated } from "@/components/doc-list/doc-utils";
import {
  useGetQualityChecklistsQuery,
  useDeleteQualityChecklistMutation,
  useGetQualityChecklistTemplatesQuery,
} from "../../api/site-ops/site-ops.api";
import { PrintBlankChecklist } from "@/components/site-ops/ChecklistPrint";

const workspace = (r, view) =>
  `/site-operations/checklists/workspace?${new URLSearchParams({ projectId: r.projectId || "", checklistId: r.id, ...(view ? { view: "1" } : {}) })}`;

export default function ChecklistsListPage() {
  const { data, isLoading, error } = useGetQualityChecklistsQuery({ page: 1, limit: 100 });
  const [remove] = useDeleteQualityChecklistMutation();
  const { data: templates = [] } = useGetQualityChecklistTemplatesQuery();
  return (
    <DocumentListPage
      type="checklist"
      title="Checklist"
      icon={ClipboardCheck}
      rows={asRows(data)}
      loading={isLoading}
      error={error}
      getRow={(r) => ({
        id: r.id,
        name: r.checklist_name || r.template_title || "Checklist",
        projectId: rowProjectId(r),
        projectName: rowProjectName(r),
        status: r.status,
        updatedAt: rowUpdated(r),
        search: r.template_title,
      })}
      viewTo={(r) => workspace(r, true)}
      editTo={(r) => workspace(r)}
      onDelete={(r) => remove(r.id).unwrap()}
      createTo="/site-operations/checklists/workspace"
      headerActions={<PrintBlankChecklist templates={templates} />}
    />
  );
}
