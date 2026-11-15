import { HardHat } from "lucide-react";
import DocumentListPage from "@/components/doc-list/DocumentListPage";
import { asRows, rowProjectId, rowProjectName, rowUpdated } from "@/components/doc-list/doc-utils";
import { useGetWorkOrdersQuery, useDeleteWorkOrderMutation } from "../../api/procuerment/work-order.api";

export default function WorkOrderList() {
  const { data, isLoading, error } = useGetWorkOrdersQuery({});
  const [remove] = useDeleteWorkOrderMutation();
  return (
    <DocumentListPage
      type="work-order"
      title="Work Order"
      icon={HardHat}
      rows={asRows(data)}
      loading={isLoading}
      error={error}
      getRow={(r) => ({
        id: r.id,
        name: r.wo_id || r.work_order_number || "Work Order",
        projectId: rowProjectId(r),
        projectName: rowProjectName(r),
        status: r.status,
        updatedAt: rowUpdated(r),
        search: [r.contractor_name, r.contractor_company_name].filter(Boolean).join(" "),
      })}
      viewTo={(r) => `/procurement/work-order/${r.id}`}
      editTo={(r) => `/procurement/work-order/${r.id}/edit`}
      onDelete={(r) => remove(r.id).unwrap()}
      createTo="/procurement/work-order/new"
    />
  );
}
