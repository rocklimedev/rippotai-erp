import { IndianRupee } from "lucide-react";
import DocumentListPage from "@/components/doc-list/DocumentListPage";
import { rowProjectId, rowProjectName, rowUpdated } from "@/components/doc-list/doc-utils";
import { useGetPaymentSchedulesQuery, useDeletePaymentScheduleMutation } from "../../api/documents/payment-schedules.api";

export default function PaymentScheduleList() {
  const { data: rows = [], isLoading, error } = useGetPaymentSchedulesQuery(undefined);
  const [deletePaymentSchedule] = useDeletePaymentScheduleMutation();
  return (
    <DocumentListPage
      type="payment-schedule"
      title="Payment Schedule"
      icon={IndianRupee}
      rows={rows}
      loading={isLoading}
      error={error}
      getRow={(r) => ({
        id: r.id,
        name: r.title || "Payment Schedule",
        projectId: rowProjectId(r),
        projectName: rowProjectName(r),
        status: r.status,
        updatedAt: rowUpdated(r),
      })}
      viewTo={(r) => `/ledger/payment-schedule/${r.id}`}
      editTo={(r) => `/ledger/forms/payment-schedule/${r.id}/edit`}
      onDelete={(r) => deletePaymentSchedule(r.id).unwrap()}
      createTo="/ledger/forms/payment-schedule"
    />
  );
}
