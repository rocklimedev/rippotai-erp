import { FileSpreadsheet } from "lucide-react";
import DocumentListPage from "@/components/doc-list/DocumentListPage";
import { asRows, rowProjectId, rowProjectName, rowUpdated } from "@/components/doc-list/doc-utils";
import { useGetRateComparisonsQuery, useDeleteRateComparisonMutation } from "../../api/procuerment/vendor-rate-comparison.api";

const basePath = "/procurement/vendors/rate-comparison";

export default function VendorRateComparisonList() {
  const { data, isLoading, error } = useGetRateComparisonsQuery();
  const [remove] = useDeleteRateComparisonMutation();
  return (
    <DocumentListPage
      type="vendor-comparison"
      title="Vendor Comparison"
      icon={FileSpreadsheet}
      rows={asRows(data)}
      loading={isLoading}
      error={error}
      getRow={(r) => ({
        id: r.id,
        name: r.title || "Vendor Comparison",
        projectId: rowProjectId(r),
        projectName: rowProjectName(r),
        version: r.revision,
        updatedAt: rowUpdated(r),
      })}
      viewTo={(r) => `${basePath}/${r.id}`}
      editTo={(r) => `${basePath}/${r.id}/edit`}
      onDelete={(r) => remove(r.id).unwrap()}
      createTo={`${basePath}/new`}
    />
  );
}
