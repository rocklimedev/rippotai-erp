import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./app-dashboard.css";
import {
  Plus,
  X,
  Lock,
  Check,
  RefreshCw,
  GripVertical,
  LayoutGrid,
  RotateCcw,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { APP_META } from "@/config/appNav";
import { ProjectPicker } from "@/pages/site-ops/siteProjects";
import { WIDGETS as WIDGET_COMPONENTS } from "@/widgets/registry";
import { Button, EmptyState, Pill, SearchInput } from "@/components/inos";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useGetDashboardQuery,
  useGetDashboardLibraryQuery,
  useSaveDashboardMutation,
  useResetDashboardMutation,
} from "../../api/reports/dashboard.api";


const COLS = { lg: 12, md: 6, sm: 1 };
const BREAKPOINTS = { lg: 1000, md: 600, sm: 0 };
const ROW_HEIGHT = 62;
const MARGIN = [16, 16];

const SIZE_TO_HW = {
  small: { w: 3, h: 2 },
  medium: { w: 6, h: 3 },
  large: { w: 6, h: 4 },
  full: { w: 12, h: 4 },
};

const CATEGORY_ORDER = [
  "Recommended",
  "App Data",
  "Project Data",
  "Alerts",
  "Reports",
  "Personal Work",
  "Recently Used",
];

// Per-app primary CTA (create/add). Missing → no button rendered.
const PRIMARY_CTA = {
  boq: { label: "Create BOQ", to: "/boq/new" },
  projects: { label: "Create Project", to: "/projects/new" },
  quotations: { label: "Create Estimate", to: "/quotations/new" },
  vendors: { label: "Add Vendor", to: "/vendors/new" },
  documents: { label: "Add Document", to: "/documents/upload" },
  tasks: { label: "Add Task", to: "/tasks/new" },
};

/* ------------------------------------------------------------ helpers */

const clean = (l = []) =>
  l.map(({ key, x, y, w, h }) => ({
    key,
    x: Math.max(0, Math.round(x) || 0),
    y: Math.max(0, Math.round(y) || 0),
    w: Math.max(1, Math.round(w) || 1),
    h: Math.max(1, Math.round(h) || 1),
  }));

const sig = (l = []) =>
  JSON.stringify(
    clean(l)
      .slice()
      .sort((a, b) => (a.key < b.key ? -1 : 1)),
  );

/** Vertically compact a 12-col layout (same result RGL shows on screen). */
function compact(layout) {
  const sorted = clean(layout).sort((a, b) => a.y - b.y || a.x - b.x);
  const placed = [];
  for (const it of sorted) {
    let y = 0;
    const collides = (yy) =>
      placed.some(
        (p) =>
          it.x < p.x + p.w &&
          it.x + it.w > p.x &&
          yy < p.y + p.h &&
          yy + it.h > p.y,
      );
    while (collides(y)) y += 1;
    placed.push({ ...it, y });
  }
  return placed;
}

/** First gap (top-down, left-right) where a w×h widget fits in 12 cols. */
function firstFreeSlot(layout, w, h) {
  const cols = COLS.lg;
  const maxY = layout.reduce((m, i) => Math.max(m, i.y + i.h), 0);
  const free = (x, y) =>
    !layout.some(
      (p) => x < p.x + p.w && x + w > p.x && y < p.y + p.h && y + h > p.y,
    );
  for (let y = 0; y <= maxY; y += 1) {
    for (let x = 0; x + w <= cols; x += 1) {
      if (free(x, y)) return { x, y, w, h };
    }
  }
  return { x: 0, y: maxY, w, h };
}

function widgetKind(meta, key = "") {
  const k = key.toLowerCase();
  if (meta?.sizes?.length === 1 && meta.sizes[0] === "small") return "stat";
  if (/donut|mix|pie|availability/.test(k)) return "donut";
  if (/trend|chart|bar|volume|variance|progress/.test(k)) return "chart";
  return "list";
}

function constraintsFor(meta, key) {
  const kind = widgetKind(meta, key);
  if (kind === "stat") return { minW: 2, minH: 2, maxH: 4 };
  return { minW: 3, minH: 3 };
}

/** Derive the tablet / phone layouts from the saved desktop layout. */
function deriveLayouts(layout, libraryByKey) {
  const ordered = compact(layout);
  const lg = ordered.map((i) => ({
    i: i.key,
    x: i.x,
    y: i.y,
    w: i.w,
    h: i.h,
    ...constraintsFor(libraryByKey[i.key], i.key),
  }));
  const md = ordered.map((i) => {
    const w = i.w >= 5 ? 6 : 3;
    return {
      i: i.key,
      x: w === 6 ? 0 : i.x >= 6 ? 3 : 0,
      y: i.y,
      w,
      h: i.h,
    };
  });
  let y = 0;
  const sm = ordered.map((i) => {
    const out = { i: i.key, x: 0, y, w: 1, h: i.h };
    y += i.h;
    return out;
  });
  return { lg, md, sm };
}

/* ------------------------------------------------------------ widget frame */

class WidgetBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.warn(`[dashboard] widget ${this.props.name} crashed`, error);
  }
  render() {
    if (this.state.error) {
      return (
        <WidgetNotice
          title={this.props.name}
          text="This widget couldn't load. Try refreshing the dashboard."
        />
      );
    }
    return this.props.children;
  }
}

function WidgetNotice({ title, text }) {
  return (
    <div className="h-full w-full inos-card p-5 flex flex-col">
      <div
        className="text-[14px] font-semibold truncate"
        style={{ color: "var(--text)" }}
      >
        {title}
      </div>
      <div
        className="flex-1 flex flex-col items-center justify-center gap-2 text-center"
        style={{ color: "var(--text-3)", fontSize: 12.5 }}
      >
        <AlertTriangle size={18} />
        {text}
      </div>
    </div>
  );
}

function WidgetFrame({ item, meta, editing, canRemove, onRemove, isNew }) {
  const Comp = WIDGET_COMPONENTS[item.key];
  const name = meta?.name || item.key.split(".").pop().replace(/_/g, " ");
  return (
    <div
      className={`dash-item${isNew ? " is-new" : ""}`}
      data-testid={`widget-${item.key}`}
      data-grid-key={item.key}
    >
      <div className="dash-item__body" aria-hidden={editing || undefined}>
        <WidgetBoundary name={name}>
          {Comp ? (
            <Comp />
          ) : (
            <WidgetNotice
              title={name}
              text="This widget is no longer available."
            />
          )}
        </WidgetBoundary>
      </div>

      {editing && (
        <div className="dash-item__chrome">
          <div
            className="dash-item__bar dash-drag-handle"
            title="Drag to move"
            data-testid={`widget-handle-${item.key}`}
          >
            <GripVertical aria-hidden />
            <span>{name}</span>
          </div>
          {canRemove ? (
            <button
              type="button"
              className="dash-item__remove"
              onClick={() => onRemove(item.key)}
              data-testid={`widget-remove-${item.key}`}
              title="Remove widget"
              aria-label={`Remove ${name}`}
            >
              <X aria-hidden />
            </button>
          ) : (
            <span
              className="dash-item__lock"
              title="Required widget — can't be removed"
              data-testid={`widget-locked-${item.key}`}
            >
              <Lock aria-hidden />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ widget library */

function MiniPreview({ kind }) {
  const g = "var(--brand)";
  const s = "var(--sage)";
  if (kind === "stat")
    return (
      <svg width="44" height="30" viewBox="0 0 44 30" aria-hidden>
        <rect x="2" y="3" width="18" height="3" rx="1.5" fill={s} />
        <rect x="2" y="13" width="26" height="9" rx="2" fill={g} />
      </svg>
    );
  if (kind === "donut")
    return (
      <svg width="44" height="30" viewBox="0 0 44 30" aria-hidden>
        <circle cx="15" cy="15" r="10" fill="none" stroke={s} strokeWidth="5" />
        <path d="M15 5 A10 10 0 0 1 24.5 18" fill="none" stroke={g} strokeWidth="5" />
        <rect x="30" y="9" width="11" height="3" rx="1.5" fill={s} />
        <rect x="30" y="17" width="8" height="3" rx="1.5" fill={s} />
      </svg>
    );
  if (kind === "chart")
    return (
      <svg width="44" height="30" viewBox="0 0 44 30" aria-hidden>
        {[10, 17, 12, 22, 16, 25].map((h, i) => (
          <rect
            key={i}
            x={3 + i * 7}
            y={28 - h}
            width="5"
            height={h}
            rx="1.5"
            fill={i === 5 ? g : s}
          />
        ))}
      </svg>
    );
  return (
    <svg width="44" height="30" viewBox="0 0 44 30" aria-hidden>
      {[3, 12, 21].map((y) => (
        <g key={y}>
          <rect x="2" y={y} width="26" height="4" rx="2" fill={s} />
          <rect x="34" y={y} width="8" height="4" rx="2" fill={g} />
        </g>
      ))}
    </svg>
  );
}

const SIZE_LABEL = {
  small: "Tile",
  medium: "Half width",
  large: "Half width, tall",
  full: "Full width",
};

function WidgetLibrary({ open, onClose, appName, library, activeKeys, onAdd }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  useEffect(() => {
    if (open) {
      setQ("");
      setCat("all");
    }
  }, [open]);

  const cats = useMemo(() => {
    const present = new Set(library.map((w) => w.category || "Other"));
    const ordered = CATEGORY_ORDER.filter((c) => present.has(c));
    present.forEach((c) => !ordered.includes(c) && ordered.push(c));
    return ordered;
  }, [library]);

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return library.filter((w) => {
      if (cat !== "all" && (w.category || "Other") !== cat) return false;
      if (!needle) return true;
      return `${w.name} ${w.description || ""} ${w.category || ""}`
        .toLowerCase()
        .includes(needle);
    });
  }, [library, q, cat]);

  const groups = useMemo(
    () =>
      cats
        .map((c) => ({
          cat: c,
          items: matches
            .filter((w) => (w.category || "Other") === c)
            .sort(
              (a, b) =>
                Number(activeKeys.has(a.key)) - Number(activeKeys.has(b.key)),
            ),
        }))
        .filter((g) => g.items.length),
    [cats, matches, activeKeys],
  );

  const available = library.filter((w) => !activeKeys.has(w.key)).length;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[460px] sm:max-w-[460px] bg-white flex flex-col gap-0 p-0"
        data-testid="add-widget-drawer"
        style={{ borderLeft: "1px solid var(--line)" }}
      >
        <SheetHeader className="px-5 pt-5 pb-4 text-left space-y-1">
          <SheetTitle
            className="text-[16px] font-bold"
            style={{ color: "var(--text)" }}
          >
            Widget library
          </SheetTitle>
          <SheetDescription
            className="text-[12.5px]"
            style={{ color: "var(--text-3)" }}
          >
            {available} of {library.length} {appName} widgets available to add
          </SheetDescription>
        </SheetHeader>
        <div className="px-5 pb-3 flex flex-col gap-3" data-testid="add-widget-search">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Search widgets…"
          />
          <div className="dash-lib__chips">
            <button
              type="button"
              className="dash-lib__chip"
              aria-pressed={cat === "all"}
              onClick={() => setCat("all")}
            >
              All <em>{library.length}</em>
            </button>
            {cats.map((c) => (
              <button
                key={c}
                type="button"
                className="dash-lib__chip"
                aria-pressed={cat === c}
                onClick={() => setCat(c)}
              >
                {c}{" "}
                <em>
                  {library.filter((w) => (w.category || "Other") === c).length}
                </em>
              </button>
            ))}
          </div>
        </div>
        <div
          className="flex-1 min-h-0 overflow-y-auto px-5 pb-6"
          style={{ borderTop: "1px solid var(--line)" }}
        >
          {groups.map((g) => (
            <div key={g.cat}>
              <div className="dash-lib__group-title">{g.cat}</div>
              {g.items.map((w) => {
                const added = activeKeys.has(w.key);
                return (
                  <div
                    key={w.key}
                    className={`dash-lib__item${added ? " is-added" : ""}`}
                    data-testid={`widget-lib-${w.key}`}
                  >
                    <div className="dash-lib__preview">
                      <MiniPreview kind={widgetKind(w, w.key)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="dash-lib__name">{w.name}</div>
                      {w.description && (
                        <div className="dash-lib__desc">{w.description}</div>
                      )}
                      <div className="dash-lib__meta">
                        <span>{SIZE_LABEL[w.defaultSize] || w.defaultSize}</span>
                        {w.locked_required && (
                          <>
                            <span>·</span>
                            <span>Required</span>
                          </>
                        )}
                      </div>
                    </div>
                    {added ? (
                      <Pill tone="ok" size="sm">
                        Added
                      </Pill>
                    ) : (
                      <Button
                        size="sm"
                        variant="soft"
                        icon={Plus}
                        data-testid={`add-widget-${w.key}`}
                        onClick={() => onAdd(w)}
                      >
                        Add
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {groups.length === 0 && (
            <EmptyState
              icon={LayoutGrid}
              title="No widgets match"
              text="Try a different search or category."
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------ skeleton */

function DashboardSkeleton() {
  const tiles = [
    { c: "span 3", h: 140 },
    { c: "span 3", h: 140 },
    { c: "span 3", h: 140 },
    { c: "span 3", h: 140 },
    { c: "span 6", h: 280 },
    { c: "span 6", h: 280 },
  ];
  return (
    <div
      data-testid="dashboard-loading"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        gap: 16,
        padding: "0 16px",
      }}
    >
      {tiles.map((t, i) => (
        <div
          key={i}
          className="dash-skel p-5 flex flex-col gap-3"
          style={{ gridColumn: t.c, height: t.h }}
        >
          <div className="dash-skel__bar" style={{ width: "45%" }} />
          <div className="flex-1" />
          <div className="dash-skel__bar" style={{ width: "30%", height: 22 }} />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ main */

export default function AppDashboard({ appKey }) {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);
  const [draftHidden, setDraftHidden] = useState([]);
  const [drawer, setDrawer] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);
  const [ready, setReady] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const wrapRef = useRef(null);
  const baselineRef = useRef({ layout: [], hidden: [] });
  const prevAppRef = useRef(appKey);

  const {
    data: dash,
    isLoading: dashLoading,
    isError: dashIsError,
    refetch: refetchDashboard,
  } = useGetDashboardQuery(appKey, { skip: !appKey });
  const { data: lib, isLoading: libLoading } = useGetDashboardLibraryQuery(
    appKey,
    { skip: !appKey },
  );
  const library = useMemo(() => lib?.widgets || [], [lib]);
  const libraryByKey = useMemo(
    () => Object.fromEntries(library.map((w) => [w.key, w])),
    [library],
  );
  const requiredKeys = useMemo(() => dash?.required_keys || [], [dash]);

  const [saveDashboard, { isLoading: saving }] = useSaveDashboardMutation();
  const [resetDashboard, { isLoading: resetting }] =
    useResetDashboardMutation();

  const savedLayout = useMemo(() => dash?.layout || [], [dash]);
  const layout = editing ? draft : savedLayout;
  const activeKeys = useMemo(() => new Set(layout.map((l) => l.key)), [layout]);
  const dirty =
    editing &&
    (sig(draft) !== sig(baselineRef.current.layout) ||
      JSON.stringify([...draftHidden].sort()) !==
        JSON.stringify([...baselineRef.current.hidden].sort()));

  const meta = APP_META[appKey];
  const appName = meta?.name || "App";
  const title = appKey === "boq" ? "Bill of Quantities" : meta?.name || "Dashboard";
  const cta = PRIMARY_CTA[appKey];
  const breakpoint =
    gridWidth >= BREAKPOINTS.lg ? "lg" : gridWidth >= BREAKPOINTS.md ? "md" : "sm";
  const canArrange = breakpoint === "lg";

  // Switching apps always leaves customise mode.
  useEffect(() => {
    if (prevAppRef.current !== appKey) {
      prevAppRef.current = appKey;
      setEditing(false);
      setDrawer(false);
      setReady(false);
    }
  }, [appKey]);

  // Enable grid transitions only after the first paint, so widgets don't
  // animate in from the default width on load.
  useEffect(() => {
    if (!dash || ready) return undefined;
    const t = setTimeout(() => setReady(true), 350);
    return () => clearTimeout(t);
  }, [dash, ready]);

  // Track the grid's breakpoint from its own width (RGL only reports changes).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([entry]) => {
      setGridWidth(Math.floor(entry.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (dashIsError) toast.error("Couldn't load this dashboard");
  }, [dashIsError]);

  const enterEdit = useCallback(() => {
    if (!dash) return;
    const base = compact(dash.layout || []);
    baselineRef.current = {
      layout: base,
      hidden: [...(dash.hidden_keys || [])],
    };
    setDraft(base);
    setDraftHidden([...(dash.hidden_keys || [])]);
    setEditing(true);
  }, [dash]);

  // Deep link: /app?edit=1 (the "Edit Dashboard" menu item). Idempotent, so
  // StrictMode's double effect run is harmless.
  useEffect(() => {
    if (sp.get("edit") !== "1" || !dash) return;
    if (!editing) enterEdit();
    setSp(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("edit");
        return next;
      },
      { replace: true },
    );
  }, [sp, dash, editing, enterEdit, setSp]);

  const handleCancel = useCallback(() => {
    const hadChanges = dirty;
    setEditing(false);
    setDrawer(false);
    if (hadChanges) toast("Changes discarded");
  }, [dirty]);

  const handleSave = useCallback(async () => {
    if (!dirty) {
      setEditing(false);
      setDrawer(false);
      return;
    }
    const payload = compact(draft);
    const hidden = [...draftHidden];
    // Optimistic: leave customise mode straight away; the cache already holds
    // the new layout (see dashboard.api.js).
    setEditing(false);
    setDrawer(false);
    try {
      await saveDashboard({ appKey, layout: payload, hidden_keys: hidden }).unwrap();
      toast.success("Dashboard saved");
    } catch (e) {
      baselineRef.current = {
        layout: compact(savedLayout),
        hidden: dash?.hidden_keys || [],
      };
      setDraft(payload);
      setDraftHidden(hidden);
      setEditing(true);
      const msg = e?.data?.message;
      toast.error(
        Array.isArray(msg) ? msg[0] : msg || "Couldn't save your layout",
        { action: { label: "Retry", onClick: () => handleSaveRef.current?.() } },
      );
    }
  }, [dirty, draft, draftHidden, saveDashboard, appKey, savedLayout, dash]);
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  // Keyboard: Esc cancels, Ctrl/Cmd+S saves (not while the library is open).
  useEffect(() => {
    if (!editing) return undefined;
    const onKey = (e) => {
      if (drawer) return;
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, drawer, handleCancel]);

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // Scroll a newly added widget into view and flash it.
  useEffect(() => {
    if (!newKey) return undefined;
    const t1 = setTimeout(() => {
      document
        .querySelector(`[data-grid-key="${CSS.escape(newKey)}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 260);
    const t2 = setTimeout(() => setNewKey(null), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [newKey]);

  const onLayoutChange = useCallback(
    (current) => {
      // Only the desktop (12-col) arrangement is persisted; tablet/phone
      // layouts are derived from it.
      if (!editing || breakpoint !== "lg") return;
      setDraft((prev) => {
        const next = prev.map((item) => {
          const g = current.find((x) => x.i === item.key);
          return g ? { ...item, x: g.x, y: g.y, w: g.w, h: g.h } : item;
        });
        return sig(next) === sig(prev) ? prev : next;
      });
    },
    [editing, breakpoint],
  );

  const removeWidget = (key) => {
    if (requiredKeys.includes(key)) return;
    const removed = draft.find((l) => l.key === key);
    if (!removed) return;
    setDraft((prev) => prev.filter((l) => l.key !== key));
    setDraftHidden((prev) => [...new Set([...prev, key])]);
    toast(`Removed ${libraryByKey[key]?.name || "widget"}`, {
      action: {
        label: "Undo",
        onClick: () => {
          setDraft((prev) =>
            prev.some((l) => l.key === key) ? prev : [...prev, removed],
          );
          setDraftHidden((prev) => prev.filter((k) => k !== key));
        },
      },
      duration: 5000,
    });
  };

  const addWidget = (w) => {
    if (draft.some((l) => l.key === w.key)) return;
    const size = SIZE_TO_HW[w.defaultSize] || SIZE_TO_HW.small;
    const slot = firstFreeSlot(compact(draft), size.w, size.h);
    setDraft((prev) => [...prev, { key: w.key, ...slot }]);
    setDraftHidden((prev) => prev.filter((k) => k !== w.key));
    setDrawer(false);
    setNewKey(w.key);
    toast.success(`Added ${w.name}`);
  };

  const restoreDefaultDraft = () => {
    const defaults = dash?.default_layout || [];
    const present = new Set(defaults.map((d) => d.key));
    const extras = requiredKeys
      .filter((k) => !present.has(k))
      .map((k) => {
        const size = SIZE_TO_HW[libraryByKey[k]?.defaultSize] || SIZE_TO_HW.small;
        return { key: k, x: 0, y: 999, ...size };
      });
    setDraft(compact([...defaults, ...extras]));
    setDraftHidden([]);
    toast("Default layout restored — save to keep it", {
      action: {
        label: "Undo",
        onClick: () => {
          setDraft(baselineRef.current.layout);
          setDraftHidden(baselineRef.current.hidden);
        },
      },
    });
  };

  const restoreDefaultNow = async () => {
    try {
      await resetDashboard(appKey).unwrap();
      toast.success("Default layout restored");
    } catch {
      toast.error("Couldn't restore the default layout");
    }
  };

  const handleManualRefresh = () => {
    refetchDashboard();
    window.dispatchEvent(
      new CustomEvent("bc:dashboard-refresh", {
        detail: { app: appKey, manual: true },
      }),
    );
    toast.success("Dashboard refreshed");
  };

  const layouts = useMemo(
    () => deriveLayouts(layout, libraryByKey),
    [layout, libraryByKey],
  );

  const loading = (dashLoading || libLoading) && !dash;
  const isEmpty = !loading && layout.length === 0;

  return (
    <div data-testid={`app-dashboard-${appKey}`} ref={wrapRef}>
      {/* Header */}
      <div
        className="flex items-center justify-between mb-5 gap-3 flex-wrap px-4"
        data-testid={`dashboard-header-${appKey}`}
      >
        <h1 title={title} className="inos-title truncate min-w-0" style={{ fontSize: 30 }}>
          {title}
        </h1>
        {!editing && (
          <div className="flex items-center gap-2 shrink-0">
            {appKey === "siteOperations" && (
              // Site Operations widgets follow ?project= (widgets/siteops useDash)
              <div style={{ width: 240 }} data-testid="dashboard-project-filter">
                <ProjectPicker
                  value={sp.get("project") || ""}
                  onChange={(v) =>
                    setSp(
                      (prev) => {
                        const next = new URLSearchParams(prev);
                        if (v) next.set("project", v);
                        else next.delete("project");
                        return next;
                      },
                      { replace: true },
                    )
                  }
                />
              </div>
            )}
            {!isEmpty && !loading && (
              <Button
                variant="secondary"
                icon={RefreshCw}
                onClick={handleManualRefresh}
                title="Refresh dashboard data"
                aria-label="Refresh"
                data-testid={`dashboard-refresh-${appKey}`}
              />
            )}
            {!loading && dash && (
              <Button
                variant="secondary"
                icon={SlidersHorizontal}
                onClick={enterEdit}
                data-testid="dashboard-customise-btn"
              >
                Customise
              </Button>
            )}
            {cta && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => navigate(cta.to)}
                data-testid={`dashboard-cta-${appKey}`}
              >
                {cta.label}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Customise toolbar */}
      {editing && (
        <div className="dash-editbar mx-4" data-testid="dashboard-edit-bar">
          <div className="dash-editbar__text">
            <span className="inos-icon-tile" aria-hidden>
              <LayoutGrid size={16} />
            </span>
            <div className="min-w-0 flex flex-col">
              <span className="dash-editbar__title">Customising dashboard</span>
              <span className="dash-editbar__hint">
                {canArrange
                  ? "Drag a widget by its handle · resize from the bottom-right corner"
                  : "Widen the window to move or resize widgets"}
              </span>
            </div>
            {dirty && (
              <span data-testid="dashboard-dirty">
                <Pill tone="warn" size="sm">
                  Unsaved changes
                </Pill>
              </span>
            )}
          </div>
          <div className="dash-editbar__actions">
            <Button
              variant="soft"
              size="sm"
              icon={Plus}
              onClick={() => setDrawer(true)}
              data-testid="dashboard-add-widget"
            >
              Add widget
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={restoreDefaultDraft}
              data-testid="dashboard-reset-btn"
              title="Restore the default layout for this app"
            >
              Reset
            </Button>
            <span className="dash-editbar__divider" />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              disabled={saving}
              data-testid="dashboard-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Check}
              onClick={() => handleSaveRef.current()}
              disabled={saving}
              data-testid="dashboard-done-btn"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}

      {dashIsError && !dash ? (
        <div className="px-4">
          <div className="inos-card" data-testid="dashboard-error">
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load this dashboard"
              text="Check your connection and try again."
              action={
                <Button variant="secondary" icon={RefreshCw} onClick={refetchDashboard}>
                  Retry
                </Button>
              }
            />
          </div>
        </div>
      ) : loading ? (
        <DashboardSkeleton />
      ) : isEmpty ? (
        <div className="px-4">
          <div className="inos-card" data-testid="dashboard-empty">
            <EmptyState
              icon={LayoutGrid}
              title={editing ? "No widgets yet" : "Your dashboard is empty"}
              text={`Add widgets to see your ${appName} data at a glance.`}
              action={
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Button
                    variant="primary"
                    icon={Plus}
                    onClick={() => {
                      if (!editing) enterEdit();
                      setDrawer(true);
                    }}
                  >
                    Add widget
                  </Button>
                  <Button
                    variant="secondary"
                    icon={RotateCcw}
                    onClick={editing ? restoreDefaultDraft : restoreDefaultNow}
                    disabled={resetting}
                  >
                    {resetting ? "Restoring…" : "Restore default layout"}
                  </Button>
                </div>
              }
            />
          </div>
        </div>
      ) : !gridWidth ? (
        <DashboardSkeleton />
      ) : (
        <GridLayout
          key={breakpoint}
          width={gridWidth}
          className={`dash-grid${ready ? " is-ready" : ""}${editing ? " is-editing" : ""}`}
          layout={layouts[breakpoint]}
          cols={COLS[breakpoint]}
          rowHeight={ROW_HEIGHT}
          margin={MARGIN}
          compactType="vertical"
          useCSSTransforms
          isDraggable={editing && canArrange}
          isResizable={editing && canArrange}
          draggableHandle=".dash-drag-handle"
          draggableCancel=".dash-item__remove, .dash-item__lock"
          resizeHandles={["se"]}
          onLayoutChange={onLayoutChange}
        >
          {layout.map((item) => (
            <div key={item.key}>
              <WidgetFrame
                item={item}
                meta={libraryByKey[item.key]}
                editing={editing}
                canRemove={!requiredKeys.includes(item.key)}
                onRemove={removeWidget}
                isNew={newKey === item.key}
              />
            </div>
          ))}
        </GridLayout>
      )}

      <WidgetLibrary
        open={drawer}
        onClose={() => setDrawer(false)}
        appName={appName}
        library={library}
        activeKeys={activeKeys}
        onAdd={addWidget}
      />
    </div>
  );
}
