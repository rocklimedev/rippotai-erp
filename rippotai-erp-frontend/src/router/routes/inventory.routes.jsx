import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";

// Inventory Pages
import SiteInventoryList from "@/pages/materials/SiteInventoryList";
import InventoryDashboard from "../../pages/dashboard/InventoryDashboard";

export const inventoryRoutes = [
  {
    type: "layout",
    path: "/inventory",
    layout: AppLayout,

    layoutProps: {
      app: "inventory",
    },

    dynamicSections: {
      appKey: "inventory",

      exclude: ["inventory", "activity", "roles", "edit-dashboard"],
    },

    children: [
      // ============================================================
      // INVENTORY DASHBOARD
      // ============================================================

      {
        index: true,
        element: <InventoryDashboard />,
      },

      // ============================================================
      // SITE INVENTORY
      // ============================================================

      {
        path: "site-inventory/all",
        element: <SiteInventoryList />,
      },
    ],
  },
];

export default inventoryRoutes;
