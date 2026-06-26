// src/router/projectRoutes.js
import ProjectDetail from "../../concepts/projects/ProjectDetail";
import ProjectsList from "../../concepts/projects/ProjectsList";
export const projectRoutes = [
  {
    path: "/projects",
    name: "Projects",
    isSidebarActive: true,
    element: <ProjectsList />,
  },
  {
    path: "/projects/:id",
    name: "Project Detail",
    isSidebarActive: false,
    element: <ProjectDetail />,
  },
];
