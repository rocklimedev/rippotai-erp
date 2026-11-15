import { authRoutes } from "./routes/auth.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { approvalsRoutes } from "./routes/approvals.routes";

import { projectsRoutes } from "./routes/projects.routes";

import { calendarRoutes } from "./routes/calendar.routes";
import { tasksRoutes } from "./routes/tasks.routes";
import { settingsRoutes } from "./routes/settings.routes";
import { clientRoutes } from "./routes/client.routes";
import { redirectRoutes } from "./routes/redirect.routes";
import { materialsRoutes } from "./routes/materials.routes";
import { quotationRoutes } from "./routes/quotation.routes";
import { siteOperationsRoutes } from "./routes/site-operations.routes";
import { designStudioRoutes } from "./routes/design-studio.routes";
import { adminConsoleRoutes } from "./routes/admin-console.routes";
import { crmRoutes } from "./routes/crm.routes";
import ledgerRoutes from "./routes/ledger.routes";
import { commandCenterRoutes } from "./routes/command-center.routes";
import { automationRoutes } from "./routes/automation.routes";
import inventoryRoutes from "./routes/inventory.routes";
import { workspaceRoutes } from "./routes/workspace.routes";
import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";
import { Navigate, useLocation } from "react-router-dom";
import { flowRedirectRoutes } from "./routes/flow-redirects.routes";
import UploadDocListPage from "@/components/projects/upload-docs/UploadDocListPage";
import { PreDesignList, PreDesignProject } from "@/components/projects/upload-docs/PreDesignPages";
import MaterialPalettePage from "@/components/projects/upload-docs/MaterialPalettePage";
import ConsentFormPage from "@/components/projects/upload-docs/ConsentFormPage";

function GroupDashboardRedirect({ to }) {
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${search}${hash}`} replace />;
}

// Flow pages that live directly under the Design / Build apps (FLOW-SPEC).
const FLOW_PAGES = {
  design: [
    { path: "pre-design", element: <PreDesignList /> },
    { path: "pre-design/:projectId", element: <PreDesignProject /> },
    { path: "contract", element: <UploadDocListPage key="contract" docKey="contract" /> },
    { path: "design", element: <UploadDocListPage key="design" docKey="design" /> },
    { path: "material-palette", element: <MaterialPalettePage /> },
    { path: "working-drawings", element: <UploadDocListPage key="working-drawings" docKey="working-drawings" /> },
    { path: "tender-drawings", element: <UploadDocListPage key="tender-drawings" docKey="tender-drawings" /> },
  ],
  build: [
    { path: "agreement", element: <UploadDocListPage key="agreement" docKey="agreement" /> },
    { path: "consent-form", element: <ConsentFormPage /> },
  ],
};

// Order matters only for readability here — react-router matches on
// specificity, not array order, so new domains can be added anywhere.
const masterRoutes = [
  ...["design", "build"].map((app) => ({
    type: "layout",
    path: `/${app}`,
    layout: AppLayout,
    layoutProps: { app },
    blockRoles: ["client"],
    dynamicSections: { appKey: app },
    children: [{ index: true, element: <AppDashboard appKey={app} /> }, ...FLOW_PAGES[app]],
  })),
  ...flowRedirectRoutes,
  ...authRoutes,
  ...dashboardRoutes,
  ...approvalsRoutes,

  ...commandCenterRoutes,

  ...projectsRoutes,
  ...automationRoutes,
  ...calendarRoutes,
  ...tasksRoutes,
  ...redirectRoutes,
  ...settingsRoutes,
  ...clientRoutes,
  ...materialsRoutes,
  ...quotationRoutes,
  ...siteOperationsRoutes,
  ...inventoryRoutes,
  ...designStudioRoutes,
  ...ledgerRoutes,
  ...crmRoutes,
  ...adminConsoleRoutes,
  ...workspaceRoutes,
];

const groupedHomes = {
  "/design-studio": "/design",
  "/crm": "/design",
  "/ledger": "/build",
  "/inventory": "/build",
  "/procurement": "/build",
  "/site-operations": "/build",
};

export default masterRoutes.map((route) => {
  const to = groupedHomes[route.path];
  if (!to || !route.children) return route;
  return {
    ...route,
    children: route.children.map((child) =>
      child.index
        ? { ...child, element: <GroupDashboardRedirect to={to} /> }
        : child,
    ),
  };
});
