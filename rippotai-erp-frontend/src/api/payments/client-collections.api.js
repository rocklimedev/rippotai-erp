// Money collected from the client (token amount + project payments) — Command Center › Commercial.
import { baseApi } from '../../store/baseApi';

const TAG = 'ClientCollections';

export const clientCollectionsApi = baseApi.enhanceEndpoints({ addTagTypes: [TAG] }).injectEndpoints({
  endpoints: (builder) => ({
    getClientCollectionsSummary: builder.query({
      query: () => '/client-collections/summary',
      providesTags: [TAG],
    }),
    addClientCollection: builder.mutation({
      query: (body) => ({ url: '/client-collections', method: 'POST', body }),
      invalidatesTags: [TAG],
    }),
    deleteClientCollection: builder.mutation({
      query: (id) => ({ url: `/client-collections/${id}`, method: 'DELETE' }),
      invalidatesTags: [TAG],
    }),
  }),
});

export const {
  useGetClientCollectionsSummaryQuery,
  useAddClientCollectionMutation,
  useDeleteClientCollectionMutation,
} = clientCollectionsApi;
