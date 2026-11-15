import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import AppShell from "@/components/shell/AppShell";

// ====================== SETTINGS LAYOUT (Shell) ======================
export default function SettingsLayout() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (ready && !user) {
      navigate("/login", { replace: true, state: { from: location } });
    }
  }, [ready, user, navigate, location]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="text-[14px]" style={{ color: "#6B7B7C" }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppShell app="settings">
      <div className="w-full max-w-[1700px] mx-auto">
        <div className="bg-white border border-[var(--line)] rounded-2xl p-6 lg:p-8 min-h-[480px]">
          <Outlet />
        </div>
      </div>
    </AppShell>
  );
}
