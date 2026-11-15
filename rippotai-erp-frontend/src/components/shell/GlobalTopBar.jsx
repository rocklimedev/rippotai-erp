// Global top bar across every app page and Home: monogram + INOS, All Apps,
// a wide search field, then approvals, chat, notifications and the user menu.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, LayoutGrid, Menu } from "lucide-react";
import { MODULE_ICONS } from "@/components/icons/ModuleIcons";
import { APP_META, LANDING_ORDER } from "@/config/appNav";
import { useAccess } from "@/hooks/use-permission";
import { useAuth } from "@/context/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMyApprovalsCount } from "@/api/doc-flow/approvals.api";
import CommandShellSearch from "../search/CommandShellSearch";
import NotificationsBell from "../dashboard/NotificationsBell";
import CliqIcon from "../icons/ChatIcon";
import { useCliqChat } from "../cliq/context";
import UserMenu from "../users/UserMenu";
import monogram from "@/assets/brand/rippotai-monogram.png";
import "./shell.css";

export function AppSwitcher({ app }) {
  const nav = useNavigate();
  const access = useAccess();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="inos-topbar__apps" title="All apps" aria-label="All apps" data-testid="app-switcher-btn">
          <LayoutGrid size={15} aria-hidden />
          <span>All Apps</span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" sideOffset={8} className="w-[420px] max-w-[calc(100vw-24px)] inos-menu" style={{ padding: 10 }}>
        <div className="inos-menu__label">Apps</div>
        <div className="grid grid-cols-4 gap-1">
          {LANDING_ORDER.filter((k) => access.canOpenApp(k)).map((k) => {
            const Icon = MODULE_ICONS[k];
            const meta = APP_META[k];
            return (
              <button
                key={k}
                type="button"
                data-testid={`app-switcher-item-${k}`}
                onClick={() => {
                  setOpen(false);
                  nav(meta.base);
                }}
                className={`inos-side__app-tile ${k === app ? "is-active" : ""}`}
              >
                <span className="inos-side__app-tile-icon">{Icon && <Icon />}</span>
                <span>{meta.name}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ChatButton() {
  const { open, cliqConnected, toggleChat } = useCliqChat();
  return (
    <button
      type="button"
      onClick={toggleChat}
      aria-label="Chat"
      aria-pressed={open}
      title={cliqConnected ? "Chat" : "Chat (not connected)"}
      className="inos-topbar__tool"
    >
      <CliqIcon size={19} />
      <span className="inos-topbar__dot" style={{ background: cliqConnected ? "var(--ok-dot)" : "var(--mute-dot)" }} />
    </button>
  );
}

export function ApprovalsButton() {
  const { user } = useAuth();
  const count = useMyApprovalsCount(!user?.id);
  if (count == null) return null;
  return (
    <Link to="/approvals" className="inos-topbar__tool" title={`My approvals (${count})`} aria-label={`My approvals: ${count} waiting`} data-testid="topbar-approvals">
      <CheckCircle2 size={19} aria-hidden />
      {count > 0 && <span className="inos-topbar__badge">{count > 99 ? "99+" : count}</span>}
    </Link>
  );
}

export default function GlobalTopBar({ app = "dashboard", onOpenMenu }) {
  return (
    <header className="inos-topbar" data-testid={`topheader-${app}`}>
      {onOpenMenu && (
        <button type="button" className="inos-topbar__menu" onClick={onOpenMenu} aria-label="Open menu">
          <Menu size={20} />
        </button>
      )}
      <Link to="/dashboard" className="inos-topbar__brand" title="INOS home" data-testid="rippotai-logo">
        <img src={monogram} alt="Rippotai" />
        <span>INOS</span>
      </Link>
      <span className="inos-topbar__sep" aria-hidden />
      <AppSwitcher app={app} />
      <div className="inos-topbar__search">
        <CommandShellSearch currentApp={app} />
      </div>
      <div className="inos-topbar__tools">
        <ApprovalsButton />
        <ChatButton />
        <NotificationsBell side="bottom" align="end" />
        <UserMenu side="bottom" align="end" compact />
      </div>
    </header>
  );
}
