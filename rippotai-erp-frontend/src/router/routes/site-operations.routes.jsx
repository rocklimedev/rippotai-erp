import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";
import DailySiteReports from "../../pages/site-ops/DailySiteReportsPage";
import VisitAssignments from "../../pages/site-ops/VisitAssignmentsPage";
import QCSignOffHistory from "../../pages/site-ops/QcHistoryPage";
import QCChecklistTemplates from "../../pages/site-ops/QcChecklistTemplatespage";
import QCHandoffStatus from "../../pages/site-ops/QcHandoffStatus";
import RFIs from "../../pages/site-ops/RfisPage";
import Mockups from "../../pages/site-ops/MockupsPage";
import QualityChecksPage from "../../pages/site-ops/QualityChecksPage";
import SiteOperationsDashboard from "../../pages/dashboard/SiteOperationsDashboard";
import DailyReportsListPage from "../../pages/site-ops/DailyReportsListPage";
import DailyReportCreatePage from "../../pages/site-ops/DailyReportCreatePage";
import DailyReportDetailPage from "../../pages/site-ops/DailyReportDetailPage";
import MockupsListPage from "../../pages/site-ops/MockupsListPage";
import MockupCreatePage from "../../pages/site-ops/MockupCreatePage";
import MockupDetailPage from "../../pages/site-ops/MockupDetailPage";
import RfisListPage from "../../pages/site-ops/RfisListPage";
import RfiCreatePage from "../../pages/site-ops/RfiCreatePage";
import RfiDetailPage from "../../pages/site-ops/RfiDetailPage";
import SiteVisitsListPage from "../../pages/site-ops/SiteVisitsListPage";
import SiteVisitCreatePage from "../../pages/site-ops/SiteVisitCreatePage";
import SiteVisitDetailPage from "../../pages/site-ops/SiteVisitDetailPage";
import SnagsListPage from "../../pages/site-ops/SnagsListPage";
import SnagCreatePage from "../../pages/site-ops/SnagCreatePage";
import SnagDetailPage from "../../pages/site-ops/SnagDetailPage";
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
        path: "daily-reports/list",
        element: <DailyReportsListPage />,
      },
      {
        path: "daily-report/create",
        element: <DailyReportCreatePage />,
      },
      {
        path: "daily-report/:id",
        element: <DailyReportDetailPage />,
      },

      // =========================================================
      // VISIT ASSIGNMENTS
      // =========================================================

      {
        path: "site-visits/list",
        element: <SiteVisitsListPage />,
      },
      {
        path: "site-visits/create",
        element: <SiteVisitCreatePage />,
      },
      {
        path: "site-visits/:id",
        element: <SiteVisitDetailPage />,
      },
      // =========================================================
      // QC
      // =========================================================

      {
        path: "qc/history",
        element: <QCSignOffHistory />,
      },
      {
        path: "qc/list",
        element: <QualityChecksPage />,
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
        element: <RfisListPage />,
      },
      {
        path: "rfis/create",
        element: <RfiCreatePage />,
      },
      {
        path: "rfis/:id",
        element: <RfiDetailPage />,
      },
      // =========================================================
      // MOCKUPS
      // =========================================================

      {
        path: "mockups/list",
        element: <MockupsListPage />,
      },
      {
        path: "mockups/create",
        element: <MockupCreatePage />,
      },
      {
        path: "mockups/:id",
        element: <MockupDetailPage />,
      },
      {
        path: "snags/list",
        element: <SnagsListPage />,
      },
      {
        path: "snags/create",
        element: <SnagCreatePage />,
      },
      {
        path: "snag/:id",
        element: <SnagDetailPage />,
      },
    ],
  },
];
