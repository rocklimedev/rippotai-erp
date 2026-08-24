import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";
import { DrawingUpload, DrawingsAll } from "@/pages/documents/DocumentsRoutes";

import DrawingsView from "@/pages/documents/DrawingsView";

export const designStudioRoutes = [
  {
    type: "layout",
    path: "/design-studio",
    layout: AppLayout,
    layoutProps: { app: "designStudio" },
    blockRoles: ["client"],

    dynamicSections: {
      appKey: "designStudio",
      exclude: ["all", "new"],
    },

    children: [
      // =========================================================
      // DASHBOARD
      // =========================================================

      {
        index: true,
        element: <AppDashboard appKey="design-studio" />,
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
