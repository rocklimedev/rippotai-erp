import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";

// Inventory Pages
import SiteInventoryList from "@/pages/materials/SiteInventoryList";
import InventoryDashboard from "../../pages/dashboard/InventoryDashboard";

import SiteInventoryView from "@/pages/materials/SiteInventoryView";
import InventoryTransactions from "../../pages/materials/SiteInventoryTransactions";
import InventoryTransactionNew from "../../pages/materials/SiteInventoryTransactionForm";
import InventoryTransactionView from "../../pages/materials/SiteInventoryTransactionView";

import MaterialsDashboard from "../../pages/dashboard/MaterialDashboard";

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
        element: <AppDashboard appKey="inventory" />,
      },

      // ============================================================
      // SITE INVENTORY
      // ============================================================

      {
        path: "site-inventory/all",
        element: <SiteInventoryList />,
      },

      // Material-specific inventory view
      //
      // /materials/inventory/:id?project_id=PROJECT_UUID
      //
      {
        path: ":id",
        element: <SiteInventoryView />,
      },
      // ------------------------------------------------------------
      // INVENTORY TRANSACTIONS
      // ------------------------------------------------------------

      // Complete transaction ledger
      //
      // /materials/inventory/transactions
      //
      // Optional:
      // ?project_id=
      // ?site_id=
      // ?material_id=
      // ?transaction_type=
      // ?from_date=
      // ?to_date=
      //
      {
        path: "transactions",
        element: <InventoryTransactions />,
      },

      // Create / record inventory transaction
      //
      // /materials/inventory/transactions/new
      //
      // Optional:
      // ?project_id=
      // ?site_id=
      // ?material_id=
      //
      {
        path: "transactions/new",
        element: <InventoryTransactionNew />,
      },

      // Individual transaction detail
      //
      // /materials/inventory/transactions/:id
      //
      {
        path: "transactions/:id",
        element: <InventoryTransactionView />,
      },
    ],
  },
];

export default inventoryRoutes;
