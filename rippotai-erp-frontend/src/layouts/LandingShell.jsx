import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useGlobalSearchQuery } from "@/api/meta/search.api";
import { pathForEntity } from "@/components/search/search-routes";
import {
  useGetUserNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "../api/engagement/notification.api"; // <-- adjust this path to wherever the file above lives
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

function GlobalSearch({ open, setOpen }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { currentData, isFetching, isError } = useGlobalSearchQuery(
    { q: q.trim(), pageSize: 20 },
    { skip: !open || q.trim().length < 2 },
  );
  const hits = (currentData?.results || []).filter((hit) => pathForEntity(hit));
  return (
    <CommandDialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) setQ(""); }}>
      <Command shouldFilter={false}>
        <CommandInput placeholder="Search projects, clients, drawings or documents…" value={q} onValueChange={setQ} />
        <CommandList>
          {q.trim().length < 2 ? <CommandEmpty>Type at least 2 characters…</CommandEmpty>
            : isFetching ? <CommandEmpty>Searching…</CommandEmpty>
            : isError ? <CommandEmpty>Could not load search results. Try again.</CommandEmpty>
            : !hits.length ? <CommandEmpty>No results found.</CommandEmpty>
            : <CommandGroup heading="Search results">
              {hits.map((hit) => <CommandItem key={`${hit.entity_type}:${hit.id}`} value={`${hit.entity_type}:${hit.id}`} onSelect={() => { setOpen(false); setQ(""); navigate(pathForEntity(hit)); }}>
                <Search size={14} className="mr-2" />
                <span className="flex-1">{hit.title}</span>
                <span className="text-xs text-muted-foreground">{hit.subtitle || hit.entity_type.replaceAll("_", " ")}</span>
              </CommandItem>)}
            </CommandGroup>}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
export default function LandingShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  // RTK Query replaces the old useState/useEffect + api.get("/notifications")
  const { data: notifs = [] } = useGetUserNotificationsQuery(
    { userId: user?.id },
    { skip: !user?.id },
  );
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const unread = notifs.filter((n) => n.unread).length;

  const handleNotifSelect = (n) => {
    if (n.unread) {
      markAsRead(n.id);
    }
    if (n.link_url) navigate(n.link_url);
  };

  return (
    <div className="min-h-screen bc-page-bg">
      <header
        data-testid="landing-header"
        className="sticky top-0 z-20 bg-[#EAEEF0]"
      >
        <div className="h-16 px-4 lg:px-8 max-w-[1440px] mx-auto flex items-center gap-4">
          <button
            data-testid="inos-logo"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 shrink-0"
            aria-label="INOS home"
          >
            <div
              className="w-10 h-10 rounded-xl nm-raised flex items-center justify-center text-[#333333] font-semibold"
              style={{ fontFamily: "'Poppins','Arial',sans-serif" }}
            >
              B
            </div>
            <div className="hidden sm:block text-left">
              <div
                className="text-[14px] font-semibold text-[#333333] leading-none"
                style={{ fontFamily: "'Poppins','Arial',sans-serif" }}
              >
                INOS
              </div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-[#6B7B7C] mt-1">
                ERP · Beta
              </div>
            </div>
          </button>

          <button
            onClick={() => setSearchOpen(true)}
            data-testid="landing-search-trigger"
            className="flex-1 max-w-[640px] mx-auto flex items-center gap-2 h-11 px-4 rounded-full nm-inset"
          >
            <Search size={16} className="text-[#6B7B7C]" />
            <span className="text-[13px] text-[#6B7B7C] truncate">
              Search projects, clients, BOQs, vendors or documents
            </span>
            <span className="ml-auto text-[11px] text-[#6B7B7C] hidden md:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded-md nm-raised-sm text-[10px]">
                ⌘
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded-md nm-raised-sm text-[10px]">
                K
              </kbd>
            </span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="landing-notifications-btn"
                  className="relative w-11 h-11 rounded-full nm-raised flex items-center justify-center"
                  aria-label="Notifications"
                >
                  <Bell size={17} className="text-[#6B7B7C]" />
                  {unread > 0 && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full text-[10.5px] font-semibold flex items-center justify-center"
                      style={{ background: "#1F453B", color: "#EAEEF0" }}
                    >
                      {unread}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  Notifications{" "}
                  <span className="text-[11px] text-[#B5C4B6] font-normal">
                    {unread} unread
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifs.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    data-testid={`notif-item-${n.id}`}
                    onSelect={() => handleNotifSelect(n)}
                    className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                  >
                    <div className="text-[13px] font-semibold text-[#333333]">
                      {n.title}
                    </div>
                    <div className="text-[12px] text-[#6B7B7C]">{n.body}</div>
                  </DropdownMenuItem>
                ))}
                {notifs.length === 0 && (
                  <div className="py-4 text-center text-[12px] text-[#B5C4B6]">
                    No notifications yet
                  </div>
                )}
                {notifs.length > 0 && unread > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => markAllAsRead(user?.id)}
                      className="text-[12px] text-center justify-center text-[#6B7B7C]"
                    >
                      Mark all as read
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 h-11 pl-1.5 pr-3 rounded-full nm-raised"
                  data-testid="landing-user-menu-btn"
                >
                  <div
                    className="w-8 h-8 rounded-full text-[11px] font-semibold flex items-center justify-center"
                    style={{ background: "#1F453B", color: "#EAEEF0" }}
                  >
                    {user?.avatar_initials || "?"}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-[12.5px] font-semibold text-[#333333] leading-tight">
                      {user?.name}
                    </div>
                    <div className="text-[10.5px] text-[#B5C4B6] capitalize leading-tight">
                      {user?.role?.replace("_", " ")}
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-[#6B7B7C]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings size={14} className="mr-2" /> Settings
                </DropdownMenuItem>
                {user?.role === "admin" && (
                  <DropdownMenuItem
                    data-testid="landing-menu-roles-permissions"
                    onClick={() => navigate("/settings/roles-permissions")}
                  >
                    <Settings size={14} className="mr-2" /> Roles &amp;
                    Permissions
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  data-testid="landing-logout-btn"
                >
                  <LogOut size={14} className="mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <Outlet />
      </main>

      <GlobalSearch open={searchOpen} setOpen={setSearchOpen} />
    </div>
  );
}
