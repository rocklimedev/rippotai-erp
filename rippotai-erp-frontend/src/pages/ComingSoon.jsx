import React from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { APP_ICONS } from "@/components/dashboard/AppIcons";
import { APP_META, sectionNameFor } from "@/config/appNav";

export default function ComingSoon(props) {
  const navigate = useNavigate();
  const location = useLocation();

  // Legacy prop mode
  if (props.title && !props.appKey) {
    const Icon = APP_ICONS[props.appKey] || null;
    return (
      <div
        data-testid={`coming-soon-${props.title?.toLowerCase().replace(/\s+/g, "-")}`}
        className="min-h-[60vh] flex items-center justify-center"
      >
        <div className="bg-white rounded-2xl border border-[#B5C4B6]/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-10 max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-[#333333] tracking-tight">
            {props.title}
          </h1>
          <p className="text-[13.5px] text-[#6B7B7C] mt-2">
            {props.description || "Coming soon."}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold hover:opacity-90"
          >
            <ArrowLeft size={15} /> Back to All Apps
          </button>
        </div>
      </div>
    );
  }

  // Auto-resolve from route
  const parts = location.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const appKey = props.appKey || parts[0];
  const slug = parts.slice(1).join("/");
  const meta = APP_META[appKey];
  const Icon = APP_ICONS[appKey];
  const sectionName = props.sectionName || sectionNameFor(appKey, slug);
  const base = meta?.base || "/";

  return (
    <div
      data-testid={`coming-soon-${appKey}-${slug || "root"}`}
      className="min-h-[60vh] flex items-center justify-center"
    >
      <div className="bg-white rounded-2xl border border-[#B5C4B6]/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-10 max-w-lg w-full text-center">
        {Icon && (
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-[#B5C4B6]/50 shadow-[0_2px_6px_rgba(0,0,0,0.06)] flex items-center justify-center mb-5">
            <div style={{ width: 44, height: 44 }}>
              <Icon />
            </div>
          </div>
        )}
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1">
          {meta?.name || "INOS"}
        </div>
        <h1 className="text-2xl font-bold text-[#333333] tracking-tight">
          {sectionName}
        </h1>
        <p className="text-[13.5px] text-[#6B7B7C] mt-2">
          This section is being prepared. Check back shortly.
        </p>
        <button
          data-testid="coming-soon-back-btn"
          onClick={() => navigate(base)}
          className="mt-6 inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold hover:opacity-90"
        >
          <ArrowLeft size={15} /> Back to {meta?.name || "Dashboard"}
        </button>
      </div>
    </div>
  );
}
