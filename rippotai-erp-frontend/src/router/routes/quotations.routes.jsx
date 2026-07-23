import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";
import QuotationsDashboard from "@/pages/quotations/QuotationsDashboard";
import QuotationNew from "@/pages/quotations/QuotationNew";
import QuotationDetail from "@/pages/quotations/QuotationDetail";
import QuotationCompare from "@/pages/quotations/QuotationCompare";
import QuotationsActivity from "@/pages/quotations/QuotationActivity";

export const quotationsRoutes = [
  {
    type: "layout",
    path: "/quotations",
    layout: AppLayout,
    layoutProps: { app: "quotations" },
    blockRoles: ["client"],
    dynamicSections: {
      appKey: "quotations",
      exclude: ["new", "compare", "all"],
    },
    children: [
      { index: true, element: <AppDashboard appKey="quotations" /> },
      { path: "all", element: <QuotationsDashboard /> },
      { path: "new", element: <QuotationNew /> },
      { path: ":id/edit", element: <QuotationNew /> },
      { path: "activity", element: <QuotationsActivity /> },
      { path: "compare", element: <QuotationCompare /> },
      { path: ":id", element: <QuotationDetail /> },
    ],
  },
];
