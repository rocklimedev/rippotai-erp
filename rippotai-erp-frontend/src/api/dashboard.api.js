import { baseApi } from "../store/baseApi";

export const dashboardApi = baseApi.injectEndpoints({
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
  overrideExisting: false,
});

export const {
  useGetDashboardLibraryQuery,
  useGetDashboardQuery,
  useSaveDashboardMutation,
  useResetDashboardMutation,
} = dashboardApi;
