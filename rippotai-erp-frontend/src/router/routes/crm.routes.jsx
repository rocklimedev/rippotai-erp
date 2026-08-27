import AppLayout from "@/layouts/AppLayout";

import AppDashboard from "@/components/dashboard/AppDashboard";
import BoardView from "@/components/leads/BoardView";

import ContactsView from "@/components/leads/ContactsView";
import SiteRecceList from "@/pages/documents/SiteRecceList";
import ProjectBriefList from "@/pages/documents/ProjectBriefList";
import PlanOfActionList from "@/pages/documents/PlanOfActionList";

import ScopeOfWorkList from "@/pages/documents/ScopeOfWorkList";
import NewLeadPage from "@/components/leads/NewLeadPage";

import { BriefForm } from "@/pages/documents/BriefForm";
import { SiteRekiForm } from "@/pages/documents/SiteRekiForm";
import { PlanOfActionForm } from "@/pages/documents/PlanOfActionForm";

import { ScopeOfWorkForm } from "@/pages/documents/ScopeOfWorkForm";

import DocumentActivity from "@/pages/documents/DocumentActivity";
import { SiteRekiView } from "../../pages/documents/SiteRekiView";
import { ProjectBriefView } from "../../pages/documents/ProjectBriefView";
import { PlanOfActionView } from "../../pages/documents/PlanOfActionView";

import { ScopeOfWorkView } from "../../pages/documents/ScopeOfWorkView";
import { BusinessProposalAll } from "../../pages/documents/BusinessProposal";
import ProposalBuilder from "../../pages/documents/ProposalBuilder";

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
        path: "business-proposal/all",
        element: <BusinessProposalAll />,
      },

      {
        path: "recce/:id",
        element: <SiteRekiView />,
      },
      {
        path: "brief/all",
        element: <ProjectBriefList />,
      },
      {
        path: "brief/:id",
        element: <ProjectBriefView />,
      },
      {
        path: "plan-of-action/all",
        element: <PlanOfActionList />,
      },
      {
        path: "plan-of-action/:id",
        element: <PlanOfActionView />,
      },

      {
        path: "scope-of-work/all",
        element: <ScopeOfWorkList />,
      },
      {
        path: "scope-of-work/:id",
        element: <ScopeOfWorkView />,
      },
      {
        path: "forms/project-brief",
        element: <BriefForm />,
      },
      {
        path: "forms/business-proposal",
        element: <ProposalBuilder />,
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
        path: "forms/scope-of-work",
        element: <ScopeOfWorkForm />,
      },
      {
        path: "forms/scope-of-work/:id/edit",
        element: <ScopeOfWorkForm />,
      },
      {
        path: "forms/plan-of-action/:id/edit",
        element: <PlanOfActionForm />,
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
