import { Navigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";

import AutomationOverview from "@/pages/automation/AutomationOverview";
import AutomationRules from "@/pages/automation/AutomationRules";
import AutomationRuleBuilder from "@/pages/automation/AutomationRuleBuilder";
import AutomationRuns from "@/pages/automation/AutomationRuns";
import AutomationRunDetails from "@/pages/automation/AutomationRunDetails";
import AutomationEscalations from "@/pages/automation/AutomationEscalations";
import AutomationAudit from "@/pages/automation/AutomationAudit";

export const automationRoutes = [
  {
    type: "layout",
    path: "/automation",
    layout: AppLayout,
    layoutProps: {
      app: "automation",
    },

    dynamicSections: {
      appKey: "automation",

      exclude: [],
    },

    children: [
      // ============================================================
      // AUTOMATION OVERVIEW
      // ============================================================

      {
        index: true,
        element: <AutomationOverview />,
      },

      // ============================================================
      // AUTOMATION RULES
      // ============================================================

      {
        path: "rules",
        element: <AutomationRules />,
      },

      {
        path: "rules/new",
        element: <AutomationRuleBuilder />,
      },

      {
        path: "rules/:id/edit",
        element: <AutomationRuleBuilder />,
      },

      // ============================================================
      // AUTOMATION RUNS
      // ============================================================

      {
        path: "runs",
        element: <AutomationRuns />,
      },

      {
        path: "runs/:id",
        element: <AutomationRunDetails />,
      },

      // ============================================================
      // NOTIFICATION PREFERENCES
      // ============================================================

      // Notification preferences were mock-only (email/Cliq delivery doesn't exist); rules notify in-app.
      { path: "notifications", element: <Navigate to="/automation/rules" replace /> },

      // ============================================================
      // ESCALATION RULES
      // ============================================================

      {
        path: "escalations",
        element: <AutomationEscalations />,
      },

      // ============================================================
      // AUTOMATION AUDIT
      // ============================================================

      {
        path: "audit",
        element: <AutomationAudit />,
      },
    ],
  },
];
