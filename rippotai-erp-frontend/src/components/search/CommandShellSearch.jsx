import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  ArrowRight,
  Zap,
  X,
  Home,
  Settings as SettingsIcon,
  Plus,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import { APP_META, APP_MENUS } from "@/config/appNav";
import { useGlobalSearchQuery } from "@/api/search.api";

// ============================================================
// Resolve a slug against the app's base route.
// ============================================================

function resolvePath(base, slug) {
  if (!slug) return base;

  return slug.startsWith("/") ? slug : `${base}/${slug}`;
}

// ============================================================
// Pick an icon based on menu label.
// ============================================================

function iconFor(label = "", slug = "") {
  const text = `${label} ${slug}`.toLowerCase();

  if (/(create|new|add|upload)/.test(text)) {
    return Plus;
  }

  if (/(setting|role|permission)/.test(text)) {
    return SettingsIcon;
  }

  return FileText;
}

// ============================================================
// Command Shell Search
// ============================================================

export default function CommandShellSearch({ currentApp }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);
  const nav = useNavigate();

  const meta = APP_META[currentApp] || {};
  const base = meta.base || "/";

  // ============================================================
  // GLOBAL SEARCH
  // ============================================================

  const { data: searchData, isFetching } = useGlobalSearchQuery(query, {
    skip: query.trim().length < 2,
  });

  const searchResults = useMemo(() => {
    if (!searchData) return [];

    return [
      ...(searchData.boqs ?? []),
      ...(searchData.briefs ?? []),
      ...(searchData.calendar ?? []),
      ...(searchData.clients ?? []),
      ...(searchData.leads ?? []),
      ...(searchData.projects ?? []),
      ...(searchData.quotations ?? []),
      ...(searchData.siteRecce ?? []),
      ...(searchData.tasks ?? []),
      ...(searchData.users ?? []),
      ...(searchData.vendors ?? []),
    ];
  }, [searchData]);

  // ============================================================
  // OPEN WITH CMD / CTRL + K
  // ============================================================

  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();

        setOpen(true);
        setQuery("");
        setSelectedIndex(0);
      }
    };

    window.addEventListener("keydown", handleGlobalKey);

    return () => {
      window.removeEventListener("keydown", handleGlobalKey);
    };
  }, []);

  // ============================================================
  // FOCUS INPUT WHEN MODAL OPENS
  // ============================================================

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [open]);

  // ============================================================
  // COMMANDS
  // ============================================================

  const groupedCommands = useMemo(() => {
    const common = [
      {
        id: "quick-dashboard",
        label: "Go to Dashboard",
        icon: Home,
        action: () => nav("/dashboard"),
      },
      {
        id: "quick-settings",
        label: "Open Settings",
        icon: SettingsIcon,
        action: () => nav("/settings"),
      },
    ];

    const groups = {
      "Quick Actions": common,
    };

    const menuGroups = APP_MENUS[currentApp] || [];

    menuGroups.forEach((group) => {
      const items = [];

      // Standalone menu item
      if (group.slug) {
        items.push({
          id: `${currentApp}-${group.label}-${group.slug}`,
          label: group.label,
          icon: iconFor(group.label, group.slug),
          action: () => nav(resolvePath(base, group.slug)),
        });
      }

      // Dropdown items
      if (Array.isArray(group.items)) {
        group.items.forEach((item) => {
          items.push({
            id: `${currentApp}-${group.label}-${item.slug}`,
            label: item.label,
            icon: iconFor(item.label, item.slug),
            action: () => nav(resolvePath(base, item.slug)),
          });
        });
      }

      if (items.length) {
        groups[group.label] = items;
      }
    });

    return groups;
  }, [currentApp, base, nav]);

  // ============================================================
  // FILTER COMMANDS
  // ============================================================

  const allResults = useMemo(() => {
    const out = [];

    Object.entries(groupedCommands).forEach(([group, items]) => {
      items.forEach((item) => {
        if (!query || item.label.toLowerCase().includes(query.toLowerCase())) {
          out.push({
            ...item,
            group,
          });
        }
      });
    });

    return out;
  }, [groupedCommands, query]);

  // ============================================================
  // COMBINE COMMAND + LIVE RESULTS
  // ============================================================

  const allItems = useMemo(() => {
    return [...allResults, ...searchResults];
  }, [allResults, searchResults]);

  // ============================================================
  // RESET SELECTION
  // ============================================================

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, allItems.length]);

  // ============================================================
  // EXECUTE
  // ============================================================

  const executeCommand = (item) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      nav(item.path);
    }

    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
  };

  // ============================================================
  // KEYBOARD NAVIGATION
  // ============================================================

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();

      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allItems.length));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();

      setSelectedIndex(
        (prev) => (prev - 1 + allItems.length) % Math.max(1, allItems.length),
      );
    }

    if (e.key === "Enter") {
      e.preventDefault();

      if (allItems[selectedIndex]) {
        executeCommand(allItems[selectedIndex]);
      }
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);

        if (!value) {
          setQuery("");
          setSelectedIndex(0);
        }
      }}
    >
      {/* ====================================================== */}
      {/* HEADER SEARCH ICON */}
      {/* ====================================================== */}

      <DialogTrigger asChild>
        <button
          type="button"
          data-testid="topbar-search"
          aria-label="Search"
          title={`Search ${meta.name || ""}`}
          className="
            w-10
            h-10
            shrink-0
            rounded-full
            flex
            items-center
            justify-center
            hover:bg-[#F4F6F7]
            transition-colors
            focus:outline-none
            focus:ring-2
            focus:ring-[#1F453B]/20
          "
        >
          <Search
            size={20}
            strokeWidth={2}
            style={{
              color: "#1F453B",
            }}
          />
        </button>
      </DialogTrigger>

      {/* ====================================================== */}
      {/* SEARCH MODAL */}
      {/* ====================================================== */}

      <DialogContent
        className="
          bc-card
          w-[calc(100vw-24px)]
          sm:w-full
          max-w-[520px]
          p-0
          overflow-hidden
        "
        style={{
          maxHeight: "85vh",
        }}
      >
        {/* ==================================================== */}
        {/* MODAL HEADER */}
        {/* ==================================================== */}

        <div className="p-4 border-b border-border relative">
          <div className="relative">
            <Search
              size={20}
              className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-[var(--muted)]
              "
            />

            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={meta.searchPh || "Type a command or search..."}
              className="
                w-full
                pl-12
                pr-10
                py-4
                bg-transparent
                text-[16px]
                text-[var(--ink-green)]
                focus:outline-none
              "
            />
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="
              absolute
              top-4
              right-4
              text-[var(--muted)]
              hover:text-[var(--ink-green)]
            "
            aria-label="Close search"
          >
            <X size={20} />
          </button>
        </div>

        {/* ==================================================== */}
        {/* RESULTS */}
        {/* ==================================================== */}

        <div
          className="overflow-auto"
          style={{
            maxHeight: "calc(85vh - 120px)",
          }}
        >
          {/* Loading */}

          {isFetching && (
            <div className="py-10 text-center text-[var(--muted)]">
              Searching...
            </div>
          )}

          {/* Empty */}

          {!isFetching && allItems.length === 0 && query && (
            <div className="py-16 text-center text-[var(--muted)]">
              No results found for "{query}"
            </div>
          )}

          {/* ================================================== */}
          {/* QUICK COMMANDS */}
          {/* ================================================== */}

          {Object.entries(groupedCommands).map(([groupName, items]) => {
            const filtered = items.filter(
              (item) =>
                !query ||
                item.label.toLowerCase().includes(query.toLowerCase()),
            );

            if (!filtered.length) {
              return null;
            }

            return (
              <div key={groupName} className="py-3">
                <div className="eyebrow px-5 py-2">{groupName}</div>

                {filtered.map((item) => {
                  const globalIdx = allResults.findIndex(
                    (r) => r.id === item.id,
                  );

                  const isSelected = globalIdx === selectedIndex;

                  const Icon = item.icon || FileText;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => executeCommand(item)}
                      className={`
                          w-full
                          px-5
                          py-3.5
                          flex
                          items-center
                          gap-4
                          text-left
                          transition-colors
                          ${
                            isSelected
                              ? "bg-[var(--ink-green)] text-white"
                              : "hover:bg-[var(--mist-soft)] text-[var(--ink-green)]"
                          }
                        `}
                    >
                      <Icon
                        size={18}
                        className={
                          isSelected ? "text-white" : "text-[var(--muted)]"
                        }
                      />

                      <span className="flex-1 text-[15px] truncate">
                        {item.label}
                      </span>

                      <ArrowRight
                        size={18}
                        className={
                          isSelected ? "text-white/70" : "text-[var(--sage)]"
                        }
                      />
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* ================================================== */}
          {/* LIVE SEARCH RESULTS */}
          {/* ================================================== */}

          {searchResults.length > 0 && (
            <div className="py-3">
              <div className="eyebrow px-5 py-2 flex items-center gap-2">
                <Zap size={14} />
                Live Search Results
              </div>

              {searchResults.map((item, idx) => {
                const globalIdx = allResults.length + idx;

                const isSelected = globalIdx === selectedIndex;

                return (
                  <button
                    key={item.id || `${item.type}-${idx}`}
                    type="button"
                    onClick={() => executeCommand(item)}
                    className={`
                        w-full
                        px-5
                        py-3.5
                        flex
                        items-center
                        gap-4
                        text-left
                        transition-colors
                        ${
                          isSelected
                            ? "bg-[var(--ink-green)] text-white"
                            : "hover:bg-[var(--mist-soft)] text-[var(--ink-green)]"
                        }
                      `}
                  >
                    <Search
                      size={18}
                      className={
                        isSelected ? "text-white" : "text-[var(--muted)]"
                      }
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] truncate">
                        {item.label || item.title || item.name}
                      </div>

                      {item.type && (
                        <div
                          className={`
                              text-xs
                              mt-1
                              ${
                                isSelected
                                  ? "text-white/70"
                                  : "text-[var(--muted)]"
                              }
                            `}
                        >
                          {item.type}
                        </div>
                      )}
                    </div>

                    <ArrowRight
                      size={18}
                      className={
                        isSelected ? "text-white/70" : "text-[var(--sage)]"
                      }
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* FOOTER */}
        {/* ==================================================== */}

        <div
          className="
            border-t
            border-border
            px-5
            py-3
            text-xs
            text-[var(--muted)]
            flex
            justify-between
            bg-[var(--mist-soft)]
          "
        >
          <div>↑ ↓ to navigate • Enter to select</div>

          <div>Esc to close</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
