// src/store/apis/material-master.api.js

import { baseApi } from "../../store/baseApi";

export const materialMasterApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // MATERIAL MASTER
    // ============================================================

    /**
     * GET /materials
     *
     * Optional:
     * ?search=<text>
     * ?category=<category>
     * ?isActive=true|false
     */
    getMaterials: builder.query({
      query: ({ search, category, isActive } = {}) => ({
        url: "/materials",
        method: "GET",
        params: {
          ...(search && { search }),
          ...(category && { category }),
          ...(isActive !== undefined && {
            isActive,
          }),
        },
      }),
      providesTags: ["MaterialMaster"],
    }),

    /**
     * GET /materials/:id
     */
    getMaterial: builder.query({
      query: (id) => ({
        url: `/materials/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "MaterialMaster", id }],
    }),

    /**
     * POST /materials
     */
    createMaterial: builder.mutation({
      query: (body) => ({
        url: "/materials",
        method: "POST",
        body,
      }),
      invalidatesTags: ["MaterialMaster"],
    }),

    /**
     * PATCH /materials/:id
     */
    updateMaterial: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/materials/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "MaterialMaster",
        { type: "MaterialMaster", id },
      ],
    }),

    /**
     * DELETE /materials/:id
     *
     * Backend performs a deactivate rather than hard delete.
     */
    deactivateMaterial: builder.mutation({
      query: (id) => ({
        url: `/materials/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        "MaterialMaster",
        { type: "MaterialMaster", id },
      ],
    }),
  }),
});

export const {
  useGetMaterialsQuery,
  useGetMaterialQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeactivateMaterialMutation,
} = materialMasterApi;
