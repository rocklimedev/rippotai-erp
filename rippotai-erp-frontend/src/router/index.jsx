import { authRoutes } from "./routes/auth.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";

import { projectsRoutes } from "./routes/projects.routes";

import { calendarRoutes } from "./routes/calendar.routes";
import { tasksRoutes } from "./routes/tasks.routes";
import { settingsRoutes } from "./routes/settings.routes";
import { clientRoutes } from "./routes/client.routes";
import { redirectRoutes } from "./routes/redirect.routes";
import { materialsRoutes } from "./routes/materials.routes";
import { siteOperationsRoutes } from "./routes/site-operations.routes";
import { designStudioRoutes } from "./routes/design-studio.routes";
import { adminConsoleRoutes } from "./routes/admin-console.routes";
import { crmRoutes } from "./routes/crm.routes";
import ledgerRoutes from "./routes/ledger.routes";
import { commandCenterRoutes } from "./routes/command-center.routes";
import { automationRoutes } from "./routes/automation.routes";
import inventoryRoutes from "./routes/inventory.routes";

// Order matters only for readability here — react-router matches on
// specificity, not array order, so new domains can be added anywhere.
const masterRoutes = [
  ...authRoutes,
  ...dashboardRoutes,

  ...commandCenterRoutes,

  ...projectsRoutes,
  ...automationRoutes,
  ...calendarRoutes,
  ...tasksRoutes,
  ...redirectRoutes,
  ...settingsRoutes,
  ...clientRoutes,
  ...materialsRoutes,
  ...siteOperationsRoutes,
  ...inventoryRoutes,
  ...designStudioRoutes,
  ...ledgerRoutes,
  ...crmRoutes,
  ...adminConsoleRoutes,
];

export default masterRoutes;
