import AppLayout from "@/layouts/AppLayout";

import AppDashboard from "@/components/dashboard/AppDashboard";
import BoardView from "@/components/leads/BoardView";

import ContactsView from "@/components/leads/ContactsView";
import SiteRecceList from "@/pages/documents/SiteRecceList";
import ProjectBriefList from "@/pages/documents/ProjectBriefList";
import PlanOfActionList from "@/pages/documents/PlanOfActionList";
import PaymentScheduleList from "@/pages/documents/PaymentScheduleList";
import ScopeOfWorkList from "@/pages/documents/ScopeOfWorkList";
import NewLeadPage from "@/components/leads/NewLeadPage";

import { BriefForm } from "@/pages/documents/BriefForm";
import { SiteRekiForm } from "@/pages/documents/SiteRekiForm";
import { PlanOfActionForm } from "@/pages/documents/PlanOfActionForm";
import { PaymentScheduleForm } from "@/pages/documents/PaymentScheduleForm";
import { ScopeOfWorkForm } from "@/pages/documents/ScopeOfWorkForm";

import DocumentActivity from "@/pages/documents/DocumentActivity";

export const crmRoutes = [
  {
    type: "layout",
    path: "/crm",
    layout: AppLayout,
    layoutProps: {
      app: "crm",
    },

    dynamicSections: {
      appKey: "crm",

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
        element: <AppDashboard appKey="crm" />,
      },

      // ============================================================
      // PIPELINE
      // ============================================================

      {
        path: "pipeline",
        element: <BoardView />,
      },

      {
        path: "leads/new",
        element: <NewLeadPage />,
      },

      {
        path: "leads/sources",
        element: <ContactsView />,
      },

      // ============================================================
      // DOCUMENTS
      // ============================================================

      {
        path: "recce/all",
        element: <SiteRecceList />,
      },

      {
        path: "brief/all",
        element: <ProjectBriefList />,
      },

      {
        path: "plan-of-action/all",
        element: <PlanOfActionList />,
      },

      {
        path: "payment-schedule/all",
        element: <PaymentScheduleList />,
      },

      {
        path: "scope-of-work/all",
        element: <ScopeOfWorkList />,
      },

      {
        path: "forms/project-brief",
        element: <BriefForm />,
      },

      {
        path: "forms/site-reki",
        element: <SiteRekiForm />,
      },

      {
        path: "forms/plan-of-action",
        element: <PlanOfActionForm />,
      },

      {
        path: "forms/payment-schedule",
        element: <PaymentScheduleForm />,
      },

      {
        path: "forms/scope-of-work",
        element: <ScopeOfWorkForm />,
      },

      // ============================================================
      // SETTINGS
      // ============================================================

      {
        path: "activity",
        element: <DocumentActivity />,
      },
    ],
  },
];
