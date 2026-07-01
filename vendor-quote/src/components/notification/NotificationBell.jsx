import React, { useState } from "react";
import { Bell } from "lucide-react";
import {
  useGetUserNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from "../../api/notification.api";
import { NOTIF_ICONS } from "../Sidebar";
import { useNotificationSocket } from "../../hooks/useNotificationSocket";
import { useAuth } from "../../store/use-auth"; // <-- Import useAuth

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);

  const { user } = useAuth(); // <-- Get authenticated user

  useNotificationSocket(user?.id);

  const { data: notifications = [], isLoading } = useGetUserNotificationsQuery(
    {
      userId: user?.id,
      unreadOnly: false,
    },
    {
      skip: !user?.id,
    },
  );

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E7EB] rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#E5E7EB]">
            <span className="text-sm font-semibold text-[#333333]">
              Notifications
            </span>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead(user.id)}
                className="text-xs text-[#1A3C34] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {isLoading && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              Loading...
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No notifications yet.
            </div>
          )}

          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`flex items-start gap-2 px-4 py-3 border-b border-[#F3F4F6] cursor-pointer hover:bg-gray-50 ${
                notification.is_read ? "bg-white" : "bg-[#F0F7F5]"
              }`}
            >
              <div className="mt-0.5">
                {NOTIF_ICONS[notification.type] ?? (
                  <Bell className="w-4 h-4 text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#333333] truncate">
                  {notification.title}
                </div>

                <div className="text-xs text-gray-500 line-clamp-2">
                  {notification.message}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="text-gray-300 hover:text-red-500 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
