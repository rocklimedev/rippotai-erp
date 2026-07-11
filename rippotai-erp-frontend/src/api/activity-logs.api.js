import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("bc_token"); // aligned with AuthContext
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const cdnToken = import.meta.env.VITE_CDN_TOKEN;
    if (cdnToken) {
      headers.set("x-cdn-secret", cdnToken);
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
