import { baseApi } from "../store/baseApi";

export const planOfActionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =========================
    // PLAN OF ACTIONS
    // =========================

    findAllPlanOfActions: builder.query({
      query: () => "/plan-of-actions",
      providesTags: ["PlanOfActions"],
    }),

    createPlanOfAction: builder.mutation({
      query: (body) => ({
        url: "/plan-of-actions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PlanOfActions"],
    }),

    findPlanOfActionsByProject: builder.query({
      query: (projectId) => `/plan-of-actions?project_id=${projectId}`,
      providesTags: ["PlanOfActions"],
    }),

    getPlanOfAction: builder.query({
      query: (id) => `/plan-of-actions/${id}`,
      providesTags: ["PlanOfActions"],
    }),

    updatePlanOfAction: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/plan-of-actions/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["PlanOfActions"],
    }),

    deletePlanOfAction: builder.mutation({
      query: (id) => ({
        url: `/plan-of-actions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PlanOfActions"],
    }),

    // =========================
    // PHASES
    // =========================

    replacePlanOfActionPhases: builder.mutation({
      query: ({ id, phases }) => ({
        url: `/plan-of-actions/${id}/phases`,
        method: "PUT",
        body: phases,
      }),
      invalidatesTags: ["PlanOfActions"],
    }),

    // =========================
    // TERMS
    // =========================

    applyPlanOfActionTerms: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/plan-of-actions/${id}/terms`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["PlanOfActions"],
    }),

    // =========================
    // PUBLISH
    // =========================

    publishPlanOfAction: builder.mutation({
      query: (id) => ({
        url: `/plan-of-actions/${id}/publish`,
        method: "POST",
      }),
      invalidatesTags: ["PlanOfActions"],
    }),
  }),

  overrideExisting: false,
});

export const {
  useFindAllPlanOfActionsQuery,
  useLazyFindAllPlanOfActionsQuery,

  useCreatePlanOfActionMutation,

  useFindPlanOfActionsByProjectQuery,
  useLazyFindPlanOfActionsByProjectQuery,

  useGetPlanOfActionQuery,
  useLazyGetPlanOfActionQuery,

  useUpdatePlanOfActionMutation,
  useDeletePlanOfActionMutation,

  useReplacePlanOfActionPhasesMutation,

  useApplyPlanOfActionTermsMutation,

  usePublishPlanOfActionMutation,
} = planOfActionsApi;
