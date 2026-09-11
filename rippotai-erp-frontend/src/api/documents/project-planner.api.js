import { baseApi } from "../../store/baseApi";

export const projectPlannerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =========================================================
    // PROJECT PLANNERS
    // =========================================================

    // Initialize all standard planners for a project
    // POST /projects/:projectId/planners/initialize
    initializeProjectPlanners: builder.mutation({
      query: ({ projectId, data }) => ({
        url: `/projects/${projectId}/planners/initialize`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "ProjectPlanner", id: `PROJECT-${projectId}` },
        { type: "ProjectPlanner", id: "LIST" },
      ],
    }),

    // Create one planner
    // POST /projects/:projectId/planners
    createPlanner: builder.mutation({
      query: ({ projectId, data }) => ({
        url: `/projects/${projectId}/planners`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "ProjectPlanner", id: `PROJECT-${projectId}` },
        { type: "ProjectPlanner", id: "LIST" },
      ],
    }),

    // Get all planners for a project
    // GET /projects/:projectId/planners
    getProjectPlanners: builder.query({
      query: (projectId) => `/projects/${projectId}/planners`,
      providesTags: (result, error, projectId) => {
        const planners = Array.isArray(result) ? result : result?.data || [];

        return [
          ...planners.map(({ id }) => ({
            type: "ProjectPlanner",
            id,
          })),
          {
            type: "ProjectPlanner",
            id: `PROJECT-${projectId}`,
          },
          {
            type: "ProjectPlanner",
            id: "LIST",
          },
        ];
      },
    }),

    // Main planner dashboard overview
    // GET /projects/:projectId/planners/overview
    getProjectPlannerOverview: builder.query({
      query: (projectId) => `/projects/${projectId}/planners/overview`,
      providesTags: (result, error, projectId) => [
        {
          type: "ProjectPlannerOverview",
          id: projectId,
        },
        {
          type: "ProjectPlanner",
          id: `PROJECT-${projectId}`,
        },
      ],
    }),

    // Get single planner
    // GET /planners/:plannerId
    getPlannerById: builder.query({
      query: (plannerId) => `/planners/${plannerId}`,
      providesTags: (result, error, plannerId) => [
        {
          type: "ProjectPlanner",
          id: plannerId,
        },
      ],
    }),

    // Update planner
    // PATCH /planners/:plannerId
    updatePlanner: builder.mutation({
      query: ({ id, data }) => ({
        url: `/planners/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        {
          type: "ProjectPlanner",
          id,
        },
        {
          type: "ProjectPlanner",
          id: "LIST",
        },
      ],
    }),

    // Delete planner
    // DELETE /planners/:plannerId
    deletePlanner: builder.mutation({
      query: (id) => ({
        url: `/planners/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        {
          type: "ProjectPlanner",
          id,
        },
        {
          type: "ProjectPlanner",
          id: "LIST",
        },
      ],
    }),

    // =========================================================
    // PLANNER TEMPLATE
    // =========================================================

    // Generate planner from master template
    // POST /planners/:plannerId/generate-template
    generatePlannerFromTemplate: builder.mutation({
      query: ({ plannerId, data }) => ({
        url: `/planners/${plannerId}/generate-template`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { plannerId }) => [
        {
          type: "ProjectPlanner",
          id: plannerId,
        },
        {
          type: "PlannerItem",
          id: `PLANNER-${plannerId}`,
        },
      ],
    }),

    // =========================================================
    // PROJECT LOCATIONS
    // =========================================================

    // Create location
    // POST /projects/:projectId/locations
    createLocation: builder.mutation({
      query: ({ projectId, data }) => ({
        url: `/projects/${projectId}/locations`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        {
          type: "ProjectLocation",
          id: `PROJECT-${projectId}`,
        },
        {
          type: "ProjectLocation",
          id: "LIST",
        },
      ],
    }),

    // Get project location tree
    // GET /projects/:projectId/locations
    getProjectLocations: builder.query({
      query: (projectId) => `/projects/${projectId}/locations`,
      providesTags: (result, error, projectId) => {
        const locations = Array.isArray(result) ? result : result?.data || [];

        return [
          ...locations.map(({ id }) => ({
            type: "ProjectLocation",
            id,
          })),
          {
            type: "ProjectLocation",
            id: `PROJECT-${projectId}`,
          },
          {
            type: "ProjectLocation",
            id: "LIST",
          },
        ];
      },
    }),

    // Update location
    // PATCH /locations/:locationId
    updateLocation: builder.mutation({
      query: ({ id, data }) => ({
        url: `/locations/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        {
          type: "ProjectLocation",
          id,
        },
        {
          type: "ProjectLocation",
          id: "LIST",
        },
      ],
    }),

    // =========================================================
    // PLANNER ITEMS
    // =========================================================

    // Create planner item
    // POST /planners/:plannerId/items
    createPlannerItem: builder.mutation({
      query: ({ plannerId, data }) => ({
        url: `/planners/${plannerId}/items`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { plannerId }) => [
        {
          type: "PlannerItem",
          id: `PLANNER-${plannerId}`,
        },
        {
          type: "PlannerItem",
          id: "LIST",
        },
        {
          type: "ProjectPlanner",
          id: plannerId,
        },
      ],
    }),

    // Get planner items
    // GET /planners/:plannerId/items
    getPlannerItems: builder.query({
      query: ({ plannerId, phaseId }) => ({
        url: `/planners/${plannerId}/items`,
        params: {
          ...(phaseId ? { phaseId } : {}),
        },
      }),
      providesTags: (result, error, { plannerId }) => {
        const items = Array.isArray(result) ? result : result?.data || [];

        return [
          ...items.map(({ id }) => ({
            type: "PlannerItem",
            id,
          })),
          {
            type: "PlannerItem",
            id: `PLANNER-${plannerId}`,
          },
          {
            type: "PlannerItem",
            id: "LIST",
          },
        ];
      },
    }),

    // Get single planner item
    // GET /planner-items/:itemId
    getPlannerItemById: builder.query({
      query: (itemId) => `/planner-items/${itemId}`,
      providesTags: (result, error, itemId) => [
        {
          type: "PlannerItem",
          id: itemId,
        },
      ],
    }),

    // Update planner item
    // PATCH /planner-items/:itemId
    updatePlannerItem: builder.mutation({
      query: ({ id, data }) => ({
        url: `/planner-items/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        {
          type: "PlannerItem",
          id,
        },
        {
          type: "PlannerItem",
          id: "LIST",
        },
      ],
    }),

    // Delete planner item
    // DELETE /planner-items/:itemId
    deletePlannerItem: builder.mutation({
      query: (id) => ({
        url: `/planner-items/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        {
          type: "PlannerItem",
          id,
        },
        {
          type: "PlannerItem",
          id: "LIST",
        },
      ],
    }),

    // =========================================================
    // PLANNER ITEM ↔ LOCATIONS
    // =========================================================

    // Attach planner item to locations
    // POST /planner-items/:itemId/locations
    attachPlannerLocations: builder.mutation({
      query: ({ itemId, location_ids }) => ({
        url: `/planner-items/${itemId}/locations`,
        method: "POST",
        body: {
          location_ids,
        },
      }),
      invalidatesTags: (result, error, { itemId }) => [
        {
          type: "PlannerItem",
          id: itemId,
        },
        {
          type: "PlannerItemLocation",
          id: `ITEM-${itemId}`,
        },
      ],
    }),

    // Remove planner item from location
    // DELETE /planner-items/:itemId/locations/:locationId
    removeLocationFromItem: builder.mutation({
      query: ({ itemId, locationId }) => ({
        url: `/planner-items/${itemId}/locations/${locationId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { itemId, locationId }) => [
        {
          type: "PlannerItem",
          id: itemId,
        },
        {
          type: "PlannerItemLocation",
          id: locationId,
        },
        {
          type: "PlannerItemLocation",
          id: `ITEM-${itemId}`,
        },
      ],
    }),

    // =========================================================
    // PLANNER ITEM LOCATION PROGRESS
    // =========================================================

    // Update individual item-location progress
    // PATCH /planner-item-locations/:itemLocationId
    updateItemLocation: builder.mutation({
      query: ({ id, data }) => ({
        url: `/planner-item-locations/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        {
          type: "PlannerItemLocation",
          id,
        },
        {
          type: "PlannerItem",
          id: result?.planner_item_id,
        },
        {
          type: "PlannerItem",
          id: "LIST",
        },
      ],
    }),

    // =========================================================
    // VENDOR & PROCUREMENT
    // =========================================================

    // Create procurement item
    // POST /planners/:plannerId/procurement
    createProcurementItem: builder.mutation({
      query: ({ plannerId, data }) => ({
        url: `/planners/${plannerId}/procurement`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { plannerId }) => [
        {
          type: "ProcurementItem",
          id: `PLANNER-${plannerId}`,
        },
        {
          type: "ProcurementItem",
          id: "LIST",
        },
        {
          type: "ProjectPlanner",
          id: plannerId,
        },
      ],
    }),

    // Get procurement items
    // GET /planners/:plannerId/procurement
    getProcurementItems: builder.query({
      query: ({ plannerId, itemType }) => ({
        url: `/planners/${plannerId}/procurement`,
        params: {
          ...(itemType ? { itemType } : {}),
        },
      }),
      providesTags: (result, error, { plannerId }) => {
        const items = Array.isArray(result) ? result : result?.data || [];

        return [
          ...items.map(({ id }) => ({
            type: "ProcurementItem",
            id,
          })),
          {
            type: "ProcurementItem",
            id: `PLANNER-${plannerId}`,
          },
          {
            type: "ProcurementItem",
            id: "LIST",
          },
        ];
      },
    }),

    // Update procurement item
    // PATCH /procurement-items/:itemId
    updateProcurementItem: builder.mutation({
      query: ({ id, data }) => ({
        url: `/procurement-items/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        {
          type: "ProcurementItem",
          id,
        },
        {
          type: "ProcurementItem",
          id: "LIST",
        },
      ],
    }),

    // Delete procurement item
    // DELETE /procurement-items/:itemId
    deleteProcurementItem: builder.mutation({
      query: (id) => ({
        url: `/procurement-items/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        {
          type: "ProcurementItem",
          id,
        },
        {
          type: "ProcurementItem",
          id: "LIST",
        },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  // Project planners
  useInitializeProjectPlannersMutation,
  useCreatePlannerMutation,
  useGetProjectPlannersQuery,
  useGetProjectPlannerOverviewQuery,
  useGetPlannerByIdQuery,
  useUpdatePlannerMutation,
  useDeletePlannerMutation,

  // Template
  useGeneratePlannerFromTemplateMutation,

  // Locations
  useCreateLocationMutation,
  useGetProjectLocationsQuery,
  useUpdateLocationMutation,

  // Planner items
  useCreatePlannerItemMutation,
  useGetPlannerItemsQuery,
  useGetPlannerItemByIdQuery,
  useUpdatePlannerItemMutation,
  useDeletePlannerItemMutation,

  // Planner item ↔ locations
  useAttachPlannerLocationsMutation,
  useRemoveLocationFromItemMutation,

  // Item location progress
  useUpdateItemLocationMutation,

  // Procurement
  useCreateProcurementItemMutation,
  useGetProcurementItemsQuery,
  useUpdateProcurementItemMutation,
  useDeleteProcurementItemMutation,
} = projectPlannerApi;
