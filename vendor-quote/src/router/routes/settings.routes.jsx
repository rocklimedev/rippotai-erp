// src/router/settingsRoutes.js
import Settings from "../../concepts/settings/Settings";
export const settingsRoutes = [
  {
    path: "/settings",
    name: "Settings",
    isSidebarActive: true,
    adminOnly: true,
    element: <Settings />,
  },
];
