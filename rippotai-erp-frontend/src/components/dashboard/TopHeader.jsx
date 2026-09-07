import React from "react";
import { useNavigate } from "react-router-dom";
import { MODULE_ICONS } from "@/components/icons/ModuleIcons";
import { APP_META, APP_MENUS } from "@/config/appNav";
import CommandShellSearch from "../search/CommandShellSearch";
import AppSwitcher from "./AppSwitcher";
import MenuDropdown from "./MenuDropdown";
import NotificationsBell from "./NotificationsBell";
import UserMenu from "../users/UserMenu";
import CliqIcon from "../icons/ChatIcon";
import { useCliqChat } from "../CliqChatWidget";

export default function TopHeader({ app }) {
  const nav = useNavigate();
  const Icon = MODULE_ICONS[app];
  const meta = APP_META[app];
  const menus = APP_MENUS[app] || [];
  const { open, cliqConnected, toggleChat } = useCliqChat();
  return (
    <header
      data-testid={`topheader-${app}`}
      className="sticky top-0 z-30 h-16 bg-white flex items-center gap-2 px-4 lg:px-6"
      style={{ boxShadow: "0 4px 12px rgba(15,31,26,0.06)" }}
    >
      <AppSwitcher currentApp={app} />
      <button
        onClick={() => nav(meta.base)}
        className="flex items-center gap-2 shrink-0 pr-3 border-r border-[rgba(31,69,59,0.10)] mr-2 h-9"
      >
        <div style={{ width: 28, height: 28 }}>
          <Icon />
        </div>
        <div
          className="hidden md:block text-[17px] font-semibold"
          style={{ color: "#333333", fontFamily: "Poppins" }}
        >
          {meta.name}
        </div>
      </button>
      <nav className="flex items-center gap-1 flex-shrink min-w-0 overflow-hidden">
        {menus.map((g) =>
          g.items ? (
            <MenuDropdown
              key={g.label}
              app={app}
              label={g.label}
              items={g.items}
            />
          ) : (
            <button
              key={g.label}
              onClick={() =>
                nav(g.slug.startsWith("/") ? g.slug : `${meta.base}/${g.slug}`)
              }
              className="h-9 px-3 rounded-lg text-[15px] font-semibold hover:bg-[#F4F6F7]"
              style={{ color: "#1F453B", fontFamily: "Poppins" }}
            >
              {g.label}
            </button>
          ),
        )}
      </nav>
      <div className="flex-1" />
      <CommandShellSearch currentApp={app} />
      <button
        type="button"
        onClick={toggleChat}
        aria-label="Toggle Cliq chat"
        aria-pressed={open}
        title={cliqConnected ? "Cliq" : "Cliq (not connected)"}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-[#F4F6F7] transition-colors"
        style={{ color: open ? "#1F453B" : "#5B6B66" }}
      >
        <CliqIcon size={19} />
        <span
          className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ring-2 ring-white"
          style={{ background: cliqConnected ? "#3f6d5f" : "#a54536" }}
        />
      </button>
      <NotificationsBell />
      <UserMenu />
    </header>
  );
}
