import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";
import DailySiteReports from "../../pages/site-ops/DailySiteReportsPage";
import VisitAssignments from "../../pages/site-ops/VisitAssignmentsPage";
import QCSignOffHistory from "../../pages/site-ops/QcHistoryPage";
import QCChecklistTemplates from "../../pages/site-ops/QcChecklistTemplatespage";
import QCHandoffStatus from "../../pages/site-ops/QcHandoffStatus";
import RFIs from "../../pages/site-ops/RfisPage";
import Mockups from "../../pages/site-ops/MockupsPage";

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
        element: <SiteOperationsDashboard />,
      },

      // =========================================================
      // DAILY SITE REPORTS
      // =========================================================

      {
        path: "daily-reports",
        element: <DailySiteReports />,
      },

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
    ],
  },
];
