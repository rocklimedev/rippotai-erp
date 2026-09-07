// src/store/apis/zohoBiginApi.js

import { baseApi } from "../store/baseApi";

export const zohoBiginApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // SETTINGS / SYSTEM
    // ============================================================

    getZohoModules: builder.query({
      query: (ownerKey) => ({
        url: `/zoho/bigin/${ownerKey}/settings/modules`,
        method: "GET",
      }),
      providesTags: ["ZohoBiginModules"],
    }),

    getZohoFields: builder.query({
      query: ({ ownerKey, module }) => ({
        url: `/zoho/bigin/${ownerKey}/settings/fields`,
        method: "GET",
        params: module ? { module } : undefined,
      }),
      providesTags: (result, error, { module }) => [
        { type: "ZohoBiginFields", id: module || "ALL" },
      ],
    }),

    getZohoUsers: builder.query({
      query: ({ ownerKey, ...query }) => ({
        url: `/zoho/bigin/${ownerKey}/users`,
        method: "GET",
        params: query,
      }),
      providesTags: ["ZohoBiginUsers"],
    }),

    getZohoOrg: builder.query({
      query: (ownerKey) => ({
        url: `/zoho/bigin/${ownerKey}/org`,
        method: "GET",
      }),
      providesTags: ["ZohoBiginOrg"],
    }),

    // ============================================================
    // MODULE - LIST
    // ============================================================

    getZohoRecords: builder.query({
      query: ({ ownerKey, module, ...query }) => ({
        url: `/zoho/bigin/${ownerKey}/modules/${module}`,
        method: "GET",
        params: query,
      }),
      providesTags: (result, error, { module }) => [
        { type: "ZohoBiginRecords", id: module },
      ],
    }),

    // ============================================================
    // MODULE - GET ONE
    // ============================================================

    getZohoRecord: builder.query({
      query: ({ ownerKey, module, id, ...query }) => ({
        url: `/zoho/bigin/${ownerKey}/modules/${module}/${id}`,
        method: "GET",
        params: query,
      }),
      providesTags: (result, error, { module, id }) => [
        { type: "ZohoBiginRecords", id: `${module}-${id}` },
      ],
    }),

    // ============================================================
    // MODULE - SEARCH
    // ============================================================

    searchZohoRecords: builder.query({
      query: ({ ownerKey, module, ...query }) => ({
        url: `/zoho/bigin/${ownerKey}/modules/${module}/search`,
        method: "GET",
        params: query,
      }),
      providesTags: (result, error, { module }) => [
        { type: "ZohoBiginSearch", id: module },
      ],
    }),

    // ============================================================
    // MODULE - CREATE
    // ============================================================

    createZohoRecord: builder.mutation({
      query: ({ ownerKey, module, ...body }) => ({
        url: `/zoho/bigin/${ownerKey}/modules/${module}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { module }) => [
        { type: "ZohoBiginRecords", id: module },
        { type: "ZohoBiginSearch", id: module },
      ],
    }),

    // ============================================================
    // MODULE - UPDATE
    // ============================================================

    updateZohoRecord: builder.mutation({
      query: ({ ownerKey, module, id, ...body }) => ({
        url: `/zoho/bigin/${ownerKey}/modules/${module}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { module, id }) => [
        { type: "ZohoBiginRecords", id: module },
        { type: "ZohoBiginRecords", id: `${module}-${id}` },
        { type: "ZohoBiginSearch", id: module },
      ],
    }),

    // ============================================================
    // MODULE - DELETE
    // ============================================================

    deleteZohoRecord: builder.mutation({
      query: ({ ownerKey, module, id }) => ({
        url: `/zoho/bigin/${ownerKey}/modules/${module}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { module, id }) => [
        { type: "ZohoBiginRecords", id: module },
        { type: "ZohoBiginRecords", id: `${module}-${id}` },
        { type: "ZohoBiginSearch", id: module },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  // Settings / System
  useGetZohoModulesQuery,
  useGetZohoFieldsQuery,
  useGetZohoUsersQuery,
  useGetZohoOrgQuery,

  // Records
  useGetZohoRecordsQuery,
  useGetZohoRecordQuery,
  useSearchZohoRecordsQuery,

  // Mutations
  useCreateZohoRecordMutation,
  useUpdateZohoRecordMutation,
  useDeleteZohoRecordMutation,
} = zohoBiginApi;
