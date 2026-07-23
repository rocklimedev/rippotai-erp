import AppLayout from "@/layouts/AppLayout";
import AppDashboard from "@/components/dashboard/AppDashboard";
import BoqDashboard from "@/pages/boq/BoqDashboard";
import BoqNew from "@/pages/boq/BoqNew";
import BoqTemplatesList from "@/pages/boq/BoqTemplatesList";
import BoqTemplateNew from "@/pages/boq/BoqTemplateNew";
import BoqTemplateEditor from "@/pages/boq/BoqTemplateEditor";
import BoqLibraryPage from "@/pages/boq/BoqLibraryPage";
import BoqActivityPage from "@/pages/boq/BoqActivitypage";
import BoqVersions from "@/pages/boq/BoqVersions";
import BoqWorkspace from "@/pages/boq/BoqWorkspace";
import BoqPreview from "@/pages/boq/BoqPreview";

export const boqRoutes = [
  {
    type: "layout",
    path: "/boq",
    layout: AppLayout,
    layoutProps: { app: "boq" },
    dynamicSections: {
      appKey: "boq",
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
