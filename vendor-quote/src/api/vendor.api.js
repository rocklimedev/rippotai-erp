import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");

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
  tagTypes: ["Vendors", "VendorCategories", "BusinessTypes"],

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

    // =====================================
    // Vendors
    // =====================================

    createVendor: builder.mutation({
      query: (body) => ({
        url: "/vendors",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Vendors"],
    }),

    getVendors: builder.query({
      query: ({ status, vendor_category_id, business_type_id } = {}) => {
        const params = new URLSearchParams();

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
      invalidatesTags: ["Vendors"],
    }),

    setVendorStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/vendors/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Vendors"],
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
      invalidatesTags: ["Vendors"],
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

  // Vendors
  useCreateVendorMutation,
  useGetVendorsQuery,
  useGetVendorByIdQuery,
  useUpdateVendorMutation,
  useSetVendorStatusMutation,
  useDeleteVendorMutation,
} = vendorsApi;
