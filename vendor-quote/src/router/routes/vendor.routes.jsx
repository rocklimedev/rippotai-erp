// src/router/vendorRoutes.js
import VendorDetail from "../../concepts/vendors/VendorDetail";
import VendorsList from "../../concepts/vendors/VendorsList";
export const vendorRoutes = [
  {
    path: "/vendors",
    name: "Vendors",
    isSidebarActive: true,
    element: <VendorsList />,
  },
  {
    path: "/vendors/:id",
    name: "Vendor Detail",
    isSidebarActive: false,
    element: <VendorDetail />,
  },
];
