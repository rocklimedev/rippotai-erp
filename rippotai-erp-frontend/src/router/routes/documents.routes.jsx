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
      { path: "activity", element: <DocumentActivity /> },
      { path: "forms/project-brief", element: <BriefForm /> },
      { path: "forms/site-reki", element: <SiteRekiForm /> },
      { path: "site-recce/:id", element: <SiteRekiView /> },
      { path: "brief/:id", element: <ProjectBriefView /> },
      { path: "drawings", element: <DrawingsAll /> },
      { path: "drawings/:id", element: <DrawingsView /> },
      { path: "drawings/upload", element: <DrawingUpload /> },
    ],
  },
];
