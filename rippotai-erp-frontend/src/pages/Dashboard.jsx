import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, Check } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { MODULE_ICONS } from "@/components/icons/ModuleIcons";
import { APP_META, LANDING_ORDER } from "@/config/appNav";
import { canOpenApp } from "@/lib/permissions";
import GlobalTopBar from "@/components/shell/GlobalTopBar";
import { useRecent } from "@/components/shell/recent";
import { useMyApprovalsCount } from "@/api/doc-flow/approvals.api";
import "../components/shell/shell.css";

const BADGE_MAP = {
  ledger: "boq",
  calendar: "calendar",
};

function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function ContinueWorking() {
  const { user } = useAuth();
  const { project, docs } = useRecent();
  const count = useMyApprovalsCount(!user?.id);
  const recentDocs = docs.slice(0, 3);
  if (!project && !recentDocs.length && count == null) return null;
  return (
    <section className="inos-continue" data-testid="continue-working" aria-label="Continue working">
      <h2>Continue working</h2>
      <div className="inos-continue__chips">
        {project && (
          <Link to={project.to} className="inos-chip" title={project.code ? `${project.code} · ${project.label}` : project.label} data-testid="continue-project">
            <ArrowUpRight size={14} aria-hidden />
            <span>{project.label}</span>
            {project.code && <small>{project.code}</small>}
          </Link>
        )}
        {recentDocs.map((d) => (
          <Link key={d.to} to={d.to} className="inos-chip" title={[d.type, d.label].filter(Boolean).join(" · ")} data-testid="continue-document">
            <ArrowUpRight size={14} aria-hidden />
            <span>{d.code || d.label}</span>
            {d.code && d.code !== d.label ? <small>{d.label}</small> : !d.code && d.type && d.type !== d.label ? <small>{d.type}</small> : null}
          </Link>
        ))}
        {count != null && (
          <Link to="/approvals" className="inos-chip" data-testid="continue-approvals">
            <Check size={14} aria-hidden />
            <span>Pending approvals ({count})</span>
          </Link>
        )}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [badges, setBadges] = useState({});

  useEffect(() => {
    document.title = "Home · INOS";
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
        year: "numeric",
      }),
    [],
  );

  return (
    <div className="inos-launcher" data-testid="landing-page">
      <GlobalTopBar app="dashboard" />

      <main className="inos-launcher__main">
        <div className="inos-launcher__hello">
          <nav className="inos-crumbs" aria-label="Breadcrumb">
            <ol>
              <li>
                <span aria-current="page">Home</span>
              </li>
            </ol>
          </nav>
          <h1>
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p>{today}</p>
        </div>

        <nav data-testid="app-grid" className="inos-launcher__grid" aria-label="Apps">
          {LANDING_ORDER.filter((key) => canOpenApp(user, key)).map((key) => {
            const Icon = MODULE_ICONS[key];
            const meta = APP_META[key];
            const bkey = BADGE_MAP[key];
            const badge = bkey ? badges[bkey] || 0 : 0;
            return (
              <button key={key} type="button" data-testid={`app-card-${key}`} onClick={() => navigate(meta.base)} className="inos-app">
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
              </button>
            );
          })}
        </nav>

        <ContinueWorking />
      </main>
    </div>
  );
}
