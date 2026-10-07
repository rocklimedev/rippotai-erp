import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from 'react-router-dom';
import { useSharedProjectData } from '../hooks/use-shared-project-data';
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronsUpDown,
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

import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Page,
  PageHeader,
  Button,
  Field,
  TextInput,
  SelectInput,
  TextArea,
  FormActions,
  ChoiceGroup,
} from "@/components/inos";
import {
  DocSection,
  DocLayout,
  Grid,
  LineTable,
  RemoveRow,
  AddRow,
  TotalsCard,
  Callout,
  Check as CheckBox,
} from "@/components/forms/commerce-form-ui";

import {
  useCreateDeliveryChallanMutation,
  useUpdateDeliveryChallanMutation,
} from "../api/procuerment/delivery-challan.api";

/* ------------------------------------------------------------------
 * Brand
 * ------------------------------------------------------------------ */

const NONE = "__none__";

/* ------------------------------------------------------------------
 * Empty structures
 * ------------------------------------------------------------------ */

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
  { value: "GOOD", label: "Good" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "SHORT", label: "Short" },
  { value: "DAMAGED_AND_SHORT", label: "Damaged & Short" },
  { value: "REJECTED", label: "Rejected" },
];

function normalizeNumber(value) {
  if (value === "" || value === null || value === undefined) return 0;

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function toStringValue(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function getId(item) {
  return item?.id ?? "";
}

/**
 * Safely turn any value (string, number, or relation object) into a
 * display string. Prevents "Objects are not valid as a React child"
 * when material.unit / brand / etc. come back as full entities.
 */
function getDisplayString(value, fallback = "") {
  if (value == null || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "object") {
    return (
      value.name ||
      value.code ||
      value.unit ||
      value.symbol ||
      value.label ||
      value.material_name ||
      fallback
    );
  }
  return fallback;
}

function normalizeUnit(unit) {
  return getDisplayString(unit);
}

/* ------------------------------------------------------------------
 * Existing challan mapping
 * ------------------------------------------------------------------ */

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

    condition_notes: getDisplayString(item?.condition_notes),

    stored_at: getDisplayString(item?.stored_at),

    description: getDisplayString(item?.description),

    brand: getDisplayString(item?.brand),

    specification: getDisplayString(item?.specification),

    unit: normalizeUnit(item?.unit),

    remarks: getDisplayString(item?.remarks),
  };
}

function buildInitialForm(initialData) {
  if (!initialData) {
    return {
      ...EMPTY_FORM,
      items: [{ ...EMPTY_ITEM }],
    };
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

/* ------------------------------------------------------------------
 * PO item → Delivery Challan item
 *
 * IMPORTANT:
 * Your PO response looks like:
 *
 * {
 *   ordered_quantity: "1.000",
 *   pending_quantity: "1.000",
 *   material: {...}
 * }
 *
 * Therefore pending_quantity becomes the default quantity
 * to receive.
 * ------------------------------------------------------------------ */

function mapPurchaseOrderItem(item) {
  const material = item?.material || {};

  const pendingQuantity =
    item?.pending_quantity !== undefined && item?.pending_quantity !== null
      ? normalizeNumber(item.pending_quantity)
      : normalizeNumber(item?.ordered_quantity);

  const materialId =
    item?.material_id || item?.materialId || material?.id || "";

  return {
    ...EMPTY_ITEM,

    material_id: materialId,

    purchase_order_item_id: item?.id || "",

    /*
     * Default received quantity to PO pending quantity.
     *
     * Example:
     * ordered_quantity = 1
     * received_quantity = 0
     * pending_quantity = 1
     *
     * → quantity = 1
     */
    quantity: pendingQuantity > 0 ? pendingQuantity.toFixed(3) : "",

    /*
     * Do NOT mark it accepted automatically.
     * User confirms acceptance after physical inspection.
     */
    accepted_quantity: "",

    shortage_quantity: "",

    damaged_quantity: "",

    rejected_quantity: "",

    condition_status: "GOOD",

    condition_notes: "",

    stored_at: "",

    description:
      getDisplayString(item?.description) ||
      getDisplayString(material?.description) ||
      getDisplayString(material?.name) ||
      getDisplayString(material?.material_name) ||
      "",

    brand:
      getDisplayString(item?.brand) || getDisplayString(material?.brand) || "",

    specification:
      getDisplayString(item?.specification) ||
      getDisplayString(material?.specification) ||
      "",

    unit: normalizeUnit(item?.unit) || normalizeUnit(material?.unit) || "",

    remarks: "",
  };
}

/* ------------------------------------------------------------------
 * UI helpers
 * ------------------------------------------------------------------ */

function FieldError({ message }) {
  if (!message) return null;

  return (
    <span className="inos-error" style={{ display: "block", marginTop: 4 }}>
      {message}
    </span>
  );
}

const qty = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

/* ------------------------------------------------------------------
 * Combobox
 * ------------------------------------------------------------------ */

function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select",
  searchPlaceholder = "Search...",
  emptyText = "No results.",
  invalid,
  id,
}) {
  const [open, setOpen] = useState(false);

  const selected = options.find(
    (option) => String(option.value) === String(value),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          className="cf-combo"
          style={{ minHeight: 40, borderRadius: 10, fontSize: "var(--fs-body)", ...(invalid ? { borderColor: "var(--bad-dot)" } : null) }}
        >
          <span className={cn("truncate", !selected && "cf-combo__placeholder")}>
            {selected ? selected.label : placeholder}
          </span>

          <ChevronsUpDown aria-hidden />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0"
      >
        <Command
          filter={(itemValue, search) =>
            itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder={searchPlaceholder} />

          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>

            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => {
                    onChange(
                      String(option.value) === String(value)
                        ? ""
                        : option.value,
                    );

                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      String(option.value) === String(value)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />

                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------
 * Main form
 * ------------------------------------------------------------------ */

export default function DeliveryChallanForm({
  initialData = null,

  projects = [],
  sites = [],
  vendors = [],
  materials = [],
  purchaseOrders = [],

  purchaseOrderItems = [],

  onSuccess,
  onCancel,
}) {
  const isEditMode = Boolean(initialData?.id);
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState(() => buildInitialForm(initialData || { project_id: searchParams.get('projectId') || searchParams.get('project_id') || '' }));
  useSharedProjectData(form.project_id, 'challan', form, setForm, !isEditMode);

  const [errors, setErrors] = useState({});

  const [createDeliveryChallan, createState] =
    useCreateDeliveryChallanMutation();

  const [updateDeliveryChallan, updateState] =
    useUpdateDeliveryChallanMutation();

  const isSubmitting = createState.isLoading || updateState.isLoading;

  /* ---------------------------------------------------------------
   * Reset form when edit data changes
   * --------------------------------------------------------------- */

  useEffect(() => {
    if (initialData) setForm(buildInitialForm(initialData));
    setErrors({});
  }, [initialData]);

  /* ---------------------------------------------------------------
   * Selected lookups
   * --------------------------------------------------------------- */

  const selectedProject = useMemo(
    () =>
      projects.find(
        (project) => String(project.id) === String(form.project_id),
      ),
    [projects, form.project_id],
  );

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

  /* ---------------------------------------------------------------
   * Sites
   * --------------------------------------------------------------- */

  const availableSites = useMemo(() => {
    if (!form.project_id) {
      return sites;
    }

    return sites.filter(
      (site) =>
        !site.project_id || String(site.project_id) === String(form.project_id),
    );
  }, [sites, form.project_id]);

  /* ---------------------------------------------------------------
   * Options
   * --------------------------------------------------------------- */

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        value: getId(project),

        label:
          getDisplayString(project.name) ||
          getDisplayString(project.project_name) ||
          getDisplayString(project.code) ||
          getId(project),
      })),
    [projects],
  );

  /*
   * Only show useful PO records.
   *
   * We do NOT remove APPROVED POs.
   * Your supplied PO is:
   *
   * status: APPROVED
   */
  const filteredPurchaseOrders = useMemo(() => {
    if (!form.project_id) {
      return purchaseOrders;
    }

    return purchaseOrders.filter(
      (po) =>
        !po.project_id || String(po.project_id) === String(form.project_id),
    );
  }, [purchaseOrders, form.project_id]);

  const purchaseOrderOptions = useMemo(
    () =>
      filteredPurchaseOrders.map((po) => ({
        value: getId(po),

        label:
          getDisplayString(po.po_number) ||
          getDisplayString(po.poNumber) ||
          getDisplayString(po.number) ||
          getId(po),
      })),
    [filteredPurchaseOrders],
  );

  const vendorOptions = useMemo(
    () =>
      vendors.map((vendor) => ({
        value: getId(vendor),

        label:
          getDisplayString(vendor.name) ||
          getDisplayString(vendor.agency_name) ||
          getDisplayString(vendor.vendor_name) ||
          getId(vendor),
      })),
    [vendors],
  );

  const materialOptions = useMemo(
    () =>
      materials.map((material) => ({
        value: getId(material),

        label: material.material_code
          ? `${getDisplayString(material.material_code)} — ${
              getDisplayString(material.name) ||
              getDisplayString(material.material_name) ||
              getId(material)
            }`
          : getDisplayString(material.name) ||
            getDisplayString(material.material_name) ||
            getId(material),
      })),
    [materials],
  );

  /* ---------------------------------------------------------------
   * Totals
   * --------------------------------------------------------------- */

  const totals = useMemo(
    () =>
      form.items.reduce(
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
      ),
    [form.items],
  );

  /* ---------------------------------------------------------------
   * Helpers
   * --------------------------------------------------------------- */

  const clearError = (key) =>
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next[key];

      return next;
    });

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    clearError(field);
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

    clearError(`items.${index}.${field}`);

    clearError(`items.${index}.quantity_breakdown`);
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
      toast.error("Keep at least one material line.");

      return;
    }

    setForm((current) => ({
      ...current,

      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  /* ---------------------------------------------------------------
   * Project change
   * --------------------------------------------------------------- */

  const handleProjectChange = (projectId) => {
    setForm((current) => ({
      ...current,

      project_id: projectId,

      /*
       * Clear site if it belongs to another project.
       */
      site_id:
        current.site_id &&
        sites.some(
          (site) =>
            String(site.id) === String(current.site_id) &&
            site.project_id &&
            String(site.project_id) !== String(projectId),
        )
          ? ""
          : current.site_id,
    }));

    clearError("project_id");
  };

  /* ---------------------------------------------------------------
   * PURCHASE ORDER CHANGE
   *
   * This is the important part.
   * --------------------------------------------------------------- */

  const handlePurchaseOrderChange = (purchaseOrderId) => {
    const po = purchaseOrders.find(
      (item) => String(item.id) === String(purchaseOrderId),
    );

    if (!po) {
      setForm((current) => ({
        ...current,

        purchase_order_id: "",

        /*
         * Do not destroy manually entered lines
         * when PO is cleared.
         */
      }));

      return;
    }

    /*
     * PO items can come directly from:
     *
     * po.items
     *
     * or, if the API ever supplies them separately,
     * purchaseOrderItems.
     */
    const poItems =
      Array.isArray(po.items) && po.items.length > 0
        ? po.items
        : purchaseOrderItems.filter(
            (item) =>
              String(item.purchase_order_id || item.purchaseOrderId) ===
              String(po.id),
          );

    const mappedItems =
      poItems.length > 0 ? poItems.map(mapPurchaseOrderItem) : [];

    setForm((current) => ({
      ...current,

      purchase_order_id: purchaseOrderId,

      /*
       * PO is the source of truth.
       */
      vendor_id: po.vendor_id || po.vendorId || current.vendor_id || "",

      project_id: po.project_id || po.projectId || current.project_id || "",

      site_id: po.site_id || po.siteId || current.site_id || "",

      /*
       * Use PO shipping address when available.
       */
      site_address:
        po.ship_to_address || po.shipToAddress || current.site_address || "",

      /*
       * Populate all PO material lines.
       */
      items: mappedItems.length > 0 ? mappedItems : current.items,
    }));

    setErrors({});

    if (mappedItems.length > 0) {
      toast.success(
        `${mappedItems.length} material ${
          mappedItems.length === 1 ? "line" : "lines"
        } loaded from ${po.po_number || "purchase order"}.`,
      );
    } else {
      toast.warning("Purchase order selected, but it has no material items.");
    }
  };

  /* ---------------------------------------------------------------
   * Material change
   * --------------------------------------------------------------- */

  const handleMaterialChange = (index, materialId) => {
    const material = materials.find(
      (item) => String(item.id) === String(materialId),
    );

    setForm((current) => {
      const items = [...current.items];

      const existingItem = items[index];

      items[index] = {
        ...existingItem,

        material_id: materialId,

        description:
          existingItem.description ||
          getDisplayString(material?.description) ||
          getDisplayString(material?.name) ||
          getDisplayString(material?.material_name) ||
          "",

        brand: existingItem.brand || getDisplayString(material?.brand) || "",

        specification:
          existingItem.specification ||
          getDisplayString(material?.specification) ||
          "",

        unit: existingItem.unit || normalizeUnit(material?.unit) || "",
      };

      return {
        ...current,
        items,
      };
    });

    clearError(`items.${index}.material_id`);
  };

  /* ---------------------------------------------------------------
   * Validation
   * --------------------------------------------------------------- */

  const validate = () => {
    const nextErrors = {};

    if (!form.project_id) {
      nextErrors.project_id = "Pick a project.";
    }

    if (!form.challan_date) {
      nextErrors.challan_date = "Pick a challan date.";
    }

    if (!form.items.length) {
      nextErrors.items = "Add at least one material.";
    }

    form.items.forEach((item, index) => {
      if (!item.material_id) {
        nextErrors[`items.${index}.material_id`] = "Pick a material.";
      }

      const quantity = normalizeNumber(item.quantity);

      if (quantity <= 0) {
        nextErrors[`items.${index}.quantity`] = "Quantity must be above 0.";
      }

      const accepted = normalizeNumber(item.accepted_quantity);

      const shortage = normalizeNumber(item.shortage_quantity);

      const damaged = normalizeNumber(item.damaged_quantity);

      const rejected = normalizeNumber(item.rejected_quantity);

      if (accepted < 0) {
        nextErrors[`items.${index}.accepted_quantity`] = "Can't be negative.";
      }

      if (shortage < 0) {
        nextErrors[`items.${index}.shortage_quantity`] = "Can't be negative.";
      }

      if (damaged < 0) {
        nextErrors[`items.${index}.damaged_quantity`] = "Can't be negative.";
      }

      if (rejected < 0) {
        nextErrors[`items.${index}.rejected_quantity`] = "Can't be negative.";
      }

      const accountedFor = accepted + shortage + damaged + rejected;

      if (accountedFor > quantity + 0.0001) {
        nextErrors[`items.${index}.quantity_breakdown`] =
          "Accepted + shortage + damaged + rejected can't exceed the delivered quantity.";
      }
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error(Object.values(nextErrors)[0]);

      return false;
    }

    return true;
  };

  /* ---------------------------------------------------------------
   * Payload
   * --------------------------------------------------------------- */

  const buildPayload = () => ({
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
  });

  /* ---------------------------------------------------------------
   * Submit
   * --------------------------------------------------------------- */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (!validate()) return;

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
        isEditMode ? "Delivery challan updated." : "Delivery challan created.",
      );

      onSuccess?.(response);
    } catch (error) {
      const message =
        error?.data?.message ||
        error?.error ||
        "The delivery challan could not be saved.";

      toast.error(Array.isArray(message) ? message.join(", ") : message);
    }
  };

  const getError = (key) => errors[key];

  const itemErrorCount = Object.keys(errors).filter((key) =>
    key.startsWith("items."),
  ).length;

  /* ---------------------------------------------------------------
   * Render
   * --------------------------------------------------------------- */

  const projectLabel =
    getDisplayString(selectedProject?.name) ||
    getDisplayString(selectedProject?.project_name) ||
    "";

  const vendorLabel =
    getDisplayString(selectedPurchaseOrder?.agency_name) ||
    getDisplayString(selectedVendor?.name) ||
    getDisplayString(selectedVendor?.agency_name) ||
    "";

  const accountedTotal =
    totals.accepted + totals.shortage + totals.damaged + totals.rejected;

  return (
    <Page>
      <PageHeader
        crumbs={[
          { label: "Procurement", to: "/procurement" },
          { label: "Delivery challans", to: "/procurement/delivery-challans" },
          { label: isEditMode ? "Edit" : "New" },
        ]}
        title={isEditMode ? "Edit delivery challan" : "New delivery challan"}
        subtitle="Record what arrived on site — link a purchase order to load its lines automatically."
        actions={
          onCancel && (
            <Button variant="ghost" icon={ArrowLeft} onClick={onCancel} disabled={isSubmitting}>
              Back to list
            </Button>
          )
        }
      />

      <form onSubmit={handleSubmit} className="inos-form" noValidate>
          {/* 1 — Challan details */}
          <DocSection
            step={1}
            title="Challan details"
            description="Start with the purchase order — project, vendor and lines fill in from it."
          >
            <Grid cols={2}>
              <Field
                label="Purchase order"
                optional
                full
                hint={
                  selectedPurchaseOrder
                    ? `${getDisplayString(selectedPurchaseOrder.status) || "—"} · PO date ${getDisplayString(selectedPurchaseOrder.po_date) || "—"}`
                    : purchaseOrderOptions.length
                      ? "Selecting a PO loads its pending material lines."
                      : "No purchase orders yet — add lines manually below."
                }
              >
                <Combobox
                  options={purchaseOrderOptions}
                  value={form.purchase_order_id}
                  onChange={handlePurchaseOrderChange}
                  placeholder="Search purchase orders"
                  searchPlaceholder="PO number…"
                  emptyText="No purchase orders found."
                />
              </Field>

              <Field label="Project" required error={getError("project_id")}>
                <Combobox
                  options={projectOptions}
                  value={form.project_id}
                  onChange={handleProjectChange}
                  invalid={Boolean(getError("project_id"))}
                  placeholder="Select project"
                  searchPlaceholder="Search projects…"
                  emptyText="No projects found."
                />
              </Field>

              <Field label="Vendor" optional>
                <Combobox
                  options={vendorOptions}
                  value={form.vendor_id}
                  onChange={(value) => updateField("vendor_id", value)}
                  placeholder="Select vendor"
                  searchPlaceholder="Search vendors…"
                  emptyText="No vendors found."
                />
              </Field>

              <Field label="Challan date" htmlFor="challan_date" required error={getError("challan_date")}>
                <TextInput
                  id="challan_date"
                  type="date"
                  value={form.challan_date}
                  onChange={(event) => updateField("challan_date", event.target.value)}
                  invalid={Boolean(getError("challan_date"))}
                />
              </Field>

              <Field label="Site" optional htmlFor="dc-site">
                <SelectInput
                  id="dc-site"
                  value={form.site_id || ""}
                  onChange={(event) => updateField("site_id", event.target.value)}
                  placeholder={availableSites.length ? "No site" : "No sites set up"}
                  disabled={!availableSites.length}
                >
                  {availableSites.map((site) => (
                    <option key={site.id} value={String(site.id)}>
                      {getDisplayString(site.name) || getDisplayString(site.site_name) || site.id}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field label="Delivery address" optional full htmlFor="site_address">
                <TextInput
                  id="site_address"
                  value={form.site_address}
                  onChange={(event) => updateField("site_address", event.target.value)}
                  placeholder="e.g. Plot 14, Sector 44, Gurugram — site gate 2"
                />
              </Field>
            </Grid>
          </DocSection>

          {/* 2 — Delivered materials */}
          <DocSection
            step={2}
            flush
            title="Delivered materials"
            description="Enter what arrived, then split it into accepted, short, damaged and rejected."
            actions={
              <Button variant="secondary" size="sm" icon={Plus} onClick={addItem}>
                Add item
              </Button>
            }
            footer={
              <>
                <AddRow onClick={addItem}>Add item</AddRow>
                <span className="inos-hint tabular">
                  {form.items.length} {form.items.length === 1 ? "line" : "lines"} · Delivered{" "}
                  <strong style={{ color: "var(--text)" }}>{qty(totals.quantity)}</strong>
                </span>
              </>
            }
          >
            <LineTable minWidth={1120}>
              <thead>
                <tr>
                  <th>#</th>
                  <th style={{ minWidth: 220 }}>Material</th>
                  <th style={{ minWidth: 160 }}>Description</th>
                  <th className="num" style={{ width: 100 }}>Delivered</th>
                  <th className="num" style={{ width: 92 }}>Accepted</th>
                  <th className="num" style={{ width: 92 }}>Short</th>
                  <th className="num" style={{ width: 92 }}>Damaged</th>
                  <th className="num" style={{ width: 92 }}>Rejected</th>
                  <th style={{ width: 150 }}>Condition</th>
                  <th style={{ minWidth: 130 }}>Stored at</th>
                  <th className="actions" aria-label="Row actions" />
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, index) => {
                  const materialError = getError(`items.${index}.material_id`);
                  const quantityError = getError(`items.${index}.quantity`);
                  const breakdownError = getError(`items.${index}.quantity_breakdown`);
                  const numCell = (field, placeholder = "0") => (
                    <td className="num">
                      <TextInput
                        type="number"
                        min="0"
                        step="0.001"
                        inputMode="decimal"
                        value={item[field]}
                        onChange={(event) => updateItem(index, field, event.target.value)}
                        placeholder={placeholder}
                        invalid={Boolean(getError(`items.${index}.${field}`) || breakdownError)}
                        aria-label={`${field.replace(/_/g, " ")} line ${index + 1}`}
                      />
                    </td>
                  );

                  return (
                    <React.Fragment key={item.purchase_order_item_id || `${item.material_id}-${index}`}>
                      <tr>
                        <td className="cf-idx">{index + 1}</td>
                        <td>
                          <Combobox
                            options={materialOptions}
                            value={item.material_id}
                            onChange={(value) => handleMaterialChange(index, value)}
                            invalid={Boolean(materialError)}
                            placeholder="Search materials"
                            searchPlaceholder="Name or code…"
                            emptyText="No materials found."
                          />
                          <FieldError message={materialError} />
                          {item.purchase_order_item_id && <div className="cf-sub">Linked to PO line</div>}
                        </td>
                        <td>
                          <TextInput
                            value={item.description}
                            onChange={(event) => updateItem(index, "description", event.target.value)}
                            placeholder="e.g. 20mm aggregate"
                          />
                        </td>
                        <td className="num">
                          <TextInput
                            type="number"
                            min="0.001"
                            step="0.001"
                            inputMode="decimal"
                            value={item.quantity}
                            onChange={(event) => updateItem(index, "quantity", event.target.value)}
                            placeholder="0"
                            invalid={Boolean(quantityError)}
                            aria-label={`Delivered quantity line ${index + 1}`}
                          />
                          {item.unit && <div className="cf-sub" style={{ textAlign: "right" }}>{item.unit}</div>}
                          <FieldError message={quantityError} />
                        </td>
                        {numCell("accepted_quantity")}
                        {numCell("shortage_quantity")}
                        {numCell("damaged_quantity")}
                        {numCell("rejected_quantity")}
                        <td>
                          <SelectInput
                            value={item.condition_status}
                            onChange={(event) => updateItem(index, "condition_status", event.target.value)}
                            aria-label={`Condition line ${index + 1}`}
                          >
                            {CONDITION_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </SelectInput>
                        </td>
                        <td>
                          <TextInput
                            value={item.stored_at}
                            onChange={(event) => updateItem(index, "stored_at", event.target.value)}
                            placeholder="e.g. Store room B"
                          />
                        </td>
                        <td className="actions">
                          <RemoveRow onClick={() => removeItem(index)} label={`Remove line ${index + 1}`} />
                        </td>
                      </tr>
                      <tr className="cf-subrow">
                        <td />
                        <td colSpan={10} style={{ paddingTop: 0 }}>
                          <div className="cf-subrow__grid">
                            <TextInput
                              value={item.brand}
                              onChange={(event) => updateItem(index, "brand", event.target.value)}
                              placeholder="Brand"
                              aria-label="Brand"
                            />
                            <TextInput
                              value={item.specification}
                              onChange={(event) => updateItem(index, "specification", event.target.value)}
                              placeholder="Specification"
                              aria-label="Specification"
                            />
                            <TextInput
                              value={item.unit}
                              onChange={(event) => updateItem(index, "unit", event.target.value)}
                              placeholder="Unit (e.g. Bags)"
                              aria-label="Unit"
                            />
                            <TextInput
                              value={item.condition_notes}
                              onChange={(event) => updateItem(index, "condition_notes", event.target.value)}
                              placeholder="Condition notes"
                              aria-label="Condition notes"
                            />
                            <TextInput
                              value={item.remarks}
                              onChange={(event) => updateItem(index, "remarks", event.target.value)}
                              placeholder="Line remarks"
                              aria-label="Line remarks"
                            />
                          </div>
                          {breakdownError && <FieldError message={breakdownError} />}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </LineTable>
          </DocSection>

        <DocLayout
          aside={
            <>
              <DocSection step={4} title="Review" description="Live totals across all lines.">
                <TotalsCard
                  plain
                  title={null}
                  rows={[
                    { label: "Project", value: projectLabel || "—" },
                    { label: "Purchase order", value: getDisplayString(selectedPurchaseOrder?.po_number) || "Not linked" },
                    { label: "Vendor", value: vendorLabel || "—" },
                    { label: "Challan date", value: form.challan_date || "—" },
                  ]}
                />
                <TotalsCard
                  plain
                  title={null}
                  rows={[
                    { label: "Accepted", value: qty(totals.accepted) },
                    { label: "Short", value: qty(totals.shortage) },
                    { label: "Damaged", value: qty(totals.damaged) },
                    { label: "Rejected", value: qty(totals.rejected) },
                  ]}
                  totalLabel="Delivered"
                  total={qty(totals.quantity)}
                  meta={
                    totals.quantity > 0 && accountedTotal < totals.quantity
                      ? `${qty(totals.quantity - accountedTotal)} not yet split into accepted / short / damaged / rejected.`
                      : null
                  }
                />
                {(getError("items") || itemErrorCount > 0) && (
                  <Callout tone="bad" title="Check the material lines">
                    {getError("items") ||
                      `${itemErrorCount} field${itemErrorCount === 1 ? "" : "s"} need fixing.`}
                  </Callout>
                )}
              </DocSection>
            </>
          }
        >
          {/* 3 — Receiving checks & notes */}
          <DocSection
            step={3}
            title="Receiving checks & notes"
            description="Confirm the checks done at the gate and note any discrepancies."
          >
            <Grid cols={2}>
              <Field label="Checks done" full>
                <div className="inos-choices" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={Boolean(form.gate_pass_received)}
                    className="inos-choice"
                    onClick={() => updateField("gate_pass_received", !form.gate_pass_received)}
                  >
                    <Check size={16} style={{ opacity: form.gate_pass_received ? 1 : 0.25 }} aria-hidden />
                    Gate pass received
                  </button>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={Boolean(form.material_checked)}
                    className="inos-choice"
                    onClick={() => updateField("material_checked", !form.material_checked)}
                  >
                    <Check size={16} style={{ opacity: form.material_checked ? 1 : 0.25 }} aria-hidden />
                    Material checked
                  </button>
                </div>
              </Field>
              <Field label="General remarks" optional>
                <TextArea
                  rows={3}
                  value={form.general_remarks}
                  onChange={(event) => updateField("general_remarks", event.target.value)}
                  placeholder="e.g. Received by site supervisor, unloaded by vendor"
                />
              </Field>
              <Field label="Discrepancy notes" optional>
                <TextArea
                  rows={3}
                  value={form.discrepancy_notes}
                  onChange={(event) => updateField("discrepancy_notes", event.target.value)}
                  placeholder="Shortages, damages or rejections and why"
                />
              </Field>
              <Field label="Attachment link" optional full hint="Link to the scanned challan or photos.">
                <TextInput
                  type="url"
                  value={form.attachment_url}
                  onChange={(event) => updateField("attachment_url", event.target.value)}
                  placeholder="https://drive.google.com/…"
                />
              </Field>
            </Grid>
          </DocSection>
        </DocLayout>

        <FormActions
          note={
            <span className="tabular">
              {form.items.length} {form.items.length === 1 ? "line" : "lines"} · Delivered{" "}
              <strong style={{ color: "var(--brand)" }}>{qty(totals.quantity)}</strong>
            </span>
          }
          onCancel={onCancel}
          submitLabel={isEditMode ? "Update challan" : "Save challan"}
          submitting={isSubmitting}
        />
      </form>
    </Page>
  );
}
