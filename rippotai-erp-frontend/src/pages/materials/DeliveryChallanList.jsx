import { Truck } from "lucide-react";
import DocumentListPage from "@/components/doc-list/DocumentListPage";
import { asRows, rowProjectId, rowProjectName, rowUpdated } from "@/components/doc-list/doc-utils";
import { useGetDeliveryChallansQuery, useDeleteDeliveryChallanMutation } from "../../api/procuerment/delivery-challan.api";

export default function DeliveryChallanList() {
  const { data, isLoading, error } = useGetDeliveryChallansQuery();
  const [remove] = useDeleteDeliveryChallanMutation();
  return (
    <DocumentListPage
      type="delivery-challan"
      title="Delivery Challan"
      icon={Truck}
      rows={asRows(data)}
      loading={isLoading}
      error={error}
      getRow={(r) => ({
        id: r.id,
        name: r.challan_number || "Delivery Challan",
        projectId: rowProjectId(r),
        projectName: rowProjectName(r),
        status: r.status,
        updatedAt: rowUpdated(r),
        search: r.vendor?.name,
      })}
      viewTo={(r) => `/procurement/delivery-challans/${r.id}`}
      editTo={(r) => `/procurement/delivery-challans/${r.id}/edit`}
      onDelete={(r) => remove(r.id).unwrap()}
      createTo="/procurement/delivery-challans/new"
    />
  );
}
