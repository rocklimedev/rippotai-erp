import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  PackagePlus,
  PackageMinus,
  RotateCcw,
  ArrowLeftRight,
  SlidersHorizontal,
  PackageOpen,
  Save,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import {
  Page,
  PageHeader,
  Button,
  Card,
  EmptyState,
  Field as InosField,
  TextInput,
  SelectInput,
  TextArea as InosTextArea,
  FormActions,
  ChoiceGroup,
} from "@/components/inos";
import { DocSection, Grid, Callout } from "@/components/forms/commerce-form-ui";
import { useGetProjectsQuery } from "../../api/projects/project.api";

import {
  useReceiveInventoryMutation,
  useIssueMaterialMutation,
  useReturnInventoryMutation,
  useTransferInventoryMutation,
  useAdjustInventoryMutation,
  useAddOpeningStockMutation,
} from "../../api/procuerment/inventory.api";

// NOTE: adjust these three import paths to match where these slices
// actually live in your api/ folder — they were provided separately
// and injected onto the same `baseApi`.
import { useGetMaterialsQuery } from "../../api/procuerment/material-master.api";
import { useGetVendorsQuery } from "../../api/vendors/vendor.api";
import { useGetProjectByIdQuery } from "../../api/projects/project.api";
const Input = (p) => <TextInput {...p} />;

const OPERATIONS = [
  {
    value: "RECEIPT",
    label: "Receive material",
    icon: PackagePlus,
  },
  {
    value: "ISSUE",
    label: "Issue material",
    icon: PackageMinus,
  },
  {
    value: "RETURN",
    label: "Return material",
    icon: RotateCcw,
  },
  {
    value: "TRANSFER",
    label: "Transfer material",
    icon: ArrowLeftRight,
  },
  {
    value: "ADJUSTMENT",
    label: "Adjust stock",
    icon: SlidersHorizontal,
  },
  {
    value: "OPENING",
    label: "Opening stock",
    icon: PackageOpen,
  },
];

export default function SiteInventoryTransactionForm() {
  const nav = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const projectId = searchParams.get("project_id") || searchParams.get("projectId") || "";

  const initialMaterialId = searchParams.get("material_id") || "";

  const initialType = searchParams.get("type") || "RECEIPT";

  const [type, setType] = useState(
    OPERATIONS.some((item) => item.value === initialType)
      ? initialType
      : "RECEIPT",
  );

  const [form, setForm] = useState({
    project_id: projectId,
    site_id: "",
    material_id: initialMaterialId,
    transaction_date: new Date().toISOString().slice(0, 10),
    quantity: "",
    vendor_id: "",
    contractor_id: "",
    storage_location: "",
    from_site_id: "",
    to_site_id: "",
    from_storage_location: "",
    to_storage_location: "",
    trade: "",
    work_reference: "",
    issued_to: "",
    reason: "",
    condition_status: "NOT_APPLICABLE",
    condition_notes: "",
    remarks: "",
    reference_type: "",
    reference_id: "",
    reference_item_id: "",
    return_type: "RETURN_FROM_CONTRACTOR",
    received_by: "",
    issued_by: "",
  });

  // ============================================================
  // PROJECT (site is not its own model — it's a field on Project)
  // ============================================================

  const { data: projectResponse, isFetching: loadingProject } =
    useGetProjectByIdQuery(projectId, { skip: !projectId });

  const project = projectResponse?.data || projectResponse || null;

  useEffect(() => {
    if (!project) return;

    setForm((current) => ({
      ...current,
      site_id: project.site ?? project.site_id ?? "",
    }));
  }, [project]);

  const [receiveInventory, { isLoading: receiving }] =
    useReceiveInventoryMutation();

  const [issueMaterial, { isLoading: issuing }] = useIssueMaterialMutation();

  const [returnInventory, { isLoading: returning }] =
    useReturnInventoryMutation();

  const [transferInventory, { isLoading: transferring }] =
    useTransferInventoryMutation();

  const [adjustInventory, { isLoading: adjusting }] =
    useAdjustInventoryMutation();

  const [addOpeningStock, { isLoading: opening }] =
    useAddOpeningStockMutation();

  const isSaving =
    receiving || issuing || returning || transferring || adjusting || opening;

  useEffect(() => {
    setForm((current) => ({
      ...current,
      project_id: projectId,
      material_id: initialMaterialId || current.material_id,
    }));
  }, [projectId, initialMaterialId]);

  const selectedOperation =
    OPERATIONS.find((item) => item.value === type) || OPERATIONS[0];

  const Icon = selectedOperation.icon;

  const set = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const common = useMemo(
    () => ({
      project_id: form.project_id,
      ...(form.site_id && {
        site_id: form.site_id,
      }),
      material_id: form.material_id,
      transaction_date: form.transaction_date,
      quantity: Number(form.quantity),
      ...(form.storage_location && {
        storage_location: form.storage_location,
      }),
      ...(form.condition_status && {
        condition_status: form.condition_status,
      }),
      ...(form.condition_notes && {
        condition_notes: form.condition_notes,
      }),
      ...(form.remarks && {
        remarks: form.remarks,
      }),
    }),
    [form],
  );

  const validate = () => {
    if (!form.project_id) {
      toast.error("Project is required.");
      return false;
    }

    if (!form.material_id) {
      toast.error("Material is required.");
      return false;
    }

    if (!form.quantity || Number(form.quantity) <= 0) {
      toast.error("Quantity must be greater than zero.");
      return false;
    }

    if (!form.transaction_date) {
      toast.error("Transaction date is required.");
      return false;
    }

    if (type === "ADJUSTMENT" && !form.reason.trim()) {
      toast.error("Adjustment reason is required.");
      return false;
    }

    if (type === "TRANSFER" && !form.from_site_id) {
      toast.error("From site is required.");
      return false;
    }

    if (type === "TRANSFER" && !form.to_site_id) {
      toast.error("To site is required.");
      return false;
    }

    if (type === "TRANSFER" && form.from_site_id === form.to_site_id) {
      toast.error("From and To site cannot be the same.");
      return false;
    }

    return true;
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      let response;

      if (type === "RECEIPT") {
        response = await receiveInventory({
          ...common,

          ...(form.reference_type && {
            reference_type: form.reference_type,
          }),

          ...(form.reference_id && {
            reference_id: form.reference_id,
          }),

          ...(form.reference_item_id && {
            reference_item_id: form.reference_item_id,
          }),

          ...(form.vendor_id && {
            vendor_id: form.vendor_id,
          }),

          ...(form.received_by && {
            received_by: form.received_by,
          }),
        }).unwrap();
      }

      if (type === "ISSUE") {
        response = await issueMaterial({
          ...common,

          ...(form.contractor_id && {
            contractor_id: form.contractor_id,
          }),

          ...(form.trade && {
            trade: form.trade,
          }),

          ...(form.work_reference && {
            work_reference: form.work_reference,
          }),

          ...(form.issued_to && {
            issued_to: form.issued_to,
          }),

          ...(form.issued_by && {
            issued_by: form.issued_by,
          }),
        }).unwrap();
      }

      if (type === "RETURN") {
        response = await returnInventory({
          ...common,

          return_type: form.return_type,

          ...(form.reference_type && {
            reference_type: form.reference_type,
          }),

          ...(form.reference_id && {
            reference_id: form.reference_id,
          }),

          ...(form.reference_item_id && {
            reference_item_id: form.reference_item_id,
          }),

          ...(form.vendor_id && {
            vendor_id: form.vendor_id,
          }),

          ...(form.contractor_id && {
            contractor_id: form.contractor_id,
          }),

          ...(form.trade && {
            trade: form.trade,
          }),

          ...(form.received_by && {
            received_by: form.received_by,
          }),
        }).unwrap();
      }

      if (type === "TRANSFER") {
        response = await transferInventory({
          project_id: form.project_id,

          from_site_id: form.from_site_id,

          to_site_id: form.to_site_id,

          material_id: form.material_id,

          transaction_date: form.transaction_date,

          quantity: Number(form.quantity),

          ...(form.from_storage_location && {
            from_storage_location: form.from_storage_location,
          }),

          ...(form.to_storage_location && {
            to_storage_location: form.to_storage_location,
          }),

          ...(form.issued_by && {
            issued_by: form.issued_by,
          }),

          ...(form.received_by && {
            received_by: form.received_by,
          }),

          ...(form.work_reference && {
            work_reference: form.work_reference,
          }),

          ...(form.remarks && {
            remarks: form.remarks,
          }),
        }).unwrap();
      }

      if (type === "ADJUSTMENT") {
        response = await adjustInventory({
          ...common,

          direction: form.adjust_direction || "IN",

          reason: form.reason.trim(),
        }).unwrap();
      }

      if (type === "OPENING") {
        response = await addOpeningStock({
          ...common,
        }).unwrap();
      }

      toast.success("Inventory transaction recorded.");

      const createdId = response?.id || response?.data?.id;

      if (createdId) {
        nav(
          `/procurement/site-inventory/transactions/${createdId}?project_id=${form.project_id}`,
        );
      } else {
        nav(`/procurement/site-inventory?project_id=${form.project_id}`);
      }
    } catch (error) {
      const message =
        error?.data?.message ||
        error?.error ||
        "Unable to record inventory transaction.";

      toast.error(Array.isArray(message) ? message.join(", ") : message);
    }
  };

  if (!projectId) {
    return <ProjectPicker onPick={(id) => setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set("project_id", id); return next; })} onBack={() => nav("/inventory")} />;
  }

  const hasTypeStorage = ["RECEIPT", "ISSUE", "RETURN"].includes(type);
  const typeTitle = {
    RECEIPT: "Receipt details",
    ISSUE: "Issue details",
    RETURN: "Return details",
    TRANSFER: "Transfer details",
    ADJUSTMENT: "Adjustment details",
    OPENING: "Opening stock",
  }[type];

  return (
    <Page width="form">
      <PageHeader
        crumbs={[
          { label: "Inventory", to: "/inventory" },
          { label: "Transactions", to: "/inventory/site-inventory/transactions" },
          { label: "New" },
        ]}
        title={selectedOperation.label}
        subtitle={`Record a stock movement${project?.name ? ` for ${project.name}` : ""} in the inventory ledger.`}
        actions={
          <Button variant="ghost" icon={ArrowLeft} onClick={() => nav(-1)}>
            Back
          </Button>
        }
      />

      <form className="inos-form" onSubmit={submit}>
        <DocSection step={1} title="What are you recording?" description="Pick the kind of stock movement.">
          <div className="cf-choices-3">
          <ChoiceGroup
            name="Transaction type"
            value={type}
            onChange={setType}
            options={OPERATIONS.map((o) => ({ value: o.value, label: o.label, icon: o.icon }))}
          />
          </div>
        </DocSection>

        <DocSection step={2} title="Material & quantity" description="What moved, how much, and when.">
          <Grid cols={2}>
            <div className="span-full">
              <MaterialSelect
                label="Material"
                required
                value={form.material_id}
                onChange={(value) => set("material_id", value)}
                disabled={Boolean(initialMaterialId)}
              />
            </div>
            <Field
              label="Quantity"
              type="number"
              required
              value={form.quantity}
              onChange={(value) => set("quantity", value)}
              placeholder="e.g. 25"
              hint="In the material's unit."
            />
            <Field
              label="Transaction date"
              type="date"
              required
              value={form.transaction_date}
              onChange={(value) => set("transaction_date", value)}
            />
            <ReadOnlyField
              label="Site"
              value={loadingProject ? "Loading…" : project?.site || project?.site_id || "No site on this project"}
              hint="Taken from the project."
            />
          </Grid>
        </DocSection>

        <DocSection step={3} title={typeTitle} description={type === "OPENING" ? undefined : "Who and where this movement relates to."}>
          {type === "RECEIPT" && (
            <Grid cols={2}>
              <SelectField
                label="Received against"
                value={form.reference_type}
                onChange={(value) => set("reference_type", value)}
                options={[
                  { value: "", label: "Manual receipt" },
                  { value: "DELIVERY_CHALLAN", label: "Delivery challan" },
                  { value: "PURCHASE_ORDER", label: "Purchase order" },
                ]}
              />
              <VendorSelect label="Vendor" value={form.vendor_id} onChange={(value) => set("vendor_id", value)} />
              {form.reference_type && (
                <>
                  <Field label="Reference ID" value={form.reference_id} onChange={(value) => set("reference_id", value)} placeholder="Challan / PO id" />
                  <Field label="Reference item ID" optional value={form.reference_item_id} onChange={(value) => set("reference_item_id", value)} placeholder="Line id, if known" />
                </>
              )}
              <Field label="Storage location" value={form.storage_location} onChange={(value) => set("storage_location", value)} placeholder="e.g. Site store" />
            </Grid>
          )}

          {type === "ISSUE" && (
            <Grid cols={2}>
              <Field label="Issued to" value={form.issued_to} onChange={(value) => set("issued_to", value)} placeholder="Person or team" />
              <VendorSelect label="Contractor" value={form.contractor_id} onChange={(value) => set("contractor_id", value)} />
              <Field label="Trade" value={form.trade} onChange={(value) => set("trade", value)} placeholder="e.g. Carpentry" />
              <Field label="Work reference" value={form.work_reference} onChange={(value) => set("work_reference", value)} placeholder="e.g. Master bedroom wardrobe" />
              <Field label="Storage location" value={form.storage_location} onChange={(value) => set("storage_location", value)} placeholder="e.g. Site store" />
            </Grid>
          )}

          {type === "RETURN" && (
            <Grid cols={2}>
              <div className="span-full">
                <InosField label="Return type" required>
                  <ChoiceGroup
                    name="Return type"
                    value={form.return_type}
                    onChange={(value) => set("return_type", value)}
                    options={[
                      { value: "RETURN_FROM_CONTRACTOR", label: "From contractor" },
                      { value: "RETURN_TO_VENDOR", label: "To vendor" },
                    ]}
                  />
                </InosField>
              </div>
              <VendorSelect label="Contractor" value={form.contractor_id} onChange={(value) => set("contractor_id", value)} />
              <VendorSelect label="Vendor" value={form.vendor_id} onChange={(value) => set("vendor_id", value)} />
              <Field label="Trade" value={form.trade} onChange={(value) => set("trade", value)} placeholder="e.g. Electrical" />
              <Field label="Storage location" value={form.storage_location} onChange={(value) => set("storage_location", value)} placeholder="e.g. Site store" />
            </Grid>
          )}

          {type === "TRANSFER" && (
            <Grid cols={2}>
              <Field label="From site" required value={form.from_site_id} onChange={(value) => set("from_site_id", value)} placeholder="Source site" />
              <Field label="To site" required value={form.to_site_id} onChange={(value) => set("to_site_id", value)} placeholder="Destination site" hint="Must differ from the source." />
              <Field label="From storage" value={form.from_storage_location} onChange={(value) => set("from_storage_location", value)} placeholder="e.g. Store A" />
              <Field label="To storage" value={form.to_storage_location} onChange={(value) => set("to_storage_location", value)} placeholder="e.g. Store B" />
              <Field label="Work reference" value={form.work_reference} onChange={(value) => set("work_reference", value)} />
            </Grid>
          )}

          {type === "ADJUSTMENT" && (
            <Grid cols={2}>
              <InosField label="Direction" required>
                <ChoiceGroup
                  name="Adjustment direction"
                  value={form.adjust_direction || "IN"}
                  onChange={(value) => set("adjust_direction", value)}
                  options={[
                    { value: "IN", label: "Increase stock" },
                    { value: "OUT", label: "Decrease stock" },
                  ]}
                />
              </InosField>
              <Field label="Reason" required value={form.reason} onChange={(value) => set("reason", value)} placeholder="e.g. Physical count correction" />
            </Grid>
          )}

          {type === "OPENING" && (
            <Callout tone="info">Use opening stock only when setting the starting balance for a project or site.</Callout>
          )}
        </DocSection>

        <DocSection step={4} title="Condition & notes" description="Optional — note anything unusual.">
          <Grid cols={2}>
            <div className="span-full">
              <InosField label="Condition">
                <ChoiceGroup
                  name="Condition"
                  value={form.condition_status}
                  onChange={(value) => set("condition_status", value)}
                  options={[
                    { value: "NOT_APPLICABLE", label: "Not applicable" },
                    { value: "GOOD", label: "Good" },
                    { value: "DAMAGED", label: "Damaged" },
                    { value: "SHORT", label: "Short" },
                    { value: "REJECTED", label: "Rejected" },
                  ]}
                />
              </InosField>
            </div>
            {!hasTypeStorage && (
              <Field label="Storage location" value={form.storage_location} onChange={(value) => set("storage_location", value)} placeholder="e.g. Site store" />
            )}
            <TextField label="Condition notes" value={form.condition_notes} onChange={(value) => set("condition_notes", value)} placeholder="e.g. 3 bags torn at the corner" />
            <TextField label="Remarks" value={form.remarks} onChange={(value) => set("remarks", value)} placeholder="Anything else to record" />
          </Grid>
        </DocSection>

        <FormActions
          note="Saved entries post straight to the inventory ledger."
          onCancel={() => nav(-1)}
          submitLabel="Record transaction"
          submitting={isSaving}
        />
      </form>
    </Page>
  );
}

/* ================================================================
   COMPONENTS
================================================================ */

function ProjectPicker({ onPick, onBack }) {
  const { data, isLoading } = useGetProjectsQuery({});
  const projects = Array.isArray(data) ? data : data?.data || [];
  const [value, setValue] = useState("");
  return (
    <Page width="form">
      <PageHeader
        crumbs={[{ label: "Inventory", to: "/inventory" }, { label: "Transactions", to: "/inventory/site-inventory/transactions" }, { label: "New" }]}
        title="Record inventory transaction"
        subtitle="Stock is tracked per project — pick the project first."
      />
      <form className="inos-form" onSubmit={(e) => { e.preventDefault(); if (value) onPick(value); }}>
        <DocSection step={1} title="Project" description="Which project's stock is moving?">
          <InosField label="Project" required htmlFor="inv-project">
            <SelectInput id="inv-project" value={value} onChange={(e) => setValue(e.target.value)} placeholder={isLoading ? "Loading projects…" : "Select project"}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name || p.project_name || p.id}</option>
              ))}
            </SelectInput>
          </InosField>
        </DocSection>
        <FormActions onCancel={onBack} submitLabel="Continue" submitDisabled={!value} />
      </form>
    </Page>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required = false, disabled = false, hint, optional }) {
  return (
    <InosField label={label} required={required} optional={optional} hint={hint}>
      <TextInput
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={type === "number" ? "decimal" : undefined}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "any" : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </InosField>
  );
}

function ReadOnlyField({ label, value, hint }) {
  return (
    <InosField label={label} hint={hint}>
      <TextInput value={value} disabled readOnly />
    </InosField>
  );
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <InosField label={label} optional>
      <InosTextArea rows={3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </InosField>
  );
}

function SelectField({ label, value, onChange, options, required = false }) {
  return (
    <InosField label={label} required={required}>
      <SelectInput value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectInput>
    </InosField>
  );
}

/* ================================================================
   ASYNC SEARCH-SELECT (shared shell for Material / Vendor lookups)
================================================================ */

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Generic search-as-you-type dropdown. Renders a text input; while
 * open it shows a list built from `useResults(debouncedQuery)`.
 * `getOptionLabel` / `getOptionSublabel` format each row,
 * `resolveSelectedLabel` formats the closed-state input once a
 * value is chosen (so we don't need a live lookup-by-id endpoint).
 */
function AsyncSearchSelect({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = "Search…",
  useResults,
  getOptionLabel,
  getOptionSublabel,
  selectedLabel,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const blurTimeout = useRef(null);

  const { options, isFetching } = useResults(open ? debouncedQuery : "", {
    skip: disabled || !open,
  });

  const handleFocus = () => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
  };

  const handleBlur = () => {
    // delay close so the click on an option registers first
    blurTimeout.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => () => clearTimeout(blurTimeout.current), []);

  const displayValue = open ? query : value ? selectedLabel || "" : "";

  return (
    <div className="inos-field" style={{ position: "relative" }}>
      <label className="inos-label">
        {label}
        {required && <span className="req" aria-hidden>*</span>}
      </label>

      <div className="relative">
        <Input
          value={displayValue}
          placeholder={value && !open ? undefined : placeholder}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }}>
          {isFetching ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ChevronDown size={14} />
          )}
        </div>
      </div>

      {open && (
        <div className="absolute z-20 w-full max-h-56 overflow-auto" style={{ top: "100%", marginTop: 4, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--shadow-md)", padding: 4 }}>
          {isFetching && options.length === 0 && (
            <div className="px-3 py-2 inos-hint">
              Searching…
            </div>
          )}

          {!isFetching && options.length === 0 && (
            <div className="px-3 py-2 inos-hint">
              No results found.
            </div>
          )}

          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
              className="cf-option" style={{ flexDirection: "column", gap: 0 }}
            >
              <span style={{ fontWeight: 600, color: "var(--text)" }}>
                {getOptionLabel(option)}
              </span>

              {getOptionSublabel && (
                <span className="cf-option__meta">
                  {getOptionSublabel(option)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   MATERIAL SELECT — backed by materialMasterApi.getMaterials
================================================================ */

function MaterialSelect({ label, value, onChange, required, disabled }) {
  const [selectedLabel, setSelectedLabel] = useState("");

  function useResults(search, options) {
    const { data, isFetching } = useGetMaterialsQuery(
      { search, isActive: true },
      options,
    );

    const list = data?.data || data || [];

    return { options: list, isFetching };
  }

  // Keep the closed-state label in sync once we've seen the material
  // in a search result (cheap alternative to a get-by-id round trip).
  const { options: currentPageOptions } = useResults("", { skip: !value });

  useEffect(() => {
    if (!value) {
      setSelectedLabel("");
      return;
    }

    const match = currentPageOptions.find((m) => m.id === value);

    if (match) {
      setSelectedLabel(
        `${match.name}${match.unit?.code ? ` (${match.unit.code})` : ""}`,
      );
    }
  }, [value, currentPageOptions]);

  return (
    <AsyncSearchSelect
      label={label}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      placeholder="Search materials…"
      useResults={useResults}
      getOptionLabel={(m) => m.name}
      getOptionSublabel={(m) =>
        [m.category, m.unit?.code].filter(Boolean).join(" · ")
      }
      selectedLabel={selectedLabel || value}
    />
  );
}

/* ================================================================
   VENDOR / CONTRACTOR SELECT — backed by vendorsApi.getVendors
   (Contractors are sourced from the vendors table, per business
   rule: there is no separate contractor model.)
================================================================ */

function VendorSelect({ label, value, onChange, required, disabled }) {
  const [selectedLabel, setSelectedLabel] = useState("");

  function useResults(search, options) {
    const { data, isFetching } = useGetVendorsQuery(
      { q: search, status: "ACTIVE" },
      options,
    );

    const list = data?.data || data || [];

    return { options: list, isFetching };
  }

  const { options: currentPageOptions } = useResults("", { skip: !value });

  useEffect(() => {
    if (!value) {
      setSelectedLabel("");
      return;
    }

    const match = currentPageOptions.find((v) => v.id === value);

    if (match) {
      setSelectedLabel(match.name || match.company_name || "");
    }
  }, [value, currentPageOptions]);

  return (
    <AsyncSearchSelect
      label={label}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      placeholder={`Search ${label.toLowerCase()}s…`}
      useResults={useResults}
      getOptionLabel={(v) => v.name || v.company_name}
      getOptionSublabel={(v) =>
        [v.category?.name, v.business_type?.name].filter(Boolean).join(" · ")
      }
      selectedLabel={selectedLabel || value}
    />
  );
}
