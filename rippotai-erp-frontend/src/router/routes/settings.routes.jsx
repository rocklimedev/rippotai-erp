import SettingsLayout from "@/layouts/SettingsLayout";
import ProfileSettings from "@/pages/settings/ProfileSettings";
import SecuritySettings from "@/pages/settings/SecuritySettings";
import IntegrationSettings from "../../pages/settings/IntegrationSettings";

export const settingsRoutes = [
  {
    type: "layout",
    path: "/settings",
    layout: SettingsLayout,
    children: [
      { index: true, element: <ProfileSettings /> },
      { path: "security", element: <SecuritySettings /> },
      { path: "connectors", element: <IntegrationSettings /> },
    ],
  },
];
