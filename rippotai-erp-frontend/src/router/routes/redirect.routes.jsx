import LegacyRedirect from "../LegacyRedirect";

export const redirectRoutes = [
  // /inventory, /chats, /clients, /activity are real pages now (workspace.routes / inventory.routes).

  // Legacy top-level URLs -> their current app routes (path + query preserved).
  // Estimate = Quotation: both live under /procurement/estimates.
  ...["/boq", "/vendors", "/quotations", "/estimates", "/materials", "/documents"].flatMap((p) => [
    { type: "raw", path: p, element: <LegacyRedirect /> },
    { type: "raw", path: `${p}/*`, element: <LegacyRedirect /> },
  ]),
];
