import { Navigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import CalendarView from "@/pages/workspace/CalendarView";
// Zoho / Google connector calendar — kept reachable at /calendar/connected
import CalendarPage from "@/pages/phasef/CalendarPage";

export const calendarRoutes = [
  {
    type: "layout",
    path: "/calendar",
    layout: AppLayout,
    layoutProps: { app: "calendar" },
    dynamicSections: { appKey: "calendar", exclude: ["mine", "team", "connected"] },
    children: [
      // No customisable dashboard for this app — send stray links home.
      { path: "edit-dashboard", element: <Navigate to="/calendar" replace /> },
      { index: true, element: <CalendarView scope="team" /> },
      { path: "mine", element: <CalendarView scope="mine" /> },
      { path: "team", element: <CalendarView scope="team" /> },
      { path: "connected", element: <CalendarPage /> },
    ],
  },
];
