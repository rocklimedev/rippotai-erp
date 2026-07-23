import ClientPortalRoutes from "@/pages/client/ClientPortal";
import ClientHome from "@/pages/client/ClientHome";

export const clientRoutes = [
  // ClientPortalRoutes owns its own internal auth/nesting, so it's mounted raw.
  { type: "raw", path: "/client/*", element: <ClientPortalRoutes /> },
  { path: "/client-home", element: <ClientHome /> },
];
