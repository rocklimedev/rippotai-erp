// src/store/apis/inventory.api.js

import { baseApi } from "../../store/baseApi";

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // INVENTORY TRANSACTIONS
    // ============================================================

    /**
     * GET /inventory/transactions
     *
     * Optional:
     * ?projectId=<uuid>
     * ?siteId=<uuid>
     * ?materialId=<uuid>
     * ?transactionType=<type>
     * ?fromDate=YYYY-MM-DD
     * ?toDate=YYYY-MM-DD
     */
    getInventoryTransactions: builder.query({
      query: ({
        projectId,
        siteId,
        materialId,
        transactionType,
        fromDate,
        toDate,
      } = {}) => ({
        url: "/inventory/transactions",
        method: "GET",
        params: {
          ...(projectId && { projectId }),
          ...(siteId && { siteId }),
          ...(materialId && { materialId }),
          ...(transactionType && { transactionType }),
          ...(fromDate && { fromDate }),
          ...(toDate && { toDate }),
        },
      }),
      providesTags: ["Inventory"],
    }),

    /**
     * GET /inventory/transactions/:id
     */
    getInventoryTransaction: builder.query({
      query: (id) => ({
        url: `/inventory/transactions/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Inventory", id }],
    }),

    /**
     * POST /inventory/transactions
     */
    createInventoryTransaction: builder.mutation({
      query: (body) => ({
        url: "/inventory/transactions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Inventory"],
    }),

    // ============================================================
    // MATERIAL ISSUE
    // ============================================================

    /**
     * POST /inventory/issue
     */
    issueMaterial: builder.mutation({
      query: (body) => ({
        url: "/inventory/issue",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Inventory"],
    }),

    // ============================================================
    // STOCK
    // ============================================================

    /**
     * GET /inventory/stock/:projectId
     *
     * Optional:
     * ?siteId=<uuid>
     */
    getProjectStock: builder.query({
      query: ({ projectId, siteId }) => ({
        url: `/inventory/stock/${projectId}`,
        method: "GET",
        params: {
          ...(siteId && { siteId }),
        },
      }),
      providesTags: (result, error, { projectId, siteId }) => [
        {
          type: "Inventory",
          id: `STOCK-${projectId}-${siteId || "ALL"}`,
        },
      ],
    }),

    /**
     * GET /inventory/stock/:projectId/:materialId
     *
     * Optional:
     * ?siteId=<uuid>
     */
    getMaterialStock: builder.query({
      query: ({ projectId, materialId, siteId }) => ({
        url: `/inventory/stock/${projectId}/${materialId}`,
        method: "GET",
        params: {
          ...(siteId && { siteId }),
        },
      }),
      providesTags: (result, error, { projectId, materialId, siteId }) => [
        {
          type: "Inventory",
          id: `STOCK-${projectId}-${siteId || "ALL"}-${materialId}`,
        },
      ],
    }),
  }),
});

export const {
  useGetInventoryTransactionsQuery,
  useGetInventoryTransactionQuery,
  useCreateInventoryTransactionMutation,
  useIssueMaterialMutation,
  useGetProjectStockQuery,
  useGetMaterialStockQuery,
} = inventoryApi;
