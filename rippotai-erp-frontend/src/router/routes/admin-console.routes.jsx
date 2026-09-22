import UsersSettings from "@/pages/settings/UserSettings";
import RolesPermissions from "@/pages/settings/RolesPermissions";
import SuperAdmin from "@/pages/settings/SuperAdmin";
import TermsSettings from "@/pages/settings/TermsSettings";
import EstimateSignature from "@/pages/settings/EstimateSignature";

import AppLayout from "@/layouts/AppLayout";
import ClientSettings from "../../pages/settings/ClientSettings";
import DocumentTypes from "../../pages/documents/DocumentTypes";
import ProjectPhases from "../../pages/projects/ProjectPhases";
import ProjectStructure from "../../pages/projects/ProjectStructure";

import AppDashboard from "@/components/dashboard/AppDashboard";

export const adminConsoleRoutes = [
  {
    type: "layout",
    path: "/console",
    layout: AppLayout,

    layoutProps: {
      app: "adminConsole",
    },

    // Dynamic sections such as:
    // Edit Dashboard
    // Activity
    // Roles & Permissions
    // are handled by AppLayout.
    dynamicSections: {
      appKey: "adminConsole",

      exclude: [
        "users",
        "clients",
        "roles-permissions",
        "project-phases",
        "document-types",
        "project-structure",
        "estimate-signature",
        "terms-and-conditions",
        "super-admin",
      ],
    },

    blockRoles: ["client"],

    children: [
      // =========================================================
      // ADMIN CONSOLE DASHBOARD
      // =========================================================

      {
        index: true,
        element: <AppDashboard appKey="adminConsole" />,
      },

      // =========================================================
      // WORKSPACE
      // =========================================================

      {
        path: "clients",
        element: <ClientSettings />,
      },

      {
        path: "users",
        element: <UsersSettings />,
      },

      {
        path: "roles-permissions",
        element: <RolesPermissions />,
      },

      {
        path: "project-phases",
        element: <ProjectPhases />,
      },

      {
        path: "document-types",
        element: <DocumentTypes />,
      },

      {
        path: "project-structure",
        element: <ProjectStructure />,
      },

      {
        path: "estimate-signature",
        element: <EstimateSignature />,
      },

      // =========================================================
      // ADMINISTRATION
      // =========================================================

      {
        path: "terms-and-conditions",
        element: <TermsSettings />,
      },

      {
        path: "super-admin",
        element: <SuperAdmin />,
      },
    ],
  },
];
