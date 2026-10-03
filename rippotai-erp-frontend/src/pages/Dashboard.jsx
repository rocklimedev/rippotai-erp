import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { MODULE_ICONS } from "@/components/icons/ModuleIcons";
import { APP_META, LANDING_ORDER } from "@/config/appNav";
import NotificationsBell from "../components/dashboard/NotificationsBell";
import UserMenu from "../components/users/UserMenu";

const BADGE_MAP = {
  ledger: "boq",
  procurement: "quotations",
  calendar: "calendar",
};

// One line under each tile so new team members know where things live.
const APP_BLURB = {
  projects: "Workspaces & planner",
  design_studio: "Drawings & revisions",
  crm: "Leads to contract",
  ledger: "BOQs, budgets, payments",
  siteOperations: "Reports, QC, RFIs",
  procurement: "Vendors to delivery",
  inventory: "Site stock",
  tasks: "Your to-dos",
  calendar: "Visits & meetings",
  commandCenter: "Live portfolio view",
  adminConsole: "Users, roles, setup",
  automation: "Rules & escalations",
};

function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [badges, setBadges] = useState({});

  useEffect(() => {
    api
      .get("/v1/dashboard/app-badges")
      .then((r) => setBadges(r.data || {}))
      .catch(() => {});
  }, []);

  const firstName = (user?.name || "").split(" ")[0];
  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    [],
  );

  return (
    <div className="inos-launcher" data-testid="landing-page">
      <header className="inos-launcher__bar" data-testid="landing-header" style={{ borderBottom: 0 }}>
        <button onClick={() => navigate("/dashboard")} data-testid="rippotai-logo" className="flex items-center gap-3">
          <img src="/rippotai_logo.png" alt="Rippotai" className="h-9 w-auto object-contain" />
          <span className="hidden sm:inline text-[15px] font-bold tracking-tight" style={{ color: "var(--text)" }}>
            INOS
          </span>
        </button>
        <div className="flex items-center gap-2">
          <NotificationsBell />
          <UserMenu />
        </div>
      </header>

      <main className="inos-launcher__main">
        <div className="inos-launcher__hello">
          <span className="inos-eyebrow" style={{ justifyContent: "center" }}>
            {today}
          </span>
          <h1>
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p>Pick up where you left off.</p>
        </div>

        <nav data-testid="app-grid" className="inos-launcher__grid" aria-label="Apps">
          {LANDING_ORDER.map((key) => {
            const Icon = MODULE_ICONS[key];
            const meta = APP_META[key];
            const bkey = BADGE_MAP[key];
            const badge = bkey ? badges[bkey] || 0 : 0;
            return (
              <button
                key={key}
                type="button"
                data-testid={`app-card-${key}`}
                onClick={() => navigate(meta.base)}
                className="inos-app"
              >
                <span className="inos-app__tile">
                  <div>
                    <Icon />
                  </div>
                  {badge > 0 && (
                    <span data-testid={`app-badge-${key}`} className="inos-app__badge">
                      {badge}
                    </span>
                  )}
                </span>
                <span data-testid={`app-label-${key}`} className="inos-app__name">
                  {meta.name}
                </span>
                {APP_BLURB[key] && <span className="inos-app__desc">{APP_BLURB[key]}</span>}
              </button>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
