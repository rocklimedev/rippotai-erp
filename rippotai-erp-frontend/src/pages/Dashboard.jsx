import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { MODULE_ICONS } from "@/components/icons/ModuleIcons";
import { APP_META, LANDING_ORDER } from "@/config/appNav";
import NotificationsBell from "../components/dashboard/NotificationsBell";
import UserMenu from "../components/users/UserMenu";

const BADGE_MAP = {
  boq: "boq",
  quotations: "quotations",
  calendar: "calendar",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [badges, setBadges] = useState({});

  useEffect(() => {
    api
      .get("/dashboard/app-badges")
      .then((r) => setBadges(r.data || {}))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-page" data-testid="landing-page">
      <header
        className="h-16 px-6 lg:px-10 flex items-center justify-between"
        data-testid="landing-header"
      >
        {/* Logo top-left */}
        <button
          onClick={() => navigate("/dashboard")}
          data-testid="inos-logo"
          className="flex items-center gap-2.5"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[16px] font-semibold"
            style={{ background: "#1F453B", fontFamily: "Poppins" }}
          >
            B
          </div>
          <div className="hidden sm:block">
            <div
              className="text-[16px] font-semibold"
              style={{
                fontFamily: "Poppins",
                color: "#1F453B",
                letterSpacing: "0.02em",
              }}
            >
              INOS
            </div>
            <div className="eyebrow leading-none mt-1">ERP · Beta</div>
          </div>
        </button>

        {/* Notifications + avatar top-right */}
        <div className="flex items-center gap-3">
          <NotificationsBell />
          <UserMenu />
        </div>
      </header>

      {/* Centered 2×5 tile grid */}
      <main
        className="flex items-center justify-center px-6"
        style={{ minHeight: "calc(100vh - 64px)" }}
      >
        <section
          data-testid="app-grid"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-10 justify-items-center"
        >
          {LANDING_ORDER.map((key) => {
            const Icon = MODULE_ICONS[key];
            const meta = APP_META[key];
            const bkey = BADGE_MAP[key];
            const badge = bkey ? badges[bkey] || 0 : 0;
            return (
              <div key={key} className="flex flex-col items-center">
                <button
                  data-testid={`app-card-${key}`}
                  onClick={() => navigate(meta.base)}
                  aria-label={meta.name}
                  className="app-tile relative flex items-center justify-center focus:outline-none"
                  style={{ width: 108, height: 108 }}
                >
                  <div style={{ width: 90, height: 90 }}>
                    <Icon />
                  </div>
                  {badge > 0 && (
                    <span
                      data-testid={`app-badge-${key}`}
                      className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center"
                      style={{ background: "#1F453B", color: "#FFF" }}
                    >
                      {badge}
                    </span>
                  )}
                </button>
                <div
                  data-testid={`app-label-${key}`}
                  className="mt-3 text-[15px] font-semibold text-center"
                  style={{ color: "#333333", fontFamily: "Poppins" }}
                >
                  {meta.name}
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
