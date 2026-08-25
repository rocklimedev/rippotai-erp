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
import "../api/auth.api";
import "../api/rbac.api";
import "../api/quotation.api";
import "../api/user.api";
import "../api/vendor.api";
import "../api/notification.api";
import "../api/activity-logs.api";
import "../api/project.api";
import "../api/settings.api";
import "../api/reports.api";
import "../api/user-signatures.api";
import "../api/unit.api";
import "../api/project-type.api";
import "../api/client.api";
import "../api/boq.api";
import "../api/document.api";
import "../api/drawing.api";
import "../api/cdn.api";
import "../api/brief.api";
import "../api/task.api";
import "../api/calendar.api";
import "../api/dashboard.api";
import "../api/leads.api";
import "../api/search.api";
import "../api/terms.api";

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
