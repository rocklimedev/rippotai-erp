import AppLayout from "@/layouts/AppLayout";
import PaymentSchedulePage from "../../pages/documents/paymentSchedulePage";
import AppDashboard from "@/components/dashboard/AppDashboard";
import PaymentScheduleList from "@/pages/documents/PaymentScheduleList";
import { PaymentScheduleForm } from "@/pages/documents/PaymentScheduleForm";

export const ledgerRoutes = [
  {
    type: "layout",
    path: "/ledger",
    layout: AppLayout,
    layoutProps: {
      app: "ledger",
    },

    dynamicSections: {
      appKey: "ledger",

      exclude: [
        "ledger",
        "payment-schedules/all",
        "aggrements/all",
        "edit-dashboard",
        "roles",
        "activity",
      ],
    },

    children: [
      // ============================================================
      // LEDGER
      // ============================================================

      {
        index: true,
        element: <AppDashboard appKey="crm" />,
      },

      // ============================================================
      // DOCUMENTS
      // ============================================================

      {
        path: "payment-schedule/all",
        element: <PaymentScheduleList />,
      },
      {
        path: "payment-schedule/:scheduleId",
        element: <PaymentSchedulePage />,
      },
      {
        path: "forms/payment-schedule",
        element: <PaymentScheduleForm />,
      },
      {
        path: "aggrements/all",
        element: <PaymentScheduleForm />,
      },
    ],
  },
];

export default ledgerRoutes;
