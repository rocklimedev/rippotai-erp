import React, { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

/* ============ Library Item Modal ============ */
export function LibraryItemModal({ item, cats, onClose, onSaved }) {
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

export default LibraryItemModal;