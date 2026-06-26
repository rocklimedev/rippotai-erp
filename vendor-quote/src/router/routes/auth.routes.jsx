// src/router/authRoutes.js
import Login from "../../concepts/auth/Login";
export const authRoutes = [
  {
    path: "/login",
    name: "Login",
    isSidebarActive: false,
    element: <Login />,
  },
];
