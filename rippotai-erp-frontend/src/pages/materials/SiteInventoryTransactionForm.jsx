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

import { Shell, Card, Input } from "../../hooks/shared";

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

const OPERATIONS = [
  {
    value: "RECEIPT",
    label: "Receive Material",
    icon: PackagePlus,
  },
  {
    value: "ISSUE",
    label: "Issue Material",
    icon: PackageMinus,
  },
  {
    value: "RETURN",
    label: "Return Material",
    icon: RotateCcw,
  },
  {
    value: "TRANSFER",
    label: "Transfer Material",
    icon: ArrowLeftRight,
  },
  {
    value: "ADJUSTMENT",
    label: "Adjust Stock",
    icon: SlidersHorizontal,
  },
  {
    value: "OPENING",
    label: "Opening Stock",
    icon: PackageOpen,
  },
];

export default function SiteInventoryTransactionForm() {
  const nav = useNavigate();

  const [searchParams] = useSearchParams();

  const projectId = searchParams.get("project_id") || "";

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
    return (
      <Shell
        title="Record Inventory Transaction"
        subtitle="Project is required"
      >
        <Card>
          <div className="p-8 text-center">
            <p className="text-[#6B7B7C] mb-4">
              Open this page from a project inventory.
            </p>

            <button
              onClick={() => nav("/procurement/site-inventory")}
              className="h-9 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold"
            >
              Back to Inventory
            </button>
          </div>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell
      title={selectedOperation.label}
      subtitle="Record a stock movement in the inventory ledger"
      action={
        <button
          onClick={() => nav(-1)}
          className="h-9 px-3 rounded-lg border border-[#D8E0DA] bg-white text-[12px] font-semibold inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      }
    >
      {/* ============================================================
          OPERATION SELECTOR
      ============================================================ */}

      <Card>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {OPERATIONS.map((operation) => {
              const OperationIcon = operation.icon;

              const active = operation.value === type;

              return (
                <button
                  key={operation.value}
                  type="button"
                  onClick={() => setType(operation.value)}
                  className={`p-3 rounded-xl border text-left ${
                    active
                      ? "border-[#1F453B] bg-[#EAF3EE]"
                      : "border-[#D8E0DA] bg-white hover:bg-[#F4F6F7]"
                  }`}
                >
                  <OperationIcon
                    size={17}
                    className={active ? "text-[#1F453B]" : "text-[#7B898A]"}
                  />

                  <div
                    className={`mt-2 text-[12px] font-semibold ${
                      active ? "text-[#1F453B]" : "text-[#333333]"
                    }`}
                  >
                    {operation.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ============================================================
          FORM
      ============================================================ */}

      <form onSubmit={submit}>
        <Card>
          <div className="p-5 space-y-5">
            {/* BASIC */}

            <Section title="Basic Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MaterialSelect
                  label="Material"
                  required
                  value={form.material_id}
                  onChange={(value) => set("material_id", value)}
                  disabled={Boolean(initialMaterialId)}
                />

                <ReadOnlyField
                  label="Site"
                  value={
                    loadingProject
                      ? "Loading…"
                      : project?.site ||
                        project?.site_id ||
                        "— (no site on project)"
                  }
                  hint="Pulled from the selected project"
                />

                <Field
                  label="Transaction Date"
                  type="date"
                  required
                  value={form.transaction_date}
                  onChange={(value) => set("transaction_date", value)}
                />

                <Field
                  label="Quantity"
                  type="number"
                  required
                  value={form.quantity}
                  onChange={(value) => set("quantity", value)}
                  placeholder="0.000"
                />
              </div>
            </Section>

            {/* RECEIPT */}

            {type === "RECEIPT" && (
              <Section title="Receipt Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label="Reference Type"
                    value={form.reference_type}
                    onChange={(value) => set("reference_type", value)}
                    options={[
                      {
                        value: "",
                        label: "Manual Receipt",
                      },
                      {
                        value: "DELIVERY_CHALLAN",
                        label: "Delivery Challan",
                      },
                      {
                        value: "PURCHASE_ORDER",
                        label: "Purchase Order",
                      },
                    ]}
                  />

                  <Field
                    label="Reference ID"
                    value={form.reference_id}
                    onChange={(value) => set("reference_id", value)}
                    placeholder="Reference UUID"
                  />

                  <Field
                    label="Reference Item ID"
                    value={form.reference_item_id}
                    onChange={(value) => set("reference_item_id", value)}
                    placeholder="Optional item UUID"
                  />

                  <VendorSelect
                    label="Vendor"
                    value={form.vendor_id}
                    onChange={(value) => set("vendor_id", value)}
                  />

                  <Field
                    label="Storage Location"
                    value={form.storage_location}
                    onChange={(value) => set("storage_location", value)}
                    placeholder="Site Store"
                  />
                </div>
              </Section>
            )}

            {/* ISSUE */}

            {type === "ISSUE" && (
              <Section title="Issue Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Issued To"
                    value={form.issued_to}
                    onChange={(value) => set("issued_to", value)}
                    placeholder="Person / team"
                  />

                  <VendorSelect
                    label="Contractor"
                    value={form.contractor_id}
                    onChange={(value) => set("contractor_id", value)}
                  />

                  <Field
                    label="Trade"
                    value={form.trade}
                    onChange={(value) => set("trade", value)}
                    placeholder="Carpentry"
                  />

                  <Field
                    label="Work Reference"
                    value={form.work_reference}
                    onChange={(value) => set("work_reference", value)}
                    placeholder="Wardrobe / Kitchen / etc."
                  />

                  <Field
                    label="Storage Location"
                    value={form.storage_location}
                    onChange={(value) => set("storage_location", value)}
                    placeholder="Site Store"
                  />
                </div>
              </Section>
            )}

            {/* RETURN */}

            {type === "RETURN" && (
              <Section title="Return Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label="Return Type"
                    required
                    value={form.return_type}
                    onChange={(value) => set("return_type", value)}
                    options={[
                      {
                        value: "RETURN_FROM_CONTRACTOR",
                        label: "Return from Contractor",
                      },
                      {
                        value: "RETURN_TO_VENDOR",
                        label: "Return to Vendor",
                      },
                    ]}
                  />

                  <VendorSelect
                    label="Contractor"
                    value={form.contractor_id}
                    onChange={(value) => set("contractor_id", value)}
                  />

                  <VendorSelect
                    label="Vendor"
                    value={form.vendor_id}
                    onChange={(value) => set("vendor_id", value)}
                  />

                  <Field
                    label="Trade"
                    value={form.trade}
                    onChange={(value) => set("trade", value)}
                  />

                  <Field
                    label="Storage Location"
                    value={form.storage_location}
                    onChange={(value) => set("storage_location", value)}
                  />
                </div>
              </Section>
            )}

            {/* TRANSFER */}

            {type === "TRANSFER" && (
              <Section title="Transfer Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="From Site"
                    required
                    value={form.from_site_id}
                    onChange={(value) => set("from_site_id", value)}
                    placeholder="Source site"
                  />

                  <Field
                    label="To Site"
                    required
                    value={form.to_site_id}
                    onChange={(value) => set("to_site_id", value)}
                    placeholder="Destination site"
                  />

                  <Field
                    label="From Storage"
                    value={form.from_storage_location}
                    onChange={(value) => set("from_storage_location", value)}
                  />

                  <Field
                    label="To Storage"
                    value={form.to_storage_location}
                    onChange={(value) => set("to_storage_location", value)}
                  />

                  <Field
                    label="Work Reference"
                    value={form.work_reference}
                    onChange={(value) => set("work_reference", value)}
                  />
                </div>
              </Section>
            )}

            {/* ADJUSTMENT */}

            {type === "ADJUSTMENT" && (
              <Section title="Adjustment Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label="Adjustment Direction"
                    required
                    value={form.adjust_direction || "IN"}
                    onChange={(value) => set("adjust_direction", value)}
                    options={[
                      {
                        value: "IN",
                        label: "Increase Stock",
                      },
                      {
                        value: "OUT",
                        label: "Decrease Stock",
                      },
                    ]}
                  />

                  <Field
                    label="Reason"
                    required
                    value={form.reason}
                    onChange={(value) => set("reason", value)}
                    placeholder="Physical count correction"
                  />
                </div>
              </Section>
            )}

            {/* OPENING */}

            {type === "OPENING" && (
              <Section title="Opening Stock">
                <p className="text-[13px] text-[#6B7B7C]">
                  Use opening stock only when establishing the initial inventory
                  balance for a project/site.
                </p>
              </Section>
            )}

            {/* COMMON */}

            <Section title="Condition & Storage">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  label="Condition"
                  value={form.condition_status}
                  onChange={(value) => set("condition_status", value)}
                  options={[
                    {
                      value: "NOT_APPLICABLE",
                      label: "Not Applicable",
                    },
                    {
                      value: "GOOD",
                      label: "Good",
                    },
                    {
                      value: "DAMAGED",
                      label: "Damaged",
                    },
                    {
                      value: "SHORT",
                      label: "Short",
                    },
                    {
                      value: "REJECTED",
                      label: "Rejected",
                    },
                  ]}
                />

                <Field
                  label="Storage Location"
                  value={form.storage_location}
                  onChange={(value) => set("storage_location", value)}
                  placeholder="Site Store"
                />

                <TextField
                  label="Condition Notes"
                  value={form.condition_notes}
                  onChange={(value) => set("condition_notes", value)}
                />

                <TextField
                  label="Remarks"
                  value={form.remarks}
                  onChange={(value) => set("remarks", value)}
                />
              </div>
            </Section>
          </div>
        </Card>

        {/* SUBMIT */}

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={() => nav(-1)}
            className="h-10 px-4 rounded-lg border border-[#D8E0DA] bg-white text-[13px] font-semibold"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="h-10 px-5 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={14} />

            {isSaving ? "Saving..." : `Record ${selectedOperation.label}`}
          </button>
        </div>
      </form>
    </Shell>
  );
}

/* ================================================================
   COMPONENTS
================================================================ */

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-[14px] font-bold text-[#1F453B] mb-3">{title}</h3>

      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#4D5B5C] mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ReadOnlyField({ label, value, hint }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#4D5B5C] mb-1.5">
        {label}
      </label>

      <div className="h-10 rounded-lg border border-[#D8E0DA] bg-[#F4F6F7] px-3 flex items-center text-[13px] text-[#333333]">
        {value}
      </div>

      {hint && <p className="mt-1 text-[11px] text-[#8A9695]">{hint}</p>}
    </div>
  );
}

function TextField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#4D5B5C] mb-1.5">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-[#D8E0DA] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#1F453B]"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required = false }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#4D5B5C] mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-lg border border-[#D8E0DA] bg-white px-3 text-[13px]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
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
    <div className="relative">
      <label className="block text-[12px] font-semibold text-[#4D5B5C] mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
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

        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9695]">
          {isFetching ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ChevronDown size={14} />
          )}
        </div>
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-[#D8E0DA] bg-white shadow-lg">
          {isFetching && options.length === 0 && (
            <div className="px-3 py-2 text-[12px] text-[#8A9695]">
              Searching…
            </div>
          )}

          {!isFetching && options.length === 0 && (
            <div className="px-3 py-2 text-[12px] text-[#8A9695]">
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
              className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#F4F6F7] flex flex-col"
            >
              <span className="font-medium text-[#333333]">
                {getOptionLabel(option)}
              </span>

              {getOptionSublabel && (
                <span className="text-[11px] text-[#8A9695]">
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
