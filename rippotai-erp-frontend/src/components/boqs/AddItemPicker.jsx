import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useGetLibraryItemsQuery, useCreateLibraryItemMutation } from "../../api/boq.api";

const CREATE_NEW = "__new__";

export function AddItemPicker({ open, onClose, onPick, categories = [], defaultCategoryId }) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    unit: "Nos.",
    default_rate: 0,
    notes: "",
    category_id: "",
    new_category_name: "",
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 150);
    return () => clearTimeout(t);
  }, [q]);

  const { data: results = [] } = useGetLibraryItemsQuery(
    debouncedQ ? { q: debouncedQ } : undefined,
    { skip: !open },
  );
  const [createLibraryItem] = useCreateLibraryItemMutation();

  useEffect(() => {
    if (open) {
      setNewItem((v) => ({ ...v, category_id: defaultCategoryId || categories[0]?.id || "" }));
    } else {
      setQ("");
      setCreating(false);
      setNewItem({ name: "", unit: "Nos.", default_rate: 0, notes: "", category_id: "", new_category_name: "" });
    }
    // eslint-disable-next-line
  }, [open, defaultCategoryId]);

  if (!open) return null;

const pickFromLibrary = (it) => {
  onPick({
    payload: {
      name: it.name,              // ✅ was `description: it.name`
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
    if (!newItem.name.trim()) return toast.error("Name required");
    const isNewCat = newItem.category_id === CREATE_NEW;
    if (!isNewCat && !newItem.category_id) return toast.error("Category required");
    if (isNewCat && !newItem.new_category_name.trim()) return toast.error("New category name required");

    try {
      const chosenCat = isNewCat ? null : categories.find((c) => c.id === newItem.category_id);
      const lib = await createLibraryItem({
        name: newItem.name,
        unit: newItem.unit,
        default_rate: newItem.default_rate,
        notes: newItem.notes,
        category_name: isNewCat ? newItem.new_category_name : chosenCat?.name,
      }).unwrap();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose} data-testid="add-item-picker">
      <div className="bg-white rounded-2xl w-[560px] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="text-[16px] font-semibold text-[#333333] mb-3">Add BOQ Item</div>
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
          <div className="border border-[#DDD8CE] rounded-xl p-3 mb-3 bg-[#FAF8F5]" data-testid="item-picker-inline-create">
            <div className="text-[12px] font-semibold text-[#333333] mb-2">New Item (added to library too)</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Name *"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="h-9 px-2 rounded-lg border border-[#DDD8CE] bg-white text-[13px] col-span-2"
                data-testid="picker-new-name"
              />
              <select
                value={newItem.category_id}
                onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}
                className="h-9 px-2 rounded-lg border border-[#DDD8CE] bg-white text-[13px] col-span-2"
                data-testid="picker-new-category"
              >
                <option value="" disabled>Category *</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value={CREATE_NEW}>➕ Create new category…</option>
              </select>
              {newItem.category_id === CREATE_NEW && (
                <input
                  placeholder="New category name *"
                  value={newItem.new_category_name}
                  onChange={(e) => setNewItem({ ...newItem, new_category_name: e.target.value })}
                  className="h-9 px-2 rounded-lg border border-[#1F453B] bg-white text-[13px] col-span-2"
                  data-testid="picker-new-category-name"
                />
              )}
              <input
                placeholder="Unit"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                className="h-9 px-2 rounded-lg border border-[#DDD8CE] bg-white text-[13px]"
              />
              <input
                type="number"
                placeholder="Default rate"
                value={newItem.default_rate}
                onChange={(e) => setNewItem({ ...newItem, default_rate: parseFloat(e.target.value) || 0 })}
                className="h-9 px-2 rounded-lg border border-[#DDD8CE] bg-white text-[13px]"
              />
              <input
                placeholder="Notes (optional)"
                value={newItem.notes}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                className="h-9 px-2 rounded-lg border border-[#DDD8CE] bg-white text-[13px] col-span-2"
              />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setCreating(false)} className="h-8 px-3 rounded-lg border border-[#DDD8CE] text-[12.5px] text-[#333333]">
                Cancel
              </button>
              <button onClick={createInline} className="h-8 px-3 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold" data-testid="picker-new-save">
                Save &amp; Add
              </button>
            </div>
          </div>
        )}
        <div className="max-h-[300px] overflow-y-auto border border-[#EAEEF0] rounded-lg" data-testid="item-picker-results">
          {results.length === 0 && (
            <div className="p-4 text-center text-[13px] text-[#6B7B7C]">No matches{q ? " — click + to create" : ""}.</div>
          )}
          {results.map((it) => (
            <button
              key={it.id}
              onClick={() => pickFromLibrary(it)}
              className="w-full text-left px-3 py-2 border-b border-[#EAEEF0] hover:bg-[#FAF8F5] flex items-center justify-between"
              data-testid={`item-picker-row-${it.id}`}
            >
              <div>
                <div className="text-[13.5px] font-semibold text-[#333333]">{it.name}</div>
                <div className="text-[11.5px] text-[#6B7B7C]">{it.category_name || "—"} · {it.unit}</div>
              </div>
              <div className="text-[12.5px] font-semibold text-[#333333]">₹{(it.default_rate || 0).toLocaleString("en-IN")}</div>
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={onClose} className="h-9 px-3 rounded-lg border border-[#DDD8CE] text-[13px] text-[#333333]" data-testid="item-picker-close">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}