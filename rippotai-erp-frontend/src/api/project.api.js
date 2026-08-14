import { baseApi } from "../store/baseApi";

export const projectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // Projects
    // ============================================================

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
    // Get Projects Summary
    // =========================
    getProjectsSummary: builder.query({
      query: () => "/projects/summary",
      providesTags: ["Projects"],
    }),

    // =========================
    // Get Full Projects List
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
        body: {
          archived_by,
        },
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

    // ============================================================
    // Project Phases
    // ============================================================

    // =========================
    // Create Project Phase
    // POST /projects-phases
    // =========================
    createProjectPhase: builder.mutation({
      query: (body) => ({
        url: "/projects-phases",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProjectPhases"],
    }),

    // =========================
    // Get All Project Phases
    // GET /projects-phases
    // GET /projects-phases?search=MEP
    // =========================
    getProjectPhases: builder.query({
      query: ({ search } = {}) => ({
        url: "/projects-phases",
        params: {
          search,
        },
      }),
      providesTags: ["ProjectPhases"],
    }),

    // =========================
    // Get Project Phase By ID
    // GET /projects-phases/:id
    // =========================
    getProjectPhaseById: builder.query({
      query: (id) => `/projects-phases/${id}`,
      providesTags: (result, error, id) => [{ type: "ProjectPhases", id }],
    }),

    // =========================
    // Update Project Phase
    // PATCH /projects-phases/:id
    // =========================
    updateProjectPhase: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/projects-phases/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "ProjectPhases",
        { type: "ProjectPhases", id },
      ],
    }),

    // =========================
    // Delete Project Phase
    // DELETE /projects-phases/:id
    // =========================
    deleteProjectPhase: builder.mutation({
      query: (id) => ({
        url: `/projects-phases/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        "ProjectPhases",
        { type: "ProjectPhases", id },
      ],
    }),
    // ============================================================
    // Milestones
    // ============================================================

    getUpcomingMilestones: builder.query({
      query: (limit = 5) => `/projects/milestones/upcoming?limit=${limit}`,
      providesTags: ["Milestones"],
    }),

    // ============================================================
    // Activity
    // ============================================================

    getRecentActivity: builder.query({
      query: (limit = 10) => `/projects/activity/recent?limit=${limit}`,
      providesTags: ["Activity"],
    }),

    // ============================================================
    // Dashboards — Phase 8
    // ============================================================

    getProjectsProgress: builder.query({
      query: () => "/projects/progress",
      providesTags: ["Projects"],
    }),

    getUpcomingMilestones4: builder.query({
      query: (limit = 4) => `/projects/upcoming-milestones?limit=${limit}`,
      providesTags: ["Milestones"],
    }),

    // ============================================================
    // Dashboards — Phase 10
    // ============================================================

    getProjectsProgressTrend: builder.query({
      query: (months = 6) => `/projects/progress-trend?months=${months}`,
      providesTags: ["Projects"],
    }),

    getProjectsPhaseMix: builder.query({
      query: () => "/projects/phase-mix",
      providesTags: ["Projects"],
    }),

    getProjectsVarianceByProject: builder.query({
      query: (limit = 6) => `/projects/variance-by-project?limit=${limit}`,
      providesTags: ["Projects"],
    }),
  }),

  overrideExisting: false,
});

export const {
  // ============================================================
  // Projects
  // ============================================================

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

  // ============================================================
  // Project Phases
  // ============================================================

  useCreateProjectPhaseMutation,
  useGetProjectPhasesQuery,
  useGetProjectPhaseByIdQuery,
  useUpdateProjectPhaseMutation,
  useDeleteProjectPhaseMutation,

  // ============================================================
  // Milestones
  // ============================================================

  useGetUpcomingMilestonesQuery,

  // ============================================================
  // Activity
  // ============================================================

  useGetRecentActivityQuery,

  // ============================================================
  // Dashboard
  // ============================================================

  useGetProjectsProgressQuery,
  useGetUpcomingMilestones4Query,
  useGetProjectsProgressTrendQuery,
  useGetProjectsPhaseMixQuery,
  useGetProjectsVarianceByProjectQuery,
} = projectsApi;
