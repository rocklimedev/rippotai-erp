import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import {
  ArrowLeft,
  Plus,
  Copy,
  Download,
  MoreHorizontal,
  Send,
  CheckCircle2,
  Loader2,
  GitBranch,
  Sparkles,
  AlertCircle,
  Eye,
  Lock,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { arrayMove } from "@dnd-kit/sortable";

import {
  useGetBoqByIdQuery,
  useUpdateBoqMutation,
  useDeleteBoqMutation,
  useAddBoqCategoryMutation,
  useDeleteBoqCategoryMutation,
  useAddBoqItemMutation,
  useUpdateBoqItemMutation,
  useDeleteBoqItemMutation,
  useReorderBoqItemsMutation,
  useBulkUpdateBoqItemsMutation,
  useSubmitBoqForApprovalMutation,
  useApproveBoqMutation,
  useDuplicateBoqVersionMutation,
  useCreateBoqNewVersionMutation,
  useExportBoqExcelMutation,
  useExportBoqPdfMutation,
  useApplyBoqTermsMutation,
} from "../../api/boq.api";
import { isBoqDisabled } from "../../hooks/constants";
import { SaveChip } from "../../components/boqs/StatusIndicators";
import { LockedEditModal } from "../../components/boqs/LockedEditModal";
import { AddCategoryPanel } from "../../components/boqs/AddCategoryPanel";
import { ItemDetailDrawer } from "../../components/boqs/ItemDetailDrawer";
import { CategoryBlock } from "../../components/boqs/CategoryBlock";
import { AddItemPicker } from "../../components/boqs/AddItemPicker";
import { BulkActionBar } from "../../components/boqs/BulkActionBar";
import { BoqSummaryHeader } from "../../components/boqs/BoqSummaryHeader";
import { CostSummaryPanel } from "../../components/boqs/CostSummaryPanel";
import { PreExportChecklistModal } from "../../components/boqs/PreExportCheckModal";

export default function BoqWorkspace() {
  const { id } = useParams();
  const nav = useNavigate();

  const { data: boq, isLoading } = useGetBoqByIdQuery(id);
  const [updateBoq] = useUpdateBoqMutation();
  const [deleteBoq] = useDeleteBoqMutation();
  const [addCategory] = useAddBoqCategoryMutation();
  const [deleteCategory] = useDeleteBoqCategoryMutation();
  const [addItem] = useAddBoqItemMutation();
  const [updateItem, { isLoading: isSavingItem }] = useUpdateBoqItemMutation();
  const [deleteItem] = useDeleteBoqItemMutation();
  const [reorderItems] = useReorderBoqItemsMutation();
  const [bulkUpdateItems] = useBulkUpdateBoqItemsMutation();
  const [submitForApproval] = useSubmitBoqForApprovalMutation();
  const [approveBoq] = useApproveBoqMutation();
  const [duplicateVersion] = useDuplicateBoqVersionMutation();
  const [createNewVersion, { isLoading: creatingVersion }] =
    useCreateBoqNewVersionMutation();
  const [exportExcel] = useExportBoqExcelMutation();
  const [exportPdf] = useExportBoqPdfMutation();
  const [applyBoqTerms, { isLoading: applyingTerms }] =
    useApplyBoqTermsMutation();

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
  const [preExportVariant, setPreExportVariant] = useState(null);
  const [lockedOpen, setLockedOpen] = useState(false);
  const [pickerFor, setPickerFor] = useState(null);

  const disabled = isBoqDisabled(boq);
  const onLockedEdit = useCallback(() => setLockedOpen(true), []);

  const withSaveChip = async (promise) => {
    setSaveState("saving");
    try {
      const result = await promise;
      setSaveState("saved");
      setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1500);
      return result;
    } catch (e) {
      if (e?.status === 423 || e?.originalStatus === 423) {
        toast.error("This BOQ is locked. Duplicate to edit.");
      } else {
        toast.error("Save failed");
      }
      setSaveState("error");
      return undefined;
    }
  };

  const debouncedUpdateBoq = useDebouncedCallback(
    (patch) => withSaveChip(updateBoq({ id, ...patch }).unwrap()),
    800,
  );

  const patchItem = (itemId, patch) =>
    withSaveChip(updateItem({ boqId: id, itemId, ...patch }).unwrap());

  const handleApplyTerms = (termsTemplateId, version) =>
    withSaveChip(
      applyBoqTerms({ id, terms_template_id: termsTemplateId, version })
        .unwrap()
        .then((updated) => {
          toast.success("Terms applied");
          return updated;
        }),
    );

  const toggleHide = async (itemId, hide) => {
    try {
      await updateItem({ boqId: id, itemId, hidden: hide }).unwrap();
      toast.success(hide ? "Row hidden from client copy" : "Row visible again");
    } catch {
      toast.error("Update failed");
    }
  };

  const createNewVersionFromLock = async () => {
    try {
      const data = await createNewVersion({ id }).unwrap();
      toast.success(`Created ${data.boq_number || "new version"}`);
      setLockedOpen(false);
      nav(`/boq/${data.id}`);
    } catch {
      toast.error("Failed to create new version");
    }
  };

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
          boqId: id,
          name: newCategoryName,
        }).unwrap();
        const cat = (created.categories || []).find(
          (c) => c.name === newCategoryName,
        );
        if (!cat) throw new Error("Category creation failed");
        cid = cat.id;
      }
      await addItem({ boqId: id, categoryId: cid, ...payload }).unwrap();
      toast.success("Item added");
      setPickerFor(null);
    } catch {
      toast.error("Failed to add item");
    }
  };

  const handleDeleteItem = async (itemId) => {
    const item = boq.items.find((i) => i.id === itemId);
    if (!item) return;
    try {
      await deleteItem({ boqId: id, itemId }).unwrap();
      toast("Item deleted", {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await addItem({
                boqId: id,
                categoryId: item.category_id,
                description: item.description,
                location: item.location,
                unit: item.unit,
                quantity: item.quantity,
                rate: item.rate,
                calc_type: item.calc_type,
                notes: item.notes,
                detail: item.detail,
                amount: item.amount,
              }).unwrap();
              toast.success("Restored");
            } catch {
              toast.error("Undo failed");
            }
          },
        },
        duration: 5000,
      });
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleDuplicateItem = async (itemId) => {
    const item = boq.items.find((i) => i.id === itemId);
    if (!item) return;
    try {
      await addItem({
        boqId: id,
        categoryId: item.category_id,
        description: item.description + " (copy)",
        location: item.location,
        unit: item.unit,
        quantity: item.quantity,
        rate: item.rate,
        calc_type: item.calc_type,
        notes: item.notes,
        detail: item.detail,
        amount: item.amount,
      }).unwrap();
    } catch {
      toast.error("Duplicate failed");
    }
  };

  const handleReorderItems = async (cid, orderedIds) => {
    try {
      await reorderItems({ boqId: id, categoryId: cid, orderedIds }).unwrap();
    } catch {
      toast.error("Reorder failed");
    }
  };

  const handleDeleteCategory = async (cid) => {
    if (!confirm("Delete this category and all its items?")) return;
    try {
      await deleteCategory({ boqId: id, categoryId: cid }).unwrap();
      toast.success("Category removed");
    } catch {
      toast.error("Delete failed");
    }
  };

  const addCustomCategory = async () => {
    if (!customCatName.trim()) return;
    try {
      await addCategory({ boqId: id, name: customCatName }).unwrap();
      toast.success("Category added");
      setCustomCatOpen(false);
      setCustomCatName("");
    } catch {
      toast.error("Failed");
    }
  };

  const handleBulkAction = async (op, value) => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateItems({
        boqId: id,
        ids: [...selectedIds],
        op,
        value,
      }).unwrap();
      setSelectedIds(new Set());
      toast.success(op === "delete" ? "Deleted" : "Updated");
    } catch {
      toast.error("Bulk action failed");
    }
  };

  const handleDuplicateVersion = async () => {
    try {
      const data = await duplicateVersion({
        id,
        reason: dupReason,
        note: dupNote,
      }).unwrap();
      toast.success(`Created ${data.version}`);
      setDupOpen(false);
      nav(`/boq/${data.id}`);
    } catch {
      toast.error("Duplicate failed");
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      await submitForApproval({ id, note: "Please review" }).unwrap();
      toast.success("Submitted for approval");
    } catch {
      toast.error("Submit failed");
    }
  };

  const handleApprove = async () => {
    try {
      await approveBoq({ id, remarks: "Approved" }).unwrap();
      setApprovalOpen(false);
      toast.success("BOQ approved and locked");
    } catch {
      toast.error("Approve failed");
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportExcel({
        boqId: id,
        filename: `${boq?.boq_number || `BOQ-V${boq?.version || 1}`}.xlsx`,
      }).unwrap();
      toast.success("Excel downloaded");
    } catch {
      toast.error("Export failed");
    }
  };

  const doExportPdf = async (variant) => {
    try {
      const base = boq?.boq_number || `BOQ-V${boq?.version || 1}`;
      await exportPdf({
        boqId: id,
        variant,
        filename: `${base}-${variant}.pdf`,
      }).unwrap();
      toast.success(`PDF (${variant}) downloaded`);
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
    // eslint-disable-next-line
  }, [selectedIds]);

  if (isLoading || !boq) {
    return (
      <div className="min-h-screen bc-page-bg flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#6B7B7C]">
          <Loader2 size={16} className="animate-spin" /> Loading BOQ…
        </div>
      </div>
    );
  }

  const existingCategories = new Set(
    boq.categories.map((c) => c.name.toLowerCase().trim()),
  );
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
      itemsByCat(cid).forEach((i) => (checked ? n.add(i.id) : n.delete(i.id)));
      return n;
    });

  return (
    <div className="min-h-screen bc-page-bg">
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
              onClick={() => setPreExportVariant("internal")}
              className="h-9 px-3 rounded-lg bg-[#1F453B] hover:opacity-90 text-white text-[12.5px] font-semibold flex items-center gap-1.5"
              data-testid="download-boq-btn"
              title="Download BOQ (PDF)"
            >
              <Download size={13} /> Download BOQ
            </button>
            {boq.status === "draft" && (
              <button
                onClick={handleSubmitForApproval}
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
                <DropdownMenuItem onClick={handleExportExcel}>
                  Export Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>
                  Print
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-[#333333]"
                  onClick={async () => {
                    if (confirm("Archive this BOQ?")) {
                      await deleteBoq(id).unwrap();
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
        <BoqSummaryHeader boq={boq} disabled={disabled} />

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
                  {boq.categories?.map((cat, index) => (
                    <CategoryBlock
                      key={cat.id}
                      cat={{
                        ...cat,
                        code: String(index + 1).padStart(2, "0"),
                        subtotal: cat.subtotal || 0,
                      }}
                      items={cat.items || []}
                      disabled={disabled}
                      selectedIds={selectedIds}
                      onSelectItem={onSelectItem}
                      onSelectCategory={onSelectCategory}
                      onPatchItem={patchItem}
                      onDeleteItem={handleDeleteItem}
                      onDuplicateItem={handleDuplicateItem}
                      onOpenDetail={setDetailItem}
                      onAddItem={handleAddItem}
                      onDeleteCat={handleDeleteCategory}
                      onReorderItems={handleReorderItems}
                      onToggleHide={toggleHide}
                      onLockedEdit={onLockedEdit}
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

        <CostSummaryPanel
          boq={boq}
          disabled={disabled}
          onLockedEdit={onLockedEdit}
          onSaveTerms={(terms_html) => debouncedUpdateBoq({ terms_html })}
          onSaveMiscPct={(misc_pct) => debouncedUpdateBoq({ misc_pct })}
          onApplyTerms={handleApplyTerms}
          applyingTerms={applyingTerms}
        />
      </main>

      <AddCategoryPanel
        open={addCatOpen}
        onClose={setAddCatOpen}
        boqId={id}
        existingCategories={existingCategories}
        onAdded={() => setAddCatOpen(false)}
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
        disabled={disabled}
        onPatch={(patch) => detailItem && patchItem(detailItem.id, patch)}
      />

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
              onClick={handleDuplicateVersion}
              className="h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold"
              data-testid="dup-submit"
            >
              Duplicate
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              onClick={handleApprove}
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
        onCreateNewVersion={createNewVersionFromLock}
      />

      <PreExportChecklistModal
        boqId={id}
        boq={boq}
        variant={preExportVariant}
        onClose={() => setPreExportVariant(null)}
        onConfirm={doExportPdf}
      />

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
