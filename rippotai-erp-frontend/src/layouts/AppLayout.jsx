import React, { useEffect, useState } from "react";
import {
  Outlet,
  Link,
  useNavigate,
  useLocation,
  NavLink,
} from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  LayoutGrid,
  Search,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { MODULE_ICONS } from "@/components/icons/ModuleIcons";
import { APP_META, APP_MENUS, LANDING_ORDER } from "@/config/appNav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/* ---- App Switcher (4-cube) ---- */
function AppSwitcher({ currentApp }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          data-testid="app-switcher-btn"
          className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-[#F4F6F7] transition-colors"
          aria-label="Switch app"
        >
          <LayoutGrid size={20} style={{ color: "#1F453B" }} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[440px] p-3 bc-card border-0">
        <div className="eyebrow px-2 pb-2">Apps</div>
        <div className="grid grid-cols-5 gap-2">
          {LANDING_ORDER.map((k) => {
            const Icon = MODULE_ICONS[k];
            const meta = APP_META[k];
            const active = k === currentApp;
            return (
              <button
                key={k}
                data-testid={`app-switcher-item-${k}`}
                onClick={() => {
                  setOpen(false);
                  nav(meta.base);
                }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#F4F6F7] transition-colors"
                style={{
                  border: active
                    ? "2px solid #1F453B"
                    : "2px solid transparent",
                  background: active ? "#D8E0DA" : "transparent",
                }}
              >
                <div
                  className="w-[64px] h-[64px] rounded-xl bg-white flex items-center justify-center"
                  style={{ boxShadow: "0 3px 10px rgba(15,31,26,0.08)" }}
                >
                  <div style={{ width: 50, height: 50 }}>
                    <Icon />
                  </div>
                </div>
                <div
                  className="text-[12px] font-semibold w-full text-center truncate"
                  style={{ color: "#1F453B" }}
                >
                  {meta.name}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-2 pt-2 border-t border-[rgba(31,69,59,0.10)]">
          <button
            data-testid="app-switcher-back-btn"
            onClick={() => {
              setOpen(false);
              nav("/dashboard");
            }}
            className="w-full h-10 rounded-lg text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#F4F6F7]"
            style={{ color: "#1F453B" }}
          >
            <ArrowLeft size={15} /> Back to All Apps
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ---- Menu Dropdown (per-app group) ---- */
function MenuDropdown({ app, label, items }) {
  const nav = useNavigate();
  const location = useLocation();
  const base = APP_META[app].base;
  const [open, setOpen] = useState(false);

  const onPick = (slug) => {
    setOpen(false);
    if (slug === "edit-dashboard") {
      nav(`${base}?edit=1`);
    } else if (slug && slug.startsWith("/")) {
      nav(slug); // absolute cross-app link (e.g. Projects)
    } else {
      nav(`${base}/${slug}`);
    }
  };
  const currentPath = location.pathname;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          data-testid={`menu-${app}-${label.toLowerCase()}`}
          className="h-9 px-3 rounded-lg text-[15px] font-semibold flex items-center gap-1 hover:bg-[#F4F6F7]"
          style={{ color: "#1F453B", fontFamily: "Poppins" }}
        >
          {label} <ChevronDown size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[240px] p-1 bc-card border-0">
        {items.map((it) => {
          const path = `${base}/${it.slug}`;
          const active = currentPath === path;
          return (
            <button
              key={it.slug}
              onClick={() => onPick(it.slug)}
              data-testid={`menu-item-${app}-${it.slug}`}
              className={`nav-dropdown-item w-full text-left ${active ? "active" : ""}`}
            >
              {it.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/* ---- Global Search (grouped across BOQs, Projects, Vendors, Estimates, Documents, Tasks) ---- */
function ContextualSearch({ app }) {
  const meta = APP_META[app];
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!q || q.length < 2) {
      setData(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(
          `/search?q=${encodeURIComponent(q)}&limit=5`,
        );
        setData(data);
      } catch {
        setData({});
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const go = (path) => {
    setOpen(false);
    setQ("");
    nav(path);
  };
  const GROUPS = [
    [
      "boqs",
      "BOQs",
      (r) => `/boq/${r.id}`,
      (r) => r.boq_number || r.version,
      (r) => r.project_name,
    ],
    [
      "projects",
      "Projects",
      (r) => `/projects/${r.id}`,
      (r) => r.name,
      (r) => r.client_name || r.location,
    ],
    [
      "vendors",
      "Vendors",
      (r) => `/vendors/${r.id}`,
      (r) => r.name || r.company,
      (r) => r.company || r.primary_category,
    ],
    [
      "quotations",
      "Estimates",
      (r) => `/quotations/${r.id}`,
      (r) => r.quotation_number || r.title,
      (r) => r.project_name || r.vendor_name,
    ],
    [
      "documents",
      "Documents",
      (r) => `/documents/all`,
      (r) => r.title || r.filename,
      (r) => r.project_name || r.category,
    ],
    [
      "tasks",
      "Tasks",
      (r) => `/tasks/all`,
      (r) => r.title,
      (r) => r.project_name || r.assignee_name,
    ],
  ];
  const totalCount =
    data && data.counts
      ? Object.values(data.counts).reduce((a, b) => a + b, 0)
      : 0;

  return (
    <Popover open={open && q.length >= 2} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative flex-1 max-w-[360px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#6B7B7C" }}
          />
          <input
            data-testid={`topbar-search-${app}`}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => q.length >= 2 && setOpen(true)}
            placeholder={meta.searchPh}
            className="bc-input pl-9"
            style={{ minHeight: 40 }}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[420px] max-w-[92vw] p-1 bc-card border-0"
        style={{ maxHeight: 520, overflowY: "auto" }}
      >
        {!data && (
          <div
            className="py-4 text-center text-[13px]"
            style={{ color: "#6B7B7C" }}
          >
            Searching…
          </div>
        )}
        {data && totalCount === 0 && (
          <div
            className="py-4 text-center text-[13px]"
            style={{ color: "#6B7B7C" }}
          >
            No matches for "{q}"
          </div>
        )}
        {data &&
          GROUPS.map(([key, label, hrefFn, titleFn, subFn]) => {
            const rows = data[key] || [];
            if (rows.length === 0) return null;
            const total = data.counts?.[key] ?? rows.length;
            return (
              <div key={key} className="py-1">
                <div
                  className="text-[10.5px] font-bold uppercase tracking-widest px-3 pt-2 pb-1"
                  style={{ color: "#6B7B7C" }}
                >
                  {label} · {total}
                </div>
                {rows.map((r) => (
                  <button
                    key={r.id}
                    data-testid={`search-result-${key}-${r.id}`}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F4F6F7] min-w-0 flex flex-col"
                    onClick={() => go(hrefFn(r))}
                  >
                    <div
                      title={titleFn(r)}
                      className="text-[13.5px] font-semibold truncate"
                      style={{ color: "#333333" }}
                    >
                      {titleFn(r)}
                    </div>
                    <div
                      title={subFn(r) || ""}
                      className="text-[11.5px] truncate"
                      style={{ color: "#6B7B7C" }}
                    >
                      {subFn(r) || "—"}
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
      </PopoverContent>
    </Popover>
  );
}

/* ---- Notifications + User (shared) ---- */
function NotificationsBell() {
  const nav = useNavigate();
  const [n, setN] = useState([]);
useEffect(() => {
  api
    .get("/notifications")
    .then((r) => {
      setN(Array.isArray(r.data) ? r.data : []);
    })
    .catch(() => setN([]));
}, []);
  const unread = n.filter((x) => x.unread).length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="topbar-notifications"
          className="relative w-11 h-11 rounded-full flex items-center justify-center hover:bg-[#F4F6F7]"
          aria-label="Notifications"
        >
          <Bell size={20} style={{ color: "#1F453B" }} />
          {unread > 0 && (
            <span
              className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10.5px] font-semibold flex items-center justify-center"
              style={{ background: "#1F453B", color: "#FFF" }}
            >
              {unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[380px] max-w-[92vw] bc-card border-0 p-1"
      >
        <DropdownMenuLabel className="px-3 py-2 flex items-center justify-between">
          <span
            style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 15 }}
          >
            Notifications
          </span>
          <span className="text-[12px] shrink-0" style={{ color: "#6B7B7C" }}>
            {unread} unread
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
          {n.map((it) => (
            <DropdownMenuItem
              key={it.id}
              data-testid={`notif-item-${it.id}`}
              onSelect={() => {
                setN((prev) =>
                  prev.map((x) =>
                    x.id === it.id ? { ...x, unread: false } : x,
                  ),
                );
                if (it.link_url) nav(it.link_url);
              }}
              className="flex flex-col items-start gap-0.5 py-2 px-3 min-w-0 w-full cursor-pointer"
            >
              <div
                title={it.title}
                className="text-[14px] font-semibold w-full truncate"
                style={{ color: "#333333" }}
              >
                {it.title}
              </div>
              <div
                title={it.body}
                className="text-[13px] w-full line-clamp-2"
                style={{ color: "#6B7B7C" }}
              >
                {it.body}
              </div>
            </DropdownMenuItem>
          ))}
          {n.length === 0 && (
            <div
              className="py-6 text-center text-[13px]"
              style={{ color: "#6B7B7C" }}
            >
              No notifications
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="topbar-user"
          className="flex items-center gap-2 h-11 pl-1 pr-3 rounded-full hover:bg-[#F4F6F7]"
        >
          <div
            className="w-8 h-8 rounded-full text-[12px] font-semibold flex items-center justify-center"
            style={{ background: "#1F453B", color: "#FFF" }}
          >
            {user?.avatar_initials || "?"}
          </div>
          <div className="text-left hidden lg:block min-w-0 max-w-[160px]">
            <div
              title={user?.name}
              className="text-[13.5px] font-semibold leading-tight truncate"
              style={{ color: "#333333" }}
            >
              {user?.name}
            </div>
            <div
              className="text-[11px] capitalize leading-tight truncate"
              style={{ color: "#6B7B7C" }}
            >
              {user?.role?.replace("_", " ")}
            </div>
          </div>
          <ChevronDown
            size={14}
            className="shrink-0"
            style={{ color: "#6B7B7C" }}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[240px] bc-card border-0 p-1"
      >
        <DropdownMenuLabel className="px-3 py-2 min-w-0">
          <div
            title={user?.name}
            className="text-[14px] font-semibold truncate"
            style={{ color: "#333333" }}
          >
            {user?.name}
          </div>
          <div
            className="text-[12px] capitalize truncate"
            style={{ color: "#6B7B7C" }}
          >
            {user?.role?.replace("_", " ")}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="py-2.5 px-3 text-[14px]"
          onClick={() => nav("/settings")}
        >
          <Settings size={15} className="mr-2" /> Account settings
        </DropdownMenuItem>
        {user?.role === "admin" &&
          (user?.is_super_admin ||
            (user?.plan && user.plan !== "free_trial")) && (
            <DropdownMenuItem
              className="py-2.5 px-3 text-[14px]"
              data-testid="menu-roles-permissions"
              onClick={() => nav("/settings/roles-permissions")}
            >
              <Settings size={15} className="mr-2" /> Roles &amp; Permissions
            </DropdownMenuItem>
          )}
        {user?.role === "admin" && (
          <DropdownMenuItem
            className="py-2.5 px-3 text-[14px]"
            data-testid="menu-estimate-signature"
            onClick={() => nav("/settings/estimate-signature")}
          >
            <Settings size={15} className="mr-2" /> Estimate Approval Signature
          </DropdownMenuItem>
        )}
        {user?.is_super_admin && (
          <DropdownMenuItem
            className="py-2.5 px-3 text-[14px]"
            data-testid="menu-super-admin"
            onClick={() => nav("/settings/super-admin")}
          >
            <Settings size={15} className="mr-2" /> Super Admin Console
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="py-2.5 px-3 text-[14px]"
          data-testid="topbar-logout"
          onClick={() => {
            logout();
            nav("/login");
          }}
        >
          <LogOut size={15} className="mr-2" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---- TopHeader ---- */
function TopHeader({ app }) {
  const nav = useNavigate();
  const Icon = MODULE_ICONS[app];
  const meta = APP_META[app];
  const menus = APP_MENUS[app] || [];
  return (
    <header
      data-testid={`topheader-${app}`}
      className="sticky top-0 z-30 h-16 bg-white flex items-center gap-2 px-4 lg:px-6"
      style={{ boxShadow: "0 4px 12px rgba(15,31,26,0.06)" }}
    >
      <AppSwitcher currentApp={app} />
      <button
        onClick={() => nav(meta.base)}
        className="flex items-center gap-2 shrink-0 pr-3 border-r border-[rgba(31,69,59,0.10)] mr-2 h-9"
      >
        <div style={{ width: 28, height: 28 }}>
          <Icon />
        </div>
        <div
          className="hidden md:block text-[17px] font-semibold"
          style={{ color: "#333333", fontFamily: "Poppins" }}
        >
          {meta.name}
        </div>
      </button>
      <nav className="flex items-center gap-1 flex-shrink min-w-0 overflow-hidden">
        {menus.map((g) => (
          <MenuDropdown
            key={g.label}
            app={app}
            label={g.label}
            items={g.items}
          />
        ))}
      </nav>
      <div className="flex-1" />
      <ContextualSearch app={app} />
      <NotificationsBell />
      <UserMenu />
    </header>
  );
}

/* ---- Main AppLayout: only header + main, no sidebar ---- */
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