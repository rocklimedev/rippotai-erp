import SettingsLayout from "@/layouts/SettingsLayout";
import ProfileSettings from "@/pages/settings/ProfileSettings";
import SecuritySettings from "@/pages/settings/SecuritySettings";
import NotificationSettings from "@/pages/settings/NotificationSettings";
import BillingSettings from "@/pages/settings/BillingSettings";
import EstimateSignature from "@/pages/settings/EstimateSignature";
import UsersSettings from "@/pages/settings/UserSettings";
import RolesPermissions from "@/pages/settings/RolesPermissions";
import SuperAdmin from "@/pages/settings/SuperAdmin";
import TermsSettings from "../../pages/settings/TermsSettings";

export const settingsRoutes = [
  {
    type: "layout",
    path: "/settings",
    layout: SettingsLayout,
    children: [
      { index: true, element: <ProfileSettings /> },
      { path: "security", element: <SecuritySettings /> },

      { path: "estimate-signature", element: <EstimateSignature /> },
      { path: "users", element: <UsersSettings /> },
      { path: "roles-permissions", element: <RolesPermissions /> },
      { path: "super-admin", element: <SuperAdmin /> },
      { path: "terms-and-conditions", element: <TermsSettings /> },
    ],
  },
];
