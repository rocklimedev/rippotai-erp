import { baseApi } from "../../store/baseApi";

export const vendorShortlistApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // PROJECT SHORTLISTS
    // ============================================================

    /**
     * GET /project-shortlists
     *
     * Query params:
     * - project_id
     * - shortlist_type
     */
    getProjectShortlists: builder.query({
      query: ({ project_id, shortlist_type } = {}) => {
        const params = new URLSearchParams();

        if (project_id) {
          params.append("project_id", project_id);
        }

        if (shortlist_type) {
          params.append("shortlist_type", shortlist_type);
        }

        const query = params.toString();

        return query ? `/project-shortlists?${query}` : "/project-shortlists";
      },

      providesTags: ["Shortlists"],
    }),

    /**
     * GET /project-shortlists/:id
     */
    getProjectShortlistById: builder.query({
      query: (id) => `/project-shortlists/${id}`,

      providesTags: (result, error, id) => [{ type: "Shortlists", id }],
    }),

    /**
     * GET /project-shortlists/by-project/:projectId/:type
     *
     * Example:
     * /project-shortlists/by-project/PROJECT_ID/VENDOR
     */
    getProjectShortlistByProjectAndType: builder.query({
      query: ({ projectId, type }) =>
        `/project-shortlists/by-project/${projectId}/${type}`,

      providesTags: (result, error, { projectId, type }) => [
        { type: "Shortlists", id: `${projectId}-${type}` },
      ],
    }),

    /**
     * GET /project-shortlists/:id/grid
     *
     * Returns Excel-like grid structure.
     */
    getProjectShortlistGrid: builder.query({
      query: (id) => `/project-shortlists/${id}/grid`,

      providesTags: (result, error, id) => [{ type: "ShortlistGrid", id }],
    }),

    /**
     * POST /project-shortlists
     *
     * Creates VENDOR or MATERIAL shortlist.
     */
    createProjectShortlist: builder.mutation({
      query: (body) => ({
        url: "/project-shortlists",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Shortlists", "ShortlistEntries", "ShortlistGrid"],
    }),

    /**
     * PUT /project-shortlists/:id
     */
    updateProjectShortlist: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/project-shortlists/${id}`,
        method: "PUT",
        body,
      }),

      invalidatesTags: (result, error, { id }) => [
        "Shortlists",
        { type: "Shortlists", id },
        { type: "ShortlistGrid", id },
      ],
    }),

    /**
     * DELETE /project-shortlists/:id
     */
    deleteProjectShortlist: builder.mutation({
      query: (id) => ({
        url: `/project-shortlists/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["Shortlists", "ShortlistEntries", "ShortlistGrid"],
    }),

    // ============================================================
    // SHORTLIST EXPORT
    // ============================================================

    /**
     * GET /project-shortlists/:id/export
     *
     * Downloads one shortlist as Excel.
     */
    exportProjectShortlist: builder.query({
      query: (id) => ({
        url: `/project-shortlists/${id}/export`,
        responseHandler: (response) => response.blob(),
      }),
    }),

    /**
     * GET /project-shortlists/export-both/:projectId
     *
     * Downloads VENDOR + MATERIAL sheets.
     */
    exportBothProjectShortlists: builder.query({
      query: (projectId) => ({
        url: `/project-shortlists/export-both/${projectId}`,
        responseHandler: (response) => response.blob(),
      }),
    }),

    // ============================================================
    // SHORTLIST ENTRIES
    // ============================================================

    /**
     * GET /shortlist-entries
     *
     * Query parameters depend on QueryShortlistEntryDto.
     */
    getShortlistEntries: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, value);
          }
        });

        const query = searchParams.toString();

        return query ? `/shortlist-entries?${query}` : "/shortlist-entries";
      },

      providesTags: ["ShortlistEntries"],
    }),

    /**
     * GET /shortlist-entries/:id
     */
    getShortlistEntryById: builder.query({
      query: (id) => `/shortlist-entries/${id}`,

      providesTags: (result, error, id) => [{ type: "ShortlistEntries", id }],
    }),

    /**
     * POST /shortlist-entries
     */
    createShortlistEntry: builder.mutation({
      query: (body) => ({
        url: "/shortlist-entries",
        method: "POST",
        body,
      }),

      invalidatesTags: ["ShortlistEntries", "Shortlists", "ShortlistGrid"],
    }),

    /**
     * POST /shortlist-entries/bulk
     */
    bulkCreateShortlistEntries: builder.mutation({
      query: (body) => ({
        url: "/shortlist-entries/bulk",
        method: "POST",
        body,
      }),

      invalidatesTags: ["ShortlistEntries", "Shortlists", "ShortlistGrid"],
    }),

    /**
     * PUT /shortlist-entries/:id
     */
    updateShortlistEntry: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/shortlist-entries/${id}`,
        method: "PUT",
        body,
      }),

      invalidatesTags: (result, error, { id }) => [
        "ShortlistEntries",
        { type: "ShortlistEntries", id },
        "Shortlists",
        "ShortlistGrid",
      ],
    }),

    /**
     * POST /shortlist-entries/:id/select
     *
     * Marks entry as selected for its trade.
     */
    selectShortlistEntry: builder.mutation({
      query: (id) => ({
        url: `/shortlist-entries/${id}/select`,
        method: "POST",
      }),

      invalidatesTags: ["ShortlistEntries", "Shortlists", "ShortlistGrid"],
    }),

    /**
     * DELETE /shortlist-entries/:id
     */
    deleteShortlistEntry: builder.mutation({
      query: (id) => ({
        url: `/shortlist-entries/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["ShortlistEntries", "Shortlists", "ShortlistGrid"],
    }),
  }),

  overrideExisting: false,
});

// ============================================================
// EXPORT HOOKS
// ============================================================

export const {
  // Project Shortlists
  useGetProjectShortlistsQuery,
  useGetProjectShortlistByIdQuery,
  useGetProjectShortlistByProjectAndTypeQuery,
  useGetProjectShortlistGridQuery,

  useCreateProjectShortlistMutation,
  useUpdateProjectShortlistMutation,
  useDeleteProjectShortlistMutation,

  // Export
  useLazyExportProjectShortlistQuery,
  useLazyExportBothProjectShortlistsQuery,

  // Shortlist Entries
  useGetShortlistEntriesQuery,
  useGetShortlistEntryByIdQuery,

  useCreateShortlistEntryMutation,
  useBulkCreateShortlistEntriesMutation,
  useUpdateShortlistEntryMutation,
  useSelectShortlistEntryMutation,
  useDeleteShortlistEntryMutation,
} = vendorShortlistApi;
