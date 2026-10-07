import { baseApi } from '../../store/baseApi';

const api = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDocumentPrefill: builder.query({
      query: ({ projectId, sequence }) => `/projects/${projectId}/document-prefill/${sequence}`,
      providesTags: ['Projects', 'ProjectBriefs', 'SiteRecces', 'ScopeOfWork', 'BudgetEstimates', 'ProjectPlanner', 'PaymentSchedule', 'PlanOfActions', 'Quotation', 'MaterialProcurement', 'BOQ', 'PurchaseOrders', 'WorkOrders', 'DeliveryChallans'],
    }),
    getSharedProjectData: builder.query({
      query: (id) => `/projects/${id}/shared-document-data`,
      providesTags: ['Projects', 'ProjectBriefs', 'SiteRecces', 'BudgetEstimates', 'DeliveryChallans', 'WorkOrders'],
    }),
  }),
});

export const { useGetSharedProjectDataQuery, useGetDocumentPrefillQuery } = api;
