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
} from "../../api/procuerment/quotation.api";
import { useGetVendorsQuery } from "../../api/vendors/vendor.api";
import { useGetProjectsQuery } from "../../api/projects/project.api"; // adjust import path to wherever projectsApi.js lives
import { useGetUnitsQuery } from "../../api/meta/unit.api"; // adjust import path to wherever unitApi.js lives
import NewVendorModal from "../../components/vendors/AddVendorModal";
import NewProjectModal from "../../components/projects/CreateNewProject"; // adjust import path
import { AddUnitModal } from "../../components/boqs/AddUnitModal"; // adjust import path
import { ArrowLeft, Plus, Copy, Trash2, GripVertical, Search, Send, Save } from "lucide-react";
import {
  Page,
  PageHeader,
  Button,
  Field as InosField,
  TextInput,
  SelectInput,
  TextArea,
  FormActions,
  Card as InosCard,
  EmptyState,
} from "@/components/inos";
import {
  DocSection,
  DocLayout,
  Grid,
  LineTable,
  IconAction,
  AddRow,
  TotalsCard,
  Callout,
  LoadingBlock,
  inr,
} from "@/components/forms/commerce-form-ui";
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

const Field = ({ label, required, children, hint, full }) => (
  <InosField label={label} required={required} hint={hint} full={full}>
    {children}
  </InosField>
);
const Input = (props) => <TextInput {...props} />;
const Select = ({ children, ...props }) => <SelectInput {...props}>{children}</SelectInput>;

function ItemRow({
  item,
  index,
  disabled,
  units,
  unitsLoading,
  onChange,
  onDup,
  onDel,
  onAddUnit,
}) {
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
    <tr ref={setNodeRef} style={style} data-testid={`estimate-row-${item.id}`}>
      <td style={{ paddingLeft: 12, paddingRight: 0, paddingTop: 16, width: 28 }}>
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={disabled}
          className="cf-icon-btn"
          style={{ width: 24, height: 24, cursor: "grab" }}
          data-testid={`row-drag-${item.id}`}
          aria-label="Drag to reorder"
        >
          <GripVertical aria-hidden />
        </button>
      </td>
      <td className="cf-idx">{index + 1}</td>
      <td>
        <Input
          disabled={disabled}
          value={item.particular}
          onChange={(e) => onChange(item.id, { particular: e.target.value })}
          placeholder="e.g. Supply & fix 12mm gypsum false ceiling"
          data-testid={`row-particular-${item.id}`}
        />
      </td>
      <td className="num">
        <Input
          disabled={disabled}
          type="number"
          step="0.01"
          inputMode="decimal"
          value={item.rate}
          onChange={(e) => onChange(item.id, { rate: parseFloat(e.target.value) || 0 })}
          data-testid={`row-rate-${item.id}`}
          aria-label={`Rate line ${index + 1}`}
        />
      </td>
      <td className="num">
        <Input
          disabled={disabled}
          type="number"
          step="0.01"
          inputMode="decimal"
          value={item.qty}
          onChange={(e) => onChange(item.id, { qty: parseFloat(e.target.value) || 0 })}
          data-testid={`row-qty-${item.id}`}
          aria-label={`Quantity line ${index + 1}`}
        />
      </td>
      <td>
        <SelectInput
          disabled={disabled || unitsLoading}
          value={item.unit_id || ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "__new__") {
              // Open the "Add Unit" modal for this specific row instead of
              // treating "__new__" as a real unit id.
              onAddUnit(item.id);
              return;
            }
            onChange(item.id, { unit_id: val || null });
          }}
          data-testid={`row-unit-${item.id}`}
          aria-label={`Unit line ${index + 1}`}
        >
          <option value="">{unitsLoading ? "Loading…" : "Unit"}</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
          <option value="__new__">+ Add new unit</option>
        </SelectInput>
      </td>
      <td className="cf-amount">{inr(amount)}</td>
      <td>
        <Input
          disabled={disabled}
          value={item.remarks}
          onChange={(e) => onChange(item.id, { remarks: e.target.value })}
          placeholder="Optional"
          data-testid={`row-remarks-${item.id}`}
        />
      </td>
      <td className="actions">
        <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDup(item.id)}
            className="cf-icon-btn"
            title="Duplicate row"
            aria-label="Duplicate row"
            data-testid={`row-dup-${item.id}`}
          >
            <Copy aria-hidden />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDel(item.id)}
            className="cf-icon-btn cf-icon-btn--danger"
            title="Delete row"
            aria-label="Delete row"
            data-testid={`row-del-${item.id}`}
          >
            <Trash2 aria-hidden />
          </button>
        </div>
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
  const { id } = useParams(); // present on /quotations/:id/edit, undefined on /procurement/estimates/new
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
  const [showNewProject, setShowNewProject] = useState(false);
  // Units (for the item rows' unit dropdown)
  const { data: unitsData, isLoading: unitsLoading } = useGetUnitsQuery();
  const units = Array.isArray(unitsData) ? unitsData : unitsData?.data || [];
  // Tracks which item row triggered "+ Add New Unit", so we know which row
  // to patch with the newly created unit's id once the modal succeeds.
  const [newUnitRowId, setNewUnitRowId] = useState(null);
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
        category: v.category || v.businessType?.name,
        city: v.city || v.address,
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
      if (
        targetStatus === QUOTATION_STATUS.SUBMITTED &&
        (!isEdit || status === QUOTATION_STATUS.DRAFT)
      ) {
        await submitQuotation({ id: qid, submitted_by: user?.id }).unwrap();
      }

      toast.success(isEdit ? "Estimate updated" : "Estimate saved");
      nav(`/procurement/estimates/${qid}`);
    } catch (e) {
      toast.error(e?.data?.message || e?.error || "Failed to save estimate");
    } finally {
      setBusy(false);
    }
  };

  // Block rendering the form with stale/empty state while the existing
  // quotation + items are still loading in edit mode.
  if (isEdit && (quotationLoading || itemsLoading || !hydrated) && !quotationError) {
    return (
      <Page>
        <LoadingBlock label="Loading estimate…" />
      </Page>
    );
  }

  if (isEdit && quotationError) {
    return (
      <Page width="form">
        <InosCard>
          <EmptyState
            title="Couldn't load this estimate"
            text="It may have been deleted, or the server is unreachable."
            action={
              <Button variant="primary" onClick={() => nav("/procurement/estimates/all")}>
                Back to estimates
              </Button>
            }
          />
        </InosCard>
      </Page>
    );
  }

  const cancel = () => nav(isEdit ? `/procurement/estimates/${id}` : "/procurement/estimates/");
  const filledLines = items.filter((i) => i.particular?.trim()).length;
  const missing = [!project && "project", !vendor && "vendor", !filledLines && "at least one item"].filter(Boolean);
  const toggleStyle = { width: 40, flexShrink: 0 };

  return (
    <Page>
      <div data-testid="create-estimate-page" style={{ display: "contents" }}>
        <PageHeader
          crumbs={[
            { label: "Procurement", to: "/procurement" },
            { label: "Estimates", to: "/procurement/estimates/all" },
            { label: isEdit ? "Edit" : "New" },
          ]}
          title={isEdit ? `Edit estimate${estimateNumber ? ` ${estimateNumber}` : ""}` : "New estimate"}
          subtitle="Choose the project and vendor, list the items, then save a draft or submit for approval."
          actions={
            <Button variant="ghost" icon={ArrowLeft} onClick={cancel} data-testid="cancel-btn">
              Cancel
            </Button>
          }
        />

        {readOnly && (
          <Callout tone="info" title="Approved — read only">
            Only an admin can edit an approved estimate.
          </Callout>
        )}

        <form
          className="inos-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit(QUOTATION_STATUS.SUBMITTED);
          }}
        >
          {/* 1 — Vendor & project */}
          <DocSection step={1} title="Vendor & project" description="Who is quoting, and which project it is for.">
            <Grid cols={2}>
              <Field label="Vendor" required full>
                {vendor ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <div
                      className="inos-input"
                      style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface-2)", minWidth: 0 }}
                      data-testid="vendor-selected"
                    >
                      <strong style={{ fontWeight: 650 }} className="truncate">
                        {vendor.company || vendor.name}
                      </strong>
                      <span className="truncate" style={{ color: "var(--text-3)" }}>
                        {vendor.primary_category || vendor.category || ""}
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      disabled={readOnly}
                      onClick={() => {
                        setVendor(null);
                        setVendorSearch("");
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <div className="inos-search" style={{ maxWidth: "none", minWidth: 0 }}>
                      <Search aria-hidden />
                      <input
                        disabled={readOnly}
                        value={vendorSearch}
                        onChange={(e) => setVendorSearch(e.target.value)}
                        placeholder="Search vendors by name…"
                        className="inos-input"
                        data-testid="vendor-search"
                      />
                      {vendorResults.length > 0 && vendorSearch && (
                        <div
                          style={{
                            position: "absolute", zIndex: 20, top: 44, left: 0, right: 0, maxHeight: 260, overflowY: "auto",
                            background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--shadow-md)", padding: 4,
                          }}
                        >
                          {vendorResults.slice(0, 8).map((v) => (
                            <button
                              type="button"
                              key={v.id}
                              onClick={() => {
                                setVendor({
                                  id: v.id,
                                  company: v.company_name || v.name,
                                  name: v.name,
                                  primary_category: v.vendorCategory?.name,
                                  category: v.businessType?.name,
                                  city: v.address || "", // vendor model has no dedicated city field
                                });
                                setVendorSearch("");
                              }}
                              className="cf-option"
                              style={{ flexDirection: "column", gap: 0 }}
                              data-testid={`vendor-opt-${v.id}`}
                            >
                              <span style={{ fontWeight: 600 }}>{v.company_name || v.name}</span>
                              <span className="cf-option__meta">
                                {v.vendorCategory?.name || v.businessType?.name || "—"}
                                {v.address ? ` · ${v.address}` : ""}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {vendorSearch && debouncedVendorSearch && vendorResults.length === 0 && (
                        <span className="inos-hint" style={{ position: "absolute", top: 44, left: 2 }}>
                          No vendor matches — add it as a new vendor.
                        </span>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      icon={Plus}
                      disabled={readOnly}
                      onClick={() => setShowNewVendor(true)}
                      data-testid="new-vendor-btn"
                    >
                      New vendor
                    </Button>
                  </div>
                )}
              </Field>

              <Field label="Project" required>
                <Select
                  disabled={readOnly || projectsLoading}
                  value={project?.id || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "__new__") {
                      setShowNewProject(true);
                      return;
                    }
                    const selected = projects.find((p) => String(p.id) === val);
                    setProject(selected || null);
                  }}
                  data-testid="project-select"
                >
                  <option value="">{projectsLoading ? "Loading projects…" : "Select project"}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  {project && !projects.some((p) => String(p.id) === String(project.id)) && (
                    <option value={project.id}>{project.name}</option>
                  )}
                  <option value="__new__">+ Add new project</option>
                </Select>
              </Field>
              <Field label="Site location" hint="Taken from the project.">
                <Input disabled value={project?.location || ""} placeholder="—" data-testid="site-location" />
              </Field>
              <Field label="Estimate number" hint="Generated from the project and date.">
                <Input disabled value={estimateNumber} placeholder="Pick a project first" data-testid="estimate-number" />
              </Field>
              <Field label="Estimate date" required>
                <Input
                  type="date"
                  value={estimateDate}
                  onChange={(e) => setEstimateDate(e.target.value)}
                  disabled={readOnly}
                  data-testid="estimate-date"
                />
              </Field>
            </Grid>
          </DocSection>

          {/* 2 — Line items */}
          <DocSection
            step={2}
            flush
            title="Line items"
            description="Drag the handle to reorder. Amount = rate × quantity."
            actions={
              <Button variant="secondary" size="sm" icon={Plus} onClick={addItem} disabled={readOnly}>
                Add item
              </Button>
            }
            footer={
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Plus}
                  disabled={readOnly}
                  onClick={addItem}
                  className="cf-add-row"
                  data-testid="add-row-btn"
                >
                  Add item
                </Button>
                <span className="inos-hint tabular">
                  {filledLines} of {items.length} {items.length === 1 ? "line" : "lines"} · Subtotal{" "}
                  <strong style={{ color: "var(--text)" }}>{inr(subtotal)}</strong>
                </span>
              </>
            }
          >
            <DndContext sensors={sensors} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <LineTable minWidth={980}>
                  <thead>
                    <tr>
                      <th aria-label="Reorder" style={{ width: 28, paddingLeft: 12 }} />
                      <th>#</th>
                      <th style={{ minWidth: 260 }}>Particular</th>
                      <th className="num" style={{ width: 120 }}>Rate (₹)</th>
                      <th className="num" style={{ width: 96 }}>Qty</th>
                      <th style={{ width: 120 }}>Unit</th>
                      <th className="num" style={{ width: 130 }}>Amount</th>
                      <th style={{ minWidth: 140 }}>Remarks</th>
                      <th className="actions" aria-label="Row actions" />
                    </tr>
                  </thead>
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
                        onAddUnit={setNewUnitRowId}
                      />
                    ))}
                  </tbody>
                </LineTable>
              </SortableContext>
            </DndContext>
          </DocSection>

          {/* 3 — Terms, 4 — Review */}
          <DocLayout
            aside={
              <DocSection step={4} title="Review" description="Charges and discount can be ₹ or %.">
                <div className="cf-totals cf-totals--plain" data-testid="totals-block">
                  <div className="cf-totals__row">
                    <span>Subtotal</span>
                    <span>{inr(subtotal)}</span>
                  </div>
                  <div className="cf-totals__row">
                    <span>Additional charges</span>
                    <span style={{ display: "flex", gap: 6 }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={readOnly}
                        onClick={() => setAddlIsPct((v) => !v)}
                        style={toggleStyle}
                        data-testid="addl-toggle"
                        title="Switch between ₹ and %"
                      >
                        {addlIsPct ? "%" : "₹"}
                      </Button>
                      <input
                        disabled={readOnly}
                        type="number"
                        inputMode="decimal"
                        value={addlAmt}
                        onChange={(e) => setAddlAmt(parseFloat(e.target.value) || 0)}
                        className="inos-input"
                        aria-label="Additional charges"
                        data-testid="addl-input"
                      />
                    </span>
                  </div>
                  <div className="cf-totals__row">
                    <span>Discount</span>
                    <span style={{ display: "flex", gap: 6 }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={readOnly}
                        onClick={() => setDiscIsPct((v) => !v)}
                        style={toggleStyle}
                        data-testid="disc-toggle"
                        title="Switch between ₹ and %"
                      >
                        {discIsPct ? "%" : "₹"}
                      </Button>
                      <input
                        disabled={readOnly}
                        type="number"
                        inputMode="decimal"
                        value={discAmt}
                        onChange={(e) => setDiscAmt(parseFloat(e.target.value) || 0)}
                        className="inos-input"
                        aria-label="Discount"
                        data-testid="disc-input"
                      />
                    </span>
                  </div>
                  <div className="cf-totals__row">
                    <span>Tax (%)</span>
                    <input
                      disabled={readOnly}
                      type="number"
                      inputMode="decimal"
                      value={taxPct}
                      onChange={(e) => setTaxPct(parseFloat(e.target.value) || 0)}
                      className="inos-input"
                      aria-label="Tax percent"
                      data-testid="tax-input"
                    />
                  </div>
                  <div className="cf-totals__row">
                    <span>Tax amount</span>
                    <span>{inr(taxAmount)}</span>
                  </div>
                  <div className="cf-totals__grand">
                    <span>Grand total</span>
                    <strong data-testid="grand-total">{inr(grandTotal)}</strong>
                  </div>
                </div>
                {missing.length > 0 && (
                  <Callout tone="warn" title="Before saving">
                    Add {missing.join(", ")}.
                  </Callout>
                )}
              </DocSection>
            }
          >
            <DocSection step={3} title="Terms & approval" description="Printed on the estimate. Review details appear once it's reviewed.">
              <Grid cols={1}>
                <Field label="Terms & conditions">
                  <TextArea
                    disabled={readOnly}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    rows={6}
                    placeholder="One term per line"
                    data-testid="terms"
                  />
                </Field>
                <div className="cf-block" data-testid="approved-by-block">
                  <div className="cf-block__head">
                    <p className="cf-block__title">Reviewer</p>
                  </div>
                  {existingQuotation?.reviewedBy || existingQuotation?.reviewed_by ? (
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {existingQuotation.reviewedBy?.name || existingQuotation.reviewed_by}
                      </div>
                      {(existingQuotation.reviewRemarks || existingQuotation.review_remarks) && (
                        <div className="inos-hint">
                          {existingQuotation.reviewRemarks || existingQuotation.review_remarks}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="inos-hint">Available after this estimate is submitted and reviewed. The contractor signature block is added on print.</span>
                  )}
                </div>
              </Grid>
            </DocSection>
          </DocLayout>

          <div className="inos-form-actions">
            <span className="inos-form-actions__note tabular">
              {filledLines} {filledLines === 1 ? "item" : "items"} · Grand total{" "}
              <strong style={{ color: "var(--brand)" }}>{inr(grandTotal)}</strong>
            </span>
            <div className="inos-form-actions__buttons">
              <Button variant="ghost" onClick={cancel}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                icon={Save}
                disabled={busy || readOnly}
                onClick={() => submit(QUOTATION_STATUS.DRAFT)}
                data-testid="save-draft-btn"
              >
                Save draft
              </Button>
              <Button
                variant="primary"
                type="submit"
                icon={Send}
                disabled={busy || readOnly}
                data-testid="submit-approval-btn"
              >
                {busy
                  ? "Saving…"
                  : isEdit && status !== QUOTATION_STATUS.DRAFT
                    ? "Save changes"
                    : "Submit for approval"}
              </Button>
            </div>
          </div>
        </form>

      {showNewVendor && (
        <NewVendorModal
          onClose={() => setShowNewVendor(false)}
          onCreated={(v) => {
            setVendor(v);
            setShowNewVendor(false);
          }}
        />
      )}

      {showNewProject && (
        <NewProjectModal
          open={showNewProject}
          onClose={() => setShowNewProject(false)}
          onCreated={(p) => {
            setProject({
              id: p.id,
              name: p.name,
              location: p.site_location || p.location,
            });
            setShowNewProject(false);
          }}
        />
      )}

      {newUnitRowId && (
        <AddUnitModal
          open={!!newUnitRowId}
          onClose={() => setNewUnitRowId(null)}
          onCreated={(u) => {
            setItem(newUnitRowId, { unit_id: u.id });
            setNewUnitRowId(null);
          }}
        />
      )}
      </div>
    </Page>
  );
}
