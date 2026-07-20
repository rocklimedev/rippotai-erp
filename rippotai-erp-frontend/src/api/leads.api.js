import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";

export const leadsApi = createApi({
  reducerPath: "leadsApi",

  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/leads`,
  }),

  tagTypes: ["Board", "Leads", "Lead", "Review", "LeadActivity"],

  endpoints: (builder) => ({
    // ==========================================
    // LEADS
    // ==========================================

    getBoard: builder.query({
      query: () => "/board",
      providesTags: ["Board"],
    }),

    getLeads: builder.query({
      query: (params) => ({
        url: "",
        params,
      }),

      providesTags: ["Leads"],
    }),

    getLead: builder.query({
      query: (id) => `/${id}`,

      providesTags: (result, error, id) => [
        {
          type: "Lead",
          id,
        },
      ],
    }),

    getReview: builder.query({
      query: (stuckDays) => ({
        url: "/review",
        params: stuckDays ? { stuckDays } : {},
      }),

      providesTags: ["Review"],
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
        url: "/activity",
        params,
      }),

      providesTags: ["LeadActivity"],
    }),

    /**
     * GET ACTIVITIES BY LEAD
     *
     * GET /leads/activity/lead/:leadId
     */
    getLeadActivityByLead: builder.query({
      query: (leadId) => `/activity/lead/${leadId}`,

      providesTags: (result, error, leadId) => [
        {
          type: "LeadActivity",
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
        url: `/activity/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["LeadActivity", "Lead", "Board"],
    }),

    // ==========================================
    // CREATE / UPDATE LEADS
    // ==========================================

    createLead: builder.mutation({
      query: (body) => ({
        url: "",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Board", "Leads", "Review"],
    }),

    updateLead: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/${id}`,
        method: "PATCH",
        body,
      }),

      invalidatesTags: (result, error, { id }) => [
        {
          type: "Lead",
          id,
        },

        "Board",
        "Leads",
        "Review",
      ],
    }),

    deleteLead: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["Board", "Leads", "Review"],
    }),

    // ==========================================
    // STAGE / STATUS
    // ==========================================

    moveStage: builder.mutation({
      query: ({ id, stage, via }) => ({
        url: `/${id}/stage`,
        method: "PATCH",

        body: {
          stage,
          via,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        {
          type: "Lead",
          id,
        },

        "Board",
        "Leads",
        "Review",
      ],
    }),

    markNurture: builder.mutation({
      query: (id) => ({
        url: `/${id}/nurture`,
        method: "PATCH",
      }),

      invalidatesTags: (result, error, id) => [
        {
          type: "Lead",
          id,
        },

        "Board",
        "Leads",
        "Review",
      ],
    }),

    markLost: builder.mutation({
      query: (id) => ({
        url: `/${id}/lost`,
        method: "PATCH",
      }),

      invalidatesTags: (result, error, id) => [
        {
          type: "Lead",
          id,
        },

        "Board",
        "Leads",
        "Review",
      ],
    }),

    // ==========================================
    // NOTES
    // ==========================================

    addNote: builder.mutation({
      query: ({ id, text, author }) => ({
        url: `/${id}/notes`,

        method: "POST",

        body: {
          text,
          author,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        {
          type: "Lead",
          id,
        },

        "Board",
      ],
    }),

    // ==========================================
    // PROPOSAL
    // ==========================================

    setProposal: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/${id}/proposal`,

        method: "POST",

        body,
      }),

      invalidatesTags: (result, error, { id }) => [
        {
          type: "Lead",
          id,
        },

        "Board",
        "Leads",
      ],
    }),

    // ==========================================
    // DOCUMENTS
    // ==========================================

    updateDoc: builder.mutation({
      query: ({ id, docType, status }) => ({
        url: `/${id}/docs/${docType}`,

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
          type: "Lead",
          id,
        },
      ],
    }),

    // ==========================================
    // COLOR
    // ==========================================

    updateColor: builder.mutation({
      query: ({ id, color }) => ({
        url: `/${id}/color`,

        method: "PATCH",

        body: {
          color,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        {
          type: "Lead",
          id,
        },

        "Board",
      ],
    }),

    // ==========================================
    // FOLLOW UP
    // ==========================================

    updateFollowUp: builder.mutation({
      query: ({ id, followUp }) => ({
        url: `/${id}/follow-up`,

        method: "PATCH",

        body: {
          followUp,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        {
          type: "Lead",
          id,
        },
      ],
    }),
  }),
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
