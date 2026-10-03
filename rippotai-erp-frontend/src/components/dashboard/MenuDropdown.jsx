import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { APP_META } from "@/config/appNav";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Apps whose index route is the customisable AppDashboard. Others use a
// hand-built dashboard with no edit mode, so "Edit Dashboard" is hidden there.
const CUSTOMISABLE_DASHBOARDS = new Set([
  "crm",
  "ledger",
  "procurement",
  "siteOperations",
  "design_studio",
  "inventory",
  "boq",
]);

export default function MenuDropdown({ app, label, items: allItems }) {
  const items = CUSTOMISABLE_DASHBOARDS.has(app)
    ? allItems
    : allItems.filter((it) => it.slug !== "edit-dashboard");
  const nav = useNavigate();
  const location = useLocation();
  const base = APP_META[app].base;
  const [open, setOpen] = useState(false);

  const onPick = (slug) => {
    setOpen(false);
    if (slug === "edit-dashboard") {
      nav(`${base}?edit=1`);
    } else if (slug && slug.startsWith("/")) {
      nav(slug); // absolute cross-app link (e.g. Projects)
    } else {
      nav(`${base}/${slug}`);
    }
  };
  const currentPath = location.pathname;
  const groupActive = items.some((it) => {
    const p = it.slug?.startsWith("/") ? it.slug : `${base}/${it.slug}`;
    return p !== base && (currentPath === p || currentPath.startsWith(p + "/"));
  });

  if (!items.length) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          data-testid={`menu-${app}-${label.toLowerCase()}`}
          className={`inos-nav-btn ${groupActive ? "is-active" : ""}`}
        >
          {label} <ChevronDown size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-[248px] inos-menu">
        <div className="inos-menu__label">{label}</div>
        {items.map((it) => {
          const path = it.slug?.startsWith("/") ? it.slug : `${base}/${it.slug}`;
          const active = currentPath === path;
          return (
            <button
              key={it.slug}
              onClick={() => onPick(it.slug)}
              data-testid={`menu-item-${app}-${it.slug}`}
              className={`nav-dropdown-item w-full text-left ${active ? "active" : ""}`}
            >
              {it.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
