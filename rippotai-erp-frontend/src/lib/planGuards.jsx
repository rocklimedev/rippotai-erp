import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const PAID_PLANS = new Set(["studio", "firm", "enterprise", "super_admin"]);
const GREEN = "#1F453B";
const TEXT = "#333333";
const MUTED = "#6B7B7C";

export function useIsPaid() {
  const { user } = useAuth();
  if (!user) return false;
  if (user.is_super_admin) return true;
  return PAID_PLANS.has(user.plan);
}

export function useIsSuperAdmin() {
  const { user } = useAuth();
  return !!(user && user.is_super_admin);
}

export function PaidOnly({ children, fallback = null }) {
  return useIsPaid() ? children : fallback;
}

export function SuperAdminOnly({ children, fallback = null }) {
  return useIsSuperAdmin() ? children : fallback;
}

/**
 * Global upgrade modal, listens for `inos:upgrade-required` events from api.js
 * or from manual `dispatchEvent`. Include once at App root.
 */
export function UpgradeModalHost() {
  const [state, setState] = useState({ open: false, message: "" });
  const nav = useNavigate();
  const paid = useIsPaid();

  useEffect(() => {
    const onEvt = (e) => {
      if (paid) return;
      setState({
        open: true,
        message:
          e.detail?.message ||
          "This is included in Studio, Firm and Enterprise plans.",
      });
    };
    window.addEventListener("inos:upgrade-required", onEvt);
    return () => window.removeEventListener("inos:upgrade-required", onEvt);
  }, [paid]);

  if (!state.open) return null;
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40"
      data-testid="upgrade-modal"
    >
      <div className="bg-white rounded-2xl border border-[#E8EAF0] max-w-[440px] w-full p-7">
        <h2
          className="text-[20px] font-bold"
          style={{ color: TEXT, fontFamily: "Poppins" }}
        >
          Upgrade to unlock this feature
        </h2>
        <p className="mt-2 text-[13.5px]" style={{ color: MUTED }}>
          {state.message}
        </p>
        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={() => setState({ open: false, message: "" })}
            className="h-10 px-4 rounded-lg border border-[#DDD8CE] text-[13.5px] font-semibold"
            style={{ color: TEXT }}
            data-testid="upgrade-dismiss"
          >
            Not now
          </button>
          <button
            onClick={() => {
              setState({ open: false, message: "" });
              nav("/#pricing");
              window.location.href = "/#pricing";
            }}
            className="h-10 px-4 rounded-lg text-white text-[13.5px] font-semibold"
            style={{ background: GREEN }}
            data-testid="upgrade-see-plans"
          >
            See plans
          </button>
        </div>
      </div>
    </div>
  );
}
