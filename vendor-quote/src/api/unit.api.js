import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token"); // Your token key

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const cdnToken = import.meta.env.VITE_CDN_TOKEN;
    if (cdnToken) {
      headers.set("x-cdn-secret", cdnToken);
    }

    return headers;
  },
});
export const unitApi = createApi({
  reducerPath: "unitApi",
  baseQuery,

  tagTypes: ["Unit"],

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
});

export const {
  useGetUnitsQuery,
  useGetUnitByIdQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation,
} = unitApi;
