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

export const briefApi = createApi({
  reducerPath: "briefApi",
  baseQuery,
  tagTypes: ["ProjectBrief"],
  endpoints: (builder) => ({
    createProjectBrief: builder.mutation({
      query: (body) => ({
        url: "/documents/forms/project-brief",
        method: "POST",
        body, // { project_id, sections }
      }),
      invalidatesTags: ["ProjectBrief"],
    }),

    getProjectBrief: builder.query({
      query: (id) => ({
        url: `/documents/forms/project-brief/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "ProjectBrief", id }],
    }),
  }),
});

export const { useCreateProjectBriefMutation, useGetProjectBriefQuery } =
  briefApi;
