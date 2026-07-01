import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/use-auth";
import { ChevronDown, Bell, LogOut, Menu, X } from "lucide-react";

import {
  useGetUserNotificationsQuery,
  useMarkAllAsReadMutation,
} from "../api/notification.api";
import { useNotificationSocket } from "../hooks/useNotificationSocket";

import { NAV_ITEMS, NOTIF_ICONS, SidebarContent } from "./Sidebar";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({
    Quotations: true,
  });
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notifRef = useRef(null);
  const userRef = useRef(null);

  // Real-time push: invalidates the notifications cache whenever
  // the server emits a new one, so the badge/list update instantly
  // instead of waiting for the next poll.
  useNotificationSocket(user?.id);

  // RTK Query Notifications — polling kept as a fallback in case the
  // socket drops (flaky network, tab backgrounded, etc). Bumped to 60s
  // since the socket now handles the real-time case.
  const { data: notifData } = useGetUserNotificationsQuery(
    { userId: user?.id || "", unreadOnly: false },
    { skip: !user?.id, pollingInterval: 60000 },
  );

  const [markAllAsRead] = useMarkAllAsReadMutation();

  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unread_count || 0;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout(true);
  };

  const isActive = (path) => {
    if (path.includes("?")) {
      const [base, query] = path.split("?");
      return location.pathname === base && location.search === `?${query}`;
    }
    return location.pathname === path;
  };

  const toggleExpand = (label) => {
    setExpandedItems((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const navItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === "ADMIN",
  );

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-[#E5E7EB] transition-all duration-200 flex-shrink-0 ${
          sidebarCollapsed ? "w-16" : "w-56"
        }`}
      >
        <SidebarContent
          sidebarOpen={!sidebarCollapsed}
          expandedItems={expandedItems}
          toggleExpand={toggleExpand}
          isActive={isActive}
          navItems={navItems}
          user={user}
        />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 w-64 bg-white h-full overflow-y-auto border-r border-[#E5E7EB]">
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <SidebarContent
              sidebarOpen={true}
              expandedItems={expandedItems}
              toggleExpand={toggleExpand}
              isActive={isActive}
              navItems={navItems}
              user={user}
              onLinkClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:block p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 rounded-md hover:bg-gray-100 text-gray-500 relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#1A3C34] text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#E5E7EB] rounded-md shadow-lg z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="font-semibold text-[#333333]">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={async () => {
                          if (user?.id) await markAllAsRead(user.id);
                        }}
                        className="text-xs text-[#1A3C34] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (n.quotation_id) {
                              navigate(`/quotations/${n.quotation_id}`);
                            }
                            setNotifOpen(false);
                          }}
                          className={`flex gap-3 px-4 py-3 border-b hover:bg-gray-50 cursor-pointer ${
                            !n.is_read ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="mt-0.5">
                            {NOTIF_ICONS[n.type] || (
                              <Bell className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#333333] truncate">
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                              {n.message}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {n.created_at}
                            </p>
                          </div>
                          {!n.is_read && (
                            <div className="w-2 h-2 rounded-full bg-[#1A3C34] mt-2" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div ref={userRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-[#1A3C34] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-[#333333] leading-tight">
                    {user?.name}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#E5E7EB] rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-3 border-b">
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#1A3C34]"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
