import React, { useState, useEffect, useRef } from "react";
import { Search, ArrowRight, Zap, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"; // ← Make sure this exists
import { APP_META } from "@/config/appNav";
import api from "@/lib/api"; // for real search

export default function CommandShellSearch({ currentApp }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);

  const inputRef = useRef(null);
  const nav = useNavigate();

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
        setSearchResults(data?.results || []); // adjust according to your API response
      } catch (err) {
        setSearchResults([]);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  const getContextualCommands = () => {
    const meta = APP_META[currentApp] || {};
    const base = meta.base || "/";

    const common = [
      {
        id: "dashboard",
        label: "Go to Dashboard",
        icon: "🏠",
        action: () => nav("/dashboard"),
      },
      {
        id: "settings",
        label: "Open Settings",
        icon: "⚙️",
        action: () => nav("/settings"),
      },
    ];

    const appSpecific = {
      projects: [
        {
          id: "new-project",
          label: "New Project",
          icon: "➕",
          action: () => nav(`${base}/new`),
        },
        {
          id: "my-projects",
          label: "My Active Projects",
          icon: "📋",
          action: () => nav(base),
        },
      ],
      boqs: [
        {
          id: "new-boq",
          label: "Create New BOQ",
          icon: "📄",
          action: () => nav(`${base}/new`),
        },
        {
          id: "all-boqs",
          label: "View All BOQs",
          icon: "📚",
          action: () => nav(base),
        },
      ],
      // Add more apps as needed
    };

    return {
      "Quick Actions": common,
      [meta.name || "Current App"]: appSpecific[currentApp] || [],
    };
  };

  const groupedCommands = getContextualCommands();
  let allResults = [];

  Object.entries(groupedCommands).forEach(([group, items]) => {
    items.forEach((item) => {
      if (!query || item.label.toLowerCase().includes(query.toLowerCase())) {
        allResults.push({ ...item, group });
      }
    });
  });

  const allItems = [...allResults, ...searchResults];

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
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={`Search or jump to... (${currentApp})`}
            className="bc-input pl-10 w-full cursor-text"
            readOnly // Prevents typing in trigger, only opens modal
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hidden sm:block">
            ⌘K
          </div>
        </div>
      </DialogTrigger>

      {/* Modal Content */}
      <DialogContent
        className="max-w-[520px] p-0 overflow-hidden rounded-2xl shadow-2xl"
        style={{ maxHeight: "85vh" }}
      >
        {/* Header / Search Input */}
        <div className="p-4 border-b relative">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              className="w-full pl-12 pr-4 py-4 bg-transparent text-[16px] focus:outline-none"
            />
          </div>

          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
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
            <div className="py-16 text-center text-gray-500">
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
                <div className="px-5 py-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
                  {groupName}
                </div>
                {filtered.map((item, idx) => {
                  const globalIdx = allResults.findIndex(
                    (r) => r.id === item.id,
                  );
                  const isSelected = globalIdx === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      onClick={() => executeCommand(item)}
                      className={`w-full px-5 py-3.5 flex items-center gap-4 text-left hover:bg-[#F4F6F7] ${isSelected ? "bg-[#F4F6F7]" : ""}`}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className="flex-1 text-[15px]">{item.label}</span>
                      <ArrowRight size={18} className="text-gray-300" />
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* Live Search Results */}
          {searchResults.length > 0 && (
            <div className="py-3">
              <div className="px-5 py-2 text-xs font-semibold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <Zap size={14} /> Live Search Results
              </div>
              {searchResults.map((item, idx) => {
                const globalIdx = allResults.length + idx;
                const isSelected = globalIdx === selectedIndex;

                return (
                  <button
                    key={item.id}
                    onClick={() => executeCommand(item)}
                    className={`w-full px-5 py-3.5 flex items-center gap-4 text-left hover:bg-[#F4F6F7] ${isSelected ? "bg-[#F4F6F7]" : ""}`}
                  >
                    <Search size={18} className="text-gray-400" />
                    <span className="flex-1 text-[15px]">
                      {item.label || item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="border-t px-5 py-3 text-xs text-gray-400 flex justify-between bg-gray-50">
          <div>↑ ↓ to navigate • Enter to select</div>
          <div>Esc to close</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
