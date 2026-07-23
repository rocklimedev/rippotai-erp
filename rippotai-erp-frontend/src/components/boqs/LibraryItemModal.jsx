import React, { useState } from "react";
import { toast } from "sonner";
import {
  useCreateLibraryCategoryMutation,
  useCreateLibraryItemMutation,
  useUpdateLibraryItemMutation,
} from "../../api/boq.api";
import { useGetUnitsQuery, useCreateUnitMutation } from "../../api/unit.api";

const ADD_NEW = "__add_new__";

/* ============ Add Category Modal ============ */
function AddCategoryModal({ onClose, onAdded }) {
  const [name, setName] = useState("");
  const [createLibraryCategory] = useCreateLibraryCategoryMutation();

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      const created = await createLibraryCategory({ name: trimmed }).unwrap();
      toast.success("Category added successfully");
      onAdded(created);
      onClose();
    } catch (err) {
      toast.error("Failed to add category");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-[380px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
        <input
          autoFocus
          className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px] mb-4"
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-[#DDD8CE]"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white"
          >
            Add Category
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ Add Unit Modal (Corrected) ============ */
function AddUnitModal({ onClose, onAdded }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [createUnit] = useCreateUnitMutation();

  const handleAdd = async () => {
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedName || !trimmedCode) {
      toast.error("Name and Code are required");
      return;
    }

    try {
      const created = await createUnit({
        name: trimmedName,
        code: trimmedCode,
        description: description.trim() || null,
      }).unwrap();

      toast.success("Unit added successfully");
      onAdded(created);
      onClose();
    } catch (err) {
      const message = err?.data?.message || "Failed to add unit";
      toast.error(message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-[420px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Add New Unit</h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1">
              Unit Name
            </label>
            <input
              autoFocus
              className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5]"
              placeholder="e.g. Cubic Meter"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] uppercase"
              placeholder="e.g. M3, KG, PCS"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={20}
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5]"
              placeholder="Additional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-[#DDD8CE]"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white"
          >
            Add Unit
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ Main Library Item Modal ============ */
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

  const { data: units = [] } = useGetUnitsQuery();

  const [createLibraryItem] = useCreateLibraryItemMutation();
  const [updateLibraryItem] = useUpdateLibraryItemMutation();

  const [localCats, setLocalCats] = useState(cats);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);

  const handleCategorySelect = (value) => {
    if (value === ADD_NEW) {
      setShowAddCategory(true);
      return;
    }
    setForm({ ...form, category_id: value });
  };

  const handleUnitSelect = (value) => {
    if (value === ADD_NEW) {
      setShowAddUnit(true);
      return;
    }
    setForm({ ...form, unit_id: value });
  };

  const handleCategoryAdded = (newCat) => {
    setLocalCats((prev) => [...prev, newCat]);
    setForm((prev) => ({ ...prev, category_id: newCat.id }));
  };

  const handleUnitAdded = (newUnit) => {
    setForm((prev) => ({ ...prev, unit_id: newUnit.id }));
  };

  const save = async () => {
    try {
      const cat = localCats.find((c) => c.id === form.category_id);
      const unit = units.find((u) => u.id === form.unit_id);

      const body = {
        name: form.name.trim(),
        category_id: form.category_id || null,
        category_name: cat?.name || null,
        unit_id: form.unit_id || null,
        unit: unit?.code || null, // Important: sending code
        default_rate: form.default_rate,
        notes: form.notes,
      };

      if (isEdit) {
        await updateLibraryItem({ id: item.id, ...body }).unwrap();
      } else {
        await createLibraryItem(body).unwrap();
      }

      toast.success(isEdit ? "Item updated" : "Item added to library");
      onSaved();
    } catch {
      toast.error("Save failed");
    }
  };

  return (
    <>
      {/* Main Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl w-[440px] p-6"
          onClick={(e) => e.stopPropagation()}
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
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
                Category
              </label>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
                  Unit
                </label>
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
                      {u.name} ({u.code})
                    </option>
                  ))}
                  <option value={ADD_NEW}>+ Add new unit</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
                  Default Rate
                </label>
                <input
                  type="number"
                  step="0.01"
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
            >
              {isEdit ? "Save" : "Add"}
            </button>
          </div>
        </div>
      </div>

      {/* Sub Modals */}
      {showAddCategory && (
        <AddCategoryModal
          onClose={() => setShowAddCategory(false)}
          onAdded={handleCategoryAdded}
        />
      )}
      {showAddUnit && (
        <AddUnitModal
          onClose={() => setShowAddUnit(false)}
          onAdded={handleUnitAdded}
        />
      )}
    </>
  );
}

export default LibraryItemModal;
