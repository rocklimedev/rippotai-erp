// src/api/procuerment/delivery-challan.api.js

import { baseApi } from "../../store/baseApi";

export const deliveryChallanApi = baseApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (builder) => ({
    // ============================================================
    // DELIVERY CHALLANS
    // ============================================================

    /**
     * GET /delivery-challans
     *
     * Optional:
     * ?projectId=<uuid>
     * ?purchaseOrderId=<uuid>
     * ?vendorId=<uuid>
     * ?status=<status>
     */
    getDeliveryChallans: builder.query({
      query: ({ projectId, purchaseOrderId, vendorId, status } = {}) => ({
        url: "/delivery-challans",
        method: "GET",
        params: {
          ...(projectId && { projectId }),
          ...(purchaseOrderId && { purchaseOrderId }),
          ...(vendorId && { vendorId }),
          ...(status && { status }),
        },
      }),

      providesTags: ["DeliveryChallans"],
    }),

    // ============================================================
    // GET SINGLE DELIVERY CHALLAN
    // ============================================================

    /**
     * GET /delivery-challans/:id
     */
    getDeliveryChallan: builder.query({
      query: (id) => ({
        url: `/delivery-challans/${id}`,
        method: "GET",
      }),

      providesTags: (result, error, id) => [{ type: "DeliveryChallans", id }],
    }),

    // ============================================================
    // CREATE
    // ============================================================

    /**
     * POST /delivery-challans
     */
    createDeliveryChallan: builder.mutation({
      query: (body) => ({
        url: "/delivery-challans",
        method: "POST",
        body,
      }),

      invalidatesTags: ["DeliveryChallans", "PurchaseOrders", "Inventory"],
    }),

    // ============================================================
    // UPDATE
    // ============================================================

    /**
     * PATCH /delivery-challans/:id
     */
    updateDeliveryChallan: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/delivery-challans/${id}`,
        method: "PATCH",
        body,
      }),

      invalidatesTags: (result, error, { id }) => [
        "DeliveryChallans",
        "PurchaseOrders",
        "Inventory",
        { type: "DeliveryChallans", id },
      ],
    }),

    // ============================================================
    // RECEIVE DELIVERY CHALLAN
    // ============================================================

    /**
     * POST /delivery-challans/:id/receive
     *
     * Used when the complete delivery is received.
     */
    receiveDeliveryChallan: builder.mutation({
      query: (id) => ({
        url: `/delivery-challans/${id}/receive`,
        method: "POST",
      }),

      invalidatesTags: (result, error, id) => [
        "DeliveryChallans",
        "PurchaseOrders",
        "Inventory",
        { type: "DeliveryChallans", id },
      ],
    }),

    // ============================================================
    // COMPLETE DELIVERY CHALLAN
    // ============================================================

    /**
     * POST /delivery-challans/:id/complete
     *
     * Completes a Delivery Challan after all accepted quantities
     * have been received/verified.
     *
     * Body is optional.
     *
     * Example:
     * completeDeliveryChallan(id)
     *
     * or
     *
     * completeDeliveryChallan({
     *   id,
     *   remarks: "All materials verified"
     * })
     */
    completeDeliveryChallan: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/delivery-challans/${id}/complete`,
        method: "POST",
        ...(Object.keys(body).length > 0 ? { body } : {}),
      }),

      invalidatesTags: (result, error, { id }) => [
        "DeliveryChallans",
        "PurchaseOrders",
        "Inventory",
        { type: "DeliveryChallans", id },
      ],
    }),

    // ============================================================
    // UPDATE DELIVERY CHALLAN STATUS
    // ============================================================

    /**
     * PATCH /delivery-challans/:id/status
     *
     * Example:
     *
     * updateDeliveryChallanStatus({
     *   id,
     *   status: "PARTIALLY_RECEIVED",
     *   remarks: "2 items pending"
     * })
     */
    updateDeliveryChallanStatus: builder.mutation({
      query: ({ id, status, remarks, ...rest }) => ({
        url: `/delivery-challans/${id}/status`,
        method: "PATCH",
        body: {
          status,
          ...(remarks !== undefined && { remarks }),
          ...rest,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        "DeliveryChallans",
        "PurchaseOrders",
        "Inventory",
        { type: "DeliveryChallans", id },
      ],
    }),

    // ============================================================
    // DELIVERY CHALLAN HISTORY
    // ============================================================

    /**
     * GET /delivery-challans/:id/history
     *
     * Returns status changes / receiving history / activity.
     */
    getDeliveryChallanHistory: builder.query({
      query: (id) => ({
        url: `/delivery-challans/${id}/history`,
        method: "GET",
      }),

      providesTags: (result, error, id) => [
        {
          type: "DeliveryChallanHistory",
          id,
        },
      ],
    }),

    // ============================================================
    // DELIVERY CHALLAN ITEM HISTORY
    // ============================================================

    /**
     * GET /delivery-challans/:id/items/:itemId/history
     *
     * Returns history for a specific challan item.
     */
    getDeliveryChallanItemHistory: builder.query({
      query: ({ id, itemId }) => ({
        url: `/delivery-challans/${id}/items/${itemId}/history`,
        method: "GET",
      }),

      providesTags: (result, error, { id, itemId }) => [
        {
          type: "DeliveryChallanItemHistory",
          id: `${id}-${itemId}`,
        },
      ],
    }),

    // ============================================================
    // UPDATE DELIVERY CHALLAN ITEM
    // ============================================================

    /**
     * PATCH /delivery-challans/:id/items/:itemId
     *
     * Useful for partial acceptance/rejection.
     *
     * Example:
     *
     * updateDeliveryChallanItem({
     *   id,
     *   itemId,
     *   accepted_quantity: 5,
     *   rejected_quantity: 1,
     *   remarks: "1 damaged"
     * })
     */
    updateDeliveryChallanItem: builder.mutation({
      query: ({ id, itemId, ...body }) => ({
        url: `/delivery-challans/${id}/items/${itemId}`,
        method: "PATCH",
        body,
      }),

      invalidatesTags: (result, error, { id, itemId }) => [
        "DeliveryChallans",
        "PurchaseOrders",
        "Inventory",
        { type: "DeliveryChallans", id },
        {
          type: "DeliveryChallanItemHistory",
          id: `${id}-${itemId}`,
        },
        {
          type: "DeliveryChallanHistory",
          id,
        },
      ],
    }),

    // ============================================================
    // ACCEPT DELIVERY CHALLAN ITEM
    // ============================================================

    /**
     * POST /delivery-challans/:id/items/:itemId/accept
     *
     * Example:
     *
     * acceptDeliveryChallanItem({
     *   id,
     *   itemId,
     *   accepted_quantity: 10
     * })
     */
    acceptDeliveryChallanItem: builder.mutation({
      query: ({ id, itemId, ...body }) => ({
        url: `/delivery-challans/${id}/items/${itemId}/accept`,
        method: "POST",
        body,
      }),

      invalidatesTags: (result, error, { id, itemId }) => [
        "DeliveryChallans",
        "PurchaseOrders",
        "Inventory",
        { type: "DeliveryChallans", id },
        {
          type: "DeliveryChallanItemHistory",
          id: `${id}-${itemId}`,
        },
        {
          type: "DeliveryChallanHistory",
          id,
        },
      ],
    }),

    // ============================================================
    // REJECT DELIVERY CHALLAN ITEM
    // ============================================================

    /**
     * POST /delivery-challans/:id/items/:itemId/reject
     *
     * Example:
     *
     * rejectDeliveryChallanItem({
     *   id,
     *   itemId,
     *   rejected_quantity: 2,
     *   reason: "Damaged material"
     * })
     */
    rejectDeliveryChallanItem: builder.mutation({
      query: ({ id, itemId, ...body }) => ({
        url: `/delivery-challans/${id}/items/${itemId}/reject`,
        method: "POST",
        body,
      }),

      invalidatesTags: (result, error, { id, itemId }) => [
        "DeliveryChallans",
        "PurchaseOrders",
        "Inventory",
        { type: "DeliveryChallans", id },
        {
          type: "DeliveryChallanItemHistory",
          id: `${id}-${itemId}`,
        },
        {
          type: "DeliveryChallanHistory",
          id,
        },
      ],
    }),

    // ============================================================
    // RECEIVE PARTIAL DELIVERY
    // ============================================================

    /**
     * POST /delivery-challans/:id/partial-receive
     *
     * Used when only part of the material has arrived/been accepted.
     *
     * Example:
     *
     * partialReceiveDeliveryChallan({
     *   id,
     *   remarks: "Remaining 5 units expected tomorrow",
     *   items: [
     *     {
     *       item_id: "...",
     *       accepted_quantity: 5,
     *       rejected_quantity: 0
     *     }
     *   ]
     * })
     */
    partialReceiveDeliveryChallan: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/delivery-challans/${id}/partial-receive`,
        method: "POST",
        body,
      }),

      invalidatesTags: (result, error, { id }) => [
        "DeliveryChallans",
        "PurchaseOrders",
        "Inventory",
        { type: "DeliveryChallans", id },
        {
          type: "DeliveryChallanHistory",
          id,
        },
      ],
    }),

    // ============================================================
    // ADD DELIVERY CHALLAN HISTORY / STATUS LOG
    // ============================================================

    /**
     * POST /delivery-challans/:id/history
     *
     * Used if your backend supports manually adding an activity/
     * status history entry.
     */
    addDeliveryChallanHistory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/delivery-challans/${id}/history`,
        method: "POST",
        body,
      }),

      invalidatesTags: (result, error, { id }) => [
        {
          type: "DeliveryChallanHistory",
          id,
        },
        { type: "DeliveryChallans", id },
        "DeliveryChallans",
      ],
    }),

    deleteDeliveryChallan: builder.mutation({
      query: (id) => ({ url: `/delivery-challans/${id}`, method: "DELETE" }),
      invalidatesTags: ["DeliveryChallans", "PurchaseOrders", "Inventory"],
    }),
  }),
});

// ================================================================
// HOOKS
// ================================================================

export const {
  // List
  useGetDeliveryChallansQuery,
  useDeleteDeliveryChallanMutation,
  // Single
  useGetDeliveryChallanQuery,

  // CRUD
  useCreateDeliveryChallanMutation,
  useUpdateDeliveryChallanMutation,

  // Receiving
  useReceiveDeliveryChallanMutation,
  usePartialReceiveDeliveryChallanMutation,

  // Completion
  useCompleteDeliveryChallanMutation,

  // Status
  useUpdateDeliveryChallanStatusMutation,

  // History
  useGetDeliveryChallanHistoryQuery,
  useGetDeliveryChallanItemHistoryQuery,
  useAddDeliveryChallanHistoryMutation,

  // Items
  useUpdateDeliveryChallanItemMutation,
  useAcceptDeliveryChallanItemMutation,
  useRejectDeliveryChallanItemMutation,
} = deliveryChallanApi;
