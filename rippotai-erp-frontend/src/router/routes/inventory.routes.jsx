import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";

// Inventory Pages
import InventoryPage from "@/pages/workspace/InventoryPage";
import InventoryDashboard from "../../pages/dashboard/InventoryDashboard";

import SiteInventoryView from "@/pages/materials/SiteInventoryView";
// Legacy per-material ledger (still importable): pages/materials/SiteInventoryTransactions.jsx
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

      exclude: ["inventory", "edit-dashboard"],
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
        element: <InventoryPage tab="stock" />,
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
        path: "site-inventory/transactions",
        element: <InventoryPage tab="moves" />,
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
        path: "site-inventory/transactions/new",
        element: <InventoryTransactionNew />,
      },

      // Individual transaction detail
      //
      // /materials/inventory/transactions/:id
      //
      {
        path: "site-inventory/transactions/:id",
        element: <InventoryTransactionView />,
      },
    ],
  },
];

export default inventoryRoutes;
