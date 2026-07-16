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
