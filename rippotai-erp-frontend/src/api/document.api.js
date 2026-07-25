import { baseApi } from "../store/baseApi";

export const documentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDocuments: builder.query({
      query: ({ q, category, project_id } = {}) => {
        const params = new URLSearchParams();

        if (q) params.append("q", q);
        if (category) params.append("category", category);
        if (project_id) params.append("project_id", project_id);

        return `/documents?${params.toString()}`;
      },
      providesTags: ["Document"],
    }),

    createDocument: builder.mutation({
      query: ({ data, file }) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, value);
        });

        if (file) {
          formData.append("file", file);
        }

        return {
          url: "/documents",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Document"],
    }),

    updateDocument: builder.mutation({
      query: ({ id, data }) => ({
        url: `/documents/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Document"],
    }),

    replaceDocumentFile: builder.mutation({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: `/documents/${id}/replace`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Document"],
    }),

    deleteDocument: builder.mutation({
      query: (id) => ({
        url: `/documents/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Document"],
    }),

    lockDocument: builder.mutation({
      query: (id) => ({
        url: `/documents/${id}/lock`,
        method: "POST",
      }),
      invalidatesTags: ["Document"],
    }),

    unlockDocument: builder.mutation({
      query: (id) => ({
        url: `/documents/${id}/unlock`,
        method: "POST",
      }),
      invalidatesTags: ["Document"],
    }),

    downloadDocument: builder.query({
      query: (id) => ({
        url: `/documents/${id}/download`,
        responseHandler: async (response) => await response.blob(),
      }),
    }),

    downloadAttachment: builder.query({
      query: ({ id, attachmentId }) => ({
        url: `/documents/${id}/attachments/${attachmentId}`,
        responseHandler: async (response) => await response.blob(),
      }),
    }),

    getDocumentReki: builder.query({
      query: (id) => `/documents/${id}/reki`,
    }),

    getDocumentsWorkspace: builder.query({
      query: (projectId) => `/projects/${projectId}/documents-workspace`,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDocumentsQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useReplaceDocumentFileMutation,
  useDeleteDocumentMutation,
  useLockDocumentMutation,
  useUnlockDocumentMutation,
  useLazyDownloadDocumentQuery,
  useLazyDownloadAttachmentQuery,
  useGetDocumentRekiQuery,

  useGetDocumentsWorkspaceQuery,
} = documentApi;
