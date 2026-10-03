import { baseApi } from "../../store/baseApi";

// CRM pipeline (deals) — runs on INOS's own data (/api/v1/leads).
// Zoho Bigin is optional: the backend mirrors writes when connected and
// POST /leads/sync/zoho imports Bigin deals.

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );

// Every cached board/list query gets the same optimistic patch.
const patchAllBoards = (dispatch, getState, recipe) => {
  const patches = [];
  const entries = leadsApi.util.selectInvalidatedBy(getState(), [{ type: "Leads", id: "BOARD" }]);
  for (const { endpointName, originalArgs } of entries) {
    if (endpointName !== "getBoard" && endpointName !== "getLeads") continue;
    patches.push(
      dispatch(
        leadsApi.util.updateQueryData(endpointName, originalArgs, (draft) =>
          recipe(draft, endpointName),
        ),
      ),
    );
  }
  return patches;
};

export const leadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ------------------------------------------------------------ board / list
    getBoard: builder.query({
      query: (filters = {}) => ({ url: "/leads/board", params: clean(filters) }),
      providesTags: [{ type: "Leads", id: "BOARD" }],
    }),

    getLeads: builder.query({
      query: (filters = {}) => ({ url: "/leads", params: clean(filters) }),
      providesTags: [{ type: "Leads", id: "BOARD" }],
    }),

    getLeadsMeta: builder.query({
      query: () => ({ url: "/leads/meta" }),
      providesTags: [{ type: "Leads", id: "META" }],
    }),

    getLead: builder.query({
      query: (id) => ({ url: `/leads/${id}` }),
      providesTags: (r, e, id) => [{ type: "Leads", id }],
    }),

    // ------------------------------------------------------------ create / update / delete
    createLead: builder.mutation({
      query: (body) => ({ url: "/leads", method: "POST", body }),
      invalidatesTags: [
        { type: "Leads", id: "BOARD" },
        { type: "Leads", id: "META" },
        "LeadActivity",
      ],
    }),

    updateLead: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leads/${id}`, method: "PUT", body }),
      invalidatesTags: (r, e, { id }) => [
        { type: "Leads", id: "BOARD" },
        { type: "Leads", id },
        "LeadActivity",
      ],
    }),

    deleteLead: builder.mutation({
      query: (id) => ({ url: `/leads/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Leads", id: "BOARD" }, "LeadActivity"],
    }),

    // ------------------------------------------------------------ stage move (optimistic)
    moveStage: builder.mutation({
      query: ({ id, stage, lostReason }) => ({
        url: `/leads/${id}/stage`,
        method: "PUT",
        body: { stage, lostReason },
      }),
      async onQueryStarted({ id, stage }, { dispatch, getState, queryFulfilled }) {
        const patches = patchAllBoards(dispatch, getState, (draft, endpoint) => {
          if (endpoint === "getLeads") {
            const row = draft.find?.((d) => d.id === id);
            if (row) row.stage = stage;
            return;
          }
          let moved;
          for (const col of draft.columns || []) {
            const idx = col.leads.findIndex((l) => l.id === id);
            if (idx !== -1) {
              [moved] = col.leads.splice(idx, 1);
              col.count = col.leads.length;
              col.total -= moved.amount || 0;
            }
          }
          const target = (draft.columns || []).find((c) => c.id === stage);
          if (moved && target) {
            moved.stage = stage;
            moved.daysInStage = 0;
            target.leads.unshift(moved);
            target.count = target.leads.length;
            target.total += moved.amount || 0;
          }
        });
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: (r, e, { id }) => [
        { type: "Leads", id: "BOARD" },
        { type: "Leads", id },
        "LeadActivity",
      ],
    }),

    // ------------------------------------------------------------ notes
    addNote: builder.mutation({
      query: ({ id, text }) => ({ url: `/leads/${id}/notes`, method: "POST", body: { text } }),
      invalidatesTags: (r, e, { id }) => [{ type: "Leads", id }, { type: "Leads", id: "BOARD" }],
    }),

    deleteNote: builder.mutation({
      query: ({ id, noteId }) => ({ url: `/leads/${id}/notes/${noteId}`, method: "DELETE" }),
      invalidatesTags: (r, e, { id }) => [{ type: "Leads", id }, { type: "Leads", id: "BOARD" }],
    }),

    // ------------------------------------------------------------ tasks
    addLeadTask: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leads/${id}/tasks`, method: "POST", body }),
      invalidatesTags: (r, e, { id }) => [{ type: "Leads", id }, { type: "Leads", id: "BOARD" }],
    }),

    updateLeadTask: builder.mutation({
      query: ({ id, taskId, ...body }) => ({
        url: `/leads/${id}/tasks/${taskId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Leads", id }, { type: "Leads", id: "BOARD" }],
    }),

    deleteLeadTask: builder.mutation({
      query: ({ id, taskId }) => ({ url: `/leads/${id}/tasks/${taskId}`, method: "DELETE" }),
      invalidatesTags: (r, e, { id }) => [{ type: "Leads", id }, { type: "Leads", id: "BOARD" }],
    }),

    // ------------------------------------------------------------ proposal
    setProposal: builder.mutation({
      query: ({ id, amount, timeline, remarks }) => ({
        url: `/leads/${id}/proposal`,
        method: "PUT",
        body: { amount, timeline, remarks },
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Leads", id }, { type: "Leads", id: "BOARD" }],
    }),

    // ------------------------------------------------------------ zoho bigin (optional)
    syncLeadsFromZoho: builder.mutation({
      query: () => ({ url: "/leads/sync/zoho", method: "POST" }),
      invalidatesTags: [{ type: "Leads", id: "BOARD" }, { type: "Leads", id: "META" }],
    }),

    // ------------------------------------------------------------ activity + review widgets
    getLeadActivities: builder.query({
      query: (filters = {}) => ({ url: "/leads/activity", params: clean(filters) }),
      providesTags: ["LeadActivity"],
    }),

    getReview: builder.query({
      query: (days = 7) => ({ url: "/leads/review", params: { days } }),
      providesTags: [{ type: "Leads", id: "BOARD" }],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetBoardQuery,
  useGetLeadsQuery,
  useGetLeadsMetaQuery,
  useGetLeadQuery,
  useCreateLeadMutation,
  useMoveStageMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useAddNoteMutation,
  useDeleteNoteMutation,
  useAddLeadTaskMutation,
  useUpdateLeadTaskMutation,
  useDeleteLeadTaskMutation,
  useSetProposalMutation,
  useSyncLeadsFromZohoMutation,
  useGetLeadActivitiesQuery,
  useGetReviewQuery,
} = leadsApi;
