import { baseApi } from "../../store/baseApi";

export const workOrdersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =========================================================
    // WORK ORDERS
    // =========================================================

    getWorkOrders: builder.query({
      query: (params) => ({
        url: "/work-orders",
        params: params || undefined,
      }),
      providesTags: ["WorkOrders"],
    }),

    // =========================================================
    // DETAIL
    // =========================================================

    getWorkOrder: builder.query({
      query: (id) => ({
        url: `/work-orders/${id}`,
      }),
      providesTags: ["WorkOrders"],
    }),

    // =========================================================
    // CREATE
    // =========================================================

    createWorkOrder: builder.mutation({
      query: (body) => ({
        url: "/work-orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["WorkOrders"],
    }),

    // =========================================================
    // UPDATE
    // =========================================================

    updateWorkOrder: builder.mutation({
      query: ({ id, body }) => ({
        url: `/work-orders/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["WorkOrders"],
    }),

    // =========================================================
    // STATUS
    // =========================================================

    updateWorkOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/work-orders/${id}/status`,
        method: "PATCH",
        body: {
          status,
        },
      }),
      invalidatesTags: ["WorkOrders"],
    }),

    // =========================================================
    // APPROVE
    // =========================================================

    approveWorkOrder: builder.mutation({
      query: (id) => ({
        url: `/work-orders/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["WorkOrders"],
    }),

    // =========================================================
    // REJECT
    // =========================================================

    rejectWorkOrder: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/work-orders/${id}/reject`,
        method: "PATCH",
        body: {
          ...(reason ? { reason } : {}),
        },
      }),
      invalidatesTags: ["WorkOrders"],
    }),

    // =========================================================
    // DELETE
    // =========================================================

    deleteWorkOrder: builder.mutation({
      query: (id) => ({
        url: `/work-orders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WorkOrders"],
    }),
  }),

  overrideExisting: false,
});

export const {
  // Queries
  useGetWorkOrdersQuery,
  useLazyGetWorkOrdersQuery,

  useGetWorkOrderQuery,
  useLazyGetWorkOrderQuery,

  // Mutations
  useCreateWorkOrderMutation,
  useUpdateWorkOrderMutation,
  useUpdateWorkOrderStatusMutation,
  useApproveWorkOrderMutation,
  useRejectWorkOrderMutation,
  useDeleteWorkOrderMutation,
} = workOrdersApi;
