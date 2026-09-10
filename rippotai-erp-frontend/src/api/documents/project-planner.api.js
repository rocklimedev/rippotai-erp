import { baseApi } from "../../store/baseApi";

export const projectPlannerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // PLANNER TASK TEMPLATES
    // ============================================================

    listPlannerTemplates: builder.query({
      query: (module) => ({
        url: "/planner/templates",
        params: module ? { module } : undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((template) => ({
                type: "PlannerTemplate",
                id: template.id,
              })),
              { type: "PlannerTemplate", id: "LIST" },
            ]
          : [{ type: "PlannerTemplate", id: "LIST" }],
    }),

    createPlannerTemplate: builder.mutation({
      query: (body) => ({
        url: "/planner/templates",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "PlannerTemplate", id: "LIST" }],
    }),

    updatePlannerTemplate: builder.mutation({
      query: ({ templateId, ...body }) => ({
        url: `/planner/templates/${templateId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { templateId }) => [
        { type: "PlannerTemplate", id: templateId },
        { type: "PlannerTemplate", id: "LIST" },
      ],
    }),

    deletePlannerTemplate: builder.mutation({
      query: (templateId) => ({
        url: `/planner/templates/${templateId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, templateId) => [
        { type: "PlannerTemplate", id: templateId },
        { type: "PlannerTemplate", id: "LIST" },
      ],
    }),

    // ============================================================
    // PROCUREMENT CATEGORIES
    // ============================================================

    listProcurementCategories: builder.query({
      query: () => "/planner/procurement-categories",
      providesTags: (result) =>
        result
          ? [
              ...result.map((category) => ({
                type: "ProcurementCategory",
                id: category.id,
              })),
              { type: "ProcurementCategory", id: "LIST" },
            ]
          : [{ type: "ProcurementCategory", id: "LIST" }],
    }),

    createProcurementCategory: builder.mutation({
      query: (body) => ({
        url: "/planner/procurement-categories",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ProcurementCategory", id: "LIST" }],
    }),

    updateProcurementCategory: builder.mutation({
      query: ({ categoryId, ...body }) => ({
        url: `/planner/procurement-categories/${categoryId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { categoryId }) => [
        { type: "ProcurementCategory", id: categoryId },
        { type: "ProcurementCategory", id: "LIST" },
      ],
    }),

    deleteProcurementCategory: builder.mutation({
      query: (categoryId) => ({
        url: `/planner/procurement-categories/${categoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, categoryId) => [
        { type: "ProcurementCategory", id: categoryId },
        { type: "ProcurementCategory", id: "LIST" },
      ],
    }),

    // ============================================================
    // PROJECT FLOORS
    // ============================================================

    listProjectFloors: builder.query({
      query: (projectId) => `/projects/${projectId}/planner/floors`,
      providesTags: (result, error, projectId) =>
        result
          ? [
              ...result.map((floor) => ({
                type: "ProjectFloor",
                id: floor.id,
              })),
              {
                type: "ProjectFloor",
                id: `PROJECT-${projectId}`,
              },
            ]
          : [
              {
                type: "ProjectFloor",
                id: `PROJECT-${projectId}`,
              },
            ],
    }),

    createProjectFloor: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/planner/floors`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        {
          type: "ProjectFloor",
          id: `PROJECT-${projectId}`,
        },
      ],
    }),

    updateProjectFloor: builder.mutation({
      query: ({ projectId, floorId, ...body }) => ({
        url: `/projects/${projectId}/planner/floors/${floorId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { projectId, floorId }) => [
        { type: "ProjectFloor", id: floorId },
        {
          type: "ProjectFloor",
          id: `PROJECT-${projectId}`,
        },
      ],
    }),

    deleteProjectFloor: builder.mutation({
      query: ({ projectId, floorId }) => ({
        url: `/projects/${projectId}/planner/floors/${floorId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { projectId, floorId }) => [
        { type: "ProjectFloor", id: floorId },
        {
          type: "ProjectFloor",
          id: `PROJECT-${projectId}`,
        },
        {
          type: "PlannerTask",
          id: `PROJECT-${projectId}`,
        },
      ],
    }),

    // ============================================================
    // PROJECT PLANNER TASKS
    // ============================================================

    clonePlannerTemplates: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/planner/tasks/clone-from-templates`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        {
          type: "PlannerTask",
          id: `PROJECT-${projectId}`,
        },
        {
          type: "PlannerExportView",
          id: `PROJECT-${projectId}`,
        },
      ],
    }),

    getPlannerTaskTree: builder.query({
      query: ({ projectId, module }) => ({
        url: `/projects/${projectId}/planner/tasks`,
        params: module ? { module } : undefined,
      }),
      providesTags: (result, error, { projectId }) =>
        result
          ? [
              ...result
                .filter((task) => task?.id)
                .map((task) => ({
                  type: "PlannerTask",
                  id: task.id,
                })),
              {
                type: "PlannerTask",
                id: `PROJECT-${projectId}`,
              },
            ]
          : [
              {
                type: "PlannerTask",
                id: `PROJECT-${projectId}`,
              },
            ],
    }),

    createPlannerTask: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/planner/tasks`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        {
          type: "PlannerTask",
          id: `PROJECT-${projectId}`,
        },
        {
          type: "PlannerExportView",
          id: `PROJECT-${projectId}`,
        },
      ],
    }),

    updatePlannerTask: builder.mutation({
      query: ({ projectId, taskId, ...body }) => ({
        url: `/projects/${projectId}/planner/tasks/${taskId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { projectId, taskId }) => [
        { type: "PlannerTask", id: taskId },
        {
          type: "PlannerTask",
          id: `PROJECT-${projectId}`,
        },
        {
          type: "PlannerExportView",
          id: `PROJECT-${projectId}`,
        },
      ],
    }),

    deletePlannerTask: builder.mutation({
      query: ({ projectId, taskId }) => ({
        url: `/projects/${projectId}/planner/tasks/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { projectId, taskId }) => [
        { type: "PlannerTask", id: taskId },
        {
          type: "PlannerTask",
          id: `PROJECT-${projectId}`,
        },
        {
          type: "PlannerExportView",
          id: `PROJECT-${projectId}`,
        },
      ],
    }),

    // ============================================================
    // FLOOR PROGRESS
    // ============================================================

    recordFloorProgress: builder.mutation({
      query: ({ projectId, taskId, ...body }) => ({
        url: `/projects/${projectId}/planner/tasks/${taskId}/floor-progress`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { projectId, taskId }) => [
        { type: "PlannerTask", id: taskId },
        {
          type: "PlannerTask",
          id: `PROJECT-${projectId}`,
        },
        {
          type: "PlannerExportView",
          id: `PROJECT-${projectId}`,
        },
      ],
    }),

    // ============================================================
    // PLANNER EXPORT VIEW
    // ============================================================

    getPlannerExportView: builder.query({
      query: ({ projectId, module }) => ({
        url: `/projects/${projectId}/planner/export-view`,
        params: module ? { module } : undefined,
      }),
      providesTags: (result, error, { projectId }) => [
        {
          type: "PlannerExportView",
          id: `PROJECT-${projectId}`,
        },
      ],
    }),

    // ============================================================
    // PLANNER EXPORT HISTORY
    // ============================================================

    listPlannerExports: builder.query({
      query: (projectId) => `/projects/${projectId}/planner/exports`,
      providesTags: (result, error, projectId) =>
        result
          ? [
              ...result
                .filter((item) => item?.id)
                .map((item) => ({
                  type: "PlannerExport",
                  id: item.id,
                })),
              {
                type: "PlannerExport",
                id: `PROJECT-${projectId}`,
              },
            ]
          : [
              {
                type: "PlannerExport",
                id: `PROJECT-${projectId}`,
              },
            ],
    }),

    recordPlannerExport: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/planner/exports`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        {
          type: "PlannerExport",
          id: `PROJECT-${projectId}`,
        },
      ],
    }),

    // ============================================================
    // VENDOR PROCUREMENT
    // ============================================================

    listVendorProcurements: builder.query({
      query: (projectId) => `/projects/${projectId}/planner/vendor-procurement`,
      providesTags: (result, error, projectId) =>
        result
          ? [
              ...result
                .filter((item) => item?.id)
                .map((item) => ({
                  type: "VendorProcurement",
                  id: item.id,
                })),
              {
                type: "VendorProcurement",
                id: `PROJECT-${projectId}`,
              },
            ]
          : [
              {
                type: "VendorProcurement",
                id: `PROJECT-${projectId}`,
              },
            ],
    }),

    createVendorProcurement: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/planner/vendor-procurement`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        {
          type: "VendorProcurement",
          id: `PROJECT-${projectId}`,
        },
      ],
    }),

    updateVendorProcurement: builder.mutation({
      query: ({ projectId, rowId, ...body }) => ({
        url: `/projects/${projectId}/planner/vendor-procurement/${rowId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { projectId, rowId }) => [
        { type: "VendorProcurement", id: rowId },
        {
          type: "VendorProcurement",
          id: `PROJECT-${projectId}`,
        },
      ],
    }),

    deleteVendorProcurement: builder.mutation({
      query: ({ projectId, rowId }) => ({
        url: `/projects/${projectId}/planner/vendor-procurement/${rowId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { projectId, rowId }) => [
        { type: "VendorProcurement", id: rowId },
        {
          type: "VendorProcurement",
          id: `PROJECT-${projectId}`,
        },
      ],
    }),
  }),

  overrideExisting: false,
});

// ============================================================
// HOOKS
// ============================================================

export const {
  // Templates
  useListPlannerTemplatesQuery,
  useCreatePlannerTemplateMutation,
  useUpdatePlannerTemplateMutation,
  useDeletePlannerTemplateMutation,

  // Procurement Categories
  useListProcurementCategoriesQuery,
  useCreateProcurementCategoryMutation,
  useUpdateProcurementCategoryMutation,
  useDeleteProcurementCategoryMutation,

  // Floors
  useListProjectFloorsQuery,
  useCreateProjectFloorMutation,
  useUpdateProjectFloorMutation,
  useDeleteProjectFloorMutation,

  // Planner Tasks
  useClonePlannerTemplatesMutation,
  useGetPlannerTaskTreeQuery,
  useCreatePlannerTaskMutation,
  useUpdatePlannerTaskMutation,
  useDeletePlannerTaskMutation,

  // Floor Progress
  useRecordFloorProgressMutation,

  // Export View
  useGetPlannerExportViewQuery,

  // Exports
  useListPlannerExportsQuery,
  useRecordPlannerExportMutation,

  // Vendor Procurement
  useListVendorProcurementsQuery,
  useCreateVendorProcurementMutation,
  useUpdateVendorProcurementMutation,
  useDeleteVendorProcurementMutation,
} = projectPlannerApi;
