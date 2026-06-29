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
};

const apiMiddlewares = [
  authApi.middleware,
  rbacApi.middleware,
  quotationApi.middleware,
  usersApi.middleware,
  vendorsApi.middleware,
  notificationsApi.middleware,
  activityLogsApi.middleware,
  projectsApi.middleware,
  settingsApi.middleware,
  reportsApi.middleware,
  userSignatureApi.middleware,
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
