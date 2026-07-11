import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";

export const projectsApi = createApi({
  reducerPath: "projectsApi",
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

  tagTypes: ["Projects", "ProjectStatus"],

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
    // Get Projects Summary (counts for the dashboard cards)
    // =========================
    getProjectsSummary: builder.query({
      query: () => "/projects/summary",
      providesTags: ["Projects"],
    }),

    // =========================
    // Get Full Projects List (dashboard table: progress, timeline, phase, etc.)
    // =========================
    getProjectsFull: builder.query({
      query: () => "/projects/full",
      providesTags: ["Projects"],
    }),

    // =========================
    // Get Project By ID
    // =========================
    getProjectById: builder.query({
      query: (id) => `/projects/${id}`,
      providesTags: (result, error, id) => [{ type: "Projects", id }],
    }),

    // =========================
    // Get Project Status Checklist
    // =========================
    getProjectStatusChecklist: builder.query({
      query: (id) => `/projects/${id}/status-checklist`,
      providesTags: (result, error, id) => [{ type: "ProjectStatus", id }],
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
      invalidatesTags: (result, error, { id }) => [
        "Projects",
        { type: "Projects", id },
        { type: "ProjectStatus", id },
      ],
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
      invalidatesTags: (result, error, { id }) => [
        "Projects",
        { type: "Projects", id },
      ],
    }),

    // =========================
    // Restore Project
    // =========================
    restoreProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        "Projects",
        { type: "Projects", id },
      ],
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
  useGetProjectsSummaryQuery,
  useGetProjectsFullQuery,
  useGetProjectByIdQuery,
  useGetProjectStatusChecklistQuery,
  useUpdateProjectMutation,
  useArchiveProjectMutation,
  useRestoreProjectMutation,
  useDeleteProjectMutation,
} = projectsApi;
