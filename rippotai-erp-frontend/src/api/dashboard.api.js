import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("bc_token");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery,
  tagTypes: ["Dashboard"],
  endpoints: (builder) => ({
    // GET /dashboards/library/:appKey
    getDashboardLibrary: builder.query({
      query: (appKey) => `/dashboards/library/${appKey}`,
    }),

    // GET /dashboards/:appKey
    getDashboard: builder.query({
      query: (appKey) => `/dashboards/${appKey}`,
      providesTags: (result, error, appKey) => [
        { type: "Dashboard", id: appKey },
      ],
    }),

    // PUT /dashboards/:appKey
    saveDashboard: builder.mutation({
      query: ({ appKey, layout, hidden_keys }) => ({
        url: `/dashboards/${appKey}`,
        method: "PUT",
        body: {
          layout,
          hidden_keys,
        },
      }),
      invalidatesTags: (result, error, { appKey }) => [
        { type: "Dashboard", id: appKey },
      ],
    }),

    // POST /dashboards/:appKey/reset
    resetDashboard: builder.mutation({
      query: (appKey) => ({
        url: `/dashboards/${appKey}/reset`,
        method: "POST",
      }),
      invalidatesTags: (result, error, appKey) => [
        { type: "Dashboard", id: appKey },
      ],
    }),
  }),
});

export const {
  useGetDashboardLibraryQuery,
  useGetDashboardQuery,
  useSaveDashboardMutation,
  useResetDashboardMutation,
} = dashboardApi;
