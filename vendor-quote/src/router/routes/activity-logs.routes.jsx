// src/router/activityLogRoutes.js
import ActivityLogs from "../../concepts/activity-logs/ActivityLogs";
export const activityLogRoutes = [
  {
    path: "/activity-logs",
    name: "Activity Logs",
    isSidebarActive: true,
    adminOnly: true,
    element: <ActivityLogs />,
  },
];
