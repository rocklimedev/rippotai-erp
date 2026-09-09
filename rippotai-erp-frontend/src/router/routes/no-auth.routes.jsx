import NoAuthLayout from "../../layouts/NoAuthLayout";
export const boqRoutes = [
  {
    type: "layout",
    path: "/boq",
    layout: NoAuthLayout,
    layoutProps: { app: "no-auth" },
    dynamicSections: {
      appKey: "no-auth",
      exclude: ["new", "all", "templates", "rate-and-item-library", "activity"],
    },
    children: [
      { index: true, element: <AppDashboard appKey="boq" /> },
      { path: "all", element: <BoqDashboard /> },
      { path: "new", element: <BoqNew /> },
      { path: "templates", element: <BoqTemplatesList /> },
      { path: "template/new", element: <BoqTemplateNew /> },
      { path: "template/:id/editor", element: <BoqTemplateEditor /> },
      { path: "rate-and-item-library", element: <BoqLibraryPage /> },
      { path: "activity", element: <BoqActivityPage /> },
      { path: ":id/versions", element: <BoqVersions /> },
    ],
  },
  // These live outside the AppLayout shell (full-bleed workspace views)
  { path: "/boq/:id", element: <BoqWorkspace /> },
  { path: "/boq/:id/preview", element: <BoqPreview /> },
];
