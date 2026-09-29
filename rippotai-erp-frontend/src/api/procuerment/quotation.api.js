import { baseApi } from "../../store/baseApi";

export const quotationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // QUOTATIONS
    // ============================================================

    createQuotation: builder.mutation({
      query: (body) => ({
        url: "/quotations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Quotation"],
    }),

    getQuotations: builder.query({
      query: ({ status, project_id, vendor_id, includeDeleted } = {}) => {
        const params = new URLSearchParams();

        if (status) {
          params.append("status", status);
        }

        if (project_id) {
          params.append("project_id", project_id);
        }

        if (vendor_id) {
          params.append("vendor_id", vendor_id);
        }

        if (includeDeleted !== undefined) {
          params.append("includeDeleted", String(includeDeleted));
        }

        const queryString = params.toString();

        return queryString ? `/quotations?${queryString}` : "/quotations";
      },

      providesTags: ["Quotation"],
    }),

    getQuotationById: builder.query({
      query: (id) => `/quotations/${id}`,

      providesTags: (result, error, id) => [
        {
          type: "Quotation",
          id,
        },
      ],
    }),

    updateQuotation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/quotations/${id}`,
        method: "PATCH",
        body,
      }),

      invalidatesTags: (result, error, { id }) => [
        "Quotation",
        {
          type: "Quotation",
          id,
        },
      ],
    }),

    submitQuotation: builder.mutation({
      query: ({ id, submitted_by }) => ({
        url: `/quotations/${id}/submit`,
        method: "PATCH",
        body: {
          submitted_by,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        "Quotation",
        {
          type: "Quotation",
          id,
        },
      ],
    }),

    approveQuotation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/quotations/${id}/approve`,
        method: "PATCH",
        body,
      }),

      invalidatesTags: (result, error, { id }) => [
        "Quotation",
        {
          type: "Quotation",
          id,
        },
      ],
    }),

    returnQuotation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/quotations/${id}/return`,
        method: "PATCH",
        body,
      }),

      invalidatesTags: (result, error, { id }) => [
        "Quotation",
        {
          type: "Quotation",
          id,
        },
      ],
    }),

    declineQuotation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/quotations/${id}/decline`,
        method: "PATCH",
        body,
      }),

      invalidatesTags: (result, error, { id }) => [
        "Quotation",
        {
          type: "Quotation",
          id,
        },
      ],
    }),

    cancelQuotation: builder.mutation({
      query: ({ id, updated_by }) => ({
        url: `/quotations/${id}/cancel`,
        method: "PATCH",
        body: {
          updated_by,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        "Quotation",
        {
          type: "Quotation",
          id,
        },
      ],
    }),

    restoreQuotation: builder.mutation({
      query: (id) => ({
        url: `/quotations/${id}/restore`,
        method: "PATCH",
      }),

      invalidatesTags: (result, error, id) => [
        "Quotation",
        {
          type: "Quotation",
          id,
        },
      ],
    }),

    softDeleteQuotation: builder.mutation({
      query: ({ id, deleted_by }) => ({
        url: `/quotations/${id}`,
        method: "DELETE",
        body: {
          deleted_by,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        "Quotation",
        {
          type: "Quotation",
          id,
        },
      ],
    }),

    deleteQuotationPermanent: builder.mutation({
      query: (id) => ({
        url: `/quotations/${id}/permanent`,
        method: "DELETE",
      }),

      invalidatesTags: ["Quotation", "QuotationItems", "QuotationVersions"],
    }),

    // ============================================================
    // QUOTATION ITEMS
    // ============================================================

    createQuotationItem: builder.mutation({
      query: ({ quotationId, ...body }) => ({
        url: `/quotations/${quotationId}/items`,
        method: "POST",
        body,
      }),

      invalidatesTags: (result, error, { quotationId }) => [
        "Quotation",
        {
          type: "Quotation",
          id: quotationId,
        },
        "QuotationItems",
        {
          type: "QuotationItems",
          id: `LIST_${quotationId}`,
        },
      ],
    }),

    getQuotationItems: builder.query({
      query: (quotationId) => `/quotations/${quotationId}/items`,

      providesTags: (result, error, quotationId) => {
        const items = Array.isArray(result) ? result : result?.data || [];

        return [
          ...items.filter(Boolean).map((item) => ({
            type: "QuotationItems",
            id: item.id,
          })),

          {
            type: "QuotationItems",
            id: `LIST_${quotationId}`,
          },
        ];
      },
    }),

    replaceQuotationItems: builder.mutation({
      query: ({ quotationId, items }) => ({
        url: `/quotations/${quotationId}/items`,
        method: "PUT",
        body: items,
      }),

      invalidatesTags: (result, error, { quotationId }) => [
        "Quotation",
        {
          type: "Quotation",
          id: quotationId,
        },
        "QuotationItems",
        {
          type: "QuotationItems",
          id: `LIST_${quotationId}`,
        },
      ],
    }),

    updateQuotationItem: builder.mutation({
      query: ({ quotationId, itemId, ...body }) => ({
        url: `/quotations/${quotationId}/items/${itemId}`,
        method: "PATCH",
        body,
      }),

      invalidatesTags: (result, error, { quotationId, itemId }) => [
        "Quotation",
        {
          type: "Quotation",
          id: quotationId,
        },
        {
          type: "QuotationItems",
          id: itemId,
        },
        {
          type: "QuotationItems",
          id: `LIST_${quotationId}`,
        },
      ],
    }),

    deleteQuotationItem: builder.mutation({
      query: ({ quotationId, itemId }) => ({
        url: `/quotations/${quotationId}/items/${itemId}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, { quotationId, itemId }) => [
        "Quotation",
        {
          type: "Quotation",
          id: quotationId,
        },
        {
          type: "QuotationItems",
          id: itemId,
        },
        {
          type: "QuotationItems",
          id: `LIST_${quotationId}`,
        },
      ],
    }),

    // ============================================================
    // QUOTATION VERSIONS
    // ============================================================

    getQuotationVersions: builder.query({
      query: (quotationId) => `/quotations/${quotationId}/versions`,

      providesTags: (result, error, quotationId) => {
        const versions = Array.isArray(result) ? result : result?.data || [];

        return [
          ...versions.filter(Boolean).map((version) => ({
            type: "QuotationVersions",
            id: version.id,
          })),

          {
            type: "QuotationVersions",
            id: `LIST_${quotationId}`,
          },
        ];
      },
    }),

    createQuotationVersion: builder.mutation({
      query: ({ quotationId, created_by, remarks }) => ({
        url: `/quotations/${quotationId}/versions`,
        method: "POST",
        body: {
          created_by,
          remarks,
        },
      }),

      invalidatesTags: (result, error, { quotationId }) => [
        "Quotation",
        {
          type: "Quotation",
          id: quotationId,
        },
        "QuotationItems",
        "QuotationVersions",
        {
          type: "QuotationVersions",
          id: `LIST_${quotationId}`,
        },
      ],
    }),

    getQuotationVersion: builder.query({
      query: (id) => `/quotations/versions/${id}`,

      providesTags: (result, error, id) => [
        {
          type: "QuotationVersions",
          id,
        },
      ],
    }),

    deleteQuotationVersion: builder.mutation({
      query: (id) => ({
        url: `/quotations/versions/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["QuotationVersions", "Quotation"],
    }),

    restoreQuotationVersion: builder.mutation({
      query: ({ id, restored_by }) => ({
        url: `/quotations/versions/${id}/restore`,
        method: "POST",
        body: {
          restored_by,
        },
      }),

      invalidatesTags: ["Quotation", "QuotationItems", "QuotationVersions"],
    }),

    // ============================================================
    // QUOTATION COMPARISON
    // ============================================================

    compareQuotations: builder.query({
      query: (ids) => ({
        url: "/quotations/compare",
        params: {
          ids: ids.join(","),
        },
      }),

      providesTags: ["Quotation"],
    }),

    saveQuotationComparison: builder.mutation({
      query: (body) => ({
        url: "/quotations/quotation-comparisons",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Quotation"],
    }),

    markQuotationSelected: builder.mutation({
      query: ({ id, remarks }) => ({
        url: `/quotations/${id}/mark-selected`,
        method: "POST",
        body: {
          remarks,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        "Quotation",
        {
          type: "Quotation",
          id,
        },
      ],
    }),

    // ============================================================
    // DASHBOARD — SUMMARY
    // ============================================================

    getQuotationsSummary: builder.query({
      query: () => "/quotations/summary",

      providesTags: ["QuotationDashboard"],
    }),

    // ============================================================
    // DASHBOARD — PROJECT WISE
    // ============================================================

    getQuotationsProjectWise: builder.query({
      query: () => "/quotations/project-wise",

      providesTags: ["QuotationDashboard"],
    }),

    // ============================================================
    // DASHBOARD — EXPIRING SOON
    // ============================================================

    getQuotationsExpiringSoon: builder.query({
      query: (withinDays = 7) =>
        `/quotations/expiring-soon?within_days=${withinDays}`,

      providesTags: ["QuotationDashboard"],
    }),

    // ============================================================
    // DASHBOARD — BOQ VARIANCE
    // ============================================================

    getQuotationsBoqVariance: builder.query({
      query: () => "/quotations/boq-variance",

      providesTags: ["QuotationDashboard"],
    }),

    // ============================================================
    // DASHBOARD — VALUE TREND
    // ============================================================

    getQuotationsValueTrend: builder.query({
      query: (months = 6) => `/quotations/value-trend?months=${months}`,

      providesTags: ["QuotationDashboard"],
    }),

    // ============================================================
    // DASHBOARD — STATUS MIX
    // ============================================================

    getQuotationsStatusMix: builder.query({
      query: () => "/quotations/status-mix",

      providesTags: ["QuotationDashboard"],
    }),

    // ============================================================
    // DASHBOARD — VARIATION BY PROJECT
    // ============================================================

    getQuotationsVariationByProject: builder.query({
      query: (limit = 6) => `/quotations/variation-by-project?limit=${limit}`,

      providesTags: ["QuotationDashboard"],
    }),
  }),

  overrideExisting: false,
});

// ============================================================
// EXPORT HOOKS
// ============================================================

export const {
  // ------------------------------------------------------------
  // Quotations
  // ------------------------------------------------------------

  useCreateQuotationMutation,

  useGetQuotationsQuery,

  useGetQuotationByIdQuery,

  useUpdateQuotationMutation,

  useSubmitQuotationMutation,

  useApproveQuotationMutation,

  useReturnQuotationMutation,

  useDeclineQuotationMutation,

  useCancelQuotationMutation,

  useRestoreQuotationMutation,

  useSoftDeleteQuotationMutation,

  useDeleteQuotationPermanentMutation,

  // ------------------------------------------------------------
  // Comparison
  // ------------------------------------------------------------

  useCompareQuotationsQuery,

  useSaveQuotationComparisonMutation,

  useMarkQuotationSelectedMutation,

  // ------------------------------------------------------------
  // Items
  // ------------------------------------------------------------

  useCreateQuotationItemMutation,

  useGetQuotationItemsQuery,

  useReplaceQuotationItemsMutation,

  useUpdateQuotationItemMutation,

  useDeleteQuotationItemMutation,

  // ------------------------------------------------------------
  // Versions
  // ------------------------------------------------------------

  useGetQuotationVersionsQuery,

  useCreateQuotationVersionMutation,

  useGetQuotationVersionQuery,

  useDeleteQuotationVersionMutation,

  useRestoreQuotationVersionMutation,

  // ------------------------------------------------------------
  // Dashboard
  // ------------------------------------------------------------

  useGetQuotationsSummaryQuery,

  useGetQuotationsProjectWiseQuery,

  useGetQuotationsExpiringSoonQuery,

  useGetQuotationsBoqVarianceQuery,

  useGetQuotationsValueTrendQuery,

  useGetQuotationsStatusMixQuery,

  useGetQuotationsVariationByProjectQuery,
} = quotationApi;
