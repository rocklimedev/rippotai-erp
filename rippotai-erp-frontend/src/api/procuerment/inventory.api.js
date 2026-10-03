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

      providesTags: (result) => [
        "Inventory",
        ...(result?.map?.((item) => ({
          type: "Inventory",
          id: item.id,
        })) || []),
      ],
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
     *
     * Generic inventory transaction endpoint.
     *
     * Prefer the dedicated APIs below for normal application
     * flows such as receipt, issue, transfer, adjustment, etc.
     */
    createInventoryTransaction: builder.mutation({
      query: (body) => ({
        url: "/inventory/transactions",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Inventory", "InventoryStock", "InventorySummary"],
    }),

    // ============================================================
    // ADD / RECEIVE INVENTORY
    // ============================================================

    /**
     * POST /inventory/receive
     *
     * Adds material into project/site inventory.
     *
     * Used for:
     * - Manual receipt
     * - Material received from vendor
     * - General stock addition
     */
    receiveInventory: builder.mutation({
      query: (body) => ({
        url: "/inventory/receive",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Inventory", "InventoryStock", "InventorySummary"],
    }),

    /**
     * POST /inventory/opening-stock
     *
     * Adds opening stock to a project/site.
     */
    addOpeningStock: builder.mutation({
      query: (body) => ({
        url: "/inventory/opening-stock",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Inventory", "InventoryStock", "InventorySummary"],
    }),

    /**
     * POST /inventory/receive-delivery
     *
     * Receives accepted material from a Delivery Challan.
     *
     * Supports partial acceptance through:
     * accepted_quantity
     */
    receiveDeliveryInventory: builder.mutation({
      query: (body) => ({
        url: "/inventory/receive-delivery",
        method: "POST",
        body,
      }),

      invalidatesTags: [
        "Inventory",
        "InventoryStock",
        "InventorySummary",
        "DeliveryChallan",
      ],
    }),

    // ============================================================
    // MATERIAL ISSUE
    // ============================================================

    /**
     * POST /inventory/issue
     *
     * Removes material from project/site inventory.
     */
    issueMaterial: builder.mutation({
      query: (body) => ({
        url: "/inventory/issue",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Inventory", "InventoryStock", "InventorySummary"],
    }),

    // ============================================================
    // STOCK ADJUSTMENT
    // ============================================================

    /**
     * POST /inventory/adjust
     *
     * Manual stock correction.
     *
     * direction:
     * - IN
     * - OUT
     *
     * The backend converts this to:
     * - ADJUSTMENT_IN
     * - ADJUSTMENT_OUT
     */
    adjustInventory: builder.mutation({
      query: (body) => ({
        url: "/inventory/adjust",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Inventory", "InventoryStock", "InventorySummary"],
    }),

    // ============================================================
    // TRANSFER
    // ============================================================

    /**
     * POST /inventory/transfer
     *
     * Transfers material:
     *
     * Site A
     *   ↓
     * TRANSFER_OUT
     *   ↓
     * TRANSFER_IN
     *   ↓
     * Site B
     */
    transferInventory: builder.mutation({
      query: (body) => ({
        url: "/inventory/transfer",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Inventory", "InventoryStock", "InventorySummary"],
    }),

    // ============================================================
    // RETURNS
    // ============================================================

    /**
     * POST /inventory/return
     *
     * Supports:
     *
     * RETURN_FROM_CONTRACTOR
     * RETURN_TO_VENDOR
     */
    returnInventory: builder.mutation({
      query: (body) => ({
        url: "/inventory/return",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Inventory", "InventoryStock", "InventorySummary"],
    }),

    // ============================================================
    // REVERSAL / CORRECTION
    // ============================================================

    /**
     * POST /inventory/reverse/:id
     *
     * Creates a correcting transaction against an existing
     * inventory transaction.
     *
     * The original transaction remains untouched.
     */
    reverseInventoryTransaction: builder.mutation({
      query: ({ id, reason, quantity }) => ({
        url: `/inventory/reverse/${id}`,
        method: "POST",
        body: {
          reason,
          ...(quantity !== undefined && {
            quantity,
          }),
        },
      }),

      invalidatesTags: ["Inventory", "InventoryStock", "InventorySummary"],
    }),

    // ============================================================
    // PROJECT STOCK
    // ============================================================

    /**
     * GET /inventory/stock/:projectId
     *
     * Optional:
     * ?siteId=<uuid>
     *
     * Returns current stock for all materials.
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
        "InventoryStock",
        {
          type: "Inventory",
          id: `STOCK-${projectId}-${siteId || "ALL"}`,
        },
      ],
    }),

    // ============================================================
    // MATERIAL STOCK
    // ============================================================

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
        "InventoryStock",
        {
          type: "Inventory",
          id: `STOCK-${projectId}-${siteId || "ALL"}-${materialId}`,
        },
      ],
    }),

    // ============================================================
    // MATERIAL HISTORY
    // ============================================================

    /**
     * GET /inventory/material-history/:projectId/:materialId
     *
     * Optional:
     * ?siteId=<uuid>
     */
    getMaterialInventoryHistory: builder.query({
      query: ({ projectId, materialId, siteId }) => ({
        url: `/inventory/material-history/${projectId}/${materialId}`,
        method: "GET",
        params: {
          ...(siteId && { siteId }),
        },
      }),

      providesTags: (result, error, { projectId, materialId, siteId }) => [
        {
          type: "Inventory",
          id: `HISTORY-${projectId}-${siteId || "ALL"}-${materialId}`,
        },
      ],
    }),

    // ============================================================
    // SITE STOCK
    // ============================================================

    /**
     * GET /inventory/site-stock/:projectId/:siteId
     */
    getSiteStock: builder.query({
      query: ({ projectId, siteId }) => ({
        url: `/inventory/site-stock/${projectId}/${siteId}`,
        method: "GET",
      }),

      providesTags: (result, error, { projectId, siteId }) => [
        "InventoryStock",
        {
          type: "Inventory",
          id: `SITE-STOCK-${projectId}-${siteId}`,
        },
      ],
    }),

    // ============================================================
    // INVENTORY SUMMARY
    // ============================================================

    /**
     * GET /inventory/summary/:projectId
     *
     * Optional:
     * ?siteId=<uuid>
     *
     * Useful for dashboard cards:
     *
     * - Total materials
     * - Total stock
     * - Total received
     * - Total issued
     * - Low/zero stock
     */
    getInventorySummary: builder.query({
      query: ({ projectId, siteId }) => ({
        url: `/inventory/summary/${projectId}`,
        method: "GET",
        params: {
          ...(siteId && { siteId }),
        },
      }),

      providesTags: (result, error, { projectId, siteId }) => [
        "InventorySummary",
        {
          type: "Inventory",
          id: `SUMMARY-${projectId}-${siteId || "ALL"}`,
        },
      ],
    }),
  }),

  // ============================================================
  // IMPORTANT
  // ============================================================
  //
  // If another API file already declares Inventory / InventoryStock
  // / InventorySummary / DeliveryChallan tags, keep the existing
  // tagTypes declaration centralized in baseApi.
  //
  // Do NOT add tagTypes here.
  //
  // ============================================================
});

// ============================================================
// HOOKS
// ============================================================

export const {
  // Transactions
  useGetInventoryTransactionsQuery,
  useGetInventoryTransactionQuery,
  useCreateInventoryTransactionMutation,

  // Add / Receive
  useReceiveInventoryMutation,
  useAddOpeningStockMutation,
  useReceiveDeliveryInventoryMutation,

  // Issue
  useIssueMaterialMutation,

  // Adjustment
  useAdjustInventoryMutation,

  // Transfer
  useTransferInventoryMutation,

  // Return
  useReturnInventoryMutation,

  // Reversal
  useReverseInventoryTransactionMutation,

  // Stock
  useGetProjectStockQuery,
  useGetMaterialStockQuery,
  useGetSiteStockQuery,

  // History
  useGetMaterialInventoryHistoryQuery,

  // Summary
  useGetInventorySummaryQuery,
} = inventoryApi;
