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
import QuotationsDashboard from "@/pages/quotations/QuotationsDashboard";
import QuotationNew from "@/pages/quotations/QuotationNew";
import QuotationDetail from "@/pages/quotations/QuotationDetail";
import QuotationCompare from "@/pages/quotations/QuotationCompare";
import QuotationsActivity from "@/pages/quotations/QuotationActivity";
import VendorsDashboard from "@/pages/vendors/VendorsDashboard";
import VendorNew from "@/pages/vendors/VendorNew";
import ShortlistsIndex from "@/pages/vendors/ShortlistsIndex";
import ShortlistDetail from "@/pages/vendors/ShortlistDetail";

import VendorProfile from "@/pages/vendors/VendorProfile";
import ComingSoon from "../../pages/ComingSoon";

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
      { path: "estimates/all", element: <QuotationsDashboard /> },
      { path: "estimates/new", element: <QuotationNew /> },
      { path: "estimates/:id/edit", element: <QuotationNew /> },
      { path: "estimates/activity", element: <QuotationsActivity /> },
      { path: "estimates/compare", element: <QuotationCompare /> },
      { path: "estimates/:id", element: <QuotationDetail /> },
      { path: "vendors/directory", element: <VendorsDashboard /> },
      { path: "vendors/new", element: <VendorNew /> },
      { path: "vendors/shortlists", element: <ComingSoon /> },
      { path: "vendors/shortlists/:id", element: <ComingSoon /> },

      { path: "vendors/:id/edit", element: <VendorNew /> },
      { path: "vendors/:id", element: <VendorProfile /> },
    ],
  },
];
