import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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
} from "../api/notification.api"; // adjust import path to wherever this file lives

export default function NotificationsBell() {
  const nav = useNavigate();
  const { user } = useAuth();

  const { data: n = [] } = useGetUserNotificationsQuery(
    { userId: user?.id },
    { skip: !user?.id },
  );
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

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
          <div className="flex items-center gap-2">
            <span className="text-[12px] shrink-0" style={{ color: "#6B7B7C" }}>
              {unread} unread
            </span>
            {unread > 0 && (
              <button
                data-testid="notif-mark-all-read"
                className="text-[11.5px] font-semibold shrink-0"
                style={{ color: "#1F453B" }}
                onClick={() => user?.id && markAllAsRead(user.id)}
              >
                Mark all read
              </button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
          {n.map((it) => (
            <DropdownMenuItem
              key={it.id}
              data-testid={`notif-item-${it.id}`}
              onSelect={() => {
                if (it.unread) markAsRead(it.id);
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
