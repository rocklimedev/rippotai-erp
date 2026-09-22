import AppLayout from "@/layouts/AppLayout";

import TasksBoard from "@/pages/phasef/TasksBoard";

import { TaskNew } from "@/pages/phasef/Tasks";
import { TasksList } from "../../pages/phasef/Tasks";
export const tasksRoutes = [
  {
    type: "layout",
    path: "/tasks",
    layout: AppLayout,
    layoutProps: {
      app: "tasks",
    },

    dynamicSections: {
      appKey: "tasks",
      exclude: ["mine", "all", "overdue", "blocked", "completed", "new"],
    },

    children: [
      // ======================================================
      // TASKS BOARD
      // /tasks
      // ======================================================

      {
        index: true,
        element: <TasksBoard />,
      },

      // ======================================================
      // MY TASKS
      // /tasks/mine
      // ======================================================

      {
        path: "mine",
        element: <TasksList view="mine" />,
      },

      // ======================================================
      // ALL TASKS
      // /tasks/all
      // ======================================================

      {
        path: "all",
        element: <TasksList view="all" />,
      },

      // ======================================================
      // OVERDUE TASKS
      // /tasks/overdue
      // ======================================================

      {
        path: "overdue",
        element: <TasksList view="overdue" />,
      },

      // ======================================================
      // BLOCKED TASKS
      // /tasks/blocked
      // ======================================================

      {
        path: "blocked",
        element: <TasksList view="blocked" />,
      },

      // ======================================================
      // COMPLETED TASKS
      // /tasks/completed
      // ======================================================

      {
        path: "completed",
        element: <TasksList view="completed" />,
      },

      // ======================================================
      // CREATE TASK
      // /tasks/new
      // ======================================================

      {
        path: "new",
        element: <TaskNew />,
      },
    ],
  },
];
