import { baseApi } from "../../store/baseApi";

export const siteVisitApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // VISIT ASSIGNMENTS
    // ============================================================

    /**
     * POST /site-ops/visits/assignments
     */
    createVisitAssignment: builder.mutation({
      query: (body) => ({
        url: "/site-ops/visits/assignments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SiteVisitAssignments"],
    }),

    /**
     * GET /site-ops/visits/assignments/projects/:projectId
     */
    getVisitAssignmentsByProject: builder.query({
      query: (projectId) =>
        `/site-ops/visits/assignments/projects/${projectId}`,
      providesTags: ["SiteVisitAssignments"],
    }),

    /**
     * PATCH /site-ops/visits/assignments/:id/deactivate
     */
    deactivateVisitAssignment: builder.mutation({
      query: (id) => ({
        url: `/site-ops/visits/assignments/${id}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["SiteVisitAssignments"],
    }),

    // ============================================================
    // SITE VISIT LOGGING
    // ============================================================

    /**
     * POST /site-ops/visits/log
     */
    logSiteVisit: builder.mutation({
      query: (body) => ({
        url: "/site-ops/visits/log",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SiteVisits"],
    }),

    /**
     * PATCH /site-ops/visits/log/:id
     */
    updateSiteVisit: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/site-ops/visits/log/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["SiteVisits"],
    }),

    /**
     * POST /site-ops/visits/log/:id/check-in
     */
    checkInSiteVisit: builder.mutation({
      query: (id) => ({
        url: `/site-ops/visits/log/${id}/check-in`,
        method: "POST",
      }),
      invalidatesTags: ["SiteVisits"],
    }),

    /**
     * GET /site-ops/visits/log/projects/:projectId?from=...&to=...
     */
    getSiteVisitLog: builder.query({
      query: ({ projectId, from, to }) => {
        const params = new URLSearchParams();

        if (from) params.set("from", from);
        if (to) params.set("to", to);

        const queryString = params.toString();

        return `/site-ops/visits/log/projects/${projectId}${
          queryString ? `?${queryString}` : ""
        }`;
      },
      providesTags: ["SiteVisits"],
    }),
  }),

  overrideExisting: false,
});

export const {
  useCreateVisitAssignmentMutation,
  useGetVisitAssignmentsByProjectQuery,
  useDeactivateVisitAssignmentMutation,

  useLogSiteVisitMutation,
  useUpdateSiteVisitMutation,
  useCheckInSiteVisitMutation,

  useGetSiteVisitLogQuery,
  useLazyGetSiteVisitLogQuery,
} = siteVisitApi;
