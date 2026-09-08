import { configureStore } from "@reduxjs/toolkit";

// Single shared RTK Query API
import { baseApi } from "./baseApi";
// -------------------------------
// FEATURE API FILES
// -------------------------------
// These no longer export their own reducer/middleware — each one calls
// baseApi.injectEndpoints(...) under the hood, registering its endpoints
// on the single baseApi instance. We still need to import them here (even
// though nothing is used from them directly) purely for the side effect of
// running that injection before the store is created.
import "../api/auth/auth.api";
import "../api/users/rbac.api";
import "../api/procuerment/quotation.api";
import "../api/users/user.api";
import "../api/vendors/vendor.api";
import "../api/engagement/notification.api";
import "../api/engagement/activity-logs.api";
import "../api/projects/project.api";
import "../api/meta/settings.api";
import "../api/reports/reports.api";
import "../api/users/user-signatures.api";
import "../api/meta/unit.api";
import "../api/projects/project-type.api";
import "../api/projects/client.api";
import "../api/boq/boq.api";
import "../api/documents/document.api";
import "../api/documents/drawing.api";
import "../api/meta/cdn.api";
import "../api/documents/brief.api";
import "../api/connectors/task.api";
import "../api/connectors/calendar.api";
import "../api/reports/dashboard.api";
import "../api/connectors/leads.api";
import "../api/meta/search.api";
import "../api/meta/terms.api";

// -------------------------------
// STORE
// -------------------------------
export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // RTK Query safety (optional but common)
    }).concat(baseApi.middleware),

  devTools: process.env.NODE_ENV !== "production",
});
