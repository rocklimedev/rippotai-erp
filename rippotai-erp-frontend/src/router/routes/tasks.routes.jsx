import { Navigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";

// Native INOS tasks (database-backed)
import TasksPage from "@/pages/workspace/TasksPage";
import TaskForm from "@/pages/workspace/TaskForm";
import TaskDetail from "@/pages/workspace/TaskDetail";
import NotesPage from "@/pages/workspace/NotesPage";

// Zoho Projects board (connector) — kept reachable at /tasks/zoho
import TasksBoard from "@/pages/phasef/TasksBoard";

export const tasksRoutes = [
  {
    type: "layout",
    path: "/tasks",
    layout: AppLayout,
    layoutProps: { app: "tasks" },

    dynamicSections: {
      appKey: "tasks",
      exclude: ["mine", "all", "overdue", "blocked", "completed", "new", "notes", "zoho"],
    },

    children: [
      // No customisable dashboard for this app — send stray links home.
      { path: "edit-dashboard", element: <Navigate to="/tasks" replace /> },
      { index: true, element: <TasksPage view="board" /> },
      { path: "mine", element: <TasksPage view="mine" /> },
      { path: "all", element: <TasksPage view="all" /> },
      { path: "overdue", element: <TasksPage view="overdue" /> },
      { path: "blocked", element: <TasksPage view="blocked" /> },
      { path: "completed", element: <TasksPage view="completed" /> },
      { path: "new", element: <TaskForm /> },
      { path: "notes", element: <NotesPage /> },
      { path: "zoho", element: <TasksBoard /> },
      { path: ":id/edit", element: <TaskForm /> },
      { path: ":id", element: <TaskDetail /> },
    ],
  },
];
