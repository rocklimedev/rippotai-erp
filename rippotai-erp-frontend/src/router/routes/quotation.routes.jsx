// Build › Procurement › Quotation (worker "quotation"). Menu entry → /procurement/quotations.
import AppLayout from "@/layouts/AppLayout";
import QuotationList from "@/pages/procurement-quotations/QuotationList";
import QuotationView from "@/pages/procurement-quotations/QuotationView";
import QuotationEdit from "@/pages/procurement-quotations/QuotationEdit";

export const quotationRoutes = [
  {
    type: "layout",
    path: "/procurement/quotations",
    layout: AppLayout,
    layoutProps: { app: "procurement" },
    blockRoles: ["client"],
    children: [
      { index: true, element: <QuotationList /> },
      { path: "new", element: <QuotationEdit creating /> },
      { path: ":id", element: <QuotationView /> },
      { path: ":id/edit", element: <QuotationEdit /> },
    ],
  },
];
