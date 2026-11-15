import { baseApi } from "../../store/baseApi";
import { documentUploadTags } from "../documents/document.api";

// Project › Documents: per flow document, does the project have one, latest
// version / status / last edit (GET /projects/:id/document-hub).
export const documentHubApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["DocumentHub"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      getDocumentHub: builder.query({
        query: (projectId) => `/projects/${projectId}/document-hub`,
        // Any document / drawing change refreshes the hub.
        providesTags: (r, e, projectId) => [
          "DocumentHub",
          { type: "DocumentHub", id: projectId },
          ...documentUploadTags,
          "Drawing",
          { type: "Drawing", id: "LIST" },
        ],
      }),
      getProjectPendingWork: builder.query({
        query: (projectId) => `/projects/${projectId}/pending-work`,
        providesTags: (r, e, projectId) => [{ type: "DocumentHub", id: projectId }],
      }),
    }),
  });

export const { useGetDocumentHubQuery, useGetProjectPendingWorkQuery } = documentHubApi;
