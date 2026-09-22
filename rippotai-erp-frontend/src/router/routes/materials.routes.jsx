import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";
import MaterialRequirementList from "@/pages/materials/MaterialRequirementList";
import SampleBoardList from "@/pages/materials/SampleBoardList";
import MaterialRateSheetList from "@/pages/materials/MaterialRateSheetList";
import MaterialEstimateList from "@/pages/materials/MaterialEstimateList";
import MaterialQuotationList from "@/pages/materials/MaterialQuotationList";
import PurchaseOrderList from "@/pages/materials/PurchaseOrderList";
import DeliveryChallanList from "@/pages/materials/DeliveryChallanList";

import QuotationsDashboard from "@/pages/quotations/QuotationsDashboard";
import QuotationNew from "@/pages/quotations/QuotationNew";
import QuotationDetail from "@/pages/quotations/QuotationDetail";
import QuotationCompare from "@/pages/quotations/QuotationCompare";
import QuotationsActivity from "@/pages/quotations/QuotationActivity";
import { MaterialRequirementForm } from "../../pages/materials/MaterialRequirementForm";
import VendorsDashboard from "@/pages/vendors/VendorsDashboard";
import VendorNew from "@/pages/vendors/VendorNew";
import ShortlistsIndex from "@/pages/vendors/ShortlistsIndex";
import ShortlistDetail from "@/pages/vendors/ShortlistDetail";
import VendorProfile from "@/pages/vendors/VendorProfile";

import ComingSoon from "../../pages/ComingSoon";

import CreatePurchaseOrderPage from "../../pages/materials/CreatePurchaseOrderPage";
import PurchaseOrderView from "../../pages/materials/PurchaseOrderView";

import CreateDeliveryChallanPage from "../../pages/materials/CreateDeliveryChallanPage";
import DeliveryChallanView from "../../pages/materials/DeliveryChallanView";

import BoqVendorRateComparison from "../../pages/boq/BoqVendorRateComparison";
import WorkOrderList from "../../pages/materials/WorkOrderList";
import CreateWorkOrder from "../../pages/materials/CreateWorkOrder";
import WorkOrderView from "../../pages/materials/WorkOrderView";
import SingleProjectMaterialRequirements from "../../pages/materials/SingleProjectMaterialRequirements";

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
      {
        index: true,
        element: <AppDashboard appKey="procurement" />,
      },

      // ------------------------------------------------------------
      // Material Requirements
      // ------------------------------------------------------------

      {
        path: "requirements",
        element: <MaterialRequirementList />,
      },

      {
        path: "requirements/add",
        element: <MaterialRequirementForm />,
      },
      {
        path: ":projectId/material-requirements",
        element: <SingleProjectMaterialRequirements />,
      },
      // ------------------------------------------------------------
      // Sample Boards
      // ------------------------------------------------------------

      {
        path: "sample-boards",
        element: <SampleBoardList />,
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

      {
        path: "vendors/rate-comparison",
        element: <BoqVendorRateComparison />,
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

      {
        path: "purchase-orders/new",
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
        path: "work-order/all",
        element: <WorkOrderList />,
      },
      {
        path: "work-order/new",
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
      // Quotation / Estimate Dashboard
      // ------------------------------------------------------------

      {
        path: "estimates/all",
        element: <QuotationsDashboard />,
      },

      {
        path: "estimates/new",
        element: <QuotationNew />,
      },

      {
        path: "estimates/:id/edit",
        element: <QuotationNew />,
      },

      {
        path: "estimates/activity",
        element: <QuotationsActivity />,
      },

      {
        path: "estimates/compare",
        element: <QuotationCompare />,
      },

      {
        path: "estimates/:id",
        element: <QuotationDetail />,
      },

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
        path: "vendors/shortlists",
        element: <ComingSoon />,
      },

      {
        path: "vendors/shortlists/:id",
        element: <ComingSoon />,
      },

      {
        path: "vendors/:id/edit",
        element: <VendorNew />,
      },

      {
        path: "vendors/:id",
        element: <VendorProfile />,
      },
    ],
  },
];
