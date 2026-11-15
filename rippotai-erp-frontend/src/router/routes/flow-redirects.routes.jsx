// Pages removed from INOS by the flow restructure (FLOW-SPEC). Their data stays
// in the database; old links land on the nearest page that is still in the flow.
import { Navigate } from "react-router-dom";
import ProjectDocumentsRedirect from "../ProjectDocumentsRedirect";

const to = (path, target) => ({ type: "raw", path, element: <Navigate to={target} replace /> });

const MODULES = ["projects", "design-studio", "crm", "procurement", "inventory", "site-operations", "ledger", "tasks", "calendar", "design", "build"];

export const flowRedirectRoutes = [
  // Project document register → Project › Documents
  { type: "raw", path: "/projects/documents/all", element: <ProjectDocumentsRedirect /> },
  to("/document/reference", "/projects"),

  // Scope of Approval (removed) → Scope of Work
  to("/crm/scope-of-approval", "/crm/scope-of-work/all"),
  to("/crm/scope-of-approval/*", "/crm/scope-of-work/all"),

  // Leads › Sources → Pipeline
  to("/crm/leads/sources", "/crm/pipeline"),

  // Budget Estimate list (hidden; forms stay reachable from the Business Proposal)
  to("/ledger/budget-estimates/all", "/ledger/budget-guides/all"),
  to("/ledger/budget-estimates", "/ledger/budget-guides/all"),
  to("/ledger/aggrements/all", "/build/agreement"),

  // Rate sheets / material requirements / estimates / sample boards
  to("/procurement/rate-sheets", "/procurement/vendors/rate-comparison"),
  to("/procurement/rate-sheets/*", "/procurement/vendors/rate-comparison"),
  to("/procurement/requirements", "/procurement/material-procurement/list"),
  to("/procurement/requirements/*", "/procurement/material-procurement/list"),
  to("/procurement/:projectId/material-requirements", "/procurement/material-procurement/list"),
  to("/procurement/estimates", "/procurement/material-procurement/list"),
  to("/procurement/sample-boards", "/design/material-palette"),

  // Site visit report, separate QC pages, RFIs / mock-ups
  to("/site-operations/site-visits", "/site-operations/visit-assignments"),
  to("/site-operations/site-visits/*", "/site-operations/visit-assignments"),
  to("/site-operations/qc/history", "/site-operations/checklists"),
  to("/site-operations/qc/handoff-status", "/site-operations/checklists"),
  to("/site-operations/rfis", "/build"),
  to("/site-operations/mockups", "/build"),

  // Crucial Work
  to("/tasks/crucial-work", "/tasks/mine"),

  // Per-app Activity / Roles links → Admin Console
  ...MODULES.flatMap((m) => [to(`/${m}/activity`, "/console/activity"), to(`/${m}/roles`, "/console/roles-permissions")]),
];
