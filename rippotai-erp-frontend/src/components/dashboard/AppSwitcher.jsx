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
          className="inos-topbar__icon-btn"
          aria-label="Switch app"
          title="All apps"
        >
          <LayoutGrid size={19} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-[420px] inos-menu" style={{ padding: 10 }}>
        <div className="inos-menu__label">Apps</div>
        <div className="grid grid-cols-4 gap-1">
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
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors hover:bg-[var(--sage-50)]"
                style={{ background: active ? "var(--brand-50)" : undefined }}
              >
                <div
                  className="w-[56px] h-[56px] rounded-2xl bg-white flex items-center justify-center"
                  style={{ border: "1px solid var(--line)" }}
                >
                  <div style={{ width: 40, height: 40 }}>
                    <Icon />
                  </div>
                </div>
                <div
                  className="text-[12px] font-semibold w-full text-center truncate"
                  style={{ color: active ? "var(--brand)" : "var(--text-2)" }}
                >
                  {meta.name}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--line)" }}>
          <button
            data-testid="app-switcher-back-btn"
            onClick={() => {
              setOpen(false);
              nav("/dashboard");
            }}
            className="inos-btn inos-btn--ghost w-full"
          >
            <ArrowLeft size={15} /> All apps home
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
