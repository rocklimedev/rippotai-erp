import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:3000/api/v1",
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token"); // Your token key

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

export const activityLogsApi = createApi({
  reducerPath: "activityLogsApi",
  baseQuery,
  tagTypes: ["ActivityLogs"],

  endpoints: (builder) => ({
    // =========================
    // ACTIVITY LOGS
    // =========================

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
  }),
});

// =========================
// EXPORT HOOKS
// =========================

export const { useCreateActivityLogMutation, useGetActivityLogsQuery } =
  activityLogsApi;
