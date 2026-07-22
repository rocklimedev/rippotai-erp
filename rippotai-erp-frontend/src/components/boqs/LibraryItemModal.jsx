import React, { useState } from "react";
import { toast } from "sonner";
import {
  useCreateLibraryCategoryMutation,
  useCreateLibraryItemMutation,
  useUpdateLibraryItemMutation,
} from "../../api/boq.api"; // adjust path to your boqApi slice
import {
  useGetUnitsQuery,
  useCreateUnitMutation,
} from "../../api/unit.api"; // adjust path to your unitApi slice

const ADD_NEW = "__add_new__";

/* ============ Library Item Modal ============ */
export function LibraryItemModal({ item, cats, onClose, onSaved }) {
  const isEdit = !!item;
 
  const [form, setForm] = useState(
    item
      ? {
          name: item.name,
          category_id: item.category_id || "",
          unit_id: item.unit_id || "",
          default_rate: item.default_rate || 0,
          notes: item.notes || "",
        }
      : {
          name: "",
          category_id: cats[0]?.id || "",
          unit_id: "",
          default_rate: 0,
          notes: "",
        },
  );

  // ---- data ----
  const { data: units = [] } = useGetUnitsQuery();

  // ---- mutations ----
  const [createLibraryCategory] = useCreateLibraryCategoryMutation();
  const [createUnit] = useCreateUnitMutation();
  const [createLibraryItem] = useCreateLibraryItemMutation();
  const [updateLibraryItem] = useUpdateLibraryItemMutation();

  // ---- local category list (so a freshly-added one shows immediately) ----
  const [localCats, setLocalCats] = useState(cats);

  // ---- inline "add new" state ----
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingUnit, setAddingUnit] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newUnitName, setNewUnitName] = useState("");

  const handleCategorySelect = (value) => {
    if (value === ADD_NEW) {
      setAddingCategory(true);
      return;
    }
    setForm({ ...form, category_id: value });
  };

  const handleUnitSelect = (value) => {
    if (value === ADD_NEW) {
      setAddingUnit(true);
      return;
    }
    setForm({ ...form, unit_id: value });
  };

  const confirmNewCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      const created = await createLibraryCategory({ name }).unwrap();
      setLocalCats((prev) => [...prev, created]);
      setForm({ ...form, category_id: created.id });
      setAddingCategory(false);
      setNewCategoryName("");
      toast.success("Category added");
    } catch {
      toast.error("Could not add category");
    }
  };

  const confirmNewUnit = async () => {
    const name = newUnitName.trim();
    if (!name) return;
    try {
      const created = await createUnit({ name }).unwrap();
      setForm({ ...form, unit_id: created.id });
      setAddingUnit(false);
      setNewUnitName("");
      toast.success("Unit added");
    } catch {
      toast.error("Could not add unit");
    }
  };

const save = async () => {
  try {
    const cat = localCats.find((c) => c.id === form.category_id);
    const unit = units.find((u) => u.id === form.unit_id);

    const body = {
      name: form.name,
      category_id: form.category_id || null,
      category_name: cat?.name || null,
      unit_id: form.unit_id || null,
      unit: unit?.code || null,        // ✅ matches `unit` VARCHAR(20) column — stores code, not name
      default_rate: form.default_rate,
      notes: form.notes,
    };

    if (isEdit) {
      await updateLibraryItem({ id: item.id, ...body }).unwrap();
    } else {
      await createLibraryItem(body).unwrap();
    }
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

          {/* ---- Category ---- */}
          <div>
            <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
              Category
            </label>
            {!addingCategory ? (
              <select
                className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                value={form.category_id}
                onChange={(e) => handleCategorySelect(e.target.value)}
              >
                {localCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value={ADD_NEW}>+ Add new category</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  autoFocus
                  className="h-10 flex-1 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmNewCategory()}
                />
                <button
                  onClick={confirmNewCategory}
                  className="h-10 px-3 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setAddingCategory(false);
                    setNewCategoryName("");
                  }}
                  className="h-10 px-3 rounded-lg border border-[#DDD8CE] text-[13px]"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* ---- Unit ---- */}
            <div>
              <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
                Unit
              </label>
              {!addingUnit ? (
                <select
                  className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                  value={form.unit_id}
                  onChange={(e) => handleUnitSelect(e.target.value)}
                >
                  <option value="" disabled>
                    Select unit
                  </option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                  <option value={ADD_NEW}>+ Add new unit</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    className="h-10 flex-1 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                    placeholder="New unit"
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmNewUnit()}
                  />
                  <button
                    onClick={confirmNewUnit}
                    className="h-10 px-3 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setAddingUnit(false);
                      setNewUnitName("");
                    }}
                    className="h-10 px-3 rounded-lg border border-[#DDD8CE] text-[13px]"
                  >
                    ✕
                  </button>
                </div>
              )}
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

export default LibraryItemModal;