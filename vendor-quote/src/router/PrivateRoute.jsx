import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../store/use-auth";
const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-sm text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly && user.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;
