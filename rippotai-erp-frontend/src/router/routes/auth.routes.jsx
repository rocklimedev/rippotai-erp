import Login from "@/pages/Login";
import Register from "@/pages/Register";
import SignUp from "@/pages/SignUp";

export const authRoutes = [
  { type: "public", path: "/login", element: <Login /> },
  { type: "public", path: "/register", element: <Register /> },
  { type: "public", path: "/signup", element: <SignUp /> },
];
