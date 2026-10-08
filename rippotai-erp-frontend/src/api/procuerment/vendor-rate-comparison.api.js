import { baseApi } from "../../store/baseApi";

export const vendorRateComparisonApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["RateComparison"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      getRateComparisons: builder.query({
        query: (project_id) => ({
          url: "/vendor-rate-comparisons",
          params: project_id ? { project_id } : {},
        }),
        providesTags: ["RateComparison"],
      }),
      getRateComparison: builder.query({
        query: (id) => `/vendor-rate-comparisons/${id}`,
        providesTags: (r, e, id) => [{ type: "RateComparison", id }],
      }),
      createRateComparison: builder.mutation({
        query: (body) => ({
          url: "/vendor-rate-comparisons",
          method: "POST",
          body,
        }),
        invalidatesTags: ["RateComparison"],
      }),
      updateRateComparison: builder.mutation({
        query: ({ id, ...body }) => ({
          url: `/vendor-rate-comparisons/${id}`,
          method: "PUT",
          body,
        }),
        invalidatesTags: (r, e, { id }) => [
          "RateComparison",
          { type: "RateComparison", id },
        ],
      }),
    }),
  });
export const {
  useGetRateComparisonsQuery,
  useGetRateComparisonQuery,
  useCreateRateComparisonMutation,
  useUpdateRateComparisonMutation,
} = vendorRateComparisonApi;
