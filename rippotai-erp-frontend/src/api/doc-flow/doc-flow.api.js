// Shared review workflow + revisions for every flow document (DocumentListPage).
import { baseApi } from "../../store/baseApi";

export const docFlowApi = baseApi.enhanceEndpoints({ addTagTypes: ["DocReviews"] }).injectEndpoints({
  endpoints: (builder) => ({
    getDocMeta: builder.query({
      query: (type) => ({ url: "/document-reviews/meta", params: { entity_type: type } }),
      providesTags: (r, e, type) => [{ type: "DocReviews", id: `meta:${type}` }],
    }),
    getDocRows: builder.query({
      query: (type) => ({ url: "/document-reviews/rows", params: { entity_type: type } }),
      providesTags: (r, e, type) => [{ type: "DocReviews", id: `rows:${type}` }],
    }),
    getDocCapabilities: builder.query({
      query: (type) => ({ url: "/document-reviews/capabilities", params: { entity_type: type } }),
    }),
    getDocReviews: builder.query({
      query: ({ type, id }) => ({ url: "/document-reviews", params: { entity_type: type, entity_id: id } }),
      providesTags: (r, e, { type, id }) => [{ type: "DocReviews", id: `${type}:${id}` }],
    }),
    getDocRevision: builder.query({
      query: ({ type, snapshotId }) => ({ url: `/document-reviews/revisions/${snapshotId}`, params: { entity_type: type } }),
    }),
    getDocExisting: builder.query({
      query: ({ type, projectId }) => ({ url: "/document-reviews/existing", params: { entity_type: type, project_id: projectId } }),
      keepUnusedDataFor: 0,
    }),
    reviewDocument: builder.mutation({
      query: (body) => ({ url: "/document-reviews", method: "POST", body }),
      invalidatesTags: (r, e, { entity_type, entity_id }) => [
        { type: "DocReviews", id: `meta:${entity_type}` },
        { type: "DocReviews", id: `${entity_type}:${entity_id}` },
      ],
    }),
  }),
});

export const {
  useGetDocMetaQuery,
  useGetDocCapabilitiesQuery,
  useGetDocRowsQuery,
  useGetDocReviewsQuery,
  useLazyGetDocRevisionQuery,
  useLazyGetDocExistingQuery,
  useReviewDocumentMutation,
} = docFlowApi;
