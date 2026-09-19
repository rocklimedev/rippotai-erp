import React, { useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  useCreateDeliveryChallanMutation,
  useUpdateDeliveryChallanMutation,
} from "../api/procuerment/delivery-challan.api";

/* ------------------------------------------------------------------
 * Brand
 * ------------------------------------------------------------------ */

const BRAND = "bg-[#1F453B] hover:bg-[#17372f] text-white";
const BRAND_TEXT = "text-[#1F453B]";
const BRAND_SOFT = "bg-[#D8E0DA] text-[#1F453B]";
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

  return <p className="mt-1.5 text-xs text-destructive">{message}</p>;
}

function Field({ label, htmlFor, required, error, className, children }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label
          htmlFor={htmlFor}
          className="text-xs font-medium text-muted-foreground"
        >
          {label}

          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
      )}

      {children}

      <FieldError message={error} />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description, action }) {
  return (
    <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 border-b py-4">
      <div className="flex items-start gap-2.5">
        {Icon && (
          <Icon className={cn("mt-0.5 h-[18px] w-[18px]", BRAND_TEXT)} />
        )}

        <div className="space-y-0.5">
          <CardTitle className="text-base">{title}</CardTitle>

          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>
      </div>

      {action}
    </CardHeader>
  );
}

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
  className,
}) {
  const [open, setOpen] = useState(false);

  const selected = options.find(
    (option) => String(option.value) === String(value),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !selected && "text-muted-foreground",
            invalid && "border-destructive focus-visible:ring-destructive",
            className,
          )}
        >
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[220px] p-0"
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

function SummaryPill({ label, value }) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-center">
      <div className="text-sm font-semibold tabular-nums">
        {Number(value || 0).toFixed(3)}
      </div>

      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3 text-xs last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>

      <span className="max-w-[180px] truncate text-right font-medium">
        {value}
      </span>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>

      <span className="font-semibold tabular-nums">
        {Number(value || 0).toFixed(3)}
      </span>
    </div>
  );
}

function StatusRow({ checked, label }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full",
          checked ? BRAND : "bg-muted text-muted-foreground",
        )}
      >
        {checked && <Check className="h-3 w-3" />}
      </span>

      <span className={checked ? "" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

function ToggleCard({ checked, onChange, title, description }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border p-4 transition",
        checked && "border-[#1F453B]/30 bg-[#D8E0DA]/30",
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">{title}</p>

        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </div>

      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
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

  const [form, setForm] = useState(() => buildInitialForm(initialData));

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
    setForm(buildInitialForm(initialData));
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

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-muted/30">
      {/* Header */}

      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onCancel}
                aria-label="Back"
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                BRAND,
              )}
            >
              <Truck className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold leading-none">
                {isEditMode ? "Edit delivery challan" : "New delivery challan"}
              </h1>

              <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                Record incoming material delivery and receiving details
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="hidden sm:inline-flex"
              >
                Cancel
              </Button>
            )}

            <Button type="submit" disabled={isSubmitting} className={BRAND}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}

              {isSubmitting
                ? "Saving"
                : isEditMode
                  ? "Update challan"
                  : "Save challan"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {/* ------------------------------------------------
             * Challan details
             * ------------------------------------------------ */}

            <Card>
              <SectionHeader
                icon={FileText}
                title="Challan details"
                description="Project, site, vendor and delivery reference"
              />

              <CardContent className="grid gap-5 pt-5 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Project" required error={getError("project_id")}>
                  <Combobox
                    options={projectOptions}
                    value={form.project_id}
                    onChange={handleProjectChange}
                    invalid={Boolean(getError("project_id"))}
                    placeholder="Select project"
                    searchPlaceholder="Search projects..."
                    emptyText="No projects found."
                  />
                </Field>

                <Field label="Site">
                  <Select
                    value={form.site_id || NONE}
                    onValueChange={(value) =>
                      updateField("site_id", value === NONE ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value={NONE}>No site</SelectItem>

                      {availableSites.map((site) => (
                        <SelectItem key={site.id} value={String(site.id)}>
                          {getDisplayString(site.name) ||
                            getDisplayString(site.site_name) ||
                            site.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Purchase order">
                  <Combobox
                    options={purchaseOrderOptions}
                    value={form.purchase_order_id}
                    onChange={handlePurchaseOrderChange}
                    placeholder="Select purchase order"
                    searchPlaceholder="Search purchase orders..."
                    emptyText="No purchase orders found."
                  />
                </Field>

                <Field label="Vendor">
                  <Combobox
                    options={vendorOptions}
                    value={form.vendor_id}
                    onChange={(value) => updateField("vendor_id", value)}
                    placeholder="Select vendor"
                    searchPlaceholder="Search vendors..."
                    emptyText="No vendors found."
                  />
                </Field>

                <Field
                  label="Challan date"
                  htmlFor="challan_date"
                  required
                  error={getError("challan_date")}
                >
                  <Input
                    id="challan_date"
                    type="date"
                    value={form.challan_date}
                    onChange={(event) =>
                      updateField("challan_date", event.target.value)
                    }
                    className={cn(
                      getError("challan_date") &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                </Field>

                <Field label="Delivery address" htmlFor="site_address">
                  <Input
                    id="site_address"
                    value={form.site_address}
                    onChange={(event) =>
                      updateField("site_address", event.target.value)
                    }
                    placeholder="Delivery / site address"
                  />
                </Field>
              </CardContent>
            </Card>

            {/* ------------------------------------------------
             * PO summary
             * ------------------------------------------------ */}

            {selectedPurchaseOrder && (
              <Alert>
                <ClipboardList className="h-4 w-4" />

                <AlertDescription>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      <strong>
                        {getDisplayString(selectedPurchaseOrder.po_number)}
                      </strong>
                    </span>

                    <span>
                      Vendor:{" "}
                      {getDisplayString(selectedPurchaseOrder.agency_name) ||
                        getDisplayString(selectedVendor?.name) ||
                        "—"}
                    </span>

                    <span>
                      PO date: {getDisplayString(selectedPurchaseOrder.po_date)}
                    </span>

                    <span>
                      Status: {getDisplayString(selectedPurchaseOrder.status)}
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* ------------------------------------------------
             * Materials
             * ------------------------------------------------ */}

            <Card className="overflow-hidden">
              <SectionHeader
                icon={Package}
                title="Delivered materials"
                description="Record every material received on this challan"
                action={
                  <Button
                    type="button"
                    size="sm"
                    onClick={addItem}
                    className={BRAND}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add material
                  </Button>
                }
              />

              {(getError("items") || itemErrorCount > 0) && (
                <div className="px-6 pt-4">
                  <Alert variant="destructive">
                    <AlertDescription>
                      {getError("items") ||
                        `${itemErrorCount} field${
                          itemErrorCount === 1 ? "" : "s"
                        } in the material lines need fixing.`}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <CardContent className="p-0">
                {/* Desktop */}

                <div className="hidden overflow-x-auto lg:block">
                  <Table className="min-w-[1300px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-10 text-center">#</TableHead>

                        <TableHead className="min-w-[220px]">
                          Material
                        </TableHead>

                        <TableHead className="min-w-[180px]">
                          Description
                        </TableHead>

                        <TableHead className="w-28 text-right">Qty</TableHead>

                        <TableHead className="w-28 text-right">
                          Accepted
                        </TableHead>

                        <TableHead className="w-28 text-right">Short</TableHead>

                        <TableHead className="w-28 text-right">
                          Damaged
                        </TableHead>

                        <TableHead className="w-28 text-right">
                          Rejected
                        </TableHead>

                        <TableHead className="min-w-[160px]">
                          Condition
                        </TableHead>

                        <TableHead className="min-w-[160px]">
                          Stored at
                        </TableHead>

                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {form.items.map((item, index) => {
                        const materialError = getError(
                          `items.${index}.material_id`,
                        );

                        const quantityError = getError(
                          `items.${index}.quantity`,
                        );

                        const breakdownError = getError(
                          `items.${index}.quantity_breakdown`,
                        );

                        return (
                          <React.Fragment
                            key={
                              item.purchase_order_item_id ||
                              `${item.material_id}-${index}`
                            }
                          >
                            <TableRow className="border-b-0 align-top hover:bg-transparent">
                              <TableCell className="pt-6 text-center text-sm font-medium text-muted-foreground">
                                {index + 1}
                              </TableCell>

                              <TableCell>
                                <Combobox
                                  options={materialOptions}
                                  value={item.material_id}
                                  onChange={(value) =>
                                    handleMaterialChange(index, value)
                                  }
                                  invalid={Boolean(materialError)}
                                  placeholder="Select material"
                                  searchPlaceholder="Search materials..."
                                  emptyText="No materials found."
                                />

                                <FieldError message={materialError} />

                                {item.purchase_order_item_id && (
                                  <p className="mt-1 text-[11px] text-muted-foreground">
                                    Linked to PO item
                                  </p>
                                )}
                              </TableCell>

                              <TableCell>
                                <Input
                                  value={item.description}
                                  onChange={(event) =>
                                    updateItem(
                                      index,
                                      "description",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Description"
                                />
                              </TableCell>

                              <TableCell>
                                <Input
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
                                  className={cn(
                                    "text-right tabular-nums",
                                    quantityError &&
                                      "border-destructive focus-visible:ring-destructive",
                                  )}
                                />

                                {item.unit && (
                                  <span className="mt-1 block text-right text-[11px] text-muted-foreground">
                                    {item.unit}
                                  </span>
                                )}

                                <FieldError message={quantityError} />
                              </TableCell>

                              <TableCell>
                                <Input
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
                                  className="text-right tabular-nums"
                                />
                              </TableCell>

                              <TableCell>
                                <Input
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
                                  className="text-right tabular-nums"
                                />
                              </TableCell>

                              <TableCell>
                                <Input
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
                                  className="text-right tabular-nums"
                                />
                              </TableCell>

                              <TableCell>
                                <Input
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
                                  className="text-right tabular-nums"
                                />
                              </TableCell>

                              <TableCell>
                                <Select
                                  value={item.condition_status}
                                  onValueChange={(value) =>
                                    updateItem(index, "condition_status", value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>

                                  <SelectContent>
                                    {CONDITION_OPTIONS.map((option) => (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>

                              <TableCell>
                                <Input
                                  value={item.stored_at}
                                  onChange={(event) =>
                                    updateItem(
                                      index,
                                      "stored_at",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Warehouse / room"
                                />
                              </TableCell>

                              <TableCell className="pt-5 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(index)}
                                  aria-label={`Remove line ${index + 1}`}
                                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>

                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableCell />

                              <TableCell colSpan={10} className="pb-4 pt-0">
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                  <Input
                                    value={item.brand}
                                    onChange={(event) =>
                                      updateItem(
                                        index,
                                        "brand",
                                        event.target.value,
                                      )
                                    }
                                    placeholder="Brand"
                                  />

                                  <Input
                                    value={item.specification}
                                    onChange={(event) =>
                                      updateItem(
                                        index,
                                        "specification",
                                        event.target.value,
                                      )
                                    }
                                    placeholder="Specification"
                                  />

                                  <Input
                                    value={item.unit}
                                    onChange={(event) =>
                                      updateItem(
                                        index,
                                        "unit",
                                        event.target.value,
                                      )
                                    }
                                    placeholder="Unit"
                                  />

                                  <Input
                                    value={item.condition_notes}
                                    onChange={(event) =>
                                      updateItem(
                                        index,
                                        "condition_notes",
                                        event.target.value,
                                      )
                                    }
                                    placeholder="Condition notes"
                                  />

                                  <Input
                                    value={item.remarks}
                                    onChange={(event) =>
                                      updateItem(
                                        index,
                                        "remarks",
                                        event.target.value,
                                      )
                                    }
                                    placeholder="Item remarks"
                                    className="md:col-span-2"
                                  />

                                  {breakdownError && (
                                    <p className="text-xs font-medium text-destructive md:col-span-2 xl:col-span-4">
                                      {breakdownError}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile */}

                <div className="space-y-4 p-4 lg:hidden">
                  {form.items.map((item, index) => {
                    const materialError = getError(
                      `items.${index}.material_id`,
                    );

                    const quantityError = getError(`items.${index}.quantity`);

                    const breakdownError = getError(
                      `items.${index}.quantity_breakdown`,
                    );

                    return (
                      <Card
                        key={
                          item.purchase_order_item_id ||
                          `${item.material_id}-${index}`
                        }
                        className="bg-muted/30"
                      >
                        <CardContent className="p-4">
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold",
                                  BRAND,
                                )}
                              >
                                {index + 1}
                              </span>

                              <span className="text-sm font-medium">
                                Material item
                              </span>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                              label="Material"
                              required
                              error={materialError}
                              className="sm:col-span-2"
                            >
                              <Combobox
                                options={materialOptions}
                                value={item.material_id}
                                onChange={(value) =>
                                  handleMaterialChange(index, value)
                                }
                                invalid={Boolean(materialError)}
                                placeholder="Select material"
                                searchPlaceholder="Search materials..."
                                emptyText="No materials found."
                              />
                            </Field>

                            <Field
                              label="Description"
                              className="sm:col-span-2"
                            >
                              <Input
                                value={item.description}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "description",
                                    event.target.value,
                                  )
                                }
                              />
                            </Field>

                            <Field
                              label="Quantity"
                              required
                              error={quantityError}
                            >
                              <Input
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
                              />
                            </Field>

                            <Field label="Unit">
                              <Input
                                value={item.unit}
                                onChange={(event) =>
                                  updateItem(index, "unit", event.target.value)
                                }
                              />
                            </Field>

                            <Field label="Accepted">
                              <Input
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
                              />
                            </Field>

                            <Field label="Shortage">
                              <Input
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
                              />
                            </Field>

                            <Field label="Damaged">
                              <Input
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
                              />
                            </Field>

                            <Field label="Rejected">
                              <Input
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
                              />
                            </Field>

                            <Field label="Condition">
                              <Select
                                value={item.condition_status}
                                onValueChange={(value) =>
                                  updateItem(index, "condition_status", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                  {CONDITION_OPTIONS.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </Field>

                            <Field label="Stored at">
                              <Input
                                value={item.stored_at}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "stored_at",
                                    event.target.value,
                                  )
                                }
                              />
                            </Field>

                            <Field label="Brand">
                              <Input
                                value={item.brand}
                                onChange={(event) =>
                                  updateItem(index, "brand", event.target.value)
                                }
                              />
                            </Field>

                            <Field label="Specification">
                              <Input
                                value={item.specification}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "specification",
                                    event.target.value,
                                  )
                                }
                              />
                            </Field>

                            <Field
                              label="Condition notes"
                              className="sm:col-span-2"
                            >
                              <Input
                                value={item.condition_notes}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "condition_notes",
                                    event.target.value,
                                  )
                                }
                              />
                            </Field>

                            <Field
                              label="Item remarks"
                              className="sm:col-span-2"
                            >
                              <Textarea
                                rows={2}
                                value={item.remarks}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "remarks",
                                    event.target.value,
                                  )
                                }
                                className="resize-none"
                              />
                            </Field>

                            {breakdownError && (
                              <p className="text-xs font-medium text-destructive sm:col-span-2">
                                {breakdownError}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Separator />

                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addItem}
                    className={BRAND_TEXT}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add another material
                  </Button>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <SummaryPill label="Delivered" value={totals.quantity} />

                    <SummaryPill label="Accepted" value={totals.accepted} />

                    <SummaryPill label="Short" value={totals.shortage} />

                    <SummaryPill label="Damaged" value={totals.damaged} />

                    <SummaryPill label="Rejected" value={totals.rejected} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ------------------------------------------------
             * Remarks
             * ------------------------------------------------ */}

            <Card>
              <SectionHeader
                title="Remarks and documentation"
                description="Receiving notes, discrepancies and supporting documents"
              />

              <CardContent className="grid gap-5 pt-5 md:grid-cols-2">
                <Field label="General remarks">
                  <Textarea
                    rows={4}
                    value={form.general_remarks}
                    onChange={(event) =>
                      updateField("general_remarks", event.target.value)
                    }
                    placeholder="General notes about this delivery"
                    className="resize-none"
                  />
                </Field>

                <Field label="Discrepancy notes">
                  <Textarea
                    rows={4}
                    value={form.discrepancy_notes}
                    onChange={(event) =>
                      updateField("discrepancy_notes", event.target.value)
                    }
                    placeholder="Shortages, damages, rejected items or other discrepancies"
                    className="resize-none"
                  />
                </Field>

                <Field label="Attachment URL" className="md:col-span-2">
                  <Input
                    type="url"
                    value={form.attachment_url}
                    onChange={(event) =>
                      updateField("attachment_url", event.target.value)
                    }
                    placeholder="https://..."
                  />
                </Field>
              </CardContent>
            </Card>
          </div>

          {/* --------------------------------------------------
           * Sidebar
           * -------------------------------------------------- */}

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      BRAND_SOFT,
                    )}
                  >
                    <ClipboardList className="h-[18px] w-[18px]" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold leading-none">
                      Delivery summary
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Current challan overview
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <InfoRow
                    label="Project"
                    value={
                      getDisplayString(selectedProject?.name) ||
                      getDisplayString(selectedProject?.project_name) ||
                      form.project_id ||
                      "Not selected"
                    }
                  />

                  <InfoRow
                    label="Purchase order"
                    value={
                      getDisplayString(selectedPurchaseOrder?.po_number) ||
                      "Not linked"
                    }
                  />

                  <InfoRow
                    label="Vendor"
                    value={
                      getDisplayString(selectedPurchaseOrder?.agency_name) ||
                      getDisplayString(selectedVendor?.name) ||
                      getDisplayString(selectedVendor?.agency_name) ||
                      "Not selected"
                    }
                  />

                  <InfoRow
                    label="Date"
                    value={form.challan_date || "Not selected"}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-2.5 pt-6">
                <h3 className="mb-1 text-sm font-semibold">Verification</h3>

                <StatusRow
                  checked={form.gate_pass_received}
                  label="Gate pass received"
                />

                <StatusRow
                  checked={form.material_checked}
                  label="Material checked"
                />
              </CardContent>
            </Card>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full sm:hidden"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </aside>
        </div>
      </div>
    </form>
  );
}
