import Login from "@/pages/Login";
import Register from "@/pages/Register";
import SignUp from "@/pages/SignUp";
import ForgotPassword from "../../pages/ForgotPassword";
import ResetPassword from "../../pages/ResetPassword";
import NoAccess from "../../pages/NoAccess";
import RequirePortalAccess from "../../pages/RequirePortalAccess";

export const authRoutes = [
  { type: "public", path: "/login", element: <Login /> },
  { type: "public", path: "/register", element: <Register /> },
  { type: "public", path: "/signup", element: <SignUp /> },
  { type: "public", path: "/forgot-password", element: <ForgotPassword /> },
  { type: "public", path: "/reset-password", element: <ResetPassword /> },
  { type: "public", path: "/no-access", element: <RequirePortalAccess /> },
];
