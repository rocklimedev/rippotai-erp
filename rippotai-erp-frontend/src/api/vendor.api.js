import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
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
});

export const vendorsApi = createApi({
  reducerPath: "vendorsApi",
  baseQuery,
  tagTypes: [
    "Vendors",
    "VendorCategories",
    "BusinessTypes",
    "VendorSummary",
    "SavedSearches",
    "Shortlists",
    "VendorQuotations",
  ],

  endpoints: (builder) => ({
    // =====================================
    // Vendor Categories
    // =====================================

    getVendorCategories: builder.query({
      query: () => "/vendor/categories",
      providesTags: ["VendorCategories"],
    }),

    getVendorCategoryById: builder.query({
      query: (id) => `/vendor/categories/${id}`,
      providesTags: ["VendorCategories"],
    }),

    // =====================================
    // Business Types
    // =====================================

    getBusinessTypes: builder.query({
      query: (category_id) => {
        const params = new URLSearchParams();

        if (category_id) {
          params.append("category_id", category_id);
        }

        return `/vendor/business-types?${params.toString()}`;
      },
      providesTags: ["BusinessTypes"],
    }),

    getBusinessTypeById: builder.query({
      query: (id) => `/vendor/business-types/${id}`,
      providesTags: ["BusinessTypes"],
    }),
    createBusinessType: builder.mutation({
      query: (body) => ({
        url: "/vendor/business-types",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BusinessTypes"],
    }),
    // =====================================
    // Vendors
    // =====================================

    createVendor: builder.mutation({
      query: (body) => ({
        url: "/vendors",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Vendors", "VendorSummary"],
    }),

    getVendors: builder.query({
      query: ({ q, status, vendor_category_id, business_type_id } = {}) => {
        const params = new URLSearchParams();

        if (q) {
          params.append("q", q);
        }

        if (status) {
          params.append("status", status);
        }

        if (vendor_category_id) {
          params.append("vendor_category_id", vendor_category_id);
        }

        if (business_type_id) {
          params.append("business_type_id", business_type_id);
        }

        const query = params.toString();

        return query ? `/vendors?${query}` : "/vendors";
      },
      providesTags: ["Vendors"],
    }),

    getVendorById: builder.query({
      query: (id) => `/vendors/${id}`,
      providesTags: ["Vendors"],
    }),

    updateVendor: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/vendors/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Vendors", "VendorSummary"],
    }),

    setVendorStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/vendors/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Vendors", "VendorSummary"],
    }),

    // ==================== NEW: Get Quotations by Vendor ====================
    getQuotationsByVendor: builder.query({
      query: (vendorId) => `/vendors/${vendorId}/quotations`,
      providesTags: (result, error, vendorId) => [
        { type: "VendorQuotations", id: vendorId },
      ],
    }),

    deleteVendor: builder.mutation({
      query: (id) => ({
        url: `/vendors/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Vendors", "VendorSummary"],
    }),

    // =====================================
    // Vendor Summary (dashboard stat cards)
    // =====================================

    getVendorsSummary: builder.query({
      query: () => "/vendors/summary",
      providesTags: ["VendorSummary"],
    }),

    // =====================================
    // Saved Searches
    // =====================================

    getSavedSearches: builder.query({
      query: () => "/vendors/saved-searches",
      providesTags: ["SavedSearches"],
    }),

    createSavedSearch: builder.mutation({
      query: (body) => ({
        url: "/vendors/saved-searches",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SavedSearches"],
    }),

    deleteSavedSearch: builder.mutation({
      query: (id) => ({
        url: `/vendors/saved-searches/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SavedSearches"],
    }),

    // =====================================
    // Export
    // =====================================

    exportVendors: builder.query({
      query: (format = "csv") => ({
        url: `/vendors/export?format=${format}`,
        responseHandler: (response) => response.blob(),
      }),
    }),

    // =====================================
    // Shortlists
    // =====================================

    getVendorShortlists: builder.query({
      query: () => "/vendor-shortlists",
      providesTags: ["Shortlists"],
    }),

    createVendorShortlist: builder.mutation({
      query: (body) => ({
        url: "/vendor-shortlists",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Shortlists"],
    }),

    addVendorToShortlist: builder.mutation({
      query: ({ shortlistId, ...body }) => ({
        url: `/vendor-shortlists/${shortlistId}/items`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Shortlists"],
    }),
  }),
});

// =====================================
// Export Hooks
// =====================================

export const {
  // Vendor Categories
  useGetVendorCategoriesQuery,
  useGetVendorCategoryByIdQuery,
  useGetQuotationsByVendorQuery,

  // Business Types
  useGetBusinessTypesQuery,
  useGetBusinessTypeByIdQuery,
  useCreateBusinessTypeMutation,
  // Vendors
  useCreateVendorMutation,
  useGetVendorsQuery,
  useGetVendorByIdQuery,
  useUpdateVendorMutation,
  useSetVendorStatusMutation,
  useDeleteVendorMutation,

  // Summary
  useGetVendorsSummaryQuery,

  // Saved Searches
  useGetSavedSearchesQuery,
  useCreateSavedSearchMutation,
  useDeleteSavedSearchMutation,

  // Export
  useLazyExportVendorsQuery,

  // Shortlists
  useGetVendorShortlistsQuery,
  useCreateVendorShortlistMutation,
  useAddVendorToShortlistMutation,
} = vendorsApi;
