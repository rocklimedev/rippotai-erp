// src/router/quotationRoutes.js
import CreateQuotation from "../../concepts/quotations/CreateQuotation";
import QuotationDetail from "../../concepts/quotations/QuotationDetail";
import QuotationsList from "../../concepts/quotations/QuotationsList";
export const quotationRoutes = [
  {
    path: "/quotations",
    name: "Quotations",
    isSidebarActive: true,
    element: <QuotationsList />,
  },
  {
    path: "/quotations/create",
    name: "Create Quotation",
    isSidebarActive: false,
    element: <CreateQuotation />,
  },
  {
    path: "/quotations/:id/edit",
    name: "Edit Quotation",
    isSidebarActive: false,
    element: <CreateQuotation />,
  },
  {
    path: "/quotations/:id",
    name: "Quotation Detail",
    isSidebarActive: false,
    element: <QuotationDetail />,
  },
];
