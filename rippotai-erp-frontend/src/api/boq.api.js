import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";

export const boqApi = createApi({
  reducerPath: "boqApi",

  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    credentials: "include", // Remove if using Bearer token
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("bc_token"); // aligned with AuthContext
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      const cdnToken = import.meta.env.VITE_CDN_TOKEN;
      if (cdnToken) {
        headers.set("x-cdn-secret", cdnToken);
      }
      return headers;
    },
  }),

  tagTypes: [
    "BOQ",
    "BOQ_TEMPLATE",
    "BOQ_ACTIVITY",
    "LIBRARY",
    "BOQ_CATALOG",
    "BOQ_VERSION",
  ],

  endpoints: (builder) => ({
    // ==========================
    // BOQ
    // ==========================

    getBoqs: builder.query({
      query: (params = {}) => ({
        url: "/boqs",
        params: {
          ...(params.project_id && { project_id: params.project_id }),
          ...(params.status && { status: params.status }),
          ...(params.q && { q: params.q }),
        },
      }),
      providesTags: ["BOQ"],
    }),
    getBoqById: builder.query({
      query: (id) => `/boqs/${id}`,
      providesTags: (result, error, id) => [{ type: "BOQ", id }],
    }),

    createBoq: builder.mutation({
      query: (body) => ({
        url: "/boqs",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BOQ"],
    }),

    updateBoq: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/boqs/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "BOQ", id }, "BOQ"],
    }),

    deleteBoq: builder.mutation({
      query: (id) => ({
        url: `/boqs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BOQ"],
    }),

    // ---- Workflow ----

    submitBoqForApproval: builder.mutation({
      query: ({ id, note }) => ({
        url: `/boqs/${id}/submit-for-approval`,
        method: "POST",
        body: { note },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "BOQ", id }],
    }),

    approveBoq: builder.mutation({
      query: ({ id, remarks }) => ({
        url: `/boqs/${id}/approve`,
        method: "POST",
        body: { remarks },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "BOQ", id }],
    }),

    // `reason`/`note` are shown in the activity log; `versionName` (optional)
    // becomes the label on the new BoqVersion row, e.g. "Client revision 2".
    duplicateBoqVersion: builder.mutation({
      query: ({ id, reason, note, versionName }) => ({
        url: `/boqs/${id}/duplicate-version`,
        method: "POST",
        body: { reason, note, version_name: versionName },
      }),
      invalidatesTags: (result, error, { id }) => [
        "BOQ",
        { type: "BOQ_VERSION", id },
      ],
    }),

    createBoqNewVersion: builder.mutation({
      query: ({ id }) => ({
        url: `/boqs/${id}/new-version`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { id }) => [
        "BOQ",
        { type: "BOQ_VERSION", id },
      ],
    }),

    // Full version history (oldest → newest) for the family a boq
    // belongs to — works from any version's id, not just v1's.
    getBoqVersionHistory: builder.query({
      query: (id) => `/boqs/${id}/versions`,
      providesTags: (result, error, id) => [{ type: "BOQ_VERSION", id }],
    }),

    // Relabels one BoqVersion row without touching its Boq snapshot.
    // Pass `boqId` (any id in the family) so the history cache for
    // that family gets invalidated and refetches.
    renameBoqVersion: builder.mutation({
      query: ({ versionId, versionName }) => ({
        url: `/boqs/versions/${versionId}`,
        method: "PATCH",
        body: { version_name: versionName },
      }),
      invalidatesTags: (result, error, { boqId }) =>
        boqId ? [{ type: "BOQ_VERSION", id: boqId }] : ["BOQ_VERSION"],
    }),

    // Line-item diff between two boq snapshots (`id` vs `vs`), for the
    // "Compare current with…" panel. `id`/`vs` can be any two ids in
    // (or out of) the same family.
    compareBoqVersions: builder.query({
      query: ({ id, vs }) => `/boqs/${id}/compare?vs=${vs}`,
      providesTags: (result, error, { id, vs }) => [
        { type: "BOQ_VERSION", id },
        { type: "BOQ_VERSION", id: vs },
      ],
    }),
    applyBoqTerms: builder.mutation({
      query: ({ id, terms_template_id, version }) => ({
        url: `/boqs/${id}/terms`,
        method: "PATCH",
        body: { terms_template_id, version },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Boq", id }],
    }),
    // ==========================
    // BOQ Categories
    // ==========================

    addBoqCategory: builder.mutation({
      // body may include { name } or { catalog_code, include_items }
      query: ({ boqId, ...body }) => ({
        url: `/boqs/${boqId}/categories`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { boqId }) => [
        { type: "BOQ", id: boqId },
      ],
    }),

    updateBoqCategory: builder.mutation({
      query: ({ boqId, categoryId, ...body }) => ({
        url: `/boqs/${boqId}/categories/${categoryId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { boqId }) => [
        { type: "BOQ", id: boqId },
      ],
    }),

    deleteBoqCategory: builder.mutation({
      query: ({ boqId, categoryId }) => ({
        url: `/boqs/${boqId}/categories/${categoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { boqId }) => [
        { type: "BOQ", id: boqId },
      ],
    }),

    // ==========================
    // BOQ Items
    // ==========================

    addBoqItem: builder.mutation({
      query: ({ boqId, categoryId, ...body }) => ({
        url: `/boqs/${boqId}/categories/${categoryId}/items`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { boqId }) => [
        { type: "BOQ", id: boqId },
      ],
    }),

    updateBoqItem: builder.mutation({
      // also used for the hide/show toggle: { boqId, itemId, hidden: true }
      query: ({ boqId, itemId, ...body }) => ({
        url: `/boqs/${boqId}/items/${itemId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { boqId }) => [
        { type: "BOQ", id: boqId },
      ],
    }),

    deleteBoqItem: builder.mutation({
      query: ({ boqId, itemId }) => ({
        url: `/boqs/${boqId}/items/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { boqId }) => [
        { type: "BOQ", id: boqId },
      ],
    }),

    reorderBoqItems: builder.mutation({
      query: ({ boqId, categoryId, orderedIds }) => ({
        url: `/boqs/${boqId}/items/reorder`,
        method: "POST",
        body: { category_id: categoryId, ordered_ids: orderedIds },
      }),
      invalidatesTags: (result, error, { boqId }) => [
        { type: "BOQ", id: boqId },
      ],
    }),

    bulkUpdateBoqItems: builder.mutation({
      query: ({ boqId, ids, op, value }) => ({
        url: `/boqs/${boqId}/items/bulk`,
        method: "POST",
        body: { ids, op, value },
      }),
      invalidatesTags: (result, error, { boqId }) => [
        { type: "BOQ", id: boqId },
      ],
    }),

    // ==========================
    // Export
    // ==========================

    exportBoqExcel: builder.mutation({
      queryFn: async ({ boqId, filename }, _api, _extra, baseQuery) => {
        const result = await baseQuery({
          url: `/boqs/${boqId}/export/excel`,
          responseHandler: (r) => r.blob(),
        });
        if (result.error) return result;
        downloadBlob(result.data, filename);
        return { data: { ok: true } };
      },
    }),

    exportBoqPdf: builder.mutation({
      queryFn: async (
        { boqId, variant, filename },
        _api,
        _extra,
        baseQuery,
      ) => {
        const result = await baseQuery({
          url: `/boqs/${boqId}/export/pdf`,
          method: "POST",
          body: { variant },
          responseHandler: (r) => r.blob(),
        });
        if (result.error) return result;
        downloadBlob(result.data, filename);
        return { data: { ok: true } };
      },
    }),

    getBoqPdfThumbnail: builder.query({
      queryFn: async ({ boqId, variant }, _api, _extra, baseQuery) => {
        const result = await baseQuery({
          url: `/boqs/${boqId}/export/pdf-thumbnail?variant=${variant}`,
          method: "POST",
          responseHandler: (r) => r.blob(),
        });
        if (result.error) return result;
        return { data: URL.createObjectURL(result.data) };
      },
    }),

    // ==========================
    // Catalog (predefined categories + preset items for "Add Category")
    // ==========================

    getBoqCatalog: builder.query({
      query: () => "/boq-catalog",
      providesTags: ["BOQ_CATALOG"],
    }),

    // ==========================
    // Templates
    // ==========================

    getTemplates: builder.query({
      query: () => "/boq/templates",
      providesTags: ["BOQ_TEMPLATE"],
    }),

    getTemplateById: builder.query({
      query: (id) => `/boq/templates/${id}`,
      providesTags: ["BOQ_TEMPLATE"],
    }),

    createTemplate: builder.mutation({
      query: (body) => ({
        url: "/boq/templates",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BOQ_TEMPLATE"],
    }),

    updateTemplate: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/boq/templates/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["BOQ_TEMPLATE"],
    }),

    deleteTemplate: builder.mutation({
      query: (id) => ({
        url: `/boq/templates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BOQ_TEMPLATE"],
    }),

    // ---- Template Categories ----

    addTemplateCategory: builder.mutation({
      query: ({ templateId, name }) => ({
        url: `/boq/templates/${templateId}/categories`,
        method: "POST",
        body: { name },
      }),
      invalidatesTags: ["BOQ_TEMPLATE"],
    }),

    deleteTemplateCategory: builder.mutation({
      query: ({ templateId, categoryId }) => ({
        url: `/boq/templates/${templateId}/categories/${categoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BOQ_TEMPLATE"],
    }),

    // ---- Template Items ----

    addTemplateItem: builder.mutation({
      query: ({ templateId, categoryId, ...body }) => ({
        url: `/boq/templates/${templateId}/categories/${categoryId}/items`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["BOQ_TEMPLATE"],
    }),

    updateTemplateItem: builder.mutation({
      query: ({ templateId, itemId, ...body }) => ({
        url: `/boq/templates/${templateId}/items/${itemId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["BOQ_TEMPLATE"],
    }),

    deleteTemplateItem: builder.mutation({
      query: ({ templateId, itemId }) => ({
        url: `/boq/templates/${templateId}/items/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BOQ_TEMPLATE"],
    }),

    reorderTemplateItems: builder.mutation({
      query: ({ templateId, categoryId, orderedIds }) => ({
        url: `/boq/templates/${templateId}/items/reorder`,
        method: "POST",
        body: { category_id: categoryId, ordered_ids: orderedIds },
      }),
      invalidatesTags: ["BOQ_TEMPLATE"],
    }),

    // ==========================
    // Activity
    // ==========================

    getActivity: builder.query({
      query: (params) => ({
        url: "/boq/activity",
        params,
      }),
      providesTags: ["BOQ_ACTIVITY"],
    }),

    // ==========================
    // Library
    // ==========================

    getLibraryCategories: builder.query({
      query: () => "/library/categories",
      providesTags: ["LIBRARY"],
    }),

    createLibraryCategory: builder.mutation({
      query: (body) => ({
        url: "/library/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["LIBRARY"],
    }),

    getLibraryItems: builder.query({
      query: (params) => ({
        url: "/library/items",
        params,
      }),
      providesTags: ["LIBRARY"],
    }),

    getLibraryItem: builder.query({
      query: (id) => `/library/items/${id}`,
      providesTags: ["LIBRARY"],
    }),

    createLibraryItem: builder.mutation({
      query: (body) => ({
        url: "/library/items",
        method: "POST",
        body,
      }),
      invalidatesTags: ["LIBRARY"],
    }),

    updateLibraryItem: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/library/items/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["LIBRARY"],
    }),

    deleteLibraryItem: builder.mutation({
      query: (id) => ({
        url: `/library/items/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LIBRARY"],
    }),
    getBoqSummary: builder.query({
      query: () => "/boqs/summary",
      providesTags: ["BOQ"],
    }),

    getBoqProductivity: builder.query({
      query: () => "/boqs/productivity",
      providesTags: ["BOQ"],
    }),

    getBoqProjectWise: builder.query({
      query: () => "/boqs/project-wise",
      providesTags: ["BOQ"],
    }),

    getBoqValueTrend: builder.query({
      query: () => "/boqs/value-trend?months=6",
      providesTags: ["BOQ"],
    }),

    getBoqMonthlyVolume: builder.query({
      query: () => "/boqs/monthly-volume?months=6",
      providesTags: ["BOQ"],
    }),

    getBoqStatusMix: builder.query({
      query: () => "/boqs/status-mix",
      providesTags: ["BOQ"],
    }),

    getBoqRecentlyEdited: builder.query({
      query: (limit = 5) => `/boqs/recently-edited?limit=${limit}`,
      providesTags: ["BOQ"],
    }),
  }),
});

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const {
  useGetBoqsQuery,
  useGetBoqByIdQuery,
  useCreateBoqMutation,
  useUpdateBoqMutation,
  useDeleteBoqMutation,

  useSubmitBoqForApprovalMutation,
  useApproveBoqMutation,
  useDuplicateBoqVersionMutation,
  useCreateBoqNewVersionMutation,
  useGetBoqVersionHistoryQuery,
  useLazyGetBoqVersionHistoryQuery,
  useRenameBoqVersionMutation,
  useLazyCompareBoqVersionsQuery,

  useAddBoqCategoryMutation,
  useUpdateBoqCategoryMutation,
  useDeleteBoqCategoryMutation,

  useAddBoqItemMutation,
  useUpdateBoqItemMutation,
  useDeleteBoqItemMutation,
  useReorderBoqItemsMutation,
  useBulkUpdateBoqItemsMutation,

  useExportBoqExcelMutation,
  useExportBoqPdfMutation,
  useGetBoqPdfThumbnailQuery,

  useGetBoqCatalogQuery,

  useGetTemplatesQuery,
  useGetTemplateByIdQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,

  useAddTemplateCategoryMutation,
  useDeleteTemplateCategoryMutation,

  useAddTemplateItemMutation,
  useUpdateTemplateItemMutation,
  useDeleteTemplateItemMutation,
  useReorderTemplateItemsMutation,

  useGetActivityQuery,
  useApplyBoqTermsMutation,
  useGetLibraryCategoriesQuery,
  useCreateLibraryCategoryMutation,
  useGetLibraryItemsQuery,
  useGetLibraryItemQuery,
  useCreateLibraryItemMutation,
  useUpdateLibraryItemMutation,
  useDeleteLibraryItemMutation,

  useGetBoqSummaryQuery,
  useGetBoqProductivityQuery,
  useGetBoqProjectWiseQuery,
  useGetBoqValueTrendQuery,
  useGetBoqMonthlyVolumeQuery,
  useGetBoqStatusMixQuery,
  useGetBoqRecentlyEditedQuery,
} = boqApi;
