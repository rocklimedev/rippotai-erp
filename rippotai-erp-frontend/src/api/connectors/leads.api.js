import { baseApi } from "../../store/baseApi";

export const leadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // BOARD
    // ============================================================

    getBoard: builder.query({
      query: () => ({
        url: "/leads/board",
        method: "GET",
      }),
      providesTags: ["LeadsBoard"],
    }),

    // ============================================================
    // CREATE LEAD
    // ============================================================

    createLead: builder.mutation({
      query: (body) => ({
        url: "/leads",
        method: "POST",
        body,
      }),
      invalidatesTags: ["LeadsBoard"],
    }),

    // ============================================================
    // FLAT LEADS LIST
    // ============================================================

    getLeads: builder.query({
      query: ({ q, sort } = {}) => ({
        url: "/leads",
        method: "GET",
        params: { q, sort },
      }),
      providesTags: ["LeadsBoard"],
    }),

    // ============================================================
    // DELETE LEAD
    // ============================================================

    deleteLead: builder.mutation({
      query: (id) => ({
        url: `/leads/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LeadsBoard"],
    }),

    // ============================================================
    // MOVE STAGE
    // ============================================================

    moveStage: builder.mutation({
      query: ({ id, stage }) => ({
        url: `/leads/${id}/stage`,
        method: "PUT",
        body: { stage },
      }),

      async onQueryStarted({ id, stage }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          leadsApi.util.updateQueryData("getBoard", undefined, (draft) => {
            let moved;

            draft.columns.forEach((col) => {
              const idx = col.leads.findIndex((lead) => lead.id === id);

              if (idx !== -1) {
                [moved] = col.leads.splice(idx, 1);
              }
            });

            if (moved) {
              moved.stage = stage;

              const target = draft.columns.find((col) => col.id === stage);

              if (target) {
                target.leads.unshift(moved);
              }
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },

      invalidatesTags: ["LeadsBoard"],
    }),

    // ============================================================
    // GENERAL UPDATE
    // ============================================================

    updateLead: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/leads/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["LeadsBoard"],
    }),

    // ============================================================
    // ADD NOTE
    // ============================================================

    addNote: builder.mutation({
      query: ({ id, text }) => ({
        url: `/leads/${id}/notes`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: ["LeadsBoard"],
    }),

    // ============================================================
    // SET PROPOSAL
    // ============================================================

    setProposal: builder.mutation({
      query: ({ id, amount, timeline, remarks }) => ({
        url: `/leads/${id}/proposal`,
        method: "PUT",
        body: {
          amount,
          timeline,
          remarks,
        },
      }),
      invalidatesTags: ["LeadsBoard"],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetBoardQuery,
  useGetLeadsQuery,
  useCreateLeadMutation,
  useMoveStageMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useAddNoteMutation,
  useSetProposalMutation,
} = leadsApi;
