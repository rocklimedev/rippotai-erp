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
import api from "@/lib/api"; // for real search

// Resolve a slug against the app's base route. Slugs that already start
// with "/" (cross-app links like "/projects/all") are used as-is.
function resolvePath(base, slug) {
  if (!slug) return base;
  return slug.startsWith("/") ? slug : `${base}/${slug}`;
}

// Pick a sensible icon for a menu item based on its label/slug.
function iconFor(label = "", slug = "") {
  const text = `${label} ${slug}`.toLowerCase();
  if (/(create|new|add|upload)/.test(text)) return Plus;
  if (/(setting|role|permission)/.test(text)) return SettingsIcon;
  return FileText;
}

export default function CommandShellSearch({ currentApp }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);

  const inputRef = useRef(null);
  const nav = useNavigate();

  const meta = APP_META[currentApp] || {};
  const base = meta.base || "/";

  // Cmd/Ctrl + K global shortcut
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
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // Live Search
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(
          `/search?q=${encodeURIComponent(query)}&limit=8`,
        );
        setSearchResults(data?.results || []);
      } catch (err) {
        setSearchResults([]);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  // Build contextual commands straight from APP_META / APP_MENUS so every
  // app (not just two hardcoded ones) gets Quick Actions + its real nav.
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

    const groups = { "Quick Actions": common };
    const menuGroups = APP_MENUS[currentApp] || [];

    menuGroups.forEach((group) => {
      const items = [];

      // Standalone nav item (e.g. leads "Pipeline")
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
        group.items.forEach((it) => {
          items.push({
            id: `${currentApp}-${group.label}-${it.slug}`,
            label: it.label,
            icon: iconFor(it.label, it.slug),
            action: () => nav(resolvePath(base, it.slug)),
          });
        });
      }

      if (items.length) {
        groups[group.label] = items;
      }
    });

    return groups;
  }, [currentApp, base, nav]);

  const allResults = useMemo(() => {
    const out = [];
    Object.entries(groupedCommands).forEach(([group, items]) => {
      items.forEach((item) => {
        if (!query || item.label.toLowerCase().includes(query.toLowerCase())) {
          out.push({ ...item, group });
        }
      });
    });
    return out;
  }, [groupedCommands, query]);

  const allItems = useMemo(
    () => [...allResults, ...searchResults],
    [allResults, searchResults],
  );

  // Reset selection whenever the visible item list changes.
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, allItems.length]);

  const executeCommand = (item) => {
    if (item.action) item.action();
    else if (item.path) nav(item.path);

    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
  };

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
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger - Visible Search Bar */}
      <DialogTrigger asChild>
        <div className="relative flex-1 max-w-[380px] cursor-text">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onFocus={() => setOpen(true)}
            placeholder={meta.searchPh || `Search or jump to...`}
            className="bc-input pl-10 w-full cursor-text"
            readOnly // Prevents typing in trigger, only opens modal
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)] hidden sm:block">
            ⌘K
          </div>
        </div>
      </DialogTrigger>

      {/* Modal Content */}
      <DialogContent
        className="bc-card max-w-[520px] p-0 overflow-hidden"
        style={{ maxHeight: "85vh" }}
      >
        {/* Header / Search Input */}
        <div className="p-4 border-b border-border relative">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              className="w-full pl-12 pr-10 py-4 bg-transparent text-[16px] text-[var(--ink-green)] focus:outline-none"
            />
          </div>

          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--ink-green)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Results Area */}
        <div
          className="overflow-auto"
          style={{ maxHeight: "calc(85vh - 120px)" }}
        >
          {allItems.length === 0 && query && (
            <div className="py-16 text-center text-[var(--muted)]">
              No results found for "{query}"
            </div>
          )}

          {/* Command Groups */}
          {Object.entries(groupedCommands).map(([groupName, items]) => {
            const filtered = items.filter(
              (item) =>
                !query ||
                item.label.toLowerCase().includes(query.toLowerCase()),
            );
            if (filtered.length === 0) return null;

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
                      onClick={() => executeCommand(item)}
                      className={`w-full px-5 py-3.5 flex items-center gap-4 text-left transition-colors ${
                        isSelected
                          ? "bg-[var(--ink-green)] text-white"
                          : "hover:bg-[var(--mist-soft)] text-[var(--ink-green)]"
                      }`}
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

          {/* Live Search Results */}
          {searchResults.length > 0 && (
            <div className="py-3">
              <div className="eyebrow px-5 py-2 flex items-center gap-2">
                <Zap size={14} /> Live Search Results
              </div>
              {searchResults.map((item, idx) => {
                const globalIdx = allResults.length + idx;
                const isSelected = globalIdx === selectedIndex;

                return (
                  <button
                    key={item.id}
                    onClick={() => executeCommand(item)}
                    className={`w-full px-5 py-3.5 flex items-center gap-4 text-left transition-colors ${
                      isSelected
                        ? "bg-[var(--ink-green)] text-white"
                        : "hover:bg-[var(--mist-soft)] text-[var(--ink-green)]"
                    }`}
                  >
                    <Search
                      size={18}
                      className={
                        isSelected ? "text-white" : "text-[var(--muted)]"
                      }
                    />
                    <span className="flex-1 text-[15px] truncate">
                      {item.label || item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="border-t border-border px-5 py-3 text-xs text-[var(--muted)] flex justify-between bg-[var(--mist-soft)]">
          <div>↑ ↓ to navigate • Enter to select</div>
          <div>Esc to close</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
