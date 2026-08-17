import { useParams } from "react-router-dom";
import PaymentScheduleView from "../../components/payments/PaymentScheduleView";
import { useGetPaymentScheduleQuery } from "../../api/payment-schedules.api";

function PaymentSchedulePage() {
  const { scheduleId } = useParams();

  const {
    data: schedule,
    isLoading,
    isError,
    error,
  } = useGetPaymentScheduleQuery(scheduleId, {
    skip: !scheduleId,
  });

  if (!scheduleId) {
    return <div>Payment schedule ID is missing.</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    console.error("Payment schedule error:", error);
    return <div>Failed to load payment schedule.</div>;
  }

  return <PaymentScheduleView schedule={schedule} />;
}

export default PaymentSchedulePage;
