import { baseApi } from "../store/baseApi";

export const documentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // DOCUMENTS
    // ============================================================

    getDocuments: builder.query({
      query: ({
        projectId,
        project_id,
        status,
        category,
        documentTypeId,
        q,
      } = {}) => {
        const params = new URLSearchParams();

        const finalProjectId = projectId || project_id;

        if (finalProjectId) {
          params.append("projectId", finalProjectId);
        }

        if (status) {
          params.append("status", status);
        }

        if (category) {
          params.append("category", category);
        }

        if (documentTypeId) {
          params.append("documentTypeId", documentTypeId);
        }

        /*
         * q is currently not supported by the NestJS controller.
         *
         * Keep it here only if you later add:
         * @Query('q') q?: string
         *
         * For now it is intentionally NOT sent.
         */

        const queryString = params.toString();

        return `/documents${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: (result) => [
        "Document",
        ...(result || []).map((doc) => ({
          type: "Document",
          id: doc.id,
        })),
      ],
    }),

    getDocument: builder.query({
      query: (id) => `/documents/${id}`,

      providesTags: (result, error, id) => [
        { type: "Document", id },
        "Document",
      ],
    }),

    createDocument: builder.mutation({
      query: ({ data = {}, file }) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            formData.append(key, String(value));
          }
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

      invalidatesTags: (result, error, { id }) => [
        "Document",
        { type: "Document", id },
      ],
    }),

    replaceDocumentFile: builder.mutation({
      query: ({ id, file }) => {
        const formData = new FormData();

        formData.append("file", file);

        return {
          // IMPORTANT:
          // NestJS controller is POST /documents/:id/file
          url: `/documents/${id}/file`,
          method: "POST",
          body: formData,
        };
      },

      invalidatesTags: (result, error, { id }) => [
        "Document",
        { type: "Document", id },
      ],
    }),

    deleteDocument: builder.mutation({
      query: (id) => ({
        url: `/documents/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["Document"],
    }),

    // ============================================================
    // LOCK / UNLOCK
    // ============================================================

    lockDocument: builder.mutation({
      query: ({ id, userId }) => ({
        url: `/documents/${id}/lock`,
        method: "PATCH",
        body: {
          userId,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        "Document",
        { type: "Document", id },
      ],
    }),

    unlockDocument: builder.mutation({
      query: ({ id, userId }) => ({
        url: `/documents/${id}/unlock`,
        method: "PATCH",
        body: {
          userId,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        "Document",
        { type: "Document", id },
      ],
    }),

    // ============================================================
    // DOWNLOAD
    // ============================================================

    downloadDocument: builder.query({
      query: (id) => ({
        url: `/documents/${id}/download`,
        responseHandler: async (response) => await response.blob(),
      }),

      keepUnusedDataFor: 0,
    }),

    // ============================================================
    // VERSIONS
    // ============================================================

    getDocumentVersions: builder.query({
      query: (documentId) => `/documents/${documentId}/versions`,

      providesTags: (result, error, documentId) => [
        "DocumentVersion",
        {
          type: "DocumentVersion",
          id: documentId,
        },
      ],
    }),

    addDocumentVersion: builder.mutation({
      query: ({ documentId, data = {}, file }) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            formData.append(key, String(value));
          }
        });

        if (file) {
          formData.append("file", file);
        }

        return {
          url: `/documents/${documentId}/versions`,
          method: "POST",
          body: formData,
        };
      },

      invalidatesTags: (result, error, { documentId }) => [
        "Document",
        "DocumentVersion",
        {
          type: "DocumentVersion",
          id: documentId,
        },
        {
          type: "Document",
          id: documentId,
        },
      ],
    }),

    deleteDocumentVersion: builder.mutation({
      query: ({ documentId, versionId }) => ({
        url: `/documents/${documentId}/versions/${versionId}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, { documentId }) => [
        "Document",
        "DocumentVersion",
        {
          type: "DocumentVersion",
          id: documentId,
        },
        {
          type: "Document",
          id: documentId,
        },
      ],
    }),

    // ============================================================
    // ATTACHMENTS
    // ============================================================

    getDocumentAttachments: builder.query({
      query: (documentId) => `/documents/${documentId}/attachments`,

      providesTags: (result, error, documentId) => [
        "DocumentAttachment",
        {
          type: "DocumentAttachment",
          id: documentId,
        },
      ],
    }),

    addDocumentAttachment: builder.mutation({
      query: ({ documentId, data = {}, file }) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            formData.append(key, String(value));
          }
        });

        if (file) {
          formData.append("file", file);
        }

        return {
          url: `/documents/${documentId}/attachments`,
          method: "POST",
          body: formData,
        };
      },

      invalidatesTags: (result, error, { documentId }) => [
        "DocumentAttachment",
        {
          type: "DocumentAttachment",
          id: documentId,
        },
        "Document",
        {
          type: "Document",
          id: documentId,
        },
      ],
    }),

    deleteDocumentAttachment: builder.mutation({
      query: ({ documentId, attachmentId }) => ({
        url: `/documents/${documentId}/attachments/${attachmentId}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, { documentId }) => [
        "DocumentAttachment",
        {
          type: "DocumentAttachment",
          id: documentId,
        },
        "Document",
        {
          type: "Document",
          id: documentId,
        },
      ],
    }),

    // ============================================================
    // DOCUMENT TYPES
    // ============================================================

    getDocumentTypes: builder.query({
      query: ({ phaseCode, sectionCode, activeOnly = true } = {}) => {
        const params = new URLSearchParams();

        if (phaseCode) {
          params.append("phaseCode", phaseCode);
        }

        if (sectionCode) {
          params.append("sectionCode", sectionCode);
        }

        params.append("activeOnly", activeOnly ? "true" : "false");

        return `/documents/types?${params.toString()}`;
      },

      providesTags: (result) => [
        "DocumentType",
        ...(result || []).map((item) => ({
          type: "DocumentType",
          id: item.id,
        })),
      ],
    }),

    getDocumentType: builder.query({
      query: (id) => `/documents/types/${id}`,

      providesTags: (result, error, id) => [
        "DocumentType",
        {
          type: "DocumentType",
          id,
        },
      ],
    }),

    createDocumentType: builder.mutation({
      query: (data) => ({
        url: "/documents/types",
        method: "POST",
        body: data,
      }),

      invalidatesTags: ["DocumentType"],
    }),

    updateDocumentType: builder.mutation({
      query: ({ id, data }) => ({
        url: `/documents/types/${id}`,
        method: "PATCH",
        body: data,
      }),

      invalidatesTags: (result, error, { id }) => [
        "DocumentType",
        {
          type: "DocumentType",
          id,
        },
      ],
    }),

    deleteDocumentType: builder.mutation({
      query: (id) => ({
        url: `/documents/types/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["DocumentType"],
    }),

    // ============================================================
    // WORKSPACE / REKI
    // ============================================================

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
  // Documents
  useGetDocumentsQuery,
  useGetDocumentQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useReplaceDocumentFileMutation,
  useDeleteDocumentMutation,

  // Lock
  useLockDocumentMutation,
  useUnlockDocumentMutation,

  // Download
  useLazyDownloadDocumentQuery,

  // Versions
  useGetDocumentVersionsQuery,
  useAddDocumentVersionMutation,
  useDeleteDocumentVersionMutation,

  // Attachments
  useGetDocumentAttachmentsQuery,
  useAddDocumentAttachmentMutation,
  useDeleteDocumentAttachmentMutation,

  // Document Types
  useGetDocumentTypesQuery,
  useGetDocumentTypeQuery,
  useCreateDocumentTypeMutation,
  useUpdateDocumentTypeMutation,
  useDeleteDocumentTypeMutation,

  // Other
  useGetDocumentRekiQuery,
  useGetDocumentsWorkspaceQuery,
} = documentApi;
