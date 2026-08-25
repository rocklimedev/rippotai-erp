import AppLayout from "@/layouts/AppLayout";
import DocumentsDashboard from "@/pages/documents/DocumentsDashboard";

import { DocumentsAll } from "@/pages/documents/DocumentsAll";
import { DocumentUpload } from "@/pages/documents/DocumentUpload";

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
    ],
  },
];
