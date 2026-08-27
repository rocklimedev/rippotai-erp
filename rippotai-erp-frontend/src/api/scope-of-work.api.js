import { baseApi } from "../store/baseApi";

export const scopeOfWorkApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =========================================================
    // SCOPE CATEGORIES
    // =========================================================

    createScopeCategory: builder.mutation({
      query: (body) => ({
        url: "/scope-of-work/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ScopeCategories"],
    }),

    getScopeCategories: builder.query({
      query: () => ({
        url: "/scope-of-work/categories",
      }),
      providesTags: ["ScopeCategories"],
    }),

    getScopeCategory: builder.query({
      query: (id) => ({
        url: `/scope-of-work/categories/${id}`,
      }),
      providesTags: ["ScopeCategories"],
    }),

    updateScopeCategory: builder.mutation({
      query: ({ id, body }) => ({
        url: `/scope-of-work/categories/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ScopeCategories"],
    }),

    deleteScopeCategory: builder.mutation({
      query: (id) => ({
        url: `/scope-of-work/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ScopeCategories"],
    }),

    // =========================================================
    // PROJECT SPACES
    // =========================================================

    createProjectSpace: builder.mutation({
      query: ({ projectId, body }) => ({
        url: `/scope-of-work/projects/${projectId}/spaces`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProjectSpaces"],
    }),

    getProjectSpaces: builder.query({
      query: (projectId) => ({
        url: `/scope-of-work/projects/${projectId}/spaces`,
      }),
      providesTags: ["ProjectSpaces"],
    }),

    getProjectSpace: builder.query({
      query: (id) => ({
        url: `/scope-of-work/spaces/${id}`,
      }),
      providesTags: ["ProjectSpaces"],
    }),

    updateProjectSpace: builder.mutation({
      query: ({ id, body }) => ({
        url: `/scope-of-work/spaces/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ProjectSpaces"],
    }),

    deleteProjectSpace: builder.mutation({
      query: (id) => ({
        url: `/scope-of-work/spaces/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ProjectSpaces"],
    }),

    // =========================================================
    // PROJECT CATEGORIES
    // =========================================================

    addCategoryToProject: builder.mutation({
      query: ({ projectId, body }) => ({
        url: `/scope-of-work/projects/${projectId}/categories`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProjectScopeCategories"],
    }),

    getProjectCategories: builder.query({
      query: (projectId) => ({
        url: `/scope-of-work/projects/${projectId}/categories`,
      }),
      providesTags: ["ProjectScopeCategories"],
    }),

    removeCategoryFromProject: builder.mutation({
      query: (id) => ({
        url: `/scope-of-work/project-categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ProjectScopeCategories"],
    }),

    // =========================================================
    // SCOPE ITEMS
    // =========================================================

    createScopeItem: builder.mutation({
      query: ({ projectId, body }) => ({
        url: `/scope-of-work/projects/${projectId}/items`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ScopeItems"],
    }),

    getScopeItems: builder.query({
      query: (projectId) => ({
        url: `/scope-of-work/projects/${projectId}/items`,
      }),
      providesTags: ["ScopeItems"],
    }),

    getScopeItem: builder.query({
      query: (id) => ({
        url: `/scope-of-work/items/${id}`,
      }),
      providesTags: ["ScopeItems"],
    }),

    updateScopeItem: builder.mutation({
      query: ({ id, body }) => ({
        url: `/scope-of-work/items/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ScopeItems"],
    }),

    deleteScopeItem: builder.mutation({
      query: (id) => ({
        url: `/scope-of-work/items/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ScopeItems"],
    }),

    // =========================================================
    // SCOPE OF WORK DOCUMENT
    // =========================================================

    /**
     * Create Scope of Work for a project
     *
     * POST
     * /scope-of-work/projects/:projectId
     */
    createScopeOfWork: builder.mutation({
      query: ({ projectId, body }) => ({
        url: `/scope-of-work/projects/${projectId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ScopeOfWork"],
    }),

    /**
     * Get all Scope of Work records
     *
     * GET
     * /scope-of-work
     */
    getScopeOfWork: builder.query({
      query: () => ({
        url: "/scope-of-work",
      }),
      providesTags: ["ScopeOfWork"],
    }),

    /**
     * Get Scope of Work by its own ID
     *
     * GET
     * /scope-of-work/by-id/:id
     */
    getScopeOfWorkById: builder.query({
      query: (id) => ({
        url: `/scope-of-work/by-id/${id}`,
      }),
      providesTags: ["ScopeOfWork"],
    }),

    /**
     * Get the Scope of Work document for a project.
     *
     * This is the shape the Proposal Builder actually consumes:
     * the document plus its nested `items[]`, each carrying its
     * `projectSpace` and `scopeCategory`.
     *
     * NOTE: mirrors the POST path (`/scope-of-work/projects/:projectId`)
     * as a GET. Confirm this matches your controller — it's the one
     * line to change if the real route differs.
     *
     * GET
     * /scope-of-work/projects/:projectId
     */
    getScopeOfWorkByProject: builder.query({
      query: (projectId) => `/scope-of-work/projects/${projectId}`,
      providesTags: ["ScopeOfWork"],
    }),

    // in scope-of-work.api.ts
    createCompleteScopeOfWork: builder.mutation({
      query: ({ projectId, body }) => ({
        url: `/scope-of-work/projects/${projectId}/complete`, // adjust path to match your controller
        method: "POST",
        body,
      }),
      invalidatesTags: ["ScopeOfWork", "ProjectSpaces", "ScopeItems"],
    }),

    /**
     * Update Scope of Work by its own ID
     *
     * PATCH
     * /scope-of-work/by-id/:id
     */
    updateScopeOfWork: builder.mutation({
      query: ({ id, body }) => ({
        url: `/scope-of-work/by-id/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ScopeOfWork"],
    }),

    /**
     * Delete Scope of Work by its own ID
     *
     * DELETE
     * /scope-of-work/by-id/:id
     */
    deleteScopeOfWork: builder.mutation({
      query: (id) => ({
        url: `/scope-of-work/by-id/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ScopeOfWork"],
    }),
  }),

  overrideExisting: false,
});

export const {
  // =========================================================
  // SCOPE CATEGORIES
  // =========================================================

  useCreateScopeCategoryMutation,
  useGetScopeCategoriesQuery,
  useLazyGetScopeCategoriesQuery,
  useGetScopeCategoryQuery,
  useLazyGetScopeCategoryQuery,
  useUpdateScopeCategoryMutation,
  useDeleteScopeCategoryMutation,

  // =========================================================
  // PROJECT SPACES
  // =========================================================

  useCreateProjectSpaceMutation,
  useGetProjectSpacesQuery,
  useLazyGetProjectSpacesQuery,
  useGetProjectSpaceQuery,
  useLazyGetProjectSpaceQuery,
  useUpdateProjectSpaceMutation,
  useDeleteProjectSpaceMutation,

  // =========================================================
  // PROJECT CATEGORIES
  // =========================================================

  useAddCategoryToProjectMutation,
  useGetProjectCategoriesQuery,
  useLazyGetProjectCategoriesQuery,
  useRemoveCategoryFromProjectMutation,

  // =========================================================
  // SCOPE ITEMS
  // =========================================================

  useCreateScopeItemMutation,
  useGetScopeItemsQuery,
  useLazyGetScopeItemsQuery,
  useGetScopeItemQuery,
  useLazyGetScopeItemQuery,
  useUpdateScopeItemMutation,
  useDeleteScopeItemMutation,
  useCreateCompleteScopeOfWorkMutation,

  // =========================================================
  // SCOPE OF WORK DOCUMENT
  // =========================================================

  useCreateScopeOfWorkMutation,
  useGetScopeOfWorkQuery,
  useLazyGetScopeOfWorkQuery,
  useGetScopeOfWorkByIdQuery,
  useLazyGetScopeOfWorkByIdQuery,
  useGetScopeOfWorkByProjectQuery,
  useLazyGetScopeOfWorkByProjectQuery,
  useUpdateScopeOfWorkMutation,
  useDeleteScopeOfWorkMutation,
} = scopeOfWorkApi;
