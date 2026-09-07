import AppLayout from "@/layouts/AppLayout";
import TasksBoard from "@/pages/phasef/TasksBoard";
import { TasksMine, TaskNew } from "@/pages/phasef/Tasks";
import { TasksAll } from "@/pages/phasef/Tasks";

export const tasksRoutes = [
  {
    type: "layout",
    path: "/tasks",
    layout: AppLayout,
    layoutProps: { app: "tasks" },
    dynamicSections: { appKey: "tasks", exclude: ["mine", "all", "new"] },
    children: [
      { index: true, element: <TasksBoard /> },
      { path: "mine", element: <TasksMine /> },

      { path: "all", element: <TasksAll /> },
      { path: "new", element: <TaskNew /> },
    ],
  },
];
