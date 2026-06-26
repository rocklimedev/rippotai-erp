// src/router/routes.js

import { authRoutes } from "./routes/auth.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { quotationRoutes } from "./routes/quotation.routes";
import { projectRoutes } from "./routes/project.routes";
import { vendorRoutes } from "./routes/vendor.routes";
import { reportRoutes } from "./routes/report.routes";
import { activityLogRoutes } from "./routes/activity-logs.routes";
import { settingsRoutes } from "./routes/settings.routes";
import { errorRoutes } from "./routes/error.routes";

const masterRoutes = [
  ...authRoutes,
  ...dashboardRoutes,
  ...quotationRoutes,
  ...projectRoutes,
  ...vendorRoutes,
  ...reportRoutes,
  ...activityLogRoutes,
  ...settingsRoutes,
  ...errorRoutes,
];

export default masterRoutes;
