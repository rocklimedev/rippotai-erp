import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/use-auth";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Users,
  BarChart2,
  ClipboardList,
  Settings,
  ChevronDown,
  ChevronRight,
  Bell,
  LogOut,
  Menu,
  X,
  Plus,
  CheckCircle,
  RotateCcw,
  XCircle,
} from "lucide-react";

import {
  useGetUserNotificationsQuery,
  useMarkAllAsReadMutation,
} from "../api/notification.api";

const NAV_ITEMS = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  {
    label: "Quotations",
    icon: FileText,
    children: [
      { path: "/quotations", label: "All Quotations" },
      { path: "/quotations/create", label: "Create Quotation", icon: Plus },
      { path: "/quotations?status=submitted", label: "Pending Approval" },
      { path: "/quotations?status=returned_for_editing", label: "Returned" },
      { path: "/quotations?status=approved", label: "Approved" },
      { path: "/quotations?status=declined", label: "Declined" },
    ],
  },
  { path: "/projects", icon: FolderOpen, label: "Projects" },
  { path: "/vendors", icon: Users, label: "Vendors" },
  { path: "/reports", icon: BarChart2, label: "Reports" },
  {
    path: "/activity-logs",
    icon: ClipboardList,
    label: "Activity Logs",
    adminOnly: true,
  },
  { path: "/settings", icon: Settings, label: "Settings", adminOnly: true },
];

const NOTIF_ICONS = {
  quotation_submitted: <Bell className="w-4 h-4 text-yellow-500" />,
  quotation_approved: <CheckCircle className="w-4 h-4 text-green-500" />,
  quotation_returned: <RotateCcw className="w-4 h-4 text-blue-500" />,
  quotation_declined: <XCircle className="w-4 h-4 text-red-500" />,
};

const SidebarContent = ({
  sidebarOpen,
  expandedItems,
  toggleExpand,
  isActive,
  navItems,
  user,
  onLinkClick,
}) => (
  <div className="flex flex-col h-full">
    {/* Logo */}
    <div className="flex items-center gap-3 px-4 py-4 border-b border-[#E5E7EB]">
      <div className="w-8 h-8 bg-[#E31E24] rounded-md flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-white" />
      </div>
      {sidebarOpen && (
        <div>
          <div className="text-sm font-bold text-[#333333] leading-tight">
            Quotation
          </div>
          <div className="text-xs text-gray-500 leading-tight">Management</div>
        </div>
      )}
    </div>

    {/* Navigation */}
    <nav className="flex-1 overflow-y-auto py-3 px-2">
      {navItems.map((item) => {
        if (item.children) {
          const isExpanded = expandedItems[item.label] ?? true;
          const hasActive = item.children.some((c) => isActive(c.path));

          return (
            <div key={item.label} className="mb-0.5">
              <button
                onClick={() => toggleExpand(item.label)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  hasActive
                    ? "text-[#E31E24]"
                    : "text-gray-600 hover:text-[#333333] hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </>
                )}
              </button>

              {sidebarOpen && isExpanded && (
                <div className="mt-0.5 ml-6 pl-2 border-l border-[#E5E7EB]">
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      onClick={onLinkClick}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isActive(child.path)
                          ? "text-[#E31E24] bg-red-50"
                          : "text-gray-500 hover:text-[#333333] hover:bg-gray-100"
                      }`}
                    >
                      {child.icon && <child.icon className="w-3.5 h-3.5" />}
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onLinkClick}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors mb-0.5 ${
              isActive(item.path)
                ? "text-[#E31E24] bg-red-50"
                : "text-gray-600 hover:text-[#333333] hover:bg-gray-100"
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>

    {/* User Info */}
    {sidebarOpen && user && (
      <div className="px-4 py-3 border-t border-[#E5E7EB]">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {user.role}
        </div>
        <div className="text-sm font-medium text-[#333333] mt-0.5 truncate">
          {user.name}
        </div>
      </div>
    )}
  </div>
);

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

  // RTK Query Notifications
  const { data: notifData } = useGetUserNotificationsQuery(
    { userId: user?.id || "", unreadOnly: false },
    { skip: !user?.id, pollingInterval: 30000 },
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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
            {/* Desktop Collapse Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:block p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Menu Button */}
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
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E31E24] text-white text-[10px] rounded-full flex items-center justify-center font-medium">
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
                        className="text-xs text-[#E31E24] hover:underline"
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
                            <div className="w-2 h-2 rounded-full bg-[#E31E24] mt-2" />
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
                <div className="w-8 h-8 bg-[#E31E24] rounded-full flex items-center justify-center text-white text-sm font-semibold">
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
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-600"
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
