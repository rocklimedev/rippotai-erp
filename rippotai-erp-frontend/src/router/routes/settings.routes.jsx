import SettingsLayout from "@/layouts/SettingsLayout";
import ProfileSettings from "@/pages/settings/ProfileSettings";
import SecuritySettings from "@/pages/settings/SecuritySettings";

export const settingsRoutes = [
  {
    type: "layout",
    path: "/settings",
    layout: SettingsLayout,
    children: [
      { index: true, element: <ProfileSettings /> },
      { path: "security", element: <SecuritySettings /> },
    ],
  },
];
