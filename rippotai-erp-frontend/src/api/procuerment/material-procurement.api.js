// src/store/apis/material-procurement.api.js

import { baseApi } from "../../store/baseApi";

export const materialProcurementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // MATERIAL PROCUREMENT
    // ============================================================

    /**
     * GET /material-procurement
     *
     * Optional:
     * ?projectId=<projectId>
     */
    getMaterialProcurements: builder.query({
      query: ({ projectId } = {}) => ({
        url: "/material-procurement",
        method: "GET",
        params: {
          ...(projectId && { projectId }),
        },
      }),
      providesTags: ["MaterialProcurement"],
    }),

    /**
     * GET /material-procurement/:id
     */
    getMaterialProcurement: builder.query({
      query: (id) => ({
        url: `/material-procurement/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        {
          type: "MaterialProcurement",
          id,
        },
      ],
    }),

    /**
     * POST /material-procurement
     */
    createMaterialProcurement: builder.mutation({
      query: (body) => ({
        url: "/material-procurement",
        method: "POST",
        body,
      }),
      invalidatesTags: ["MaterialProcurement"],
    }),

    /**
     * PATCH /material-procurement/:id
     */
    updateMaterialProcurement: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/material-procurement/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "MaterialProcurement",
        {
          type: "MaterialProcurement",
          id,
        },
      ],
    }),

    /**
     * POST /material-procurement/:id/submit
     */
    submitMaterialProcurement: builder.mutation({
      query: (id) => ({
        url: `/material-procurement/${id}/submit`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        "MaterialProcurement",
        {
          type: "MaterialProcurement",
          id,
        },
      ],
    }),

    /**
     * DELETE /material-procurement/:id
     */
    deleteMaterialProcurement: builder.mutation({
      query: (id) => ({
        url: `/material-procurement/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        "MaterialProcurement",
        {
          type: "MaterialProcurement",
          id,
        },
      ],
    }),
  }),
});

export const {
  useGetMaterialProcurementsQuery,
  useGetMaterialProcurementQuery,
  useCreateMaterialProcurementMutation,
  useUpdateMaterialProcurementMutation,
  useSubmitMaterialProcurementMutation,
  useDeleteMaterialProcurementMutation,
} = materialProcurementApi;
