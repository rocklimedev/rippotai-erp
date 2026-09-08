import AppLayout from "@/layouts/AppLayout";
import CommandCenter from "../../pages/CommandCenter";

export const commandCenterRoutes = [
  {
    type: "layout",
    path: "/command-center",
    layout: AppLayout,
    layoutProps: {
      app: "commandCenter",
    },

    dynamicSections: {
      appKey: "commandCenter",

      exclude: [
        "pipeline",
        "leads/new",
        "leads/sources",
        "upload",
        "forms/project-brief",
        "forms/site-reki",
        "forms/plan-of-action",
        "forms/payment-schedule",
        "forms/scope-of-work",
      ],
    },

    children: [
      // ============================================================
      // CRM DASHBOARD
      // ============================================================

      {
        index: true,
        element: <CommandCenter />,
      },
    ],
  },
];
