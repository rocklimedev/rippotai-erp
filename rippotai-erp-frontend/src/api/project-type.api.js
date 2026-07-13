import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";

export const projectTypesApi = createApi({
  reducerPath: "projectTypesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    credentials: "include", // Remove if using Bearer token
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("bc_token"); // aligned with AuthContext
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      const cdnToken = import.meta.env.VITE_CDN_TOKEN;
      if (cdnToken) {
        headers.set("x-cdn-secret", cdnToken);
      }
      return headers;
    },
  }),

  tagTypes: ["ProjectTypes"],

  endpoints: (builder) => ({
    // =========================
    // Get All Project Types
    // =========================
    getProjectTypes: builder.query({
      query: () => "/project-types",
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({ type: "ProjectTypes", id: t.id })),
              { type: "ProjectTypes", id: "LIST" },
            ]
          : [{ type: "ProjectTypes", id: "LIST" }],
    }),

    // =========================
    // Get Project Type By ID
    // =========================
    getProjectTypeById: builder.query({
      query: (id) => `/project-types/${id}`,
      providesTags: (result, error, id) => [{ type: "ProjectTypes", id }],
    }),

    // =========================
    // Create Project Type
    // =========================
    createProjectType: builder.mutation({
      query: (body) => ({
        url: "/project-types",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ProjectTypes", id: "LIST" }],
    }),

    // =========================
    // Update Project Type
    // =========================
    updateProjectType: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/project-types/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ProjectTypes", id },
        { type: "ProjectTypes", id: "LIST" },
      ],
    }),

    // =========================
    // Delete Project Type
    // =========================
    deleteProjectType: builder.mutation({
      query: (id) => ({
        url: `/project-types/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ProjectTypes", id: "LIST" }],
    }),
  }),
});

export const {
  useGetProjectTypesQuery,
  useGetProjectTypeByIdQuery,
  useCreateProjectTypeMutation,
  useUpdateProjectTypeMutation,
  useDeleteProjectTypeMutation,
} = projectTypesApi;
