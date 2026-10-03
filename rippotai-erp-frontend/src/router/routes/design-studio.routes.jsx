import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";
import { DrawingUpload } from "@/pages/documents/DocumentsRoutes";
import DrawingUploadPage from "@/pages/design-studio/DrawingUploadPage";
import DrawingsRegister from "@/pages/design-studio/DrawingsRegister";
import DrawingIntegrations from "@/pages/design-studio/DrawingIntegrations";

import DrawingsView from "@/pages/documents/DrawingsView";
import DesignStudioDashboard from "../../pages/dashboard/DesignStudioDashboard";
export const designStudioRoutes = [
  {
    type: "layout",
    path: "/design-studio",
    layout: AppLayout,
    layoutProps: { app: "design_studio" },
    blockRoles: ["client"],

    dynamicSections: {
      appKey: "design_studio",
      exclude: ["all", "new", "upload", "integrations"],
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
        element: <DrawingsRegister />,
      },

      {
        path: "new",
        element: <DrawingUploadPage />,
      },
      {
        path: "upload",
        element: <DrawingUploadPage />,
      },
      {
        // WorkDrive test panel moved off the upload page
        path: "integrations",
        element: <DrawingIntegrations />,
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
