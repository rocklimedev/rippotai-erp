import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { APP_META } from "@/config/appNav";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function MenuDropdown({ app, label, items }) {
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          data-testid={`menu-${app}-${label.toLowerCase()}`}
          className="h-9 px-3 rounded-lg text-[15px] font-semibold flex items-center gap-1 hover:bg-[#F4F6F7]"
          style={{ color: "#1F453B", fontFamily: "Poppins" }}
        >
          {label} <ChevronDown size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[240px] p-1 bc-card border-0">
        {items.map((it) => {
          const path = `${base}/${it.slug}`;
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
