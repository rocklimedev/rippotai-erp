import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";
import NewLeadPage from "@/components/leads/NewLeadPage";
import ContactsView from "@/components/leads/ContactsView";
import LeadsActivity from "@/pages/leads/LeadsActivity";
import BoardView from "@/components/leads/BoardView";

export const leadsRoutes = [
  {
    type: "layout",
    path: "/leads",
    layout: AppLayout,
    layoutProps: { app: "leads" },
    dynamicSections: { appKey: "leads", exclude: [] },
    children: [
      { index: true, element: <AppDashboard appKey="leads" /> },
      { path: "new", element: <NewLeadPage /> },
      { path: "sources", element: <ContactsView /> },
      { path: "activity", element: <LeadsActivity /> },
      { path: "pipeline", element: <BoardView /> },
    ],
  },
];
