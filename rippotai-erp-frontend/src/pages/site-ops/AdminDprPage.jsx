import { FileBarChart } from "lucide-react";
import DocumentListPage from "@/components/doc-list/DocumentListPage";
import { asRows, rowUpdated } from "@/components/doc-list/doc-utils";
import { useListAdminDprDocumentsQuery, useDeleteAdminDprDocumentMutation } from "@/api/site-ops/admin-dpr.api";

export default function AdminDprPage() {
  const { data, isLoading, error } = useListAdminDprDocumentsQuery({ page: 1, limit: 100 });
  const [remove] = useDeleteAdminDprDocumentMutation();
  return (
    <DocumentListPage
      type="admin-dpr"
      title="Admin DPR"
      icon={FileBarChart}
      rows={asRows(data)}
      loading={isLoading}
      error={error}
      getRow={(r) => {
        const names = Array.isArray(r.project_names) ? r.project_names : [];
        return {
          id: r.id,
          name: `Admin DPR · ${r.from_date || ""}${r.to_date && r.to_date !== r.from_date ? ` to ${r.to_date}` : ""}`,
          projectId: r.project_id || (Array.isArray(r.project_ids) && r.project_ids.length === 1 ? r.project_ids[0] : null),
          projectName: names.length > 1 ? `${names.length} projects` : names[0] || null,
          updatedAt: rowUpdated(r),
          search: names.join(" "),
          editable: false,
        };
      }}
      viewTo={(r) => `/site-operations/admin-dpr/${r.id}`}
      onDelete={(r) => remove(r.id).unwrap()}
      createTo="/site-operations/admin-dpr/workspace"
    />
  );
}
