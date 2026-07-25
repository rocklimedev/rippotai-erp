import { baseApi } from "../store/baseApi";

export const leadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==========================================
    // LEADS
    // ==========================================

    getBoard: builder.query({
      query: () => "/leads/board",
      providesTags: ["Leads"],
    }),

    getLeads: builder.query({
      query: (params) => ({
        url: "/leads",
        params,
      }),

      providesTags: ["Leads"],
    }),

    getLead: builder.query({
      query: (id) => `/leads/${id}`,

      providesTags: (result, error, id) => [
        {
          type: "Leads",
          id,
        },
      ],
    }),

    getReview: builder.query({
      query: (stuckDays) => ({
        url: "/leads/review",
        params: stuckDays ? { stuckDays } : {},
      }),

      providesTags: ["Leads"],
    }),

    // ==========================================
    // LEAD ACTIVITY
    // ==========================================

    /**
     * GET ALL ACTIVITIES
     *
     * GET /leads/activity
     *
     * query params:
     *
     * {
     *   leadId,
     *   date_from,
     *   date_to
     * }
     */
    getLeadActivities: builder.query({
      query: (params) => ({
        url: "/leads/activity",
        params,
      }),

      providesTags: ["Leads"],
    }),

    /**
     * GET ACTIVITIES BY LEAD
     *
     * GET /leads/activity/lead/:leadId
     */
    getLeadActivityByLead: builder.query({
      query: (leadId) => `/leads/activity/lead/${leadId}`,

      providesTags: (result, error, leadId) => [
        {
          type: "Leads",
          id: leadId,
        },
      ],
    }),

    /**
     * DELETE ACTIVITY
     *
     * DELETE /leads/activity/:id
     */
    deleteLeadActivity: builder.mutation({
      query: (id) => ({
        url: `/leads/activity/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["Leads"],
    }),

    // ==========================================
    // CREATE / UPDATE LEADS
    // ==========================================

    createLead: builder.mutation({
      query: (body) => ({
        url: "/leads",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Leads"],
    }),

    updateLead: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/leads/${id}`,
        method: "PATCH",
        body,
      }),

      invalidatesTags: (result, error, { id }) => [
        {
          type: "Leads",
          id,
        },

        "Leads",
      ],
    }),

    deleteLead: builder.mutation({
      query: (id) => ({
        url: `/leads/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["Leads"],
    }),

    // ==========================================
    // STAGE / STATUS
    // ==========================================

    moveStage: builder.mutation({
      query: ({ id, stage, via }) => ({
        url: `/leads/${id}/stage`,
        method: "PATCH",

        body: {
          stage,
          via,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        {
          type: "Leads",
          id,
        },

        "Leads",
      ],
    }),

    markNurture: builder.mutation({
      query: (id) => ({
        url: `/leads/${id}/nurture`,
        method: "PATCH",
      }),

      invalidatesTags: (result, error, id) => [
        {
          type: "Leads",
          id,
        },

        "Leads",
      ],
    }),

    markLost: builder.mutation({
      query: (id) => ({
        url: `/leads/${id}/lost`,
        method: "PATCH",
      }),

      invalidatesTags: (result, error, id) => [
        {
          type: "Leads",
          id,
        },

        "Leads",
      ],
    }),

    // ==========================================
    // NOTES
    // ==========================================

    addNote: builder.mutation({
      query: ({ id, text, author }) => ({
        url: `/leads/${id}/notes`,

        method: "POST",

        body: {
          text,
          author,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        {
          type: "Leads",
          id,
        },

        "Leads",
      ],
    }),

    // ==========================================
    // PROPOSAL
    // ==========================================

    setProposal: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/leads/${id}/proposal`,

        method: "POST",

        body,
      }),

      invalidatesTags: (result, error, { id }) => [
        {
          type: "Leads",
          id,
        },

        "Leads",
      ],
    }),

    // ==========================================
    // DOCUMENTS
    // ==========================================

    updateDoc: builder.mutation({
      query: ({ id, docType, status }) => ({
        url: `/leads/${id}/docs/${docType}`,

        method: "PATCH",

        body:
          status === undefined
            ? {}
            : {
                status,
              },
      }),

      invalidatesTags: (result, error, { id }) => [
        {
          type: "Leads",
          id,
        },
      ],
    }),

    // ==========================================
    // COLOR
    // ==========================================

    updateColor: builder.mutation({
      query: ({ id, color }) => ({
        url: `/leads/${id}/color`,

        method: "PATCH",

        body: {
          color,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        {
          type: "Leads",
          id,
        },

        "Leads",
      ],
    }),

    // ==========================================
    // FOLLOW UP
    // ==========================================

    updateFollowUp: builder.mutation({
      query: ({ id, followUp }) => ({
        url: `/leads/${id}/follow-up`,

        method: "PATCH",

        body: {
          followUp,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        {
          type: "Leads",
          id,
        },
      ],
    }),
  }),
  overrideExisting: false,
});

// ==========================================
// HOOK EXPORTS
// ==========================================

export const {
  // Leads
  useGetBoardQuery,
  useGetLeadsQuery,
  useGetLeadQuery,
  useGetReviewQuery,

  // Activity
  useGetLeadActivitiesQuery,
  useGetLeadActivityByLeadQuery,
  useDeleteLeadActivityMutation,

  // Mutations
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useMoveStageMutation,
  useMarkNurtureMutation,
  useMarkLostMutation,
  useAddNoteMutation,
  useSetProposalMutation,
  useUpdateDocMutation,
  useUpdateColorMutation,
  useUpdateFollowUpMutation,
} = leadsApi;
