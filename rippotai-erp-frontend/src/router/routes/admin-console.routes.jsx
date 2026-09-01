import UsersSettings from "@/pages/settings/UserSettings";
import RolesPermissions from "@/pages/settings/RolesPermissions";
import SuperAdmin from "@/pages/settings/SuperAdmin";
import TermsSettings from "@/pages/settings/TermsSettings";
import EstimateSignature from "@/pages/settings/EstimateSignature";
import AppLayout from "@/layouts/AppLayout";
import AdminDashboard from "../../pages/dashboard/AdminDashboard";
import ClientSettings from "../../pages/settings/ClientSettings";
export const adminConsoleRoutes = [
  {
    type: "layout",
    path: "/console",
    layout: AppLayout,
    layoutProps: {
      app: "adminConsole",
    },
    blockRoles: ["client"],

    children: [
      // =========================================================
      // WORKSPACE
      // =========================================================
      { index: true, element: <AdminDashboard /> },
      {
        path: "users",
        element: <UsersSettings />,
      },
      {
        path: "clients",
        element: <ClientSettings />,
      },
      {
        path: "roles-permissions",
        element: <RolesPermissions />,
      },
      { path: "estimate-signature", element: <EstimateSignature /> },
      // =========================================================
      // ADMINISTRATION
      // =========================================================

      {
        path: "super-admin",
        element: <SuperAdmin />,
      },

      {
        path: "terms-and-conditions",
        element: <TermsSettings />,
      },
    ],
  },
];
