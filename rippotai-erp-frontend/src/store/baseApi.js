import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include", // IMPORTANT for cookie-based auth
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("bc_token"); // aligned with AuthContext
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const cdnToken = import.meta.env.VITE_CDN_TOKEN;
    if (cdnToken) {
      headers.set("x-cdn-secret", cdnToken);
    }

    return headers;
  },
});

// -------------------------------
// SINGLE BASE API
// -------------------------------
// Every feature file (auth, boq, brief, calendar, etc.) should use
// `baseApi.injectEndpoints({...})` instead of calling `createApi` again.
// This keeps one shared reducer/cache/middleware instead of one per feature.
export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery,
  tagTypes: [
    // auth
    "AuthUser",
    "AuthTokens",
    "VerificationTokens",
    // rbac
    "Rbac",
    "Roles",
    "Permissions",
    "RolePermissions",
    "Apps",
    "RoleApps",
    // quotation
    "Quotation",
    "QuotationItems",
    "QuotationVersions",
    "QuotationDashboard",
    // users
    "Users",
    // vendors
    "Vendors",
    "VendorCategories",
    "BusinessTypes",
    "VendorSummary",
    "SavedSearches",
    "Shortlists",
    "VendorQuotations",
    "VendorDashboard",
    // notifications
    "Notifications",
    // activity logs
    "ActivityLogs",
    // projects
    "Projects",
    "ProjectStatus",
    "ProjectPhases",
    "Milestones",
    "Activity",
    // settings
    "Settings",
    // reports
    "Reports",
    // user signatures
    "UserSignature",
    // unit
    "Unit",
    // project types
    "ProjectTypes",
    // clients
    "Clients",
    // boq
    "BOQ",
    "BOQ_TEMPLATE",
    "BOQ_ACTIVITY",
    "LIBRARY",
    "BOQ_CATALOG",
    "BOQ_VERSION",
    "PlanOfActions",
    "TeamMembers",
    // documents
    "Document",
    // drawing
    "Drawing",
    // cdn
    "Cdn",
    // reki
    "Reki",
    "SiteRecce",
    // brief
    "ProjectBrief",
    // tasks
    "Tasks",
    // calendar
    "CalendarEvents",
    "CalendarStats",
    // dashboard
    "Dashboard",
    // leads
    "Leads",
    "Board",
    "Review",
    "LeadActivity",
    // search
    "Search",
    // terms
    "Terms",
    "TermsTemplates",
    "TermsVersions",
  ],
  endpoints: () => ({}), // each feature file injects its own endpoints
});
