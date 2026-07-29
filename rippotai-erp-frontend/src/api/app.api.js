// src/store/apis/appApi.js

import { baseApi } from "../store/baseApi";

export const appApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getApps: builder.query({
      query: () => ({
        url: "/apps",
        method: "GET",
      }),
      providesTags: ["Apps"],
    }),

    getApp: builder.query({
      query: (code) => ({
        url: `/apps/${code}`,
        method: "GET",
      }),
      providesTags: (result, error, code) => [{ type: "Apps", id: code }],
    }),

    createApp: builder.mutation({
      query: (body) => ({
        url: "/apps",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Apps"],
    }),

    updateApp: builder.mutation({
      query: ({ code, ...body }) => ({
        url: `/apps/${code}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { code }) => [
        "Apps",
        { type: "Apps", id: code },
      ],
    }),

    deleteApp: builder.mutation({
      query: (code) => ({
        url: `/apps/${code}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Apps"],
    }),
  }),
});

export const {
  useGetAppsQuery,
  useGetAppQuery,
  useCreateAppMutation,
  useUpdateAppMutation,
  useDeleteAppMutation,
} = appApi;
