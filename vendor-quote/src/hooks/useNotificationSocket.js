import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { connectSocket, disconnectSocket } from "../lib/socket";
import { notificationsApi } from "../api/notification.api"; // adjust path to your actual file

/**
 * Connects to the notifications socket for the given user and
 * invalidates the RTK Query cache whenever a new notification arrives,
 * so the bell/list refetch automatically without polling.
 */
export const useNotificationSocket = (userId) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userId) return;

    const socket = connectSocket(userId);

    const handleNotification = () => {
      dispatch(notificationsApi.util.invalidateTags(["Notifications"]));
    };

    socket.on("notification", handleNotification);
    socket.on("connect_error", (err) => {
      console.error("Notification socket connect error:", err.message);
    });

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [userId, dispatch]);

  // Disconnect fully on logout / unmount of the whole app tree
  useEffect(() => {
    return () => {
      if (!userId) disconnectSocket();
    };
  }, [userId]);
};
