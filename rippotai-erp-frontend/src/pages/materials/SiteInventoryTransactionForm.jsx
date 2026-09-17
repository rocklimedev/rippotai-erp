import React, { useEffect, useMemo, useState } from "react";
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
    site_id: searchParams.get("site_id") || "",
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
          `/materials/site-inventory/transactions/${createdId}?project_id=${form.project_id}`,
        );
      } else {
        nav(`/materials/site-inventory?project_id=${form.project_id}`);
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
              onClick={() => nav("/materials/site-inventory")}
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
                <Field
                  label="Material"
                  required
                  value={form.material_id}
                  onChange={(value) => set("material_id", value)}
                  placeholder="Material UUID"
                  disabled={Boolean(initialMaterialId)}
                />

                <Field
                  label="Site"
                  value={form.site_id}
                  onChange={(value) => set("site_id", value)}
                  placeholder="Site UUID"
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

                  <Field
                    label="Vendor ID"
                    value={form.vendor_id}
                    onChange={(value) => set("vendor_id", value)}
                    placeholder="Vendor UUID"
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

                  <Field
                    label="Contractor ID"
                    value={form.contractor_id}
                    onChange={(value) => set("contractor_id", value)}
                    placeholder="Contractor UUID"
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

                  <Field
                    label="Contractor ID"
                    value={form.contractor_id}
                    onChange={(value) => set("contractor_id", value)}
                    placeholder="Contractor UUID"
                  />

                  <Field
                    label="Vendor ID"
                    value={form.vendor_id}
                    onChange={(value) => set("vendor_id", value)}
                    placeholder="Vendor UUID"
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
                    placeholder="Source site UUID"
                  />

                  <Field
                    label="To Site"
                    required
                    value={form.to_site_id}
                    onChange={(value) => set("to_site_id", value)}
                    placeholder="Destination site UUID"
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
