import React from "react";
import { Outlet } from "react-router-dom";

// ======================
// NO AUTH LAYOUT
// Public pages — no authentication required
// ======================
export default function NoAuthLayout() {
  return (
    <div className="min-h-screen bg-page">
      <Outlet />
    </div>
  );
}
