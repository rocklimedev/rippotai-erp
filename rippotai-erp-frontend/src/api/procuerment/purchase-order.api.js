// src/store/apis/purchase-order.api.js

import { baseApi } from "../../store/baseApi";

export const purchaseOrderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // PURCHASE ORDERS
    // ============================================================

    /**
     * GET /purchase-orders
     *
     * Optional:
     * ?projectId=<uuid>
     * ?vendorId=<uuid>
     * ?status=<status>
     */
    getPurchaseOrders: builder.query({
      query: ({ projectId, vendorId, status } = {}) => ({
        url: "/purchase-orders",
        method: "GET",
        params: {
          ...(projectId && { projectId }),
          ...(vendorId && { vendorId }),
          ...(status && { status }),
        },
      }),
      providesTags: ["PurchaseOrders"],
    }),

    /**
     * GET /purchase-orders/:id
     */
    getPurchaseOrder: builder.query({
      query: (id) => ({
        url: `/purchase-orders/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "PurchaseOrders", id }],
    }),

    /**
     * POST /purchase-orders
     */
    createPurchaseOrder: builder.mutation({
      query: (body) => ({
        url: "/purchase-orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PurchaseOrders"],
    }),

    /**
     * PATCH /purchase-orders/:id
     */
    updatePurchaseOrder: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/purchase-orders/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "PurchaseOrders",
        { type: "PurchaseOrders", id },
      ],
    }),

    /**
     * POST /purchase-orders/:id/approve
     */
    approvePurchaseOrder: builder.mutation({
      query: (id) => ({
        url: `/purchase-orders/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        "PurchaseOrders",
        { type: "PurchaseOrders", id },
      ],
    }),

    /**
     * POST /purchase-orders/:id/cancel
     */
    cancelPurchaseOrder: builder.mutation({
      query: (id) => ({
        url: `/purchase-orders/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        "PurchaseOrders",
        { type: "PurchaseOrders", id },
      ],
    }),
  }),
});

export const {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
} = purchaseOrderApi;
