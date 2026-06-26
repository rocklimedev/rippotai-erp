// src/router/reportRoutes.js
import Reports from "../../concepts/reports/Reports";
export const reportRoutes = [
  {
    path: "/reports",
    name: "Reports",
    isSidebarActive: true,
    element: <Reports />,
  },
];
