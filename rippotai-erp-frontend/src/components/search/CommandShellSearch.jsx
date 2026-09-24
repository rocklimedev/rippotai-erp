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
  FolderKanban,
  Users,
  Building2,
  ClipboardList,
  FileStack,
  Truck,
  PenTool,
  Calendar,
  CheckSquare,
  Briefcase,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import { APP_META, APP_MENUS } from "@/config/appNav";
import { useGlobalSearchQuery } from "@/api/meta/search.api";

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
  if (/(create|new|add|upload)/.test(text)) return Plus;
  if (/(setting|role|permission)/.test(text)) return SettingsIcon;
  return FileText;
}

// ============================================================
// Entity type → icon + navigation path
// ============================================================

const ENTITY_ICON = {
  project: FolderKanban,
  client: Building2,
  user: Users,
  lead: Briefcase,
  vendor: Truck,
  boq: ClipboardList,
  project_brief: FileStack,
  quotation: FileText,
  site_recce: PenTool,
  task: CheckSquare,
  calendar_event: Calendar,
  document: FileText,
  drawing: PenTool,
  work_order: ClipboardList,
  delivery_challan: Truck,
  budget_estimate: ClipboardList,
};

const ENTITY_LABEL = {
  project: "Project",
  client: "Client",
  user: "User",
  lead: "Lead",
  vendor: "Vendor",
  boq: "BOQ",
  project_brief: "Brief",
  quotation: "Quotation",
  site_recce: "Site Recce",
  task: "Task",
  calendar_event: "Calendar",
  document: "Document",
  drawing: "Drawing",
  work_order: "Work Order",
  delivery_challan: "Delivery Challan",
  budget_estimate: "Budget Estimate",
};

/** Map entity_type + id → app route. Adjust paths to match your router. */
function pathForEntity(hit) {
  const type = hit.entity_type;
  const id = hit.id;
  const projectId = hit.meta?.project_id ?? hit.meta?.projectId;

  switch (type) {
    case "project":
      return `/projects/${id}`;
    case "client":
      return `/clients/${id}`;
    case "user":
      return `/users/${id}`;
    case "lead":
      return `/leads/${id}`;
    case "vendor":
      return `/vendors/${id}`;
    case "boq":
      return projectId ? `/projects/${projectId}/boqs/${id}` : `/boqs/${id}`;
    case "project_brief":
      return projectId
        ? `/projects/${projectId}/briefs/${id}`
        : `/briefs/${id}`;
    case "quotation":
      return projectId
        ? `/projects/${projectId}/quotations/${id}`
        : `/quotations/${id}`;
    case "site_recce":
      return projectId
        ? `/projects/${projectId}/site-recce/${id}`
        : `/site-recce/${id}`;
    case "task":
      return projectId ? `/projects/${projectId}/tasks/${id}` : `/tasks/${id}`;
    case "calendar_event":
      return `/calendar`;
    case "document":
      return projectId
        ? `/projects/${projectId}/documents/${id}`
        : `/documents/${id}`;
    case "drawing":
      return projectId
        ? `/projects/${projectId}/drawings/${id}`
        : `/drawings/${id}`;
    case "work_order":
      return projectId
        ? `/projects/${projectId}/work-orders/${id}`
        : `/work-orders/${id}`;
    case "delivery_challan":
      return `/delivery-challans/${id}`;
    case "budget_estimate":
      return projectId
        ? `/projects/${projectId}/budget-estimates/${id}`
        : `/budget-estimates/${id}`;
    default:
      return null;
  }
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

  const trimmedQuery = query.trim();

  // ============================================================
  // GLOBAL SEARCH (v2 – object arg + unified results)
  // ============================================================

  const { data: searchData, isFetching } = useGlobalSearchQuery(
    {
      q: trimmedQuery,
      page: 1,
      pageSize: 20,
    },
    {
      skip: trimmedQuery.length < 2,
    },
  );

  /** Unified hits from Search v2 */
  const searchResults = useMemo(() => {
    const hits = searchData?.results ?? [];
    return hits.map((hit) => ({
      id: `search-${hit.entity_type}-${hit.id}`,
      entityId: hit.id,
      entity_type: hit.entity_type,
      label: hit.title || hit.meta?.name || "Untitled",
      subtitle:
        hit.subtitle || ENTITY_LABEL[hit.entity_type] || hit.entity_type,
      type: ENTITY_LABEL[hit.entity_type] || hit.entity_type,
      score: hit.score,
      meta: hit.meta,
      path: pathForEntity(hit),
      icon: ENTITY_ICON[hit.entity_type] || Search,
      isSearchHit: true,
    }));
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
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // ============================================================
  // FOCUS INPUT WHEN MODAL OPENS
  // ============================================================

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  // ============================================================
  // COMMANDS (nav menu)
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

      if (group.slug) {
        items.push({
          id: `${currentApp}-${group.label}-${group.slug}`,
          label: group.label,
          icon: iconFor(group.label, group.slug),
          action: () => nav(resolvePath(base, group.slug)),
        });
      }

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
        if (
          !trimmedQuery ||
          item.label.toLowerCase().includes(trimmedQuery.toLowerCase())
        ) {
          out.push({ ...item, group });
        }
      });
    });

    return out;
  }, [groupedCommands, trimmedQuery]);

  // ============================================================
  // COMBINE COMMAND + LIVE RESULTS (stable order for keyboard)
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
      <DialogTrigger asChild>
        <button
          type="button"
          data-testid="topbar-search"
          aria-label="Search"
          title={`Search ${meta.name || ""}`}
          className="
            w-10 h-10 shrink-0 rounded-full flex items-center justify-center
            hover:bg-[#F4F6F7] transition-colors
            focus:outline-none focus:ring-2 focus:ring-[#1F453B]/20
          "
        >
          <Search size={20} strokeWidth={2} style={{ color: "#1F453B" }} />
        </button>
      </DialogTrigger>

      <DialogContent
        className="bc-card w-[calc(100vw-24px)] sm:w-full max-w-[520px] p-0 overflow-hidden"
        style={{ maxHeight: "85vh" }}
      >
        {/* Header */}
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
              placeholder={meta.searchPh || "Type a command or search..."}
              className="
                w-full pl-12 pr-10 py-4 bg-transparent text-[16px]
                text-[var(--ink-green)] focus:outline-none
              "
            />
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--ink-green)]"
            aria-label="Close search"
          >
            <X size={20} />
          </button>
        </div>

        {/* Results */}
        <div
          className="overflow-auto"
          style={{ maxHeight: "calc(85vh - 120px)" }}
        >
          {isFetching && (
            <div className="py-10 text-center text-[var(--muted)]">
              Searching...
            </div>
          )}

          {!isFetching && allItems.length === 0 && trimmedQuery.length >= 2 && (
            <div className="py-16 text-center text-[var(--muted)]">
              No results found for &quot;{query}&quot;
            </div>
          )}

          {/* Quick commands */}
          {Object.entries(groupedCommands).map(([groupName, items]) => {
            const filtered = items.filter(
              (item) =>
                !trimmedQuery ||
                item.label.toLowerCase().includes(trimmedQuery.toLowerCase()),
            );
            if (!filtered.length) return null;

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
                        w-full px-5 py-3.5 flex items-center gap-4 text-left transition-colors
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

          {/* Live Search v2 results */}
          {searchResults.length > 0 && (
            <div className="py-3">
              <div className="eyebrow px-5 py-2 flex items-center gap-2">
                <Zap size={14} />
                Live Search Results
                {searchData?.total != null && (
                  <span className="opacity-60">({searchData.total})</span>
                )}
              </div>

              {searchResults.map((item, idx) => {
                const globalIdx = allResults.length + idx;
                const isSelected = globalIdx === selectedIndex;
                const Icon = item.icon || Search;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => executeCommand(item)}
                    className={`
                      w-full px-5 py-3.5 flex items-center gap-4 text-left transition-colors
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
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] truncate">{item.label}</div>
                      <div
                        className={`text-xs mt-1 truncate ${
                          isSelected ? "text-white/70" : "text-[var(--muted)]"
                        }`}
                      >
                        {item.subtitle}
                      </div>
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

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 text-xs text-[var(--muted)] flex justify-between bg-[var(--mist-soft)]">
          <div>↑ ↓ to navigate • Enter to select</div>
          <div>Esc to close</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
