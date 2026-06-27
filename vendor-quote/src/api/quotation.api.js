import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token"); // Your token key

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

export const quotationApi = createApi({
  reducerPath: "quotationApi",
  baseQuery,
  tagTypes: ["Quotations", "QuotationItems"],

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
      invalidatesTags: ["Quotations"],
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
      providesTags: ["Quotations"],
    }),

    getQuotationById: builder.query({
      query: (id) => `/quotations/${id}`,
      providesTags: ["Quotations"],
    }),

    updateQuotation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/quotations/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Quotations"],
    }),

    submitQuotation: builder.mutation({
      query: ({ id, submitted_by }) => ({
        url: `/quotations/${id}/submit`,
        method: "PATCH",
        body: { submitted_by },
      }),
      invalidatesTags: ["Quotations"],
    }),

    approveQuotation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/quotations/${id}/approve`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Quotations"],
    }),

    returnQuotation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/quotations/${id}/return`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Quotations"],
    }),

    declineQuotation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/quotations/${id}/decline`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Quotations"],
    }),

    cancelQuotation: builder.mutation({
      query: ({ id, updated_by }) => ({
        url: `/quotations/${id}/cancel`,
        method: "PATCH",
        body: { updated_by },
      }),
      invalidatesTags: ["Quotations"],
    }),

    restoreQuotation: builder.mutation({
      query: (id) => ({
        url: `/quotations/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: ["Quotations"],
    }),

    softDeleteQuotation: builder.mutation({
      query: ({ id, deleted_by }) => ({
        url: `/quotations/${id}`,
        method: "DELETE",
        body: { deleted_by },
      }),
      invalidatesTags: ["Quotations"],
    }),

    deleteQuotationPermanent: builder.mutation({
      query: (id) => ({
        url: `/quotations/${id}/permanent`,
        method: "DELETE",
      }),
      invalidatesTags: ["Quotations"],
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
  }),
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

  // items
  useCreateQuotationItemMutation,
  useGetQuotationItemsQuery,
  useReplaceQuotationItemsMutation,
  useUpdateQuotationItemMutation,
  useDeleteQuotationItemMutation,
} = quotationApi;
