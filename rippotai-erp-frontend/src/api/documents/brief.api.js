import { baseApi } from "../../store/baseApi";

export const projectBriefsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =========================================================
    // PROJECT BRIEFS
    // =========================================================

    getProjectBriefs: builder.query({
      query: (projectId) => ({
        url: "/project-briefs",
        params: projectId ? { projectId } : undefined,
      }),
      providesTags: ["ProjectBriefs"],
    }),

    // =========================================================
    // LATEST BY PROJECT
    // =========================================================

    getLatestProjectBrief: builder.query({
      query: (projectId) => ({
        url: `/project-briefs/project/${projectId}/latest`,
      }),
      providesTags: ["ProjectBriefs"],
    }),

    // =========================================================
    // DETAIL
    // =========================================================

    getProjectBrief: builder.query({
      query: (id) => ({
        url: `/project-briefs/${id}`,
      }),
      providesTags: ["ProjectBriefs"],
    }),

    // =========================================================
    // CREATE
    // =========================================================

    createProjectBrief: builder.mutation({
      query: (body) => ({
        url: "/project-briefs",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProjectBriefs", "ProjectDocumentPhase", "CommandCenterKpis", "CommandCenterPortfolio", "CommandCenterProjectPhases", "CommandCenterDocuments", "CommandCenterActions", "CommandCenterGates"],
    }),

    // =========================================================
    // UPDATE
    // =========================================================

    updateProjectBrief: builder.mutation({
      query: ({ id, body }) => ({
        url: `/project-briefs/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ProjectBriefs", "ProjectDocumentPhase", "CommandCenterKpis", "CommandCenterPortfolio", "CommandCenterProjectPhases", "CommandCenterDocuments", "CommandCenterActions", "CommandCenterGates"],
    }),

    // =========================================================
    // STATUS
    // =========================================================

    updateProjectBriefStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/project-briefs/${id}/status`,
        method: "PATCH",
        body: {
          status,

        },
      }),
      invalidatesTags: ["ProjectBriefs", "ProjectDocumentPhase", "CommandCenterKpis", "CommandCenterPortfolio", "CommandCenterProjectPhases", "CommandCenterDocuments", "CommandCenterActions", "CommandCenterGates"],
    }),

    // =========================================================
    // NEW VERSION
    // =========================================================

    createProjectBriefVersion: builder.mutation({
      query: (id) => ({
        url: `/project-briefs/${id}/new-version`,
        method: "POST",
      }),
      invalidatesTags: ["ProjectBriefs", "ProjectDocumentPhase", "CommandCenterKpis", "CommandCenterPortfolio", "CommandCenterProjectPhases", "CommandCenterDocuments", "CommandCenterActions", "CommandCenterGates"],
    }),

    // =========================================================
    // DELETE
    // =========================================================

    deleteProjectBrief: builder.mutation({
      query: (id) => ({
        url: `/project-briefs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ProjectBriefs", "ProjectDocumentPhase", "CommandCenterKpis", "CommandCenterPortfolio", "CommandCenterProjectPhases", "CommandCenterDocuments", "CommandCenterActions", "CommandCenterGates"],
    }),
  }),

  overrideExisting: false,
});

export const {
  // Queries
  useGetProjectBriefsQuery,
  useLazyGetProjectBriefsQuery,

  useGetLatestProjectBriefQuery,
  useLazyGetLatestProjectBriefQuery,

  useGetProjectBriefQuery,
  useLazyGetProjectBriefQuery,

  // Mutations
  useCreateProjectBriefMutation,
  useUpdateProjectBriefMutation,
  useUpdateProjectBriefStatusMutation,
  useCreateProjectBriefVersionMutation,
  useDeleteProjectBriefMutation,
} = projectBriefsApi;
