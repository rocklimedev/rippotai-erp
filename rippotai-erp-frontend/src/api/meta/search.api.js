import { baseApi } from "../../store/baseApi";

/**
 * Search API – aligned with Search Module v2
 *
 * Backend base path (via baseApi): /api/v1
 * Global search returns:
 * {
 *   results: [{ entity_type, id, title, subtitle, score, highlight, meta }],
 *   total, page, pageSize, took_ms, facets
 * }
 */
export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================================
    // GLOBAL SEARCH
    // =====================================================
    // Supports: q, types, projectId, clientId, status, from, to, page, pageSize, includeDeleted
    globalSearch: builder.query({
      query: ({
        q,
        types,
        projectId,
        clientId,
        status,
        from,
        to,
        page = 1,
        pageSize = 20,
        includeDeleted = false,
      } = {}) => ({
        url: "/search",
        params: {
          ...(q != null && q !== "" ? { q } : {}),
          ...(types ? { types } : {}),
          ...(projectId ? { projectId } : {}),
          ...(clientId ? { clientId } : {}),
          ...(status ? { status } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          page,
          pageSize,
          ...(includeDeleted ? { includeDeleted: true } : {}),
        },
      }),
      providesTags: ["Search"],
    }),

    // =====================================================
    // AUTOCOMPLETE / SUGGEST
    // =====================================================
    searchSuggest: builder.query({
      query: ({ q, types, limit = 8 } = {}) => ({
        url: "/search/suggest",
        params: {
          q,
          ...(types ? { types } : {}),
          limit,
        },
      }),
    }),

    // =====================================================
    // ENTITY-SPECIFIC SEARCH
    // =====================================================
    searchProjects: builder.query({
      query: (q) => ({
        url: "/search/projects",
        params: { q },
      }),
    }),

    searchClients: builder.query({
      query: (q) => ({
        url: "/search/clients",
        params: { q },
      }),
    }),

    searchUsers: builder.query({
      query: (q) => ({
        url: "/search/users",
        params: { q },
      }),
    }),

    searchLeads: builder.query({
      query: (q) => ({
        url: "/search/leads",
        params: { q },
      }),
    }),

    searchVendors: builder.query({
      query: (q) => ({
        url: "/search/vendors",
        params: { q },
      }),
    }),

    searchBoqs: builder.query({
      query: (q) => ({
        url: "/search/boqs",
        params: { q },
      }),
    }),

    searchBriefs: builder.query({
      query: (q) => ({
        url: "/search/briefs",
        params: { q },
      }),
    }),

    searchQuotations: builder.query({
      query: (q) => ({
        url: "/search/quotations",
        params: { q },
      }),
    }),

    // Backend path is /search/site-recces (plural)
    searchSiteRecce: builder.query({
      query: (q) => ({
        url: "/search/site-recces",
        params: { q },
      }),
    }),

    searchTasks: builder.query({
      query: (q) => ({
        url: "/search/tasks",
        params: { q },
      }),
    }),

    searchCalendar: builder.query({
      query: (q) => ({
        url: "/search/calendar",
        params: { q },
      }),
    }),

    searchDocuments: builder.query({
      query: (q) => ({
        url: "/search/documents",
        params: { q },
      }),
    }),

    searchDrawings: builder.query({
      query: (q) => ({
        url: "/search/drawings",
        params: { q },
      }),
    }),

    searchWorkOrders: builder.query({
      query: (q) => ({
        url: "/search/work-orders",
        params: { q },
      }),
    }),

    searchDeliveryChallans: builder.query({
      query: (q) => ({
        url: "/search/delivery-challans",
        params: { q },
      }),
    }),

    searchBudgetEstimates: builder.query({
      query: (q) => ({
        url: "/search/budget-estimates",
        params: { q },
      }),
    }),

    // =====================================================
    // HEALTH
    // =====================================================
    searchHealth: builder.query({
      query: () => ({
        url: "/search/health",
      }),
    }),

    // =====================================================
    // REINDEX
    // =====================================================
    reindexAll: builder.mutation({
      query: () => ({
        url: "/search/reindex/all",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexEntity: builder.mutation({
      query: (entity) => ({
        url: `/search/reindex/${entity}`,
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    // Convenience per-entity mutations (optional; reindexEntity covers all)
    reindexProjects: builder.mutation({
      query: () => ({
        url: "/search/reindex/projects",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexClients: builder.mutation({
      query: () => ({
        url: "/search/reindex/clients",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexUsers: builder.mutation({
      query: () => ({
        url: "/search/reindex/users",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexLeads: builder.mutation({
      query: () => ({
        url: "/search/reindex/leads",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexVendors: builder.mutation({
      query: () => ({
        url: "/search/reindex/vendors",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexBoqs: builder.mutation({
      query: () => ({
        url: "/search/reindex/boqs",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexBriefs: builder.mutation({
      query: () => ({
        url: "/search/reindex/briefs",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexQuotations: builder.mutation({
      query: () => ({
        url: "/search/reindex/quotations",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexSiteRecce: builder.mutation({
      query: () => ({
        url: "/search/reindex/site-recces",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexTasks: builder.mutation({
      query: () => ({
        url: "/search/reindex/tasks",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexCalendar: builder.mutation({
      query: () => ({
        url: "/search/reindex/calendar",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexDocuments: builder.mutation({
      query: () => ({
        url: "/search/reindex/documents",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexDrawings: builder.mutation({
      query: () => ({
        url: "/search/reindex/drawings",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexWorkOrders: builder.mutation({
      query: () => ({
        url: "/search/reindex/work-orders",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexDeliveryChallans: builder.mutation({
      query: () => ({
        url: "/search/reindex/delivery-challans",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexBudgetEstimates: builder.mutation({
      query: () => ({
        url: "/search/reindex/budget-estimates",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),
  }),
  overrideExisting: false,
});

export const {
  // Global + suggest
  useGlobalSearchQuery,
  useLazyGlobalSearchQuery,
  useSearchSuggestQuery,
  useLazySearchSuggestQuery,

  // Entity search
  useSearchProjectsQuery,
  useSearchClientsQuery,
  useSearchUsersQuery,
  useSearchLeadsQuery,
  useSearchVendorsQuery,
  useSearchBoqsQuery,
  useSearchBriefsQuery,
  useSearchQuotationsQuery,
  useSearchSiteRecceQuery,
  useSearchTasksQuery,
  useSearchCalendarQuery,
  useSearchDocumentsQuery,
  useSearchDrawingsQuery,
  useSearchWorkOrdersQuery,
  useSearchDeliveryChallansQuery,
  useSearchBudgetEstimatesQuery,

  // Health
  useSearchHealthQuery,

  // Reindex
  useReindexAllMutation,
  useReindexEntityMutation,
  useReindexProjectsMutation,
  useReindexClientsMutation,
  useReindexUsersMutation,
  useReindexLeadsMutation,
  useReindexVendorsMutation,
  useReindexBoqsMutation,
  useReindexBriefsMutation,
  useReindexQuotationsMutation,
  useReindexSiteRecceMutation,
  useReindexTasksMutation,
  useReindexCalendarMutation,
  useReindexDocumentsMutation,
  useReindexDrawingsMutation,
  useReindexWorkOrdersMutation,
  useReindexDeliveryChallansMutation,
  useReindexBudgetEstimatesMutation,
} = searchApi;
