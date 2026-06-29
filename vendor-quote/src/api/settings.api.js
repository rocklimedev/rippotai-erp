// services/settingsApi.js

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
export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery,

  tagTypes: ["Settings"],
  endpoints: (builder) => ({
    // POST /settings
    createSetting: builder.mutation({
      query: (body) => ({
        url: "/settings",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Settings"],
    }),

    // GET /settings
    getSettings: builder.query({
      query: () => ({
        url: "/settings",
        method: "GET",
      }),
      providesTags: ["Settings"],
    }),

    // GET /settings/:key
    getSettingByKey: builder.query({
      query: (key) => ({
        url: `/settings/${key}`,
        method: "GET",
      }),
      providesTags: (result, error, key) => [{ type: "Settings", id: key }],
    }),

    // PATCH /settings/:key
    updateSetting: builder.mutation({
      query: ({ key, ...body }) => ({
        url: `/settings/${key}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { key }) => [
        "Settings",
        { type: "Settings", id: key },
      ],
    }),

    // PUT /settings/:key
    upsertSetting: builder.mutation({
      query: ({ key, ...body }) => ({
        url: `/settings/${key}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { key }) => [
        "Settings",
        { type: "Settings", id: key },
      ],
    }),

    // DELETE /settings/:key
    deleteSetting: builder.mutation({
      query: (key) => ({
        url: `/settings/${key}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const {
  useCreateSettingMutation,
  useGetSettingsQuery,
  useGetSettingByKeyQuery,
  useUpdateSettingMutation,
  useUpsertSettingMutation,
  useDeleteSettingMutation,
} = settingsApi;
