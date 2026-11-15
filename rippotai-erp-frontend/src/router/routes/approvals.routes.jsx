import AppLayout from "@/layouts/AppLayout";
import MyApprovals from "@/pages/approvals/MyApprovals";

// My approvals is app-independent: it keeps the sidebar of the app the user came from.
export const approvalsRoutes = [
  {
    type: "layout",
    path: "/approvals",
    layout: AppLayout,
    layoutProps: { app: "auto" },
    blockRoles: ["client"],
    children: [{ index: true, element: <MyApprovals /> }],
  },
];
