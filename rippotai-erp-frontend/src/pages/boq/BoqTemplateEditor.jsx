import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import {
  ArrowLeft,
  Plus,
  Loader2,
  MoreHorizontal,
  Sparkles,
  AlertCircle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatINR } from "@/lib/format";
import {
  useGetTemplateByIdQuery,
  useUpdateTemplateMutation,
  useAddTemplateCategoryMutation,
  useDeleteTemplateCategoryMutation,
  useAddTemplateItemMutation,
  useUpdateTemplateItemMutation,
  useDeleteTemplateItemMutation,
  useReorderTemplateItemsMutation,
} from "../../api/boq.api";
import { SaveChip } from "../../components/boqs/StatusIndicators";
import { AddItemPicker } from "../../components/boqs/AddItemPicker";
import { AddCategoryPanel } from "../../components/boqs/AddCategoryPanel";
import { ItemDetailDrawer } from "../../components/boqs/ItemDetailDrawer";
import { CategoryBlock } from "../../components/boqs/CategoryBlock";
import { BulkActionBar } from "../../components/boqs/BulkActionBar";

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
  const [addCategory] = useAddTemplateCategoryMutation();
  const [deleteCategory] = useDeleteTemplateCategoryMutation();
  const [addItem] = useAddTemplateItemMutation();
  const [updateItem] = useUpdateTemplateItemMutation();
  const [deleteItem] = useDeleteTemplateItemMutation();
  const [reorderItems] = useReorderTemplateItemsMutation();

  const [saveState, setSaveState] = useState("idle");
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [customCatOpen, setCustomCatOpen] = useState(false);
  const [customCatName, setCustomCatName] = useState("");
  const [detailItem, setDetailItem] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pickerFor, setPickerFor] = useState(null);

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

  const patchItem = (itemId, patch) =>
    withSaveChip(updateItem({ templateId: id, itemId, ...patch }).unwrap());

  const handleAddItem = (cid) => setPickerFor({ cid });

  const addItemFromPicker = async ({
    payload,
    targetCategoryId,
    newCategoryName,
  }) => {
    if (!pickerFor) return;
    try {
      let cid = targetCategoryId || pickerFor.cid;
      if (newCategoryName) {
        const created = await addCategory({
          templateId: id,
          name: newCategoryName,
        }).unwrap();
        const cat = (created.categories || []).find(
          (c) => c.name === newCategoryName,
        );
        if (!cat) throw new Error("Category creation failed");
        cid = cat.id;
      }
      await addItem({
        templateId: id,
        categoryId: cid,
        name: payload.description,
        unit: payload.unit || "Nos.",
        quantity: payload.quantity || 1,
        rate: payload.rate || 0,
        library_item_id: payload.library_item_id,
        notes: payload.notes || "",
      }).unwrap();
      toast.success("Item added");
      setPickerFor(null);
      refetch();
    } catch {
      toast.error("Failed to add item");
    }
  };

  const handleDeleteItem = async (itemId, cat) => {
    const item = (cat?.items || []).find((i) => i.id === itemId);
    try {
      await deleteItem({ templateId: id, itemId }).unwrap();
      toast("Item deleted", {
        action: item && {
          label: "Undo",
          onClick: async () => {
            try {
              await addItem({
                templateId: id,
                categoryId: item.category_id || cat.id,
                name: item.name,
                unit: item.unit,
                quantity: item.quantity,
                rate: item.rate,
                library_item_id: item.library_item_id,
                notes: item.notes,
              }).unwrap();
              toast.success("Restored");
              refetch();
            } catch {
              toast.error("Undo failed");
            }
          },
        },
        duration: 5000,
      });
      refetch();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleDuplicateItem = async (itemId, cat) => {
    const item = (cat?.items || []).find((i) => i.id === itemId);
    if (!item) return;
    try {
      await addItem({
        templateId: id,
        categoryId: item.category_id || cat.id,
        name: item.name + " (copy)",
        unit: item.unit,
        quantity: item.quantity,
        rate: item.rate,
        library_item_id: item.library_item_id,
        notes: item.notes,
      }).unwrap();
      refetch();
    } catch {
      toast.error("Duplicate failed");
    }
  };

  const handleReorderItems = async (cid, orderedIds) => {
    try {
      await reorderItems({
        templateId: id,
        categoryId: cid,
        orderedIds,
      }).unwrap();
      refetch();
    } catch {
      toast.error("Reorder failed");
    }
  };

  const handleDeleteCategory = async (cid) => {
    if (!confirm("Delete this category and all its items?")) return;
    try {
      await deleteCategory({ templateId: id, categoryId: cid }).unwrap();
      toast.success("Category removed");
      refetch();
    } catch {
      toast.error("Delete failed");
    }
  };

  const addCustomCategory = async () => {
    if (!customCatName.trim()) return;
    try {
      await addCategory({ templateId: id, name: customCatName }).unwrap();
      toast.success("Category added");
      setCustomCatOpen(false);
      setCustomCatName("");
      refetch();
    } catch {
      toast.error("Failed");
    }
  };

  // No bulk endpoint exists for templates yet — fan out individual calls instead.
  const handleBulkAction = async (op, value) => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    try {
      if (op === "delete") {
        await Promise.all(
          ids.map((itemId) => deleteItem({ templateId: id, itemId }).unwrap()),
        );
      } else if (op === "change_unit") {
        await Promise.all(
          ids.map((itemId) =>
            updateItem({ templateId: id, itemId, unit: value }).unwrap(),
          ),
        );
      }
      setSelectedIds(new Set());
      toast.success(op === "delete" ? "Deleted" : "Updated");
      refetch();
    } catch {
      toast.error("Bulk action failed");
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName,
      );
      if (e.key === "Delete" && !isInput && selectedIds.size > 0) {
        e.preventDefault();
        handleBulkAction("delete");
      }
      if (e.key === "Escape" && selectedIds.size > 0) {
        e.preventDefault();
        setSelectedIds(new Set());
      }
    };
    const onClick = (e) => {
      if (selectedIds.size === 0) return;
      const t = e.target;
      if (
        !t.closest ||
        t.closest('[data-testid="template-main-table"]') ||
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
    // eslint-disable-next-line
  }, [selectedIds]);

  if (isLoading || !template) {
    return (
      <div className="min-h-screen bc-page-bg flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#6B7B7C]">
          <Loader2 size={16} className="animate-spin" /> Loading template…
        </div>
      </div>
    );
  }

  const categories = template.categories || [];
  const allItems = categories.flatMap((c) => c.items || []);
  const existingCategories = new Set(
    categories.map((c) => c.name.toLowerCase().trim()),
  );
  const attentionCount = allItems.filter(
    (i) => !i.unit || !i.quantity || !i.rate,
  ).length;

  const itemsByCat = (cid) => categories.find((c) => c.id === cid)?.items || [];

  const onSelectItem = (iid, checked) =>
    setSelectedIds((s) => {
      const n = new Set(s);
      checked ? n.add(iid) : n.delete(iid);
      return n;
    });
  const onSelectCategory = (cid, checked) =>
    setSelectedIds((s) => {
      const n = new Set(s);
      itemsByCat(cid).forEach((i) => (checked ? n.add(i.id) : n.delete(i.id)));
      return n;
    });

  return (
    <div className="min-h-screen bc-page-bg">
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
            <span className="text-[#6B7B7C]">Template</span>
            <span>/</span>
            <span className="text-[#333333] font-medium truncate max-w-[300px]">
              {template.name}
            </span>
          </div>
          <div className="ml-3">
            <SaveChip state={saveState} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 rounded-lg border border-[#B5C4B6] hover:bg-[#EAEEF0] flex items-center justify-center">
                  <MoreHorizontal size={15} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => window.print()}>
                  Print
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="bc-card p-6 space-y-4">
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

        <section className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setAddCatOpen(true)}
            className="h-10 px-4 rounded-xl border-2 border-[#1F453B] text-[#333333] hover:bg-[#EAEEF0] text-[13px] font-semibold flex items-center gap-2"
            data-testid="add-category-btn"
          >
            <Plus size={15} /> Add Category
          </button>
          <button
            onClick={() => setCustomCatOpen(true)}
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
              {categories.length} categories · {allItems.length} line items
            </span>
            <span className="text-[12px] font-semibold text-[#333333]">
              Total value: {formatINR(template.total_value || 0)}
            </span>
          </div>
        </section>

        {categories.length === 0 ? (
          <section className="bc-card p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#EAEEF0] flex items-center justify-center mx-auto mb-4">
              <Sparkles size={22} className="text-[#333333]" />
            </div>
            <h2 className="text-[18px] font-bold text-[#333333]">
              Start building this template
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
            data-testid="template-main-table"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] bg-[#EAEEF0] border-b border-[#B5C4B6] sticky top-0">
                  <tr>
                    <th className="p-2 w-11"></th>
                    <th className="p-2 text-center w-11 whitespace-nowrap">
                      S. No.
                    </th>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-left w-[92px]">Location</th>
                    <th className="p-2 text-left w-[92px]">Unit</th>
                    <th className="p-2 text-right w-[80px]">Quantity</th>
                    <th className="p-2 text-right w-[100px]">Rate</th>
                    <th className="p-2 text-left w-[92px]">Type</th>
                    <th className="p-2 text-right w-[120px]">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, index) => (
                    <CategoryBlock
                      key={cat.id}
                      cat={{
                        ...cat,
                        code: cat.code || String(index + 1).padStart(2, "0"),
                        subtotal:
                          cat.subtotal ??
                          (cat.items || []).reduce(
                            (sum, item) =>
                              sum +
                              Number(item.quantity || 0) *
                                Number(item.rate || 0),
                            0,
                          ),
                      }}
                      items={cat.items || []}
                      disabled={false}
                      selectedIds={selectedIds}
                      onSelectItem={onSelectItem}
                      onSelectCategory={onSelectCategory}
                      onPatchItem={patchItem}
                      onDeleteItem={(itemId) => handleDeleteItem(itemId, cat)}
                      onDuplicateItem={(itemId) =>
                        handleDuplicateItem(itemId, cat)
                      }
                      onOpenDetail={setDetailItem}
                      onAddItem={handleAddItem}
                      onDeleteCat={handleDeleteCategory}
                      onReorderItems={handleReorderItems}
                      onToggleHide={() => {}}
                      onLockedEdit={() => {}}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <BulkActionBar
          count={selectedIds.size}
          onChangeUnit={(unit) => handleBulkAction("change_unit", unit)}
          onDelete={() => handleBulkAction("delete")}
          onDeselectAll={() => setSelectedIds(new Set())}
        />
      </main>

      <AddCategoryPanel
        open={addCatOpen}
        onClose={setAddCatOpen}
        boqId={id}
        mode="template"
        existingCategories={existingCategories}
        onAdded={() => {
          setAddCatOpen(false);
          refetch();
        }}
      />

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
        disabled={false}
        onPatch={(patch) => detailItem && patchItem(detailItem.id, patch)}
      />

      <AddItemPicker
        open={!!pickerFor}
        defaultCategoryId={pickerFor?.cid}
        categories={categories}
        onClose={() => setPickerFor(null)}
        onPick={addItemFromPicker}
      />
    </div>
  );
}
