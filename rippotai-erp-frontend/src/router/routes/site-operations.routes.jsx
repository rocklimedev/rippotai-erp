import AdminDprPage from "@/pages/site-ops/AdminDprPage";
import AdminDprWorkspacePage from "@/pages/site-ops/AdminDprWorkspacePage";
import AdminDprDetailPage from "@/pages/site-ops/AdminDprDetailPage";
import SnagListsPage from "@/pages/site-ops/SnagListsPage";
import SnagListDetailPage from "@/pages/site-ops/SnagListDetailPage";
import SnagListWorkspacePage from "@/pages/site-ops/SnagListWorkspacePage";
import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";
import DailySiteReports from "../../pages/site-ops/DailySiteReportsPage";
import DailyReportForm from "../../pages/site-ops/daily-reports/DailyReportForm";
import DailyReportDetail from "../../pages/site-ops/daily-reports/DailyReportDetail";
import VisitAssignments from "../../pages/site-ops/VisitAssignmentsPage";
import ChecklistsListPage from "../../pages/site-ops/ChecklistsListPage";
import QualityChecksPage from "../../pages/site-ops/QualityChecksPage";
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
      { path: "admin-dpr", element: <AdminDprPage /> },
      { path: "admin-dpr/workspace", element: <AdminDprWorkspacePage /> },
      { path: "admin-dpr/:id", element: <AdminDprDetailPage /> },
      { path: "snag-lists", element: <SnagListsPage /> },
      { path: "snag-lists/workspace", element: <SnagListWorkspacePage /> },
      { path: "snag-lists/:id/workspace", element: <SnagListWorkspacePage /> },
      { path: "snag-lists/:id", element: <SnagListDetailPage /> },
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
        path: "checklists",
        element: <ChecklistsListPage />,
      },


      // =========================================================
      // RFIs
      // =========================================================


      // =========================================================
      // MOCKUPS
      // =========================================================


      {
        path: "checklists/workspace",
        element: <QualityChecksPage />,
      },
    ],
  },
];
