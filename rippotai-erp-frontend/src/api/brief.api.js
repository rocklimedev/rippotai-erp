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

    // NEW: list endpoint for the ProjectBrief list page. No list route was
    // provided alongside the by-id getter, so this assumes the collection
    // route mirrors it (GET /documents/forms/project-brief). Adjust the
    // path/params if the backend differs.
    getProjectBriefs: builder.query({
      query: ({ project_id, status } = {}) => ({
        url: "/documents/forms/project-brief",
        method: "GET",
        params: { project_id, status },
      }),
      providesTags: ["ProjectBrief"],
    }),
    // In brief.api.js
    deleteProjectBrief: builder.mutation({
      query: (id) => ({
        url: `/documents/forms/project-brief/${id}`,
        method: "DELETE",
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

export const {
  useCreateProjectBriefMutation,
  useGetProjectBriefsQuery,
  useGetProjectBriefQuery,
  useDeleteProjectBriefMutation,
} = briefApi;
