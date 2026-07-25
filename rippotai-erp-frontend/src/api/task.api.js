import { baseApi } from "../store/baseApi";

export const tasksApi = baseApi.injectEndpoints({
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
    // Get My Tasks
    // =========================
    getMyTasks: builder.query({
      query: () => ({
        url: "/tasks/my-tasks",
      }),
      providesTags: [{ type: "Tasks", id: "MY_LIST" }],
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
    // Get My Board
    // =========================
    getMyTaskBoard: builder.query({
      query: () => ({
        url: "/tasks/my-board",
      }),
      providesTags: [{ type: "Tasks", id: "MY_BOARD" }],
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
        { type: "Tasks", id: "MY_LIST" },
        { type: "Tasks", id: "MY_BOARD" },
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
        { type: "Tasks", id: "MY_LIST" },
        { type: "Tasks", id: "MY_BOARD" },
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
        { type: "Tasks", id: "MY_LIST" },
        { type: "Tasks", id: "MY_BOARD" },
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
        { type: "Tasks", id: "MY_LIST" },
        { type: "Tasks", id: "MY_BOARD" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTasksQuery,
  useGetMyTasksQuery,
  useGetTaskBoardQuery,
  useGetMyTaskBoardQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useToggleTaskStatusMutation,
  useDeleteTaskMutation,
} = tasksApi;
