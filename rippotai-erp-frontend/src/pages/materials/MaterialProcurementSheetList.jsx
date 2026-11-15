import { PackageSearch } from "lucide-react";
import DocumentListPage from "@/components/doc-list/DocumentListPage";
import { asRows, rowProjectId, rowProjectName, rowUpdated } from "@/components/doc-list/doc-utils";
import { useGetMaterialProcurementsQuery, useDeleteMaterialProcurementMutation } from "../../api/procuerment/material-procurement.api";

export default function MaterialProcurementSheetList() {
  const { data, isLoading, error } = useGetMaterialProcurementsQuery({});
  const [remove] = useDeleteMaterialProcurementMutation();
  return (
    <DocumentListPage
      type="procurement-sheet"
      title="Procurement Sheet"
      icon={PackageSearch}
      rows={asRows(data)}
      loading={isLoading}
      error={error}
      getRow={(r) => ({
        id: r.id,
        name: r.procurementNo || "Procurement Sheet",
        search: r.remarks,
        projectId: rowProjectId(r),
        projectName: rowProjectName(r),
        status: r.status,
        updatedAt: rowUpdated(r),
      })}
      viewTo={(r) => `/procurement/material-procurement/${r.id}`}
      editTo={(r) => `/procurement/material-procurement/${r.id}/edit`}
      onDelete={(r) => remove(r.id).unwrap()}
      createTo="/procurement/material-procurement/new"
    />
  );
}
