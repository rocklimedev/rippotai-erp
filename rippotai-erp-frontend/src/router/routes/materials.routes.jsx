import AppLayout from "@/layouts/AppLayout";
import MaterialRequirementList from "@/pages/materials/MaterialRequirementList";
import SampleBoardList from "@/pages/materials/SampleBoardList";
import MaterialRateSheetList from "@/pages/materials/MaterialRateSheetList";
import MaterialEstimateList from "@/pages/materials/MaterialEstimateList";
import MaterialQuotationList from "@/pages/materials/MaterialQuotationList";
import PurchaseOrderList from "@/pages/materials/PurchaseOrderList";
import DeliveryChallanList from "@/pages/materials/DeliveryChallanList";
import SiteInventoryList from "@/pages/materials/SiteInventoryList";
import { MaterialRequirementForm } from "../../pages/materials/MaterialRequirementForm";
import MaterialsDashboard from "../../pages/dashboard/MaterialDashboard";

export const materialsRoutes = [
  {
    type: "layout",
    path: "/materials",
    layout: AppLayout,
    layoutProps: {
      app: "materials",
    },

    dynamicSections: {
      appKey: "materials",

      exclude: [
        "all",
        "requirements",
        "requirements/new",
        "sample-boards",
        "rate-sheets",
        "estimates",
        "quotations",
        "purchase-orders",
        "delivery-challans",
        "inventory",
      ],
    },

    children: [
      // ------------------------------------------------------------
      // Dashboard
      // ------------------------------------------------------------

      // ------------------------------------------------------------
      // Material Requirements
      // ------------------------------------------------------------
      {
        index: true,
        element: <MaterialsDashboard />,
      },
      {
        path: "requirements",
        element: <MaterialRequirementList />,
      },

      // ------------------------------------------------------------
      // Sample Boards
      // ------------------------------------------------------------

      {
        path: "sample-boards",
        element: <SampleBoardList />,
      },
      {
        path: "add",
        element: <MaterialRequirementForm />,
      },

      // ------------------------------------------------------------
      // Material Rate Sheets
      // ------------------------------------------------------------

      {
        path: "rate-sheets",
        element: <MaterialRateSheetList />,
      },

      // ------------------------------------------------------------
      // Material Estimates
      // ------------------------------------------------------------

      {
        path: "estimates",
        element: <MaterialEstimateList />,
      },

      // ------------------------------------------------------------
      // Material Quotations
      // ------------------------------------------------------------

      {
        path: "quotations",
        element: <MaterialQuotationList />,
      },

      // ------------------------------------------------------------
      // Purchase Orders
      // ------------------------------------------------------------

      {
        path: "purchase-orders",
        element: <PurchaseOrderList />,
      },

      // ------------------------------------------------------------
      // Delivery Challans
      // ------------------------------------------------------------

      {
        path: "delivery-challans",
        element: <DeliveryChallanList />,
      },

      // ------------------------------------------------------------
      // Site Inventory
      // ------------------------------------------------------------

      {
        path: "inventory",
        element: <SiteInventoryList />,
      },
    ],
  },
];
