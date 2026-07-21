import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings as SettingsIcon,
  Search,
  User,
  Users as UsersIcon,
  Shield,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  useGetUserNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "../api/notification.api"; // Adjust path if needed

import api from "@/lib/api";

// ====================== SIDEBAR ITEMS (route-based) ======================
const sidebarItems = [
  { to: "/settings", end: true, label: "Edit Profile", icon: User },
  { to: "/settings/security", label: "Security", icon: Shield },
  { to: "/settings/notifications", label: "Notifications", icon: Bell },
  { to: "/settings/billing", label: "Billing", icon: CreditCard },
  {
    to: "/settings/estimate-signature",
    label: "Estimate Signature",
    icon: CreditCard,
  },
  { to: "/settings/users", label: "Users", icon: UsersIcon },
  {
    to: "/settings/roles-permissions",
    label: "Roles & Permissions",
    icon: Shield,
  },
  { to: "/settings/super-admin", label: "Super Admin", icon: ShieldCheck },
];

// ====================== SETTINGS TOP HEADER ======================

function SettingsTopHeader() {
  const nav = useNavigate();
  const { user } = useAuth();

  // Contextual Search (Settings)
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!q || q.length < 2) {
      setData(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(q)}&limit=5`);
        setData(res.data);
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

  // Notifications
  const { data: n = [] } = useGetUserNotificationsQuery(
    { userId: user?.id },
    { skip: !user?.id },
  );
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const unread = n.filter((x) => x.unread).length;

  return (
    <header
      className="sticky top-0 z-30 h-16 bg-white flex items-center gap-2 px-4 lg:px-6"
      style={{ boxShadow: "0 4px 12px rgba(15,31,26,0.06)" }}
    >
      {/* Logo / Title */}
      <button
        onClick={() => nav("/dashboard")}
        className="flex items-center gap-2 shrink-0 pr-3 border-r border-[rgba(31,69,59,0.10)] mr-2 h-9"
      >
        <span className="text-2xl">⚙️</span>
        <div
          className="hidden md:block text-[17px] font-semibold"
          style={{ color: "#333333" }}
        >
          Settings
        </div>
      </button>

      <div className="flex-1" />

      {/* Search Bar */}
      <div className="relative flex-1 max-w-[360px]">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "#6B7B7C" }}
        />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => q.length >= 2 && setOpen(true)}
          placeholder="Search settings..."
          className="bc-input pl-9 w-full"
          style={{ minHeight: 40 }}
        />
      </div>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
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
            {unread > 0 && (
              <button
                className="text-[11.5px] font-semibold"
                style={{ color: "#1F453B" }}
                onClick={() => user?.id && markAllAsRead(user.id)}
              >
                Mark all read
              </button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div style={{ maxHeight: 480, overflowY: "auto" }}>
            {n.map((it) => (
              <DropdownMenuItem
                key={it.id}
                onSelect={() => {
                  if (it.unread) markAsRead(it.id);
                  if (it.link_url) nav(it.link_url);
                }}
                className="flex flex-col items-start gap-0.5 py-2 px-3 cursor-pointer"
              >
                <div
                  className="text-[14px] font-semibold truncate"
                  style={{ color: "#333333" }}
                >
                  {it.title}
                </div>
                <div
                  className="text-[13px] line-clamp-2"
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

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 h-11 pl-1 pr-3 rounded-full hover:bg-[#F4F6F7]">
            <div
              className="w-8 h-8 rounded-full text-[12px] font-semibold flex items-center justify-center"
              style={{ background: "#1F453B", color: "#FFF" }}
            >
              {user?.avatar_initials || "?"}
            </div>
            <div className="text-left hidden lg:block min-w-0 max-w-[160px]">
              <div
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
            <ChevronDown size={14} style={{ color: "#6B7B7C" }} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[240px] bc-card border-0 p-1"
        >
          <DropdownMenuLabel className="px-3 py-2">
            <div
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
          <DropdownMenuItem onClick={() => nav("/settings")}>
            <SettingsIcon size={15} className="mr-2" /> Account Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              // logout logic
              nav("/login");
            }}
          >
            <LogOut size={15} className="mr-2" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

// ====================== SETTINGS SIDEBAR ======================

function SettingsSidebar() {
  return (
    <div className="lg:col-span-3">
      <div className="bg-white border border-[rgba(31,69,59,0.14)] rounded-3xl p-2 shadow-sm sticky top-6">
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${
                    isActive
                      ? "bg-[#1F453B] text-white"
                      : "hover:bg-[#F4F6F7] text-[#1F453B]"
                  }`
                }
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

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
      <SettingsTopHeader />
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
            <SettingsSidebar />

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
