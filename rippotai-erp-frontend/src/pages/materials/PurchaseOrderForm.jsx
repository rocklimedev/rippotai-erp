import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Copy,
  Trash2,
  X,
  Save,
  ShoppingCart,
  Calculator,
  FileText,
  Building2,
  Package,
  ChevronsUpDown,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
} from "../../api/procuerment/purchase-order.api";

import { useGetProjectsQuery } from "../../api/projects/project.api";
import { useGetVendorsQuery } from "../../api/vendors/vendor.api";
import { useGetMaterialsQuery } from "../../api/procuerment/material-master.api";

/* ------------------------------------------------------------------
 * Brand
 * ------------------------------------------------------------------
 * Ideally these live in your tailwind theme as `brand` / `brand-muted`
 * so you can write `bg-brand` instead of the arbitrary value. Until
 * then they are centralised here so there is one place to change.
 */
const BRAND = "bg-[#1F453B] hover:bg-[#17372f] text-white";
const BRAND_TEXT = "text-[#1F453B]";
const BRAND_SOFT = "bg-[#D8E0DA] text-[#1F453B]";

const NONE = "__none__";

const PURCHASE_ORDER_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
  "CLOSED",
];

const SOURCE_TYPES = ["ESTIMATE", "BOQ", "QUOTATION", "MANUAL"];

const STATUS_VARIANT = {
  DRAFT: "secondary",
  PENDING_APPROVAL: "outline",
  APPROVED: "default",
  SENT: "default",
  PARTIALLY_RECEIVED: "outline",
  RECEIVED: "default",
  CANCELLED: "destructive",
  CLOSED: "secondary",
};

const emptyItem = (lineNumber = 1) => ({
  id: undefined,
  line_number: lineNumber,
  material_id: "",
  description: "",
  brand: "",
  specification: "",
  unit: "",
  quantity: 1,
  rate: 0,
  discount: 0,
  gst_percent: 0,
  amount: 0,
  remarks: "",
});

const emptyForm = {
  project_id: "",
  site_id: "",
  vendor_id: "",

  po_date: new Date().toISOString().slice(0, 10),
  target_delivery_date: "",

  agency_name: "",
  contact_person: "",
  phone: "",
  email: "",
  vendor_gstin: "",
  vendor_pan: "",
  ship_to_address: "",

  discount: 0,
  gst_percent: 0,
  cartage: 0,

  status: "DRAFT",
  source_type: "MANUAL",
  source_reference_id: "",
  quotation_id: "",

  notes: "",
  terms_and_conditions: "",

  items: [emptyItem(1)],
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const money = (value) =>
  toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  if (value?.data && typeof value.data === "object") {
    return normalizeArray(value.data);
  }
  return [];
};

const getId = (item) => item?.id || item?.value || "";

const getMaterialName = (material) =>
  material?.name ||
  material?.material_name ||
  material?.materialName ||
  material?.description ||
  "";

const getMaterialField = (material, ...fields) => {
  for (const field of fields) {
    if (
      material?.[field] !== undefined &&
      material?.[field] !== null &&
      material?.[field] !== ""
    ) {
      return material[field];
    }
  }
  return "";
};

const getProjectName = (project) =>
  project?.name ||
  project?.project_name ||
  project?.projectName ||
  project?.title ||
  "";

const getSiteName = (site) =>
  site?.name || site?.site_name || site?.siteName || site?.title || "";

const getVendorName = (vendor) =>
  vendor?.name ||
  vendor?.vendor_name ||
  vendor?.vendorName ||
  vendor?.agency_name ||
  vendor?.company_name ||
  vendor?.title ||
  "";

const getVendorValue = (vendor, ...fields) =>
  getMaterialField(vendor, ...fields);

const getSourceLabel = (source) =>
  source?.quotationNumber ||
  source?.quotation_number ||
  source?.estimateNumber ||
  source?.estimate_number ||
  source?.boq_number ||
  source?.name ||
  source?.title ||
  getId(source);

const calculateItem = (item) => {
  const quantity = Math.max(0, toNumber(item.quantity));
  const rate = Math.max(0, toNumber(item.rate));
  const discount = Math.max(0, toNumber(item.discount));
  const gstPercent = Math.max(0, toNumber(item.gst_percent));

  const gross = quantity * rate;
  const discountAmount = Math.min(discount, gross);
  const taxable = Math.max(0, gross - discountAmount);
  const gstAmount = (taxable * gstPercent) / 100;
  const amount = taxable + gstAmount;

  return {
    ...item,
    quantity,
    rate,
    discount,
    gst_percent: gstPercent,
    amount,
    _gross: gross,
    _discountAmount: discountAmount,
    _taxable: taxable,
    _gstAmount: gstAmount,
  };
};

/* ------------------------------------------------------------------
 * Small building blocks
 * ------------------------------------------------------------------
 * Declared at module scope on purpose. Defining components inside the
 * form body recreates them on every render, which remounts inputs and
 * steals focus mid-typing.
 */

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

function Field({ label, htmlFor, required, error, hint, className, children }) {
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
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
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

/**
 * Searchable single-select. Project / vendor / material lists get long,
 * so a native <select> stops being usable somewhere past a few dozen rows.
 */
function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select",
  searchPlaceholder = "Search...",
  emptyText = "No results.",
  disabled,
  loading,
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
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between font-normal",
            !selected && "text-muted-foreground",
            invalid && "border-destructive focus-visible:ring-destructive",
            className,
          )}
        >
          <span className="truncate">
            {loading ? "Loading..." : selected ? selected.label : placeholder}
          </span>
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
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

function SummaryRow({ label, value, tone = "default", strong }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span
        className={cn(
          "text-muted-foreground",
          strong && "font-semibold text-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums font-medium",
          tone === "negative" && "text-destructive",
          strong && "font-semibold",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------
 * Form
 * ------------------------------------------------------------------ */

export default function PurchaseOrderForm({
  initialData = null,

  projects = [],
  sites = [],
  vendors = [],
  materials = [],

  quotations = [],
  estimates = [],
  boqs = [],

  purchaseOrderItems = [],

  onSuccess,
  onCancel,
}) {
  const [createPurchaseOrder, { isLoading: isCreating }] =
    useCreatePurchaseOrderMutation();

  const [updatePurchaseOrder, { isLoading: isUpdating }] =
    useUpdatePurchaseOrderMutation();

  const isEdit = Boolean(initialData?.id);
  const isLoading = isCreating || isUpdating;

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  /* ---------------------------------------------------------------
   * Data
   * --------------------------------------------------------------- */

  const { data: projectsData, isFetching: projectsFetching } =
    useGetProjectsQuery({});

  const { data: vendorsData, isFetching: vendorsFetching } = useGetVendorsQuery(
    {},
  );

  const { data: materialsData, isFetching: materialsFetching } =
    useGetMaterialsQuery({ isActive: true });

  const projectList = useMemo(() => {
    const fromProps = normalizeArray(projects);
    return fromProps.length > 0 ? fromProps : normalizeArray(projectsData);
  }, [projects, projectsData]);

  const vendorList = useMemo(() => {
    const fromProps = normalizeArray(vendors);
    return fromProps.length > 0 ? fromProps : normalizeArray(vendorsData);
  }, [vendors, vendorsData]);

  const materialList = useMemo(() => {
    const fromProps = normalizeArray(materials);
    return fromProps.length > 0 ? fromProps : normalizeArray(materialsData);
  }, [materials, materialsData]);

  const siteList = useMemo(() => normalizeArray(sites), [sites]);
  const quotationList = useMemo(() => normalizeArray(quotations), [quotations]);
  const estimateList = useMemo(() => normalizeArray(estimates), [estimates]);
  const boqList = useMemo(() => normalizeArray(boqs), [boqs]);

  const projectsLoading = projectsFetching && projectList.length === 0;
  const vendorsLoading = vendorsFetching && vendorList.length === 0;
  const materialsLoading = materialsFetching && materialList.length === 0;

  const projectOptions = useMemo(
    () =>
      projectList.map((project) => ({
        value: getId(project),
        label: getProjectName(project) || getId(project),
      })),
    [projectList],
  );

  const vendorOptions = useMemo(
    () =>
      vendorList.map((vendor) => ({
        value: getId(vendor),
        label: getVendorName(vendor) || getId(vendor),
      })),
    [vendorList],
  );

  const materialOptions = useMemo(
    () =>
      materialList.map((material) => ({
        value: getId(material),
        label: getMaterialName(material) || getId(material),
      })),
    [materialList],
  );

  /* ---------------------------------------------------------------
   * Hydrate on edit
   * --------------------------------------------------------------- */

  useEffect(() => {
    if (!initialData) {
      setForm(emptyForm);
      return;
    }

    const sourceItems =
      initialData.items ||
      initialData.purchaseOrderItems ||
      purchaseOrderItems ||
      [];

    const mappedItems =
      sourceItems.length > 0
        ? sourceItems.map((item, index) => ({
            id: item.id,
            line_number: item.line_number || item.lineNumber || index + 1,
            material_id:
              item.material_id || item.materialId || item.material?.id || "",
            description:
              item.description ||
              item.material?.description ||
              item.material?.name ||
              "",
            brand: item.brand || item.material?.brand || "",
            specification:
              item.specification || item.material?.specification || "",
            unit: item.unit || item.material?.unit || "",
            quantity: toNumber(item.quantity ?? item.ordered_quantity ?? 1),
            rate: toNumber(item.rate ?? item.unit_rate ?? item.unit_price ?? 0),
            discount: toNumber(item.discount ?? 0),
            gst_percent: toNumber(item.gst_percent ?? item.gstPercent ?? 0),
            amount: toNumber(
              item.amount ?? item.total_amount ?? item.total ?? 0,
            ),
            remarks: item.remarks || "",
          }))
        : [emptyItem(1)];

    setForm({
      project_id: initialData.project_id || initialData.projectId || "",
      site_id: initialData.site_id || initialData.siteId || "",
      vendor_id: initialData.vendor_id || initialData.vendorId || "",

      po_date:
        initialData.po_date ||
        initialData.poDate ||
        new Date().toISOString().slice(0, 10),

      target_delivery_date:
        initialData.target_delivery_date ||
        initialData.targetDeliveryDate ||
        "",

      agency_name: initialData.agency_name || initialData.agencyName || "",
      contact_person:
        initialData.contact_person || initialData.contactPerson || "",
      phone: initialData.phone || "",
      email: initialData.email || "",
      vendor_gstin: initialData.vendor_gstin || initialData.vendorGstin || "",
      vendor_pan: initialData.vendor_pan || initialData.vendorPan || "",
      ship_to_address:
        initialData.ship_to_address || initialData.shipToAddress || "",

      discount: toNumber(initialData.discount),
      gst_percent: toNumber(
        initialData.gst_percent ?? initialData.gstPercent ?? 0,
      ),
      cartage: toNumber(initialData.cartage),

      status: initialData.status || "DRAFT",
      source_type:
        initialData.source_type || initialData.sourceType || "MANUAL",
      source_reference_id:
        initialData.source_reference_id || initialData.sourceReferenceId || "",
      quotation_id:
        initialData.quotation_id ||
        initialData.quotationId ||
        initialData.quotation?.id ||
        "",

      notes: initialData.notes || "",
      terms_and_conditions:
        initialData.terms_and_conditions ||
        initialData.termsAndConditions ||
        "",

      items: mappedItems,
    });
  }, [initialData, purchaseOrderItems]);

  /* ---------------------------------------------------------------
   * Vendor autofill
   * --------------------------------------------------------------- */

  const selectedVendor = useMemo(
    () =>
      vendorList.find(
        (vendor) => String(getId(vendor)) === String(form.vendor_id),
      ),
    [vendorList, form.vendor_id],
  );

  useEffect(() => {
    if (!selectedVendor || isEdit) return;

    setForm((previous) => ({
      ...previous,
      agency_name: previous.agency_name || getVendorName(selectedVendor),
      contact_person:
        previous.contact_person ||
        getVendorValue(
          selectedVendor,
          "contact_person",
          "contactPerson",
          "contact_name",
        ),
      phone:
        previous.phone ||
        getVendorValue(selectedVendor, "phone", "mobile", "phone_number"),
      email:
        previous.email ||
        getVendorValue(selectedVendor, "email", "email_address"),
      vendor_gstin:
        previous.vendor_gstin ||
        getVendorValue(selectedVendor, "gstin", "vendor_gstin", "gst_number"),
      vendor_pan:
        previous.vendor_pan ||
        getVendorValue(selectedVendor, "pan", "vendor_pan"),
      ship_to_address: previous.ship_to_address || "",
    }));
  }, [selectedVendor, isEdit]);

  /* ---------------------------------------------------------------
   * Totals
   * --------------------------------------------------------------- */

  const calculatedItems = useMemo(
    () => form.items.map(calculateItem),
    [form.items],
  );

  const totals = useMemo(() => {
    const grossSubtotal = calculatedItems.reduce((sum, i) => sum + i._gross, 0);
    const itemDiscount = calculatedItems.reduce(
      (sum, i) => sum + i._discountAmount,
      0,
    );
    const taxableFromItems = calculatedItems.reduce(
      (sum, i) => sum + i._taxable,
      0,
    );
    const itemGst = calculatedItems.reduce((sum, i) => sum + i._gstAmount, 0);

    const headerDiscount = Math.min(
      Math.max(0, toNumber(form.discount)),
      taxableFromItems,
    );

    const taxableAfterHeaderDiscount = Math.max(
      0,
      taxableFromItems - headerDiscount,
    );

    const headerGstPercent = Math.max(0, toNumber(form.gst_percent));
    const headerGst = (taxableAfterHeaderDiscount * headerGstPercent) / 100;
    const cartage = Math.max(0, toNumber(form.cartage));
    const totalAmount = taxableAfterHeaderDiscount + headerGst + cartage;

    return {
      grossSubtotal,
      itemDiscount,
      taxableFromItems,
      itemGst,
      headerDiscount,
      taxableAfterHeaderDiscount,
      headerGst,
      cartage,
      totalAmount,
    };
  }, [calculatedItems, form.discount, form.gst_percent, form.cartage]);

  /* ---------------------------------------------------------------
   * Handlers
   * --------------------------------------------------------------- */

  const clearError = (key) =>
    setErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    clearError(field);
  };

  const handleProjectChange = (projectId) => {
    setForm((previous) =>
      previous.project_id === projectId
        ? { ...previous, project_id: projectId }
        : { ...previous, project_id: projectId, site_id: "" },
    );
    clearError("project_id");
  };

  const handleVendorChange = (vendorId) => {
    setForm((previous) => ({
      ...previous,
      vendor_id: vendorId,
      agency_name: "",
      contact_person: "",
      phone: "",
      email: "",
      vendor_gstin: "",
      vendor_pan: "",
    }));
    clearError("vendor_id");
  };

  const handleSourceTypeChange = (sourceType) => {
    setForm((previous) => ({
      ...previous,
      source_type: sourceType,
      source_reference_id:
        sourceType === "MANUAL" ? "" : previous.source_reference_id,
      quotation_id: sourceType === "QUOTATION" ? previous.quotation_id : "",
    }));
  };

  const findMaterial = (materialId) =>
    materialList.find(
      (material) => String(getId(material)) === String(materialId),
    );

  const populateMaterial = (index, materialId) => {
    const material = findMaterial(materialId);

    setForm((previous) => {
      const items = [...previous.items];
      const current = items[index];
      if (!current) return previous;

      items[index] = {
        ...current,
        material_id: materialId,
        description:
          getMaterialField(
            material,
            "description",
            "material_description",
            "name",
            "material_name",
          ) || current.description,
        brand:
          getMaterialField(material, "brand", "default_brand") || current.brand,
        specification:
          getMaterialField(material, "specification", "specifications") ||
          current.specification,
        unit:
          getMaterialField(material, "unit", "uom", "unit_of_measure") ||
          current.unit,
        rate:
          current.rate ||
          toNumber(
            getMaterialField(
              material,
              "default_rate",
              "rate",
              "unit_rate",
              "current_rate",
            ),
          ),
      };

      return { ...previous, items };
    });

    clearError(`item_${index}_material_id`);
  };

  const updateItem = (index, field, value) => {
    setForm((previous) => {
      const items = [...previous.items];
      items[index] = { ...items[index], [field]: value };
      return { ...previous, items };
    });
    clearError(`item_${index}_${field}`);
  };

  const addItem = () =>
    setForm((previous) => ({
      ...previous,
      items: [...previous.items, emptyItem(previous.items.length + 1)],
    }));

  const removeItem = (index) =>
    setForm((previous) => {
      if (previous.items.length === 1) {
        return { ...previous, items: [emptyItem(1)] };
      }

      const items = previous.items
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({ ...item, line_number: itemIndex + 1 }));

      return { ...previous, items };
    });

  const duplicateItem = (index) =>
    setForm((previous) => {
      const source = previous.items[index];
      if (!source) return previous;

      return {
        ...previous,
        items: [
          ...previous.items,
          { ...source, id: undefined, line_number: previous.items.length + 1 },
        ],
      };
    });

  /* ---------------------------------------------------------------
   * Validation
   * --------------------------------------------------------------- */

  const validate = () => {
    const nextErrors = {};

    if (!form.project_id) nextErrors.project_id = "Pick a project.";
    if (!form.po_date) nextErrors.po_date = "Pick a PO date.";

    if (
      form.target_delivery_date &&
      form.po_date &&
      form.target_delivery_date < form.po_date
    ) {
      nextErrors.target_delivery_date =
        "Delivery date falls before the PO date.";
    }

    if (!form.items.length) {
      nextErrors.items = "Add at least one material.";
    }

    form.items.forEach((item, index) => {
      if (!item.material_id) {
        nextErrors[`item_${index}_material_id`] = "Pick a material.";
      }
      if (!item.description?.trim()) {
        nextErrors[`item_${index}_description`] = "Add a description.";
      }
      if (!item.unit?.trim()) {
        nextErrors[`item_${index}_unit`] = "Add a unit.";
      }
      if (toNumber(item.quantity) <= 0) {
        nextErrors[`item_${index}_quantity`] = "Quantity must be above 0.";
      }
      if (toNumber(item.rate) < 0) {
        nextErrors[`item_${index}_rate`] = "Rate cannot be negative.";
      }
      if (toNumber(item.gst_percent) < 0 || toNumber(item.gst_percent) > 100) {
        nextErrors[`item_${index}_gst_percent`] = "GST must be 0–100.";
      }
    });

    if (
      form.source_type === "QUOTATION" &&
      !form.quotation_id &&
      !form.source_reference_id
    ) {
      nextErrors.source_reference_id = "Pick the quotation this PO comes from.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /* ---------------------------------------------------------------
   * Payload + submit
   * --------------------------------------------------------------- */

  const buildPayload = () => ({
    project_id: form.project_id,
    site_id: form.site_id || undefined,
    vendor_id: form.vendor_id || undefined,

    po_date: form.po_date,
    target_delivery_date: form.target_delivery_date || undefined,

    agency_name: form.agency_name?.trim() || undefined,
    contact_person: form.contact_person?.trim() || undefined,
    phone: form.phone?.trim() || undefined,
    email: form.email?.trim() || undefined,
    vendor_gstin: form.vendor_gstin?.trim() || undefined,
    vendor_pan: form.vendor_pan?.trim() || undefined,
    ship_to_address: form.ship_to_address?.trim() || undefined,

    subtotal: Number(totals.taxableFromItems.toFixed(2)),
    discount: Number((totals.itemDiscount + totals.headerDiscount).toFixed(2)),
    gst_percent: Number(toNumber(form.gst_percent).toFixed(2)),
    gst_amount: Number(totals.headerGst.toFixed(2)),
    cartage: Number(totals.cartage.toFixed(2)),
    total_amount: Number(totals.totalAmount.toFixed(2)),

    status: form.status,
    source_type: form.source_type,
    source_reference_id: form.source_reference_id || undefined,

    /* Drop this line if your PO DTO has no quotation_id FK. */
    quotation_id: form.quotation_id || undefined,

    notes: form.notes?.trim() || undefined,
    terms_and_conditions: form.terms_and_conditions?.trim() || undefined,

    items: calculatedItems.map((item, index) => ({
      ...(item.id ? { id: item.id } : {}),
      line_number: index + 1,
      material_id: item.material_id,
      description: item.description?.trim(),
      brand: item.brand?.trim() || undefined,
      specification: item.specification?.trim() || undefined,
      unit: item.unit?.trim(),
      quantity: Number(toNumber(item.quantity).toFixed(3)),
      rate: Number(toNumber(item.rate).toFixed(2)),
      discount: Number(toNumber(item.discount).toFixed(2)),
      gst_percent: Number(toNumber(item.gst_percent).toFixed(2)),
      amount: Number(item.amount.toFixed(2)),
      remarks: item.remarks?.trim() || undefined,
    })),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      toast.error("Some fields need attention before this can be saved.");
      return;
    }

    try {
      const payload = buildPayload();
      let response;

      if (isEdit) {
        response = await updatePurchaseOrder({
          id: initialData.id,
          ...payload,
        }).unwrap();
        toast.success("Purchase order updated.");
      } else {
        response = await createPurchaseOrder(payload).unwrap();
        toast.success("Purchase order created.");
      }

      onSuccess?.(response);
    } catch (error) {
      console.error("Purchase order save error:", error);
      toast.error(
        error?.data?.message ||
          error?.message ||
          "The purchase order could not be saved.",
      );
    }
  };

  /* ---------------------------------------------------------------
   * Source reference options
   * --------------------------------------------------------------- */

  const sourceOptions = useMemo(() => {
    if (form.source_type === "QUOTATION") return quotationList;
    if (form.source_type === "ESTIMATE") return estimateList;
    if (form.source_type === "BOQ") return boqList;
    return [];
  }, [form.source_type, quotationList, estimateList, boqList]);

  const sourceComboOptions = useMemo(
    () =>
      sourceOptions.map((source) => ({
        value: getId(source),
        label: getSourceLabel(source),
      })),
    [sourceOptions],
  );

  const itemErrorCount = Object.keys(errors).filter((key) =>
    key.startsWith("item_"),
  ).length;

  /* ---------------------------------------------------------------
   * Render
   * --------------------------------------------------------------- */

  return (
    <TooltipProvider delayDuration={300}>
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] flex-col overflow-hidden rounded-xl border bg-muted/30"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b bg-background px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                BRAND_SOFT,
              )}
            >
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h2
                className={cn("text-lg font-semibold leading-none", BRAND_TEXT)}
              >
                {isEdit ? "Edit purchase order" : "New purchase order"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Procurement and vendor purchasing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[form.status] || "secondary"}>
              {form.status.replaceAll("_", " ")}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCancel}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 px-6 py-5">
            {/* ------------------------------------------------ Order */}
            <Card>
              <SectionHeader
                icon={FileText}
                title="Order details"
                description="Project, dates and where this order came from"
              />

              <CardContent className="grid grid-cols-1 gap-4 pt-5 md:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="Project"
                  required
                  error={errors.project_id}
                  className="lg:col-span-2"
                >
                  <Combobox
                    options={projectOptions}
                    value={form.project_id}
                    onChange={handleProjectChange}
                    loading={projectsLoading}
                    invalid={Boolean(errors.project_id)}
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
                    disabled={siteList.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          siteList.length === 0
                            ? "No sites available"
                            : "Select site"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>No site</SelectItem>
                      {siteList.map((site) => (
                        <SelectItem
                          key={getId(site)}
                          value={String(getId(site))}
                        >
                          {getSiteName(site)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Status">
                  <Select
                    value={form.status}
                    onValueChange={(value) => updateField("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PURCHASE_ORDER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field
                  label="PO date"
                  htmlFor="po_date"
                  required
                  error={errors.po_date}
                >
                  <Input
                    id="po_date"
                    type="date"
                    value={form.po_date}
                    onChange={(event) =>
                      updateField("po_date", event.target.value)
                    }
                    className={cn(
                      errors.po_date &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                </Field>

                <Field
                  label="Delivery by"
                  htmlFor="target_delivery_date"
                  error={errors.target_delivery_date}
                >
                  <Input
                    id="target_delivery_date"
                    type="date"
                    min={form.po_date || undefined}
                    value={form.target_delivery_date}
                    onChange={(event) =>
                      updateField("target_delivery_date", event.target.value)
                    }
                    className={cn(
                      errors.target_delivery_date &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                </Field>

                <Field label="Raised from">
                  <Select
                    value={form.source_type}
                    onValueChange={handleSourceTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {form.source_type !== "MANUAL" && (
                  <Field
                    label={
                      form.source_type === "QUOTATION"
                        ? "Quotation"
                        : `${form.source_type} reference`
                    }
                    required={form.source_type === "QUOTATION"}
                    error={errors.source_reference_id}
                  >
                    {sourceComboOptions.length > 0 ? (
                      <Combobox
                        options={sourceComboOptions}
                        value={
                          form.source_type === "QUOTATION"
                            ? form.quotation_id || form.source_reference_id
                            : form.source_reference_id
                        }
                        onChange={(value) => {
                          if (form.source_type === "QUOTATION") {
                            setForm((previous) => ({
                              ...previous,
                              quotation_id: value,
                              source_reference_id: value,
                            }));
                          } else {
                            setForm((previous) => ({
                              ...previous,
                              source_reference_id: value,
                            }));
                          }
                          clearError("source_reference_id");
                        }}
                        invalid={Boolean(errors.source_reference_id)}
                        placeholder="Select reference"
                        searchPlaceholder="Search references..."
                        emptyText="No references found."
                      />
                    ) : (
                      <Input
                        value={form.source_reference_id}
                        onChange={(event) =>
                          updateField("source_reference_id", event.target.value)
                        }
                        placeholder={`${form.source_type.toLowerCase()} reference ID`}
                        className={cn(
                          errors.source_reference_id &&
                            "border-destructive focus-visible:ring-destructive",
                        )}
                      />
                    )}
                  </Field>
                )}
              </CardContent>
            </Card>

            {/* ------------------------------------------------ Vendor */}
            <Card>
              <SectionHeader
                icon={Building2}
                title="Vendor"
                description="Supplier details, filled in automatically where we have them"
              />

              <CardContent className="grid grid-cols-1 gap-4 pt-5 md:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="Vendor"
                  error={errors.vendor_id}
                  className="lg:col-span-2"
                >
                  <Combobox
                    options={vendorOptions}
                    value={form.vendor_id}
                    onChange={handleVendorChange}
                    loading={vendorsLoading}
                    invalid={Boolean(errors.vendor_id)}
                    placeholder="Select vendor"
                    searchPlaceholder="Search vendors..."
                    emptyText="No vendors found."
                  />
                </Field>

                <Field label="Agency or company" htmlFor="agency_name">
                  <Input
                    id="agency_name"
                    value={form.agency_name}
                    onChange={(event) =>
                      updateField("agency_name", event.target.value)
                    }
                    placeholder="Vendor company"
                  />
                </Field>

                <Field label="Contact person" htmlFor="contact_person">
                  <Input
                    id="contact_person"
                    value={form.contact_person}
                    onChange={(event) =>
                      updateField("contact_person", event.target.value)
                    }
                    placeholder="Who to reach"
                  />
                </Field>

                <Field label="Phone" htmlFor="phone">
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    placeholder="+91"
                  />
                </Field>

                <Field label="Email" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    placeholder="vendor@example.com"
                  />
                </Field>

                <Field label="GSTIN" htmlFor="vendor_gstin">
                  <Input
                    id="vendor_gstin"
                    value={form.vendor_gstin}
                    onChange={(event) =>
                      updateField(
                        "vendor_gstin",
                        event.target.value.toUpperCase(),
                      )
                    }
                    placeholder="22AAAAA0000A1Z5"
                    className="uppercase"
                  />
                </Field>

                <Field label="PAN" htmlFor="vendor_pan">
                  <Input
                    id="vendor_pan"
                    value={form.vendor_pan}
                    onChange={(event) =>
                      updateField(
                        "vendor_pan",
                        event.target.value.toUpperCase(),
                      )
                    }
                    placeholder="AAAAA0000A"
                    className="uppercase"
                  />
                </Field>

                <Field
                  label="Ship to"
                  htmlFor="ship_to_address"
                  className="md:col-span-2 lg:col-span-4"
                >
                  <Textarea
                    id="ship_to_address"
                    rows={2}
                    value={form.ship_to_address}
                    onChange={(event) =>
                      updateField("ship_to_address", event.target.value)
                    }
                    placeholder="Delivery or site address"
                    className="resize-none"
                  />
                </Field>
              </CardContent>
            </Card>

            {/* ------------------------------------------------ Items */}
            <Card className="overflow-hidden">
              <SectionHeader
                icon={Package}
                title="Materials"
                description="Quantities, rates and tax per line"
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

              {(errors.items || itemErrorCount > 0) && (
                <div className="px-6 pt-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {errors.items ||
                        `${itemErrorCount} field${itemErrorCount === 1 ? "" : "s"} in the material lines need fixing.`}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="min-w-[1250px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead className="min-w-[210px]">
                          Material
                        </TableHead>
                        <TableHead className="min-w-[220px]">
                          Description
                        </TableHead>
                        <TableHead className="min-w-[130px]">Brand</TableHead>
                        <TableHead className="min-w-[170px]">
                          Specification
                        </TableHead>
                        <TableHead className="w-24">Unit</TableHead>
                        <TableHead className="w-28 text-right">Qty</TableHead>
                        <TableHead className="w-32 text-right">Rate</TableHead>
                        <TableHead className="w-32 text-right">
                          Discount
                        </TableHead>
                        <TableHead className="w-28 text-right">GST %</TableHead>
                        <TableHead className="w-36 text-right">
                          Amount
                        </TableHead>
                        <TableHead className="w-24 text-center">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {form.items.map((item, index) => {
                        const calculated = calculatedItems[index];

                        return (
                          <React.Fragment key={item.id || `new-${index}`}>
                            <TableRow className="border-b-0 align-top hover:bg-transparent">
                              <TableCell className="pt-6 text-center text-sm font-medium text-muted-foreground">
                                {index + 1}
                              </TableCell>

                              <TableCell>
                                <Combobox
                                  options={materialOptions}
                                  value={item.material_id}
                                  onChange={(value) =>
                                    populateMaterial(index, value)
                                  }
                                  loading={materialsLoading}
                                  invalid={Boolean(
                                    errors[`item_${index}_material_id`],
                                  )}
                                  placeholder="Select material"
                                  searchPlaceholder="Search materials..."
                                  emptyText="No materials found."
                                />
                                <FieldError
                                  message={errors[`item_${index}_material_id`]}
                                />
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
                                  placeholder="What is being bought"
                                  className={cn(
                                    errors[`item_${index}_description`] &&
                                      "border-destructive focus-visible:ring-destructive",
                                  )}
                                />
                                <FieldError
                                  message={errors[`item_${index}_description`]}
                                />
                              </TableCell>

                              <TableCell>
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
                              </TableCell>

                              <TableCell>
                                <Input
                                  value={item.specification}
                                  onChange={(event) =>
                                    updateItem(
                                      index,
                                      "specification",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Grade, size, finish"
                                />
                              </TableCell>

                              <TableCell>
                                <Input
                                  value={item.unit}
                                  onChange={(event) =>
                                    updateItem(
                                      index,
                                      "unit",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Nos"
                                  className={cn(
                                    errors[`item_${index}_unit`] &&
                                      "border-destructive focus-visible:ring-destructive",
                                  )}
                                />
                                <FieldError
                                  message={errors[`item_${index}_unit`]}
                                />
                              </TableCell>

                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.001"
                                  value={item.quantity}
                                  onChange={(event) =>
                                    updateItem(
                                      index,
                                      "quantity",
                                      event.target.value,
                                    )
                                  }
                                  className={cn(
                                    "text-right tabular-nums",
                                    errors[`item_${index}_quantity`] &&
                                      "border-destructive focus-visible:ring-destructive",
                                  )}
                                />
                                <FieldError
                                  message={errors[`item_${index}_quantity`]}
                                />
                              </TableCell>

                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.rate}
                                  onChange={(event) =>
                                    updateItem(
                                      index,
                                      "rate",
                                      event.target.value,
                                    )
                                  }
                                  className={cn(
                                    "text-right tabular-nums",
                                    errors[`item_${index}_rate`] &&
                                      "border-destructive focus-visible:ring-destructive",
                                  )}
                                />
                                <FieldError
                                  message={errors[`item_${index}_rate`]}
                                />
                              </TableCell>

                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.discount}
                                  onChange={(event) =>
                                    updateItem(
                                      index,
                                      "discount",
                                      event.target.value,
                                    )
                                  }
                                  className="text-right tabular-nums"
                                />
                              </TableCell>

                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={item.gst_percent}
                                  onChange={(event) =>
                                    updateItem(
                                      index,
                                      "gst_percent",
                                      event.target.value,
                                    )
                                  }
                                  className={cn(
                                    "text-right tabular-nums",
                                    errors[`item_${index}_gst_percent`] &&
                                      "border-destructive focus-visible:ring-destructive",
                                  )}
                                />
                                <FieldError
                                  message={errors[`item_${index}_gst_percent`]}
                                />
                              </TableCell>

                              <TableCell>
                                <div
                                  className={cn(
                                    "rounded-md border bg-muted px-3 py-2 text-right text-sm font-semibold tabular-nums",
                                    BRAND_TEXT,
                                  )}
                                >
                                  ₹{money(calculated.amount)}
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center justify-center gap-0.5">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => duplicateItem(index)}
                                        aria-label={`Duplicate line ${index + 1}`}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Duplicate line
                                    </TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
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
                                    </TooltipTrigger>
                                    <TooltipContent>Remove line</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            </TableRow>

                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableCell />
                              <TableCell colSpan={11} className="pb-3 pt-0">
                                <Input
                                  value={item.remarks}
                                  onChange={(event) =>
                                    updateItem(
                                      index,
                                      "remarks",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Remarks for this line (optional)"
                                  className="h-8 border-transparent bg-transparent text-xs shadow-none focus-visible:border-input focus-visible:bg-background"
                                />
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <Separator />

                <div className="flex items-center justify-between px-6 py-3">
                  <span className="text-xs text-muted-foreground">
                    {form.items.length} material
                    {form.items.length === 1 ? "" : "s"} on this order
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addItem}
                    className={BRAND_TEXT}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add another
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ------------------------------------------------ Totals */}
            <Collapsible
              open={showAdvanced}
              onOpenChange={setShowAdvanced}
              asChild
            >
              <Card>
                <SectionHeader
                  icon={Calculator}
                  title="Totals"
                  description="Order-level discount, GST and cartage"
                  action={
                    <CollapsibleTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        {showAdvanced ? "Hide breakdown" : "Show breakdown"}
                      </Button>
                    </CollapsibleTrigger>
                  }
                />

                <CardContent className="grid grid-cols-1 gap-5 pt-5 lg:grid-cols-[1fr_360px]">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Field
                      label="Order discount"
                      htmlFor="discount"
                      hint="Applied after line discounts"
                    >
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.discount}
                        onChange={(event) =>
                          updateField("discount", event.target.value)
                        }
                        className="text-right tabular-nums"
                      />
                    </Field>

                    <Field label="Order GST %" htmlFor="gst_percent">
                      <Input
                        id="gst_percent"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={form.gst_percent}
                        onChange={(event) =>
                          updateField("gst_percent", event.target.value)
                        }
                        className="text-right tabular-nums"
                      />
                    </Field>

                    <Field label="Cartage" htmlFor="cartage">
                      <Input
                        id="cartage"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.cartage}
                        onChange={(event) =>
                          updateField("cartage", event.target.value)
                        }
                        className="text-right tabular-nums"
                      />
                    </Field>
                  </div>

                  <div className="space-y-2 rounded-lg border bg-muted/40 p-4">
                    <SummaryRow
                      label="Line value"
                      value={`₹${money(totals.grossSubtotal)}`}
                    />
                    <SummaryRow
                      label="Line discounts"
                      value={`−₹${money(totals.itemDiscount)}`}
                      tone="negative"
                    />

                    <CollapsibleContent className="space-y-2 data-[state=open]:pt-0">
                      <SummaryRow
                        label="Taxable after lines"
                        value={`₹${money(totals.taxableFromItems)}`}
                      />
                      <SummaryRow
                        label="Order discount"
                        value={`−₹${money(totals.headerDiscount)}`}
                        tone="negative"
                      />
                      <SummaryRow
                        label="Taxable value"
                        value={`₹${money(totals.taxableAfterHeaderDiscount)}`}
                      />
                      <SummaryRow
                        label="Line GST"
                        value={`₹${money(totals.itemGst)}`}
                      />
                    </CollapsibleContent>

                    <SummaryRow
                      label={`Order GST (${toNumber(form.gst_percent)}%)`}
                      value={`₹${money(totals.headerGst)}`}
                    />
                    <SummaryRow
                      label="Cartage"
                      value={`₹${money(totals.cartage)}`}
                    />

                    <Separator className="my-3" />

                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm font-semibold">Grand total</span>
                      <span
                        className={cn(
                          "text-xl font-bold tabular-nums",
                          BRAND_TEXT,
                        )}
                      >
                        ₹{money(totals.totalAmount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Collapsible>

            {/* ------------------------------------------------ Notes */}
            <Card>
              <SectionHeader
                title="Notes and terms"
                description="Anything the team or the vendor needs to know"
              />

              <CardContent className="grid grid-cols-1 gap-4 pt-5 lg:grid-cols-2">
                <Field label="Internal notes" htmlFor="notes">
                  <Textarea
                    id="notes"
                    rows={4}
                    value={form.notes}
                    onChange={(event) =>
                      updateField("notes", event.target.value)
                    }
                    placeholder="Only your team sees this"
                    className="resize-none"
                  />
                </Field>

                <Field
                  label="Terms and conditions"
                  htmlFor="terms_and_conditions"
                >
                  <Textarea
                    id="terms_and_conditions"
                    rows={4}
                    value={form.terms_and_conditions}
                    onChange={(event) =>
                      updateField("terms_and_conditions", event.target.value)
                    }
                    placeholder="Payment terms, delivery, warranty, inspection"
                    className="resize-none"
                  />
                </Field>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-t bg-background px-6 py-4">
          <div>
            <p className="text-xs text-muted-foreground">Total payable</p>
            <p className={cn("text-lg font-bold tabular-nums", BRAND_TEXT)}>
              ₹{money(totals.totalAmount)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isLoading} className={BRAND}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isLoading
                ? "Saving"
                : isEdit
                  ? "Update purchase order"
                  : "Create purchase order"}
            </Button>
          </div>
        </div>
      </form>
    </TooltipProvider>
  );
}
