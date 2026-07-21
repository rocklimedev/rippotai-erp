import { configureStore } from "@reduxjs/toolkit";

// APIs
import { authApi } from "../api/auth.api";
import { rbacApi } from "../api/rbac.api";
import { quotationApi } from "../api/quotation.api";
import { usersApi } from "../api/user.api";
import { vendorsApi } from "../api/vendor.api";
import { notificationsApi } from "../api/notification.api";
import { activityLogsApi } from "../api/activity-logs.api";
import { projectsApi } from "../api/project.api";
import { settingsApi } from "../api/settings.api";
import { reportsApi } from "../api/reports.api";
import { userSignatureApi } from "../api/user-signatures.api";
import { unitApi } from "../api/unit.api";
import { projectTypesApi } from "../api/project-type.api";
import { clientsApi } from "../api/client.api";
import { boqApi } from "../api/boq.api";
import { documentApi } from "../api/document.api";
import { drawingApi } from "../api/drawing.api";
import { cdnApi } from "../api/cdn.api";
import { rekiApi } from "../api/reki.api";
import { briefApi } from "../api/brief.api";
import { tasksApi } from "../api/task.api";
import { calendarApi } from "../api/calendar.api";
import { dashboardApi } from "../api/dashboard.api";
import { leadsApi } from "../api/leads.api";
import { searchApi } from "../api/search.api";
// -------------------------------
// API LIST (clean management layer)
// -------------------------------
const apiReducers = {
  [authApi.reducerPath]: authApi.reducer,
  [rbacApi.reducerPath]: rbacApi.reducer,
  [quotationApi.reducerPath]: quotationApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
  [vendorsApi.reducerPath]: vendorsApi.reducer,
  [notificationsApi.reducerPath]: notificationsApi.reducer,
  [activityLogsApi.reducerPath]: activityLogsApi.reducer,
  [projectsApi.reducerPath]: projectsApi.reducer,
  [settingsApi.reducerPath]: settingsApi.reducer,
  [reportsApi.reducerPath]: reportsApi.reducer,
  [userSignatureApi.reducerPath]: userSignatureApi.reducer,
  [unitApi.reducerPath]: unitApi.reducer,
  [projectTypesApi.reducerPath]: projectTypesApi.reducer,
  [clientsApi.reducerPath]: clientsApi.reducer,
  [boqApi.reducerPath]: boqApi.reducer,
  [documentApi.reducerPath]: documentApi.reducer,
  [drawingApi.reducerPath]: drawingApi.reducer,
  [cdnApi.reducerPath]: cdnApi.reducer,
  [rekiApi.reducerPath]: rekiApi.reducer,
  [briefApi.reducerPath]: briefApi.reducer,
  [tasksApi.reducerPath]: tasksApi.reducer,
  [calendarApi.reducerPath]: calendarApi.reducer,
  [dashboardApi.reducerPath]: dashboardApi.reducer,
  [leadsApi.reducerPath]: leadsApi.reducer,
  [searchApi.reducerPath]: searchApi.reducer,
};

const apiMiddlewares = [
  authApi.middleware,
  rbacApi.middleware,
  quotationApi.middleware,
  usersApi.middleware,
  vendorsApi.middleware,
  notificationsApi.middleware,
  calendarApi.middleware,
  activityLogsApi.middleware,
  projectsApi.middleware,
  settingsApi.middleware,
  reportsApi.middleware,
  userSignatureApi.middleware,
  unitApi.middleware,
  projectTypesApi.middleware,
  searchApi.middleware,
  clientsApi.middleware,
  boqApi.middleware,
  documentApi.middleware,
  leadsApi.middleware,
  cdnApi.middleware,
  drawingApi.middleware,
  rekiApi.middleware,
  briefApi.middleware,
  tasksApi.middleware,
  dashboardApi.middleware,
];

// -------------------------------
// STORE
// -------------------------------
export const store = configureStore({
  reducer: apiReducers,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // RTK Query safety (optional but common)
    }).concat(...apiMiddlewares),

  devTools: process.env.NODE_ENV !== "production",
});
