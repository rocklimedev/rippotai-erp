import AppLayout from "@/layouts/AppLayout";
import PaymentSchedulePage from "../../pages/payment-schedule/paymentSchedulePage";
import AppDashboard from "@/components/dashboard/AppDashboard";
import PaymentScheduleList from "@/pages/payment-schedule/PaymentScheduleList";
import { PaymentScheduleForm } from "@/pages/payment-schedule/PaymentScheduleForm";
import BudgetEstimateList from "../../pages/budget-estimate/BudgetEstimateList";
import BudgetEstimateForm from "../../pages/budget-estimate/BudgetEstimateForm";
import BudgetEstimateView from "../../pages/budget-estimate/BudgetEstimatesView";

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
        path: "budget-estimates/all",
        element: <BudgetEstimateList />,
      },
      {
        path: "forms/budget-estimate",
        element: <BudgetEstimateForm />,
      },
      {
        path: "budget-estimate/:id",
        element: <BudgetEstimateView />,
      },
      {
        path: "aggrements/all",
        element: <PaymentScheduleForm />,
      },
    ],
  },
];

export default ledgerRoutes;
