// src/router/dashboardRoutes.js
import Dashboard from "../../concepts/dashboard/Dashboard";
export const dashboardRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    isSidebarActive: true,
    element: <Dashboard />,
  },
];
