import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import SignUp from "@/pages/auth/SignUp";
import ForgotPassword from "../../pages/auth/ForgotPassword";
import ResetPassword from "../../pages/auth/ResetPassword";
import NoAccess from "../../pages/auth/NoAccess";
import RequirePortalAccess from "../../pages/auth/RequirePortalAccess";

export const authRoutes = [
  { type: "public", path: "/login", element: <Login /> },
  { type: "public", path: "/register", element: <Register /> },
  { type: "public", path: "/signup", element: <SignUp /> },
  { type: "public", path: "/forgot-password", element: <ForgotPassword /> },
  { type: "public", path: "/reset-password", element: <ResetPassword /> },
  { type: "public", path: "/no-access", element: <RequirePortalAccess /> },
];
