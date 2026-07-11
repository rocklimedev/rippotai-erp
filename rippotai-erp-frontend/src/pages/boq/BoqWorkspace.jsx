import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import {
  ArrowLeft,
  Plus,
  Copy,
  Download,
  FileText,
  MoreHorizontal,
  Send,
  CheckCircle2,
  Save,
  Loader2,
  Cloud,
  CloudOff,
  GitBranch,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  GripVertical,
  Lock,
  Sparkles,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const UNITS = [
  "Sq.ft.",
  "Sq.m.",
  "Rft.",
  "Nos.",
  "Set",
  "Lump",
  "Kg",
  "Cu.ft.",
  "Cu.m.",
  "Ltr.",
  "Bag",
  "Roll",
];

/* --------- Autosave chip --------- */
function SaveChip({ state }) {
  if (state === "saving")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#333333]">
        <Loader2 size={12} className="animate-spin" /> Saving…
      </span>
    );
  if (state === "saved")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#333333]">
        <Cloud size={12} /> All changes saved
      </span>
    );
  if (state === "error")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#333333]">
        <CloudOff size={12} /> Save failed — Retry
      </span>
    );
  return null;
}

/* --------- Status chip --------- */
const STATUS_META = {
  draft: { label: "Draft", bg: "#B5C4B6", fg: "#6B7B7C" },
  in_progress: { label: "In Progress", bg: "#EAEEF0", fg: "#1F453B" },
  awaiting_approval: {
    label: "Awaiting Approval",
    bg: "#EAEEF0",
    fg: "#1F453B",
  },
  returned: { label: "Returned", bg: "#EAEEF0", fg: "#1F453B" },
  approved: { label: "Approved", bg: "#EAEEF0", fg: "#1F453B" },
  final: { label: "Final", bg: "#EAEEF0", fg: "#1F453B" },
  archived: { label: "Archived", bg: "#B5C4B6", fg: "#6B7B7C" },
};
function StatusChip({ status }) {
  const s = STATUS_META[status] || STATUS_META.draft;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}

/* --------- Editable cell --------- */
function EditableCell({
  value,
  onChange,
  type = "text",
  disabled,
  align = "left",
  format,
  className = "",
  testid,
  onLockedEdit,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);
  const commit = () => {
    setEditing(false);
    const val = type === "number" ? (draft === "" ? 0 : Number(draft)) : draft;
    if (val !== value) onChange(val);
  };
  return (
    <td
      className={`boq-cell ${!disabled ? "editable" : "boq-cell-locked"} ${editing ? "editing" : ""} ${className}`}
      style={{ textAlign: align }}
      onClick={() => {
        if (disabled) {
          onLockedEdit && onLockedEdit();
          return;
        }
        setEditing(true);
      }}
      data-testid={testid}
    >
      {editing ? (
        <input
          autoFocus
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              setDraft(value ?? "");
              setEditing(false);
            }
          }}
          style={{ textAlign: align }}
        />
      ) : (
        <span
          title={
            value !== "" && value != null
              ? String(format ? format(value) : value)
              : undefined
          }
          className="block max-w-full truncate"
        >
          {format ? (
            format(value)
          ) : value === "" || value == null ? (
            <span className="text-[#B5C4B6]">—</span>
          ) : (
            String(value)
          )}
        </span>
      )}
    </td>
  );
}

/* --------- Locked Edit Modal ---------
 * Opens whenever a user tries to modify an approved / locked BOQ. Only
 * path forward is "Create New Version". */
function LockedEditModal({
  open,
  onOpenChange,
  boqNumber,
  version,
  onCreateNewVersion,
  busy,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="locked-edit-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#333333]">
            <Lock size={16} /> This BOQ is approved &amp; locked
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-[#333333]">
              {boqNumber || `V${version}`}
            </span>{" "}
            has been approved. Approved BOQs cannot be edited — no line-item,
            category, terms, misc %, additional charge, fee, delete, reorder or
            duplicate change is allowed.
            <br />
            <br />
            To change anything, create a new version. A fresh draft (next
            version number) will open with all the same content, ready to edit.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 rounded-xl border border-[#B5C4B6] text-[13px] font-semibold text-[#6B7B7C]"
            data-testid="locked-edit-cancel"
          >
            Close
          </button>
          <button
            onClick={onCreateNewVersion}
            disabled={busy}
            className="h-10 px-4 rounded-xl bg-[#1F453B] hover:bg-[#1F453B] text-white text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-60"
            data-testid="locked-edit-create-version"
          >
            {busy ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <GitBranch size={13} />
            )}{" "}
            Create New Version
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------- Sortable Item Row --------- */
function ItemRow({
  item,
  sno,
  disabled,
  selected,
  onSelect,
  onPatch,
  onDelete,
  onDuplicate,
  onOpenDetail,
  onMoveUp,
  onMoveDown,
  onLockedEdit,
  onToggleHide,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : item.hidden ? 0.45 : 1,
  };
  const isL = item.calc_type === "L";
  const missing = !item.unit || (!isL && (!item.quantity || !item.rate));

  const guardedFire = (fn) => () => {
    if (disabled) {
      onLockedEdit();
      return;
    }
    fn();
  };
  const openMenuRef = useRef(null);
  const openMenu = () => openMenuRef.current?.click();

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`bg-white border-b border-[#B5C4B6] group ${missing ? "boq-row-attention" : ""} ${item.hidden ? "boq-row-hidden" : ""}`}
      data-testid={`item-row-${item.id}`}
    >
      {/* Handle cell */}
      <td className="boq-cell text-center w-11 relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              ref={openMenuRef}
              tabIndex={0}
              onDoubleClick={openMenu}
              onContextMenu={(e) => {
                e.preventDefault();
                openMenu();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openMenu();
                }
              }}
              className="inline-flex items-center justify-center p-1 rounded hover:bg-[#EAEEF0] focus:bg-[#EAEEF0] outline-none cursor-context-menu"
              title="Row actions (click, right-click, double-click, or press Enter)"
              data-testid={`item-handle-${item.id}`}
              {...(!disabled ? { ...attributes, ...listeners } : {})}
            >
              <GripVertical size={14} className="text-[#6B7B7C]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-44"
            data-testid={`item-menu-${item.id}`}
          >
            <DropdownMenuItem
              onSelect={() => onSelect(item.id, !selected)}
              data-testid={`item-menu-select-${item.id}`}
            >
              <CheckCircle2 size={13} className="mr-2" />{" "}
              {selected ? "Deselect" : "Select"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={guardedFire(() => onDuplicate(item.id))}
              data-testid={`item-menu-copy-${item.id}`}
            >
              <Copy size={13} className="mr-2" /> Copy
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={guardedFire(() => onToggleHide(item.id, !item.hidden))}
              data-testid={`item-menu-hide-${item.id}`}
            >
              {item.hidden ? (
                <>
                  <Eye size={13} className="mr-2" /> Show
                </>
              ) : (
                <>
                  <EyeOff size={13} className="mr-2" /> Hide
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOpenDetail(item)}>
              <Eye size={13} className="mr-2" /> Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={guardedFire(() => onDelete(item.id))}
              className="text-[#333333]"
              data-testid={`item-menu-delete-${item.id}`}
            >
              <Trash2 size={13} className="mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
      <td className="boq-cell text-center text-[#B5C4B6] w-10">{sno}</td>
      <EditableCell
        value={item.description}
        onChange={(v) => onPatch({ description: v })}
        disabled={disabled}
        onLockedEdit={onLockedEdit}
        testid={`item-desc-${item.id}`}
        className="min-w-[280px]"
      />
      <EditableCell
        value={item.location}
        onChange={(v) => onPatch({ location: v })}
        disabled={disabled}
        onLockedEdit={onLockedEdit}
        className="w-[120px]"
      />
      <td
        className="boq-cell w-[92px]"
        onClick={() => disabled && onLockedEdit()}
      >
        {disabled ? (
          <span className="opacity-80">{item.unit || "—"}</span>
        ) : (
          <select
            className="w-full bg-transparent outline-none"
            value={item.unit || ""}
            onChange={(e) => onPatch({ unit: e.target.value })}
            data-testid={`item-unit-${item.id}`}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        )}
      </td>
      {isL ? (
        <td className="boq-cell text-center text-[#B5C4B6] w-[80px]">—</td>
      ) : (
        <EditableCell
          value={item.quantity}
          type="number"
          onChange={(v) => onPatch({ quantity: v })}
          disabled={disabled}
          onLockedEdit={onLockedEdit}
          align="right"
          className="w-[80px]"
          testid={`item-qty-${item.id}`}
        />
      )}
      {isL ? (
        <td className="boq-cell text-[#B5C4B6] italic text-right w-[100px]">
          Lump sum
        </td>
      ) : (
        <EditableCell
          value={item.rate}
          type="number"
          onChange={(v) => onPatch({ rate: v })}
          disabled={disabled}
          onLockedEdit={onLockedEdit}
          align="right"
          className="w-[100px]"
          format={(v) => formatINR(v)}
          testid={`item-rate-${item.id}`}
        />
      )}
      <td
        className="boq-cell w-[70px] text-center"
        onClick={() => disabled && onLockedEdit()}
      >
        {disabled ? (
          <span className="text-[10.5px] text-[#B5C4B6]">
            {isL ? "L" : "M"}
          </span>
        ) : (
          <button
            onClick={() =>
              onPatch({
                calc_type: isL ? "M" : "L",
                amount: isL
                  ? Math.round((item.quantity || 0) * (item.rate || 0) * 100) /
                    100
                  : item.amount || 0,
              })
            }
            className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAEEF0] text-[#333333]"
            title={isL ? "Switch to Measured" : "Switch to Lump-sum"}
            data-testid={`item-ml-toggle-${item.id}`}
          >
            {isL ? "L" : "M"}
          </button>
        )}
      </td>
      {isL ? (
        <EditableCell
          value={item.amount}
          type="number"
          onChange={(v) => onPatch({ amount: v })}
          disabled={disabled}
          onLockedEdit={onLockedEdit}
          align="right"
          className="w-[120px] font-semibold"
          format={(v) => formatINR(v)}
          testid={`item-amount-${item.id}`}
        />
      ) : (
        <td
          className="boq-cell text-right font-semibold w-[120px]"
          data-testid={`item-amount-${item.id}`}
        >
          {formatINR(item.amount)}
        </td>
      )}
    </tr>
  );
}

/* --------- Add Category Panel --------- */
function AddCategoryPanel({ open, onClose, boqId, existingCodes, onAdded }) {
  const [catalog, setCatalog] = useState([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    if (open)
      api
        .get("/boq-catalog")
        .then((r) => setCatalog(r.data))
        .catch(() => {});
  }, [open]);
  const filtered = catalog.filter((c) =>
    `${c.code} ${c.name}`.toLowerCase().includes(q.toLowerCase()),
  );
  const add = async (code) => {
    try {
      await api.post(`/boqs/${boqId}/categories`, {
        catalog_code: code,
        include_items: true,
      });
      toast.success("Category added");
      onAdded();
    } catch (e) {
      toast.error("Failed to add");
    }
  };
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[520px] bg-white">
        <SheetHeader>
          <SheetTitle className="text-[11px] uppercase tracking-widest text-[#B5C4B6] font-normal">
            Catalog — Interior Fit-out / Renovation
          </SheetTitle>
          <div className="text-[16px] font-bold text-[#333333]">
            Add category
          </div>
        </SheetHeader>
        <div className="mt-4 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B5C4B6]"
          />
          <input
            className="bc-input pl-8"
            placeholder="Search categories…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-testid="catalog-search"
          />
        </div>
        <div className="mt-4 space-y-2 max-h-[70vh] overflow-y-auto pr-2">
          {filtered.map((c) => {
            const included = existingCodes.has(c.code);
            return (
              <div
                key={c.code}
                className="flex items-center gap-3 p-3 rounded-xl border border-[#B5C4B6] hover:border-[#B5C4B6] hover:bg-[#EAEEF0]"
                data-testid={`catalog-item-${c.code}`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#1F453B] text-white text-[13px] font-bold flex items-center justify-center">
                  {c.code}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif-bc text-[15px] text-[#333333]">
                    {c.name}
                  </div>
                  <div className="text-[11.5px] text-[#B5C4B6]">
                    {(c.items || []).length} preset items
                  </div>
                </div>
                {included ? (
                  <span className="text-[11px] font-semibold text-[#333333] flex items-center gap-1">
                    <CheckCircle2 size={12} /> Included
                  </span>
                ) : (
                  <button
                    onClick={() => add(c.code)}
                    className="h-8 px-3 rounded-lg bg-[#1F453B] hover:bg-[#1F453B] text-white text-[12px] font-semibold"
                    data-testid={`catalog-add-${c.code}`}
                  >
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* --------- Item Detail Drawer --------- */
function ItemDetailDrawer({ open, onClose, item, disabled, onPatch }) {
  const [detail, setDetail] = useState(item?.detail || {});
  const [notes, setNotes] = useState(item?.notes || "");
  useEffect(() => {
    setDetail(item?.detail || {});
    setNotes(item?.notes || "");
  }, [item]);
  if (!item) return null;
  const previewQty = () => {
    const d = detail;
    if (d.formula === "LxW")
      return `${d.length || 0} × ${d.width || 0} × ${d.repetitions || 1} = ${(d.length || 0) * (d.width || 0) * (d.repetitions || 1)}`;
    if (d.formula === "LxWxH")
      return `${d.length || 0} × ${d.width || 0} × ${d.height || 0} × ${d.repetitions || 1} = ${(d.length || 0) * (d.width || 0) * (d.height || 0) * (d.repetitions || 1)}`;
    if (d.formula === "CountxStd")
      return `${d.count || 0} × ${d.std_qty || 0} = ${(d.count || 0) * (d.std_qty || 0)}`;
    return "—";
  };
  const apply = () => {
    onPatch({ detail, notes });
    onClose();
  };
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[520px] bg-white overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-[11px] uppercase tracking-widest text-[#B5C4B6] font-normal">
            Item Detail
          </SheetTitle>
          <div className="text-[16px] font-bold text-[#333333]">
            {item.description}
          </div>
        </SheetHeader>
        <div className="mt-4 space-y-4 text-[13px]">
          <div>
            <label className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
              Calc Formula
            </label>
            <select
              className="bc-input mt-1"
              disabled={disabled}
              value={detail.formula || "Manual"}
              onChange={(e) =>
                setDetail((d) => ({ ...d, formula: e.target.value }))
              }
            >
              <option value="Manual">Manual</option>
              <option value="LxW">Length × Width</option>
              <option value="LxWxH">Length × Width × Height</option>
              <option value="LxWxD">Length × Width × Depth</option>
              <option value="CountxStd">Count × Standard Qty</option>
              <option value="Running">Running Length</option>
              <option value="Lump">Lump</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              "length",
              "width",
              "height",
              "depth",
              "repetitions",
              "count",
              "std_qty",
              "deduction",
              "wastage_pct",
            ].map((k) => (
              <div key={k}>
                <label className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                  {k.replace("_", " ")}
                </label>
                <input
                  type="number"
                  className="bc-input mt-1"
                  disabled={disabled}
                  value={detail[k] ?? ""}
                  onChange={(e) =>
                    setDetail((d) => ({
                      ...d,
                      [k]: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-[#EAEEF0] border border-[#B5C4B6] text-[12px] text-[#6B7B7C]">
            <span className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] mr-2">
              Preview
            </span>
            {previewQty()}
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
              Internal Notes
            </label>
            <textarea
              className="bc-input mt-1 min-h-[80px]"
              disabled={disabled}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {!disabled && (
            <button
              onClick={apply}
              className="w-full h-10 rounded-xl bg-[#1F453B] hover:bg-[#1F453B] text-white font-semibold text-[13px]"
              data-testid="item-detail-apply"
            >
              Apply
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* --------- Category block --------- */
function CategoryBlock({
  cat,
  items,
  disabled,
  selectedIds,
  onSelectItem,
  onSelectCategory,
  onPatchItem,
  onDeleteItem,
  onDuplicateItem,
  onOpenDetail,
  onAddItem,
  onDeleteCat,
  onToggleCollapse,
  onReorderItems,
  onMoveUp,
  onMoveDown,
  onToggleHide,
  onLockedEdit,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );
  const [collapsed, setCollapsed] = useState(!!cat.collapsed);
  const guarded = (fn) => () => {
    if (disabled) {
      onLockedEdit();
      return;
    }
    fn();
  };
  return (
    <>
      <tr className="boq-category-row" data-testid={`category-row-${cat.code}`}>
        <td colSpan={9}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="p-1 rounded hover:bg-[#B5C4B6]"
              data-testid={`cat-collapse-${cat.code}`}
            >
              {collapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
            <div className="w-8 h-8 rounded bg-[#1F453B] text-white text-[13px] font-bold flex items-center justify-center">
              {cat.code}
            </div>
            <h3 className="font-serif-bc text-[18px] text-[#333333] flex-1">
              {cat.name}
            </h3>
            <div className="text-[11.5px] text-[#B5C4B6]">
              {items.length} items
            </div>
            <div className="text-[13px] font-semibold text-[#333333] min-w-[120px] text-right">
              SUBTOTAL {formatINR(cat.subtotal || 0)}
            </div>
            <input
              type="checkbox"
              onChange={(e) => onSelectCategory(cat.id, e.target.checked)}
              title="Select all in category"
              className="ml-1"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1 rounded hover:bg-[#B5C4B6]"
                  data-testid={`cat-menu-${cat.code}`}
                >
                  <MoreHorizontal size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={guarded(() => onAddItem(cat.id))}>
                  <Plus size={13} className="mr-2" /> Add line
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={guarded(() => onDeleteCat(cat.id))}
                  className="text-[#333333]"
                >
                  <Trash2 size={13} className="mr-2" /> Delete category
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </td>
      </tr>
      {!collapsed && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => {
            if (!e.over || e.active.id === e.over.id) return;
            if (disabled) {
              onLockedEdit();
              return;
            }
            const oldIndex = items.findIndex((i) => i.id === e.active.id);
            const newIndex = items.findIndex((i) => i.id === e.over.id);
            onReorderItems(
              cat.id,
              arrayMove(items, oldIndex, newIndex).map((i) => i.id),
            );
          }}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((it, idx) => (
              <ItemRow
                key={it.id}
                item={it}
                sno={idx + 1}
                disabled={disabled}
                selected={selectedIds.has(it.id)}
                onSelect={onSelectItem}
                onPatch={(patch) => onPatchItem(it.id, patch)}
                onDelete={onDeleteItem}
                onDuplicate={onDuplicateItem}
                onOpenDetail={onOpenDetail}
                onToggleHide={onToggleHide}
                onLockedEdit={onLockedEdit}
                onMoveUp={() => onMoveUp(cat.id, it.id)}
                onMoveDown={() => onMoveDown(cat.id, it.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
      {!collapsed && items.length === 0 && (
        <tr>
          <td
            colSpan={9}
            className="text-center py-6 text-[12.5px] text-[#B5C4B6]"
          >
            No items in this category.{" "}
            <button
              className="text-[#333333] font-semibold hover:underline"
              onClick={guarded(() => onAddItem(cat.id))}
            >
              Add line item
            </button>
          </td>
        </tr>
      )}
    </>
  );
}

/* --------- Main workspace --------- */
export default function BoqWorkspace() {
  const { id } = useParams();
  const nav = useNavigate();
  const [boq, setBoq] = useState(null);
  const [saveState, setSaveState] = useState("idle");
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [customCatOpen, setCustomCatOpen] = useState(false);
  const [customCatName, setCustomCatName] = useState("");
  const [detailItem, setDetailItem] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [dupOpen, setDupOpen] = useState(false);
  const [dupReason, setDupReason] = useState("Revision");
  const [dupNote, setDupNote] = useState("");
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [preExportVariant, setPreExportVariant] = useState(null); // Phase D checklist
  const [pdfVariant, setPdfVariant] = useState("internal");
  const [lockedOpen, setLockedOpen] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);
  const undoRef = useRef(null); // { item, categoryId } for undo delete

  const disabled =
    !!boq?.locked ||
    boq?.status === "approved" ||
    boq?.status === "final" ||
    boq?.status === "awaiting_approval";
  const onLockedEdit = useCallback(() => setLockedOpen(true), []);

  const createNewVersion = async () => {
    setCreatingVersion(true);
    try {
      const { data } = await api.post(`/boqs/${id}/new-version`, {});
      toast.success(`Created ${data.boq_number || "new version"}`);
      setLockedOpen(false);
      nav(`/boq/${data.id}`);
    } catch (e) {
      // Fallback to legacy duplicate-version
      try {
        const { data } = await api.post(`/boqs/${id}/duplicate-version`, {
          reason: "Revision",
          note: "",
        });
        toast.success(
          `Created ${data.boq_number || data.version || "new version"}`,
        );
        setLockedOpen(false);
        nav(`/boq/${data.id}`);
      } catch {
        toast.error("Failed to create new version");
      }
    } finally {
      setCreatingVersion(false);
    }
  };

  const toggleHide = async (iid, hide) => {
    try {
      const { data } = await api.patch(`/boqs/${id}/items/${iid}`, {
        hidden: hide,
      });
      setBoq(data);
      toast.success(hide ? "Row hidden from client copy" : "Row visible again");
    } catch {
      toast.error("Update failed");
    }
  };

  const refresh = useCallback(() => {
    api
      .get(`/boqs/${id}`)
      .then((r) => setBoq(r.data))
      .catch(() => toast.error("Failed to load BOQ"));
  }, [id]);
  useEffect(() => {
    refresh();
  }, [refresh]);

  /* ---------- Save helpers ---------- */
  const saveBoq = async (patch) => {
    setSaveState("saving");
    try {
      const { data } = await api.patch(`/boqs/${id}`, patch);
      setBoq(data);
      setSaveState("saved");
      setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1500);
    } catch (e) {
      if (e?.response?.status === 423)
        toast.error("This BOQ is locked. Duplicate to edit.");
      else toast.error("Save failed");
      setSaveState("error");
    }
  };
  const debouncedSaveBoq = useDebouncedCallback(saveBoq, 800);

  const patchItem = async (iid, patch) => {
    // Optimistic update
    setBoq((b) => ({
      ...b,
      items: b.items.map((i) =>
        i.id === iid
          ? {
              ...i,
              ...patch,
              amount:
                patch.calc_type === "L"
                  ? (patch.amount ?? i.amount)
                  : (patch.calc_type ?? i.calc_type) === "L"
                    ? i.amount
                    : Math.round(
                        (patch.quantity ?? i.quantity ?? 0) *
                          (patch.rate ?? i.rate ?? 0) *
                          100,
                      ) / 100,
            }
          : i,
      ),
    }));
    setSaveState("saving");
    try {
      const { data } = await api.patch(`/boqs/${id}/items/${iid}`, patch);
      setBoq(data);
      setSaveState("saved");
      setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1500);
    } catch (e) {
      if (e?.response?.status === 423)
        toast.error("Locked — duplicate to edit");
      else toast.error("Save failed");
      setSaveState("error");
      refresh();
    }
  };

  const [pickerFor, setPickerFor] = useState(null); // { cid }
  const addItem = async (cid) => setPickerFor({ cid });

  const addItemFromPicker = async ({
    payload,
    targetCategoryId,
    newCategoryName,
  }) => {
    if (!pickerFor) return;
    try {
      let cid = targetCategoryId || pickerFor.cid;
      if (newCategoryName) {
        const code = (newCategoryName.slice(0, 2) || "NC").toUpperCase();
        const { data: catRes } = await api.post(`/boqs/${id}/categories`, {
          name: newCategoryName,
          code,
        });
        setBoq(catRes);
        const created = (catRes.categories || []).find(
          (c) => c.name === newCategoryName,
        );
        if (!created) throw new Error("Category creation failed");
        cid = created.id;
      }
      const { data } = await api.post(
        `/boqs/${id}/categories/${cid}/items`,
        payload,
      );
      setBoq(data);
      toast.success("Item added");
      setPickerFor(null);
    } catch {
      toast.error("Failed to add item");
    }
  };

  const deleteItem = async (iid) => {
    const item = boq.items.find((i) => i.id === iid);
    if (!item) return;
    undoRef.current = { item };
    try {
      const { data } = await api.delete(`/boqs/${id}/items/${iid}`);
      setBoq(data);
      toast("Item deleted", {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await api.post(
                `/boqs/${id}/categories/${item.category_id}/items`,
                {
                  description: item.description,
                  location: item.location,
                  unit: item.unit,
                  quantity: item.quantity,
                  rate: item.rate,
                  calc_type: item.calc_type,
                  notes: item.notes,
                  detail: item.detail,
                  amount: item.amount,
                },
              );
              refresh();
              toast.success("Restored");
            } catch {
              toast.error("Undo failed");
            }
          },
        },
        duration: 5000,
      });
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const duplicateItem = async (iid) => {
    const item = boq.items.find((i) => i.id === iid);
    if (!item) return;
    try {
      await api.post(`/boqs/${id}/categories/${item.category_id}/items`, {
        description: item.description + " (copy)",
        location: item.location,
        unit: item.unit,
        quantity: item.quantity,
        rate: item.rate,
        calc_type: item.calc_type,
        notes: item.notes,
        detail: item.detail,
        amount: item.amount,
      });
      refresh();
    } catch {
      toast.error("Duplicate failed");
    }
  };

  const moveInCategory = async (cid, iid, dir) => {
    const items = boq.items
      .filter((i) => i.category_id === cid)
      .sort((a, b) => a.order - b.order);
    const idx = items.findIndex((i) => i.id === iid);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    const arr = arrayMove(items, idx, newIdx).map((i) => i.id);
    try {
      const { data } = await api.post(`/boqs/${id}/items/reorder`, {
        category_id: cid,
        ordered_ids: arr,
      });
      setBoq(data);
    } catch {
      toast.error("Reorder failed");
    }
  };

  const reorderItems = async (cid, orderedIds) => {
    try {
      const { data } = await api.post(`/boqs/${id}/items/reorder`, {
        category_id: cid,
        ordered_ids: orderedIds,
      });
      setBoq(data);
    } catch {
      toast.error("Reorder failed");
    }
  };

  const deleteCategory = async (cid) => {
    if (!confirm("Delete this category and all its items?")) return;
    try {
      const { data } = await api.delete(`/boqs/${id}/categories/${cid}`);
      setBoq(data);
      toast.success("Category removed");
    } catch {
      toast.error("Delete failed");
    }
  };

  const addCustomCategory = async () => {
    if (!customCatName.trim()) return;
    try {
      const code = customCatName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 3);
      const { data } = await api.post(`/boqs/${id}/categories`, {
        name: customCatName,
        code,
      });
      setBoq(data);
      toast.success("Category added");
      setCustomCatOpen(false);
      setCustomCatName("");
    } catch {
      toast.error("Failed");
    }
  };

  const bulkAction = async (op, value) => {
    if (selectedIds.size === 0) return;
    try {
      const { data } = await api.post(`/boqs/${id}/items/bulk`, {
        ids: [...selectedIds],
        op,
        value,
      });
      setBoq(data);
      setSelectedIds(new Set());
      toast.success(op === "delete" ? "Deleted" : "Updated");
    } catch {
      toast.error("Bulk action failed");
    }
  };

  const duplicateVersion = async () => {
    try {
      const { data } = await api.post(`/boqs/${id}/duplicate-version`, {
        reason: dupReason,
        note: dupNote,
      });
      toast.success(`Created ${data.version}`);
      setDupOpen(false);
      nav(`/boq/${data.id}`);
    } catch {
      toast.error("Duplicate failed");
    }
  };

  const submitForApproval = async () => {
    try {
      const { data } = await api.post(`/boqs/${id}/submit-for-approval`, {
        note: "Please review",
      });
      setBoq(data);
      toast.success("Submitted for approval");
    } catch {
      toast.error("Submit failed");
    }
  };

  const approve = async () => {
    try {
      const { data } = await api.post(`/boqs/${id}/approve`, {
        remarks: "Approved",
      });
      setBoq(data);
      setApprovalOpen(false);
      toast.success("BOQ approved and locked");
    } catch {
      toast.error("Approve failed");
    }
  };

  const exportExcel = async () => {
    try {
      const res = await api.get(`/boqs/${id}/export/excel`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${boq?.boq_number || `BOQ-V${boq?.version || 1}`}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel downloaded");
    } catch {
      toast.error("Export failed");
    }
  };

  const exportPdf = (variant = "internal") => {
    // Phase E: no pre-export checklist — single-click download.
    doExportPdf(variant);
  };

  const doExportPdf = async (variant) => {
    try {
      const res = await api.post(
        `/boqs/${id}/export/pdf`,
        { variant },
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      const base = boq?.boq_number || `BOQ-V${boq?.version || 1}`;
      a.href = url;
      a.download = `${base}-${variant}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`PDF (${variant}) downloaded`);
      setPdfOpen(false);
      setPreExportVariant(null);
    } catch {
      toast.error("Export failed");
    }
  };

  // Keyboard shortcuts + click-outside to clear selection
  useEffect(() => {
    const onKey = (e) => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName,
      );
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        toast.success("All changes are auto-saved");
      }
      if (e.key === "Delete" && !isInput && selectedIds.size > 0) {
        e.preventDefault();
        bulkAction("delete");
      }
      if (e.key === "Escape" && selectedIds.size > 0) {
        e.preventDefault();
        setSelectedIds(new Set());
      }
    };
    const onClick = (e) => {
      // Click outside table + bulk bar clears selection
      if (selectedIds.size === 0) return;
      const t = e.target;
      if (
        !t.closest ||
        t.closest('[data-testid="boq-main-table"]') ||
        t.closest('[data-testid="bulk-action-bar"]') ||
        t.closest('[role="menu"]') ||
        t.closest("[data-radix-popper-content-wrapper]")
      )
        return;
      setSelectedIds(new Set());
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [selectedIds]);

  if (!boq) {
    return (
      <div className="min-h-screen bc-page-bg flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#6B7B7C]">
          <Loader2 size={16} className="animate-spin" /> Loading BOQ…
        </div>
      </div>
    );
  }

  const existingCodes = new Set(boq.categories.map((c) => c.code));
  const attentionCount = boq.items.filter(
    (i) => !i.unit || (i.calc_type !== "L" && (!i.quantity || !i.rate)),
  ).length;
  const itemsByCat = (cid) =>
    boq.items
      .filter((i) => i.category_id === cid)
      .sort((a, b) => a.order - b.order);

  const onSelectItem = (iid, checked) =>
    setSelectedIds((s) => {
      const n = new Set(s);
      checked ? n.add(iid) : n.delete(iid);
      return n;
    });
  const onSelectCategory = (cid, checked) =>
    setSelectedIds((s) => {
      const n = new Set(s);
      itemsByCat(cid).forEach((i) => {
        checked ? n.add(i.id) : n.delete(i.id);
      });
      return n;
    });

  const PdfThumbPreview = ({ boqId, variant }) => {
    const [src, setSrc] = useState(null);
    const [err, setErr] = useState(false);
    useEffect(() => {
      if (!variant) return;
      setSrc(null);
      setErr(false);
      api
        .post(
          `/boqs/${boqId}/export/pdf-thumbnail?variant=${variant}`,
          {},
          { responseType: "blob" },
        )
        .then((r) => setSrc(URL.createObjectURL(r.data)))
        .catch(() => setErr(true));
      return () => {
        if (src) URL.revokeObjectURL(src);
      };
      // eslint-disable-next-line
    }, [boqId, variant]);
    return (
      <div
        className="border border-[rgba(31,69,59,0.14)] rounded-lg bg-white p-2 flex flex-col items-center justify-center min-h-[240px]"
        data-testid="pre-export-thumbnail"
      >
        {err ? (
          <div className="text-[12px] text-[#B5C4B6] text-center px-3">
            <FileText size={26} className="mx-auto mb-2 text-[#B5C4B6]" />
            Preview unavailable
          </div>
        ) : src ? (
          <img
            src={src}
            alt="page 1 preview"
            style={{ width: 180, height: "auto" }}
            className="rounded shadow-sm"
          />
        ) : (
          <div className="text-[12px] text-[#6B7B7C]">
            <Loader2 size={13} className="inline animate-spin mr-1.5" />
            Rendering preview…
          </div>
        )}
        <div className="text-[10.5px] text-[#B5C4B6] mt-2">Page 1 preview</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bc-page-bg">
      {/* Slim top bar */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#B5C4B6]">
        <div className="h-14 px-4 lg:px-8 flex items-center gap-3">
          <button
            onClick={() => nav("/boq")}
            className="flex items-center gap-2 text-[13px] text-[#6B7B7C] hover:text-[#333333]"
            data-testid="back-to-boq-dashboard"
          >
            <ArrowLeft size={15} /> BOQ Dashboard
          </button>
          <div className="text-[12px] text-[#B5C4B6] hidden md:flex items-center gap-2">
            <span>/</span>
            <span className="text-[#6B7B7C]">BOQ</span>
            <span>/</span>
            <span className="text-[#333333] font-medium truncate max-w-[300px]">
              {boq.project_name}
            </span>
          </div>
          <div className="ml-3">
            <SaveChip state={saveState} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            {disabled && (
              <span className="text-[11px] text-[#333333] flex items-center gap-1">
                <Lock size={12} /> Locked
              </span>
            )}
            <button
              onClick={() => setDupOpen(true)}
              className="h-9 px-3 rounded-lg border border-[#B5C4B6] hover:bg-[#EAEEF0] text-[12.5px] font-semibold text-[#6B7B7C] flex items-center gap-1.5"
              data-testid="duplicate-version-btn"
            >
              <Copy size={13} /> Duplicate Version
            </button>
            <button
              onClick={() => nav(`/boq/${id}/versions`)}
              className="h-9 px-3 rounded-lg border border-[#B5C4B6] hover:bg-[#EAEEF0] text-[12.5px] font-semibold text-[#6B7B7C] flex items-center gap-1.5"
            >
              <GitBranch size={13} /> Versions
            </button>
            <button
              onClick={() => exportPdf("internal")}
              className="h-9 px-3 rounded-lg bg-[#1F453B] hover:opacity-90 text-white text-[12.5px] font-semibold flex items-center gap-1.5"
              data-testid="download-boq-btn"
              title="Download BOQ (PDF)"
            >
              <Download size={13} /> Download BOQ
            </button>
            {boq.status === "draft" && (
              <button
                onClick={submitForApproval}
                className="h-9 px-3 rounded-lg bg-[#1F453B] hover:bg-[#1F453B] text-white text-[12.5px] font-semibold flex items-center gap-1.5"
                data-testid="submit-approval-btn"
              >
                <Send size={13} /> Send for Approval
              </button>
            )}
            {boq.status === "awaiting_approval" && (
              <button
                onClick={() => setApprovalOpen(true)}
                className="h-9 px-3 rounded-lg bg-[#1F453B] hover:bg-[#1F453B] text-white text-[12.5px] font-semibold flex items-center gap-1.5"
                data-testid="approve-btn"
              >
                <CheckCircle2 size={13} /> Approve
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 rounded-lg border border-[#B5C4B6] hover:bg-[#EAEEF0] flex items-center justify-center">
                  <MoreHorizontal size={15} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => nav(`/boq/${id}/preview`)}>
                  <Eye size={13} className="mr-2" /> Preview BOQ
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>
                  Print
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-[#333333]"
                  onClick={async () => {
                    if (confirm("Archive this BOQ?")) {
                      await api.delete(`/boqs/${id}`);
                      toast.success("Archived");
                      nav("/boq");
                    }
                  }}
                >
                  Archive / Delete Draft
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Summary header */}
        <section
          className="bc-card p-6 md:p-8"
          data-testid="boq-summary-header"
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_360px] gap-6 md:gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                  Bill of Quantities
                </div>
                <StatusChip status={boq.status} />
                <span
                  className="text-[11px] font-mono font-bold text-[#333333] bg-[#EAEEF0] px-2 py-0.5 rounded"
                  data-testid="boq-number"
                >
                  {boq.boq_number || `BOQ-V${boq.version}`}
                </span>
                {disabled && (
                  <span className="text-[11px] text-[#333333] flex items-center gap-1">
                    <Lock size={11} /> Locked
                  </span>
                )}
              </div>
              <h1 className="font-serif-bc text-[34px] md:text-[42px] leading-[1.05] text-[#333333] tracking-tight">
                {boq.project_name}
              </h1>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-5 text-[13px]">
                <div>
                  <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                    Client
                  </div>
                  <div className="text-[#333333] mt-0.5">
                    {boq.client_name || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                    Location
                  </div>
                  <div className="text-[#333333] mt-0.5">
                    {boq.location || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                    Prepared By
                  </div>
                  <div className="text-[#333333] mt-0.5">
                    {boq.prepared_by || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                    Date
                  </div>
                  <div className="text-[#333333] mt-0.5">
                    {formatDate(boq.date) || "—"}
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:block bg-[#B5C4B6]" />
            <div className="md:pl-2">
              <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                Estimate Total
              </div>
              <div
                className="text-[36px] md:text-[44px] font-bold text-[#333333] tracking-tight mt-1"
                data-testid="boq-final-total"
              >
                {formatINR(boq.final_total || 0)}
              </div>
              <div className="text-[11.5px] text-[#6B7B7C] mt-1">
                Project Total {formatINR(boq.project_total || 0)} ·
                Miscellaneous {boq.misc_pct || 10}%{" "}
                {formatINR(boq.misc_amount || 0)}
              </div>
            </div>
          </div>
        </section>

        {/* Add category row */}
        <section className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => (disabled ? onLockedEdit() : setAddCatOpen(true))}
            className="h-10 px-4 rounded-xl border-2 border-[#1F453B] text-[#333333] hover:bg-[#EAEEF0] text-[13px] font-semibold flex items-center gap-2"
            data-testid="add-category-btn"
          >
            <Plus size={15} /> Add Category
          </button>
          <button
            onClick={() => (disabled ? onLockedEdit() : setCustomCatOpen(true))}
            className="h-10 px-4 rounded-xl border border-[#B5C4B6] bg-white hover:bg-[#EAEEF0] text-[13px] font-semibold text-[#6B7B7C] flex items-center gap-2"
            data-testid="add-custom-category-btn"
          >
            <Plus size={14} /> Custom Category
          </button>
          <div className="text-[12px] text-[#B5C4B6] hidden md:block">
            Pick a category — its standard items, units and rates are added
            automatically.
          </div>
          <div className="ml-auto flex items-center gap-3">
            {attentionCount > 0 && (
              <span className="text-[11.5px] font-semibold text-[#333333] bg-[#EAEEF0] px-2.5 py-1 rounded-full flex items-center gap-1">
                <AlertCircle size={11} /> {attentionCount} require attention
              </span>
            )}
            <span className="text-[12px] text-[#6B7B7C]">
              {boq.categories.length} categories · {boq.items.length} line items
            </span>
          </div>
        </section>

        {/* Main table */}
        {boq.categories.length === 0 ? (
          <section className="bc-card p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#EAEEF0] flex items-center justify-center mx-auto mb-4">
              <Sparkles size={22} className="text-[#333333]" />
            </div>
            <h2 className="text-[18px] font-bold text-[#333333]">
              Start building your BOQ
            </h2>
            <p className="text-[13px] text-[#6B7B7C] mt-1 mb-5">
              Choose a predefined category to automatically add its standard
              items, units and rates.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setAddCatOpen(true)}
                className="h-10 px-4 rounded-xl bg-[#1F453B] hover:bg-[#1F453B] text-white text-[13px] font-semibold"
                data-testid="empty-add-category"
              >
                Add First Category
              </button>
              <button
                onClick={() => setCustomCatOpen(true)}
                className="h-10 px-4 rounded-xl border border-[#B5C4B6] hover:bg-[#EAEEF0] text-[13px] font-semibold text-[#6B7B7C]"
              >
                Create Custom Category
              </button>
            </div>
          </section>
        ) : (
          <section
            className="bc-card overflow-hidden"
            data-testid="boq-main-table"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] bg-[#EAEEF0] border-b border-[#B5C4B6] sticky top-0">
                  <tr>
                    <th className="p-2 w-11"></th>
                    <th className="p-2 text-center w-11 whitespace-nowrap">
                      S. No.
                    </th>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-left w-[120px]">Location</th>
                    <th className="p-2 text-left w-[92px]">Unit</th>
                    <th className="p-2 text-right w-[80px]">Quantity</th>
                    <th className="p-2 text-right w-[100px]">Rate</th>
                    <th className="p-2 text-center w-[70px]">Type</th>
                    <th className="p-2 text-right w-[120px]">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {boq.categories.map((cat) => (
                    <CategoryBlock
                      key={cat.id}
                      cat={cat}
                      items={itemsByCat(cat.id)}
                      disabled={disabled}
                      selectedIds={selectedIds}
                      onSelectItem={onSelectItem}
                      onSelectCategory={onSelectCategory}
                      onPatchItem={patchItem}
                      onDeleteItem={deleteItem}
                      onDuplicateItem={duplicateItem}
                      onOpenDetail={setDetailItem}
                      onAddItem={addItem}
                      onDeleteCat={deleteCategory}
                      onReorderItems={reorderItems}
                      onMoveUp={(cid, iid) => moveInCategory(cid, iid, -1)}
                      onMoveDown={(cid, iid) => moveInCategory(cid, iid, 1)}
                      onToggleHide={toggleHide}
                      onLockedEdit={onLockedEdit}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bc-card px-5 py-3 flex items-center gap-3 shadow-lg"
            data-testid="bulk-action-bar"
          >
            <span className="text-[13px] font-semibold text-[#333333]">
              {selectedIds.size} selected
            </span>
            <div className="w-px h-5 bg-[#B5C4B6]" />
            <select
              className="bc-input h-8 py-0 max-w-[140px]"
              onChange={(e) => {
                if (e.target.value) {
                  bulkAction("change_unit", e.target.value);
                  e.target.value = "";
                }
              }}
              data-testid="bulk-change-unit"
            >
              <option value="">Change unit…</option>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <button
              onClick={() => bulkAction("delete")}
              className="h-8 px-3 rounded-lg bg-[#EAEEF0] text-[#333333] text-[12px] font-semibold flex items-center gap-1"
              data-testid="bulk-delete"
            >
              <Trash2 size={12} /> Delete
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="h-8 px-3 rounded-lg text-[12px] font-semibold text-[#6B7B7C] hover:text-[#333333] hover:bg-[#EAEEF0]"
              data-testid="bulk-deselect-all"
            >
              Deselect all
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="h-8 px-2 rounded-lg text-[12px] text-[#6B7B7C] hover:text-[#333333]"
              aria-label="Close"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Notes + Project Total */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bc-card p-6">
            <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-2">
              Notes & Terms
            </div>
            <textarea
              className="bc-input min-h-[140px] text-[13px] leading-relaxed"
              readOnly={disabled}
              onClick={() => disabled && onLockedEdit()}
              value={(boq.terms_html || "")
                .replace(/<[^>]+>/g, "\n")
                .replace(/\n+/g, "\n")
                .trim()}
              onChange={(e) => {
                if (disabled) {
                  onLockedEdit();
                  return;
                }
                debouncedSaveBoq({
                  terms_html:
                    "<ol>" +
                    e.target.value
                      .split("\n")
                      .filter(Boolean)
                      .map((l) => `<li>${l}</li>`)
                      .join("") +
                    "</ol>",
                });
              }}
              data-testid="terms-textarea"
            />
          </div>
          <div className="bc-card p-6" data-testid="project-total-panel">
            <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-3">
              Cost Summary
            </div>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#6B7B7C]">Project Total</span>
                <span className="font-semibold text-[#333333]">
                  {formatINR(boq.project_total || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6B7B7C] flex items-center gap-2">
                  Misc
                  <input
                    type="number"
                    readOnly={disabled}
                    onClick={() => disabled && onLockedEdit()}
                    className="bc-input h-7 w-14 py-0 text-[11.5px]"
                    value={boq.misc_pct ?? 10}
                    onChange={(e) => {
                      if (disabled) {
                        onLockedEdit();
                        return;
                      }
                      const v = Number(e.target.value);
                      setBoq((b) => ({ ...b, misc_pct: v }));
                      debouncedSaveBoq({ misc_pct: v });
                    }}
                    data-testid="misc-pct-input"
                  />
                  %
                </span>
                <span
                  className="font-semibold text-[#333333]"
                  data-testid="misc-amount"
                >
                  {formatINR(boq.misc_amount || 0)}
                </span>
              </div>
              {boq.design_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6B7B7C]">Design Fees</span>
                  <span className="font-semibold">
                    {formatINR(boq.design_amount)}
                  </span>
                </div>
              )}
              {boq.execution_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6B7B7C]">Execution</span>
                  <span className="font-semibold">
                    {formatINR(boq.execution_amount)}
                  </span>
                </div>
              )}
              {boq.supervisor_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6B7B7C]">Supervisor</span>
                  <span className="font-semibold">
                    {formatINR(boq.supervisor_amount)}
                  </span>
                </div>
              )}
              {boq.additional_total > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6B7B7C]">Additional</span>
                  <span className="font-semibold">
                    {formatINR(boq.additional_total)}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-[#B5C4B6] flex items-baseline justify-between">
              <span className="text-[11.5px] uppercase tracking-widest text-[#B5C4B6]">
                Total Amount
              </span>
              <span
                className="text-[34px] font-bold text-[#333333]"
                data-testid="cost-final-total"
              >
                {formatINR(boq.final_total || 0)}
              </span>
            </div>
          </div>
        </section>
      </main>

      <AddCategoryPanel
        open={addCatOpen}
        onClose={setAddCatOpen}
        boqId={id}
        existingCodes={existingCodes}
        onAdded={() => {
          refresh();
          setAddCatOpen(false);
        }}
      />

      {/* Custom category dialog */}
      <Dialog open={customCatOpen} onOpenChange={setCustomCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom Category</DialogTitle>
            <DialogDescription>
              Add a category not in the catalog. You can add items to it
              afterwards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              className="bc-input"
              placeholder="Category name (e.g. Landscape)"
              value={customCatName}
              onChange={(e) => setCustomCatName(e.target.value)}
              data-testid="custom-cat-name"
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setCustomCatOpen(false)}
              className="h-10 px-4 rounded-xl border border-[#B5C4B6] text-[13px] font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={addCustomCategory}
              className="h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold"
              data-testid="custom-cat-submit"
            >
              Add Category
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ItemDetailDrawer
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        disabled={disabled}
        onPatch={(patch) => detailItem && patchItem(detailItem.id, patch)}
      />

      {/* Duplicate version dialog */}
      <Dialog open={dupOpen} onOpenChange={setDupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate as new version</DialogTitle>
            <DialogDescription>
              Creates an editable copy. Current version stays intact.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[11.5px] uppercase tracking-widest text-[#B5C4B6]">
                Reason
              </label>
              <select
                className="bc-input mt-1"
                value={dupReason}
                onChange={(e) => setDupReason(e.target.value)}
              >
                <option>Revision</option>
                <option>Client requested changes</option>
                <option>Scope change</option>
                <option>Rate update</option>
              </select>
            </div>
            <div>
              <label className="text-[11.5px] uppercase tracking-widest text-[#B5C4B6]">
                Change Note
              </label>
              <textarea
                className="bc-input mt-1 min-h-[80px]"
                value={dupNote}
                onChange={(e) => setDupNote(e.target.value)}
                placeholder="What's changing in this version?"
                data-testid="dup-note"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setDupOpen(false)}
              className="h-10 px-4 rounded-xl border border-[#B5C4B6] text-[13px] font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={duplicateVersion}
              className="h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold"
              data-testid="dup-submit"
            >
              Duplicate
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval dialog */}
      <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve BOQ</DialogTitle>
            <DialogDescription>
              Approving will lock this version and auto-attach a PDF to
              Documents.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setApprovalOpen(false)}
              className="h-10 px-4 rounded-xl border border-[#B5C4B6] text-[13px] font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={approve}
              className="h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold"
              data-testid="approve-confirm"
            >
              Approve & Lock
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LockedEditModal
        open={lockedOpen}
        onOpenChange={setLockedOpen}
        boqNumber={boq.boq_number}
        version={boq.version}
        busy={creatingVersion}
        onCreateNewVersion={createNewVersion}
      />

      {/* Phase D — Pre-export checklist modal (shown before EVERY PDF variant download) */}
      <Dialog
        open={!!preExportVariant}
        onOpenChange={(v) => !v && setPreExportVariant(null)}
      >
        <DialogContent
          data-testid="pre-export-checklist-modal"
          className="sm:max-w-[820px]"
        >
          <DialogHeader>
            <DialogTitle className="text-[#333333]">
              Pre-export checklist — {preExportVariant} variant
            </DialogTitle>
            <DialogDescription>
              Confirm before generating. Every category and every visible item
              is included.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-[1fr_200px] gap-5">
            {(() => {
              const cats = boq?.categories || [];
              const items = boq?.items || [];
              const hidden = items.filter(
                (i) => preExportVariant === "client" && i.hide_from_client,
              ).length;
              const included = items.length - hidden;
              const ratesVisible = !(
                preExportVariant === "quantity_only" ||
                preExportVariant === "vendor_enquiry"
              );
              const rows = [
                ["Export type", preExportVariant],
                ["Categories in this BOQ", cats.length],
                ["Total items", items.length],
                ["Items included in this PDF", included],
                [
                  "Items hidden from client copy",
                  preExportVariant === "client" ? hidden : "n/a",
                ],
                ["Rates shown", ratesVisible ? "Yes" : "No"],
                ["Terms & signatures", "Included"],
              ];
              return (
                <div
                  className="grid gap-2 text-[13.5px]"
                  data-testid="pre-export-checklist-body"
                >
                  {rows.map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between border-b border-[rgba(31,69,59,0.08)] py-1.5"
                    >
                      <span className="text-[#6B7B7C]">{k}</span>
                      <span className="font-semibold text-[#333333]">
                        {String(v)}
                      </span>
                    </div>
                  ))}
                  <div className="text-[12px] text-[#6B7B7C] mt-2">
                    Editor order is preserved. Category headers repeat on every
                    continuation page.
                  </div>
                </div>
              );
            })()}
            {/* Page-1 thumbnail preview */}
            <PdfThumbPreview boqId={id} variant={preExportVariant} />
          </div>
          <DialogFooter>
            <button
              onClick={() => setPreExportVariant(null)}
              className="h-10 px-4 rounded-xl border border-[#B5C4B6] text-[13px] font-semibold"
              data-testid="pre-export-cancel"
            >
              Cancel
            </button>
            <button
              onClick={() => doExportPdf(preExportVariant)}
              className="h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold"
              data-testid="pre-export-confirm"
            >
              Confirm & Download
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AddItemPicker
        open={!!pickerFor}
        defaultCategoryId={pickerFor?.cid}
        categories={boq?.categories || []}
        onClose={() => setPickerFor(null)}
        onPick={addItemFromPicker}
      />
    </div>
  );
}

function AddItemPicker({
  open,
  onClose,
  onPick,
  categories = [],
  defaultCategoryId,
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [creating, setCreating] = useState(false);
  const CREATE_NEW = "__new__";
  const [newItem, setNewItem] = useState({
    name: "",
    unit: "Nos.",
    default_rate: 0,
    notes: "",
    category_id: "",
    new_category_name: "",
  });

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      api
        .get(`/library/items${q ? `?q=${encodeURIComponent(q)}` : ""}`)
        .then((r) => setResults((r.data || []).slice(0, 30)))
        .catch(() => setResults([]));
    }, 150);
    return () => clearTimeout(t);
  }, [q, open]);

  useEffect(() => {
    if (open) {
      setNewItem((v) => ({
        ...v,
        category_id: defaultCategoryId || categories[0]?.id || "",
      }));
    } else {
      setQ("");
      setCreating(false);
      setNewItem({
        name: "",
        unit: "Nos.",
        default_rate: 0,
        notes: "",
        category_id: "",
        new_category_name: "",
      });
    }
    // eslint-disable-next-line
  }, [open, defaultCategoryId]);

  if (!open) return null;

  const pickFromLibrary = (it) => {
    onPick({
      payload: {
        description: it.name,
        unit: it.unit || "Nos.",
        quantity: 1,
        rate: it.default_rate || 0,
        calc_type: "M",
        library_item_id: it.id,
        notes: it.notes || "",
      },
    });
  };
  const createInline = async () => {
    if (!newItem.name.trim()) {
      toast.error("Name required");
      return;
    }
    const isNewCat = newItem.category_id === CREATE_NEW;
    if (!isNewCat && !newItem.category_id) {
      toast.error("Category required");
      return;
    }
    if (isNewCat && !newItem.new_category_name.trim()) {
      toast.error("New category name required");
      return;
    }
    try {
      const chosenCat = isNewCat
        ? null
        : categories.find((c) => c.id === newItem.category_id);
      const { data: lib } = await api.post(`/library/items`, {
        name: newItem.name,
        unit: newItem.unit,
        default_rate: newItem.default_rate,
        notes: newItem.notes,
        category_name: isNewCat ? newItem.new_category_name : chosenCat?.name,
      });
      onPick({
        payload: {
          description: lib.name,
          unit: lib.unit,
          quantity: 1,
          rate: lib.default_rate || 0,
          calc_type: "M",
          library_item_id: lib.id,
          notes: lib.notes || "",
        },
        targetCategoryId: isNewCat ? null : newItem.category_id,
        newCategoryName: isNewCat ? newItem.new_category_name.trim() : null,
      });
    } catch {
      toast.error("Create failed");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      data-testid="add-item-picker"
    >
      <div
        className="bg-white rounded-2xl w-[560px] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[16px] font-semibold text-[#333333] mb-3">
          Add BOQ Item
        </div>
        <div className="flex items-center gap-2 mb-3">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search item library…"
            className="h-10 flex-1 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
            data-testid="item-picker-search"
          />
          <button
            onClick={() => setCreating((v) => !v)}
            className="w-10 h-10 rounded-lg border border-[#1F453B] text-[#333333] flex items-center justify-center hover:bg-[#EFF2F9]"
            data-testid="item-picker-new-toggle"
            title="Create new item"
          >
            <Plus size={16} />
          </button>
        </div>
        {creating && (
          <div
            className="border border-[#DDD8CE] rounded-xl p-3 mb-3 bg-[#FAF8F5]"
            data-testid="item-picker-inline-create"
          >
            <div className="text-[12px] font-semibold text-[#333333] mb-2">
              New Item (added to library too)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Name *"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                className="h-9 px-2 rounded-lg border border-[#DDD8CE] bg-white text-[13px] col-span-2"
                data-testid="picker-new-name"
              />
              <select
                value={newItem.category_id}
                onChange={(e) =>
                  setNewItem({ ...newItem, category_id: e.target.value })
                }
                className="h-9 px-2 rounded-lg border border-[#DDD8CE] bg-white text-[13px] col-span-2"
                data-testid="picker-new-category"
              >
                <option value="" disabled>
                  Category *
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value={CREATE_NEW}>➕ Create new category…</option>
              </select>
              {newItem.category_id === CREATE_NEW && (
                <input
                  placeholder="New category name *"
                  value={newItem.new_category_name}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      new_category_name: e.target.value,
                    })
                  }
                  className="h-9 px-2 rounded-lg border border-[#1F453B] bg-white text-[13px] col-span-2"
                  data-testid="picker-new-category-name"
                />
              )}
              <input
                placeholder="Unit"
                value={newItem.unit}
                onChange={(e) =>
                  setNewItem({ ...newItem, unit: e.target.value })
                }
                className="h-9 px-2 rounded-lg border border-[#DDD8CE] bg-white text-[13px]"
              />
              <input
                type="number"
                placeholder="Default rate"
                value={newItem.default_rate}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    default_rate: parseFloat(e.target.value) || 0,
                  })
                }
                className="h-9 px-2 rounded-lg border border-[#DDD8CE] bg-white text-[13px]"
              />
              <input
                placeholder="Notes (optional)"
                value={newItem.notes}
                onChange={(e) =>
                  setNewItem({ ...newItem, notes: e.target.value })
                }
                className="h-9 px-2 rounded-lg border border-[#DDD8CE] bg-white text-[13px] col-span-2"
              />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setCreating(false)}
                className="h-8 px-3 rounded-lg border border-[#DDD8CE] text-[12.5px] text-[#333333]"
              >
                Cancel
              </button>
              <button
                onClick={createInline}
                className="h-8 px-3 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold"
                data-testid="picker-new-save"
              >
                Save &amp; Add
              </button>
            </div>
          </div>
        )}
        <div
          className="max-h-[300px] overflow-y-auto border border-[#EAEEF0] rounded-lg"
          data-testid="item-picker-results"
        >
          {results.length === 0 && (
            <div className="p-4 text-center text-[13px] text-[#6B7B7C]">
              No matches{q ? " — click + to create" : ""}.
            </div>
          )}
          {results.map((it) => (
            <button
              key={it.id}
              onClick={() => pickFromLibrary(it)}
              className="w-full text-left px-3 py-2 border-b border-[#EAEEF0] hover:bg-[#FAF8F5] flex items-center justify-between"
              data-testid={`item-picker-row-${it.id}`}
            >
              <div>
                <div className="text-[13.5px] font-semibold text-[#333333]">
                  {it.name}
                </div>
                <div className="text-[11.5px] text-[#6B7B7C]">
                  {it.category_name || "—"} · {it.unit}
                </div>
              </div>
              <div className="text-[12.5px] font-semibold text-[#333333]">
                ₹{(it.default_rate || 0).toLocaleString("en-IN")}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={onClose}
            className="h-9 px-3 rounded-lg border border-[#DDD8CE] text-[13px] text-[#333333]"
            data-testid="item-picker-close"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
