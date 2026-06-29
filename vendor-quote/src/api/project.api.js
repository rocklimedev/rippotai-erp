import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";
export const projectsApi = createApi({
  reducerPath: "projectsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    credentials: "include", // Remove if using Bearer token
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
  }),

  tagTypes: ["Projects"],

  endpoints: (builder) => ({
    // =========================
    // Create Project
    // =========================
    createProject: builder.mutation({
      query: (body) => ({
        url: "/projects",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),

    // =========================
    // Get All Projects
    // =========================
    getProjects: builder.query({
      query: ({ status, includeArchived } = {}) => ({
        url: "/projects",
        params: {
          status,
          includeArchived,
        },
      }),
      providesTags: ["Projects"],
    }),

    // =========================
    // Get Project By ID
    // =========================
    getProjectById: builder.query({
      query: (id) => `/projects/${id}`,
      providesTags: ["Projects"],
    }),

    // =========================
    // Update Project
    // =========================
    updateProject: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/projects/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),

    // =========================
    // Archive Project
    // =========================
    archiveProject: builder.mutation({
      query: ({ id, archived_by }) => ({
        url: `/projects/${id}/archive`,
        method: "PATCH",
        body: { archived_by },
      }),
      invalidatesTags: ["Projects"],
    }),

    // =========================
    // Restore Project
    // =========================
    restoreProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: ["Projects"],
    }),

    // =========================
    // Delete Project
    // =========================
    deleteProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Projects"],
    }),
  }),
});

export const {
  useCreateProjectMutation,
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useUpdateProjectMutation,
  useArchiveProjectMutation,
  useRestoreProjectMutation,
  useDeleteProjectMutation,
} = projectsApi;
