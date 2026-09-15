import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  X,
  Save,
  ShoppingCart,
  Calculator,
  FileText,
  Building2,
  CalendarDays,
  Package,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

import {
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
} from "../../api/procuerment/purchase-order.api";

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

const money = (value) => toNumber(value).toFixed(2);

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;

  if (Array.isArray(value?.data)) return value.data;

  if (Array.isArray(value?.items)) return value.items;

  if (Array.isArray(value?.results)) return value.results;

  return [];
};

const getId = (item) => item?.id || item?.value || "";

const getName = (item) =>
  item?.name ||
  item?.title ||
  item?.label ||
  item?.agency_name ||
  item?.vendor_name ||
  item?.company_name ||
  item?.project_name ||
  "";

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

const getVendorValue = (vendor, ...fields) => {
  return getMaterialField(vendor, ...fields);
};

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

  const projectList = useMemo(() => normalizeArray(projects), [projects]);
  const siteList = useMemo(() => normalizeArray(sites), [sites]);
  const vendorList = useMemo(() => normalizeArray(vendors), [vendors]);
  const materialList = useMemo(() => normalizeArray(materials), [materials]);
  const quotationList = useMemo(() => normalizeArray(quotations), [quotations]);
  const estimateList = useMemo(() => normalizeArray(estimates), [estimates]);
  const boqList = useMemo(() => normalizeArray(boqs), [boqs]);

  /*
   * ------------------------------------------------------------
   * INITIALIZE FORM
   * ------------------------------------------------------------
   */

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

  /*
   * ------------------------------------------------------------
   * SELECTED VENDOR
   * ------------------------------------------------------------
   */

  const selectedVendor = useMemo(() => {
    return vendorList.find(
      (vendor) => String(getId(vendor)) === String(form.vendor_id),
    );
  }, [vendorList, form.vendor_id]);

  /*
   * ------------------------------------------------------------
   * AUTO-FILL VENDOR
   * ------------------------------------------------------------
   */

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

  /*
   * ------------------------------------------------------------
   * TOTALS
   * ------------------------------------------------------------
   */

  const calculatedItems = useMemo(
    () => form.items.map(calculateItem),
    [form.items],
  );

  const totals = useMemo(() => {
    const grossSubtotal = calculatedItems.reduce(
      (sum, item) => sum + item._gross,
      0,
    );

    const itemDiscount = calculatedItems.reduce(
      (sum, item) => sum + item._discountAmount,
      0,
    );

    const taxableFromItems = calculatedItems.reduce(
      (sum, item) => sum + item._taxable,
      0,
    );

    const itemGst = calculatedItems.reduce(
      (sum, item) => sum + item._gstAmount,
      0,
    );

    /*
     * Header discount is treated as an additional discount.
     */
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

  /*
   * ------------------------------------------------------------
   * GENERIC FIELD UPDATE
   * ------------------------------------------------------------
   */

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => {
      if (!previous[field]) return previous;

      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  /*
   * ------------------------------------------------------------
   * PROJECT
   * ------------------------------------------------------------
   */

  const handleProjectChange = (projectId) => {
    updateField("project_id", projectId);

    /*
     * Site selections usually depend on project.
     * Clear the site when changing project.
     */
    if (form.project_id !== projectId) {
      setForm((previous) => ({
        ...previous,
        project_id: projectId,
        site_id: "",
      }));
    }
  };

  /*
   * ------------------------------------------------------------
   * VENDOR
   * ------------------------------------------------------------
   */

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

    setErrors((previous) => {
      const next = { ...previous };
      delete next.vendor_id;
      return next;
    });
  };

  /*
   * ------------------------------------------------------------
   * SOURCE TYPE
   * ------------------------------------------------------------
   */

  const handleSourceTypeChange = (sourceType) => {
    setForm((previous) => ({
      ...previous,
      source_type: sourceType,
      source_reference_id:
        sourceType === "MANUAL" ? "" : previous.source_reference_id,
      quotation_id: sourceType === "QUOTATION" ? previous.quotation_id : "",
    }));
  };

  /*
   * ------------------------------------------------------------
   * MATERIAL HELPERS
   * ------------------------------------------------------------
   */

  const findMaterial = (materialId) => {
    return materialList.find(
      (material) => String(getId(material)) === String(materialId),
    );
  };

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

      return {
        ...previous,
        items,
      };
    });
  };

  /*
   * ------------------------------------------------------------
   * ITEM UPDATE
   * ------------------------------------------------------------
   */

  const updateItem = (index, field, value) => {
    setForm((previous) => {
      const items = [...previous.items];

      items[index] = {
        ...items[index],
        [field]: value,
      };

      return {
        ...previous,
        items,
      };
    });

    setErrors((previous) => {
      const next = { ...previous };

      delete next[`item_${index}_${field}`];

      return next;
    });
  };

  /*
   * ------------------------------------------------------------
   * ADD ITEM
   * ------------------------------------------------------------
   */

  const addItem = () => {
    setForm((previous) => ({
      ...previous,
      items: [...previous.items, emptyItem(previous.items.length + 1)],
    }));
  };

  /*
   * ------------------------------------------------------------
   * REMOVE ITEM
   * ------------------------------------------------------------
   */

  const removeItem = (index) => {
    setForm((previous) => {
      if (previous.items.length === 1) {
        return {
          ...previous,
          items: [emptyItem(1)],
        };
      }

      const items = previous.items
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({
          ...item,
          line_number: itemIndex + 1,
        }));

      return {
        ...previous,
        items,
      };
    });
  };

  /*
   * ------------------------------------------------------------
   * DUPLICATE ITEM
   * ------------------------------------------------------------
   */

  const duplicateItem = (index) => {
    setForm((previous) => {
      const source = previous.items[index];

      if (!source) return previous;

      const duplicate = {
        ...source,
        id: undefined,
        line_number: previous.items.length + 1,
      };

      return {
        ...previous,
        items: [...previous.items, duplicate],
      };
    });
  };

  /*
   * ------------------------------------------------------------
   * VALIDATION
   * ------------------------------------------------------------
   */

  const validate = () => {
    const nextErrors = {};

    if (!form.project_id) {
      nextErrors.project_id = "Project is required.";
    }

    if (!form.po_date) {
      nextErrors.po_date = "PO date is required.";
    }

    if (
      form.target_delivery_date &&
      form.po_date &&
      form.target_delivery_date < form.po_date
    ) {
      nextErrors.target_delivery_date =
        "Target delivery date cannot be before PO date.";
    }

    if (!form.items.length) {
      nextErrors.items = "At least one item is required.";
    }

    form.items.forEach((item, index) => {
      if (!item.material_id) {
        nextErrors[`item_${index}_material_id`] = "Material is required.";
      }

      if (!item.description?.trim()) {
        nextErrors[`item_${index}_description`] = "Description is required.";
      }

      if (!item.unit?.trim()) {
        nextErrors[`item_${index}_unit`] = "Unit is required.";
      }

      if (toNumber(item.quantity) <= 0) {
        nextErrors[`item_${index}_quantity`] =
          "Quantity must be greater than 0.";
      }

      if (toNumber(item.rate) < 0) {
        nextErrors[`item_${index}_rate`] = "Rate cannot be negative.";
      }

      if (toNumber(item.gst_percent) < 0 || toNumber(item.gst_percent) > 100) {
        nextErrors[`item_${index}_gst_percent`] =
          "GST must be between 0 and 100.";
      }
    });

    if (
      form.source_type === "QUOTATION" &&
      !form.quotation_id &&
      !form.source_reference_id
    ) {
      nextErrors.source_reference_id =
        "Select a quotation for a quotation-based PO.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  /*
   * ------------------------------------------------------------
   * BUILD PAYLOAD
   * ------------------------------------------------------------
   */

  const buildPayload = () => {
    const payload = {
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

      discount: Number(
        (totals.itemDiscount + totals.headerDiscount).toFixed(2),
      ),

      gst_percent: Number(toNumber(form.gst_percent).toFixed(2)),

      gst_amount: Number(totals.headerGst.toFixed(2)),

      cartage: Number(totals.cartage.toFixed(2)),

      total_amount: Number(totals.totalAmount.toFixed(2)),

      status: form.status,

      source_type: form.source_type,

      source_reference_id: form.source_reference_id || undefined,

      /*
       * If your PurchaseOrder model has the explicit
       * quotation_id FK discussed for the procurement flow,
       * this will be sent.
       *
       * If it is not yet present in your DTO/model, remove
       * this one property from the payload.
       */
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
    };

    return payload;
  };

  /*
   * ------------------------------------------------------------
   * SUBMIT
   * ------------------------------------------------------------
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      toast.error("Please fix the highlighted fields before saving.");
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

        toast.success("Purchase order updated successfully.");
      } else {
        response = await createPurchaseOrder(payload).unwrap();

        toast.success("Purchase order created successfully.");
      }

      onSuccess?.(response);
    } catch (error) {
      console.error("Purchase order save error:", error);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to save purchase order.",
      );
    }
  };

  /*
   * ------------------------------------------------------------
   * SOURCE OPTIONS
   * ------------------------------------------------------------
   */

  const sourceOptions = useMemo(() => {
    if (form.source_type === "QUOTATION") {
      return quotationList;
    }

    if (form.source_type === "ESTIMATE") {
      return estimateList;
    }

    if (form.source_type === "BOQ") {
      return boqList;
    }

    return [];
  }, [form.source_type, quotationList, estimateList, boqList]);

  /*
   * ------------------------------------------------------------
   * INPUT COMPONENTS
   * ------------------------------------------------------------
   */

  const inputClass = (hasError = false) =>
    [
      "w-full rounded-lg border bg-white px-3 py-2.5 text-sm",
      "text-slate-800 outline-none transition",
      "placeholder:text-slate-400",
      "focus:ring-2",
      hasError
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-slate-200 focus:border-[#1F453B] focus:ring-[#D8E0DA]",
    ].join(" ");

  const selectClass = (hasError = false) =>
    [
      "w-full rounded-lg border bg-white px-3 py-2.5 text-sm",
      "text-slate-800 outline-none transition",
      "focus:ring-2",
      hasError
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-slate-200 focus:border-[#1F453B] focus:ring-[#D8E0DA]",
    ].join(" ");

  const textareaClass = (hasError = false) =>
    [
      "w-full rounded-lg border bg-white px-3 py-2.5 text-sm",
      "text-slate-800 outline-none transition",
      "placeholder:text-slate-400 resize-none",
      "focus:ring-2",
      hasError
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-slate-200 focus:border-[#1F453B] focus:ring-[#D8E0DA]",
    ].join(" ");

  const Label = ({ children, required = false }) => (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );

  const ErrorMessage = ({ message }) => {
    if (!message) return null;

    return (
      <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
        <AlertCircle size={12} />
        {message}
      </p>
    );
  };

  /*
   * ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------
   */

  return (
    <form
      onSubmit={handleSubmit}
      className="flex max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-slate-50"
    >
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D8E0DA] text-[#1F453B]">
            <ShoppingCart size={22} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#1F453B]">
              {isEdit ? "Edit Purchase Order" : "Create Purchase Order"}
            </h2>

            <p className="text-xs text-slate-500">
              Procurement & vendor purchase management
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={20} />
        </button>
      </div>

      {/* ======================================================
          BODY
      ======================================================= */}

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-5">
          {/* ==================================================
              BASIC INFORMATION
          =================================================== */}

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <FileText size={18} className="text-[#1F453B]" />

              <div>
                <h3 className="font-semibold text-slate-800">
                  Purchase Order Information
                </h3>

                <p className="text-xs text-slate-500">
                  Project, date and procurement source
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
              {/* Project */}

              <div className="lg:col-span-2">
                <Label required>Project</Label>

                <select
                  value={form.project_id}
                  onChange={(event) => handleProjectChange(event.target.value)}
                  className={selectClass(errors.project_id)}
                >
                  <option value="">Select project</option>

                  {projectList.map((project) => (
                    <option key={getId(project)} value={getId(project)}>
                      {getProjectName(project)}
                    </option>
                  ))}
                </select>

                <ErrorMessage message={errors.project_id} />
              </div>

              {/* Site */}

              <div>
                <Label>Site</Label>

                <select
                  value={form.site_id}
                  onChange={(event) =>
                    updateField("site_id", event.target.value)
                  }
                  className={selectClass()}
                >
                  <option value="">Select site</option>

                  {siteList.map((site) => (
                    <option key={getId(site)} value={getId(site)}>
                      {getSiteName(site)}
                    </option>
                  ))}
                </select>
              </div>

              {/* PO Date */}

              <div>
                <Label required>PO Date</Label>

                <div className="relative">
                  <CalendarDays
                    size={16}
                    className="pointer-events-none absolute left-3 top-3 text-slate-400"
                  />

                  <input
                    type="date"
                    value={form.po_date}
                    onChange={(event) =>
                      updateField("po_date", event.target.value)
                    }
                    className={`${inputClass(errors.po_date)} pl-9`}
                  />
                </div>

                <ErrorMessage message={errors.po_date} />
              </div>

              {/* Delivery Date */}

              <div>
                <Label>Target Delivery Date</Label>

                <input
                  type="date"
                  value={form.target_delivery_date}
                  min={form.po_date || undefined}
                  onChange={(event) =>
                    updateField("target_delivery_date", event.target.value)
                  }
                  className={inputClass(errors.target_delivery_date)}
                />

                <ErrorMessage message={errors.target_delivery_date} />
              </div>

              {/* Source Type */}

              <div>
                <Label>Source Type</Label>

                <select
                  value={form.source_type}
                  onChange={(event) =>
                    handleSourceTypeChange(event.target.value)
                  }
                  className={selectClass()}
                >
                  {SOURCE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Reference */}

              {form.source_type !== "MANUAL" && (
                <div className="md:col-span-2">
                  <Label required={form.source_type === "QUOTATION"}>
                    {form.source_type === "QUOTATION"
                      ? "Quotation"
                      : `${form.source_type} Reference`}
                  </Label>

                  {sourceOptions.length > 0 ? (
                    <select
                      value={
                        form.source_type === "QUOTATION"
                          ? form.quotation_id || form.source_reference_id
                          : form.source_reference_id
                      }
                      onChange={(event) => {
                        const value = event.target.value;

                        if (form.source_type === "QUOTATION") {
                          setForm((previous) => ({
                            ...previous,
                            quotation_id: value,
                            source_reference_id: value,
                          }));
                        } else {
                          updateField("source_reference_id", value);
                        }
                      }}
                      className={selectClass(errors.source_reference_id)}
                    >
                      <option value="">Select reference</option>

                      {sourceOptions.map((source) => (
                        <option key={getId(source)} value={getId(source)}>
                          {source.quotationNumber ||
                            source.quotation_number ||
                            source.estimateNumber ||
                            source.estimate_number ||
                            source.boq_number ||
                            source.name ||
                            source.title ||
                            getId(source)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form.source_reference_id}
                      onChange={(event) =>
                        updateField("source_reference_id", event.target.value)
                      }
                      placeholder={`Enter ${form.source_type.toLowerCase()} reference ID`}
                      className={inputClass(errors.source_reference_id)}
                    />
                  )}

                  <ErrorMessage message={errors.source_reference_id} />
                </div>
              )}

              {/* Status */}

              <div>
                <Label>Status</Label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField("status", event.target.value)
                  }
                  className={selectClass()}
                >
                  {PURCHASE_ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* ==================================================
              VENDOR
          =================================================== */}

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <Building2 size={18} className="text-[#1F453B]" />

              <div>
                <h3 className="font-semibold text-slate-800">
                  Vendor Information
                </h3>

                <p className="text-xs text-slate-500">
                  Supplier and contact details
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <Label>Vendor</Label>

                <select
                  value={form.vendor_id}
                  onChange={(event) => handleVendorChange(event.target.value)}
                  className={selectClass(errors.vendor_id)}
                >
                  <option value="">Select vendor</option>

                  {vendorList.map((vendor) => (
                    <option key={getId(vendor)} value={getId(vendor)}>
                      {getVendorName(vendor)}
                    </option>
                  ))}
                </select>

                <ErrorMessage message={errors.vendor_id} />
              </div>

              <div>
                <Label>Agency / Company</Label>

                <input
                  type="text"
                  value={form.agency_name}
                  onChange={(event) =>
                    updateField("agency_name", event.target.value)
                  }
                  placeholder="Vendor company"
                  className={inputClass()}
                />
              </div>

              <div>
                <Label>Contact Person</Label>

                <input
                  type="text"
                  value={form.contact_person}
                  onChange={(event) =>
                    updateField("contact_person", event.target.value)
                  }
                  placeholder="Contact person"
                  className={inputClass()}
                />
              </div>

              <div>
                <Label>Phone</Label>

                <input
                  type="text"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+91..."
                  className={inputClass()}
                />
              </div>

              <div>
                <Label>Email</Label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="vendor@example.com"
                  className={inputClass()}
                />
              </div>

              <div>
                <Label>GSTIN</Label>

                <input
                  type="text"
                  value={form.vendor_gstin}
                  onChange={(event) =>
                    updateField("vendor_gstin", event.target.value)
                  }
                  placeholder="GSTIN"
                  className={inputClass()}
                />
              </div>

              <div>
                <Label>PAN</Label>

                <input
                  type="text"
                  value={form.vendor_pan}
                  onChange={(event) =>
                    updateField("vendor_pan", event.target.value)
                  }
                  placeholder="PAN"
                  className={inputClass()}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <Label>Ship To Address</Label>

                <textarea
                  rows={2}
                  value={form.ship_to_address}
                  onChange={(event) =>
                    updateField("ship_to_address", event.target.value)
                  }
                  placeholder="Delivery / project site address"
                  className={textareaClass()}
                />
              </div>
            </div>
          </section>

          {/* ==================================================
              ITEMS
          =================================================== */}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-[#1F453B]" />

                <div>
                  <h3 className="font-semibold text-slate-800">
                    Purchase Order Items
                  </h3>

                  <p className="text-xs text-slate-500">
                    Materials, quantities, rates and taxes
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1F453B] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#17372f]"
              >
                <Plus size={16} />
                Add Material
              </button>
            </div>

            {errors.items && (
              <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {errors.items}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-12 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      #
                    </th>

                    <th className="min-w-[210px] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Material
                    </th>

                    <th className="min-w-[220px] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Description
                    </th>

                    <th className="min-w-[130px] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Brand
                    </th>

                    <th className="min-w-[170px] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Specification
                    </th>

                    <th className="w-24 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Unit
                    </th>

                    <th className="w-28 px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Qty
                    </th>

                    <th className="w-32 px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Rate
                    </th>

                    <th className="w-32 px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Discount
                    </th>

                    <th className="w-28 px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      GST %
                    </th>

                    <th className="w-36 px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Amount
                    </th>

                    <th className="w-24 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {form.items.map((item, index) => {
                    const calculated = calculatedItems[index];

                    return (
                      <React.Fragment key={item.id || `new-${index}`}>
                        <tr className="border-b border-slate-100 align-top">
                          <td className="px-3 py-3 text-center text-sm font-semibold text-slate-500">
                            {index + 1}
                          </td>

                          {/* Material */}

                          <td className="px-3 py-3">
                            <select
                              value={item.material_id}
                              onChange={(event) =>
                                populateMaterial(index, event.target.value)
                              }
                              className={selectClass(
                                errors[`item_${index}_material_id`],
                              )}
                            >
                              <option value="">Select material</option>

                              {materialList.map((material) => (
                                <option
                                  key={getId(material)}
                                  value={getId(material)}
                                >
                                  {getMaterialName(material)}
                                </option>
                              ))}
                            </select>

                            <ErrorMessage
                              message={errors[`item_${index}_material_id`]}
                            />
                          </td>

                          {/* Description */}

                          <td className="px-3 py-3">
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
                              placeholder="Material description"
                              className={inputClass(
                                errors[`item_${index}_description`],
                              )}
                            />

                            <ErrorMessage
                              message={errors[`item_${index}_description`]}
                            />
                          </td>

                          {/* Brand */}

                          <td className="px-3 py-3">
                            <input
                              type="text"
                              value={item.brand}
                              onChange={(event) =>
                                updateItem(index, "brand", event.target.value)
                              }
                              placeholder="Brand"
                              className={inputClass()}
                            />
                          </td>

                          {/* Specification */}

                          <td className="px-3 py-3">
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
                          </td>

                          {/* Unit */}

                          <td className="px-3 py-3">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(event) =>
                                updateItem(index, "unit", event.target.value)
                              }
                              placeholder="Unit"
                              className={inputClass(
                                errors[`item_${index}_unit`],
                              )}
                            />

                            <ErrorMessage
                              message={errors[`item_${index}_unit`]}
                            />
                          </td>

                          {/* Quantity */}

                          <td className="px-3 py-3">
                            <input
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
                              className={`${inputClass(
                                errors[`item_${index}_quantity`],
                              )} text-right`}
                            />

                            <ErrorMessage
                              message={errors[`item_${index}_quantity`]}
                            />
                          </td>

                          {/* Rate */}

                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(event) =>
                                updateItem(index, "rate", event.target.value)
                              }
                              className={`${inputClass(
                                errors[`item_${index}_rate`],
                              )} text-right`}
                            />

                            <ErrorMessage
                              message={errors[`item_${index}_rate`]}
                            />
                          </td>

                          {/* Discount */}

                          <td className="px-3 py-3">
                            <input
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
                              className={`${inputClass()} text-right`}
                            />
                          </td>

                          {/* GST */}

                          <td className="px-3 py-3">
                            <input
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
                              className={`${inputClass(
                                errors[`item_${index}_gst_percent`],
                              )} text-right`}
                            />

                            <ErrorMessage
                              message={errors[`item_${index}_gst_percent`]}
                            />
                          </td>

                          {/* Amount */}

                          <td className="px-3 py-3">
                            <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-right text-sm font-bold text-[#1F453B]">
                              ₹ {money(calculated.amount)}
                            </div>
                          </td>

                          {/* Actions */}

                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => duplicateItem(index)}
                                title="Duplicate item"
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-[#D8E0DA] hover:text-[#1F453B]"
                              >
                                <Plus size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                title="Remove item"
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Item remarks */}

                        <tr className="border-b border-slate-100 bg-slate-50/40">
                          <td />
                          <td colSpan={11} className="px-3 pb-3">
                            <input
                              type="text"
                              value={item.remarks}
                              onChange={(event) =>
                                updateItem(index, "remarks", event.target.value)
                              }
                              placeholder="Optional item remarks"
                              className="w-full rounded-lg border border-transparent bg-transparent px-3 py-2 text-xs text-slate-600 outline-none transition placeholder:text-slate-400 focus:border-slate-200 focus:bg-white"
                            />
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Items footer */}

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
              <span className="text-xs text-slate-500">
                {form.items.length} material
                {form.items.length === 1 ? "" : "s"} in this purchase order
              </span>

              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F453B] hover:underline"
              >
                <Plus size={15} />
                Add another item
              </button>
            </div>
          </section>

          {/* ==================================================
              CALCULATIONS
          =================================================== */}

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Calculator size={18} className="text-[#1F453B]" />

                <div>
                  <h3 className="font-semibold text-slate-800">
                    Order Calculation
                  </h3>

                  <p className="text-xs text-slate-500">
                    Discounts, GST and cartage
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced((previous) => !previous)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                {showAdvanced ? "Hide" : "Show"} calculation details
                <ChevronDown
                  size={14}
                  className={
                    showAdvanced ? "rotate-180 transition" : "transition"
                  }
                />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1fr_380px]">
              {/* Controls */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label>Additional Discount</Label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount}
                    onChange={(event) =>
                      updateField("discount", event.target.value)
                    }
                    className={`${inputClass()} text-right`}
                  />
                </div>

                <div>
                  <Label>Header GST %</Label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.gst_percent}
                    onChange={(event) =>
                      updateField("gst_percent", event.target.value)
                    }
                    className={`${inputClass()} text-right`}
                  />
                </div>

                <div>
                  <Label>Cartage</Label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cartage}
                    onChange={(event) =>
                      updateField("cartage", event.target.value)
                    }
                    className={`${inputClass()} text-right`}
                  />
                </div>
              </div>

              {/* Summary */}

              <div className="rounded-xl border border-slate-200 bg-slate-50">
                <div className="space-y-2 p-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Gross item value</span>

                    <span className="font-medium">
                      ₹ {money(totals.grossSubtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Item discounts</span>

                    <span className="font-medium text-red-600">
                      - ₹ {money(totals.itemDiscount)}
                    </span>
                  </div>

                  {showAdvanced && (
                    <>
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Taxable after items</span>

                        <span className="font-medium">
                          ₹ {money(totals.taxableFromItems)}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Additional discount</span>

                        <span className="font-medium text-red-600">
                          - ₹ {money(totals.headerDiscount)}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Taxable value</span>

                        <span className="font-medium">
                          ₹ {money(totals.taxableAfterHeaderDiscount)}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Item GST</span>

                        <span className="font-medium">
                          ₹ {money(totals.itemGst)}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between text-sm text-slate-600">
                    <span>
                      Header GST ({toNumber(form.gst_percent)}
                      %)
                    </span>

                    <span className="font-medium">
                      ₹ {money(totals.headerGst)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Cartage</span>

                    <span className="font-medium">
                      ₹ {money(totals.cartage)}
                    </span>
                  </div>

                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <div className="flex items-end justify-between">
                      <span className="text-sm font-bold text-slate-700">
                        Grand Total
                      </span>

                      <span className="text-xl font-black text-[#1F453B]">
                        ₹ {money(totals.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================
              NOTES
          =================================================== */}

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="font-semibold text-slate-800">Notes & Terms</h3>

              <p className="text-xs text-slate-500">
                Additional instructions for procurement and vendor
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
              <div>
                <Label>Internal Notes</Label>

                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  placeholder="Internal procurement notes..."
                  className={textareaClass()}
                />
              </div>

              <div>
                <Label>Terms & Conditions</Label>

                <textarea
                  rows={4}
                  value={form.terms_and_conditions}
                  onChange={(event) =>
                    updateField("terms_and_conditions", event.target.value)
                  }
                  placeholder="Payment terms, delivery conditions, warranty, inspection requirements..."
                  className={textareaClass()}
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ======================================================
          FOOTER
      ======================================================= */}

      <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
        <div>
          <p className="text-xs text-slate-500">Total payable</p>

          <p className="text-lg font-black text-[#1F453B]">
            ₹ {money(totals.totalAmount)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1F453B] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#17372f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={17} />

            {isLoading
              ? "Saving..."
              : isEdit
                ? "Update Purchase Order"
                : "Create Purchase Order"}
          </button>
        </div>
      </div>
    </form>
  );
}
