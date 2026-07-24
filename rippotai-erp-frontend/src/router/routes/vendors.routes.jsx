import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";
import VendorsDashboard from "@/pages/vendors/VendorsDashboard";
import VendorNew from "@/pages/vendors/VendorNew";
import ShortlistsIndex from "@/pages/vendors/ShortlistsIndex";
import ShortlistDetail from "@/pages/vendors/ShortlistDetail";
import VendorActivity from "@/pages/vendors/VendorActivity";
import VendorProfile from "@/pages/vendors/VendorProfile";
import ComingSoon from "../../pages/ComingSoon";

export const vendorsRoutes = [
  {
    type: "layout",
    path: "/vendors",
    layout: AppLayout,
    layoutProps: { app: "vendors" },
    blockRoles: ["client"],
    dynamicSections: {
      appKey: "vendors",
      exclude: ["new", "shortlists", "directory"],
    },
    children: [
      { index: true, element: <AppDashboard appKey="vendors" /> },
      { path: "directory", element: <VendorsDashboard /> },
      { path: "new", element: <VendorNew /> },
      { path: "shortlists", element: <ComingSoon /> },
      { path: "shortlists/:id", element: <ComingSoon /> },
      { path: "activity", element: <VendorActivity /> },
      { path: ":id/edit", element: <VendorNew /> },
      { path: ":id", element: <VendorProfile /> },
    ],
  },
];
