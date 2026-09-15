// src/components/materials/DeliveryChallanForm.jsx

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ClipboardList,
  FileText,
  Loader2,
  Package,
  Plus,
  Save,
  Trash2,
  Truck,
  X,
} from "lucide-react";

import {
  useCreateDeliveryChallanMutation,
  useUpdateDeliveryChallanMutation,
} from "../../api/procuerment/delivery-challan.api";

const EMPTY_ITEM = {
  material_id: "",
  purchase_order_item_id: "",
  quantity: "",
  accepted_quantity: "",
  shortage_quantity: "",
  damaged_quantity: "",
  rejected_quantity: "",
  condition_status: "GOOD",
  condition_notes: "",
  stored_at: "",
  description: "",
  brand: "",
  specification: "",
  unit: "",
  remarks: "",
};

const EMPTY_FORM = {
  project_id: "",
  site_id: "",
  purchase_order_id: "",
  vendor_id: "",
  challan_date: new Date().toISOString().split("T")[0],
  site_address: "",
  gate_pass_received: false,
  material_checked: false,
  general_remarks: "",
  discrepancy_notes: "",
  attachment_url: "",
  items: [{ ...EMPTY_ITEM }],
};

const CONDITION_OPTIONS = [
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
    value: "DAMAGED_AND_SHORT",
    label: "Damaged & Short",
  },
  {
    value: "REJECTED",
    label: "Rejected",
  },
];

function normalizeNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function mapExistingItem(item) {
  return {
    material_id: item?.material_id || item?.materialId || "",
    purchase_order_item_id:
      item?.purchase_order_item_id || item?.purchaseOrderItemId || "",
    quantity:
      item?.quantity !== undefined && item?.quantity !== null
        ? String(item.quantity)
        : "",
    accepted_quantity:
      item?.accepted_quantity !== undefined && item?.accepted_quantity !== null
        ? String(item.accepted_quantity)
        : "",
    shortage_quantity:
      item?.shortage_quantity !== undefined && item?.shortage_quantity !== null
        ? String(item.shortage_quantity)
        : "",
    damaged_quantity:
      item?.damaged_quantity !== undefined && item?.damaged_quantity !== null
        ? String(item.damaged_quantity)
        : "",
    rejected_quantity:
      item?.rejected_quantity !== undefined && item?.rejected_quantity !== null
        ? String(item.rejected_quantity)
        : "",
    condition_status: item?.condition_status || "GOOD",
    condition_notes: item?.condition_notes || "",
    stored_at: item?.stored_at || "",
    description: item?.description || "",
    brand: item?.brand || "",
    specification: item?.specification || "",
    unit: item?.unit || "",
    remarks: item?.remarks || "",
  };
}

function buildInitialForm(initialData) {
  if (!initialData) {
    return EMPTY_FORM;
  }

  return {
    project_id: initialData.project_id || initialData.projectId || "",
    site_id: initialData.site_id || initialData.siteId || "",
    purchase_order_id:
      initialData.purchase_order_id || initialData.purchaseOrderId || "",
    vendor_id: initialData.vendor_id || initialData.vendorId || "",
    challan_date:
      initialData.challan_date ||
      initialData.challanDate ||
      new Date().toISOString().split("T")[0],
    site_address: initialData.site_address || initialData.siteAddress || "",
    gate_pass_received: Boolean(
      initialData.gate_pass_received ?? initialData.gatePassReceived ?? false,
    ),
    material_checked: Boolean(
      initialData.material_checked ?? initialData.materialChecked ?? false,
    ),
    general_remarks:
      initialData.general_remarks || initialData.generalRemarks || "",
    discrepancy_notes:
      initialData.discrepancy_notes || initialData.discrepancyNotes || "",
    attachment_url:
      initialData.attachment_url || initialData.attachmentUrl || "",
    items:
      Array.isArray(initialData.items) && initialData.items.length > 0
        ? initialData.items.map(mapExistingItem)
        : [{ ...EMPTY_ITEM }],
  };
}

export default function DeliveryChallanForm({
  initialData = null,

  /**
   * Optional lookup data.
   *
   * Expected:
   * projects = [{ id, name }]
   * sites = [{ id, name, address, project_id }]
   * vendors = [{ id, name, agency_name }]
   * materials = [{
   *   id,
   *   material_code,
   *   name,
   *   description,
   *   unit,
   *   brand,
   *   specification
   * }]
   *
   * purchaseOrders = [{
   *   id,
   *   po_number,
   *   vendor_id,
   *   project_id,
   *   site_id,
   *   items: [{
   *     id,
   *     material_id,
   *     description,
   *     unit,
   *     quantity
   *   }]
   * }]
   */
  projects = [],
  sites = [],
  vendors = [],
  materials = [],
  purchaseOrders = [],

  /**
   * Optional external PO items.
   *
   * If supplied, these are used when a PO is selected.
   */
  purchaseOrderItems = [],

  onSuccess,
  onCancel,
}) {
  const isEditMode = Boolean(initialData?.id);

  const [form, setForm] = useState(() => buildInitialForm(initialData));

  const [errors, setErrors] = useState({});

  const [createDeliveryChallan, createState] =
    useCreateDeliveryChallanMutation();

  const [updateDeliveryChallan, updateState] =
    useUpdateDeliveryChallanMutation();

  const isSubmitting = createState.isLoading || updateState.isLoading;

  useEffect(() => {
    setForm(buildInitialForm(initialData));
    setErrors({});
  }, [initialData]);

  // ============================================================
  // DERIVED DATA
  // ============================================================

  const selectedProject = useMemo(
    () =>
      projects.find(
        (project) => String(project.id) === String(form.project_id),
      ),
    [projects, form.project_id],
  );

  const availableSites = useMemo(() => {
    if (!form.project_id) {
      return sites;
    }

    return sites.filter(
      (site) =>
        !site.project_id || String(site.project_id) === String(form.project_id),
    );
  }, [sites, form.project_id]);

  const selectedPurchaseOrder = useMemo(
    () =>
      purchaseOrders.find(
        (po) => String(po.id) === String(form.purchase_order_id),
      ),
    [purchaseOrders, form.purchase_order_id],
  );

  const selectedVendor = useMemo(
    () =>
      vendors.find((vendor) => String(vendor.id) === String(form.vendor_id)),
    [vendors, form.vendor_id],
  );

  const effectivePurchaseOrderItems = useMemo(() => {
    if (form.purchase_order_id && selectedPurchaseOrder?.items?.length) {
      return selectedPurchaseOrder.items;
    }

    return purchaseOrderItems;
  }, [form.purchase_order_id, selectedPurchaseOrder, purchaseOrderItems]);

  const totals = useMemo(() => {
    return form.items.reduce(
      (acc, item) => {
        acc.quantity += normalizeNumber(item.quantity);
        acc.accepted += normalizeNumber(item.accepted_quantity);
        acc.shortage += normalizeNumber(item.shortage_quantity);
        acc.damaged += normalizeNumber(item.damaged_quantity);
        acc.rejected += normalizeNumber(item.rejected_quantity);

        return acc;
      },
      {
        quantity: 0,
        accepted: 0,
        shortage: 0,
        damaged: 0,
        rejected: 0,
      },
    );
  }, [form.items]);

  // ============================================================
  // FORM HELPERS
  // ============================================================

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const updateItem = (index, field, value) => {
    setForm((current) => {
      const items = [...current.items];

      items[index] = {
        ...items[index],
        [field]: value,
      };

      return {
        ...current,
        items,
      };
    });

    setErrors((current) => {
      const key = `items.${index}.${field}`;

      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const addItem = () => {
    setForm((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          ...EMPTY_ITEM,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (form.items.length === 1) {
      toast.error("At least one material item is required.");
      return;
    }

    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleProjectChange = (projectId) => {
    updateField("project_id", projectId);

    const projectSites = sites.filter(
      (site) => String(site.project_id) === String(projectId),
    );

    if (
      form.site_id &&
      !projectSites.some((site) => String(site.id) === String(form.site_id))
    ) {
      updateField("site_id", "");
    }
  };

  const handlePurchaseOrderChange = (purchaseOrderId) => {
    const po = purchaseOrders.find(
      (item) => String(item.id) === String(purchaseOrderId),
    );

    setForm((current) => {
      let nextItems = current.items;

      if (po?.items?.length) {
        nextItems = po.items.map((item) => ({
          ...EMPTY_ITEM,

          material_id: item.material_id || item.materialId || "",

          purchase_order_item_id: item.id || "",

          quantity: "",

          accepted_quantity: "",

          shortage_quantity: "",

          damaged_quantity: "",

          rejected_quantity: "",

          description: item.description || item.material?.name || "",

          brand: item.brand || item.material?.brand || "",

          specification:
            item.specification || item.material?.specification || "",

          unit: item.unit || item.material?.unit || "",
        }));
      }

      return {
        ...current,

        purchase_order_id: purchaseOrderId,

        vendor_id: po?.vendor_id || po?.vendorId || current.vendor_id,

        project_id: po?.project_id || po?.projectId || current.project_id,

        site_id: po?.site_id || po?.siteId || current.site_id,

        items: nextItems,
      };
    });

    setErrors({});
  };

  const handleMaterialChange = (index, materialId) => {
    const material = materials.find(
      (item) => String(item.id) === String(materialId),
    );

    setForm((current) => {
      const items = [...current.items];

      items[index] = {
        ...items[index],

        material_id: materialId,

        description:
          items[index].description ||
          material?.description ||
          material?.name ||
          "",

        brand: items[index].brand || material?.brand || "",

        specification:
          items[index].specification || material?.specification || "",

        unit: items[index].unit || material?.unit || "",
      };

      return {
        ...current,
        items,
      };
    });
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const validate = () => {
    const nextErrors = {};

    if (!form.project_id) {
      nextErrors.project_id = "Project is required.";
    }

    if (!form.challan_date) {
      nextErrors.challan_date = "Challan date is required.";
    }

    if (!form.items.length) {
      nextErrors.items = "At least one material is required.";
    }

    form.items.forEach((item, index) => {
      if (!item.material_id) {
        nextErrors[`items.${index}.material_id`] = "Material is required.";
      }

      const quantity = normalizeNumber(item.quantity);

      if (quantity <= 0) {
        nextErrors[`items.${index}.quantity`] =
          "Quantity must be greater than 0.";
      }

      const accepted = normalizeNumber(item.accepted_quantity);

      const shortage = normalizeNumber(item.shortage_quantity);

      const damaged = normalizeNumber(item.damaged_quantity);

      const rejected = normalizeNumber(item.rejected_quantity);

      if (accepted < 0) {
        nextErrors[`items.${index}.accepted_quantity`] =
          "Invalid accepted quantity.";
      }

      if (shortage < 0) {
        nextErrors[`items.${index}.shortage_quantity`] =
          "Invalid shortage quantity.";
      }

      if (damaged < 0) {
        nextErrors[`items.${index}.damaged_quantity`] =
          "Invalid damaged quantity.";
      }

      if (rejected < 0) {
        nextErrors[`items.${index}.rejected_quantity`] =
          "Invalid rejected quantity.";
      }

      const accountedFor = accepted + shortage + damaged + rejected;

      if (accountedFor > quantity + 0.0001) {
        nextErrors[`items.${index}.quantity_breakdown`] =
          "Accepted + shortage + damaged + rejected cannot exceed delivered quantity.";
      }
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstError = Object.values(nextErrors)[0];

      toast.error(firstError);

      return false;
    }

    return true;
  };

  // ============================================================
  // PAYLOAD
  // ============================================================

  const buildPayload = () => {
    return {
      project_id: form.project_id,

      ...(form.site_id
        ? {
            site_id: form.site_id,
          }
        : {}),

      ...(form.purchase_order_id
        ? {
            purchase_order_id: form.purchase_order_id,
          }
        : {}),

      ...(form.vendor_id
        ? {
            vendor_id: form.vendor_id,
          }
        : {}),

      challan_date: form.challan_date,

      ...(form.site_address
        ? {
            site_address: form.site_address,
          }
        : {}),

      gate_pass_received: Boolean(form.gate_pass_received),

      material_checked: Boolean(form.material_checked),

      ...(form.general_remarks
        ? {
            general_remarks: form.general_remarks,
          }
        : {}),

      ...(form.discrepancy_notes
        ? {
            discrepancy_notes: form.discrepancy_notes,
          }
        : {}),

      ...(form.attachment_url
        ? {
            attachment_url: form.attachment_url,
          }
        : {}),

      items: form.items.map((item) => ({
        material_id: item.material_id,

        ...(item.purchase_order_item_id
          ? {
              purchase_order_item_id: item.purchase_order_item_id,
            }
          : {}),

        quantity: normalizeNumber(item.quantity),

        accepted_quantity: normalizeNumber(item.accepted_quantity),

        shortage_quantity: normalizeNumber(item.shortage_quantity),

        damaged_quantity: normalizeNumber(item.damaged_quantity),

        rejected_quantity: normalizeNumber(item.rejected_quantity),

        condition_status: item.condition_status || "GOOD",

        ...(item.condition_notes
          ? {
              condition_notes: item.condition_notes,
            }
          : {}),

        ...(item.stored_at
          ? {
              stored_at: item.stored_at,
            }
          : {}),

        ...(item.description
          ? {
              description: item.description,
            }
          : {}),

        ...(item.brand
          ? {
              brand: item.brand,
            }
          : {}),

        ...(item.specification
          ? {
              specification: item.specification,
            }
          : {}),

        ...(item.unit
          ? {
              unit: item.unit,
            }
          : {}),

        ...(item.remarks
          ? {
              remarks: item.remarks,
            }
          : {}),
      })),
    };
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!validate()) {
      return;
    }

    try {
      const payload = buildPayload();

      let response;

      if (isEditMode) {
        response = await updateDeliveryChallan({
          id: initialData.id,
          ...payload,
        }).unwrap();
      } else {
        response = await createDeliveryChallan(payload).unwrap();
      }

      toast.success(
        isEditMode
          ? "Delivery challan updated successfully."
          : "Delivery challan created successfully.",
      );

      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      const message =
        error?.data?.message ||
        error?.error ||
        "Unable to save delivery challan.";

      toast.error(Array.isArray(message) ? message.join(", ") : message);
    }
  };

  // ============================================================
  // INPUT COMPONENTS
  // ============================================================

  const inputClass = (hasError = false) =>
    `w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition
    placeholder:text-slate-400
    focus:ring-2
    ${
      hasError
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-slate-200 focus:border-[#1F453B] focus:ring-[#D8E0DA]"
    }`;

  const selectClass = (hasError = false) =>
    `w-full appearance-none rounded-xl border bg-white px-3 py-2.5 pr-9 text-sm text-slate-900 outline-none transition
    focus:ring-2
    ${
      hasError
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-slate-200 focus:border-[#1F453B] focus:ring-[#D8E0DA]"
    }`;

  const labelClass =
    "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500";

  const getError = (key) => errors[key];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-slate-50">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1F453B] text-white">
              <Truck size={20} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-slate-900">
                {isEditMode ? "Edit Delivery Challan" : "New Delivery Challan"}
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Record incoming material delivery and receiving details
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="hidden rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:block"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-[#1F453B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#16372f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}

              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Update Challan"
                  : "Save Challan"}
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          CONTENT
      ======================================================= */}

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {/* ==================================================
                BASIC DETAILS
            =================================================== */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D8E0DA] text-[#1F453B]">
                  <FileText size={18} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">Challan Details</h2>

                  <p className="text-xs text-slate-500">
                    Project, site, vendor and delivery reference
                  </p>
                </div>
              </div>

              <div className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-3">
                {/* Project */}

                <div>
                  <label className={labelClass}>
                    Project <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <select
                      value={form.project_id}
                      onChange={(event) =>
                        handleProjectChange(event.target.value)
                      }
                      className={selectClass(getError("project_id"))}
                    >
                      <option value="">Select project</option>

                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name ||
                            project.project_name ||
                            project.code ||
                            project.id}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>

                  {getError("project_id") && (
                    <p className="mt-1 text-xs text-red-500">
                      {getError("project_id")}
                    </p>
                  )}
                </div>

                {/* Site */}

                <div>
                  <label className={labelClass}>Site</label>

                  <div className="relative">
                    <select
                      value={form.site_id}
                      onChange={(event) =>
                        updateField("site_id", event.target.value)
                      }
                      className={selectClass()}
                    >
                      <option value="">Select site</option>

                      {availableSites.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.name || site.site_name || site.id}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* Purchase Order */}

                <div>
                  <label className={labelClass}>Purchase Order</label>

                  <div className="relative">
                    <select
                      value={form.purchase_order_id}
                      onChange={(event) =>
                        handlePurchaseOrderChange(event.target.value)
                      }
                      className={selectClass()}
                    >
                      <option value="">Select purchase order</option>

                      {purchaseOrders.map((po) => (
                        <option key={po.id} value={po.id}>
                          {po.po_number || po.poNumber || po.number || po.id}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* Vendor */}

                <div>
                  <label className={labelClass}>Vendor</label>

                  <div className="relative">
                    <select
                      value={form.vendor_id}
                      onChange={(event) =>
                        updateField("vendor_id", event.target.value)
                      }
                      className={selectClass()}
                    >
                      <option value="">Select vendor</option>

                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name ||
                            vendor.agency_name ||
                            vendor.vendor_name ||
                            vendor.id}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* Challan Date */}

                <div>
                  <label className={labelClass}>
                    Challan Date <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="date"
                    value={form.challan_date}
                    onChange={(event) =>
                      updateField("challan_date", event.target.value)
                    }
                    className={inputClass(getError("challan_date"))}
                  />

                  {getError("challan_date") && (
                    <p className="mt-1 text-xs text-red-500">
                      {getError("challan_date")}
                    </p>
                  )}
                </div>

                {/* Site Address */}

                <div className="md:col-span-2 xl:col-span-1">
                  <label className={labelClass}>Delivery Address</label>

                  <input
                    type="text"
                    value={form.site_address}
                    onChange={(event) =>
                      updateField("site_address", event.target.value)
                    }
                    placeholder={
                      selectedProject
                        ? "Enter delivery/site address"
                        : "Delivery address"
                    }
                    className={inputClass()}
                  />
                </div>
              </div>
            </section>

            {/* ==================================================
                ITEMS
            =================================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D8E0DA] text-[#1F453B]">
                    <Package size={18} />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Delivered Materials
                    </h2>

                    <p className="text-xs text-slate-500">
                      Record every material received on this challan
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#1F453B] px-3 py-2 text-sm font-semibold text-[#1F453B] transition hover:bg-[#D8E0DA]"
                >
                  <Plus size={16} />
                  Add Material
                </button>
              </div>

              {/* Desktop table */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1250px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left">
                      <th className="w-10 px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        #
                      </th>

                      <th className="min-w-[210px] px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Material
                      </th>

                      <th className="min-w-[180px] px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Description
                      </th>

                      <th className="w-28 px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Qty
                      </th>

                      <th className="w-28 px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Accepted
                      </th>

                      <th className="w-28 px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Short
                      </th>

                      <th className="w-28 px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Damaged
                      </th>

                      <th className="w-28 px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Rejected
                      </th>

                      <th className="min-w-[150px] px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Condition
                      </th>

                      <th className="min-w-[160px] px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Stored At
                      </th>

                      <th className="w-12 px-3 py-3" />
                    </tr>
                  </thead>

                  <tbody>
                    {form.items.map((item, index) => {
                      const material = materials.find(
                        (materialItem) =>
                          String(materialItem.id) === String(item.material_id),
                      );

                      const itemError = getError(`items.${index}.material_id`);

                      const quantityError = getError(`items.${index}.quantity`);

                      const breakdownError = getError(
                        `items.${index}.quantity_breakdown`,
                      );

                      return (
                        <React.Fragment key={index}>
                          <tr className="border-b border-slate-100 align-top">
                            <td className="px-3 py-4 text-sm font-semibold text-slate-500">
                              {index + 1}
                            </td>

                            <td className="px-3 py-4">
                              <div className="relative">
                                <select
                                  value={item.material_id}
                                  onChange={(event) =>
                                    handleMaterialChange(
                                      index,
                                      event.target.value,
                                    )
                                  }
                                  className={selectClass(itemError)}
                                >
                                  <option value="">Select material</option>

                                  {materials.map((materialOption) => (
                                    <option
                                      key={materialOption.id}
                                      value={materialOption.id}
                                    >
                                      {materialOption.material_code
                                        ? `${materialOption.material_code} — `
                                        : ""}
                                      {materialOption.name ||
                                        materialOption.material_name ||
                                        materialOption.id}
                                    </option>
                                  ))}
                                </select>

                                <ChevronDown
                                  size={15}
                                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                              </div>

                              {itemError && (
                                <p className="mt-1 text-xs text-red-500">
                                  {itemError}
                                </p>
                              )}

                              {item.purchase_order_item_id && (
                                <p className="mt-1 text-[11px] text-slate-400">
                                  Linked to PO item
                                </p>
                              )}
                            </td>

                            <td className="px-3 py-4">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "description",
                                    event.target.value,
                                  )
                                }
                                placeholder={
                                  material?.description || "Description"
                                }
                                className={inputClass()}
                              />
                            </td>

                            <td className="px-3 py-4">
                              <input
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={item.quantity}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "quantity",
                                    event.target.value,
                                  )
                                }
                                placeholder="0.000"
                                className={inputClass(quantityError)}
                              />

                              {item.unit && (
                                <span className="mt-1 block text-[11px] text-slate-400">
                                  {item.unit}
                                </span>
                              )}

                              {quantityError && (
                                <p className="mt-1 text-xs text-red-500">
                                  {quantityError}
                                </p>
                              )}
                            </td>

                            <td className="px-3 py-4">
                              <input
                                type="number"
                                min="0"
                                step="0.001"
                                value={item.accepted_quantity}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "accepted_quantity",
                                    event.target.value,
                                  )
                                }
                                placeholder="0.000"
                                className={inputClass()}
                              />
                            </td>

                            <td className="px-3 py-4">
                              <input
                                type="number"
                                min="0"
                                step="0.001"
                                value={item.shortage_quantity}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "shortage_quantity",
                                    event.target.value,
                                  )
                                }
                                placeholder="0.000"
                                className={inputClass()}
                              />
                            </td>

                            <td className="px-3 py-4">
                              <input
                                type="number"
                                min="0"
                                step="0.001"
                                value={item.damaged_quantity}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "damaged_quantity",
                                    event.target.value,
                                  )
                                }
                                placeholder="0.000"
                                className={inputClass()}
                              />
                            </td>

                            <td className="px-3 py-4">
                              <input
                                type="number"
                                min="0"
                                step="0.001"
                                value={item.rejected_quantity}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "rejected_quantity",
                                    event.target.value,
                                  )
                                }
                                placeholder="0.000"
                                className={inputClass()}
                              />
                            </td>

                            <td className="px-3 py-4">
                              <div className="relative">
                                <select
                                  value={item.condition_status}
                                  onChange={(event) =>
                                    updateItem(
                                      index,
                                      "condition_status",
                                      event.target.value,
                                    )
                                  }
                                  className={selectClass()}
                                >
                                  {CONDITION_OPTIONS.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </select>

                                <ChevronDown
                                  size={15}
                                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                              </div>
                            </td>

                            <td className="px-3 py-4">
                              <input
                                type="text"
                                value={item.stored_at}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "stored_at",
                                    event.target.value,
                                  )
                                }
                                placeholder="Warehouse / room / location"
                                className={inputClass()}
                              />
                            </td>

                            <td className="px-3 py-4 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                title="Remove item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>

                          {(breakdownError ||
                            item.condition_notes ||
                            item.specification ||
                            item.brand ||
                            item.remarks) && (
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                              <td colSpan={11} className="px-6 py-3">
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                  <input
                                    type="text"
                                    value={item.brand}
                                    onChange={(event) =>
                                      updateItem(
                                        index,
                                        "brand",
                                        event.target.value,
                                      )
                                    }
                                    placeholder="Brand"
                                    className={inputClass()}
                                  />

                                  <input
                                    type="text"
                                    value={item.specification}
                                    onChange={(event) =>
                                      updateItem(
                                        index,
                                        "specification",
                                        event.target.value,
                                      )
                                    }
                                    placeholder="Specification"
                                    className={inputClass()}
                                  />

                                  <input
                                    type="text"
                                    value={item.unit}
                                    onChange={(event) =>
                                      updateItem(
                                        index,
                                        "unit",
                                        event.target.value,
                                      )
                                    }
                                    placeholder="Unit"
                                    className={inputClass()}
                                  />

                                  <input
                                    type="text"
                                    value={item.condition_notes}
                                    onChange={(event) =>
                                      updateItem(
                                        index,
                                        "condition_notes",
                                        event.target.value,
                                      )
                                    }
                                    placeholder="Condition notes"
                                    className={inputClass()}
                                  />

                                  <input
                                    type="text"
                                    value={item.remarks}
                                    onChange={(event) =>
                                      updateItem(
                                        index,
                                        "remarks",
                                        event.target.value,
                                      )
                                    }
                                    placeholder="Item remarks"
                                    className={`${inputClass()} md:col-span-2`}
                                  />

                                  {breakdownError && (
                                    <p className="text-xs font-medium text-red-500 md:col-span-2 xl:col-span-4">
                                      {breakdownError}
                                    </p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile / tablet cards */}

              <div className="space-y-4 p-4 lg:hidden">
                {form.items.map((item, index) => {
                  const materialError = getError(`items.${index}.material_id`);

                  const quantityError = getError(`items.${index}.quantity`);

                  const breakdownError = getError(
                    `items.${index}.quantity_breakdown`,
                  );

                  return (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1F453B] text-xs font-bold text-white">
                            {index + 1}
                          </span>

                          <span className="text-sm font-bold text-slate-800">
                            Material Item
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className={labelClass}>
                            Material <span className="text-red-500">*</span>
                          </label>

                          <div className="relative">
                            <select
                              value={item.material_id}
                              onChange={(event) =>
                                handleMaterialChange(index, event.target.value)
                              }
                              className={selectClass(materialError)}
                            >
                              <option value="">Select material</option>

                              {materials.map((material) => (
                                <option key={material.id} value={material.id}>
                                  {material.material_code
                                    ? `${material.material_code} — `
                                    : ""}
                                  {material.name ||
                                    material.material_name ||
                                    material.id}
                                </option>
                              ))}
                            </select>

                            <ChevronDown
                              size={15}
                              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                          </div>

                          {materialError && (
                            <p className="mt-1 text-xs text-red-500">
                              {materialError}
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label className={labelClass}>Description</label>

                          <input
                            type="text"
                            value={item.description}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "description",
                                event.target.value,
                              )
                            }
                            className={inputClass()}
                            placeholder="Material description"
                          />
                        </div>

                        <div>
                          <label className={labelClass}>
                            Quantity <span className="text-red-500">*</span>
                          </label>

                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(index, "quantity", event.target.value)
                            }
                            className={inputClass(quantityError)}
                            placeholder="0.000"
                          />

                          {quantityError && (
                            <p className="mt-1 text-xs text-red-500">
                              {quantityError}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className={labelClass}>Unit</label>

                          <input
                            type="text"
                            value={item.unit}
                            onChange={(event) =>
                              updateItem(index, "unit", event.target.value)
                            }
                            className={inputClass()}
                            placeholder="Nos / Kg / Sqft"
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Accepted</label>

                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={item.accepted_quantity}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "accepted_quantity",
                                event.target.value,
                              )
                            }
                            className={inputClass()}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Shortage</label>

                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={item.shortage_quantity}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "shortage_quantity",
                                event.target.value,
                              )
                            }
                            className={inputClass()}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Damaged</label>

                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={item.damaged_quantity}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "damaged_quantity",
                                event.target.value,
                              )
                            }
                            className={inputClass()}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Rejected</label>

                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={item.rejected_quantity}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "rejected_quantity",
                                event.target.value,
                              )
                            }
                            className={inputClass()}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Condition</label>

                          <div className="relative">
                            <select
                              value={item.condition_status}
                              onChange={(event) =>
                                updateItem(
                                  index,
                                  "condition_status",
                                  event.target.value,
                                )
                              }
                              className={selectClass()}
                            >
                              {CONDITION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>

                            <ChevronDown
                              size={15}
                              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className={labelClass}>Stored At</label>

                          <input
                            type="text"
                            value={item.stored_at}
                            onChange={(event) =>
                              updateItem(index, "stored_at", event.target.value)
                            }
                            className={inputClass()}
                            placeholder="Storage location"
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Brand</label>

                          <input
                            type="text"
                            value={item.brand}
                            onChange={(event) =>
                              updateItem(index, "brand", event.target.value)
                            }
                            className={inputClass()}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Specification</label>

                          <input
                            type="text"
                            value={item.specification}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "specification",
                                event.target.value,
                              )
                            }
                            className={inputClass()}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className={labelClass}>Condition Notes</label>

                          <input
                            type="text"
                            value={item.condition_notes}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "condition_notes",
                                event.target.value,
                              )
                            }
                            className={inputClass()}
                            placeholder="Describe condition/discrepancy"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className={labelClass}>Item Remarks</label>

                          <textarea
                            rows={2}
                            value={item.remarks}
                            onChange={(event) =>
                              updateItem(index, "remarks", event.target.value)
                            }
                            className={`${inputClass()} resize-none`}
                          />
                        </div>

                        {breakdownError && (
                          <p className="text-xs font-medium text-red-500 sm:col-span-2">
                            {breakdownError}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Items footer */}

              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 text-sm font-semibold text-[#1F453B]"
                >
                  <Plus size={16} />
                  Add another material
                </button>

                <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
                  <SummaryPill label="Delivered" value={totals.quantity} />

                  <SummaryPill label="Accepted" value={totals.accepted} />

                  <SummaryPill label="Short" value={totals.shortage} />

                  <SummaryPill label="Damaged" value={totals.damaged} />

                  <SummaryPill label="Rejected" value={totals.rejected} />
                </div>
              </div>
            </section>

            {/* ==================================================
                VERIFICATION
            =================================================== */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D8E0DA] text-[#1F453B]">
                  <Check size={18} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Receiving Verification
                  </h2>

                  <p className="text-xs text-slate-500">
                    Confirm gate-pass and material inspection
                  </p>
                </div>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2">
                <ToggleCard
                  checked={form.gate_pass_received}
                  onChange={(value) => updateField("gate_pass_received", value)}
                  title="Gate Pass Received"
                  description="Gate/security documentation has been received."
                />

                <ToggleCard
                  checked={form.material_checked}
                  onChange={(value) => updateField("material_checked", value)}
                  title="Material Checked"
                  description="Delivered materials have been physically checked."
                />
              </div>
            </section>

            {/* ==================================================
                REMARKS
            =================================================== */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-bold text-slate-900">
                  Remarks & Documentation
                </h2>

                <p className="text-xs text-slate-500">
                  Add receiving notes, discrepancies and supporting documents
                </p>
              </div>

              <div className="grid gap-5 p-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>General Remarks</label>

                  <textarea
                    rows={4}
                    value={form.general_remarks}
                    onChange={(event) =>
                      updateField("general_remarks", event.target.value)
                    }
                    placeholder="General notes about this delivery..."
                    className={`${inputClass()} resize-none`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Discrepancy Notes</label>

                  <textarea
                    rows={4}
                    value={form.discrepancy_notes}
                    onChange={(event) =>
                      updateField("discrepancy_notes", event.target.value)
                    }
                    placeholder="Record shortages, damages, rejected items or other discrepancies..."
                    className={`${inputClass()} resize-none`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Attachment URL</label>

                  <input
                    type="url"
                    value={form.attachment_url}
                    onChange={(event) =>
                      updateField("attachment_url", event.target.value)
                    }
                    placeholder="https://..."
                    className={inputClass()}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* ====================================================
              SIDEBAR
          ===================================================== */}

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            {/* PO Summary */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D8E0DA] text-[#1F453B]">
                  <ClipboardList size={18} />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">Delivery Summary</h3>

                  <p className="text-xs text-slate-500">
                    Current challan overview
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <InfoRow
                  label="Project"
                  value={
                    selectedProject?.name ||
                    selectedProject?.project_name ||
                    form.project_id ||
                    "Not selected"
                  }
                />

                <InfoRow
                  label="Purchase Order"
                  value={
                    selectedPurchaseOrder?.po_number ||
                    selectedPurchaseOrder?.poNumber ||
                    "Not linked"
                  }
                />

                <InfoRow
                  label="Vendor"
                  value={
                    selectedVendor?.name ||
                    selectedVendor?.agency_name ||
                    "Not selected"
                  }
                />

                <InfoRow
                  label="Date"
                  value={form.challan_date || "Not selected"}
                />
              </div>
            </section>

            {/* Quantity Summary */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-bold text-slate-900">
                Quantity Summary
              </h3>

              <div className="space-y-3">
                <MetricRow label="Total Delivered" value={totals.quantity} />

                <MetricRow label="Accepted" value={totals.accepted} />

                <MetricRow label="Shortage" value={totals.shortage} />

                <MetricRow label="Damaged" value={totals.damaged} />

                <MetricRow label="Rejected" value={totals.rejected} />
              </div>
            </section>

            {/* Status */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 font-bold text-slate-900">Verification</h3>

              <div className="space-y-2">
                <StatusRow
                  checked={form.gate_pass_received}
                  label="Gate pass received"
                />

                <StatusRow
                  checked={form.material_checked}
                  label="Material checked"
                />
              </div>
            </section>

            {/* Mobile cancel */}

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 sm:hidden"
              >
                <X size={17} />
                Cancel
              </button>
            )}
          </aside>
        </div>
      </div>
    </form>
  );
}

// ============================================================
// SMALL COMPONENTS
// ============================================================

function SummaryPill({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="text-sm font-bold text-slate-900">
        {Number(value || 0).toFixed(3)}
      </div>

      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-xs font-medium text-slate-500">{label}</span>

      <span className="max-w-[180px] truncate text-right text-xs font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>

      <span className="text-sm font-bold text-slate-900">
        {Number(value || 0).toFixed(3)}
      </span>
    </div>
  );
}

function StatusRow({ checked, label }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full ${
          checked ? "bg-[#1F453B] text-white" : "bg-slate-100 text-slate-300"
        }`}
      >
        {checked && <Check size={12} />}
      </span>

      <span className="text-sm text-slate-600">{label}</span>
    </div>
  );
}

function ToggleCard({ checked, onChange, title, description }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${
        checked
          ? "border-[#1F453B]/30 bg-[#D8E0DA]/40"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="min-w-0">
        <div className="text-sm font-bold text-slate-900">{title}</div>

        <div className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </div>
      </div>

      <span
        className={`relative flex h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-[#1F453B]" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}
