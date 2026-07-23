import React, { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import TopHeader from "../components/dashboard/TopHeader";
/* ---- Main AppLayout: only header + main, no sidebar ---- */
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

  return (
    <div className="min-h-screen bg-page">
      <TopHeader app={app} />
      <main className="p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
