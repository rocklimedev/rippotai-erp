import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";
import ProjectsDashboard from "@/pages/projects/ProjectsDashboard";
import ProjectNew from "@/pages/projects/ProjectNew";
import ProjectWorkspace from "@/pages/projects/ProjectWorkspace";
import ProjectHandover from "@/pages/projects/ProjectHandover";
import ProjectActivity from "@/pages/projects/ProjectActivity";

export const projectsRoutes = [
  {
    type: "layout",
    path: "/projects",
    layout: AppLayout,
    layoutProps: { app: "projects" },
    blockRoles: ["client"],
    dynamicSections: { appKey: "projects", exclude: ["new", "all"] },
    children: [
      { index: true, element: <AppDashboard appKey="projects" /> },
      { path: "all", element: <ProjectsDashboard /> },
      { path: "activity", element: <ProjectActivity /> },
      { path: "new", element: <ProjectNew /> },
      { path: ":id/handover", element: <ProjectHandover /> },
      { path: ":id/edit", element: <ProjectNew /> },
      { path: ":id", element: <ProjectWorkspace /> },
    ],
  },
];
