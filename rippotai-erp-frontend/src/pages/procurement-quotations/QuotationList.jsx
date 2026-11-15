// Build › Procurement › Quotation — the shared document list. New quotations start from a
// Vendor Comparison Sheet (finalise a vendor → Create Quotation).
import { FileText } from "lucide-react";
import { DocumentListPage } from "@/components/doc-list";
import { usePermission } from "@/hooks/use-permission";
import { useDeleteProcurementQuotationMutation, useGetProcurementQuotationsQuery } from "@/api/procuerment/procurement-quotation.api";

const LIST = "/procurement/quotations";

export default function QuotationList() {
  const { data, isLoading, error } = useGetProcurementQuotationsQuery({});
  const [remove] = useDeleteProcurementQuotationMutation();
  const canCreate = usePermission("procurement-quotations", "create");
  const canEdit = usePermission("procurement-quotations", "update");
  const canDelete = usePermission("procurement-quotations", "delete");
  return (
    <DocumentListPage
      type="quotation"
      title="Quotation"
      icon={FileText}
      rows={Array.isArray(data) ? data : []}
      loading={isLoading}
      error={error}
      getRow={(q) => ({
        id: q.id,
        name: `${q.quotation_number} · ${q.vendor_name || q.vendor?.company_name || q.vendor?.name || "Vendor"}`,
        projectId: q.project_id,
        projectName: q.project?.name || q.project_name,
        version: q.version,
        status: q.status,
        updatedAt: q.updated_at || q.updatedAt,
        search: [q.vendor_kind === "LABOUR" ? "labour" : "material", q.client_name].filter(Boolean).join(" "),
      })}
      viewTo={(row) => `${LIST}/${row.id}`}
      editTo={(row) => `${LIST}/${row.id}/edit`}
      onDelete={(row) => remove(row.id).unwrap()}
      createTo="/procurement/vendors/rate-comparison"
      createLabel="New from Vendor Comparison"
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
