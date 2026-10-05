import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";
import DailySiteReports from "../../pages/site-ops/DailySiteReportsPage";
import DailyReportForm from "../../pages/site-ops/daily-reports/DailyReportForm";
import DailyReportDetail from "../../pages/site-ops/daily-reports/DailyReportDetail";
import VisitAssignments from "../../pages/site-ops/VisitAssignmentsPage";
import QCSignOffHistory from "../../pages/site-ops/QcHistoryPage";
import QCChecklistTemplates from "../../pages/site-ops/QcChecklistTemplatespage";
import QCHandoffStatus from "../../pages/site-ops/QcHandoffStatus";
import RFIs from "../../pages/site-ops/RfisPage";
import Mockups from "../../pages/site-ops/MockupsPage";
import SiteVisitsListPage from "../../pages/site-ops/SiteVisitsListPage";
import SiteVisitDetailPage from "../../pages/site-ops/SiteVisitDetailPage";
import SiteVisitCreatePage from "../../pages/site-ops/SiteVisitCreatePage";
import QualityChecksPage from "../../pages/site-ops/QualityChecksPage";
import SiteOperationsDashboard from "../../pages/dashboard/SiteOperationsDashboard";
export const siteOperationsRoutes = [
  {
    type: "layout",
    path: "/site-operations",
    layout: AppLayout,
    layoutProps: { app: "siteOperations" },
    blockRoles: ["client"],

    dynamicSections: {
      appKey: "siteOperations",
      exclude: ["all", "new", "templates", "history", "handoff-status"],
    },

    children: [
      // =========================================================
      // DASHBOARD
      // =========================================================

      {
        index: true,
        element: <AppDashboard appKey="siteOperations" />,
      },

      // =========================================================
      // DAILY SITE REPORTS
      // =========================================================

      {
        path: "daily-reports",
        element: <DailySiteReports />,
      },
      { path: "daily-reports/new", element: <DailyReportForm /> },
      { path: "daily-reports/:id", element: <DailyReportDetail /> },
      { path: "daily-reports/:id/edit", element: <DailyReportForm /> },

      // =========================================================
      // VISIT ASSIGNMENTS
      // =========================================================

      {
        path: "visit-assignments",
        element: <VisitAssignments />,
      },

      // =========================================================
      // QC
      // =========================================================

      {
        path: "qc/history",
        element: <QCSignOffHistory />,
      },

      {
        path: "qc/checklist-templates",
        element: <QCChecklistTemplates />,
      },

      {
        path: "qc/handoff-status",
        element: <QCHandoffStatus />,
      },

      // =========================================================
      // RFIs
      // =========================================================

      {
        path: "rfis",
        element: <RFIs />,
      },

      // =========================================================
      // MOCKUPS
      // =========================================================

      {
        path: "mockups",
        element: <Mockups />,
      },

      {
        path: "site-visits",
        element: <SiteVisitsListPage />,
      },
      {
        path: "site-visits/:id",
        element: <SiteVisitDetailPage />,
      },
      {
        path: "site-visits/:id/edit",
        element: <SiteVisitCreatePage />,
      },
      {
        path: "site-visits/new",
        element: <SiteVisitCreatePage />,
      },
      {
        path: "checklists/workspace",
        element: <QualityChecksPage />,
      },
    ],
  },
];
