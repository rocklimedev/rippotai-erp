// src/store/apis/material-requirement.api.js

import { baseApi } from "../../store/baseApi";

export const materialRequirementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // MATERIAL REQUIREMENTS
    // ============================================================

    /**
     * GET /procurement/requirements
     *
     * Optional:
     * ?projectId=<uuid>
     */
    getMaterialRequirements: builder.query({
      query: ({ projectId } = {}) => ({
        url: "/procurement/requirements",
        method: "GET",
        params: {
          ...(projectId && { projectId }),
        },
      }),

      providesTags: (result) => [
        "MaterialRequirement",
        ...(Array.isArray(result)
          ? result.map(({ id }) => ({
              type: "MaterialRequirement",
              id,
            }))
          : []),
      ],
    }),

    // ============================================================
    // MATERIAL REQUIREMENTS BY PROJECT
    // ============================================================

    /**
     * GET /procurement/requirements/project/:projectId
     *
     * Returns all material requirements belonging
     * to the specified project.
     *
     * Includes:
     * - material requirement
     * - sample boards
     * - material master
     * - material vendors
     * - quotations
     */
    getMaterialRequirementsByProject: builder.query({
      query: (projectId) => ({
        url: `/procurement/requirements/project/${projectId}`,
        method: "GET",
      }),

      providesTags: (result, error, projectId) => [
        "MaterialRequirement",
        {
          type: "MaterialRequirement",
          id: `PROJECT-${projectId}`,
        },
        ...(Array.isArray(result)
          ? result.map(({ id }) => ({
              type: "MaterialRequirement",
              id,
            }))
          : []),
      ],
    }),

    // ============================================================
    // GET ONE
    // ============================================================

    /**
     * GET /procurement/requirements/:id
     *
     * Returns:
     * - material requirement
     * - sample boards
     * - material master
     * - material vendors
     * - quotations
     */
    getMaterialRequirement: builder.query({
      query: (id) => ({
        url: `/procurement/requirements/${id}`,
        method: "GET",
      }),

      providesTags: (result, error, id) => [
        "MaterialRequirement",
        {
          type: "MaterialRequirement",
          id,
        },
      ],
    }),

    // ============================================================
    // CREATE
    // ============================================================

    /**
     * POST /procurement/requirements
     */
    createMaterialRequirement: builder.mutation({
      query: (body) => ({
        url: "/procurement/requirements",
        method: "POST",
        body,
      }),

      invalidatesTags: ["MaterialRequirement"],
    }),

    // ============================================================
    // UPDATE
    // ============================================================

    /**
     * PATCH /procurement/requirements/:id
     */
    updateMaterialRequirement: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/procurement/requirements/${id}`,
        method: "PATCH",
        body,
      }),

      invalidatesTags: (result, error, { id }) => [
        "MaterialRequirement",
        {
          type: "MaterialRequirement",
          id,
        },
      ],
    }),

    // ============================================================
    // UPDATE STATUS
    // ============================================================

    /**
     * PATCH /procurement/requirements/:id/status
     *
     * Body:
     * {
     *   status: "DRAFT"
     * }
     */
    updateMaterialRequirementStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/procurement/requirements/${id}/status`,
        method: "PATCH",
        body: {
          status,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        "MaterialRequirement",
        {
          type: "MaterialRequirement",
          id,
        },
      ],
    }),

    // ============================================================
    // DELETE
    // ============================================================

    /**
     * DELETE /procurement/requirements/:id
     */
    deleteMaterialRequirement: builder.mutation({
      query: (id) => ({
        url: `/procurement/requirements/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, id) => [
        "MaterialRequirement",
        {
          type: "MaterialRequirement",
          id,
        },
      ],
    }),
  }),

  // Set this only if your baseApi already doesn't handle
  // duplicate endpoint injection.
  overrideExisting: false,
});

export const {
  useGetMaterialRequirementsQuery,
  useGetMaterialRequirementsByProjectQuery,
  useGetMaterialRequirementQuery,
  useCreateMaterialRequirementMutation,
  useUpdateMaterialRequirementMutation,
  useUpdateMaterialRequirementStatusMutation,
  useDeleteMaterialRequirementMutation,
} = materialRequirementApi;
