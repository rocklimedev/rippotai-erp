import { baseApi } from "./baseApi";

const sharedMutations =
  /^(create|update|delete|restore|lock|unlock|replace|initialize)(Project|ProjectBrief|SiteRecce|ScopeOfWork|ScopeItem|BudgetEstimate|ProjectPlanner|ProjectPlanners|PlannerItem|PaymentSchedule|PlanOfAction|PlanOfActionPhases|Quotation|QuotationItems|MaterialProcurement|Boq|PurchaseOrder|DeliveryChallan|WorkOrder)(FromBoq|Status|Version)?$/;
const tags = [
  "Projects",
  "ProjectBriefs",
  "SiteRecces",
  "BudgetEstimates",
  "DeliveryChallans",
  "WorkOrders",
  "ScopeOfWork", "BudgetEstimates", "ProjectPlanner", "PaymentSchedule", "PlanOfActions", "Quotation", "MaterialProcurement", "BOQ", "PurchaseOrders",
];

// A document save can update other documents through backend backfill.
export const sharedDocumentCache = (store) => (next) => (action) => {
  const result = next(action);
  if (
    action.type === `${baseApi.reducerPath}/executeMutation/fulfilled` &&
    sharedMutations.test(action.meta?.arg?.endpointName || "")
  ) {
    store.dispatch(baseApi.util.invalidateTags(tags));
  }
  return result;
};
