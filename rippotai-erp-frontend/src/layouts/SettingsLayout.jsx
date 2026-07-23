import React, { useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Bell,
  User,
  Users as UsersIcon,
  Shield,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

import TopHeader from "../components/dashboard/TopHeader";

// ====================== SETTINGS LAYOUT (shell) ======================
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
          Loading…
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-page">
      <TopHeader app="settings" />
      <main className="p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1
              className="text-3xl font-semibold"
              style={{ color: "var(--ink-green)" }}
            >
              Settings
            </h1>
            <p className="text-[#6B7B7C] mt-1">
              Manage your account, team, and workspace preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-9">
              <div className="bg-white border border-[rgba(31,69,59,0.14)] rounded-3xl p-8 shadow-sm min-h-[600px]">
                {/* Active tab renders here based on the current /settings/* route */}
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
