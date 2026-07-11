import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { formatINR, relativeTime } from "@/lib/format";
import { toast } from "sonner";
import { Layers, Plus, Trash2, Edit3, Search, FolderInput } from "lucide-react";

const TIER_META = {
  essential: { label: "Essential", bg: "#EAEEF0", fg: "#1F453B" },
  premium: { label: "Premium", bg: "#D8E0DA", fg: "#1F453B" },
  luxury: { label: "Luxury", bg: "#D9AF61", fg: "#1F453B" },
};

/* ============ Templates List ============ */
export function BoqTemplatesList() {
  const nav = useNavigate();
  const [rows, setRows] = useState(null);
  const load = () =>
    api
      .get("/boq/templates")
      .then((r) => setRows(r.data))
      .catch(() => setRows([]));
  useEffect(() => {
    load();
  }, []);
  return (
    <div className="space-y-6" data-testid="boq-templates-page">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5">
            BOQ · Management
          </div>
          <h1 className="text-[34px] font-bold text-[#333333]">
            BOQ Templates
          </h1>
          <p className="text-[13.5px] text-[#6B7B7C] mt-1">
            Reusable BOQ blueprints. Create a new BOQ from a template to
            pre-fill categories, items and rates.
          </p>
        </div>
        <button
          onClick={() => nav("/boq/new?as_template=1")}
          className="h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold flex items-center gap-2"
          data-testid="template-create-btn"
        >
          <Plus size={15} /> Create Template
        </button>
      </div>
      <div className="bc-card overflow-hidden" data-testid="templates-table">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] bg-[#EAEEF0] border-b border-[#B5C4B6]">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-3 py-3 font-semibold">Tier</th>
              <th className="px-3 py-3 font-semibold text-right">Categories</th>
              <th className="px-3 py-3 font-semibold text-right">Items</th>
              <th className="px-3 py-3 font-semibold text-right">
                Total value
              </th>
              <th className="px-3 py-3 font-semibold">Updated</th>
              <th className="px-3 py-3 font-semibold w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows === null && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-[#6B7B7C] text-[13px]"
                >
                  Loading templates…
                </td>
              </tr>
            )}
            {rows && rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-[#6B7B7C] text-[13px]"
                >
                  No templates yet. Create your first template above.
                </td>
              </tr>
            )}
            {rows &&
              rows.map((t) => {
                const tier = TIER_META[t.template_tier] || null;
                return (
                  <tr
                    key={t.id}
                    className="border-b border-[#EAEEF0] hover:bg-[#FAF8F5]"
                    data-testid={`template-row-${t.id}`}
                  >
                    <td className="px-4 py-3">
                      <div className="text-[13.5px] font-semibold text-[#333333]">
                        {t.name}
                      </div>
                      <div className="text-[11.5px] text-[#B5C4B6]">
                        by {t.created_by || "—"}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {tier ? (
                        <span
                          className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ background: tier.bg, color: tier.fg }}
                        >
                          {tier.label}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#6B7B7C]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-[13px] text-[#6B7B7C]">
                      {t.category_count ?? 0}
                    </td>
                    <td className="px-3 py-3 text-right text-[13px] text-[#6B7B7C]">
                      {t.item_count ?? 0}
                    </td>
                    <td className="px-3 py-3 text-right text-[13px] font-semibold text-[#333333]">
                      {formatINR(t.total_value || 0)}
                    </td>
                    <td className="px-3 py-3 text-[11.5px] text-[#B5C4B6] whitespace-nowrap">
                      {relativeTime(t.updated_at)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => nav(`/boq/new?template_id=${t.id}`)}
                          className="text-[12.5px] font-semibold text-[#333333] hover:underline"
                        >
                          Use
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete template "${t.name}"?`))
                              return;
                            try {
                              await api.delete(`/boq-templates/${t.id}`);
                              toast.success("Deleted");
                              load();
                            } catch {
                              toast.error("Delete failed");
                            }
                          }}
                          className="text-[12.5px] text-[#7A2E1A] hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ Rate & Item Library ============ */
export function BoqLibraryPage() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const load = async () => {
    const [ci, cc] = await Promise.all([
      api.get(`/library/items${q ? `?q=${encodeURIComponent(q)}` : ""}`),
      api.get("/library/categories"),
    ]);
    setItems(ci.data);
    setCats(cc.data);
  };
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [q]);

  const del = async (it) => {
    if (!confirm(`Delete "${it.name}" from the library?`)) return;
    try {
      const { data } = await api.delete(`/library/items/${it.id}`);
      toast.success(
        data.referenced_by
          ? `Deleted (was used in ${data.referenced_by} BOQ line(s) — snapshots preserved)`
          : "Deleted",
      );
      load();
    } catch {
      toast.error("Delete failed");
    }
  };
  const move = async (it, category_id) => {
    if (!category_id || category_id === it.category_id) return;
    try {
      await api.patch(`/library/items/${it.id}`, {
        category_id,
        category_name: cats.find((c) => c.id === category_id)?.name,
      });
      toast.success("Moved");
      load();
    } catch {
      toast.error("Move failed");
    }
  };

  return (
    <div className="space-y-6" data-testid="library-page">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5">
            BOQ · Management
          </div>
          <h1 className="text-[34px] font-bold text-[#333333]">
            Rate &amp; Item Library
          </h1>
          <p className="text-[13.5px] text-[#6B7B7C] mt-1">
            Central library used by templates and new BOQs. Edits here
            don&apos;t rewrite existing BOQ line-item snapshots.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold flex items-center gap-2"
          data-testid="library-add-btn"
        >
          <Plus size={15} /> Add Item
        </button>
      </div>
      <div className="bc-card p-3 flex items-center gap-2">
        <Search size={14} className="text-[#B5C4B6] ml-2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search library items…"
          className="bc-input flex-1"
          data-testid="library-search"
        />
      </div>
      <div className="bc-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] bg-[#EAEEF0] border-b border-[#B5C4B6]">
              <th className="px-4 py-3 font-semibold">Item</th>
              <th className="px-3 py-3 font-semibold">Category</th>
              <th className="px-3 py-3 font-semibold">Unit</th>
              <th className="px-3 py-3 font-semibold text-right">
                Default rate
              </th>
              <th className="px-3 py-3 font-semibold w-56">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-[#6B7B7C] text-[13px]"
                >
                  No library items{q ? " for this search" : ""}.
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr
                key={it.id}
                className="border-b border-[#EAEEF0] hover:bg-[#FAF8F5]"
                data-testid={`library-row-${it.id}`}
              >
                <td className="px-4 py-3 text-[13.5px] font-semibold text-[#333333]">
                  {it.name}
                </td>
                <td className="px-3 py-3 text-[12.5px] text-[#6B7B7C]">
                  {it.category_name || "—"}
                </td>
                <td className="px-3 py-3 text-[12.5px] text-[#6B7B7C]">
                  {it.unit}
                </td>
                <td className="px-3 py-3 text-[13px] text-right text-[#333333] font-semibold">
                  {formatINR(it.default_rate || 0)}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditing(it)}
                      className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#333333] hover:underline"
                      data-testid={`library-edit-${it.id}`}
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                    <select
                      onChange={(e) => move(it, e.target.value)}
                      value=""
                      className="h-7 px-1 text-[11.5px] border border-[#DDD8CE] bg-[#FAF8F5] rounded"
                      data-testid={`library-move-${it.id}`}
                      title="Move to category"
                    >
                      <option value="">Move to…</option>
                      {cats
                        .filter((c) => c.id !== it.category_id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => del(it)}
                      className="inline-flex items-center gap-1 text-[12.5px] text-[#7A2E1A] hover:underline"
                      data-testid={`library-delete-${it.id}`}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(editing || creating) && (
        <LibraryItemModal
          item={editing}
          cats={cats}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function LibraryItemModal({ item, cats, onClose, onSaved }) {
  const isEdit = !!item;
  const [form, setForm] = useState(
    item
      ? {
          name: item.name,
          category_id: item.category_id || "",
          unit: item.unit || "Nos.",
          default_rate: item.default_rate || 0,
          notes: item.notes || "",
        }
      : {
          name: "",
          category_id: cats[0]?.id || "",
          unit: "Nos.",
          default_rate: 0,
          notes: "",
        },
  );
  const save = async () => {
    try {
      const cat = cats.find((c) => c.id === form.category_id);
      const body = { ...form, category_name: cat?.name };
      if (isEdit) await api.patch(`/library/items/${item.id}`, body);
      else await api.post(`/library/items`, body);
      toast.success(isEdit ? "Saved" : "Added to library");
      onSaved();
    } catch {
      toast.error("Save failed");
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-[440px] p-6"
        onClick={(e) => e.stopPropagation()}
        data-testid="library-modal"
      >
        <div className="text-[18px] font-semibold text-[#333333] mb-4">
          {isEdit ? "Edit Library Item" : "Add Library Item"}
        </div>
        <div className="grid gap-3">
          <div>
            <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
              Name
            </label>
            <input
              className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              data-testid="library-modal-name"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
              Category
            </label>
            <select
              className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
              value={form.category_id}
              onChange={(e) =>
                setForm({ ...form, category_id: e.target.value })
              }
            >
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
                Unit
              </label>
              <input
                className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
                Default rate
              </label>
              <input
                type="number"
                className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                value={form.default_rate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    default_rate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
              Notes
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-[#DDD8CE] text-[13px] font-semibold text-[#333333]"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold"
            data-testid="library-modal-save"
          >
            {isEdit ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ BOQ Activity ============ */
export function BoqActivityPage() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    user: "",
    action: "",
    date_from: "",
    date_to: "",
  });
  useEffect(() => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && p.set(k, v));
    api
      .get(`/boq/activity?${p.toString()}`)
      .then((r) => setRows(r.data))
      .catch(() => setRows([]));
  }, [filters]);
  const actions = Array.from(new Set(rows.map((r) => r.action)));
  const users = Array.from(new Set(rows.map((r) => r.user)));
  return (
    <div className="space-y-6" data-testid="boq-activity-page">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5">
          BOQ · Settings
        </div>
        <h1 className="text-[34px] font-bold text-[#333333]">Activity</h1>
        <p className="text-[13.5px] text-[#6B7B7C] mt-1">
          Every change made inside the BOQ module — creations, edits, approvals,
          item moves, rate changes.
        </p>
      </div>
      <div className="bc-card p-3 flex flex-wrap items-center gap-2">
        <select
          className="h-9 px-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[12.5px]"
          value={filters.user}
          onChange={(e) => setFilters({ ...filters, user: e.target.value })}
          data-testid="activity-filter-user"
        >
          <option value="">All users</option>
          {users.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <select
          className="h-9 px-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[12.5px]"
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          data-testid="activity-filter-action"
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="h-9 px-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[12.5px]"
          value={filters.date_from}
          onChange={(e) =>
            setFilters({ ...filters, date_from: e.target.value })
          }
          data-testid="activity-filter-from"
        />
        <input
          type="date"
          className="h-9 px-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[12.5px]"
          value={filters.date_to}
          onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
          data-testid="activity-filter-to"
        />
        {(filters.user ||
          filters.action ||
          filters.date_from ||
          filters.date_to) && (
          <button
            onClick={() =>
              setFilters({ user: "", action: "", date_from: "", date_to: "" })
            }
            className="text-[12px] text-[#7A2E1A] font-semibold hover:underline"
          >
            Clear
          </button>
        )}
      </div>
      <div className="bc-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] bg-[#EAEEF0] border-b border-[#B5C4B6]">
              <th className="px-4 py-3 font-semibold">When</th>
              <th className="px-3 py-3 font-semibold">User</th>
              <th className="px-3 py-3 font-semibold">Action</th>
              <th className="px-3 py-3 font-semibold">Target</th>
              <th className="px-3 py-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-[#6B7B7C] text-[13px]"
                >
                  No activity yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-[#EAEEF0]"
                data-testid={`activity-row-${r.id}`}
              >
                <td className="px-4 py-3 text-[12.5px] text-[#6B7B7C] whitespace-nowrap">
                  {new Date(r.at).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-3 py-3 text-[13px] text-[#333333]">
                  {r.user}
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAEEF0] text-[#333333]">
                    {r.action}
                  </span>
                </td>
                <td className="px-3 py-3 text-[13px] font-semibold text-[#333333]">
                  {r.target}
                </td>
                <td className="px-3 py-3 text-[12.5px] text-[#6B7B7C]">
                  {r.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
