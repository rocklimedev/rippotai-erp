import AppLayout from "@/layouts/AppLayout";
import PaymentSchedulePage from "../../pages/payment-schedule/paymentSchedulePage";
import AppDashboard from "@/components/dashboard/AppDashboard";
import PaymentScheduleList from "@/pages/payment-schedule/PaymentScheduleList";
import { PaymentScheduleForm } from "@/pages/payment-schedule/PaymentScheduleForm";
import BudgetEstimateList from "../../pages/budget-estimate/BudgetEstimateList";
import BudgetEstimateForm from "../../pages/budget-estimate/BudgetEstimateForm";
import BudgetEstimateView from "../../pages/budget-estimate/BudgetEstimatesView";
import LedgerDashboard from "../../pages/dashboard/LedgerDashboard";
import LedgerList from "../../pages/LedgerList";
import BoqDashboard from "@/pages/boq/BoqDashboard";
import BoqNew from "@/pages/boq/BoqNew";
import BoqTemplatesList from "@/pages/boq/BoqTemplatesList";
import BoqTemplateNew from "@/pages/boq/BoqTemplateNew";
import BoqTemplateEditor from "@/pages/boq/BoqTemplateEditor";
import BoqLibraryPage from "@/pages/boq/BoqLibraryPage";
import BoqActivityPage from "@/pages/boq/BoqActivitypage";
import BoqVersions from "@/pages/boq/BoqVersions";
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
        element: <LedgerDashboard />,
      },
      {
        path: "/ledger/all",
        element: <LedgerList />,
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
      { path: "boq/all", element: <BoqDashboard /> },
      { path: "boq/new", element: <BoqNew /> },
      { path: "boq/templates", element: <BoqTemplatesList /> },
      { path: "boq/template/new", element: <BoqTemplateNew /> },
      { path: "boq/template/:id/editor", element: <BoqTemplateEditor /> },
      { path: "boq/rate-and-item-library", element: <BoqLibraryPage /> },
      { path: "boq/activity", element: <BoqActivityPage /> },
      { path: "boq/:id/versions", element: <BoqVersions /> },
    ],
  },
];

export default ledgerRoutes;
