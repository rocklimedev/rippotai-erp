import { baseApi } from "../store/baseApi";

export const documentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // DOCUMENTS
    // ============================================================

    /**
     * GET /documents?projectId=<uuid>
     *
     * Get all documents for a project.
     *
     * Backend:
     * DocumentsController.findAllForProject()
     */
    getDocuments: builder.query({
      query: ({
        projectId,
        project_id,
        status,
        category,
        documentTypeId,
      } = {}) => {
        const finalProjectId = projectId || project_id;

        /*
         * Backend requires:
         *
         * @Query('projectId', ParseUUIDPipe)
         *
         * Therefore do not call GET /documents without a projectId.
         */
        if (!finalProjectId) {
          return {
            url: "/documents",
            method: "GET",
            params: {},
          };
        }

        const params = new URLSearchParams();

        params.append("projectId", String(finalProjectId));

        if (status) {
          params.append("status", String(status));
        }

        if (category) {
          params.append("category", String(category));
        }

        if (documentTypeId) {
          params.append("documentTypeId", String(documentTypeId));
        }

        return `/documents?${params.toString()}`;
      },

      providesTags: (result) => [
        "Document",
        ...(Array.isArray(result)
          ? result.map((doc) => ({
              type: "Document",
              id: doc.id,
            }))
          : []),
      ],
    }),

    /**
     * GET /documents/:id
     */
    getDocument: builder.query({
      query: (id) => `/documents/${id}`,

      providesTags: (result, error, id) => [
        "Document",
        {
          type: "Document",
          id,
        },
      ],
    }),

    /**
     * POST /documents
     *
     * Create document with optional file.
     */
    createDocument: builder.mutation({
      query: ({ data = {}, file } = {}) => {
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

    /**
     * PATCH /documents/:id
     */
    updateDocument: builder.mutation({
      query: ({ id, data }) => ({
        url: `/documents/${id}`,
        method: "PATCH",
        body: data,
      }),

      invalidatesTags: (result, error, { id }) => [
        "Document",
        {
          type: "Document",
          id,
        },
      ],
    }),

    /**
     * POST /documents/:id/file
     *
     * Replace main document file.
     */
    replaceDocumentFile: builder.mutation({
      query: ({ id, file }) => {
        const formData = new FormData();

        formData.append("file", file);

        return {
          url: `/documents/${id}/file`,
          method: "POST",
          body: formData,
        };
      },

      invalidatesTags: (result, error, { id }) => [
        "Document",
        {
          type: "Document",
          id,
        },
      ],
    }),

    /**
     * DELETE /documents/:id
     */
    deleteDocument: builder.mutation({
      query: (id) => ({
        url: `/documents/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["Document"],
    }),

    // ============================================================
    // DOCUMENT LOCKING
    // ============================================================

    /**
     * PATCH /documents/:id/lock
     */
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
        {
          type: "Document",
          id,
        },
      ],
    }),

    /**
     * PATCH /documents/:id/unlock
     */
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
        {
          type: "Document",
          id,
        },
      ],
    }),

    // ============================================================
    // DOCUMENT DOWNLOAD
    // ============================================================

    /**
     * GET /documents/:id/download
     */
    downloadDocument: builder.query({
      query: (id) => ({
        url: `/documents/${id}/download`,
        responseHandler: async (response) => {
          if (!response.ok) {
            throw new Error(`Download failed: ${response.status}`);
          }

          return response.blob();
        },
      }),

      keepUnusedDataFor: 0,
    }),

    // ============================================================
    // DOCUMENT VERSIONS
    // ============================================================

    /**
     * POST /documents/:id/versions
     */
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

    /**
     * GET /documents/:id/versions
     */
    getDocumentVersions: builder.query({
      query: (documentId) => `/documents/${documentId}/versions`,

      providesTags: (result, error, documentId) => [
        "DocumentVersion",
        {
          type: "DocumentVersion",
          id: documentId,
        },
        ...(Array.isArray(result)
          ? result.map((version) => ({
              type: "DocumentVersion",
              id: version.id,
            }))
          : []),
      ],
    }),

    /**
     * DELETE /documents/:id/versions/:versionId
     */
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
    // DOCUMENT ATTACHMENTS
    // ============================================================

    /**
     * POST /documents/:id/attachments
     */
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
        "Document",
        {
          type: "Document",
          id: documentId,
        },
        "DocumentAttachment",
        {
          type: "DocumentAttachment",
          id: documentId,
        },
      ],
    }),

    /**
     * GET /documents/:id/attachments
     */
    getDocumentAttachments: builder.query({
      query: (documentId) => `/documents/${documentId}/attachments`,

      providesTags: (result, error, documentId) => [
        "DocumentAttachment",
        {
          type: "DocumentAttachment",
          id: documentId,
        },
        ...(Array.isArray(result)
          ? result.map((attachment) => ({
              type: "DocumentAttachment",
              id: attachment.id,
            }))
          : []),
      ],
    }),

    /**
     * DELETE /documents/:id/attachments/:attachmentId
     */
    deleteDocumentAttachment: builder.mutation({
      query: ({ documentId, attachmentId }) => ({
        url: `/documents/${documentId}/attachments/${attachmentId}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, { documentId }) => [
        "Document",
        {
          type: "Document",
          id: documentId,
        },
        "DocumentAttachment",
        {
          type: "DocumentAttachment",
          id: documentId,
        },
      ],
    }),

    // ============================================================
    // DOCUMENT TYPES
    // ============================================================

    /**
     * GET /document-types
     *
     * Backend:
     * DocumentTypesController.findAll()
     *
     * Supported query params:
     * - phaseCode
     * - targetType
     * - isActive
     */
    getDocumentTypes: builder.query({
      query: ({ phaseCode, targetType, isActive } = {}) => {
        const params = new URLSearchParams();

        if (phaseCode) {
          params.append("phaseCode", phaseCode);
        }

        if (targetType) {
          params.append("targetType", targetType);
        }

        if (isActive !== undefined && isActive !== null) {
          params.append("isActive", isActive ? "true" : "false");
        }

        const queryString = params.toString();

        return `/document-types${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: (result) => [
        "DocumentType",
        ...(Array.isArray(result)
          ? result.map((item) => ({
              type: "DocumentType",
              id: item.id,
            }))
          : []),
      ],
    }),

    /**
     * GET /document-types/:id
     */
    getDocumentType: builder.query({
      query: (id) => `/document-types/${id}`,

      providesTags: (result, error, id) => [
        "DocumentType",
        {
          type: "DocumentType",
          id,
        },
      ],
    }),

    /**
     * POST /document-types
     */
    createDocumentType: builder.mutation({
      query: (data) => ({
        url: "/document-types",
        method: "POST",
        body: data,
      }),

      invalidatesTags: ["DocumentType"],
    }),

    /**
     * PATCH /document-types/:id
     */
    updateDocumentType: builder.mutation({
      query: ({ id, data }) => ({
        url: `/document-types/${id}`,
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

    /**
     * DELETE /document-types/:id
     */
    deleteDocumentType: builder.mutation({
      query: (id) => ({
        url: `/document-types/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["DocumentType"],
    }),

    // ============================================================
    // DOCUMENT REQUIREMENTS
    // ============================================================

    /**
     * GET /document-requirements?projectId=<uuid>
     *
     * Get all document requirements for a project.
     */
    getDocumentRequirements: builder.query({
      query: (projectId) => {
        const params = new URLSearchParams();

        params.append("projectId", projectId);

        return `/document-requirements?${params.toString()}`;
      },

      providesTags: (result) => [
        "DocumentRequirement",
        ...(Array.isArray(result)
          ? result.map((item) => ({
              type: "DocumentRequirement",
              id: item.id,
            }))
          : []),
      ],
    }),

    /**
     * GET /document-requirements/:id
     */
    getDocumentRequirement: builder.query({
      query: (id) => `/document-requirements/${id}`,

      providesTags: (result, error, id) => [
        "DocumentRequirement",
        {
          type: "DocumentRequirement",
          id,
        },
      ],
    }),

    /**
     * POST /document-requirements
     */
    createDocumentRequirement: builder.mutation({
      query: (data) => ({
        url: "/document-requirements",
        method: "POST",
        body: data,
      }),

      invalidatesTags: ["DocumentRequirement"],
    }),

    /**
     * PATCH /document-requirements/:id
     */
    updateDocumentRequirement: builder.mutation({
      query: ({ id, data }) => ({
        url: `/document-requirements/${id}`,
        method: "PATCH",
        body: data,
      }),

      invalidatesTags: (result, error, { id }) => [
        "DocumentRequirement",
        {
          type: "DocumentRequirement",
          id,
        },
      ],
    }),

    /**
     * PATCH /document-requirements/:id/completed
     */
    markDocumentRequirementCompleted: builder.mutation({
      query: ({ id, isCompleted }) => ({
        url: `/document-requirements/${id}/completed`,
        method: "PATCH",
        body: {
          isCompleted,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        "DocumentRequirement",
        {
          type: "DocumentRequirement",
          id,
        },
      ],
    }),

    /**
     * DELETE /document-requirements/:id
     */
    deleteDocumentRequirement: builder.mutation({
      query: (id) => ({
        url: `/document-requirements/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["DocumentRequirement"],
    }),

    // ============================================================
    // DOCUMENT REGISTER
    // ============================================================

    /**
     * POST /documents/deliverable-records
     *
     * Record a deliverable.
     *
     * Backend:
     * DocumentRegisterController.recordDeliverable()
     */
    recordDeliverable: builder.mutation({
      query: (data) => ({
        url: "/documents/deliverable-records",
        method: "POST",
        body: data,
      }),

      invalidatesTags: ["DocumentRegister", "Document"],
    }),

    /**
     * GET /documents/:projectId/document-register
     *
     * IMPORTANT:
     * Backend uses ParseIntPipe here.
     *
     * Therefore projectId MUST be an integer.
     */
    getDocumentRegister: builder.query({
      query: (projectId) => `/documents/${projectId}/document-register`,

      providesTags: (result, error, projectId) => [
        "DocumentRegister",
        {
          type: "DocumentRegister",
          id: projectId,
        },
      ],
    }),

    // ============================================================
    // DOCUMENT DASHBOARD
    // ============================================================

    /**
     * GET /documents/dashboard/stats
     */
    getDocumentDashboardStats: builder.query({
      query: () => "/documents/dashboard/stats",

      providesTags: ["DocumentDashboard"],
    }),

    /**
     * GET /documents/dashboard/recent
     *
     * ?limit=10
     */
    getRecentDocuments: builder.query({
      query: (limit = 6) => {
        const params = new URLSearchParams();

        params.append("limit", String(limit));

        return `/documents/dashboard/recent?${params.toString()}`;
      },

      providesTags: ["DocumentDashboard"],
    }),

    /**
     * GET /documents/dashboard/pending
     */
    getPendingDocuments: builder.query({
      query: () => "/documents/dashboard/pending",

      providesTags: ["DocumentDashboard"],
    }),

    /**
     * GET /documents/dashboard/expiring-quotations
     *
     * ?withinDays=7
     */
    getExpiringQuotations: builder.query({
      query: (withinDays = 7) => {
        const params = new URLSearchParams();

        params.append("withinDays", String(withinDays));

        return `/documents/dashboard/expiring-quotations?${params.toString()}`;
      },

      providesTags: ["DocumentDashboard"],
    }),

    /**
     * GET /documents/dashboard/boq-variance
     */
    getDocumentBoqVariance: builder.query({
      query: () => "/documents/dashboard/boq-variance",

      providesTags: ["DocumentDashboard"],
    }),

    /**
     * GET /documents/dashboard/draft-estimates
     */
    getDraftEstimates: builder.query({
      query: () => "/documents/dashboard/draft-estimates",

      providesTags: ["DocumentDashboard"],
    }),

    /**
     * GET /documents/dashboard/project-wise
     *
     * ?limit=5
     */
    getProjectWiseDocuments: builder.query({
      query: (limit = 5) => {
        const params = new URLSearchParams();

        params.append("limit", String(limit));

        return `/documents/dashboard/project-wise?${params.toString()}`;
      },

      providesTags: ["DocumentDashboard"],
    }),

    // ============================================================
    // WORKSPACE / REKI
    // ============================================================

    /**
     * NOTE:
     * These routes were present in your previous frontend API,
     * but they are NOT present in the controllers you posted.
     *
     * Keep them only if these endpoints exist in another controller.
     */

    getDocumentReki: builder.query({
      query: (id) => `/documents/${id}/reki`,
    }),

    getDocumentsWorkspace: builder.query({
      query: (projectId) => `/projects/${projectId}/documents-workspace`,
    }),
  }),

  overrideExisting: false,
});

// ================================================================
// EXPORT HOOKS
// ================================================================

export const {
  // ------------------------------------------------------------
  // Documents
  // ------------------------------------------------------------

  useGetDocumentsQuery,
  useGetDocumentQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useReplaceDocumentFileMutation,
  useDeleteDocumentMutation,

  // ------------------------------------------------------------
  // Lock / Unlock
  // ------------------------------------------------------------

  useLockDocumentMutation,
  useUnlockDocumentMutation,

  // ------------------------------------------------------------
  // Download
  // ------------------------------------------------------------

  useLazyDownloadDocumentQuery,

  // ------------------------------------------------------------
  // Versions
  // ------------------------------------------------------------

  useGetDocumentVersionsQuery,
  useAddDocumentVersionMutation,
  useDeleteDocumentVersionMutation,

  // ------------------------------------------------------------
  // Attachments
  // ------------------------------------------------------------

  useGetDocumentAttachmentsQuery,
  useAddDocumentAttachmentMutation,
  useDeleteDocumentAttachmentMutation,

  // ------------------------------------------------------------
  // Document Types
  // ------------------------------------------------------------

  useGetDocumentTypesQuery,
  useGetDocumentTypeQuery,
  useCreateDocumentTypeMutation,
  useUpdateDocumentTypeMutation,
  useDeleteDocumentTypeMutation,

  // ------------------------------------------------------------
  // Document Requirements
  // ------------------------------------------------------------

  useGetDocumentRequirementsQuery,
  useGetDocumentRequirementQuery,
  useCreateDocumentRequirementMutation,
  useUpdateDocumentRequirementMutation,
  useMarkDocumentRequirementCompletedMutation,
  useDeleteDocumentRequirementMutation,

  // ------------------------------------------------------------
  // Document Register
  // ------------------------------------------------------------

  useRecordDeliverableMutation,
  useGetDocumentRegisterQuery,

  // ------------------------------------------------------------
  // Dashboard
  // ------------------------------------------------------------

  useGetDocumentDashboardStatsQuery,
  useGetRecentDocumentsQuery,
  useGetPendingDocumentsQuery,
  useGetExpiringQuotationsQuery,
  useGetDocumentBoqVarianceQuery,
  useGetDraftEstimatesQuery,
  useGetProjectWiseDocumentsQuery,

  // ------------------------------------------------------------
  // Workspace / REKI
  // ------------------------------------------------------------

  useGetDocumentRekiQuery,
  useGetDocumentsWorkspaceQuery,
} = documentApi;
