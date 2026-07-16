import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, ArrowLeft } from "lucide-react";
import { MODULE_ICONS } from "@/components/icons/ModuleIcons";
import { APP_META, LANDING_ORDER } from "@/config/appNav";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function AppSwitcher({ currentApp }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          data-testid="app-switcher-btn"
          className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-[#F4F6F7] transition-colors"
          aria-label="Switch app"
        >
          <LayoutGrid size={20} style={{ color: "#1F453B" }} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[440px] p-3 bc-card border-0">
        <div className="eyebrow px-2 pb-2">Apps</div>
        <div className="grid grid-cols-5 gap-2">
          {LANDING_ORDER.map((k) => {
            const Icon = MODULE_ICONS[k];
            const meta = APP_META[k];
            const active = k === currentApp;
            return (
              <button
                key={k}
                data-testid={`app-switcher-item-${k}`}
                onClick={() => {
                  setOpen(false);
                  nav(meta.base);
                }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#F4F6F7] transition-colors"
                style={{
                  border: active
                    ? "2px solid #1F453B"
                    : "2px solid transparent",
                  background: active ? "#D8E0DA" : "transparent",
                }}
              >
                <div
                  className="w-[64px] h-[64px] rounded-xl bg-white flex items-center justify-center"
                  style={{ boxShadow: "0 3px 10px rgba(15,31,26,0.08)" }}
                >
                  <div style={{ width: 50, height: 50 }}>
                    <Icon />
                  </div>
                </div>
                <div
                  className="text-[12px] font-semibold w-full text-center truncate"
                  style={{ color: "#1F453B" }}
                >
                  {meta.name}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-2 pt-2 border-t border-[rgba(31,69,59,0.10)]">
          <button
            data-testid="app-switcher-back-btn"
            onClick={() => {
              setOpen(false);
              nav("/dashboard");
            }}
            className="w-full h-10 rounded-lg text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#F4F6F7]"
            style={{ color: "#1F453B" }}
          >
            <ArrowLeft size={15} /> Back to All Apps
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
