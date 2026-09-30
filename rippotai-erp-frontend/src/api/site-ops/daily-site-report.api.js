import { baseApi } from "../../store/baseApi";

export const dailySiteReportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // DAILY SITE REPORTS
    // ============================================================

    /**
     * POST /site-ops/daily-reports
     */
    createDailySiteReport: builder.mutation({
      query: (body) => ({
        url: "/site-ops/daily-reports",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DailySiteReports"],
    }),

    /**
     * PATCH /site-ops/daily-reports/:id
     */
    updateDailySiteReport: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/site-ops/daily-reports/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "DailySiteReports",
        { type: "DailySiteReports", id },
      ],
    }),

    /**
     * POST /site-ops/daily-reports/:id/share
     */
    shareDailySiteReport: builder.mutation({
      query: (id) => ({
        url: `/site-ops/daily-reports/${id}/share`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        "DailySiteReports",
        { type: "DailySiteReports", id },
      ],
    }),

    /**
     * GET /site-ops/daily-reports/:id
     */
    getDailySiteReport: builder.query({
      query: (id) => `/site-ops/daily-reports/${id}`,
      providesTags: (_result, _error, id) => [{ type: "DailySiteReports", id }],
    }),

    /**
     * GET /site-ops/daily-reports/projects/:projectId
     *
     * Optional:
     * ?from=2026-08-01&to=2026-08-31
     */
    getDailySiteReportsByProject: builder.query({
      query: ({ projectId, from, to }) => {
        const params = new URLSearchParams();

        if (from) {
          params.set("from", from);
        }

        if (to) {
          params.set("to", to);
        }

        const queryString = params.toString();

        return `/site-ops/daily-reports/projects/${projectId}${
          queryString ? `?${queryString}` : ""
        }`;
      },
      providesTags: (_result, _error, { projectId }) => [
        {
          type: "DailySiteReports",
          id: `PROJECT-${projectId}`,
        },
      ],
    }),

    /**
     * GET /site-ops/daily-reports/projects/:projectId/date/:reportDate
     *
     * Example:
     * /site-ops/daily-reports/projects/12/date/2026-08-25
     */
    getDailySiteReportByDate: builder.query({
      query: ({ projectId, reportDate }) =>
        `/site-ops/daily-reports/projects/${projectId}/date/${reportDate}`,
      providesTags: (_result, _error, { projectId, reportDate }) => [
        {
          type: "DailySiteReports",
          id: `PROJECT-${projectId}-DATE-${reportDate}`,
        },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useCreateDailySiteReportMutation,
  useUpdateDailySiteReportMutation,
  useShareDailySiteReportMutation,

  useGetDailySiteReportQuery,

  useGetDailySiteReportsByProjectQuery,
  useLazyGetDailySiteReportsByProjectQuery,

  useGetDailySiteReportByDateQuery,
  useLazyGetDailySiteReportByDateQuery,
} = dailySiteReportApi;
