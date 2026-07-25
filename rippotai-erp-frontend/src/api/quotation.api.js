import { baseApi } from "../store/baseApi";

export const quotationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =========================
    // QUOTATIONS
    // =========================

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

        if (status) params.append("status", status);
        if (project_id) params.append("project_id", project_id);
        if (vendor_id) params.append("vendor_id", vendor_id);
        if (includeDeleted !== undefined)
          params.append("includeDeleted", includeDeleted);

        return `/quotations?${params.toString()}`;
      },
      providesTags: ["Quotation"],
    }),

    getQuotationById: builder.query({
      query: (id) => `/quotations/${id}`,
      providesTags: ["Quotation"],
    }),

    updateQuotation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/quotations/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Quotation"],
    }),

    submitQuotation: builder.mutation({
      query: ({ id, submitted_by }) => ({
        url: `/quotations/${id}/submit`,
        method: "PATCH",
        body: { submitted_by },
      }),
      invalidatesTags: ["Quotation"],
    }),

    approveQuotation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/quotations/${id}/approve`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Quotation"],
    }),

    returnQuotation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/quotations/${id}/return`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Quotation"],
    }),

    declineQuotation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/quotations/${id}/decline`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Quotation"],
    }),

    cancelQuotation: builder.mutation({
      query: ({ id, updated_by }) => ({
        url: `/quotations/${id}/cancel`,
        method: "PATCH",
        body: { updated_by },
      }),
      invalidatesTags: ["Quotation"],
    }),

    restoreQuotation: builder.mutation({
      query: (id) => ({
        url: `/quotations/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: ["Quotation"],
    }),

    softDeleteQuotation: builder.mutation({
      query: ({ id, deleted_by }) => ({
        url: `/quotations/${id}`,
        method: "DELETE",
        body: { deleted_by },
      }),
      invalidatesTags: ["Quotation"],
    }),

    deleteQuotationPermanent: builder.mutation({
      query: (id) => ({
        url: `/quotations/${id}/permanent`,
        method: "DELETE",
      }),
      invalidatesTags: ["Quotation"],
    }),

    // =========================
    // QUOTATION ITEMS
    // =========================

    createQuotationItem: builder.mutation({
      query: ({ quotationId, ...body }) => ({
        url: `/quotations/${quotationId}/items`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["QuotationItems"],
    }),

    getQuotationItems: builder.query({
      query: (quotationId) => `/quotations/${quotationId}/items`,
      providesTags: ["QuotationItems"],
    }),

    replaceQuotationItems: builder.mutation({
      query: ({ quotationId, items }) => ({
        url: `/quotations/${quotationId}/items`,
        method: "PUT",
        body: items,
      }),
      invalidatesTags: ["QuotationItems"],
    }),

    updateQuotationItem: builder.mutation({
      query: ({ itemId, ...body }) => ({
        url: `/quotations/:quotationId/items/${itemId}`.replace(
          ":quotationId",
          "",
        ),
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["QuotationItems"],
    }),

    deleteQuotationItem: builder.mutation({
      query: (itemId) => ({
        url: `/quotations/:quotationId/items/${itemId}`.replace(
          ":quotationId",
          "",
        ),
        method: "DELETE",
      }),
      invalidatesTags: ["QuotationItems"],
    }),

    // =========================
    // QUOTATION VERSIONS
    // =========================

    // List versions for a quotation
    getQuotationVersions: builder.query({
      query: (quotationId) => `/quotations/${quotationId}/versions`,
      providesTags: (result, error, quotationId) =>
        result
          ? [
              ...result.map((v) => ({
                type: "QuotationVersions",
                id: v.id,
              })),
              { type: "QuotationVersions", id: `LIST_${quotationId}` },
            ]
          : [{ type: "QuotationVersions", id: `LIST_${quotationId}` }],
    }),

    // Create a new version (snapshot)
    createQuotationVersion: builder.mutation({
      query: ({ quotationId, created_by, remarks }) => ({
        url: `/quotations/${quotationId}/versions`,
        method: "POST",
        body: { created_by, remarks },
      }),
      invalidatesTags: ["Quotation", "QuotationItems", "QuotationVersions"],
    }),

    // Get a single version by id
    getQuotationVersion: builder.query({
      query: (id) => `/quotations/versions/${id}`,
      providesTags: (result, error, id) => [{ type: "QuotationVersions", id }],
    }),

    // Delete a version
    deleteQuotationVersion: builder.mutation({
      query: (id) => ({
        url: `/quotations/versions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["QuotationVersions"],
    }),

    // Restore a version into the quotation
    restoreQuotationVersion: builder.mutation({
      query: ({ id, restored_by }) => ({
        url: `/quotations/versions/${id}/restore`,
        method: "POST",
        body: { restored_by },
      }),
      invalidatesTags: ["Quotation", "QuotationItems", "QuotationVersions"],
    }),

    // =========================
    // QUOTATION COMPARISON
    // =========================

    // Compare multiple quotations
    compareQuotations: builder.query({
      query: (ids) => ({
        url: `/quotations/compare`,
        params: {
          ids: ids.join(","),
        },
      }),
      providesTags: ["Quotation"],
    }),

    // Save a comparison
    saveQuotationComparison: builder.mutation({
      query: (body) => ({
        url: "/quotations/quotation-comparisons",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Quotation"],
    }),

    // Mark quotation as selected
    markQuotationSelected: builder.mutation({
      query: ({ id, remarks }) => ({
        url: `/quotations/${id}/mark-selected`,
        method: "POST",
        body: { remarks },
      }),
      invalidatesTags: ["Quotation"],
    }),

    // =========================
    // DASHBOARD — summary card
    // =========================

    getQuotationsSummary: builder.query({
      query: () => "/quotations/summary",
      providesTags: ["QuotationDashboard"],
    }),

    // =========================
    // DASHBOARD — Phase 8 tables/lists
    // =========================

    getQuotationsProjectWise: builder.query({
      query: () => "/quotations/project-wise",
      providesTags: ["QuotationDashboard"],
    }),

    getQuotationsExpiringSoon: builder.query({
      query: (withinDays = 7) =>
        `/quotations/expiring-soon?within_days=${withinDays}`,
      providesTags: ["QuotationDashboard"],
    }),

    getQuotationsBoqVariance: builder.query({
      query: () => "/quotations/boq-variance",
      providesTags: ["QuotationDashboard"],
    }),

    // =========================
    // DASHBOARD — Phase 10 charts
    // =========================

    getQuotationsValueTrend: builder.query({
      query: (months = 6) => `/quotations/value-trend?months=${months}`,
      providesTags: ["QuotationDashboard"],
    }),

    getQuotationsStatusMix: builder.query({
      query: () => "/quotations/status-mix",
      providesTags: ["QuotationDashboard"],
    }),

    getQuotationsVariationByProject: builder.query({
      query: (limit = 6) => `/quotations/variation-by-project?limit=${limit}`,
      providesTags: ["QuotationDashboard"],
    }),
  }),
  overrideExisting: false,
});

// =========================
// EXPORT HOOKS
// =========================

export const {
  // quotations
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

  // comparison
  useCompareQuotationsQuery,
  useSaveQuotationComparisonMutation,
  useMarkQuotationSelectedMutation,

  // items
  useCreateQuotationItemMutation,
  useGetQuotationItemsQuery,
  useReplaceQuotationItemsMutation,
  useUpdateQuotationItemMutation,
  useDeleteQuotationItemMutation,

  // versions
  useGetQuotationVersionsQuery,
  useCreateQuotationVersionMutation,
  useGetQuotationVersionQuery,
  useDeleteQuotationVersionMutation,
  useRestoreQuotationVersionMutation,

  // dashboard
  useGetQuotationsSummaryQuery,
  useGetQuotationsProjectWiseQuery,
  useGetQuotationsExpiringSoonQuery,
  useGetQuotationsBoqVarianceQuery,
  useGetQuotationsValueTrendQuery,
  useGetQuotationsStatusMixQuery,
  useGetQuotationsVariationByProjectQuery,
} = quotationApi;
