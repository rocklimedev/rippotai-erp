import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";
import PurchaseOrderList from "@/pages/materials/PurchaseOrderList";
import DeliveryChallanList from "@/pages/materials/DeliveryChallanList";

import VendorsDashboard from "@/pages/vendors/VendorsDashboard";
import VendorNew from "@/pages/vendors/VendorNew";
import VendorProfile from "@/pages/vendors/VendorProfile";


import CreatePurchaseOrderPage from "../../pages/materials/CreatePurchaseOrderPage";
import PurchaseOrderView from "../../pages/materials/PurchaseOrderView";

import CreateDeliveryChallanPage from "../../pages/materials/CreateDeliveryChallanPage";
import DeliveryChallanView from "../../pages/materials/DeliveryChallanView";

import BoqVendorRateComparison from "../../pages/boq/BoqVendorRateComparison";
import VendorRateComparisonList from "../../pages/boq/VendorRateComparisonList";
import WorkOrderList from "../../pages/materials/WorkOrderList";
import CreateWorkOrder from "../../pages/materials/CreateWorkOrder";
import WorkOrderView from "../../pages/materials/WorkOrderView";
import MaterialProcurementSheetList from "../../pages/materials/MaterialProcurementSheetList";
import CreateMaterialProcurementSheet from "../../pages/materials/CreateMaterialProcurementSheet";
import MaterialProcurementSheetView from "../../pages/materials/MaterialProcurementSheetView";
export const materialsRoutes = [
  {
    type: "layout",
    path: "/procurement",
    layout: AppLayout,

    layoutProps: {
      app: "procurement",
    },

    dynamicSections: {
      appKey: "procurement",

      exclude: [
        "all",
        "requirements",
        "requirements/new",
        "sample-boards",
        "rate-sheets",
        "estimates",
        "purchase-orders",
        "delivery-challans",
        "inventory",
      ],
    },

    children: [
      // ------------------------------------------------------------
      // Dashboard
      // ------------------------------------------------------------
      {
        index: true,
        element: <AppDashboard appKey="procurement" />,
      },

      // ------------------------------------------------------------
      // Material Requirements
      // ------------------------------------------------------------


      // ------------------------------------------------------------
      // Sample Boards
      // ------------------------------------------------------------


      // ------------------------------------------------------------
      // Material Rate Sheets
      // ------------------------------------------------------------

      // ------------------------------------------------------------
      // Material Estimates
      // ------------------------------------------------------------


      {
        path: "vendors/rate-comparison",
        element: <VendorRateComparisonList />,
      },
      {
        path: "vendors/rate-comparison/new",
        element: <BoqVendorRateComparison />,
      },
      {
        path: "vendors/rate-comparison/:id/edit",
        element: <BoqVendorRateComparison />,
      },
      {
        path: "vendors/rate-comparison/:id",
        element: <BoqVendorRateComparison />,
      },

      // ------------------------------------------------------------
      // Purchase Orders
      // ------------------------------------------------------------

      {
        path: "purchase-orders",
        element: <PurchaseOrderList />,
      },

      {
        path: "purchase-orders/new",
        element: <CreatePurchaseOrderPage />,
      },
      {
        path: "purchase-orders/:id/edit",
        element: <CreatePurchaseOrderPage />,
      },
      {
        path: "purchase-orders/:id",
        element: <PurchaseOrderView />,
      },

      // ------------------------------------------------------------
      // Delivery Challans
      // ------------------------------------------------------------

      {
        path: "delivery-challans",
        element: <DeliveryChallanList />,
      },

      {
        path: "delivery-challans/new",
        element: <CreateDeliveryChallanPage />,
      },

      {
        path: "delivery-challans/:id",
        element: <DeliveryChallanView />,
      },
      {
        path: "delivery-challans/:id/edit",
        element: <CreateDeliveryChallanPage />,
      },
      {
        path: "work-order/all",
        element: <WorkOrderList />,
      },
      {
        path: "work-order/new",
        element: <CreateWorkOrder />,
      },
      {
        path: "work-order/:id/edit",
        element: <CreateWorkOrder />,
      },
      {
        path: "work-order/:id",
        element: <WorkOrderView />,
      },
      // ------------------------------------------------------------
      // SITE INVENTORY
      // ------------------------------------------------------------

      // ------------------------------------------------------------
      // Vendors
      // ------------------------------------------------------------

      {
        path: "vendors/directory",
        element: <VendorsDashboard />,
      },

      {
        path: "vendors/new",
        element: <VendorNew />,
      },

      {
        path: "vendors/:id/edit",
        element: <VendorNew />,
      },

      {
        path: "vendors/:id",
        element: <VendorProfile />,
      },
      {
        path: "material-procurement/list",
        element: <MaterialProcurementSheetList />,
      },
      {
        path: "material-procurement/:id",
        element: <MaterialProcurementSheetView />,
      },
      {
        path: "material-procurement/:id/edit",
        element: <CreateMaterialProcurementSheet />,
      },
      {
        path: "material-procurement/new",
        element: <CreateMaterialProcurementSheet />,
      },
    ],
  },
];
