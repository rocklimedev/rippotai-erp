import { baseApi } from "../store/baseApi";
export const activityLogsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createActivityLog: builder.mutation({
      query: (body) => ({
        url: "/activity-logs",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ActivityLogs"],
    }),

    getActivityLogs: builder.query({
      query: ({ user_id, action, entity_type, entity_id } = {}) => {
        const params = new URLSearchParams();
        if (user_id) params.append("user_id", user_id);
        if (action) params.append("action", action);
        if (entity_type) params.append("entity_type", entity_type);
        if (entity_id) params.append("entity_id", entity_id);
        return `/activity-logs?${params.toString()}`;
      },
      providesTags: ["ActivityLogs"],
    }),
    getActivityLogByEntityLabel: builder.query({
      query: ({ user_id, action, entity_type, entity_id } = {}) => {
        const params = new URLSearchParams();
        if (user_id) params.append("user_id", user_id);
        if (action) params.append("action", action);
        if (entity_type) params.append("entity_type", entity_type);
        if (entity_id) params.append("entity_id", entity_id);
        return `/activity-logs?${params.toString()}`;
      },
      providesTags: ["ActivityLogs"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateActivityLogMutation,
  useGetActivityLogsQuery,
  useGetActivityLogByEntityLabelQuery,
} = activityLogsApi;
