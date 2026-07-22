import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  useCreateQuotationMutation,
  useReplaceQuotationItemsMutation,
  useUpdateQuotationMutation,
  useSubmitQuotationMutation,
  useGetQuotationByIdQuery,
  useGetQuotationItemsQuery,
} from "../../api/quotation.api";
import { useGetVendorsQuery } from "../../api/vendor.api";
import { useGetProjectsQuery } from "../../api/project.api"; // adjust import path to wherever projectsApi.js lives
import { useGetUnitsQuery } from "../../api/unit.api"; // adjust import path to wherever unitApi.js lives
import NewVendorModal from "../../components/vendors/AddVendorModal";
import { X, Plus, Copy, Trash2, GripVertical, Search } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// NOTE: QuotationStatus enum on the backend model is:
// draft | submitted | approved | returned_for_editing | declined | cancelled
// There is no "awaiting_approval" status — submitting for review moves a
// quotation from draft -> submitted via the /quotations/:id/submit endpoint.
const QUOTATION_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  APPROVED: "approved",
};

const DEFAULT_TERMS = `1. Rates are inclusive of labour and material unless specified otherwise.\n2. GST is extra as applicable.\n3. Any item outside this estimate will be charged as per actuals after mutual approval.\n4. A 50% advance is required to commence work; the balance will be billed progressively.`;

const iso = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (n) =>
  (n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

function Card({ label, children }) {
  return (
    <div className="bg-white border border-[#DDD8CE] rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,20,20,.04)]">
      {label && (
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] font-semibold mb-3">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
const Field = ({ label, required, children }) => (
  <div>
    <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
      {label}
      {required && <span className="text-[#B04D26] ml-0.5">*</span>}
    </label>
    {children}
  </div>
);
const Input = (props) => (
  <input
    {...props}
    className={`h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px] disabled:opacity-70 disabled:cursor-not-allowed ${props.className || ""}`}
  />
);
const Select = (props) => (
  <select
    {...props}
    className={`h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px] disabled:opacity-70 disabled:cursor-not-allowed ${props.className || ""}`}
  />
);

function ItemRow({ item, index, disabled, units, unitsLoading, onChange, onDup, onDel }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const amount = Number(item.rate || 0) * Number(item.qty || 0);
  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-t border-[#EAEEF0]"
      data-testid={`estimate-row-${item.id}`}
    >
      <td className="px-1 py-1.5 text-center align-middle">
        <button
          {...attributes}
          {...listeners}
          disabled={disabled}
          className="p-1 cursor-grab text-[#B5C4B6] hover:text-[#333333]"
          data-testid={`row-drag-${item.id}`}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
      </td>
      <td className="px-1 py-1.5 text-[12.5px] text-[#6B7B7C] text-center align-middle">
        {index + 1}
      </td>
      <td className="px-1 py-1.5">
        <Input
          disabled={disabled}
          value={item.particular}
          onChange={(e) => onChange(item.id, { particular: e.target.value })}
          placeholder="Item description"
          data-testid={`row-particular-${item.id}`}
        />
      </td>
      <td className="px-1 py-1.5">
        <Input
          disabled={disabled}
          type="number"
          step="0.01"
          value={item.rate}
          onChange={(e) =>
            onChange(item.id, { rate: parseFloat(e.target.value) || 0 })
          }
          className="text-right"
          data-testid={`row-rate-${item.id}`}
        />
      </td>
      <td className="px-1 py-1.5">
        <Input
          disabled={disabled}
          type="number"
          step="0.01"
          value={item.qty}
          onChange={(e) =>
            onChange(item.id, { qty: parseFloat(e.target.value) || 0 })
          }
          className="text-right"
          data-testid={`row-qty-${item.id}`}
        />
      </td>
      <td className="px-1 py-1.5">
        <select
          disabled={disabled || unitsLoading}
          value={item.unit_id || ""}
          onChange={(e) =>
            onChange(item.id, { unit_id: e.target.value || null })
          }
          className="h-10 w-full px-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13px]"
          data-testid={`row-unit-${item.id}`}
        >
          <option value="">{unitsLoading ? "Loading…" : "Select unit"}</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1.5 text-right text-[13px] font-semibold text-[#333333] whitespace-nowrap">
        ₹ {fmt(amount)}
      </td>
      <td className="px-1 py-1.5">
        <Input
          disabled={disabled}
          value={item.remarks}
          onChange={(e) => onChange(item.id, { remarks: e.target.value })}
          placeholder="Remarks"
          data-testid={`row-remarks-${item.id}`}
        />
      </td>
      <td className="px-1 py-1.5 text-center whitespace-nowrap">
        <button
          disabled={disabled}
          onClick={() => onDup(item.id)}
          className="p-1 text-[#6B7B7C] hover:text-[#333333] disabled:opacity-40"
          title="Duplicate row"
          data-testid={`row-dup-${item.id}`}
        >
          <Copy size={14} />
        </button>
        <button
          disabled={disabled}
          onClick={() => onDel(item.id)}
          className="p-1 text-[#B04D26] hover:text-[#7A2E1A] disabled:opacity-40"
          title="Delete row"
          data-testid={`row-del-${item.id}`}
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

const emptyItem = () => ({
  id: uid(),
  particular: "",
  rate: 0,
  qty: 1,
  unit_id: null,
  remarks: "",
});

export default function EstimateForm() {
  const nav = useNavigate();
  const { id } = useParams(); // present on /quotations/:id/edit, undefined on /quotations/new
  const isEdit = !!id;
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [createQuotation] = useCreateQuotationMutation();
  const [replaceQuotationItems] = useReplaceQuotationItemsMutation();
  const [updateQuotation] = useUpdateQuotationMutation();
  const [submitQuotation] = useSubmitQuotationMutation();

  // ---- Load existing quotation + its items when editing ----
  const {
    data: existingQuotation,
    isLoading: quotationLoading,
    isError: quotationError,
  } = useGetQuotationByIdQuery(id, { skip: !isEdit });

  const { data: existingItems, isLoading: itemsLoading } =
    useGetQuotationItemsQuery(id, { skip: !isEdit });

  // Basic
  const [estimateNumber, setEstimateNumber] = useState("");
  const [estimateDate, setEstimateDate] = useState(iso());
  // Vendor
  const [vendorSearch, setVendorSearch] = useState("");
  const [debouncedVendorSearch, setDebouncedVendorSearch] = useState("");
  const [vendor, setVendor] = useState(null);
  const [showNewVendor, setShowNewVendor] = useState(false);
  // Project
  const [project, setProject] = useState(null);
  // Units (for the item rows' unit dropdown)
  const { data: unitsData, isLoading: unitsLoading } = useGetUnitsQuery();
  const units = Array.isArray(unitsData) ? unitsData : unitsData?.data || [];
  // Items
  const [items, setItems] = useState([emptyItem()]);
  // Totals
  const [addlAmt, setAddlAmt] = useState(0);
  const [addlIsPct, setAddlIsPct] = useState(false);
  const [discAmt, setDiscAmt] = useState(0);
  const [discIsPct, setDiscIsPct] = useState(false);
  const [taxPct, setTaxPct] = useState(0);
  // T&C + status
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(QUOTATION_STATUS.DRAFT);
  // Tracks whether the prefill effect below has already run, so we don't
  // clobber the user's in-progress edits if the query refetches.
  const [hydrated, setHydrated] = useState(false);

  const readOnly = status === QUOTATION_STATUS.APPROVED && !isAdmin;

  // ---- Prefill the form once, when editing and both queries have data ----
  useEffect(() => {
    if (!isEdit || hydrated) return;
    if (!existingQuotation || !existingItems) return;

    const q = existingQuotation;

    setEstimateNumber(q.quotationNumber || q.quotation_number || "");
    setEstimateDate(
      (q.quotationDate || q.quotation_date || iso()).slice(0, 10),
    );
    setStatus(q.status || QUOTATION_STATUS.DRAFT);
    setTerms(q.termsConditions || q.terms_conditions || DEFAULT_TERMS);
    setTaxPct(Number(q.taxPercent ?? q.tax_percent ?? 0));

    const discType = q.globalDiscountType || q.global_discount_type;
    setDiscIsPct(discType === "percentage");
    setDiscAmt(Number(q.globalDiscountValue ?? q.global_discount_value ?? 0));

    // Additional charges are stored resolved (decimal amount), not as a
    // percent/fixed pair, so load them in as a fixed ₹ value.
    setAddlIsPct(false);
    setAddlAmt(Number(q.additionalCharges ?? q.additional_charges ?? 0));

    // Vendor / project come back as snapshots or nested relations
    // depending on the endpoint — normalize whichever shape is present.
    const v = q.vendor || q.vendorSnapshot;
    if (v) {
      setVendor({
        id: v.id || q.vendorId || q.vendor_id,
        company: v.company || v.company_name,
        name: v.name,
        primary_category: v.primary_category || v.vendorCategory?.name,
        category: v.category,
        city: v.city,
      });
    }

    const p = q.project || q.projectSnapshot;
    if (p) {
      setProject({
        id: p.id || q.projectId || q.project_id,
        name: p.name,
        location: p.location || p.site_location,
      });
    }

    const rows = Array.isArray(existingItems)
      ? existingItems
      : existingItems?.data || [];
    setItems(
      rows.length
        ? rows
            .slice()
            .sort((a, b) => (a.sno || 0) - (b.sno || 0))
            .map((it) => ({
              id: it.id || uid(),
              particular: it.particular || "",
              rate: Number(it.rate || 0),
              qty: Number(it.quantity ?? it.qty ?? 0),
              unit_id: it.unit_id || it.unitId || null,
              remarks: it.remarks || "",
            }))
        : [emptyItem()],
    );

    setHydrated(true);
  }, [isEdit, hydrated, existingQuotation, existingItems]);

  useEffect(() => {
    if (isEdit && quotationError) {
      toast.error("Failed to load estimate");
    }
  }, [isEdit, quotationError]);

  // Debounce vendor search input before hitting vendorsApi
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedVendorSearch(vendorSearch.trim());
    }, 200);
    return () => clearTimeout(t);
  }, [vendorSearch]);

  // Vendor search — goes through vendorsApi's getVendors query instead of a
  // raw axios call, so it stays in sync with the vendors cache/tags.
  const { data: vendorResults = [] } = useGetVendorsQuery(
    debouncedVendorSearch ? { q: debouncedVendorSearch } : {},
    { skip: !!vendor },
  );

  // Project — a dropdown backed by projectsApi's getProjects query instead
  // of a free-text axios search, so it stays in sync with the projects
  // cache/tags too.
  const { data: projectsData, isLoading: projectsLoading } =
    useGetProjectsQuery({});
  const projects = Array.isArray(projectsData)
    ? projectsData
    : projectsData?.data || [];

  // Recompute estimate number whenever project or date changes — but only
  // in create mode. In edit mode the number was already assigned when the
  // quotation was first created, so it must not be silently regenerated
  // just because the prefill effect sets project/date once on load.
  const refreshEstimateNumber = useCallback((pid, d) => {
    if (!pid || !d) {
      setEstimateNumber("");
      return;
    }
    api
      .get(`/estimate/next-number?project_id=${pid}&date=${d}`)
      .then((r) => setEstimateNumber(r.data.estimate_number))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (isEdit) return; // never auto-renumber an existing estimate
    if (project) refreshEstimateNumber(project.id, estimateDate);
  }, [isEdit, project, estimateDate, refreshEstimateNumber]);

  // Totals
  const subtotal = useMemo(
    () =>
      items.reduce((s, i) => s + Number(i.rate || 0) * Number(i.qty || 0), 0),
    [items],
  );
  const addlResolved = addlIsPct
    ? (subtotal * (Number(addlAmt) || 0)) / 100
    : Number(addlAmt) || 0;
  const discResolved = discIsPct
    ? (subtotal * (Number(discAmt) || 0)) / 100
    : Number(discAmt) || 0;
  const taxable = subtotal + addlResolved - discResolved;
  const taxAmount = (taxable * (Number(taxPct) || 0)) / 100;
  const grandTotal = taxable + taxAmount;

  // Item actions
  const setItem = (id, patch) =>
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const dupItem = (id) =>
    setItems((list) => {
      const idx = list.findIndex((x) => x.id === id);
      if (idx < 0) return list;
      const clone = { ...list[idx], id: uid() };
      return [...list.slice(0, idx + 1), clone, ...list.slice(idx + 1)];
    });
  const delItem = (id) =>
    setItems((list) =>
      list.length === 1 ? list : list.filter((i) => i.id !== id),
    );
  const addItem = () => setItems((list) => [...list, emptyItem()]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const onDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((list) => {
      const oldI = list.findIndex((x) => x.id === active.id);
      const newI = list.findIndex((x) => x.id === over.id);
      return arrayMove(list, oldI, newI);
    });
  };

  const submit = async (targetStatus = QUOTATION_STATUS.SUBMITTED) => {
    if (!project) return toast.error("Select a project");
    if (!vendor) return toast.error("Select or create a vendor");
    if (items.every((i) => !i.particular?.trim()))
      return toast.error("Add at least one item");

    setBusy(true);
    try {
      const itemRows = items
        .filter((i) => i.particular?.trim())
        .map((i, idx) => ({
          sno: idx + 1,
          particular: i.particular,
          rate: Number(i.rate) || 0,
          quantity: Number(i.qty) || 0,
          amount: (Number(i.rate) || 0) * (Number(i.qty) || 0),
          remarks: i.remarks || "",
          unit_id: i.unit_id || null,
        }));

      let qid = id;

      if (!isEdit) {
        // 1. Create the quotation header — field names must match the
        //    Sequelize model's camelCase attributes (projectId, vendorId,
        //    quotationNumber, quotationDate). There is no "title" column.
        const created = await createQuotation({
          project_id: project.id,
          vendor_id: vendor.id,
          quotation_date: estimateDate,
          quotation_number: estimateNumber || undefined,
          items: itemRows,
        }).unwrap();
        qid = created.id;
      } else {
        // Editing: update the header fields that can legitimately change
        // (project/vendor/date). Items are always replaced wholesale below
        // regardless of create vs edit, since the backend only exposes a
        // bulk PUT, not per-row diffing.
        await updateQuotation({
          id: qid,
          project_id: project.id,
          vendor_id: vendor.id,
          quotation_date: estimateDate,
        }).unwrap();
      }

      // 2. Replace items in bulk via PUT /quotations/:id/items — matches
      //    QuotationItem's actual columns: particular, rate, quantity,
      //    amount, remarks, sno, unit_id.
      if (itemRows.length) {
        await replaceQuotationItems({
          quotationId: qid,
          items: itemRows,
        }).unwrap();
      }

      // 3. Update totals/terms/discount — field names matched to the model:
      //    termsConditions, additionalCharges (decimal), globalDiscountType/
      //    Value, discount, taxPercent, taxAmount, subtotal, totalAmount.
      await updateQuotation({
        id: qid,
        terms_conditions: terms,
        additional_charges: addlResolved,
        global_discount_type: discIsPct ? "percentage" : "fixed",
        global_discount_value: Number(discAmt) || 0,
        tax_percent: Number(taxPct) || 0,
      }).unwrap();

      // 4. Move draft -> submitted via the dedicated endpoint, instead of a
      //    nonexistent "awaiting_approval" status / send-to-reviewer route.
      //    Only fire this if the quotation isn't already past draft — an
      //    edit to an already-submitted/approved estimate shouldn't try to
      //    re-submit it.
      const canSubmit =
        !isEdit || status === QUOTATION_STATUS.DRAFT || !isEdit;
      if (
        targetStatus === QUOTATION_STATUS.SUBMITTED &&
        (!isEdit || status === QUOTATION_STATUS.DRAFT)
      ) {
        await submitQuotation({ id: qid, submitted_by: user?.id }).unwrap();
      }

      toast.success(isEdit ? "Estimate updated" : "Estimate saved");
      nav(`/quotations/${qid}`);
    } catch (e) {
      toast.error(
        e?.data?.message || e?.error || "Failed to save estimate",
      );
    } finally {
      setBusy(false);
    }
  };

  // Block rendering the form with stale/empty state while the existing
  // quotation + items are still loading in edit mode.
  if (isEdit && (quotationLoading || itemsLoading || !hydrated)) {
    return (
      <div className="max-w-[1200px] mx-auto py-10 px-4 text-center text-[#6B7B7C]">
        Loading estimate…
      </div>
    );
  }

  if (isEdit && quotationError) {
    return (
      <div className="max-w-[1200px] mx-auto py-10 px-4 text-center text-red-600">
        Failed to load estimate.
      </div>
    );
  }

  return (
    <div
      className="max-w-[1200px] mx-auto py-6 px-4 space-y-4"
      data-testid="create-estimate-page"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-[40px] font-bold text-[#333333]">
          {isEdit ? "Edit Estimate" : "Create Estimate"}
        </h1>
        <button
          onClick={() => nav(isEdit ? `/quotations/${id}` : "/quotations")}
          className="text-[13px] text-[#6B7B7C] hover:text-[#333333] inline-flex items-center gap-1"
          data-testid="cancel-btn"
        >
          <X size={14} /> Cancel
        </button>
      </div>

      {/* Card A — Basic */}
      <Card label="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Estimate Number">
            <Input
              disabled
              value={estimateNumber}
              placeholder="Auto-generated after project & date"
              data-testid="estimate-number"
            />
          </Field>
          <Field label="Estimate Date" required>
            <Input
              type="date"
              value={estimateDate}
              onChange={(e) => setEstimateDate(e.target.value)}
              disabled={readOnly}
              data-testid="estimate-date"
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Vendor" required>
              {vendor ? (
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 h-10 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px] flex items-center font-semibold"
                    data-testid="vendor-selected"
                  >
                    {vendor.company || vendor.name}{" "}
                    <span className="text-[#6B7B7C] ml-2 font-normal">
                      · {vendor.primary_category || vendor.category || "—"}
                    </span>
                  </div>
                  <button
                    disabled={readOnly}
                    onClick={() => {
                      setVendor(null);
                      setVendorSearch("");
                    }}
                    className="h-10 px-3 rounded-lg border border-[#DDD8CE] text-[12.5px] font-semibold text-[#333333]"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search
                      size={14}
                      className="absolute top-3 left-3 text-[#B5C4B6]"
                    />
                    <input
                      disabled={readOnly}
                      value={vendorSearch}
                      onChange={(e) => setVendorSearch(e.target.value)}
                      placeholder="Search vendor…"
                      className="h-10 w-full pl-9 pr-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                      data-testid="vendor-search"
                    />
                    {vendorResults.length > 0 && vendorSearch && (
                      <div className="absolute z-10 top-11 left-0 right-0 max-h-[240px] overflow-y-auto bg-white border border-[#DDD8CE] rounded-lg shadow-md">
                        {vendorResults.slice(0, 8).map((v) => (
                          <button
                            key={v.id}
                            onClick={() => {
                              setVendor(v);
                              setVendorSearch("");
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-[#EAEEF0] border-b border-[#EAEEF0] text-[13px]"
                            data-testid={`vendor-opt-${v.id}`}
                          >
                            <div className="font-semibold text-[#333333]">
                              {v.company || v.name}
                            </div>
                            <div className="text-[11.5px] text-[#6B7B7C]">
                              {v.primary_category || v.category || "—"} ·{" "}
                              {v.city || ""}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    disabled={readOnly}
                    onClick={() => setShowNewVendor(true)}
                    className="h-10 px-3 rounded-lg border border-[#1F453B] text-[#333333] hover:bg-[#EAEEF0] text-[13px] font-semibold inline-flex items-center gap-1"
                    data-testid="new-vendor-btn"
                  >
                    <Plus size={14} /> New Vendor
                  </button>
                </div>
              )}
            </Field>
          </div>
        </div>
      </Card>

      {/* Card B — Project */}
      <Card label="Project Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Project" required>
            <Select
              disabled={readOnly || projectsLoading}
              value={project?.id || ""}
              onChange={(e) => {
                const selected = projects.find(
                  (p) => String(p.id) === e.target.value,
                );
                setProject(selected || null);
              }}
              data-testid="project-select"
            >
              <option value="">
                {projectsLoading ? "Loading projects…" : "Select a project…"}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Site Location">
            <Input
              disabled
              value={project?.location || ""}
              placeholder="Auto-populated from project"
              data-testid="site-location"
            />
          </Field>
        </div>
      </Card>

      {/* Card C — Items */}
      <Card label="Estimate Items">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] min-w-[900px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] bg-[#F3F3F1]">
                <th className="w-8"></th>
                <th className="w-8 text-center py-2">#</th>
                <th className="py-2">Particular</th>
                <th className="w-28 py-2 text-right">Rate (₹)</th>
                <th className="w-24 py-2 text-right">Qty</th>
                <th className="w-24 py-2">Unit</th>
                <th className="w-32 py-2 text-right">Amount (₹)</th>
                <th className="py-2">Remarks</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <DndContext
              sensors={sensors}
              onDragEnd={onDragEnd}
              collisionDetection={closestCenter}
            >
              <SortableContext
                items={items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {items.map((it, idx) => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      index={idx}
                      disabled={readOnly}
                      units={units}
                      unitsLoading={unitsLoading}
                      onChange={setItem}
                      onDup={dupItem}
                      onDel={delItem}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
        </div>
        <button
          disabled={readOnly}
          onClick={addItem}
          className="mt-3 text-[13px] font-semibold text-[#333333] hover:underline inline-flex items-center gap-1"
          data-testid="add-row-btn"
        >
          <Plus size={14} /> Add Row
        </button>

        {/* Totals — right aligned */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div />
          <div className="space-y-2 text-[13.5px]" data-testid="totals-block">
            <div className="flex items-center justify-between border-b border-[#EAEEF0] pb-2">
              <div className="text-[#6B7B7C]">Subtotal</div>
              <div className="font-semibold text-[#333333]">
                ₹ {fmt(subtotal)}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[#6B7B7C]">Additional Charges</div>
              <div className="flex items-center gap-1">
                <button
                  disabled={readOnly}
                  onClick={() => setAddlIsPct((v) => !v)}
                  className="h-8 w-10 rounded-md border border-[#DDD8CE] text-[12px] font-semibold text-[#333333]"
                  data-testid="addl-toggle"
                >
                  {addlIsPct ? "%" : "₹"}
                </button>
                <input
                  disabled={readOnly}
                  type="number"
                  value={addlAmt}
                  onChange={(e) => setAddlAmt(parseFloat(e.target.value) || 0)}
                  className="h-8 w-28 px-2 rounded-md border border-[#DDD8CE] bg-[#FAF8F5] text-[13px] text-right"
                  data-testid="addl-input"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[#6B7B7C]">Discount</div>
              <div className="flex items-center gap-1">
                <button
                  disabled={readOnly}
                  onClick={() => setDiscIsPct((v) => !v)}
                  className="h-8 w-10 rounded-md border border-[#DDD8CE] text-[12px] font-semibold text-[#333333]"
                  data-testid="disc-toggle"
                >
                  {discIsPct ? "%" : "₹"}
                </button>
                <input
                  disabled={readOnly}
                  type="number"
                  value={discAmt}
                  onChange={(e) => setDiscAmt(parseFloat(e.target.value) || 0)}
                  className="h-8 w-28 px-2 rounded-md border border-[#DDD8CE] bg-[#FAF8F5] text-[13px] text-right"
                  data-testid="disc-input"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[#6B7B7C]">Tax (%)</div>
              <input
                disabled={readOnly}
                type="number"
                value={taxPct}
                onChange={(e) => setTaxPct(parseFloat(e.target.value) || 0)}
                className="h-8 w-28 px-2 rounded-md border border-[#DDD8CE] bg-[#FAF8F5] text-[13px] text-right"
                data-testid="tax-input"
              />
            </div>
            <div className="flex items-center justify-between text-[#333333]">
              <div>Tax amount</div>
              <div>₹ {fmt(taxAmount)}</div>
            </div>
            <div className="flex items-center justify-between border-t-2 border-[#333333] pt-2 text-[16px]">
              <div className="font-bold text-[#333333]">Grand Total</div>
              <div
                className="font-bold text-[#333333]"
                data-testid="grand-total"
              >
                ₹ {fmt(grandTotal)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Card D — Terms */}
      <Card label="Terms & Conditions">
        <textarea
          disabled={readOnly}
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={5}
          placeholder="Enter terms and conditions…"
          className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px] leading-relaxed"
          data-testid="terms"
        />
      </Card>

      {/* Card E — Approval. On create the quotation is always draft, so this
          block never has data to show yet — real values (reviewedAt /
          reviewedBy / reviewRemarks) only exist on the model once a
          reviewer acts on the quotation from the detail/review screen. */}
      <Card label="Approval & Signature">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-[12px] font-semibold text-[#333333] mb-2">
              Reviewer
            </div>
            <div
              className="border border-[#DDD8CE] rounded-lg p-4 min-h-[120px] bg-[#FAF8F5]"
              data-testid="approved-by-block"
            >
              {existingQuotation?.reviewedBy || existingQuotation?.reviewed_by ? (
                <div className="text-[13px] text-[#333333]">
                  <div className="font-semibold">
                    {existingQuotation.reviewedBy?.name ||
                      existingQuotation.reviewed_by}
                  </div>
                  {(existingQuotation.reviewRemarks ||
                    existingQuotation.review_remarks) && (
                    <div className="text-[12px] text-[#6B7B7C] mt-1">
                      {existingQuotation.reviewRemarks ||
                        existingQuotation.review_remarks}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[13px] text-[#B5C4B6] italic">
                  Available after this estimate is submitted and reviewed
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="text-[12px] font-semibold text-[#333333] mb-2">
              Contractor&apos;s Sign
            </div>
            <div className="border border-[#DDD8CE] rounded-lg p-4 min-h-[120px] bg-[#FAF8F5] flex items-end">
              <div className="text-[11.5px] text-[#B5C4B6]">
                Signature block for print
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Bottom actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          disabled={busy || readOnly}
          onClick={() => submit(QUOTATION_STATUS.SUBMITTED)}
          className="h-11 px-6 rounded-xl bg-[#1F453B] text-white text-[13.5px] font-semibold disabled:opacity-60"
          data-testid="submit-approval-btn"
        >
          {busy
            ? "Saving…"
            : isEdit && status !== QUOTATION_STATUS.DRAFT
              ? "Save Changes"
              : "Submit for Approval"}
        </button>
        <button
          disabled={busy || readOnly}
          onClick={() => submit(QUOTATION_STATUS.DRAFT)}
          className="text-[13px] font-semibold text-[#6B7B7C] hover:text-[#333333] hover:underline"
          data-testid="save-draft-btn"
        >
          Save as Draft
        </button>
      </div>

      {showNewVendor && (
        <NewVendorModal
          onClose={() => setShowNewVendor(false)}
          onCreated={(v) => {
            setVendor(v);
            setShowNewVendor(false);
          }}
        />
      )}
    </div>
  );
}