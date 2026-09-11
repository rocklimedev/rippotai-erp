import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { MODULE_ICONS } from "@/components/icons/ModuleIcons";
import { APP_META, APP_MENUS } from "@/config/appNav";
import CommandShellSearch from "../search/CommandShellSearch";
import AppSwitcher from "./AppSwitcher";
import MenuDropdown from "./MenuDropdown";
import NotificationsBell from "./NotificationsBell";
import UserMenu from "../users/UserMenu";
import CliqIcon from "../icons/ChatIcon";
// ✅ correct import from the modular Cliq package
import { useCliqChat } from "../cliq/context";
// or, if you re-export from an index: import { useCliqChat } from "../cliq";

export default function TopHeader({ app }) {
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const Icon = MODULE_ICONS[app];
  const meta = APP_META[app];
  const menus = APP_MENUS[app] || [];

  const { open, cliqConnected, toggleChat } = useCliqChat();

  const navigateTo = (slug) => {
    nav(slug.startsWith("/") ? slug : `${meta.base}/${slug}`);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        data-testid={`topheader-${app}`}
        className="sticky top-0 z-30 h-16 bg-white flex items-center gap-2 px-4 lg:px-6"
        style={{
          boxShadow: "0 4px 12px rgba(15,31,26,0.06)",
        }}
      >
        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation"
          className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-[#F4F6F7]"
        >
          <Menu size={21} color="#1F453B" />
        </button>

        {/* APP SWITCHER */}
        <AppSwitcher currentApp={app} />

        {/* APP NAME */}
        <button
          onClick={() => nav(meta.base)}
          className="flex items-center gap-2 shrink-0 pr-3 lg:border-r border-[rgba(31,69,59,0.10)] lg:mr-2 h-9"
        >
          <div style={{ width: 28, height: 28 }}>
            <Icon />
          </div>

          <div
            className="hidden md:block text-[17px] font-semibold"
            style={{
              color: "#333333",
              fontFamily: "Poppins",
            }}
          >
            {meta.name}
          </div>
        </button>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden lg:flex items-center gap-1 flex-shrink min-w-0 overflow-hidden">
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
                onClick={() => navigateTo(g.slug)}
                className="h-9 px-3 rounded-lg text-[15px] font-semibold hover:bg-[#F4F6F7]"
                style={{
                  color: "#1F453B",
                  fontFamily: "Poppins",
                }}
              >
                {g.label}
              </button>
            ),
          )}
        </nav>

        <div className="flex-1" />

        {/* SEARCH */}
        <CommandShellSearch currentApp={app} />

        {/* CLIQ */}
        <button
          type="button"
          onClick={toggleChat}
          aria-label="Toggle Cliq chat"
          aria-pressed={open}
          title={cliqConnected ? "Cliq" : "Cliq (not connected)"}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-[#F4F6F7] transition-colors"
          style={{
            color: open ? "#1F453B" : "#5B6B66",
          }}
        >
          <CliqIcon size={19} />

          <span
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ring-2 ring-white"
            style={{
              background: cliqConnected ? "#3f6d5f" : "#a54536",
            }}
          />
        </button>

        {/* NOTIFICATIONS */}
        <NotificationsBell />

        {/* USER */}
        <UserMenu />
      </header>

      {/* MOBILE SIDEBAR */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileMenuOpen(false)}
          />

          <aside
            className="relative h-full w-[290px] max-w-[85vw] bg-white shadow-2xl flex flex-col"
            style={{
              animation: "slideIn 180ms ease-out",
            }}
          >
            <div className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-[#E8ECEA]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8">
                  <Icon />
                </div>

                <span
                  className="text-[16px] font-semibold"
                  style={{
                    color: "#333333",
                    fontFamily: "Poppins",
                  }}
                >
                  {meta.name}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#F4F6F7]"
              >
                <X size={20} color="#5B6B66" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              <div className="space-y-1">
                {menus.map((g) => {
                  if (g.items) {
                    return (
                      <div key={g.label} className="mb-3">
                        <div
                          className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider"
                          style={{
                            color: "#7A8983",
                            fontFamily: "Poppins",
                          }}
                        >
                          {g.label}
                        </div>

                        <div className="space-y-1">
                          {g.items.map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => navigateTo(item.slug)}
                              className="w-full flex items-center h-10 px-3 rounded-lg text-left text-[14px] font-medium hover:bg-[#F4F6F7]"
                              style={{
                                color: "#1F453B",
                                fontFamily: "Poppins",
                              }}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={g.label}
                      type="button"
                      onClick={() => navigateTo(g.slug)}
                      className="w-full flex items-center h-10 px-3 rounded-lg text-left text-[14px] font-semibold hover:bg-[#F4F6F7]"
                      style={{
                        color: "#1F453B",
                        fontFamily: "Poppins",
                      }}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>
        </div>
      )}

      <style>
        {`
          @keyframes slideIn {
            from { transform: translateX(-100%); }
            to   { transform: translateX(0); }
          }
        `}
      </style>
    </>
  );
}
