import Login from "@/pages/auth/Login";
import SignupClosed from "@/pages/auth/SignupClosed";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import ForgotPassword from "../../pages/auth/ForgotPassword";
import ResetPassword from "../../pages/auth/ResetPassword";
import NoAccess from "../../pages/auth/NoAccess";
import RequirePortalAccess from "../../pages/auth/RequirePortalAccess";

export const authRoutes = [
  { type: "public", path: "/login", element: <Login /> },
  { type: "public", path: "/register", element: <SignupClosed /> },
  { type: "public", path: "/signup", element: <SignupClosed /> },
  { type: "noauth", path: "/verify-email", element: <VerifyEmail /> },
  { type: "public", path: "/forgot-password", element: <ForgotPassword /> },
  { type: "public", path: "/reset-password", element: <ResetPassword /> },
  { type: "public", path: "/no-access", element: <RequirePortalAccess /> },
];
