import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("bc_token");

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

export const rekiApi = createApi({
  reducerPath: "rekiApi",
  baseQuery,
  tagTypes: ["SiteReki"],
  endpoints: (builder) => ({
    createSiteReki: builder.mutation({
      query: (body) => ({
        url: "/documents/forms/site-reki",
        method: "POST",
        body, // { project_id, sections, attachments? }
      }),
      invalidatesTags: ["SiteReki"],
    }),

    getSiteReki: builder.query({
      query: (id) => ({
        url: `/documents/forms/site-reki/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "SiteReki", id }],
    }),
  }),
});

export const { useCreateSiteRekiMutation, useGetSiteRekiQuery } = rekiApi;
