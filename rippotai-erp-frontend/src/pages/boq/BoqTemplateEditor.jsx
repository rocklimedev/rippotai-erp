import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Trash2,
  LayoutTemplate,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import {
  useGetTemplateByIdQuery,
  useUpdateTemplateMutation,
  // BOQ APIs (replacing template category/item APIs)
  useAddBoqCategoryMutation,
  useDeleteBoqCategoryMutation,
  useAddBoqItemMutation,
  useUpdateBoqItemMutation,
  useDeleteBoqItemMutation,
} from "../../api/boq.api";
import { SaveChip } from "../../components/boqs/StatusIndicators";
import { AddItemPicker } from "../../components/boqs/AddItemPicker";
import { AddCategoryPanel } from "../../components/boqs/AddCategoryPanel";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ItemRow } from "../../components/boqs/ItemRow";

const TIERS = [
  { value: "essential", label: "Essential" },
  { value: "premium", label: "Premium" },
  { value: "luxury", label: "Luxury" },
];

export default function BoqTemplateEditor() {
  const { id } = useParams();
  const nav = useNavigate();

  const { data: template, isLoading, refetch } = useGetTemplateByIdQuery(id);
  const [updateTemplate] = useUpdateTemplateMutation();

  // Switched to BOQ category/item mutations
  const [addCategory] = useAddBoqCategoryMutation();
  const [deleteCategory] = useDeleteBoqCategoryMutation();
  const [addItem] = useAddBoqItemMutation();
  const [updateItem] = useUpdateBoqItemMutation();
  const [deleteItem] = useDeleteBoqItemMutation();

  const [saveState, setSaveState] = useState("idle");
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());

  // Picker States
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickerCategoryId, setPickerCategoryId] = useState(null);
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  const withSaveChip = async (promise) => {
    setSaveState("saving");
    try {
      await promise;
      setSaveState("saved");
      setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1200);
    } catch {
      toast.error("Save failed");
      setSaveState("error");
    }
  };

  const debouncedUpdateTemplate = useDebouncedCallback(
    (patch) => withSaveChip(updateTemplate({ id, ...patch }).unwrap()),
    800,
  );

  const handleCategoryAdded = () => {
    refetch();
    setShowCategoryPanel(false);
  };

  const openItemPicker = (categoryId) => {
    setPickerCategoryId(categoryId);
    setShowItemPicker(true);
  };

  const handlePickerPick = async ({ payload }) => {
    if (!pickerCategoryId) {
      toast.error("No category selected");
      return;
    }

    try {
      await addItem({
        boqId: id, // Changed from templateId
        categoryId: pickerCategoryId,
        name: payload.description,
        unit: payload.unit || "Nos.",
        quantity: payload.quantity || 1,
        rate: payload.rate || 0,
        library_item_id: payload.library_item_id,
        notes: payload.notes || "",
      }).unwrap();

      toast.success("Item added successfully");
      refetch();
    } catch (err) {
      toast.error("Failed to add item");
    }
  };

  const patchItem = (itemId, patch) =>
    withSaveChip(updateItem({ boqId: id, itemId, ...patch }).unwrap());

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteItem({ boqId: id, itemId }).unwrap();
      toast.success("Item deleted");
      refetch();
    } catch {
      toast.error("Delete failed");
    }
  };

  const toggleCollapse = (catId) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleReorderItems = async (categoryId, newOrder) => {
    // You may want to call reorderBoqItems here if needed
    refetch();
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm("Delete this category and all its items?")) return;
    try {
      await deleteCategory({ boqId: id, categoryId }).unwrap();
      toast.success("Category deleted");
      refetch();
    } catch {
      toast.error("Delete failed");
    }
  };

  if (isLoading || !template) {
    return (
      <div className="min-h-screen bc-page-bg flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#6B7B7C]">
          <Loader2 size={16} className="animate-spin" /> Loading template…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bc-page-bg">
      {/* Header & main content remain mostly the same */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#B5C4B6]">
        <div className="h-14 px-4 lg:px-8 flex items-center gap-3">
          <button
            onClick={() => nav("/boq/templates")}
            className="flex items-center gap-2 text-[13px] text-[#6B7B7C] hover:text-[#333333]"
          >
            <ArrowLeft size={15} /> Templates
          </button>
          <div className="text-[12px] text-[#B5C4B6] hidden md:flex items-center gap-2">
            <span>/</span>
            <span className="text-[#333333] font-medium truncate max-w-[300px]">
              {template.name}
            </span>
          </div>
          <div className="ml-3">
            <SaveChip state={saveState} />
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Template Details Section (unchanged) */}
        <section className="bc-card p-6 space-y-4">
          {/* ... same as before ... */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[#6B7B7C] mb-1.5">
                Name
              </label>
              <input
                className="bc-input"
                defaultValue={template.name}
                onChange={(e) =>
                  debouncedUpdateTemplate({ name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#6B7B7C] mb-1.5">
                Tier
              </label>
              <select
                className="bc-input"
                defaultValue={template.template_tier || ""}
                onChange={(e) =>
                  debouncedUpdateTemplate({
                    template_tier: e.target.value || null,
                  })
                }
              >
                <option value="">No tier</option>
                {TIERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#6B7B7C] mb-1.5">
              Description
            </label>
            <textarea
              className="bc-input min-h-[80px]"
              defaultValue={template.description || ""}
              onChange={(e) =>
                debouncedUpdateTemplate({ description: e.target.value })
              }
            />
          </div>
        </section>

        {/* Add Category Bar */}
        <section className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryPanel(true)}
            className="h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold flex items-center gap-2 hover:bg-[#1F453B]/90 transition"
          >
            <Plus size={15} /> Add Category from Library
          </button>

          <span className="ml-auto text-[12px] text-[#6B7B7C]">
            Total value: {formatINR(template.total_value || 0)}
          </span>
        </section>

        {/* Categories Table - unchanged structure */}
        <div className="bc-card overflow-hidden">
          <table className="w-full text-[13px]">
            {/* thead unchanged */}
            <thead className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] border-b border-[#EAEEF0]">
              <tr>
                <th className="p-2 text-left w-8"></th>
                <th className="p-2 text-left">Item</th>
                <th className="p-2 text-left w-[90px]">Unit</th>
                <th className="p-2 text-right w-[90px]">Quantity</th>
                <th className="p-2 text-right w-[100px]">Rate</th>
                <th className="p-2 text-right w-[110px]">Amount</th>
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {(template.categories || []).map((cat) => {
                const isCollapsed = collapsedCategories.has(cat.id);
                const items = cat.items || [];
                const subtotal = items.reduce(
                  (sum, item) =>
                    sum + Number(item.quantity || 0) * Number(item.rate || 0),
                  0,
                );

                return (
                  <React.Fragment key={cat.id}>
                    <tr className="boq-category-row border-b border-[#EAEEF0]">
                      <td colSpan={7}>
                        <div className="flex items-center gap-3 px-4 py-3 bg-[#EAEEF0]">
                          {/* Collapse, name, subtotal, menu - unchanged */}
                          <button
                            onClick={() => toggleCollapse(cat.id)}
                            className="p-1 rounded hover:bg-[#B5C4B6]"
                          >
                            {isCollapsed ? (
                              <ChevronRight size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>

                          <div className="w-8 h-8 rounded bg-[#1F453B] text-white text-[13px] font-bold flex items-center justify-center">
                            {cat.code || "C"}
                          </div>

                          <h3 className="font-serif-bc text-[18px] text-[#333333] flex-1">
                            {cat.name}
                          </h3>

                          <div className="text-[11.5px] text-[#B5C4B6]">
                            {items.length} items
                          </div>

                          <div className="text-[13px] font-semibold text-[#333333] min-w-[120px] text-right">
                            SUBTOTAL {formatINR(subtotal)}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded hover:bg-[#B5C4B6]">
                                <MoreHorizontal size={16} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => openItemPicker(cat.id)}
                              >
                                <Plus size={13} className="mr-2" /> Add from
                                Library
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleDeleteCategory(cat.id)}
                                className="text-[#7A2E1A]"
                              >
                                <Trash2 size={13} className="mr-2" /> Delete
                                category
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>

                    {!isCollapsed && (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => {
                          if (!e.over || e.active.id === e.over.id) return;
                          const oldIndex = items.findIndex(
                            (i) => i.id === e.active.id,
                          );
                          const newIndex = items.findIndex(
                            (i) => i.id === e.over.id,
                          );
                          const newOrder = arrayMove(
                            items,
                            oldIndex,
                            newIndex,
                          ).map((i) => i.id);
                          handleReorderItems(cat.id, newOrder);
                        }}
                      >
                        <SortableContext
                          items={items.map((i) => i.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {items.map((item, idx) => (
                            <ItemRow
                              key={item.id}
                              item={item}
                              sno={idx + 1}
                              onPatch={(patch) => patchItem(item.id, patch)}
                              onDelete={() => handleDeleteItem(item.id)}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    )}

                    {!isCollapsed && items.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center text-[#B5C4B6] text-[12.5px]"
                        >
                          No items in this category yet.{" "}
                          <button
                            onClick={() => openItemPicker(cat.id)}
                            className="text-[#1F453B] font-semibold hover:underline"
                          >
                            Add from Library
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {(template.categories || []).length === 0 && (
          <section className="bc-card p-14 text-center text-[#6B7B7C] text-[13px]">
            No categories yet. Click "Add Category from Library" above.
          </section>
        )}
      </main>

      {/* Modals remain the same */}
      <AddItemPicker
        open={showItemPicker}
        onClose={() => {
          setShowItemPicker(false);
          setPickerCategoryId(null);
        }}
        onPick={handlePickerPick}
        categories={template.categories || []}
        defaultCategoryId={pickerCategoryId}
      />

      <AddCategoryPanel
        open={showCategoryPanel}
        onClose={() => setShowCategoryPanel(false)}
        boqId={id}
        existingCategories={
          new Set(
            (template.categories || []).map((c) => c.name.toLowerCase().trim()),
          )
        }
        onAdded={handleCategoryAdded}
      />
    </div>
  );
}
