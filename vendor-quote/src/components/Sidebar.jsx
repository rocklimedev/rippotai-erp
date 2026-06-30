import React from "react";
import { Link } from "react-router-dom";
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
  Plus,
  CheckCircle,
  RotateCcw,
  XCircle,
} from "lucide-react";

export const NAV_ITEMS = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  {
    label: "Quotations",
    icon: FileText,
    children: [
      { path: "/quotations", label: "All Quotations" },
      { path: "/quotations/create", label: "Create Quotation", icon: Plus },
      { path: "/quotations?status=submitted", label: "Pending Approval" },
      { path: "/quotations?status=resubmitted", label: "Resubmitted" },
      { path: "/quotations?status=returned", label: "Returned" },
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

export const NOTIF_ICONS = {
  quotation_submitted: <Bell className="w-4 h-4 text-yellow-500" />,
  quotation_approved: <CheckCircle className="w-4 h-4 text-green-500" />,
  quotation_returned: <RotateCcw className="w-4 h-4 text-blue-500" />,
  quotation_declined: <XCircle className="w-4 h-4 text-red-500" />,
};

export const SidebarContent = ({
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
      <div className="w-8 h-8 bg-[#1A3C34] rounded-md flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-white" />
      </div>
      {sidebarOpen && (
        <div>
          <div className="text-sm font-bold text-[#333333] leading-tight">
            RIPPOTAI ERP
          </div>
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
                    ? "text-[#1A3C34]"
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
                          ? "text-[#1A3C34] bg-[#E8F0EE]"
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
                ? "text-[#1A3C34] bg-[#E8F0EE]"
                : "text-gray-600 hover:text-[#333333] hover:bg-gray-100"
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  </div>
);

export default SidebarContent;
