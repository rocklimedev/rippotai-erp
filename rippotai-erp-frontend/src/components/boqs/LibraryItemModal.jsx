import React, { useState } from "react";
import { toast } from "sonner";
import {
  useCreateLibraryCategoryMutation,
  useCreateLibraryItemMutation,
  useUpdateLibraryItemMutation,
} from "../../api/boq/boq.api";
import {
  useGetUnitsQuery,
  useCreateUnitMutation,
} from "../../api/meta/unit.api";

import { Button, Field, TextInput, SelectInput, TextArea } from "@/components/inos";
import { Modal, Affix } from "@/components/forms/commerce-form-ui";

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
    <Modal
      title="New category"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAdd} disabled={!name.trim()}>
            Add category
          </Button>
        </>
      }
    >
      <Field label="Category name" required>
        <TextInput
          autoFocus
          placeholder="e.g. False ceiling"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
      </Field>
    </Modal>
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
    <Modal
      title="New unit"
      subtitle="Available on every library and BOQ item once added."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAdd}>
            Add unit
          </Button>
        </>
      }
    >
      <div className="inos-form-grid">
        <Field label="Unit name" required>
          <TextInput autoFocus placeholder="e.g. Cubic metre" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Code" required hint="Saved in capitals.">
          <TextInput
            style={{ textTransform: "uppercase" }}
            placeholder="e.g. M3, KG, PCS"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={20}
          />
        </Field>
      </div>
      <Field label="Description" optional>
        <TextArea rows={2} placeholder="Anything worth noting" value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
    </Modal>
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
      <Modal
        title={isEdit ? "Edit library item" : "New library item"}
        subtitle="Reusable item with a default rate for BOQs and estimates."
        onClose={onClose}
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={!form.name.trim()}>
              {isEdit ? "Save changes" : "Add to library"}
            </Button>
          </>
        }
      >
        <Field label="Name" required>
          <TextInput
            autoFocus
            placeholder="e.g. Gypsum false ceiling — plain"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Category">
          <SelectInput value={form.category_id} onChange={(e) => handleCategorySelect(e.target.value)}>
            <option value="" disabled>
              {localCats.length ? "Select category" : "No categories yet"}
            </option>
            {localCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={ADD_NEW}>+ Add new category</option>
          </SelectInput>
        </Field>
        <div className="inos-form-grid">
          <Field label="Unit">
            <SelectInput value={form.unit_id} onChange={(e) => handleUnitSelect(e.target.value)}>
              <option value="" disabled>
                Select unit
              </option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.code})
                </option>
              ))}
              <option value={ADD_NEW}>+ Add new unit</option>
            </SelectInput>
          </Field>
          <Field label="Default rate">
            <Affix pre="₹">
              <TextInput
                type="number"
                step="0.01"
                inputMode="decimal"
                style={{ textAlign: "right" }}
                value={form.default_rate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    default_rate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </Affix>
          </Field>
        </div>
        <Field label="Notes" optional>
          <TextArea rows={2} placeholder="Spec, brand or finish notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
      </Modal>

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
