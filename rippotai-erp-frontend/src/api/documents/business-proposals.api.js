import { baseApi } from "../../store/baseApi";

export const businessProposalsApi = baseApi.enhanceEndpoints({
  addTagTypes: ["BusinessProposals"],
}).injectEndpoints({
  endpoints: (builder) => ({
    getBusinessProposals: builder.query({
      query: ({ projectId, search } = {}) => ({
        url: "/business-proposals",
        params: { ...(projectId ? { project_id: projectId } : {}), ...(search ? { search } : {}) },
      }),
      providesTags: (result) => [
        { type: "BusinessProposals", id: "LIST" },
        ...(result || []).map(({ id }) => ({ type: "BusinessProposals", id })),
      ],
    }),
    getBusinessProposal: builder.query({
      query: (id) => ({ url: `/business-proposals/${encodeURIComponent(id)}` }),
      providesTags: (result, error, id) => [{ type: "BusinessProposals", id }],
    }),
    createBusinessProposal: builder.mutation({
      query: (body) => ({ url: "/business-proposals", method: "POST", body }),
      invalidatesTags: (result, error) => error ? [] : [{ type: "BusinessProposals", id: "LIST" }],
    }),
    updateBusinessProposal: builder.mutation({
      query: ({ id, body }) => ({ url: `/business-proposals/${encodeURIComponent(id)}`, method: "PUT", body }),
      invalidatesTags: (result, error, { id }) => error ? [] : [
        { type: "BusinessProposals", id },
        { type: "BusinessProposals", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBusinessProposalsQuery,
  useGetBusinessProposalQuery,
  useCreateBusinessProposalMutation,
  useUpdateBusinessProposalMutation,
} = businessProposalsApi;
