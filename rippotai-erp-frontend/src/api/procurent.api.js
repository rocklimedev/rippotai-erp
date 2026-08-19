import { baseApi } from "../store/baseApi";

export const procurementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================================
    // MATERIAL REQUIREMENTS
    // =====================================================

    createMaterialRequirement: builder.mutation({
      query: (body) => ({
        url: "/procurement/requirements",
        method: "POST",
        body,
      }),
      invalidatesTags: ["MaterialRequirement"],
    }),

    getMaterialRequirements: builder.query({
      query: (projectId) => ({
        url: "/procurement/requirements",
        params: projectId ? { projectId } : undefined,
      }),
      providesTags: ["MaterialRequirement"],
    }),

    getMaterialRequirement: builder.query({
      query: (id) => `/procurement/requirements/${id}`,
      providesTags: ["MaterialRequirement"],
    }),

    updateMaterialRequirement: builder.mutation({
      query: ({ id, body }) => ({
        url: `/procurement/requirements/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["MaterialRequirement"],
    }),

    deleteMaterialRequirement: builder.mutation({
      query: (id) => ({
        url: `/procurement/requirements/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MaterialRequirement"],
    }),

    // =====================================================
    // SAMPLE BOARDS
    // =====================================================

    createSampleBoard: builder.mutation({
      query: (body) => ({
        url: "/procurement/sample-boards",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SampleBoard"],
    }),

    getSampleBoardsForRequirement: builder.query({
      query: (materialRequirementId) =>
        `/procurement/sample-boards/by-requirement/${materialRequirementId}`,
      providesTags: ["SampleBoard"],
    }),

    getSampleBoard: builder.query({
      query: (id) => `/procurement/sample-boards/${id}`,
      providesTags: ["SampleBoard"],
    }),

    approveSampleBoard: builder.mutation({
      query: ({ id, body }) => ({
        url: `/procurement/sample-boards/${id}/approve`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["SampleBoard"],
    }),

    rejectSampleBoard: builder.mutation({
      query: ({ id, body }) => ({
        url: `/procurement/sample-boards/${id}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["SampleBoard"],
    }),

    deleteSampleBoard: builder.mutation({
      query: (id) => ({
        url: `/procurement/sample-boards/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SampleBoard"],
    }),

    // =====================================================
    // MATERIAL RATE SHEETS
    // =====================================================

    createMaterialRateSheet: builder.mutation({
      query: (body) => ({
        url: "/procurement/rate-sheets",
        method: "POST",
        body,
      }),
      invalidatesTags: ["MaterialRateSheet"],
    }),

    getMaterialRateSheetsForRequirement: builder.query({
      query: (materialRequirementId) =>
        `/procurement/rate-sheets/by-requirement/${materialRequirementId}`,
      providesTags: ["MaterialRateSheet"],
    }),

    getMaterialRateSheet: builder.query({
      query: (id) => `/procurement/rate-sheets/${id}`,
      providesTags: ["MaterialRateSheet"],
    }),

    approveMaterialRateSheet: builder.mutation({
      query: ({ id, body }) => ({
        url: `/procurement/rate-sheets/${id}/approve`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["MaterialRateSheet"],
    }),

    rejectMaterialRateSheet: builder.mutation({
      query: ({ id, body }) => ({
        url: `/procurement/rate-sheets/${id}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["MaterialRateSheet"],
    }),

    deleteMaterialRateSheet: builder.mutation({
      query: (id) => ({
        url: `/procurement/rate-sheets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MaterialRateSheet"],
    }),

    // =====================================================
    // MATERIAL ESTIMATES
    // =====================================================

    createMaterialEstimate: builder.mutation({
      query: (body) => ({
        url: "/procurement/estimates",
        method: "POST",
        body,
      }),
      invalidatesTags: ["MaterialEstimate"],
    }),

    getMaterialEstimate: builder.query({
      query: (id) => `/procurement/estimates/${id}`,
      providesTags: ["MaterialEstimate"],
    }),

    getMaterialEstimatesForRequirement: builder.query({
      query: (materialRequirementId) =>
        `/procurement/estimates/by-requirement/${materialRequirementId}`,
      providesTags: ["MaterialEstimate"],
    }),

    approveMaterialEstimate: builder.mutation({
      query: ({ id, body }) => ({
        url: `/procurement/estimates/${id}/approve`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["MaterialEstimate"],
    }),

    rejectMaterialEstimate: builder.mutation({
      query: ({ id, body }) => ({
        url: `/procurement/estimates/${id}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["MaterialEstimate"],
    }),

    // =====================================================
    // MATERIAL QUOTATIONS
    // =====================================================

    createMaterialQuotation: builder.mutation({
      query: (body) => ({
        url: "/procurement/quotations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["MaterialQuotation"],
    }),

    getMaterialQuotations: builder.query({
      query: () => "/procurement/quotations",
      providesTags: ["MaterialQuotation"],
    }),

    getMaterialQuotation: builder.query({
      query: (id) => `/procurement/quotations/${id}`,
      providesTags: ["MaterialQuotation"],
    }),

    sendMaterialQuotation: builder.mutation({
      query: (id) => ({
        url: `/procurement/quotations/${id}/send`,
        method: "POST",
      }),
      invalidatesTags: ["MaterialQuotation"],
    }),

    acceptMaterialQuotation: builder.mutation({
      query: (id) => ({
        url: `/procurement/quotations/${id}/accept`,
        method: "POST",
      }),
      invalidatesTags: ["MaterialQuotation"],
    }),

    rejectMaterialQuotation: builder.mutation({
      query: (id) => ({
        url: `/procurement/quotations/${id}/reject`,
        method: "POST",
      }),
      invalidatesTags: ["MaterialQuotation"],
    }),

    // =====================================================
    // PURCHASE ORDERS
    // =====================================================

    createPurchaseOrder: builder.mutation({
      query: (body) => ({
        url: "/procurement/purchase-orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PurchaseOrder"],
    }),

    getPurchaseOrders: builder.query({
      query: () => "/procurement/purchase-orders",
      providesTags: ["PurchaseOrder"],
    }),

    getPurchaseOrder: builder.query({
      query: (id) => `/procurement/purchase-orders/${id}`,
      providesTags: ["PurchaseOrder"],
    }),

    cancelPurchaseOrder: builder.mutation({
      query: (id) => ({
        url: `/procurement/purchase-orders/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["PurchaseOrder"],
    }),

    closePurchaseOrder: builder.mutation({
      query: (id) => ({
        url: `/procurement/purchase-orders/${id}/close`,
        method: "POST",
      }),
      invalidatesTags: ["PurchaseOrder"],
    }),

    // =====================================================
    // DELIVERY CHALLANS
    // =====================================================

    createDeliveryChallan: builder.mutation({
      query: (body) => ({
        url: "/procurement/delivery-challans",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DeliveryChallan"],
    }),

    getDeliveryChallansForPurchaseOrder: builder.query({
      query: (purchaseOrderId) =>
        `/procurement/delivery-challans/by-purchase-order/${purchaseOrderId}`,
      providesTags: ["DeliveryChallan"],
    }),

    getDeliveryChallan: builder.query({
      query: (id) => `/procurement/delivery-challans/${id}`,
      providesTags: ["DeliveryChallan"],
    }),

    // =====================================================
    // SITE INVENTORY
    // =====================================================

    getSiteInventory: builder.query({
      query: (projectId) => ({
        url: "/procurement/site-inventory",
        params: projectId ? { projectId } : undefined,
      }),
      providesTags: ["SiteInventory"],
    }),

    getSiteInventoryItem: builder.query({
      query: (id) => `/procurement/site-inventory/${id}`,
      providesTags: ["SiteInventory"],
    }),

    getInventoryTransactions: builder.query({
      query: (id) => `/procurement/site-inventory/${id}/transactions`,
      providesTags: ["InventoryTransaction"],
    }),

    recordInventoryTransaction: builder.mutation({
      query: (body) => ({
        url: "/procurement/site-inventory/transactions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SiteInventory", "InventoryTransaction"],
    }),

    reconcileInventory: builder.query({
      query: ({ purchaseOrderId, poDeliveredTotal }) => ({
        url: `/procurement/site-inventory/reconcile/${purchaseOrderId}`,
        params: {
          poDeliveredTotal,
        },
      }),
      providesTags: ["SiteInventory"],
    }),
  }),

  overrideExisting: false,
});

export const {
  // =====================================================
  // MATERIAL REQUIREMENTS
  // =====================================================

  useCreateMaterialRequirementMutation,
  useGetMaterialRequirementsQuery,
  useGetMaterialRequirementQuery,
  useUpdateMaterialRequirementMutation,
  useDeleteMaterialRequirementMutation,

  // =====================================================
  // SAMPLE BOARDS
  // =====================================================

  useCreateSampleBoardMutation,
  useGetSampleBoardsForRequirementQuery,
  useGetSampleBoardQuery,
  useApproveSampleBoardMutation,
  useRejectSampleBoardMutation,
  useDeleteSampleBoardMutation,

  // =====================================================
  // MATERIAL RATE SHEETS
  // =====================================================

  useCreateMaterialRateSheetMutation,
  useGetMaterialRateSheetsForRequirementQuery,
  useGetMaterialRateSheetQuery,
  useApproveMaterialRateSheetMutation,
  useRejectMaterialRateSheetMutation,
  useDeleteMaterialRateSheetMutation,

  // =====================================================
  // MATERIAL ESTIMATES
  // =====================================================

  useCreateMaterialEstimateMutation,
  useGetMaterialEstimateQuery,
  useGetMaterialEstimatesForRequirementQuery,
  useApproveMaterialEstimateMutation,
  useRejectMaterialEstimateMutation,

  // =====================================================
  // MATERIAL QUOTATIONS
  // =====================================================

  useCreateMaterialQuotationMutation,
  useGetMaterialQuotationsQuery,
  useGetMaterialQuotationQuery,
  useSendMaterialQuotationMutation,
  useAcceptMaterialQuotationMutation,
  useRejectMaterialQuotationMutation,

  // =====================================================
  // PURCHASE ORDERS
  // =====================================================

  useCreatePurchaseOrderMutation,
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderQuery,
  useCancelPurchaseOrderMutation,
  useClosePurchaseOrderMutation,

  // =====================================================
  // DELIVERY CHALLANS
  // =====================================================

  useCreateDeliveryChallanMutation,
  useGetDeliveryChallansForPurchaseOrderQuery,
  useGetDeliveryChallanQuery,

  // =====================================================
  // SITE INVENTORY
  // =====================================================

  useGetSiteInventoryQuery,
  useGetSiteInventoryItemQuery,
  useGetInventoryTransactionsQuery,
  useRecordInventoryTransactionMutation,
  useReconcileInventoryQuery,
} = procurementApi;
