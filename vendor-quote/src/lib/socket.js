import { io } from "socket.io-client";
import { API_URL } from "./config";

let socket = null;

export const connectSocket = (userId) => {
  if (!userId) return null;

  // Already connected as this user — reuse it
  if (socket?.connected && socket.auth?.userId === userId) {
    return socket;
  }

  // Different user or stale connection — tear down first
  if (socket) {
    socket.disconnect();
  }

  socket = io(`${API_URL}/notifications`, {
    auth: { userId },
    transports: ["websocket"],
    autoConnect: true,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
