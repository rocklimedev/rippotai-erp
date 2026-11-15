// Record context (status, project, linked records, file versions) for document
// detail pages and the project "Recent activity" feed.
import { baseApi } from "../../store/baseApi";

export const recordContextApi = baseApi.enhanceEndpoints({ addTagTypes: ["DocReviews", "RecordContext"] }).injectEndpoints({
  endpoints: (builder) => ({
    getRecordContext: builder.query({
      query: ({ type, id }) => ({ url: "/document-reviews/context", params: { entity_type: type, entity_id: id } }),
      providesTags: (r, e, { type, id }) => [
        { type: "RecordContext", id: `${type}:${id}` },
        { type: "DocReviews", id: `${type}:${id}` },
      ],
    }),
    getProjectRecentActivity: builder.query({
      query: ({ projectId, limit = 8 }) => ({ url: `/projects/${projectId}/recent-activity`, params: { limit } }),
      providesTags: (r, e, { projectId }) => [{ type: "RecordContext", id: `activity:${projectId}` }],
    }),
  }),
});

export const { useGetRecordContextQuery, useGetProjectRecentActivityQuery } = recordContextApi;
