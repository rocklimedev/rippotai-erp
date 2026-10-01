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

import { useGetMaterialsQuery } from "../../api/procuerment/material-master.api";
import { useGetVendorsQuery } from "../../api/vendors/vendor.api";
import { useGetProjectByIdQuery } from "../../api/projects/project.api";

/* ================================================================
   OPERATIONS
================================================================ */

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

/* ================================================================
   YES / NO / NA

   IMPORTANT:
   Database enum is:
     YES
     NO
     NA

   Not:
     NOT_APPLICABLE
================================================================ */

const YES_NO_NA = [
  {
    value: "NA",
    label: "Not applicable",
  },
  {
    value: "YES",
    label: "Yes",
  },
  {
    value: "NO",
    label: "No",
  },
];

/* ================================================================
   CONDITION
================================================================ */

const CONDITION_OPTIONS = [
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
];

/* ================================================================
   COMPONENT
================================================================ */

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

  /* ================================================================
     FORM
  ================================================================ */

  const [form, setForm] = useState({
    project_id: projectId,

    /*
     * Inventory is now tied to the project's site location.
     *
     * No site_id.
     */
    site_location: "",

    material_id: initialMaterialId,

    /*
     * Captured from Material Master.
     *
     * This is required by inventory_transactions.unit_id.
     */
    unit_id: "",

    transaction_date: new Date().toISOString().slice(0, 10),

    quantity: "",

    /* ------------------------------------------------------------
       RECEIPT
    ------------------------------------------------------------ */

    vendor_id: "",
    challan_bill_no: "",

    gate_pass_received: "NA",
    material_checked: "NA",

    reference_type: "",
    reference_id: "",
    reference_item_id: "",

    /* ------------------------------------------------------------
       ISSUE
    ------------------------------------------------------------ */

    contractor_id: "",
    issued_to: "",
    trade: "",

    /* ------------------------------------------------------------
       RETURN
    ------------------------------------------------------------ */

    return_type: "RETURN_FROM_CONTRACTOR",

    /* ------------------------------------------------------------
       SHARED
    ------------------------------------------------------------ */

    work_reference: "",
    storage_location: "",

    condition_status: "NOT_APPLICABLE",
    condition_notes: "",

    remarks: "",

    /* ------------------------------------------------------------
       TRANSFER

       There is no site_id anymore.

       Site is represented by a location string.
    ------------------------------------------------------------ */

    from_site_location: "",
    to_site_location: "",

    from_storage_location: "",
    to_storage_location: "",

    /* ------------------------------------------------------------
       ADJUSTMENT
    ------------------------------------------------------------ */

    adjust_direction: "IN",
    reason: "",
  });

  /* ================================================================
     PROJECT
  ================================================================ */

  const { data: projectResponse, isFetching: loadingProject } =
    useGetProjectByIdQuery(projectId, {
      skip: !projectId,
    });

  const project = projectResponse?.data || projectResponse || null;

  const projectSiteLocation = project?.site_location || "";

  /* ================================================================
     UPDATE PROJECT / SITE
  ================================================================ */

  useEffect(() => {
    if (!project) return;

    setForm((current) => ({
      ...current,

      project_id: projectId,

      site_location: projectSiteLocation,

      /*
       * Transfer starts from the project's current location.
       */
      from_site_location: current.from_site_location || projectSiteLocation,
    }));
  }, [project, projectId, projectSiteLocation]);

  /* ================================================================
     PROJECT / MATERIAL FROM QUERY PARAMS
  ================================================================ */

  useEffect(() => {
    setForm((current) => ({
      ...current,

      project_id: projectId,

      material_id: initialMaterialId || current.material_id,
    }));
  }, [projectId, initialMaterialId]);

  /* ================================================================
     MATERIAL LOOKUP

     Used to obtain unit_id from Material Master.
  ================================================================ */

  const { data: materialResponse, isFetching: loadingSelectedMaterial } =
    useGetMaterialsQuery(
      {
        search: "",
        isActive: true,
      },
      {
        skip: !form.material_id,
      },
    );

  const materialList = materialResponse?.data || materialResponse || [];

  const selectedMaterial = materialList.find(
    (material) => material.id === form.material_id,
  );

  /*
   * Material Master is expected to expose:
   *
   * material.unit_id
   *
   * or:
   *
   * material.unit.id
   *
   * depending on the API response.
   */

  useEffect(() => {
    if (!selectedMaterial) return;

    const unitId = selectedMaterial.unit_id || selectedMaterial.unit?.id || "";

    if (!unitId) return;

    setForm((current) => ({
      ...current,
      unit_id: unitId,
    }));
  }, [selectedMaterial]);

  /* ================================================================
     MUTATIONS
  ================================================================ */

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

  /* ================================================================
     SELECTED OPERATION
  ================================================================ */

  const selectedOperation =
    OPERATIONS.find((item) => item.value === type) || OPERATIONS[0];

  /* ================================================================
     FORM SETTER
  ================================================================ */

  const set = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  /* ================================================================
     DISPLAY CONDITIONS
  ================================================================ */

  const showCondition = type === "RECEIPT" || type === "RETURN";

  const showStorage = type !== "TRANSFER";

  /* ================================================================
     COMMON PAYLOAD

     Matches inventory_transactions.

     IMPORTANT:
     No site_id.
  ================================================================ */

  const common = useMemo(
    () => ({
      project_id: form.project_id,

      ...(form.site_location.trim() && {
        site_location: form.site_location.trim(),
      }),

      material_id: form.material_id,

      /*
       * Unit is required by the inventory ledger.
       */
      unit_id: form.unit_id,

      transaction_date: form.transaction_date,

      quantity: Number(form.quantity),

      ...(showStorage &&
        form.storage_location.trim() && {
          storage_location: form.storage_location.trim(),
        }),

      ...(showCondition && {
        condition_status: form.condition_status,

        ...(form.condition_notes.trim() && {
          condition_notes: form.condition_notes.trim(),
        }),
      }),

      ...(form.remarks.trim() && {
        remarks: form.remarks.trim(),
      }),
    }),
    [form, showCondition, showStorage],
  );

  /* ================================================================
     VALIDATION
  ================================================================ */

  const validate = () => {
    if (!form.project_id) {
      toast.error("Project is required.");

      return false;
    }

    if (!form.material_id) {
      toast.error("Material is required.");

      return false;
    }

    if (!form.unit_id) {
      toast.error(
        "Material unit could not be determined. Please select the material again.",
      );

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

    if (!loadingProject && !projectSiteLocation) {
      toast.error(
        "This project has no site location assigned. Assign a site location first.",
      );

      return false;
    }

    /* ------------------------------------------------------------
       RECEIPT
    ------------------------------------------------------------ */

    if (
      type === "RECEIPT" &&
      form.reference_type &&
      !form.reference_id.trim()
    ) {
      toast.error("Reference ID is required when a reference type is chosen.");

      return false;
    }

    /* ------------------------------------------------------------
       ISSUE
    ------------------------------------------------------------ */

    if (
      type === "ISSUE" &&
      !form.issued_to.trim() &&
      !form.contractor_id &&
      !form.trade.trim()
    ) {
      toast.error(
        "Enter who the material is issued to (person, contractor or trade).",
      );

      return false;
    }

    /* ------------------------------------------------------------
       RETURN
    ------------------------------------------------------------ */

    if (
      type === "RETURN" &&
      form.return_type === "RETURN_FROM_CONTRACTOR" &&
      !form.contractor_id
    ) {
      toast.error("Contractor is required for a contractor return.");

      return false;
    }

    if (
      type === "RETURN" &&
      form.return_type === "RETURN_TO_VENDOR" &&
      !form.vendor_id
    ) {
      toast.error("Vendor is required for a vendor return.");

      return false;
    }

    /* ------------------------------------------------------------
       ADJUSTMENT
    ------------------------------------------------------------ */

    if (type === "ADJUSTMENT" && !form.reason.trim()) {
      toast.error("Adjustment reason is required.");

      return false;
    }

    /* ------------------------------------------------------------
       TRANSFER
    ------------------------------------------------------------ */

    if (type === "TRANSFER") {
      if (!form.from_site_location.trim()) {
        toast.error("From site location is required.");

        return false;
      }

      if (!form.to_site_location.trim()) {
        toast.error("To site location is required.");

        return false;
      }

      if (
        form.from_site_location.trim().toLowerCase() ===
        form.to_site_location.trim().toLowerCase()
      ) {
        toast.error("From and To site locations cannot be the same.");

        return false;
      }
    }

    return true;
  };

  /* ================================================================
     SUBMIT
  ================================================================ */

  const submit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      let response;

      /* ============================================================
         RECEIPT
      ============================================================ */

      if (type === "RECEIPT") {
        response = await receiveInventory({
          ...common,

          transaction_type: "RECEIPT",

          direction: "IN",

          ...(form.vendor_id && {
            vendor_id: form.vendor_id,
          }),

          ...(form.challan_bill_no.trim() && {
            challan_bill_no: form.challan_bill_no.trim(),
          }),

          gate_pass_received: form.gate_pass_received,

          material_checked: form.material_checked,

          ...(form.work_reference.trim() && {
            work_reference: form.work_reference.trim(),
          }),

          ...(form.reference_type && {
            reference_type: form.reference_type,

            reference_id: form.reference_id.trim(),

            ...(form.reference_item_id.trim() && {
              reference_item_id: form.reference_item_id.trim(),
            }),
          }),
        }).unwrap();
      }

      /* ============================================================
         ISSUE
      ============================================================ */

      if (type === "ISSUE") {
        response = await issueMaterial({
          ...common,

          transaction_type: "ISSUE",

          direction: "OUT",

          ...(form.contractor_id && {
            contractor_id: form.contractor_id,
          }),

          ...(form.trade.trim() && {
            trade: form.trade.trim(),
          }),

          ...(form.work_reference.trim() && {
            work_reference: form.work_reference.trim(),
          }),

          ...(form.issued_to.trim() && {
            issued_to: form.issued_to.trim(),
          }),
        }).unwrap();
      }

      /* ============================================================
         RETURN
      ============================================================ */

      if (type === "RETURN") {
        const fromContractor = form.return_type === "RETURN_FROM_CONTRACTOR";

        response = await returnInventory({
          ...common,

          return_type: form.return_type,

          transaction_type: fromContractor
            ? "RETURN_FROM_CONTRACTOR"
            : "RETURN_TO_VENDOR",

          direction: fromContractor ? "IN" : "OUT",

          ...(fromContractor
            ? {
                contractor_id: form.contractor_id,
              }
            : {
                vendor_id: form.vendor_id,
              }),

          ...(form.trade.trim() && {
            trade: form.trade.trim(),
          }),

          ...(form.work_reference.trim() && {
            work_reference: form.work_reference.trim(),
          }),
        }).unwrap();
      }

      /* ============================================================
         TRANSFER
         
         A transfer produces two ledger transactions:
         
         OUT from source
         IN to destination
         
         Backend should handle this atomically.
      ============================================================ */

      if (type === "TRANSFER") {
        response = await transferInventory({
          project_id: form.project_id,

          material_id: form.material_id,

          unit_id: form.unit_id,

          transaction_date: form.transaction_date,

          quantity: Number(form.quantity),

          from_site_location: form.from_site_location.trim(),

          to_site_location: form.to_site_location.trim(),

          ...(form.from_storage_location.trim() && {
            from_storage_location: form.from_storage_location.trim(),
          }),

          ...(form.to_storage_location.trim() && {
            to_storage_location: form.to_storage_location.trim(),
          }),

          ...(form.work_reference.trim() && {
            work_reference: form.work_reference.trim(),
          }),

          ...(form.remarks.trim() && {
            remarks: form.remarks.trim(),
          }),
        }).unwrap();
      }

      /* ============================================================
         ADJUSTMENT
      ============================================================ */

      if (type === "ADJUSTMENT") {
        const direction = form.adjust_direction;

        response = await adjustInventory({
          ...common,

          transaction_type:
            direction === "IN" ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",

          direction,

          reason: form.reason.trim(),
        }).unwrap();
      }

      /* ============================================================
         OPENING STOCK

         There is no OPENING transaction type
         in inventory_transactions.

         Therefore opening stock is represented as:

           ADJUSTMENT_IN
           IN

         Backend addOpeningStock can still expose
         a dedicated business endpoint.
      ============================================================ */

      if (type === "OPENING") {
        response = await addOpeningStock({
          ...common,

          transaction_type: "ADJUSTMENT_IN",

          direction: "IN",

          reason: "Opening stock",
        }).unwrap();
      }

      toast.success("Inventory transaction recorded.");

      nav(
        `/procurement/site-inventory/register?project_id=${encodeURIComponent(
          form.project_id,
        )}`,
      );
    } catch (error) {
      const message =
        error?.data?.message ||
        error?.error ||
        error?.message ||
        "Unable to record inventory transaction.";

      toast.error(Array.isArray(message) ? message.join(", ") : message);
    }
  };

  /* ================================================================
     NO PROJECT
  ================================================================ */

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

  /* ================================================================
     RENDER
  ================================================================ */

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
            {/* ======================================================
                BASIC
            ====================================================== */}

            <Section title="Basic Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MaterialSelect
                  label="Material"
                  required
                  value={form.material_id}
                  onChange={(value, option) => {
                    set("material_id", value);

                    const unitId = option?.unit_id || option?.unit?.id || "";

                    set("unit_id", unitId);
                  }}
                  disabled={Boolean(initialMaterialId)}
                />

                <ReadOnlyField
                  label="Site Location"
                  value={
                    loadingProject
                      ? "Loading…"
                      : projectSiteLocation || "— No site location assigned"
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
                  step="0.001"
                  min="0"
                  required
                  value={form.quantity}
                  onChange={(value) => set("quantity", value)}
                  placeholder="0.000"
                />

                <ReadOnlyField
                  label="Unit"
                  value={
                    loadingSelectedMaterial
                      ? "Loading…"
                      : selectedMaterial?.unit?.code ||
                        selectedMaterial?.unit?.name ||
                        "—"
                  }
                  hint="Taken from Material Master"
                />
              </div>
            </Section>

            {/* ======================================================
                RECEIPT
            ====================================================== */}

            {type === "RECEIPT" && (
              <Section title="Receipt Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <VendorSelect
                    label="Received From (Vendor / Supplier)"
                    value={form.vendor_id}
                    onChange={(value) => set("vendor_id", value)}
                  />

                  <Field
                    label="Challan / Bill No."
                    value={form.challan_bill_no}
                    onChange={(value) => set("challan_bill_no", value)}
                    placeholder="CH-4471"
                  />

                  <SelectField
                    label="Gate Pass Received"
                    value={form.gate_pass_received}
                    onChange={(value) => set("gate_pass_received", value)}
                    options={YES_NO_NA}
                  />

                  <SelectField
                    label="Material Checked"
                    value={form.material_checked}
                    onChange={(value) => set("material_checked", value)}
                    options={YES_NO_NA}
                  />

                  <Field
                    label="For Which Work"
                    value={form.work_reference}
                    onChange={(value) => set("work_reference", value)}
                    placeholder="Living & dining flooring"
                  />

                  <SelectField
                    label="Linked Document"
                    value={form.reference_type}
                    onChange={(value) => set("reference_type", value)}
                    options={[
                      {
                        value: "",
                        label: "None (manual receipt)",
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

                  {form.reference_type && (
                    <>
                      <Field
                        label="Reference ID"
                        required
                        value={form.reference_id}
                        onChange={(value) => set("reference_id", value)}
                        placeholder="Document UUID"
                      />

                      <Field
                        label="Reference Item ID"
                        value={form.reference_item_id}
                        onChange={(value) => set("reference_item_id", value)}
                        placeholder="Optional item UUID"
                      />
                    </>
                  )}
                </div>
              </Section>
            )}

            {/* ======================================================
                ISSUE
            ====================================================== */}

            {type === "ISSUE" && (
              <Section title="Issue Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <VendorSelect
                    label="Contractor"
                    value={form.contractor_id}
                    onChange={(value) => set("contractor_id", value)}
                  />

                  <Field
                    label="Issued To (person / team)"
                    value={form.issued_to}
                    onChange={(value) => set("issued_to", value)}
                    placeholder="Gupta Tiling"
                  />

                  <Field
                    label="Trade"
                    value={form.trade}
                    onChange={(value) => set("trade", value)}
                    placeholder="Tiling & Stone"
                  />

                  <Field
                    label="For Which Work"
                    value={form.work_reference}
                    onChange={(value) => set("work_reference", value)}
                    placeholder="Living & dining flooring"
                  />
                </div>
              </Section>
            )}

            {/* ======================================================
                RETURN
            ====================================================== */}

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
                        label: "Return from Contractor (adds stock)",
                      },
                      {
                        value: "RETURN_TO_VENDOR",
                        label: "Return to Vendor (removes stock)",
                      },
                    ]}
                  />

                  {form.return_type === "RETURN_FROM_CONTRACTOR" ? (
                    <VendorSelect
                      label="Contractor"
                      required
                      value={form.contractor_id}
                      onChange={(value) => set("contractor_id", value)}
                    />
                  ) : (
                    <VendorSelect
                      label="Vendor"
                      required
                      value={form.vendor_id}
                      onChange={(value) => set("vendor_id", value)}
                    />
                  )}

                  <Field
                    label="Trade"
                    value={form.trade}
                    onChange={(value) => set("trade", value)}
                  />

                  <Field
                    label="For Which Work"
                    value={form.work_reference}
                    onChange={(value) => set("work_reference", value)}
                  />
                </div>
              </Section>
            )}

            {/* ======================================================
                TRANSFER
            ====================================================== */}

            {type === "TRANSFER" && (
              <Section title="Transfer Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ReadOnlyField
                    label="From Site Location"
                    value={form.from_site_location || "—"}
                    hint="Defaults to the project's site location"
                  />

                  <Field
                    label="To Site Location"
                    required
                    value={form.to_site_location}
                    onChange={(value) => set("to_site_location", value)}
                    placeholder="Another project/site location"
                  />

                  <Field
                    label="From Storage"
                    value={form.from_storage_location}
                    onChange={(value) => set("from_storage_location", value)}
                    placeholder="Main Store"
                  />

                  <Field
                    label="To Storage"
                    value={form.to_storage_location}
                    onChange={(value) => set("to_storage_location", value)}
                    placeholder="Site Store"
                  />

                  <Field
                    label="For Which Work"
                    value={form.work_reference}
                    onChange={(value) => set("work_reference", value)}
                  />
                </div>
              </Section>
            )}

            {/* ======================================================
                ADJUSTMENT
            ====================================================== */}

            {type === "ADJUSTMENT" && (
              <Section title="Adjustment Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label="Adjustment Direction"
                    required
                    value={form.adjust_direction}
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

            {/* ======================================================
                OPENING
            ====================================================== */}

            {type === "OPENING" && (
              <Section title="Opening Stock">
                <div className="rounded-lg border border-[#D8E0DA] bg-[#F4F6F7] p-4">
                  <p className="text-[13px] text-[#6B7B7C]">
                    Use opening stock only when establishing the initial
                    inventory balance for this project/site.
                  </p>

                  <p className="mt-2 text-[12px] text-[#8A9695]">
                    This will be recorded as an incoming inventory movement.
                  </p>
                </div>
              </Section>
            )}

            {/* ======================================================
                STORAGE / CONDITION / REMARKS
            ====================================================== */}

            <Section
              title={
                showCondition
                  ? "Condition, Storage & Remarks"
                  : "Storage & Remarks"
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {showCondition && (
                  <SelectField
                    label="Condition / Shortage"
                    value={form.condition_status}
                    onChange={(value) => set("condition_status", value)}
                    options={CONDITION_OPTIONS}
                  />
                )}

                {showStorage && (
                  <Field
                    label="Stored At"
                    value={form.storage_location}
                    onChange={(value) => set("storage_location", value)}
                    placeholder="Store room / rack / bin"
                  />
                )}

                {showCondition && (
                  <TextField
                    label="Condition Notes"
                    value={form.condition_notes}
                    onChange={(value) => set("condition_notes", value)}
                    placeholder="4 pcs edge-chipped, noted on challan"
                  />
                )}

                <TextField
                  label="Remarks"
                  value={form.remarks}
                  onChange={(value) => set("remarks", value)}
                />
              </div>
            </Section>
          </div>
        </Card>

        {/* ==========================================================
            SUBMIT
        ========================================================== */}

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
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}

            {isSaving ? "Saving..." : `Record ${selectedOperation.label}`}
          </button>
        </div>
      </form>
    </Shell>
  );
}

/* ================================================================
   BASIC COMPONENTS
================================================================ */

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-[14px] font-bold text-[#1F453B] mb-3">{title}</h3>

      {children}
    </div>
  );
}

/* ================================================================
   FIELD
================================================================ */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
  ...rest
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
        {...rest}
      />
    </div>
  );
}

/* ================================================================
   READ ONLY
================================================================ */

function ReadOnlyField({ label, value, hint }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#4D5B5C] mb-1.5">
        {label}
      </label>

      <div className="min-h-10 rounded-lg border border-[#D8E0DA] bg-[#F4F6F7] px-3 py-2 flex items-center text-[13px] text-[#333333]">
        {value}
      </div>

      {hint && <p className="mt-1 text-[11px] text-[#8A9695]">{hint}</p>}
    </div>
  );
}

/* ================================================================
   TEXT FIELD
================================================================ */

function TextField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#4D5B5C] mb-1.5">
        {label}
      </label>

      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-[#D8E0DA] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#1F453B]"
      />
    </div>
  );
}

/* ================================================================
   SELECT
================================================================ */

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
        className="w-full h-10 rounded-lg border border-[#D8E0DA] bg-white px-3 text-[13px] outline-none focus:border-[#1F453B]"
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
   DEBOUNCE
================================================================ */

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/* ================================================================
   ASYNC SEARCH SELECT
================================================================ */

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
    blurTimeout.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    return () => clearTimeout(blurTimeout.current);
  }, []);

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
                onChange(option.id, option);

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
   MATERIAL SELECT
================================================================ */

const materialLabel = (material) =>
  `${material.name}${
    material.unit?.code
      ? ` (${material.unit.code})`
      : material.unit?.name
        ? ` (${material.unit.name})`
        : ""
  }`;

function MaterialSelect({ label, value, onChange, required, disabled }) {
  const [selectedLabel, setSelectedLabel] = useState("");

  function useResults(search, options) {
    const { data, isFetching } = useGetMaterialsQuery(
      {
        search,
        isActive: true,
      },
      options,
    );

    const list = data?.data || data || [];

    return {
      options: list,
      isFetching,
    };
  }

  /*
   * Resolve label for a preselected
   * material_id.
   */

  const { options: currentPageOptions } = useResults("", {
    skip: !value || Boolean(selectedLabel),
  });

  useEffect(() => {
    if (!value) {
      setSelectedLabel("");

      return;
    }

    const match = currentPageOptions.find((material) => material.id === value);

    if (match) {
      setSelectedLabel(materialLabel(match));
    }
  }, [value, currentPageOptions]);

  return (
    <AsyncSearchSelect
      label={label}
      value={value}
      onChange={(id, option) => {
        if (option) {
          setSelectedLabel(materialLabel(option));
        }

        onChange(id, option);
      }}
      required={required}
      disabled={disabled}
      placeholder="Search materials…"
      useResults={useResults}
      getOptionLabel={(material) => material.name}
      getOptionSublabel={(material) =>
        [material.category, material.unit?.code || material.unit?.name]
          .filter(Boolean)
          .join(" · ")
      }
      selectedLabel={selectedLabel || value}
    />
  );
}

/* ================================================================
   VENDOR / CONTRACTOR SELECT
================================================================ */

const vendorLabel = (vendor) => vendor.name || vendor.company_name || "";

function VendorSelect({ label, value, onChange, required, disabled }) {
  const [selectedLabel, setSelectedLabel] = useState("");

  function useResults(search, options) {
    const { data, isFetching } = useGetVendorsQuery(
      {
        q: search,
        status: "ACTIVE",
      },
      options,
    );

    const list = data?.data || data || [];

    return {
      options: list,
      isFetching,
    };
  }

  const { options: currentPageOptions } = useResults("", {
    skip: !value || Boolean(selectedLabel),
  });

  useEffect(() => {
    if (!value) {
      setSelectedLabel("");

      return;
    }

    const match = currentPageOptions.find((vendor) => vendor.id === value);

    if (match) {
      setSelectedLabel(vendorLabel(match));
    }
  }, [value, currentPageOptions]);

  return (
    <AsyncSearchSelect
      label={label}
      value={value}
      onChange={(id, option) => {
        if (option) {
          setSelectedLabel(vendorLabel(option));
        }

        onChange(id, option);
      }}
      required={required}
      disabled={disabled}
      placeholder="Search…"
      useResults={useResults}
      getOptionLabel={vendorLabel}
      getOptionSublabel={(vendor) =>
        [vendor.category?.name, vendor.business_type?.name]
          .filter(Boolean)
          .join(" · ")
      }
      selectedLabel={selectedLabel || value}
    />
  );
}
