import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";

export const tasksApi = createApi({
  reducerPath: "tasksApi",

  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("bc_token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const cdnToken = import.meta.env.VITE_CDN_TOKEN;
      if (cdnToken) {
        headers.set("x-cdn-secret", cdnToken);
      }

      return headers;
    },
  }),

  tagTypes: ["Tasks"],

  endpoints: (builder) => ({
    // =========================
    // Get All Tasks
    // =========================
    getTasks: builder.query({
      query: () => ({
        url: "/tasks",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((task) => ({
                type: "Tasks",
                id: task.id,
              })),
              { type: "Tasks", id: "LIST" },
            ]
          : [{ type: "Tasks", id: "LIST" }],
    }),

    // =========================
    // Get Board
    // =========================
    getTaskBoard: builder.query({
      query: () => ({
        url: "/tasks/board",
      }),
      providesTags: [{ type: "Tasks", id: "BOARD" }],
    }),

    // =========================
    // Get Task By ID
    // =========================
    getTaskById: builder.query({
      query: (id) => ({
        url: `/tasks/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Tasks", id }],
    }),

    // =========================
    // Create Task
    // =========================
    createTask: builder.mutation({
      query: (body) => ({
        url: "/tasks",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Tasks", id: "LIST" },
        { type: "Tasks", id: "BOARD" },
      ],
    }),

    // =========================
    // Update Task
    // =========================
    updateTask: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/tasks/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Tasks", id },
        { type: "Tasks", id: "LIST" },
        { type: "Tasks", id: "BOARD" },
      ],
    }),

    // =========================
    // Toggle Task Status
    // =========================
    toggleTaskStatus: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Tasks", id },
        { type: "Tasks", id: "LIST" },
        { type: "Tasks", id: "BOARD" },
      ],
    }),

    // =========================
    // Delete Task
    // =========================
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Tasks", id: "LIST" },
        { type: "Tasks", id: "BOARD" },
      ],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskBoardQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useToggleTaskStatusMutation,
  useDeleteTaskMutation,
} = tasksApi;
