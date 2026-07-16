import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import api from "@/lib/api";
import { APP_META } from "@/config/appNav";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function ContextualSearch({ app }) {
  const meta = APP_META[app];
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!q || q.length < 2) {
      setData(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(
          `/search?q=${encodeURIComponent(q)}&limit=5`,
        );
        setData(data);
      } catch {
        setData({});
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const go = (path) => {
    setOpen(false);
    setQ("");
    nav(path);
  };
  const GROUPS = [
    [
      "boqs",
      "BOQs",
      (r) => `/boq/${r.id}`,
      (r) => r.boq_number || r.version,
      (r) => r.project_name,
    ],
    [
      "projects",
      "Projects",
      (r) => `/projects/${r.id}`,
      (r) => r.name,
      (r) => r.client_name || r.location,
    ],
    [
      "vendors",
      "Vendors",
      (r) => `/vendors/${r.id}`,
      (r) => r.name || r.company,
      (r) => r.company || r.primary_category,
    ],
    [
      "quotations",
      "Estimates",
      (r) => `/quotations/${r.id}`,
      (r) => r.quotation_number || r.title,
      (r) => r.project_name || r.vendor_name,
    ],
    [
      "documents",
      "Documents",
      (r) => `/documents/all`,
      (r) => r.title || r.filename,
      (r) => r.project_name || r.category,
    ],
    [
      "tasks",
      "Tasks",
      (r) => `/tasks/all`,
      (r) => r.title,
      (r) => r.project_name || r.assignee_name,
    ],
  ];
  const totalCount =
    data && data.counts
      ? Object.values(data.counts).reduce((a, b) => a + b, 0)
      : 0;

  return (
    <Popover open={open && q.length >= 2} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative flex-1 max-w-[360px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#6B7B7C" }}
          />
          <input
            data-testid={`topbar-search-${app}`}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => q.length >= 2 && setOpen(true)}
            placeholder={meta.searchPh}
            className="bc-input pl-9"
            style={{ minHeight: 40 }}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[420px] max-w-[92vw] p-1 bc-card border-0"
        style={{ maxHeight: 520, overflowY: "auto" }}
      >
        {!data && (
          <div
            className="py-4 text-center text-[13px]"
            style={{ color: "#6B7B7C" }}
          >
            Searching…
          </div>
        )}
        {data && totalCount === 0 && (
          <div
            className="py-4 text-center text-[13px]"
            style={{ color: "#6B7B7C" }}
          >
            No matches for "{q}"
          </div>
        )}
        {data &&
          GROUPS.map(([key, label, hrefFn, titleFn, subFn]) => {
            const rows = data[key] || [];
            if (rows.length === 0) return null;
            const total = data.counts?.[key] ?? rows.length;
            return (
              <div key={key} className="py-1">
                <div
                  className="text-[10.5px] font-bold uppercase tracking-widest px-3 pt-2 pb-1"
                  style={{ color: "#6B7B7C" }}
                >
                  {label} · {total}
                </div>
                {rows.map((r) => (
                  <button
                    key={r.id}
                    data-testid={`search-result-${key}-${r.id}`}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F4F6F7] min-w-0 flex flex-col"
                    onClick={() => go(hrefFn(r))}
                  >
                    <div
                      title={titleFn(r)}
                      className="text-[13.5px] font-semibold truncate"
                      style={{ color: "#333333" }}
                    >
                      {titleFn(r)}
                    </div>
                    <div
                      title={subFn(r) || ""}
                      className="text-[11.5px] truncate"
                      style={{ color: "#6B7B7C" }}
                    >
                      {subFn(r) || "—"}
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
      </PopoverContent>
    </Popover>
  );
}
