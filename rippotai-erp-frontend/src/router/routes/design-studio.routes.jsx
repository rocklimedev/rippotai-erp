import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";
import { DrawingUpload } from "@/pages/documents/DocumentsRoutes";
import DrawingUploadPage from "@/pages/design-studio/DrawingUploadPage";
import DrawingsRegister from "@/pages/design-studio/DrawingsRegister";
import { Navigate } from "react-router-dom";

import DrawingsView from "@/pages/documents/DrawingsView";
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
        // Preserve saved links after consolidating integrations into Connectors.
        path: "integrations",
        element: <Navigate to="/settings/connectors" replace />,
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
