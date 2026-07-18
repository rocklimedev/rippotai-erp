import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const leadsApi = createApi({
  reducerPath: "leadsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/leads" }),
  tagTypes: ["Board", "Leads", "Lead", "Review"],
  endpoints: (builder) => ({
    getBoard: builder.query({
      query: () => "/board",
      providesTags: ["Board"],
    }),
    getLeads: builder.query({
      // params: { q, stage, sort }
      query: (params) => ({ url: "", params }),
      providesTags: ["Leads"],
    }),
    getLead: builder.query({
      query: (id) => `/${id}`,
      providesTags: (r, e, id) => [{ type: "Lead", id }],
    }),
    getReview: builder.query({
      query: (stuckDays) => ({
        url: "/review",
        params: stuckDays ? { stuckDays } : {},
      }),
      providesTags: ["Review"],
    }),
    createLead: builder.mutation({
      query: (body) => ({ url: "", method: "POST", body }),
      invalidatesTags: ["Board", "Leads", "Review"],
    }),
    updateLead: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/${id}`, method: "PATCH", body }),
      invalidatesTags: (r, e, { id }) => [
        { type: "Lead", id },
        "Board",
        "Leads",
        "Review",
      ],
    }),
    deleteLead: builder.mutation({
      query: (id) => ({ url: `/${id}`, method: "DELETE" }),
      invalidatesTags: ["Board", "Leads", "Review"],
    }),
    moveStage: builder.mutation({
      query: ({ id, stage, via }) => ({
        url: `/${id}/stage`,
        method: "PATCH",
        body: { stage, via },
      }),
      invalidatesTags: (r, e, { id }) => [
        { type: "Lead", id },
        "Board",
        "Leads",
        "Review",
      ],
    }),
    markNurture: builder.mutation({
      query: (id) => ({ url: `/${id}/nurture`, method: "PATCH" }),
      invalidatesTags: (r, e, id) => [
        { type: "Lead", id },
        "Board",
        "Leads",
        "Review",
      ],
    }),
    markLost: builder.mutation({
      query: (id) => ({ url: `/${id}/lost`, method: "PATCH" }),
      invalidatesTags: (r, e, id) => [
        { type: "Lead", id },
        "Board",
        "Leads",
        "Review",
      ],
    }),
    addNote: builder.mutation({
      query: ({ id, text, author }) => ({
        url: `/${id}/notes`,
        method: "POST",
        body: { text, author },
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Lead", id }, "Board"],
    }),
    setProposal: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/${id}/proposal`,
        method: "POST",
        body,
      }),
      invalidatesTags: (r, e, { id }) => [
        { type: "Lead", id },
        "Board",
        "Leads",
      ],
    }),
    updateDoc: builder.mutation({
      query: ({ id, docType, status }) => ({
        url: `/${id}/docs/${docType}`,
        method: "PATCH",
        body: status === undefined ? {} : { status },
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Lead", id }],
    }),
    updateColor: builder.mutation({
      query: ({ id, color }) => ({
        url: `/${id}/color`,
        method: "PATCH",
        body: { color },
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Lead", id }, "Board"],
    }),
    updateFollowUp: builder.mutation({
      query: ({ id, followUp }) => ({
        url: `/${id}/follow-up`,
        method: "PATCH",
        body: { followUp },
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Lead", id }],
    }),
  }),
});

export const {
  useGetBoardQuery,
  useGetLeadsQuery,
  useGetLeadQuery,
  useGetReviewQuery,
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
