import { baseApi } from "../../store/baseApi";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /dashboards/library/:appKey — static widget catalogue
    getDashboardLibrary: builder.query({
      query: (appKey) => `/dashboards/library/${appKey}`,
      keepUnusedDataFor: 3600,
    }),

    // GET /dashboards/:appKey — the user's layout
    getDashboard: builder.query({
      query: (appKey) => `/dashboards/${appKey}`,
      providesTags: (result, error, appKey) => [
        { type: "Dashboard", id: appKey },
      ],
    }),

    // PUT /dashboards/:appKey — optimistic: the cached layout is patched
    // immediately and rolled back if the server rejects it. No refetch, so
    // the grid never flickers back to an older layout after a save.
    saveDashboard: builder.mutation({
      query: ({ appKey, layout, hidden_keys }) => ({
        url: `/dashboards/${appKey}`,
        method: "PUT",
        body: {
          layout: layout.map(({ key, x, y, w, h }) => ({ key, x, y, w, h })),
          hidden_keys,
        },
      }),
      async onQueryStarted(
        { appKey, layout, hidden_keys },
        { dispatch, queryFulfilled },
      ) {
        const patch = dispatch(
          dashboardApi.util.updateQueryData("getDashboard", appKey, (d) => {
            d.layout = layout;
            d.hidden_keys = hidden_keys;
          }),
        );
        try {
          const { data } = await queryFulfilled;
          if (data?.layout) {
            dispatch(
              dashboardApi.util.updateQueryData(
                "getDashboard",
                appKey,
                (d) => {
                  d.layout = data.layout;
                  d.hidden_keys = data.hidden_keys || [];
                },
              ),
            );
          }
        } catch {
          patch.undo();
        }
      },
    }),

    // POST /dashboards/:appKey/reset — back to the app's default layout
    resetDashboard: builder.mutation({
      query: (appKey) => ({
        url: `/dashboards/${appKey}/reset`,
        method: "POST",
      }),
      async onQueryStarted(appKey, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            dashboardApi.util.updateQueryData("getDashboard", appKey, (d) => {
              d.layout = data?.layout || d.default_layout || [];
              d.hidden_keys = [];
            }),
          );
        } catch {
          /* surfaced by the caller */
        }
      },
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
