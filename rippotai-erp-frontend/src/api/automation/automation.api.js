import { baseApi } from "../../store/baseApi";

// Automation engine: rules (trigger → conditions → actions), run log, escalations, audit.
export const automationApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getAutomationOverview: b.query({ query: () => "/automation/overview", providesTags: ["Automation"] }),
    getAutomationCatalog: b.query({ query: () => "/automation/catalog" }),
    getAutomationRules: b.query({ query: () => "/automation/rules", providesTags: ["Automation"] }),
    getAutomationRule: b.query({ query: (id) => `/automation/rules/${id}`, providesTags: ["Automation"] }),
    createAutomationRule: b.mutation({
      query: (body) => ({ url: "/automation/rules", method: "POST", body }),
      invalidatesTags: ["Automation"],
    }),
    updateAutomationRule: b.mutation({
      query: ({ id, ...body }) => ({ url: `/automation/rules/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Automation"],
    }),
    deleteAutomationRule: b.mutation({
      query: (id) => ({ url: `/automation/rules/${id}`, method: "DELETE" }),
      invalidatesTags: ["Automation"],
    }),
    toggleAutomationRule: b.mutation({
      query: (id) => ({ url: `/automation/rules/${id}/toggle`, method: "POST" }),
      invalidatesTags: ["Automation"],
    }),
    duplicateAutomationRule: b.mutation({
      query: (id) => ({ url: `/automation/rules/${id}/duplicate`, method: "POST" }),
      invalidatesTags: ["Automation"],
    }),
    runAutomationRule: b.mutation({
      query: ({ id, dryRun }) => ({ url: `/automation/rules/${id}/run`, method: "POST", body: { dryRun: !!dryRun } }),
      invalidatesTags: (r, e, { dryRun }) => (dryRun ? [] : ["Automation"]),
    }),
    testAutomationDraft: b.mutation({
      query: (body) => ({ url: "/automation/rules/test", method: "POST", body }),
    }),
    runAllAutomation: b.mutation({
      query: () => ({ url: "/automation/run", method: "POST" }),
      invalidatesTags: ["Automation"],
    }),
    getAutomationRuns: b.query({
      query: (params = {}) => ({ url: "/automation/runs", params }),
      providesTags: ["Automation"],
    }),
    getAutomationRun: b.query({ query: (id) => `/automation/runs/${id}`, providesTags: ["Automation"] }),
    getAutomationEscalations: b.query({
      query: (status) => ({ url: "/automation/escalations", params: status ? { status } : undefined }),
      providesTags: ["Automation"],
    }),
    updateAutomationEscalation: b.mutation({
      query: ({ id, ...body }) => ({ url: `/automation/escalations/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Automation"],
    }),
    getAutomationAudit: b.query({ query: () => "/automation/audit", providesTags: ["Automation"] }),
  }),
  overrideExisting: false,
});

export const {
  useGetAutomationOverviewQuery,
  useGetAutomationCatalogQuery,
  useGetAutomationRulesQuery,
  useGetAutomationRuleQuery,
  useCreateAutomationRuleMutation,
  useUpdateAutomationRuleMutation,
  useDeleteAutomationRuleMutation,
  useToggleAutomationRuleMutation,
  useDuplicateAutomationRuleMutation,
  useRunAutomationRuleMutation,
  useTestAutomationDraftMutation,
  useRunAllAutomationMutation,
  useGetAutomationRunsQuery,
  useGetAutomationRunQuery,
  useGetAutomationEscalationsQuery,
  useUpdateAutomationEscalationMutation,
  useGetAutomationAuditQuery,
} = automationApi;
