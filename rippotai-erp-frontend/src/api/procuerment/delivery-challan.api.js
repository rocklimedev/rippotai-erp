// src/store/apis/delivery-challan.api.js

import { baseApi } from "../../store/baseApi";

export const deliveryChallanApi = baseApi.injectEndpoints({
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
        { type: "DeliveryChallans", id },
      ],
    }),

    /**
     * POST /delivery-challans/:id/receive
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
  }),
});

export const {
  useGetDeliveryChallansQuery,
  useGetDeliveryChallanQuery,
  useCreateDeliveryChallanMutation,
  useUpdateDeliveryChallanMutation,
  useReceiveDeliveryChallanMutation,
} = deliveryChallanApi;
