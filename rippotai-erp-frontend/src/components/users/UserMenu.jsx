import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserMenu() {
  const { user, logout } = useAuth();

  const nav = useNavigate();

  // ------------------------------------------------------------
  // NORMALIZE ROLE
  //
  // Your application can currently receive role in either form:
  //
  // 1. role: "ADMIN"
  //
  // 2. role: {
  //      id: "...",
  //      name: "ADMIN",
  //      description: "..."
  //    }
  //
  // Never call .replace() directly on user.role.
  // ------------------------------------------------------------
  const roleName =
    typeof user?.role === "string"
      ? user.role
      : user?.role?.name || user?.roleName || "";

  // ------------------------------------------------------------
  // Safe display value
  //
  // ADMIN_PROJECT -> ADMIN PROJECT
  // ADMIN -> ADMIN
  // ------------------------------------------------------------
  const displayRole = roleName
    ? String(roleName).replace(/_/g, " ")
    : "No role assigned";

  // ------------------------------------------------------------
  // Normalize for permission checks.
  //
  // Backend currently returns "ADMIN", while the old frontend
  // was checking for "admin".
  // ------------------------------------------------------------
  const normalizedRole = String(roleName).toUpperCase();

  const isAdmin = normalizedRole === "ADMIN";

  const isSuperAdmin = Boolean(user?.is_super_admin);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="topbar-user"
          className="flex items-center gap-2 h-11 pl-1 pr-3 rounded-full hover:bg-[#F4F6F7]"
        >
          {/* -------------------------------------------------- */}
          {/* AVATAR */}
          {/* -------------------------------------------------- */}

          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[#1F453B] text-white text-[12px] font-semibold">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user?.name || "User"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              (user?.name?.charAt(0) || "?").toUpperCase()
            )}
          </div>

          {/* -------------------------------------------------- */}
          {/* USER NAME + ROLE */}
          {/* -------------------------------------------------- */}

          <div className="text-left hidden lg:block min-w-0 max-w-[160px]">
            <div
              title={user?.name || "User"}
              className="text-[13.5px] font-semibold leading-tight truncate"
              style={{
                color: "#333333",
              }}
            >
              {user?.name || "User"}
            </div>

            <div
              className="text-[11px] capitalize leading-tight truncate"
              style={{
                color: "#6B7B7C",
              }}
            >
              {displayRole}
            </div>
          </div>

          {/* -------------------------------------------------- */}
          {/* DROPDOWN ICON */}
          {/* -------------------------------------------------- */}

          <ChevronDown
            size={14}
            className="shrink-0"
            style={{
              color: "#6B7B7C",
            }}
          />
        </button>
      </DropdownMenuTrigger>

      {/* ------------------------------------------------------ */}
      {/* DROPDOWN CONTENT */}
      {/* ------------------------------------------------------ */}

      <DropdownMenuContent
        align="end"
        className="w-[240px] bc-card border-0 p-1"
      >
        {/* ---------------------------------------------------- */}
        {/* USER INFO */}
        {/* ---------------------------------------------------- */}

        <DropdownMenuLabel className="px-3 py-2 min-w-0">
          <div
            title={user?.name || "User"}
            className="text-[14px] font-semibold truncate"
            style={{
              color: "#333333",
            }}
          >
            {user?.name || "User"}
          </div>

          <div
            className="text-[12px] capitalize truncate"
            style={{
              color: "#6B7B7C",
            }}
          >
            {displayRole}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* ---------------------------------------------------- */}
        {/* ACCOUNT SETTINGS */}
        {/* ---------------------------------------------------- */}

        <DropdownMenuItem
          className="py-2.5 px-3 text-[14px]"
          onClick={() => nav("/settings")}
        >
          <Settings size={15} className="mr-2" />
          Account settings
        </DropdownMenuItem>

        {/* ---------------------------------------------------- */}
        {/* ROLES & PERMISSIONS */}
        {/* ---------------------------------------------------- */}

        {isAdmin &&
          (isSuperAdmin || (user?.plan && user.plan !== "free_trial")) && (
            <DropdownMenuItem
              className="py-2.5 px-3 text-[14px]"
              data-testid="menu-roles-permissions"
              onClick={() => nav("/settings/roles-permissions")}
            >
              <Settings size={15} className="mr-2" />
              Roles &amp; Permissions
            </DropdownMenuItem>
          )}

        <DropdownMenuSeparator />

        {/* ---------------------------------------------------- */}
        {/* LOGOUT */}
        {/* ---------------------------------------------------- */}

        <DropdownMenuItem
          className="py-2.5 px-3 text-[14px]"
          data-testid="topbar-logout"
          onClick={() => {
            logout();
            nav("/login");
          }}
        >
          <LogOut size={15} className="mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
