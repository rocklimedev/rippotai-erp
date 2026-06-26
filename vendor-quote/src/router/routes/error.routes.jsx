// src/router/errorRoutes.js
import { Navigate } from "react-router-dom";

export const errorRoutes = [
  {
    path: "*",
    name: "Not Found",
    isSidebarActive: false,
    element: <Navigate to="/dashboard" replace />,
  },
];
