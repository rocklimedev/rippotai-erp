import { ShoppingCart } from "lucide-react";
import DocumentListPage from "@/components/doc-list/DocumentListPage";
import { asRows, rowProjectId, rowProjectName, rowUpdated } from "@/components/doc-list/doc-utils";
import { useGetPurchaseOrdersQuery, useDeletePurchaseOrderMutation } from "../../api/procuerment/purchase-order.api";

export default function PurchaseOrderList() {
  const { data, isLoading, error } = useGetPurchaseOrdersQuery();
  const [remove] = useDeletePurchaseOrderMutation();
  return (
    <DocumentListPage
      type="purchase-order"
      title="Purchase Order"
      icon={ShoppingCart}
      rows={asRows(data)}
      loading={isLoading}
      error={error}
      getRow={(r) => ({
        id: r.id,
        name: r.po_number || "Purchase Order",
        projectId: rowProjectId(r),
        projectName: rowProjectName(r),
        status: r.status,
        updatedAt: rowUpdated(r),
        search: [r.agency_name, r.vendor?.name].filter(Boolean).join(" "),
        editable: !["RECEIVED", "CLOSED", "CANCELLED"].includes(r.status),
      })}
      viewTo={(r) => `/procurement/purchase-orders/${r.id}`}
      editTo={(r) => `/procurement/purchase-orders/${r.id}/edit`}
      onDelete={(r) => remove(r.id).unwrap()}
      createTo="/procurement/purchase-orders/new"
    />
  );
}
