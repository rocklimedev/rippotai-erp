import AppLayout from "@/layouts/AppLayout";
import TasksBoard from "@/pages/phasef/TasksBoard";
import { TasksMine, TaskNew } from "@/pages/phasef/Tasks";
import { TasksAll } from "@/pages/phasef/Tasks";
import TaskActivity from "@/pages/phasef/TaskActivity";

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
      { path: "activity", element: <TaskActivity /> },
      { path: "all", element: <TasksAll /> },
      { path: "new", element: <TaskNew /> },
    ],
  },
];
