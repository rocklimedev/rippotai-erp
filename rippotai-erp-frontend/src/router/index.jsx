import { authRoutes } from "./routes/auth.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { boqRoutes } from "./routes/boq.routes";
import { leadsRoutes } from "./routes/leads.routes";
import { vendorsRoutes } from "./routes/vendors.routes";
import { quotationsRoutes } from "./routes/quotations.routes";
import { projectsRoutes } from "./routes/projects.routes";
import { documentsRoutes } from "./routes/documents.routes";
import { calendarRoutes } from "./routes/calendar.routes";
import { tasksRoutes } from "./routes/tasks.routes";
import { settingsRoutes } from "./routes/settings.routes";
import { clientRoutes } from "./routes/client.routes";
import { redirectRoutes } from "./routes/redirect.routes";
import { materialsRoutes } from "./routes/materials.routes";
import { siteOperationsRoutes } from "./routes/site-operations.routes";
import { designStudioRoutes } from "./routes/design-studio.routes";
import { adminConsoleRoutes } from "./routes/admin-console.routes";

// Order matters only for readability here — react-router matches on
// specificity, not array order, so new domains can be added anywhere.
const masterRoutes = [
  ...authRoutes,
  ...dashboardRoutes,
  ...boqRoutes,
  ...leadsRoutes,
  ...vendorsRoutes,
  ...quotationsRoutes,
  ...projectsRoutes,
  ...documentsRoutes,
  ...calendarRoutes,
  ...tasksRoutes,
  ...redirectRoutes,
  ...settingsRoutes,
  ...clientRoutes,
  ...materialsRoutes,
  ...siteOperationsRoutes,
  ...designStudioRoutes,
  ...adminConsoleRoutes,
];

export default masterRoutes;
