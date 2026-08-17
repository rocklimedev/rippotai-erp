import AppLayout from "@/layouts/AppLayout";
import DocumentsDashboard from "@/pages/documents/DocumentsDashboard";
import { DrawingUpload, DrawingsAll } from "@/pages/documents/DocumentsRoutes";
import { SiteRekiView } from "@/pages/documents/SiteRekiView";
import { BriefForm } from "@/pages/documents/BriefForm";
import { SiteRekiForm } from "@/pages/documents/SiteRekiForm";
import { ProjectDocuments } from "@/pages/documents/ProjectDocument";
import { DocumentsAll } from "@/pages/documents/DocumentsAll";
import { DocumentUpload } from "@/pages/documents/DocumentUpload";
import ProjectBriefList from "@/pages/documents/ProjectBriefList";
import SiteRecceList from "@/pages/documents/SiteRecceList";
import DocumentActivity from "@/pages/documents/DocumentActivity";
import { ProjectBriefView } from "@/pages/documents/ProjectBriefView";
import DrawingsView from "@/pages/documents/DrawingsView";
import { PlanOfActionForm } from "../../pages/documents/PlanOfActionForm";
import PlanOfActionList from "../../pages/documents/PlanOfActionList";
import { PlanOfActionView } from "../../pages/documents/PlanOfActionView";
import { PaymentScheduleForm } from "../../pages/documents/PaymentScheduleForm";
import PaymentScheduleList from "../../pages/documents/PaymentScheduleList";
import PaymentSchedulePage from "../../pages/documents/paymentSchedulePage";

export const documentsRoutes = [
  {
    type: "layout",
    path: "/documents",
    layout: AppLayout,
    layoutProps: { app: "documents" },
    dynamicSections: {
      appKey: "documents",
      exclude: [
        "all",
        "upload",
        "project-documents",
        "forms/project-brief",
        "forms/site-reki",
        "drawings",
        "drawings/upload",
      ],
    },
    children: [
      { index: true, element: <DocumentsDashboard /> },
      { path: "all", element: <DocumentsAll /> },
      { path: "upload", element: <DocumentUpload /> },
      { path: "project-documents", element: <ProjectDocuments /> },
      { path: "brief/all", element: <ProjectBriefList /> },
      { path: "recce/all", element: <SiteRecceList /> },
      { path: "payment-schedule/all", element: <PaymentScheduleList /> },
      { path: "plan-of-action/all", element: <PlanOfActionList /> },
      { path: "activity", element: <DocumentActivity /> },
      { path: "forms/project-brief", element: <BriefForm /> },
      { path: "forms/site-reki", element: <SiteRekiForm /> },
      { path: "forms/payment-schedule", element: <PaymentScheduleForm /> },
      { path: "forms/plan-of-action", element: <PlanOfActionForm /> },
      { path: "site-recce/:id", element: <SiteRekiView /> },
      { path: "brief/:id", element: <ProjectBriefView /> },
      {
        path: "payment-schedule/:scheduleId",
        element: <PaymentSchedulePage />,
      },
      { path: "drawings", element: <DrawingsAll /> },
      { path: "plan-of-action/:id", element: <PlanOfActionView /> },
      { path: "drawings/:id", element: <DrawingsView /> },
      { path: "drawings/upload", element: <DrawingUpload /> },
    ],
  },
];
