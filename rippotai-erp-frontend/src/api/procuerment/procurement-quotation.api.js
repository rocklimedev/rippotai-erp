// Build › Procurement › Quotation — vendor comparison → quotation → PO / WO.
import { baseApi } from "../../store/baseApi";

const TAG = "ProcurementQuotations";

export const procurementQuotationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProcurementQuotations: builder.query({
      query: ({ projectId, vendorId, status } = {}) => ({
        url: "/procurement-quotations",
        params: {
          ...(projectId && { project_id: projectId }),
          ...(vendorId && { vendor_id: vendorId }),
          ...(status && { status }),
        },
      }),
      providesTags: [TAG],
    }),
    getProcurementQuotation: builder.query({
      query: (id) => `/procurement-quotations/${id}`,
      providesTags: (result, error, id) => [{ type: TAG, id }],
    }),
    getProcurementQuotationVersion: builder.query({
      query: ({ id, version }) => `/procurement-quotations/${id}/versions/${version}`,
    }),
    createQuotationFromComparison: builder.mutation({
      query: (body) => ({ url: "/procurement-quotations/from-comparison", method: "POST", body }),
      invalidatesTags: [TAG],
    }),
    updateProcurementQuotation: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/procurement-quotations/${id}`, method: "PUT", body }),
      invalidatesTags: (result, error, { id }) => [TAG, { type: TAG, id }],
    }),
    setProcurementQuotationStatus: builder.mutation({
      query: ({ id, status }) => ({ url: `/procurement-quotations/${id}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: (result, error, { id }) => [TAG, { type: TAG, id }],
    }),
    raiseQuotationOrder: builder.mutation({
      query: ({ id, kind }) => ({
        url: `/procurement-quotations/${id}/${kind === "LABOUR" ? "raise-wo" : "raise-po"}`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { id }) => [TAG, { type: TAG, id }, "PurchaseOrders", "WorkOrders"],
    }),
    deleteProcurementQuotation: builder.mutation({
      query: (id) => ({ url: `/procurement-quotations/${id}`, method: "DELETE" }),
      invalidatesTags: [TAG],
    }),
  }),
});

export const {
  useGetProcurementQuotationsQuery,
  useGetProcurementQuotationQuery,
  useGetProcurementQuotationVersionQuery,
  useLazyGetProcurementQuotationVersionQuery,
  useCreateQuotationFromComparisonMutation,
  useUpdateProcurementQuotationMutation,
  useSetProcurementQuotationStatusMutation,
  useRaiseQuotationOrderMutation,
  useDeleteProcurementQuotationMutation,
} = procurementQuotationApi;
