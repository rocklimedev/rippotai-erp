import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const GREEN = "#1F453B";
const TEXT = "#333333";
const MUTED = "#6B7B7C";

export default function NoAccess() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isDeactivated = user?.is_active === false;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div
      className="min-h-screen bg-white flex items-center justify-center p-6"
      data-testid="no-access-page"
    >
      <div className="w-full max-w-[420px]">
        <Link to="/" className="block text-center mb-6">
          <span
            className="text-[26px] font-bold tracking-tight"
            style={{ color: GREEN, fontFamily: "Poppins" }}
          >
            INOS
          </span>
        </Link>
        <div className="rounded-2xl border border-[#E8EAF0] p-7 bg-white shadow-sm text-center">
          <h1
            className="text-[22px] font-bold"
            style={{ color: TEXT, fontFamily: "Poppins" }}
          >
            {isDeactivated ? "Account deactivated" : "No portal access"}
          </h1>
          <p
            className="text-[13.5px] mt-2 leading-relaxed"
            style={{ color: MUTED }}
          >
            {isDeactivated
              ? "Your account has been deactivated. If you believe this is a mistake, please contact an administrator."
              : "Your account is signed in, but it doesn't have access to this portal. Contact an administrator if you think this is wrong."}
          </p>

          <button
            data-testid="no-access-logout"
            type="button"
            onClick={handleLogout}
            className="mt-6 h-11 w-full rounded-lg text-white text-[14px] font-semibold"
            style={{ background: GREEN }}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
