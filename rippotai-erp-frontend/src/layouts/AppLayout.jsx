import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/shell/AppShell";
import { lastApp } from "@/components/shell/last-app";
import DocumentSequenceNavigation from "@/components/documents/DocumentSequenceNavigation";
import { navigationAppFor } from "@/config/appNav";

/* ---- Main AppLayout: global top bar + app sidebar + page (breadcrumb header) ----
   app="auto" (app-independent pages such as My approvals) keeps the sidebar of
   the app the user came from. */
export default function AppLayout({ app }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (ready && !user) {
      navigate("/login", { replace: true, state: { from: location } });
    }
  }, [ready, user, navigate, location]);

  // Auth check still in flight (or refresh() hasn't resolved yet) — avoid
  // flashing a header full of undefined user fields.
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="text-[14px]" style={{ color: "#6B7B7C" }}>
          Loading…
        </div>
      </div>
    );
  }

  // ready but no user — the redirect effect above will fire; render nothing
  // in the meantime to avoid a flash of protected content.
  if (!user) return null;

  const shellApp = app === "auto" ? lastApp() : navigationAppFor(app, location.pathname);
  return (
    <AppShell app={shellApp}>
      <DocumentSequenceNavigation>
        <Outlet />
      </DocumentSequenceNavigation>
    </AppShell>
  );
}
