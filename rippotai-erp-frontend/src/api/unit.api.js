import { baseApi } from "../store/baseApi";
export const unitApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET ALL UNITS
    getUnits: builder.query({
      query: () => "/units",
      providesTags: ["Unit"],
    }),

    // GET SINGLE UNIT
    getUnitById: builder.query({
      query: (id) => `/units/${id}`,
      providesTags: ["Unit"],
    }),

    // CREATE UNIT
    createUnit: builder.mutation({
      query: (data) => ({
        url: "/units",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Unit"],
    }),

    // UPDATE UNIT
    updateUnit: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/units/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Unit"],
    }),

    // DELETE UNIT
    deleteUnit: builder.mutation({
      query: (id) => ({
        url: `/units/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Unit"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUnitsQuery,
  useGetUnitByIdQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation,
} = unitApi;
