import { baseApi } from "../../store/baseApi";

export const commandCenterApi = baseApi
  .enhanceEndpoints({
    addTagTypes: [
      "CommandCenterKpis",
      "CommandCenterPortfolio",
      "CommandCenterProjectPhases",
      "CommandCenterActions",
      "CommandCenterDocuments",
      "CommandCenterTasks",
      "CommandCenterCommercial",
      "CommandCenterTeamWorkload",
      "CommandCenterActivity",
      "CommandCenterGates",
    ],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      getCommandCenterGateReadiness: builder.query({
        query: ({ projectId, gateCode }) => ({
          url: `/projects/${encodeURIComponent(projectId)}/gates/${encodeURIComponent(gateCode)}`,
        }),
        providesTags: [
          "Document",
          "Drawing",
          "ProjectBrief",
          "ProjectBriefs",
          "SiteRecces",
          "ScopeOfWork",
          "PlanOfActions",
          "PaymentSchedule",
          "BudgetEstimates",
          "BOQ",
          "Quotation",
          "Projects",
          "CommandCenterGates",
        ],
      }),
      clearCommandCenterGate: builder.mutation({
        query: ({ projectId, gateCode, body }) => ({
          url: `/projects/${projectId}/gates/${gateCode}/clear`,
          method: "POST",
          body,
        }),
        invalidatesTags: [
          "CommandCenterKpis",
          "CommandCenterPortfolio",
          "CommandCenterProjectPhases",
          "CommandCenterActions",
          "CommandCenterDocuments",
          "CommandCenterTasks",
          "CommandCenterCommercial",
          "CommandCenterTeamWorkload",
          "CommandCenterActivity",
          "CommandCenterGates",
        ],
      }),
      reopenCommandCenterGate: builder.mutation({
        query: ({ projectId, gateCode, body }) => ({
          url: `/projects/${projectId}/gates/${gateCode}/reopen`,
          method: "POST",
          body,
        }),
        invalidatesTags: [
          "CommandCenterKpis",
          "CommandCenterPortfolio",
          "CommandCenterProjectPhases",
          "CommandCenterActions",
          "CommandCenterDocuments",
          "CommandCenterTasks",
          "CommandCenterCommercial",
          "CommandCenterTeamWorkload",
          "CommandCenterActivity",
          "CommandCenterGates",
        ],
      }),
      tickCommandCenterCondition: builder.mutation({
        query: ({ projectId, conditionId, body }) => ({
          url: `/projects/${projectId}/gates/conditions/${conditionId}/tick`,
          method: "POST",
          body,
        }),
        invalidatesTags: [
          "CommandCenterKpis",
          "CommandCenterPortfolio",
          "CommandCenterProjectPhases",
          "CommandCenterActions",
          "CommandCenterDocuments",
          "CommandCenterTasks",
          "CommandCenterCommercial",
          "CommandCenterTeamWorkload",
          "CommandCenterActivity",
          "CommandCenterGates",
        ],
      }),
      // =========================
      // KPI / PORTFOLIO
      // =========================

      getCommandCenterKpis: builder.query({
        query: () => ({
          url: "/command-center/kpis",
        }),
        providesTags: [
          "Document",
          "Drawing",
          "ProjectBrief",
          "ProjectBriefs",
          "SiteRecces",
          "ScopeOfWork",
          "PlanOfActions",
          "PaymentSchedule",
          "BudgetEstimates",
          "BOQ",
          "Quotation",
          "Projects",
          "CommandCenterKpis",
        ],
      }),

      getCommandCenterPortfolio: builder.query({
        query: (params) => ({
          url: "/command-center/portfolio",
          params,
        }),
        providesTags: [
          "Document",
          "Drawing",
          "ProjectBrief",
          "ProjectBriefs",
          "SiteRecces",
          "ScopeOfWork",
          "PlanOfActions",
          "PaymentSchedule",
          "BudgetEstimates",
          "BOQ",
          "Quotation",
          "Projects",
          "CommandCenterPortfolio",
        ],
      }),

      // =========================
      // PROJECT PHASES
      // =========================

      getCommandCenterProjectPhases: builder.query({
        query: (projectId) => ({
          url: `/command-center/projects/${projectId}/phases`,
        }),
        providesTags: [
          "Document",
          "Drawing",
          "ProjectBrief",
          "ProjectBriefs",
          "SiteRecces",
          "ScopeOfWork",
          "PlanOfActions",
          "PaymentSchedule",
          "BudgetEstimates",
          "BOQ",
          "Quotation",
          "Projects",
          "CommandCenterProjectPhases",
        ],
      }),

      getProjectPhaseDetail: builder.query({
        query: ({ projectId, phaseId }) => ({
          url: `/command-center/projects/${projectId}/phases/${phaseId}`,
        }),
        providesTags: [
          "Document",
          "Drawing",
          "ProjectBrief",
          "ProjectBriefs",
          "SiteRecces",
          "ScopeOfWork",
          "PlanOfActions",
          "PaymentSchedule",
          "BudgetEstimates",
          "BOQ",
          "Quotation",
          "Projects",
          "CommandCenterProjectPhases",
        ],
      }),

      // =========================
      // ACTION REQUIRED
      // =========================

      getCommandCenterActions: builder.query({
        query: () => ({
          url: "/command-center/actions",
        }),
        providesTags: [
          "Document",
          "Drawing",
          "ProjectBrief",
          "ProjectBriefs",
          "SiteRecces",
          "ScopeOfWork",
          "PlanOfActions",
          "PaymentSchedule",
          "BudgetEstimates",
          "BOQ",
          "Quotation",
          "Projects",
          "CommandCenterActions",
        ],
      }),

      // =========================
      // DOCUMENT CONTROL
      // =========================

      getCommandCenterDocuments: builder.query({
        query: () => ({
          url: "/command-center/documents",
        }),
        providesTags: [
          "Document",
          "Drawing",
          "ProjectBrief",
          "ProjectBriefs",
          "SiteRecces",
          "ScopeOfWork",
          "PlanOfActions",
          "PaymentSchedule",
          "BudgetEstimates",
          "BOQ",
          "Quotation",
          "Projects",
          "CommandCenterDocuments",
        ],
      }),

      uploadCommandCenterDocument: builder.mutation({
        query: ({ projectId, body }) => ({
          url: `/command-center/projects/${projectId}/documents/upload`,
          method: "POST",
          body,
        }),
        invalidatesTags: [
          "CommandCenterKpis",
          "CommandCenterPortfolio",
          "CommandCenterProjectPhases",
          "CommandCenterActions",
          "CommandCenterDocuments",
          "CommandCenterTasks",
          "CommandCenterCommercial",
          "CommandCenterTeamWorkload",
          "CommandCenterActivity",
          "CommandCenterGates",
        ],
      }),

      reviewCommandCenterDocument: builder.mutation({
        query: ({ documentId, body }) => ({
          url: `/command-center/documents/${documentId}/review`,
          method: "POST",
          body,
        }),
        invalidatesTags: [
          "CommandCenterKpis",
          "CommandCenterPortfolio",
          "CommandCenterProjectPhases",
          "CommandCenterActions",
          "CommandCenterDocuments",
          "CommandCenterTasks",
          "CommandCenterCommercial",
          "CommandCenterTeamWorkload",
          "CommandCenterActivity",
          "CommandCenterGates",
        ],
      }),

      // =========================
      // TASK / QC
      // =========================

      getCommandCenterTasks: builder.query({
        query: () => ({
          url: "/command-center/tasks",
        }),
        providesTags: [
          "Document",
          "Drawing",
          "ProjectBrief",
          "ProjectBriefs",
          "SiteRecces",
          "ScopeOfWork",
          "PlanOfActions",
          "PaymentSchedule",
          "BudgetEstimates",
          "BOQ",
          "Quotation",
          "Projects",
          "CommandCenterTasks",
        ],
      }),

      completeCommandCenterTask: builder.mutation({
        query: ({ projectId, taskDefinitionId, body }) => ({
          url: `/command-center/projects/${projectId}/tasks/${taskDefinitionId}/complete`,
          method: "POST",
          body,
        }),
        invalidatesTags: [
          "CommandCenterKpis",
          "CommandCenterPortfolio",
          "CommandCenterProjectPhases",
          "CommandCenterActions",
          "CommandCenterDocuments",
          "CommandCenterTasks",
          "CommandCenterCommercial",
          "CommandCenterTeamWorkload",
          "CommandCenterActivity",
          "CommandCenterGates",
        ],
      }),

      // =========================
      // GATE APPROVAL
      // =========================

      approveCommandCenterGate: builder.mutation({
        query: ({ projectId, phaseId, body }) => ({
          url: `/command-center/projects/${projectId}/phases/${phaseId}/approve-gate`,
          method: "POST",
          body,
        }),
        invalidatesTags: [
          "CommandCenterKpis",
          "CommandCenterPortfolio",
          "CommandCenterProjectPhases",
          "CommandCenterActions",
          "CommandCenterDocuments",
          "CommandCenterTasks",
          "CommandCenterCommercial",
          "CommandCenterTeamWorkload",
          "CommandCenterActivity",
          "CommandCenterGates",
        ],
      }),

      // =========================
      // COMMERCIAL
      // =========================

      getCommandCenterCommercial: builder.query({
        query: () => ({
          url: "/command-center/commercial",
        }),
        providesTags: [
          "Document",
          "Drawing",
          "ProjectBrief",
          "ProjectBriefs",
          "SiteRecces",
          "ScopeOfWork",
          "PlanOfActions",
          "PaymentSchedule",
          "BudgetEstimates",
          "BOQ",
          "Quotation",
          "Projects",
          "CommandCenterCommercial",
        ],
      }),

      // =========================
      // TEAM WORKLOAD
      // =========================

      getCommandCenterTeamWorkload: builder.query({
        query: () => ({
          url: "/command-center/team-workload",
        }),
        providesTags: [
          "Document",
          "Drawing",
          "ProjectBrief",
          "ProjectBriefs",
          "SiteRecces",
          "ScopeOfWork",
          "PlanOfActions",
          "PaymentSchedule",
          "BudgetEstimates",
          "BOQ",
          "Quotation",
          "Projects",
          "CommandCenterTeamWorkload",
        ],
      }),

      // =========================
      // ACTIVITY
      // =========================

      getCommandCenterActivity: builder.query({
        query: (params) => ({
          url: "/command-center/activity",
          params,
        }),
        providesTags: [
          "Document",
          "Drawing",
          "ProjectBrief",
          "ProjectBriefs",
          "SiteRecces",
          "ScopeOfWork",
          "PlanOfActions",
          "PaymentSchedule",
          "BudgetEstimates",
          "BOQ",
          "Quotation",
          "Projects",
          "CommandCenterActivity",
        ],
      }),
    }),

    overrideExisting: false,
  });

export const {
  useGetCommandCenterGateReadinessQuery,
  useClearCommandCenterGateMutation,
  useReopenCommandCenterGateMutation,
  useTickCommandCenterConditionMutation,
  // =========================
  // KPI / PORTFOLIO
  // =========================

  useGetCommandCenterKpisQuery,
  useLazyGetCommandCenterKpisQuery,

  useGetCommandCenterPortfolioQuery,
  useLazyGetCommandCenterPortfolioQuery,

  // =========================
  // PROJECT PHASES
  // =========================

  useGetCommandCenterProjectPhasesQuery: useGetProjectPhasesQuery,
  useLazyGetCommandCenterProjectPhasesQuery: useLazyGetProjectPhasesQuery,

  useGetProjectPhaseDetailQuery,
  useLazyGetProjectPhaseDetailQuery,

  // =========================
  // ACTION REQUIRED
  // =========================

  useGetCommandCenterActionsQuery,
  useLazyGetCommandCenterActionsQuery,

  // =========================
  // DOCUMENT CONTROL
  // =========================

  useGetCommandCenterDocumentsQuery,
  useLazyGetCommandCenterDocumentsQuery,

  useUploadCommandCenterDocumentMutation,
  useReviewCommandCenterDocumentMutation,

  // =========================
  // TASK / QC
  // =========================

  useGetCommandCenterTasksQuery,
  useLazyGetCommandCenterTasksQuery,

  useCompleteCommandCenterTaskMutation,

  // =========================
  // GATE APPROVAL
  // =========================

  useApproveCommandCenterGateMutation,

  // =========================
  // COMMERCIAL
  // =========================

  useGetCommandCenterCommercialQuery,
  useLazyGetCommandCenterCommercialQuery,

  // =========================
  // TEAM WORKLOAD
  // =========================

  useGetCommandCenterTeamWorkloadQuery,
  useLazyGetCommandCenterTeamWorkloadQuery,

  // =========================
  // ACTIVITY
  // =========================

  useGetCommandCenterActivityQuery,
  useLazyGetCommandCenterActivityQuery,
} = commandCenterApi;
