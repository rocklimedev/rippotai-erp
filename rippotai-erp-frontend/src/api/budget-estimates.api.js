import { baseApi } from "../store/baseApi";

export const budgetEstimatesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =========================================================
    // GET ALL
    // GET /budget-estimates
    // GET /budget-estimates?projectId=xxx
    // =========================================================

    getBudgetEstimates: builder.query({
      query: (projectId) => ({
        url: "/budget-estimates",
        params: projectId ? { projectId } : undefined,
      }),

      providesTags: (result) =>
        result
          ? [
              { type: "BudgetEstimates", id: "LIST" },
              ...result.map((estimate) => ({
                type: "BudgetEstimates",
                id: estimate.id,
              })),
            ]
          : [{ type: "BudgetEstimates", id: "LIST" }],
    }),

    // =========================================================
    // GET ONE
    // GET /budget-estimates/:id
    // =========================================================

    getBudgetEstimate: builder.query({
      query: (id) => ({
        url: `/budget-estimates/${id}`,
      }),

      providesTags: (result, error, id) => [{ type: "BudgetEstimates", id }],
    }),

    // =========================================================
    // CREATE
    // POST /budget-estimates
    // =========================================================

    createBudgetEstimate: builder.mutation({
      query: (body) => ({
        url: "/budget-estimates",
        method: "POST",
        body,
      }),

      invalidatesTags: [{ type: "BudgetEstimates", id: "LIST" }],
    }),

    // =========================================================
    // CREATE FROM BOQ
    //
    // POST /budget-estimates/from-boq/:boqId
    //
    // Body:
    // none
    //
    // Example:
    // createBudgetEstimateFromBoq(boqId)
    // =========================================================

    createBudgetEstimateFromBoq: builder.mutation({
      query: (boqId) => ({
        url: `/budget-estimates/from-boq/${boqId}`,
        method: "POST",
      }),

      invalidatesTags: [{ type: "BudgetEstimates", id: "LIST" }],
    }),

    // =========================================================
    // UPDATE
    // PATCH /budget-estimates/:id
    // =========================================================

    updateBudgetEstimate: builder.mutation({
      query: ({ id, body }) => ({
        url: `/budget-estimates/${id}`,
        method: "PATCH",
        body,
      }),

      invalidatesTags: (result, error, { id }) => [
        { type: "BudgetEstimates", id },
        { type: "BudgetEstimates", id: "LIST" },
      ],
    }),

    // =========================================================
    // RECALCULATE
    // POST /budget-estimates/:id/recalculate
    // =========================================================

    recalculateBudgetEstimate: builder.mutation({
      query: (id) => ({
        url: `/budget-estimates/${id}/recalculate`,
        method: "POST",
      }),

      invalidatesTags: (result, error, id) => [
        { type: "BudgetEstimates", id },
        { type: "BudgetEstimates", id: "LIST" },
      ],
    }),

    // =========================================================
    // LOCK
    // POST /budget-estimates/:id/lock
    // =========================================================

    lockBudgetEstimate: builder.mutation({
      query: (id) => ({
        url: `/budget-estimates/${id}/lock`,
        method: "POST",
      }),

      invalidatesTags: (result, error, id) => [
        { type: "BudgetEstimates", id },
        { type: "BudgetEstimates", id: "LIST" },
      ],
    }),

    // =========================================================
    // UNLOCK
    // POST /budget-estimates/:id/unlock
    // =========================================================

    unlockBudgetEstimate: builder.mutation({
      query: (id) => ({
        url: `/budget-estimates/${id}/unlock`,
        method: "POST",
      }),

      invalidatesTags: (result, error, id) => [
        { type: "BudgetEstimates", id },
        { type: "BudgetEstimates", id: "LIST" },
      ],
    }),

    // =========================================================
    // DELETE
    // DELETE /budget-estimates/:id
    // =========================================================

    deleteBudgetEstimate: builder.mutation({
      query: (id) => ({
        url: `/budget-estimates/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, id) => [
        { type: "BudgetEstimates", id },
        { type: "BudgetEstimates", id: "LIST" },
      ],
    }),
  }),

  overrideExisting: false,
});

// =============================================================
// HOOKS
// =============================================================

export const {
  // -----------------------------------------------------------
  // QUERIES
  // -----------------------------------------------------------

  useGetBudgetEstimatesQuery,
  useLazyGetBudgetEstimatesQuery,

  useGetBudgetEstimateQuery,
  useLazyGetBudgetEstimateQuery,

  // -----------------------------------------------------------
  // CREATE
  // -----------------------------------------------------------

  useCreateBudgetEstimateMutation,

  // -----------------------------------------------------------
  // CREATE FROM BOQ
  // -----------------------------------------------------------

  useCreateBudgetEstimateFromBoqMutation,

  // -----------------------------------------------------------
  // UPDATE
  // -----------------------------------------------------------

  useUpdateBudgetEstimateMutation,

  // -----------------------------------------------------------
  // CALCULATE
  // -----------------------------------------------------------

  useRecalculateBudgetEstimateMutation,

  // -----------------------------------------------------------
  // LOCK / UNLOCK
  // -----------------------------------------------------------

  useLockBudgetEstimateMutation,
  useUnlockBudgetEstimateMutation,

  // -----------------------------------------------------------
  // DELETE
  // -----------------------------------------------------------

  useDeleteBudgetEstimateMutation,
} = budgetEstimatesApi;
