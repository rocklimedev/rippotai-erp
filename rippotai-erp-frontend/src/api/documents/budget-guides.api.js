import { baseApi } from "@/store/baseApi";
export const budgetGuidesApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["BudgetGuides"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      getBudgetGuides: builder.query({
        query: (params) => ({ url: "/budget-guides", params }),
        providesTags: ["BudgetGuides"],
      }),
      getBudgetGuide: builder.query({
        query: (id) => `/budget-guides/${id}`,
        providesTags: ["BudgetGuides"],
      }),
      getBudgetGuideTemplate: builder.query({
        query: (reference) => ({
          url: "/budget-guides/template",
          params: reference ? { reference } : undefined,
        }),
      }),
      createBudgetGuide: builder.mutation({
        query: (body) => ({ url: "/budget-guides", method: "POST", body }),
        invalidatesTags: ["BudgetGuides"],
      }),
      updateBudgetGuide: builder.mutation({
        query: ({ id, body }) => ({
          url: `/budget-guides/${id}`,
          method: "PATCH",
          body,
        }),
        invalidatesTags: ["BudgetGuides"],
      }),
      transferBudgetGuide: builder.mutation({
        query: ({ id, body }) => ({
          url: `/budget-guides/${id}/transfer`,
          method: "POST",
          body,
        }),
        invalidatesTags: ["BudgetGuides"],
      }),
      deleteBudgetGuide: builder.mutation({
        query: ({ id, revision }) => ({
          url: `/budget-guides/${id}`,
          method: "DELETE",
          params: { expected_revision: revision },
        }),
        invalidatesTags: ["BudgetGuides"],
      }),
    }),
  });
export const {
  useGetBudgetGuidesQuery,
  useGetBudgetGuideQuery,
  useGetBudgetGuideTemplateQuery,
  useLazyGetBudgetGuideTemplateQuery,
  useCreateBudgetGuideMutation,
  useUpdateBudgetGuideMutation,
  useTransferBudgetGuideMutation,
  useDeleteBudgetGuideMutation,
} = budgetGuidesApi;
