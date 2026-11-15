import { Navigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import ProjectsDashboard from "@/pages/projects/ProjectsDashboard";
import ProjectNew from "@/pages/projects/ProjectNew";
import ProjectWorkspace from "@/pages/projects/ProjectWorkspace";
import ProjectHandover from "@/pages/projects/ProjectHandover";
import ProjectPlannerList from "../../pages/projects/ProjectPlannerList";
import ProjectPlannerView from "../../pages/projects/ProjectPlannerView";
import ProjectPlannerWorkspace from "../../pages/projects/ProjectPlannerWorkspace";
import DocumentView from "@/pages/documents/DocumentView";
import { DocumentUpload } from "@/pages/documents/DocumentUpload";
import SnapshotView from "@/pages/records/SnapshotView";

export const projectsRoutes = [
  {
    type: "layout",
    path: "/document",
    layout: AppLayout,
    layoutProps: { app: "projects" },
    blockRoles: ["client"],
    children: [
      { path: "upload", element: <DocumentUpload /> },
    ],
  },
  {
    type: "layout",
    path: "/projects",
    layout: AppLayout,
    layoutProps: { app: "projects" },
    blockRoles: ["client"],
    dynamicSections: { appKey: "projects", exclude: ["new", "all"] },
    children: [
      { index: true, element: <ProjectsDashboard /> },

      // "/projects/all" is the projects list (the index page), not a project id.
      { path: "all", element: <Navigate to="/projects" replace /> },
      { path: "new", element: <ProjectNew /> },
      { path: ":id/handover", element: <ProjectHandover /> },
      { path: ":id/edit", element: <ProjectNew /> },
      { path: "planner/list", element: <ProjectPlannerList /> },
      { path: "planner/create", element: <ProjectPlannerWorkspace /> },
      { path: "planner/:plannerId", element: <ProjectPlannerView /> },
      { path: ":id", element: <ProjectWorkspace /> },
      { path: "documents/upload", element: <DocumentUpload /> },
      { path: "documents/:id", element: <DocumentView /> },
      { path: "records/:type/snapshot/:snapshotId", element: <SnapshotView /> },
    ],
  },
];
