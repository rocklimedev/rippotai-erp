import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { MODULE_ICONS } from "@/components/icons/ModuleIcons";
import { APP_META, LANDING_ORDER } from "@/config/appNav";
import {
  useGetUserNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "../api/notification.api"; // <-- adjust path to match your project
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BADGE_MAP = {
  boq: "boq",
  quotations: "quotations",
  calendar: "calendar",
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState({});

  // RTK Query replaces the old useState/useEffect + api.get("/notifications")
  const { data: notifs = [] } = useGetUserNotificationsQuery(
    { userId: user?.id },
    { skip: !user?.id },
  );
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  useEffect(() => {
    api
      .get("/dashboard/app-badges")
      .then((r) => setBadges(r.data || {}))
      .catch(() => {});
  }, []);

  const unread = notifs.filter((n) => n.unread).length;

  const handleNotifSelect = (n) => {
    if (n.unread) {
      markAsRead(n.id);
    }
    if (n.link_url) navigate(n.link_url);
  };

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="landing-notifications-btn"
                className="relative w-11 h-11 rounded-full flex items-center justify-center bc-card"
                style={{ padding: 0 }}
              >
                <Bell size={22} style={{ color: "#1F453B" }} />
                {unread > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center"
                    style={{ background: "#1F453B", color: "#FFF" }}
                  >
                    {unread}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[360px] bc-card border-0 p-1"
            >
              <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
                <span
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: 15,
                  }}
                >
                  Notifications
                </span>
                <span className="text-[12px]" style={{ color: "#6B7B7C" }}>
                  {unread} unread
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifs.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  data-testid={`notif-item-${n.id}`}
                  onSelect={() => handleNotifSelect(n)}
                  className="flex flex-col items-start gap-0.5 py-2 px-3 cursor-pointer"
                >
                  <div
                    className="text-[14px] font-semibold"
                    style={{ color: "#333333" }}
                  >
                    {n.title}
                  </div>
                  <div className="text-[13px]" style={{ color: "#6B7B7C" }}>
                    {n.body}
                  </div>
                </DropdownMenuItem>
              ))}
              {notifs.length === 0 && (
                <div
                  className="py-6 text-center text-[13px]"
                  style={{ color: "#6B7B7C" }}
                >
                  No notifications yet
                </div>
              )}
              <DropdownMenuSeparator />
              <div
                className="px-3 py-2 text-[13px] font-semibold cursor-pointer"
                style={{ color: "#333333" }}
                onClick={() => markAllAsRead(user?.id)}
              >
                Mark all as read
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="landing-user-menu-btn"
                className="flex items-center gap-2 h-11 pl-1 pr-3 rounded-full bc-card"
              >
                <div
                  className="w-8 h-8 rounded-full text-[12px] font-semibold flex items-center justify-center"
                  style={{ background: "#1F453B", color: "#FFF" }}
                >
                  {user?.avatar_initials || "?"}
                </div>
                <div className="text-left hidden sm:block">
                  <div
                    className="text-[14px] font-semibold leading-tight"
                    style={{ color: "#333333" }}
                  >
                    {user?.name}
                  </div>
                  <div
                    className="text-[11.5px] capitalize leading-tight"
                    style={{ color: "#6B7B7C" }}
                  >
                    {user?.role?.replace("_", " ")}
                  </div>
                </div>
                <ChevronDown size={15} style={{ color: "#6B7B7C" }} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[240px] bc-card border-0 p-1"
            >
              <DropdownMenuLabel className="px-3 py-2">
                <div
                  className="text-[14px] font-semibold"
                  style={{ color: "#333333" }}
                >
                  {user?.name}
                </div>
                <div
                  className="text-[12px] capitalize"
                  style={{ color: "#6B7B7C" }}
                >
                  {user?.role?.replace("_", " ")}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="py-2.5 px-3 text-[14px]">
                <Settings size={15} className="mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="py-2.5 px-3 text-[14px]"
                onClick={() => navigate("/settings")}
              >
                <Settings size={15} className="mr-2" /> Account settings
              </DropdownMenuItem>
              {user?.role === "admin" &&
                (user?.is_super_admin ||
                  (user?.plan && user.plan !== "free_trial")) && (
                  <DropdownMenuItem
                    className="py-2.5 px-3 text-[14px]"
                    data-testid="menu-roles-permissions"
                    onClick={() => navigate("/settings/roles-permissions")}
                  >
                    <Settings size={15} className="mr-2" /> Roles &amp;
                    Permissions
                  </DropdownMenuItem>
                )}
              {user?.is_super_admin && (
                <DropdownMenuItem
                  className="py-2.5 px-3 text-[14px]"
                  data-testid="menu-super-admin"
                  onClick={() => navigate("/settings/super-admin")}
                >
                  <Settings size={15} className="mr-2" /> Super Admin Console
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="py-2.5 px-3 text-[14px]"
                data-testid="landing-logout-btn"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                <LogOut size={15} className="mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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