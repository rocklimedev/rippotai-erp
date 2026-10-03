// Native (INOS database) Tasks, Notes, Calendar feed, Activity feed and Client overview.
// Backend: src/modules/tasks, src/modules/calendar, src/modules/workspace.
import { baseApi } from "../../store/baseApi";

const api = baseApi.enhanceEndpoints({
  addTagTypes: ["WsTasks", "WsNotes", "WsCalendar", "WsActivity", "WsClientOverview"],
});

const clean = (o = {}) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== "all"));

export const workspaceApi = api.injectEndpoints({
  endpoints: (b) => ({
    /* ---------------- tasks ---------------- */
    getWsTasks: b.query({
      query: (params = {}) => ({ url: "/tasks", params: clean(params) }),
      providesTags: (r) => [...(r || []).map((t) => ({ type: "WsTasks", id: t.id })), { type: "WsTasks", id: "LIST" }],
    }),
    getWsMyTasks: b.query({
      query: () => "/tasks/my-tasks",
      providesTags: [{ type: "WsTasks", id: "LIST" }],
    }),
    getWsTask: b.query({
      query: (id) => `/tasks/${id}`,
      providesTags: (r, e, id) => [{ type: "WsTasks", id }],
    }),
    createWsTask: b.mutation({
      query: (body) => ({ url: "/tasks", method: "POST", body }),
      invalidatesTags: [{ type: "WsTasks", id: "LIST" }, "WsCalendar", "WsActivity"],
    }),
    updateWsTask: b.mutation({
      query: ({ id, ...body }) => ({ url: `/tasks/${id}`, method: "PATCH", body }),
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled, getState }) {
        // optimistic update for board drag & drop / quick status changes
        const undo = [];
        for (const { endpointName, originalArgs } of workspaceApi.util.selectInvalidatedBy(getState(), [{ type: "WsTasks", id: "LIST" }])) {
          if (endpointName !== "getWsTasks" && endpointName !== "getWsMyTasks") continue;
          undo.push(
            dispatch(
              workspaceApi.util.updateQueryData(endpointName, originalArgs, (draft) => {
                const t = draft.find((x) => x.id === id);
                if (t) Object.assign(t, patch);
              }),
            ),
          );
        }
        try {
          await queryFulfilled;
        } catch {
          undo.forEach((u) => u.undo());
        }
      },
      invalidatesTags: (r, e, { id }) => [{ type: "WsTasks", id }, { type: "WsTasks", id: "LIST" }, "WsCalendar", "WsActivity"],
    }),
    deleteWsTask: b.mutation({
      query: (id) => ({ url: `/tasks/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "WsTasks", id: "LIST" }, "WsCalendar", "WsActivity"],
    }),

    /* ---------------- notes ---------------- */
    getWsNotes: b.query({
      query: (params = {}) => ({ url: "/notes", params: clean(params) }),
      providesTags: [{ type: "WsNotes", id: "LIST" }],
    }),
    createWsNote: b.mutation({
      query: (body) => ({ url: "/notes", method: "POST", body }),
      invalidatesTags: [{ type: "WsNotes", id: "LIST" }, "WsClientOverview"],
    }),
    updateWsNote: b.mutation({
      query: ({ id, ...body }) => ({ url: `/notes/${id}`, method: "PATCH", body }),
      invalidatesTags: [{ type: "WsNotes", id: "LIST" }, "WsClientOverview"],
    }),
    deleteWsNote: b.mutation({
      query: (id) => ({ url: `/notes/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "WsNotes", id: "LIST" }, "WsClientOverview"],
    }),

    /* ---------------- calendar ---------------- */
    getWsCalendarFeed: b.query({
      query: ({ from, to, mine } = {}) => ({ url: "/calendar/feed", params: clean({ from, to, mine: mine ? 1 : undefined }) }),
      providesTags: ["WsCalendar"],
    }),
    createWsEvent: b.mutation({
      query: (body) => ({ url: "/calendar/events", method: "POST", body }),
      invalidatesTags: ["WsCalendar", "WsActivity"],
    }),
    updateWsEvent: b.mutation({
      query: ({ id, ...body }) => ({ url: `/calendar/events/${id}`, method: "PATCH", body }),
      invalidatesTags: ["WsCalendar", "WsActivity"],
    }),
    deleteWsEvent: b.mutation({
      query: (id) => ({ url: `/calendar/events/${id}`, method: "DELETE" }),
      invalidatesTags: ["WsCalendar", "WsActivity"],
    }),

    /* ---------------- activity ---------------- */
    getWsActivity: b.query({
      query: (params = {}) => ({ url: "/activity-logs/feed", params: clean(params) }),
      providesTags: ["WsActivity"],
    }),

    /* ---------------- inventory ---------------- */
    getWsInventoryOverview: b.query({
      query: (projectId) => ({ url: "/inventory-overview", params: clean({ projectId }) }),
    }),

    /* ---------------- clients ---------------- */
    getWsClientsSummary: b.query({
      query: () => "/clients-summary",
      providesTags: ["WsClientOverview"],
    }),
    getWsClientOverview: b.query({
      query: (id) => `/clients/${id}/overview`,
      providesTags: (r, e, id) => [{ type: "WsClientOverview", id }, "WsClientOverview"],
    }),
  }),
});

export const {
  useGetWsTasksQuery,
  useGetWsMyTasksQuery,
  useGetWsTaskQuery,
  useCreateWsTaskMutation,
  useUpdateWsTaskMutation,
  useDeleteWsTaskMutation,
  useGetWsNotesQuery,
  useCreateWsNoteMutation,
  useUpdateWsNoteMutation,
  useDeleteWsNoteMutation,
  useGetWsCalendarFeedQuery,
  useCreateWsEventMutation,
  useUpdateWsEventMutation,
  useDeleteWsEventMutation,
  useGetWsActivityQuery,
  useGetWsClientsSummaryQuery,
  useGetWsClientOverviewQuery,
  useGetWsInventoryOverviewQuery,
} = workspaceApi;
