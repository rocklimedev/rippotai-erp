import { baseApi } from "../../store/baseApi";

export const checklistApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // CHECKLIST TEMPLATES
    // ============================================================

    /**
     * POST /site-ops/checklists/templates
     */
    createChecklistTemplate: builder.mutation({
      query: (body) => ({
        url: "/site-ops/checklists/templates",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ChecklistTemplates"],
    }),

    /**
     * POST /site-ops/checklists/items
     */
    addChecklistItem: builder.mutation({
      query: (body) => ({
        url: "/site-ops/checklists/items",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ChecklistTemplates"],
    }),

    /**
     * GET /site-ops/checklists/templates/:id
     */
    getChecklistTemplate: builder.query({
      query: (id) => `/site-ops/checklists/templates/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "ChecklistTemplates", id },
      ],
    }),

    /**
     * GET /site-ops/checklists/templates?tradeTeamId=3&stepId=12
     */
    getChecklistTemplates: builder.query({
      query: ({ tradeTeamId, stepId } = {}) => {
        const params = new URLSearchParams();

        if (tradeTeamId !== undefined && tradeTeamId !== null) {
          params.set("tradeTeamId", String(tradeTeamId));
        }

        if (stepId !== undefined && stepId !== null) {
          params.set("stepId", String(stepId));
        }

        const queryString = params.toString();

        return `/site-ops/checklists/templates${
          queryString ? `?${queryString}` : ""
        }`;
      },
      providesTags: ["ChecklistTemplates"],
    }),

    // ============================================================
    // QC SIGN-OFF
    // ============================================================

    /**
     * POST /site-ops/qc
     */
    recordQcSignOff: builder.mutation({
      query: (body) => ({
        url: "/site-ops/qc",
        method: "POST",
        body,
      }),
      invalidatesTags: ["QcSignOffs", "QcHandoffStatus"],
    }),

    /**
     * GET /site-ops/qc/:id
     */
    getQcSignOff: builder.query({
      query: (id) => `/site-ops/qc/${id}`,
      providesTags: (_result, _error, id) => [{ type: "QcSignOffs", id }],
    }),

    /**
     * GET /site-ops/qc/projects/:projectId/history
     */
    getQcProjectHistory: builder.query({
      query: (projectId) => `/site-ops/qc/projects/${projectId}/history`,
      providesTags: (_result, _error, projectId) => [
        { type: "QcSignOffs", id: `PROJECT-${projectId}` },
      ],
    }),

    /**
     * GET /site-ops/qc/projects/:projectId/handoff-status
     */
    getQcHandoffStatus: builder.query({
      query: (projectId) => `/site-ops/qc/projects/${projectId}/handoff-status`,
      providesTags: (_result, _error, projectId) => [
        { type: "QcHandoffStatus", id: projectId },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  // Checklist
  useCreateChecklistTemplateMutation,
  useAddChecklistItemMutation,
  useGetChecklistTemplateQuery,
  useGetChecklistTemplatesQuery,
  useLazyGetChecklistTemplatesQuery,

  // QC
  useRecordQcSignOffMutation,
  useGetQcSignOffQuery,
  useGetQcProjectHistoryQuery,
  useLazyGetQcProjectHistoryQuery,
  useGetQcHandoffStatusQuery,
  useLazyGetQcHandoffStatusQuery,
} = checklistApi;
