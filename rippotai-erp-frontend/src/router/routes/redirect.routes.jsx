import LegacyRedirect from "../LegacyRedirect";

export const redirectRoutes = [
  // /inventory, /chats, /clients, /activity are real pages now (workspace.routes / inventory.routes).

  // Legacy top-level URLs -> their current app routes (path + query preserved).
  ...["/boq", "/vendors", "/materials", "/documents"].flatMap((p) => [
    { type: "raw", path: p, element: <LegacyRedirect /> },
    { type: "raw", path: `${p}/*`, element: <LegacyRedirect /> },
  ]),
];
