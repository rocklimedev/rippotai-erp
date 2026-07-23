export const redirectRoutes = [
  // Removed / obsolete apps -> landing
  { type: "redirect", path: "/inventory/*", to: "/dashboard" },
  { type: "redirect", path: "/chats/*", to: "/dashboard" },
  { type: "redirect", path: "/clients/*", to: "/dashboard" },
  { type: "redirect", path: "/activity/*", to: "/dashboard" },

  // Estimate = Quotation (UI rename only; API + routes preserved for data safety)
  { type: "redirect", path: "/estimates", to: "/quotations" },
  { type: "redirect", path: "/estimates/*", to: "/quotations" },
];
