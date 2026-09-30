import { baseApi } from "../../store/baseApi";
export const siteOpsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // Visit Stages (master)
    // ============================================================
    getVisitStages: builder.query({
      query: (params) => ({
        url: "/architect/visit-stages",
        params: params?.includeInactive
          ? { include_inactive: "true" }
          : undefined,
      }),
      providesTags: ["VisitStages"],
    }),

    getVisitStageById: builder.query({
      query: (id) => `/architect/visit-stages/${id}`,
      providesTags: (_r, _e, id) => [{ type: "VisitStages", id }],
    }),

    createVisitStage: builder.mutation({
      query: (body) => ({
        url: "/architect/visit-stages",
        method: "POST",
        body,
      }),
      invalidatesTags: ["VisitStages"],
    }),

    updateVisitStage: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/architect/visit-stages/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        "VisitStages",
        { type: "VisitStages", id },
      ],
    }),

    // ============================================================
    // Architect Site Visits
    // ============================================================
    createSiteVisit: builder.mutation({
      query: (body) => ({
        url: "/architect/visits",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SiteVisits"],
    }),

    generateProjectVisits: builder.mutation({
      query: (body) => ({
        url: "/architect/visits/generate",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SiteVisits"],
    }),

    getSiteVisits: builder.query({
      query: (params = {}) => ({
        url: "/architect/visits",
        params: params || undefined,
      }),
      providesTags: ["SiteVisits"],
    }),

    getSiteVisitProgress: builder.query({
      query: (projectId) => `/architect/visits/progress/${projectId}`,
      providesTags: ["SiteVisits"],
    }),

    getSiteVisitById: builder.query({
      query: (id) => `/architect/visits/${id}`,
      providesTags: (_r, _e, id) => [{ type: "SiteVisits", id }],
    }),

    updateSiteVisit: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/architect/visits/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        "SiteVisits",
        { type: "SiteVisits", id },
      ],
    }),

    deleteSiteVisit: builder.mutation({
      query: (id) => ({
        url: `/architect/visits/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SiteVisits"],
    }),

    // ============================================================
    // Snags
    // ============================================================
    createSnag: builder.mutation({
      query: (body) => ({
        url: "/architect/snags",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Snags"],
    }),

    getSnags: builder.query({
      query: (params = {}) => ({
        url: "/architect/snags",
        params: params || undefined,
      }),
      providesTags: ["Snags"],
    }),

    getSnagSummary: builder.query({
      query: (projectId) => `/architect/snags/summary/${projectId}`,
      providesTags: ["Snags"],
    }),

    getSnagById: builder.query({
      query: (id) => `/architect/snags/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Snags", id }],
    }),

    updateSnag: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/architect/snags/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => ["Snags", { type: "Snags", id }],
    }),

    deleteSnag: builder.mutation({
      query: (id) => ({
        url: `/architect/snags/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Snags"],
    }),

    // ============================================================
    // RFIs
    // ============================================================
    raiseRfi: builder.mutation({
      query: (body) => ({
        url: "/site-ops/rfis",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Rfis"],
    }),

    getRfiById: builder.query({
      query: (id) => `/site-ops/rfis/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Rfis", id }],
    }),

    getRfisByProject: builder.query({
      query: ({ projectId, status }) => ({
        url: `/site-ops/rfis/projects/${projectId}`,
        params: status ? { status } : undefined,
      }),
      providesTags: ["Rfis"],
    }),

    getOpenRfisForTeam: builder.query({
      query: (teamId) => `/site-ops/rfis/teams/${teamId}/open`,
      providesTags: ["Rfis"],
    }),

    respondToRfi: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/site-ops/rfis/${id}/respond`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => ["Rfis", { type: "Rfis", id }],
    }),

    rerouteRfi: builder.mutation({
      query: ({ id, routedToTeamId }) => ({
        url: `/site-ops/rfis/${id}/reroute`,
        method: "PATCH",
        body: { routedToTeamId },
      }),
      invalidatesTags: (_r, _e, { id }) => ["Rfis", { type: "Rfis", id }],
    }),

    closeRfi: builder.mutation({
      query: (id) => ({
        url: `/site-ops/rfis/${id}/close`,
        method: "PATCH",
      }),
      invalidatesTags: (_r, _e, id) => ["Rfis", { type: "Rfis", id }],
    }),

    // ============================================================
    // Daily Site Reports
    // ============================================================
    createDailySiteReport: builder.mutation({
      query: (body) => ({
        url: "/site-ops/daily-reports",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DailySiteReports"],
    }),

    updateDailySiteReport: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/site-ops/daily-reports/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        "DailySiteReports",
        { type: "DailySiteReports", id },
      ],
    }),

    shareDailySiteReport: builder.mutation({
      query: (id) => ({
        url: `/site-ops/daily-reports/${id}/share`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [
        "DailySiteReports",
        { type: "DailySiteReports", id },
      ],
    }),

    getDailySiteReportById: builder.query({
      query: (id) => `/site-ops/daily-reports/${id}`,
      providesTags: (_r, _e, id) => [{ type: "DailySiteReports", id }],
    }),

    getDailySiteReportsByProject: builder.query({
      query: ({ projectId, from, to }) => ({
        url: `/site-ops/daily-reports/projects/${projectId}`,
        params: { from, to },
      }),
      providesTags: ["DailySiteReports"],
    }),

    getDailySiteReportByDate: builder.query({
      query: ({ projectId, reportDate }) =>
        `/site-ops/daily-reports/projects/${projectId}/date/${reportDate}`,
      providesTags: ["DailySiteReports"],
    }),

    // ============================================================
    // Mockups
    // ============================================================
    proposeMockup: builder.mutation({
      query: (body) => ({
        url: "/site-ops/mockups",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Mockups"],
    }),

    reviewMockup: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/site-ops/mockups/${id}/review`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => ["Mockups", { type: "Mockups", id }],
    }),

    getMockupById: builder.query({
      query: (id) => `/site-ops/mockups/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Mockups", id }],
    }),

    getMockupsByProject: builder.query({
      query: ({ projectId, status }) => ({
        url: `/site-ops/mockups/projects/${projectId}`,
        params: status ? { status } : undefined,
      }),
      providesTags: ["Mockups"],
    }),

    // ============================================================
    // Quality (simple heads + project checks)
    // ============================================================
    getQualityItems: builder.query({
      query: (params) => ({
        url: "/architect/quality/items",
        params: params?.includeInactive
          ? { include_inactive: "true" }
          : undefined,
      }),
      providesTags: ["QualityItems"],
    }),

    createQualityItem: builder.mutation({
      query: (body) => ({
        url: "/architect/quality/items",
        method: "POST",
        body,
      }),
      invalidatesTags: ["QualityItems"],
    }),

    getProjectQualityChecks: builder.query({
      query: (params) => ({
        url: "/architect/quality/checks",
        params,
      }),
      providesTags: ["QualityChecks"],
    }),

    upsertQualityCheck: builder.mutation({
      query: (body) => ({
        url: "/architect/quality/checks",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["QualityChecks"],
    }),

    getQualitySummary: builder.query({
      query: (projectId) => `/architect/quality/summary/${projectId}`,
      providesTags: ["QualityChecks"],
    }),

    // ============================================================
    // Quality Checklists (detailed work-head)
    // ============================================================
    getQualityChecklistTemplates: builder.query({
      query: () => "/quality-checklists/templates",
      providesTags: ["QualityChecklists"],
    }),

    getQualityChecklistTemplate: builder.query({
      query: (workHead) => `/quality-checklists/templates/${workHead}`,
      providesTags: ["QualityChecklists"],
    }),

    createQualityChecklistFromTemplate: builder.mutation({
      query: (body) => ({
        url: "/quality-checklists/from-template",
        method: "POST",
        body,
      }),
      invalidatesTags: ["QualityChecklists"],
    }),

    getQualityChecklistsByProject: builder.query({
      query: ({ projectId, ...params }) => ({
        url: `/quality-checklists/project/${projectId}`,
        params,
      }),
      providesTags: ["QualityChecklists"],
    }),

    getQualityChecklistById: builder.query({
      query: (id) => `/quality-checklists/${id}`,
      providesTags: (_r, _e, id) => [{ type: "QualityChecklists", id }],
    }),

    completeQualityChecklist: builder.mutation({
      query: (id) => ({
        url: `/quality-checklists/${id}/complete`,
        method: "PUT",
      }),
      invalidatesTags: (_r, _e, id) => [
        "QualityChecklists",
        { type: "QualityChecklists", id },
      ],
    }),

    // ============================================================
    // Admin Daily Logs
    // ============================================================
    createAdminDailyLog: builder.mutation({
      query: (body) => ({
        url: "/dpr/admin-logs",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminDailyLogs"],
    }),

    getAdminDailyLogs: builder.query({
      query: (params) => ({
        url: "/dpr/admin-logs",
        params,
      }),
      providesTags: ["AdminDailyLogs"],
    }),

    getAdminDailyLogSummary: builder.query({
      query: () => "/dpr/admin-logs/summary",
      providesTags: ["AdminDailyLogs"],
    }),

    getAdminDailyLogById: builder.query({
      query: (id) => `/dpr/admin-logs/${id}`,
      providesTags: (_r, _e, id) => [{ type: "AdminDailyLogs", id }],
    }),

    updateAdminDailyLog: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/dpr/admin-logs/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        "AdminDailyLogs",
        { type: "AdminDailyLogs", id },
      ],
    }),

    deleteAdminDailyLog: builder.mutation({
      query: (id) => ({
        url: `/dpr/admin-logs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminDailyLogs"],
    }),
  }),
  overrideExisting: false,
});

export const {
  // Visit stages
  useGetVisitStagesQuery,
  useGetVisitStageByIdQuery,
  useCreateVisitStageMutation,
  useUpdateVisitStageMutation,

  // Site visits
  useCreateSiteVisitMutation,
  useGenerateProjectVisitsMutation,
  useGetSiteVisitsQuery,
  useGetSiteVisitProgressQuery,
  useGetSiteVisitByIdQuery,
  useUpdateSiteVisitMutation,
  useDeleteSiteVisitMutation,

  // Snags
  useCreateSnagMutation,
  useGetSnagsQuery,
  useGetSnagSummaryQuery,
  useGetSnagByIdQuery,
  useUpdateSnagMutation,
  useDeleteSnagMutation,

  // RFIs
  useRaiseRfiMutation,
  useGetRfiByIdQuery,
  useGetRfisByProjectQuery,
  useGetOpenRfisForTeamQuery,
  useRespondToRfiMutation,
  useRerouteRfiMutation,
  useCloseRfiMutation,

  // Daily reports
  useCreateDailySiteReportMutation,
  useUpdateDailySiteReportMutation,
  useShareDailySiteReportMutation,
  useGetDailySiteReportByIdQuery,
  useGetDailySiteReportsByProjectQuery,
  useGetDailySiteReportByDateQuery,

  // Mockups
  useProposeMockupMutation,
  useReviewMockupMutation,
  useGetMockupByIdQuery,
  useGetMockupsByProjectQuery,

  // Quality
  useGetQualityItemsQuery,
  useCreateQualityItemMutation,
  useGetProjectQualityChecksQuery,
  useUpsertQualityCheckMutation,
  useGetQualitySummaryQuery,

  // Quality checklists
  useGetQualityChecklistTemplatesQuery,
  useGetQualityChecklistTemplateQuery,
  useCreateQualityChecklistFromTemplateMutation,
  useGetQualityChecklistsByProjectQuery,
  useGetQualityChecklistByIdQuery,
  useCompleteQualityChecklistMutation,

  // Admin daily logs
  useCreateAdminDailyLogMutation,
  useGetAdminDailyLogsQuery,
  useGetAdminDailyLogSummaryQuery,
  useGetAdminDailyLogByIdQuery,
  useUpdateAdminDailyLogMutation,
  useDeleteAdminDailyLogMutation,
} = siteOpsApi;
