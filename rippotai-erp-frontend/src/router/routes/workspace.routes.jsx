import AppLayout from "@/layouts/AppLayout";
import ClientsPage from "@/pages/workspace/ClientsPage";
import ClientDetail from "@/pages/workspace/ClientDetail";
import ClientForm from "@/pages/workspace/ClientForm";
import ActivityPage from "@/pages/workspace/ActivityPage";
import ChatsPage from "@/pages/workspace/ChatsPage";

// Cross-app workspace pages: client directory, global activity, notes shortcut, chats.
export const workspaceRoutes = [
  {
    type: "layout",
    path: "/clients",
    layout: AppLayout,
    layoutProps: { app: "projects" },
    children: [
      { index: true, element: <ClientsPage /> },
      { path: "new", element: <ClientForm /> },
      { path: ":id/edit", element: <ClientForm /> },
      { path: ":id", element: <ClientDetail /> },
    ],
  },
  {
    type: "layout",
    path: "/activity",
    layout: AppLayout,
    layoutProps: { app: "adminConsole" },
    children: [{ index: true, element: <ActivityPage /> }],
  },
  {
    type: "layout",
    path: "/chats",
    layout: AppLayout,
    layoutProps: { app: "commandCenter" },
    children: [{ index: true, element: <ChatsPage /> }],
  },
  { type: "redirect", path: "/notes", to: "/tasks/notes" },
];
