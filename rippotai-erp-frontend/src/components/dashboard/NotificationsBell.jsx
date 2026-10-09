import React from "react";
import { toast } from "sonner";
import {
  notificationDestination,
  notificationGroup,
} from "@/lib/notifications";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { useNavigate } from "react-router-dom";
import { Bell, Trash2 } from "lucide-react";
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
  useDeleteNotificationMutation,
  useDeleteUserNotificationsMutation,
} from "../../api/engagement/notification.api";

export default function NotificationsBell() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [preferences] = useNotificationPreferences(user?.id);
  const {
    currentData: inbox = [],
    isLoading,
    isError,
    refetch,
  } = useGetUserNotificationsQuery(
    { userId: user?.id },
    {
      skip: !user?.id,
      pollingInterval: 15000,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      refetchOnMountOrArgChange: true,
    },
  );
  const notifications = inbox.filter(
    (n) => preferences[notificationGroup(n)] !== false,
  );

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [deleteUserNotifications] = useDeleteUserNotificationsMutation();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) await markAsRead(notification.id).unwrap();
    } catch {
      toast.error("Could not mark notification as read");
    }
    const destination = notificationDestination(notification);
    if (destination) navigate(destination);
  };

  const handleDeleteNotification = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await deleteNotification(id).unwrap();
    } catch {
      toast.error("Could not delete notification");
    }
  };

  const handleClearAll = async () => {
    if (!user?.id) return;

    try {
      await deleteUserNotifications(user.id).unwrap();
    } catch {
      toast.error("Could not clear notifications");
    }
  };

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && user?.id) refetch();
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          data-testid="topbar-notifications"
          className="relative w-11 h-11 rounded-full flex items-center justify-center hover:bg-[#F4F6F7]"
          aria-label="Notifications"
        >
          <Bell
            size={20}
            style={{
              color: "#1F453B",
            }}
          />

          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center"
              style={{
                background: "#1F453B",
                color: "#fff",
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] max-w-[92vw] border-0 p-1"
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

          <div className="flex items-center gap-2">
            <span
              className="text-[12px]"
              style={{
                color: "#6B7B7C",
              }}
            >
              {unreadCount} unread
            </span>

            {unreadCount > 0 && (
              <button
                className="text-[11px] font-semibold"
                style={{
                  color: "#1F453B",
                }}
                onClick={async () => {
                  try {
                    await markAllAsRead(user.id).unwrap();
                  } catch {
                    toast.error("Could not mark notifications as read");
                  }
                }}
              >
                Mark all read
              </button>
            )}

            {notifications.length > 0 && (
              <button
                className="text-[11px] font-semibold text-red-600"
                onClick={handleClearAll}
              >
                Clear all
              </button>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <div
          style={{
            maxHeight: 480,
            overflowY: "auto",
          }}
        >
          {isLoading && (
            <div className="p-4 text-sm">Loading notifications…</div>
          )}
          {isError && (
            <button className="p-4 text-sm" onClick={() => refetch()}>
              Could not load notifications. Retry
            </button>
          )}
          {!isLoading && !isError && notifications.length === 0 && (
            <div
              className="py-6 text-center text-[13px]"
              style={{
                color: "#6B7B7C",
              }}
            >
              No notifications
            </div>
          )}

          {notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              data-testid={`notification-${notification.id}`}
              className="flex items-start justify-between gap-3 py-3 px-3 cursor-pointer"
              onSelect={() => handleNotificationClick(notification)}
            >
              <div className="flex-1 min-w-0">
                <div
                  className="flex items-center gap-2 font-semibold text-[14px]"
                  style={{
                    color: "#333",
                  }}
                >
                  {!notification.is_read && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        background: "#1F453B",
                      }}
                    />
                  )}

                  <span className="truncate">{notification.title}</span>
                </div>

                <div
                  className="text-[13px] mt-1 line-clamp-2"
                  style={{
                    color: "#6B7B7C",
                  }}
                >
                  {notification.message}
                </div>
                {notification.created_at && (
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={notification.created_at}
                  >
                    {new Date(notification.created_at).toLocaleString()}
                  </time>
                )}
              </div>

              <button
                onClick={(e) => handleDeleteNotification(e, notification.id)}
                className="p-1 rounded hover:bg-red-50 transition"
                title="Delete Notification"
              >
                <Trash2 size={16} className="text-red-500 hover:text-red-600" />
              </button>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
