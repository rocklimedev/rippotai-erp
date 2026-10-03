import { baseApi } from "../../store/baseApi";

export const siteOperationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =========================================================
    // DAILY SITE REPORTS
    // Controller: /site-ops/daily-reports
    // =========================================================

    // GET /site-ops/daily-reports?projectId=&from=&to=&status=&hasIssues=
    listDailySiteReports: builder.query({
      query: ({ projectId, from, to, status, hasIssues } = {}) => ({
        url: "/site-ops/daily-reports",
        params: {
          projectId: projectId || undefined,
          from: from || undefined,
          to: to || undefined,
          status: status || undefined,
          hasIssues: hasIssues ? "true" : undefined,
        },
      }),
      providesTags: ["DailySiteReports"],
    }),

    createDailySiteReport: builder.mutation({
      query: (body) => ({
        url: "/site-ops/daily-reports",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DailySiteReports", "SiteOpsDashboard"],
    }),

    updateDailySiteReport: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/site-ops/daily-reports/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["DailySiteReports", "SiteOpsDashboard"],
    }),

    shareDailySiteReport: builder.mutation({
      query: (id) => ({
        url: `/site-ops/daily-reports/${id}/share`,
        method: "POST",
      }),
      invalidatesTags: ["DailySiteReports", "SiteOpsDashboard"],
    }),

    deleteDailySiteReport: builder.mutation({
      query: (id) => ({
        url: `/site-ops/daily-reports/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DailySiteReports", "SiteOpsDashboard"],
    }),

    // POST /site-ops/daily-reports/photos (multipart "file") -> { url, filename, originalName }
    uploadDailyReportPhoto: builder.mutation({
      query: (file) => {
        const body = new FormData();
        body.append("file", file);
        return { url: "/site-ops/daily-reports/photos", method: "POST", body };
      },
    }),

    getDailySiteReport: builder.query({
      query: (id) => `/site-ops/daily-reports/${id}`,
      providesTags: (result, error, id) => [
        { type: "DailySiteReports", id },
        "DailySiteReports",
      ],
    }),

    getDailySiteReportsByProject: builder.query({
      query: ({ projectId, from, to }) => {
        const params = new URLSearchParams();

        if (from) params.append("from", from);
        if (to) params.append("to", to);

        const queryString = params.toString();

        return `/site-ops/daily-reports/projects/${projectId}${
          queryString ? `?${queryString}` : ""
        }`;
      },
      providesTags: (result, error, { projectId }) => [
        { type: "DailySiteReports", id: `PROJECT-${projectId}` },
        "DailySiteReports",
      ],
    }),

    getDailySiteReportByDate: builder.query({
      query: ({ projectId, reportDate }) =>
        `/site-ops/daily-reports/projects/${projectId}/date/${reportDate}`,
      providesTags: (result, error, { projectId, reportDate }) => [
        {
          type: "DailySiteReports",
          id: `${projectId}-${reportDate}`,
        },
      ],
    }),

    // GET /site-ops/dashboard?projectId= — stats + recent rows for the dashboard widgets
    getSiteOpsDashboard: builder.query({
      query: ({ projectId } = {}) => ({
        url: "/site-ops/dashboard",
        params: { projectId: projectId || undefined },
      }),
      providesTags: ["SiteOpsDashboard", "DailySiteReports"],
    }),

    // =========================================================
    // MOCKUPS
    // Controller: /site-ops/mockups
    // =========================================================

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
      invalidatesTags: (result, error, { id }) => [
        "Mockups",
        { type: "Mockups", id },
      ],
    }),

    getMockup: builder.query({
      query: (id) => `/site-ops/mockups/${id}`,
      providesTags: (result, error, id) => [{ type: "Mockups", id }],
    }),

    getMockupsByProject: builder.query({
      query: ({ projectId, status }) => {
        const params = new URLSearchParams();

        if (status) params.append("status", status);

        const queryString = params.toString();

        return `/site-ops/mockups/projects/${projectId}${
          queryString ? `?${queryString}` : ""
        }`;
      },
      providesTags: (result, error, { projectId }) => [
        { type: "Mockups", id: `PROJECT-${projectId}` },
        "Mockups",
      ],
    }),
    // GET /site-ops/mockups?projectId=<uuid>&status — all projects when projectId is omitted
    listMockups: builder.query({
      query: ({ projectId, status } = {}) => ({
        url: "/site-ops/mockups",
        params: { projectId: projectId || undefined, status: status || undefined },
      }),
      providesTags: ["Mockups"],
    }),

    getProjectMockups: builder.query({
      query: ({ projectId, status } = {}) => {
        const params = new URLSearchParams();

        if (status) params.append("status", status);

        const queryString = params.toString();

        return `/site-ops/mockups/projects/${projectId}${
          queryString ? `?${queryString}` : ""
        }`;
      },

      providesTags: (result, error, { projectId }) => [
        { type: "Mockups", id: `PROJECT-${projectId}` },
        "Mockups",
      ],
    }),
    // =========================================================
    // QC CHECKLISTS
    // Controller: /site-ops/checklists
    // =========================================================

    createChecklistTemplate: builder.mutation({
      query: (body) => ({
        url: "/site-ops/checklists/templates",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ChecklistTemplates"],
    }),

    addChecklistItem: builder.mutation({
      query: (body) => ({
        url: "/site-ops/checklists/items",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ChecklistTemplates"],
    }),

    getChecklistTemplate: builder.query({
      query: (id) => `/site-ops/checklists/templates/${id}`,
      providesTags: (result, error, id) => [{ type: "ChecklistTemplates", id }],
    }),

    getChecklistTemplates: builder.query({
      query: ({ tradeTeamId, stepId } = {}) => {
        const params = new URLSearchParams();

        if (tradeTeamId !== undefined && tradeTeamId !== null) {
          params.append("tradeTeamId", tradeTeamId);
        }

        if (stepId !== undefined && stepId !== null) {
          params.append("stepId", stepId);
        }

        const queryString = params.toString();

        return `/site-ops/checklists/templates${
          queryString ? `?${queryString}` : ""
        }`;
      },
      providesTags: ["ChecklistTemplates"],
    }),
    getDailySiteReports: builder.query({
      query: ({ projectId, from, to, status } = {}) => {
        const params = new URLSearchParams();

        if (projectId) params.append("projectId", projectId);
        if (from) params.append("from", from);
        if (to) params.append("to", to);
        if (status) params.append("status", status);

        const queryString = params.toString();

        return `/site-ops/daily-reports${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: ["DailySiteReports"],
    }),
    // =========================================================
    // QC SIGN-OFFS
    // Controller: /site-ops/qc
    // =========================================================

    recordQcSignOff: builder.mutation({
      query: (body) => ({
        url: "/site-ops/qc",
        method: "POST",
        body,
      }),
      invalidatesTags: ["QcSignOffs"],
    }),

    getQcSignOff: builder.query({
      query: (id) => `/site-ops/qc/${id}`,
      providesTags: (result, error, id) => [{ type: "QcSignOffs", id }],
    }),

    getQcProjectHistory: builder.query({
      query: (projectId) => `/site-ops/qc/projects/${projectId}/history`,
      providesTags: (result, error, projectId) => [
        { type: "QcSignOffs", id: `PROJECT-${projectId}` },
        "QcSignOffs",
      ],
    }),

    // GET /site-ops/qc/handoff-status?projectId=<uuid> — latest result per project/step/trade (all projects when omitted)
    getQcHandoffStatus: builder.query({
      query: (projectId) => ({
        url: "/site-ops/qc/handoff-status",
        params: { projectId: projectId || undefined },
      }),
      providesTags: (result, error, projectId) => [
        { type: "QcSignOffs", id: `HANDOFF-${projectId || "ALL"}` },
        "QcSignOffs",
      ],
    }),
    getProjectQcHandoffStatus: builder.query({
      query: (projectId) => `/site-ops/qc/projects/${projectId}/handoff-status`,

      providesTags: (result, error, projectId) => [
        {
          type: "QcSignOffs",
          id: `HANDOFF-${projectId}`,
        },
      ],
    }),
    // =========================================================
    // RFIs / DESIGN CLARIFICATIONS
    // Controller: /site-ops/rfis
    // =========================================================

    raiseRfi: builder.mutation({
      query: (body) => ({
        url: "/site-ops/rfis",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Rfis"],
    }),

    rerouteRfi: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/site-ops/rfis/${id}/reroute`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Rfis",
        { type: "Rfis", id },
      ],
    }),

    respondToRfi: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/site-ops/rfis/${id}/respond`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Rfis",
        { type: "Rfis", id },
      ],
    }),

    closeRfi: builder.mutation({
      query: (id) => ({
        url: `/site-ops/rfis/${id}/close`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => ["Rfis", { type: "Rfis", id }],
    }),

    getRfi: builder.query({
      query: (id) => `/site-ops/rfis/${id}`,
      providesTags: (result, error, id) => [{ type: "Rfis", id }],
    }),

    // GET /site-ops/rfis?projectId=<uuid>&status — all projects when projectId is omitted
    listRfis: builder.query({
      query: ({ projectId, status } = {}) => ({
        url: "/site-ops/rfis",
        params: { projectId: projectId || undefined, status: status || undefined },
      }),
      providesTags: ["Rfis"],
    }),

    getRfisByProject: builder.query({
      query: ({ projectId, status }) => {
        const params = new URLSearchParams();

        if (status) params.append("status", status);

        const queryString = params.toString();

        return `/site-ops/rfis/projects/${projectId}${
          queryString ? `?${queryString}` : ""
        }`;
      },
      providesTags: (result, error, { projectId }) => [
        { type: "Rfis", id: `PROJECT-${projectId}` },
        "Rfis",
      ],
    }),

    getOpenRfisForTeam: builder.query({
      query: (teamId) => `/site-ops/rfis/teams/${teamId}/open`,
      providesTags: (result, error, teamId) => [
        { type: "Rfis", id: `TEAM-${teamId}` },
        "Rfis",
      ],
    }),
    getProjectRfis: builder.query({
      query: ({ projectId, status } = {}) => {
        const params = new URLSearchParams();

        if (status) params.append("status", status);

        const queryString = params.toString();

        return `/site-ops/rfis/projects/${projectId}${
          queryString ? `?${queryString}` : ""
        }`;
      },

      providesTags: (result, error, { projectId }) => [
        { type: "Rfis", id: `PROJECT-${projectId}` },
        "Rfis",
      ],
    }),
    getProjectQcHistory: builder.query({
      query: (projectId) => `/site-ops/qc/projects/${projectId}/history`,

      providesTags: (result, error, projectId) => [
        {
          type: "QcSignOffs",
          id: `PROJECT-${projectId}`,
        },
        "QcSignOffs",
      ],
    }),
    // =========================================================
    // SITE VISITS
    // Controller: /site-ops/visits
    // =========================================================

    createVisitAssignment: builder.mutation({
      query: (body) => ({
        url: "/site-ops/visits/assignments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SiteVisits"],
    }),

    getVisitAssignmentsByProject: builder.query({
      query: (projectId) =>
        `/site-ops/visits/assignments/projects/${projectId}`,
      providesTags: (result, error, projectId) => [
        {
          type: "SiteVisits",
          id: `ASSIGNMENTS-${projectId}`,
        },
        "SiteVisits",
      ],
    }),

    deactivateVisitAssignment: builder.mutation({
      query: (id) => ({
        url: `/site-ops/visits/assignments/${id}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["SiteVisits"],
    }),

    logSiteVisit: builder.mutation({
      query: (body) => ({
        url: "/site-ops/visits/log",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SiteVisits"],
    }),

    updateSiteVisit: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/site-ops/visits/log/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "SiteVisits",
        { type: "SiteVisits", id },
      ],
    }),

    checkInSiteVisit: builder.mutation({
      query: (id) => ({
        url: `/site-ops/visits/log/${id}/check-in`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        "SiteVisits",
        { type: "SiteVisits", id },
      ],
    }),
    getVisitAssignments: builder.query({
      query: ({ projectId, status } = {}) => {
        const params = new URLSearchParams();

        if (projectId) params.append("projectId", projectId);
        if (status) params.append("status", status);

        const queryString = params.toString();

        return `/site-ops/visits/assignments${
          queryString ? `?${queryString}` : ""
        }`;
      },
      providesTags: ["SiteVisits"],
    }),
    getSiteVisitLog: builder.query({
      query: ({ projectId, from, to } = {}) => {
        const params = new URLSearchParams();

        if (from) params.append("from", from);
        if (to) params.append("to", to);

        const queryString = params.toString();

        return `/site-ops/visits/log/projects/${projectId}${
          queryString ? `?${queryString}` : ""
        }`;
      },

      providesTags: (result, error, { projectId }) => [
        {
          type: "SiteVisits",
          id: `LOG-${projectId}`,
        },
        "SiteVisits",
      ],
    }),
    // GET /site-ops/qc/history?projectId=<uuid>&from&to&status — all projects when projectId is omitted
    getQcHistory: builder.query({
      query: (arg = {}) => {
        const { projectId, from, to, status } = typeof arg === "string" ? { projectId: arg } : arg || {};
        const params = new URLSearchParams();

        if (projectId) params.append("projectId", projectId);
        if (from) params.append("from", from);
        if (to) params.append("to", to);
        if (status) params.append("status", status);

        const queryString = params.toString();

        return `/site-ops/qc/history${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: ["QcSignOffs"],
    }),
  }),

  overrideExisting: false,
});

export const {
  // =========================================================
  // DAILY SITE REPORTS
  // =========================================================

  useListDailySiteReportsQuery,
  useDeleteDailySiteReportMutation,
  useUploadDailyReportPhotoMutation,
  useGetSiteOpsDashboardQuery,
  useCreateDailySiteReportMutation,
  useUpdateDailySiteReportMutation,
  useShareDailySiteReportMutation,
  useGetDailySiteReportQuery,
  useGetDailySiteReportsByProjectQuery,
  useGetDailySiteReportByDateQuery,
  useGetDailySiteReportsQuery,
  // =========================================================
  // MOCKUPS
  // =========================================================

  useProposeMockupMutation,
  useReviewMockupMutation,
  useGetMockupQuery,
  useGetMockupsByProjectQuery,
  useGetProjectMockupsQuery,
  useListMockupsQuery,
  // =========================================================
  // CHECKLISTS
  // =========================================================

  useCreateChecklistTemplateMutation,
  useAddChecklistItemMutation,
  useGetChecklistTemplateQuery,
  useGetChecklistTemplatesQuery,

  // =========================================================
  // QC SIGN-OFFS
  // =========================================================

  useRecordQcSignOffMutation,
  useGetQcSignOffQuery,
  useGetQcProjectHistoryQuery,
  useGetQcHandoffStatusQuery,
  useGetQcHistoryQuery,
  useGetProjectQcHandoffStatusQuery,
  useGetProjectQcHistoryQuery,
  useGetProjectRfisQuery,
  // =========================================================
  // RFIs
  // =========================================================

  useRaiseRfiMutation,
  useRerouteRfiMutation,
  useRespondToRfiMutation,
  useCloseRfiMutation,
  useGetRfiQuery,
  useGetRfisByProjectQuery,
  useListRfisQuery,
  useGetOpenRfisForTeamQuery,

  // =========================================================
  // SITE VISITS
  // =========================================================
  useGetVisitAssignmentsQuery,
  useCreateVisitAssignmentMutation,
  useGetVisitAssignmentsByProjectQuery,
  useDeactivateVisitAssignmentMutation,
  useLogSiteVisitMutation,
  useUpdateSiteVisitMutation,
  useCheckInSiteVisitMutation,
  useGetSiteVisitLogQuery,
} = siteOperationsApi;
