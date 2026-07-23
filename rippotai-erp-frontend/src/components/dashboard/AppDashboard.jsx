import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Plus, X, Lock, Check, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { APP_ICONS } from "./AppIcons";
import { APP_META } from "@/config/appNav";
import { WIDGETS as WIDGET_COMPONENTS } from "@/widgets/registry";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useGetDashboardQuery,
  useGetDashboardLibraryQuery,
  useSaveDashboardMutation,
  useResetDashboardMutation,
} from "../../api/dashboard.api";

const RGL = WidthProvider(Responsive);

const SIZE_TO_HW = {
  small: { w: 3, h: 2 },
  medium: { w: 6, h: 3 },
  large: { w: 6, h: 4 },
  full: { w: 12, h: 4 },
};

function firstAvailableSlot(layout, w, h) {
  // Simple: append at bottom, x=0
  const maxY = layout.reduce((m, i) => Math.max(m, i.y + i.h), 0);
  return { x: 0, y: maxY, w, h };
}

/* Dashboard header (Add Widget/Cancel/Done only appear in edit mode) */
function DashboardHeader({
  appKey,
  editing,
  dirty,
  saving,
  onCancel,
  onSave,
  onAddWidget,
}) {
  const Icon = APP_ICONS[appKey];
  const meta = APP_META[appKey];
  if (!editing) {
    return null; // no page hero in normal mode — header dropdowns communicate context
  }
  // Edit mode floating action bar
  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-11 h-11 bg-white rounded-xl bc-card flex items-center justify-center"
          style={{ padding: 0 }}
        >
          <div style={{ width: 32, height: 32 }}>
            <Icon />
          </div>
        </div>
        <div>
          <div className="eyebrow">Editing dashboard</div>
          <h1
            className="text-[22px] font-semibold"
            style={{ color: "#333333", fontFamily: "Poppins" }}
          >
            Your {meta?.name || "App"} dashboard
          </h1>
        </div>
      </div>
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bc-card px-3 py-2 flex items-center gap-2"
        data-testid="dashboard-edit-bar"
      >
        {dirty && (
          <span
            className="text-[12px] font-semibold px-2 py-1 rounded-full"
            style={{ border: "1px solid #1F453B", color: "#333333" }}
            data-testid="dashboard-dirty"
          >
            Unsaved changes
          </span>
        )}
        <button
          data-testid="dashboard-add-widget"
          onClick={onAddWidget}
          className="bc-btn-secondary"
          style={{ minHeight: 36, padding: "0 12px" }}
        >
          <Plus size={14} /> Add Widget
        </button>
        <button
          data-testid="dashboard-cancel-btn"
          onClick={onCancel}
          disabled={saving}
          className="bc-btn-secondary"
          style={{ minHeight: 36, padding: "0 12px" }}
        >
          Cancel
        </button>
        <button
          data-testid="dashboard-done-btn"
          onClick={onSave}
          disabled={saving}
          className="bc-btn-primary"
          style={{ minHeight: 36, padding: "0 14px" }}
        >
          <Check size={14} /> {saving ? "Saving…" : "Done"}
        </button>
      </div>
    </>
  );
}

/* Add Widget drawer */
function AddWidgetDrawer({ open, onClose, appKey, library, layout, onAdd }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const active = new Set((layout || []).map((i) => i.key));
  const cats = [
    "all",
    "Recommended",
    "Recently Used",
    "App Data",
    "Project Data",
    "Personal Work",
    "Alerts",
    "Reports",
  ];
  const filtered = (library || []).filter((w) => {
    if (tab !== "all" && (w.category || "") !== tab) return false;
    if (
      q &&
      !`${w.name} ${w.description || ""}`
        .toLowerCase()
        .includes(q.toLowerCase())
    )
      return false;
    return true;
  });
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-[500px] sm:max-w-none bg-white border-l border-[#B5C4B6]/60"
        data-testid="add-widget-drawer"
      >
        <SheetHeader>
          <SheetTitle className="text-[16px] font-bold text-[#333333]">
            Add Widget
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex items-center gap-2 h-10 px-3 rounded-lg border border-[#B5C4B6] bg-white">
          <Search size={14} className="text-[#B5C4B6]" />
          <input
            data-testid="add-widget-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search widgets…"
            className="flex-1 text-[13px] outline-none placeholder:text-[#B5C4B6]"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setTab(c)}
              className={`h-7 px-2.5 rounded-full text-[11px] font-semibold border ${tab === c ? "bg-[#1F453B] text-white border-[#1F453B]" : "bg-white text-[#333333]/70 border-[#B5C4B6] hover:bg-[#D8E0DA]/60]"}`}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
        <div className="mt-3 flex-1 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
          {filtered.map((w) => {
            const already = active.has(w.key);
            return (
              <div
                key={w.key}
                className="p-3 border border-[#B5C4B6]/50 rounded-xl mb-2 flex items-start gap-3"
                data-testid={`widget-lib-${w.key}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold text-[#333333]">
                    {w.name}
                  </div>
                  {w.description && (
                    <div className="text-[11.5px] text-[#6B7B7C] mt-0.5">
                      {w.description}
                    </div>
                  )}
                  <div className="mt-1.5 flex gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-[#B5C4B6]">
                    <span>{w.category}</span>
                    <span>·</span>
                    <span>{w.sizes.join(" / ")}</span>
                    {w.locked_required && (
                      <>
                        <span>·</span>
                        <span className="text-[#333333]">Required</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  disabled={already}
                  data-testid={`add-widget-${w.key}`}
                  onClick={() => onAdd(w)}
                  className={`h-8 px-3 rounded-lg text-[11.5px] font-semibold shrink-0 ${already ? "bg-[#D8E0DA]] text-[#B5C4B6] cursor-not-allowed" : "bg-[#1F453B] text-white hover:opacity-90"}`}
                >
                  {already ? "Added" : "Add"}
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-[12.5px] text-[#B5C4B6]">
              No widgets match.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* Reset Modal */
function ResetModal({ open, onClose, onConfirm, resetting }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="bg-white border border-[#B5C4B6] max-w-[440px]"
        data-testid="reset-modal"
      >
        <DialogHeader>
          <DialogTitle className="text-[16px] font-bold text-[#333333]">
            Reset Dashboard?
          </DialogTitle>
        </DialogHeader>
        <p className="text-[13px] text-[#333333]/70">
          Reset this dashboard to the default layout? Your personal arrangement
          and hidden widgets will be removed.
        </p>
        <DialogFooter>
          <button
            onClick={onClose}
            disabled={resetting}
            className="h-9 px-3 rounded-lg bg-white border border-[#B5C4B6] text-[12.5px] font-semibold text-[#333333] hover:bg-[#D8E0DA]/60]"
          >
            Cancel
          </button>
          <button
            data-testid="reset-confirm-btn"
            onClick={onConfirm}
            disabled={resetting}
            className="h-9 px-3.5 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold hover:opacity-90"
          >
            {resetting ? "Resetting…" : "Reset"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* Widget wrapper with edit-mode controls */
function WidgetWrapper({ item, meta, editing, canRemove, onRemove }) {
  const Comp = WIDGET_COMPONENTS[item.key];
  return (
    <div
      className={`relative h-full ${editing ? "widget-jiggle" : ""}`}
      data-testid={`widget-${item.key}`}
    >
      {editing && (
        <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-[#B5C4B6] pointer-events-none z-0" />
      )}
      {editing && meta?.locked_required && (
        <div
          className="absolute -top-2 -left-2 z-20 w-6 h-6 rounded-full bg-white border border-[#1F453B] flex items-center justify-center"
          title="Required widget"
        >
          <Lock size={11} className="text-[#333333]" />
        </div>
      )}
      {editing && (
        <button
          disabled={!canRemove}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.key);
          }}
          data-testid={`widget-remove-${item.key}`}
          className={`absolute -top-2 -right-2 z-20 w-6 h-6 rounded-full flex items-center justify-center ${canRemove ? "bg-[#1F453B] text-white hover:opacity-90" : "bg-[#1F453B]/20 text-white cursor-not-allowed"}`}
          title={canRemove ? "Remove" : "Required widget — cannot be removed"}
        >
          <X size={12} />
        </button>
      )}
      <div className="h-full">
        {Comp ? (
          <Comp />
        ) : (
          <div className="p-4 text-[12px] text-[#B5C4B6] bg-white rounded-2xl border border-[#B5C4B6]/50">
            Unknown widget
          </div>
        )}
      </div>

      {/* NEW: swallow clicks on widget content while editing */}
      {editing && (
        <div
          className="absolute inset-0 z-10 cursor-move"
          data-testid={`widget-edit-overlay-${item.key}`}
          onClickCapture={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      )}
    </div>
  );
}

/* Main AppDashboard */
export default function AppDashboard({ appKey }) {
  const [layout, setLayout] = useState([]);
  const [hidden, setHidden] = useState([]);
  const [requiredKeys, setRequiredKeys] = useState([]);
  const [defaultLayout, setDefaultLayout] = useState([]);
  const [editing, setEditing] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [sp, setSp] = useSearchParams();
  const savedRef = useRef({ layout: [], hidden_keys: [] });
  const undoTimerRef = useRef(null);
  // Tracks whether we've hydrated local state for the CURRENT appKey at
  // least once — lets a background refetch/poll update local state safely
  // before the user starts editing, without ever clobbering an in-progress
  // edit once they have.
  const hydratedRef = useRef(false);

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
  const library = lib?.widgets || [];

  const [saveDashboard, { isLoading: saving }] = useSaveDashboardMutation();
  const [resetDashboard, { isLoading: resetting }] =
    useResetDashboardMutation();

  const loading = (dashLoading || libLoading) && !hydratedRef.current;

  // Reset hydration when switching apps, so the new app's server data is
  // guaranteed to populate local state even if we're mid-"edit=1" deep link.
  useEffect(() => {
    hydratedRef.current = false;
    setEditing(false);
  }, [appKey]);

  // Hydrate local editable state from the server. Skips while the user is
  // actively editing (after the first hydration) so a background refetch
  // never overwrites an unsaved drag/resize/add/remove.
  useEffect(() => {
    if (!dash) return;
    if (hydratedRef.current && editing) return;
    setLayout(dash.layout || []);
    setHidden(dash.hidden_keys || []);
    setRequiredKeys(dash.required_keys || []);
    setDefaultLayout(dash.default_layout || []);
    savedRef.current = {
      layout: dash.layout || [],
      hidden_keys: dash.hidden_keys || [],
    };
    hydratedRef.current = true;
  }, [dash, editing]);

  useEffect(() => {
    if (dashIsError) toast.error("Failed to load dashboard");
  }, [dashIsError]);

  useEffect(() => {
    if (sp.get("edit") === "1") {
      setEditing(true);
      sp.delete("edit");
      setSp(sp, { replace: true });
    }
    // eslint-disable-next-line
  }, [sp]);

  // Keyboard shortcuts (Esc / Cmd+S)
  useEffect(() => {
    const onKey = (e) => {
      if (!editing) return;
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line
  }, [editing, layout, hidden]);

  const libraryByKey = useMemo(
    () => Object.fromEntries((library || []).map((w) => [w.key, w])),
    [library],
  );
  const rgLayout = useMemo(
    () =>
      layout.map((i) => ({
        i: i.key,
        x: i.x,
        y: i.y,
        w: i.w,
        h: i.h,
        static: !editing,
      })),
    [layout, editing],
  );
  const dirty = useMemo(
    () =>
      JSON.stringify(layout) !== JSON.stringify(savedRef.current.layout) ||
      JSON.stringify([...hidden].sort()) !==
        JSON.stringify([...savedRef.current.hidden_keys].sort()),
    [layout, hidden],
  );

  const onGridChange = (rgl) => {
    if (!editing) return;
    setLayout((prev) =>
      prev.map((item) => {
        const g = rgl.find((x) => x.i === item.key);
        return g ? { ...item, x: g.x, y: g.y, w: g.w, h: g.h } : item;
      }),
    );
  };

  const removeWidget = (key) => {
    if (requiredKeys.includes(key)) return;
    const removed = layout.find((l) => l.key === key);
    setLayout((prev) => prev.filter((l) => l.key !== key));
    setHidden((prev) => [...new Set([...prev, key])]);
    // Undo toast
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    toast("Widget removed", {
      action: {
        label: "Undo",
        onClick: () => {
          setLayout((prev) => [...prev, removed]);
          setHidden((prev) => prev.filter((k) => k !== key));
        },
      },
      duration: 5000,
    });
  };

  const addWidget = (w) => {
    const size = SIZE_TO_HW[w.defaultSize] || SIZE_TO_HW.small;
    const slot = firstAvailableSlot(layout, size.w, size.h);
    setLayout((prev) => [...prev, { key: w.key, ...slot }]);
    setHidden((prev) => prev.filter((k) => k !== w.key));
    setDrawer(false);
    toast.success(`Added ${w.name}`);
  };

  const handleSave = async () => {
    try {
      await saveDashboard({ appKey, layout, hidden_keys: hidden }).unwrap();
      savedRef.current = {
        layout: JSON.parse(JSON.stringify(layout)),
        hidden_keys: [...hidden],
      };
      setEditing(false);
      toast.success("Dashboard saved");
    } catch (e) {
      const detail = e?.data?.detail || "Save failed — retry";
      toast.error(detail);
    }
  };

  const handleCancel = () => {
    setLayout(savedRef.current.layout);
    setHidden(savedRef.current.hidden_keys);
    setEditing(false);
  };

  const handleReset = async () => {
    try {
      const r = await resetDashboard(appKey).unwrap();
      const newLayout = r.layout || [];
      setLayout(newLayout);
      setHidden([]);
      savedRef.current = { layout: newLayout, hidden_keys: [] };
      setEditing(false);
      setResetOpen(false);
      toast.success("Reset to default");
    } catch {
      toast.error("Reset failed");
    }
  };

  if (loading)
    return (
      <div className="py-16 text-center text-[13px] text-[#B5C4B6]">
        Loading dashboard…
      </div>
    );

  const isEmpty = layout.length === 0;
  const handleManualRefresh = () => {
    refetchDashboard();
    window.dispatchEvent(
      new CustomEvent("bc:dashboard-refresh", {
        detail: { app: appKey, manual: true },
      }),
    );
    toast.success("Refreshed");
  };

  // Per-app primary CTA (create/add). null → no button rendered.
  const PRIMARY_CTA = {
    boq: { label: "Create BOQ", to: "/boq/new" },
    projects: { label: "Create Project", to: "/projects/new" },
    quotations: { label: "Create Estimate", to: "/quotations/new" },
    vendors: { label: "Add Vendor", to: "/vendors/new" },
    documents: { label: "Add Document", to: "/documents/upload" },
    tasks: { label: "Add Task", to: "/tasks/new" },
  };
  const cta = PRIMARY_CTA[appKey];
  const meta = APP_META[appKey];

  return (
    <div data-testid={`app-dashboard-${appKey}`}>
      <DashboardHeader
        appKey={appKey}
        editing={editing}
        dirty={dirty}
        saving={saving}
        onCancel={handleCancel}
        onSave={handleSave}
        onAddWidget={() => setDrawer(true)}
      />

      {!editing && (
        <div
          className="flex items-center justify-between mb-4 gap-3 flex-wrap"
          data-testid={`dashboard-header-${appKey}`}
        >
          <div className="min-w-0">
            <h1
              title={meta?.name}
              className="text-[36px] font-bold text-[#333333] truncate"
              style={{ fontFamily: "Poppins" }}
            >
              {appKey === "boq"
                ? "Bill of Quantities"
                : meta?.name || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isEmpty && (
              <button
                data-testid={`dashboard-refresh-${appKey}`}
                onClick={handleManualRefresh}
                title="Refresh dashboard data"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[rgba(31,69,59,0.14)] bg-white text-[#333333] hover:bg-[#F4F6F7] transition-colors group"
                aria-label="Refresh"
              >
                <RefreshCw size={15} className="group-active:animate-spin" />
              </button>
            )}
            {cta && (
              <button
                data-testid={`dashboard-cta-${appKey}`}
                onClick={() => window.location.assign(cta.to)}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#1F453B" }}
              >
                <Plus size={14} /> {cta.label}
              </button>
            )}
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="bg-white rounded-2xl border border-[#B5C4B6]/50 p-12 text-center">
          <h2 className="text-[20px] font-bold text-[#333333]">
            Your dashboard is empty
          </h2>
          <p className="text-[13px] text-[#6B7B7C] mt-1">
            Add widgets to see your {APP_META[appKey]?.name || "app"} data at a
            glance.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              onClick={() => setDrawer(true)}
              className="h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold hover:opacity-90"
            >
              Add Widget
            </button>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="h-10 px-4 rounded-xl bg-white border border-[#B5C4B6] text-[#333333] text-[13px] font-semibold hover:bg-[#D8E0DA]/60]"
            >
              {resetting ? "Restoring…" : "Restore Default Layout"}
            </button>
          </div>
        </div>
      ) : (
        <div className={editing ? "relative pt-1" : "relative"}>
          {editing && (
            <div className="absolute inset-0 bg-[#D8E0DA]/40] pointer-events-none rounded-lg" />
          )}
          <RGL
            className="layout"
            layouts={{ lg: rgLayout, md: rgLayout, sm: rgLayout }}
            breakpoints={{ lg: 1024, md: 768, sm: 0 }}
            cols={{ lg: 12, md: 6, sm: 1 }}
            rowHeight={62}
            margin={[16, 16]}
            isDraggable={editing}
            isResizable={editing}
            onLayoutChange={onGridChange}
            draggableCancel="button, a, input, textarea"
          >
            {layout.map((item) => (
              <div key={item.key}>
                <WidgetWrapper
                  item={item}
                  meta={libraryByKey[item.key]}
                  editing={editing}
                  canRemove={!requiredKeys.includes(item.key)}
                  onRemove={removeWidget}
                />
              </div>
            ))}
          </RGL>
        </div>
      )}

      <AddWidgetDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        appKey={appKey}
        library={library}
        layout={layout}
        onAdd={addWidget}
      />
      <ResetModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleReset}
        resetting={resetting}
      />
    </div>
  );
}
