import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";
import { DrawingUpload, DrawingsAll } from "@/pages/documents/DocumentsRoutes";

import DrawingsView from "@/pages/documents/DrawingsView";
import DesignStudioDashboard from "../../pages/dashboard/DesignStudioDashboard";
import ZohoWorkDriveTestPanel from "../../pages/UploadPanel";
export const designStudioRoutes = [
  {
    type: "layout",
    path: "/design-studio",
    layout: AppLayout,
    layoutProps: { app: "design_studio" },
    blockRoles: ["client"],

    dynamicSections: {
      appKey: "design_studio",
      exclude: ["all", "new"],
    },

    children: [
      // =========================================================
      // DASHBOARD
      // =========================================================

      {
        index: true,
        element: <AppDashboard appKey="design_studio" />,
      },

      // =========================================================
      // DRAWINGS
      // =========================================================

      {
        path: "all",
        element: <DrawingsAll />,
      },

      {
        path: "new",
        element: <DrawingUpload />,
      },
      {
        path: "upload",
        element: <ZohoWorkDriveTestPanel />,
      },
      // =========================================================
      // DRAWING DETAIL / EDIT
      // =========================================================

      {
        path: ":id",
        element: <DrawingsView />,
      },

      {
        path: ":id/edit",
        element: <DrawingUpload />,
      },
    ],
  },
];
