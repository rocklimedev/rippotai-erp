import SettingsLayout from "@/layouts/SettingsLayout";

import UsersSettings from "@/pages/settings/UserSettings";
import RolesPermissions from "@/pages/settings/RolesPermissions";
import SuperAdmin from "@/pages/settings/SuperAdmin";
import TermsSettings from "@/pages/settings/TermsSettings";

export const adminConsoleRoutes = [
  {
    type: "layout",
    path: "/console",
    layout: SettingsLayout,
    layoutProps: {
      app: "adminConsole",
    },
    blockRoles: ["client"],

    children: [
      // =========================================================
      // WORKSPACE
      // =========================================================

      {
        path: "users",
        element: <UsersSettings />,
      },

      {
        path: "roles-permissions",
        element: <RolesPermissions />,
      },

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
