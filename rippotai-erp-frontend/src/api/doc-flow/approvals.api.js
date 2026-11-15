// My approvals: documents waiting for the current user's review (all types).
import { baseApi } from "../../store/baseApi";

export const approvalsApi = baseApi.enhanceEndpoints({ addTagTypes: ["MyApprovals"] }).injectEndpoints({
  endpoints: (builder) => ({
    getMyApprovals: builder.query({
      query: () => ({ url: "/document-reviews/pending" }),
      providesTags: [{ type: "MyApprovals", id: "list" }],
    }),
    getMyApprovalsCount: builder.query({
      query: () => ({ url: "/document-reviews/pending/count" }),
      providesTags: [{ type: "MyApprovals", id: "count" }],
    }),
  }),
});

export const { useGetMyApprovalsQuery, useGetMyApprovalsCountQuery } = approvalsApi;

/** Waiting-approvals count for badges; null while unknown or without access. */
export function useMyApprovalsCount(skip) {
  const { data, isError } = useGetMyApprovalsCountQuery(undefined, {
    skip,
    pollingInterval: 120000,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: 60,
  });
  if (isError || data?.count == null) return null;
  return Number(data.count) || 0;
}

// Where each document type opens (same targets as its list page).
const VIEW = {
  "client-brief": (r) => `/crm/brief/${r.id}`,
  "scope-of-work": (r) => `/crm/scope-of-work/${r.id}`,
  "procurement-sheet": (r) => `/procurement/material-procurement/${r.id}`,
  boq: (r) => `/ledger/boq/${r.id}/preview`,
  quotation: (r) => `/procurement/quotations/${r.id}`,
  "purchase-order": (r) => `/procurement/purchase-orders/${r.id}`,
  "work-order": (r) => `/procurement/work-order/${r.id}`,
  checklist: (r) =>
    `/site-operations/checklists/workspace?${new URLSearchParams({ projectId: r.project_id || "", checklistId: r.id, view: "1" })}`,
  document: (r) => `/projects/documents/${r.id}`,
  "payment-schedule": (r) => `/ledger/payment-schedule/${r.id}`,
  "plan-of-action": (r) => `/crm/plan-of-action/${r.id}`,
  "budget-guide": (r) => `/ledger/budget-guides/${r.id}`,
};

export const approvalPath = (r) => VIEW[r.type]?.(r) || null;
