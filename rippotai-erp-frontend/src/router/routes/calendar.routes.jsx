import AppLayout from "@/layouts/AppLayout";
import CalendarPage from "@/pages/phasef/CalendarPage";
import { CalendarMine, CalendarTeam } from "@/pages/phasef/Calendar";

export const calendarRoutes = [
  {
    type: "layout",
    path: "/calendar",
    layout: AppLayout,
    layoutProps: { app: "calendar" },
    dynamicSections: { appKey: "calendar", exclude: ["mine", "team"] },
    children: [
      { index: true, element: <CalendarPage /> },
      { path: "mine", element: <CalendarMine /> },

      { path: "team", element: <CalendarTeam /> },
    ],
  },
];
