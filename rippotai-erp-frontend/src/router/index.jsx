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
];

export default masterRoutes;
