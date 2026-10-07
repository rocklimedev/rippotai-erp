import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from 'react-router-dom';
import { useSharedProjectData } from '../hooks/use-shared-project-data';
import { toast } from "sonner";
import {
  Plus,
  Copy,
  Trash2,
  ArrowLeft,
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
  X,
  RefreshCw,
} from "lucide-react";

import {
  Page,
  PageHeader,
  Button,
  Field,
  TextInput,
  SelectInput,
  TextArea,
  FormActions,
} from "@/components/inos";
import {
  DocSection,
  DocLayout,
  Grid,
  LineTable,
  IconAction,
  RemoveRow,
  AddRow,
  Affix,
  TotalsCard,
  Callout,
  LoadingBlock,
  Check as CheckBox,
  Disclosure,
  inr,
  todayISO,
} from "@/components/forms/commerce-form-ui";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";

import {
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
} from "../api/procuerment/purchase-order.api";

import { useGetProjectsQuery } from "../api/projects/project.api";
import { useGetVendorsQuery } from "../api/vendors/vendor.api";
import { useGetMaterialsQuery } from "../api/procuerment/material-master.api";

/*
 * IMPORTANT:
 *
 * Your material-master.api.js needs to export:
 *
 * useUpdateMaterialMutation
 *
 * Example:
 *
 * updateMaterial: builder.mutation({
 *   query: ({ id, ...data }) => ({
 *     url: `/material-master/${id}`,
 *     method: "PATCH",
 *     body: data,
 *   }),
 *   invalidatesTags: ["Material"],
 * })
 *
 * If your actual Material Master PATCH route is different,
 * change it inside material-master.api.js.
 */
import { useUpdateMaterialMutation } from "../api/procuerment/material-master.api";

const normalizeArray = (response) => {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.rows)) return response.rows;

  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.data?.rows)) return response.data.rows;

  if (Array.isArray(response?.payload)) return response.payload;
  if (Array.isArray(response?.payload?.data)) return response.payload.data;
  if (Array.isArray(response?.payload?.items)) return response.payload.items;

  return [];
};

const getId = (item) => item?.id || item?._id || item?.value || "";

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const money = (value) =>
  toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* =========================================================
   MATERIAL MASTER HELPERS
   ========================================================= */

const getMaterialName = (material) =>
  material?.name || material?.material_name || material?.materialName || "";

const getMaterialCode = (material) =>
  material?.material_code || material?.materialCode || material?.code || "";

const getMaterialDescription = (material) =>
  material?.description ||
  material?.material_description ||
  material?.materialDescription ||
  "";

const getMaterialBrand = (material) => material?.brand || "";

const getMaterialSpecification = (material) =>
  material?.specification || material?.specifications || "";

const getMaterialPrice = (material) =>
  toNumber(
    material?.price ??
      material?.default_rate ??
      material?.rate ??
      material?.unit_rate ??
      material?.current_rate ??
      0,
  );

const getMaterialUnitId = (material) =>
  material?.unit_id || material?.unitId || material?.unit?.id || "";

const getMaterialUnitCode = (material) =>
  material?.unit?.code ||
  material?.unit_code ||
  material?.unitCode ||
  material?.unit?.name ||
  material?.uom ||
  material?.unit_of_measure ||
  "";

const getMaterialHsn = (material) =>
  material?.hsn_code || material?.hsnCode || "";

const getMaterialVendorId = (material) =>
  material?.vendor_id || material?.vendorId || material?.vendor?.id || "";

const getMaterialVendor = (material) => material?.vendor || null;

/* =========================================================
   PROJECT / SITE HELPERS
   ========================================================= */

const getProjectName = (project) =>
  project?.name ||
  project?.project_name ||
  project?.projectName ||
  project?.title ||
  "";

const getSiteName = (site) =>
  site?.name || site?.site_name || site?.siteName || site?.title || "";

const getVendorName = (vendor) =>
  vendor?.company_name ||
  vendor?.companyName ||
  vendor?.name ||
  vendor?.vendor_name ||
  vendor?.vendorName ||
  "";

const getVendorValue = (vendor, ...keys) => {
  for (const key of keys) {
    const value = vendor?.[key];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
};

const getSourceLabel = (value) => {
  const labels = {
    ESTIMATE: "Estimate",
    BOQ: "BOQ",
    QUOTATION: "Quotation",
    MANUAL: "Manual",
  };

  return labels[value] || value || "";
};

/* =========================================================
   EMPTY STATE
   ========================================================= */

const createEmptyItem = (lineNumber = 1) => ({
  id: "",
  line_number: lineNumber,

  material_id: "",

  description: "",
  brand: "",
  specification: "",

  unit: "",
  unit_id: "",
  hsn_code: "",

  ordered_quantity: 1,
  rate: "",
  amount: 0,

  remarks: "",
  source_reference_id: "",

  /*
   * UI-only flag.
   *
   * When true:
   * edited master fields will be PATCHed
   * back into Material Master when PO is saved.
   */
  update_master: false,
});

const emptyForm = {
  project_id: "",
  site_id: "",
  vendor_id: "",

  po_number: "",

  po_date: "",
  expected_delivery_date: "",

  agency_name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",

  discount: 0,
  gst_percentage: 18,
  cartage: 0,

  status: "DRAFT",

  source_type: "MANUAL",
  source_reference_id: "",

  notes: "",
  terms_and_conditions: "",

  items: [createEmptyItem(1)],
};

/* =========================================================
   COMPONENT
   ========================================================= */

export default function PurchaseOrderForm({
  initialData = null,
  onBack: onBackProp,
  onCancel,
  onSuccess,
}) {
  const isEdit = Boolean(initialData?.id);
  const [searchParams] = useSearchParams();
  const onBack = onBackProp || onCancel;

  const [form, setForm] = useState(() => {
    if (!initialData) return { ...emptyForm, po_date: todayISO(), project_id: searchParams.get('projectId') || searchParams.get('project_id') || '' };

    return {
      ...emptyForm,
      ...initialData,

      items:
        Array.isArray(initialData?.items) && initialData.items.length > 0
          ? initialData.items.map((item, index) => ({
              ...createEmptyItem(index + 1),
              ...item,
              line_number: item?.line_number || index + 1,
              update_master: false,
            }))
          : [createEmptyItem(1)],
    };
  });

  const [materialSearch, setMaterialSearch] = useState({});
  const [materialOpen, setMaterialOpen] = useState({});
  const [savingMasterIds, setSavingMasterIds] = useState([]);

  const [createPurchaseOrder, { isLoading: isCreating }] =
    useCreatePurchaseOrderMutation();

  const [updatePurchaseOrder, { isLoading: isUpdating }] =
    useUpdatePurchaseOrderMutation();

  const [updateMaterial] = useUpdateMaterialMutation();


  const { data: projectsResponse, isLoading: projectsLoading } =
    useGetProjectsQuery({});

  const { data: vendorsResponse, isLoading: vendorsLoading } =
    useGetVendorsQuery({});

  const { data: materialsResponse, isLoading: materialsLoading } =
    useGetMaterialsQuery({
      isActive: true,
    });

  const projects = useMemo(
    () => normalizeArray(projectsResponse),
    [projectsResponse],
  );

  const vendors = useMemo(
    () => normalizeArray(vendorsResponse),
    [vendorsResponse],
  );

  const materials = useMemo(
    () => normalizeArray(materialsResponse),
    [materialsResponse],
  );
  useSharedProjectData(form.project_id, 'purchaseOrder', form, setForm, !isEdit && !materialsLoading, materials);

  const selectedProject = useMemo(
    () =>
      projects.find(
        (project) => String(getId(project)) === String(form.project_id),
      ),
    [projects, form.project_id],
  );

  const selectedVendor = useMemo(
    () =>
      vendors.find(
        (vendor) => String(getId(vendor)) === String(form.vendor_id),
      ),
    [vendors, form.vendor_id],
  );

  /* =========================================================
     TOTALS
     ========================================================= */

  const calculatedItems = useMemo(() => {
    return (form.items || []).map((item) => {
      const quantity = toNumber(item.ordered_quantity);
      const rate = toNumber(item.rate);

      return {
        ...item,
        amount: quantity * rate,
      };
    });
  }, [form.items]);

  const subtotal = useMemo(
    () => calculatedItems.reduce((sum, item) => sum + toNumber(item.amount), 0),
    [calculatedItems],
  );

  const discount = Math.min(Math.max(toNumber(form.discount), 0), subtotal);

  const taxableAmount = Math.max(subtotal - discount, 0);

  const gstPercentage = Math.max(toNumber(form.gst_percentage), 0);

  const gstAmount = (taxableAmount * gstPercentage) / 100;

  const cartage = Math.max(toNumber(form.cartage), 0);

  const grandTotal = taxableAmount + gstAmount + cartage;

  /* =========================================================
     FORM HELPERS
     ========================================================= */

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

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
  };

  const addItem = () => {
    setForm((previous) => ({
      ...previous,
      items: [...previous.items, createEmptyItem(previous.items.length + 1)],
    }));
  };

  const duplicateItem = (index) => {
    setForm((previous) => {
      const source = previous.items[index];

      const duplicated = {
        ...source,
        id: "",
        line_number: previous.items.length + 1,
        update_master: false,
      };

      return {
        ...previous,
        items: [...previous.items, duplicated],
      };
    });

    toast.success("Material line duplicated");
  };

  const removeItem = (index) => {
    setForm((previous) => {
      if (previous.items.length === 1) {
        return {
          ...previous,
          items: [createEmptyItem(1)],
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

  /* =========================================================
     MATERIAL POPULATION
     ========================================================= */

  const populateMaterial = (index, materialId) => {
    const material = materials.find(
      (item) => String(getId(item)) === String(materialId),
    );

    if (!material) {
      updateItem(index, "material_id", materialId);
      return;
    }

    const currentItem = form.items[index] || {};

    const materialVendorId = getMaterialVendorId(material);

    setForm((previous) => {
      const items = [...previous.items];

      items[index] = {
        ...items[index],

        material_id: getId(material),

        /*
         * IMPORTANT:
         * These values come from the actual Material Master API.
         */

        description:
          getMaterialDescription(material) || currentItem.description || "",

        brand: getMaterialBrand(material) || currentItem.brand || "",

        specification:
          getMaterialSpecification(material) || currentItem.specification || "",

        unit: getMaterialUnitCode(material) || currentItem.unit || "",

        unit_id: getMaterialUnitId(material) || currentItem.unit_id || "",

        hsn_code: getMaterialHsn(material) || currentItem.hsn_code || "",

        /*
         * IMPORTANT:
         * Material Master uses `price`, not `rate`.
         */
        rate: getMaterialPrice(material),

        /*
         * Every time a material is selected,
         * master synchronization starts unchecked.
         */
        update_master: false,
      };

      return {
        ...previous,
        items,
      };
    });

    /*
     * If material has an associated vendor,
     * automatically select it for the PO.
     */
    if (materialVendorId && !form.vendor_id) {
      updateForm("vendor_id", materialVendorId);
    }

    /*
     * If material contains nested vendor information,
     * auto-fill vendor details as well.
     */
    const materialVendor = getMaterialVendor(material);

    if (materialVendor) {
      setForm((previous) => ({
        ...previous,

        vendor_id: previous.vendor_id || materialVendorId || "",

        agency_name: previous.agency_name || getVendorName(materialVendor),

        contact_person:
          previous.contact_person ||
          getVendorValue(
            materialVendor,
            "contact_person",
            "contactPerson",
            "contact_name",
            "name",
          ),

        phone:
          previous.phone ||
          getVendorValue(
            materialVendor,
            "contact_number",
            "contactNumber",
            "phone",
            "mobile",
            "phone_number",
          ),

        email:
          previous.email ||
          getVendorValue(materialVendor, "email", "email_address"),

        address: previous.address || getVendorValue(materialVendor, "address"),
      }));
    }

    setMaterialOpen((previous) => ({
      ...previous,
      [index]: false,
    }));

    setMaterialSearch((previous) => ({
      ...previous,
      [index]: "",
    }));
  };

  /* =========================================================
     VENDOR AUTO FILL
     ========================================================= */

  useEffect(() => {
    if (!selectedVendor) return;

    setForm((previous) => ({
      ...previous,

      agency_name: getVendorName(selectedVendor),

      contact_person: getVendorValue(
        selectedVendor,
        "contact_person",
        "contactPerson",
        "contact_name",
        "name",
      ),

      phone: getVendorValue(
        selectedVendor,
        "contact_number",
        "contactNumber",
        "phone",
        "mobile",
        "phone_number",
      ),

      email: getVendorValue(selectedVendor, "email", "email_address"),

      address: getVendorValue(selectedVendor, "address"),
    }));
  }, [selectedVendor]);

  /* =========================================================
     BUILD PO PAYLOAD
     ========================================================= */

  const buildPayload = (overrides = {}) => {
    return {
      project_id: form.project_id || null,
      site_id: form.site_id || null,
      vendor_id: form.vendor_id || null,

      po_number: form.po_number || null,

      po_date: form.po_date || null,
      expected_delivery_date: form.expected_delivery_date || null,

      agency_name: form.agency_name || null,

      contact_person: form.contact_person || null,

      phone: form.phone || null,

      email: form.email || null,

      address: form.address || null,

      discount: Number(discount.toFixed(2)),

      gst_percentage: Number(gstPercentage.toFixed(2)),

      cartage: Number(cartage.toFixed(2)),

      status: overrides.status || form.status || "DRAFT",

      source_type: form.source_type || "MANUAL",

      source_reference_id: form.source_reference_id || null,

      notes: form.notes || null,

      terms_and_conditions: form.terms_and_conditions || null,

      /*
       * IMPORTANT:
       *
       * Do NOT send:
       * - update_master
       * - unit_id
       * - hsn_code
       *
       * unless your Purchase Order Item DTO explicitly supports them.
       *
       * Your PO item model uses:
       * material_id
       * description
       * specification
       * brand
       * unit
       * ordered_quantity
       * rate
       * remarks
       * source_reference_id
       */

      items: calculatedItems.map((item, index) => ({
        ...(item.id ? { id: item.id } : {}),

        line_number: item.line_number || index + 1,

        material_id: item.material_id || null,

        description: item.description || null,

        specification: item.specification || null,

        brand: item.brand || null,

        unit: item.unit || null,

        ordered_quantity: Number(toNumber(item.ordered_quantity).toFixed(3)),

        rate: Number(toNumber(item.rate).toFixed(2)),

        remarks: item.remarks || null,

        source_reference_id:
          item.source_reference_id || form.source_reference_id || null,
      })),
    };
  };

  /* =========================================================
     MATERIAL MASTER SYNC
     ========================================================= */

  const getMasterUpdatePayload = (item) => {
    const payload = {};

    /*
     * Only send fields that belong to Material Master.
     *
     * DO NOT update Material Master `name` because the PO
     * description is not the material name.
     */

    if (item.description !== undefined && item.description !== null) {
      payload.description = String(item.description).trim();
    }

    if (item.brand !== undefined && item.brand !== null) {
      payload.brand = String(item.brand).trim();
    }

    if (item.specification !== undefined && item.specification !== null) {
      payload.specification = String(item.specification).trim();
    }

    if (item.rate !== undefined && item.rate !== null && item.rate !== "") {
      payload.price = Number(toNumber(item.rate).toFixed(2));
    }

    if (
      item.unit_id !== undefined &&
      item.unit_id !== null &&
      item.unit_id !== ""
    ) {
      payload.unit_id = item.unit_id;
    }

    if (item.hsn_code !== undefined && item.hsn_code !== null) {
      payload.hsn_code = String(item.hsn_code).trim();
    }

    return payload;
  };

  const syncMaterialMasters = async () => {
    const masterItems = calculatedItems.filter(
      (item) => item.update_master && item.material_id,
    );

    if (!masterItems.length) {
      return {
        total: 0,
        failed: [],
      };
    }

    setSavingMasterIds(masterItems.map((item) => item.material_id));

    try {
      const results = await Promise.allSettled(
        masterItems.map(async (item) => {
          const payload = getMasterUpdatePayload(item);

          if (Object.keys(payload).length === 0) {
            return {
              materialId: item.material_id,
              skipped: true,
            };
          }

          await updateMaterial({
            id: item.material_id,
            ...payload,
          }).unwrap();

          return {
            materialId: item.material_id,
            success: true,
          };
        }),
      );

      const failed = results
        .map((result, index) => ({
          result,
          item: masterItems[index],
        }))
        .filter(({ result }) => result.status === "rejected");

      return {
        total: masterItems.length,
        failed,
      };
    } finally {
      setSavingMasterIds([]);
    }
  };

  /* =========================================================
     SAVE
     ========================================================= */

  const handleSave = async (overrides = {}) => {
    try {
      if (!form.project_id) {
        toast.error("Please select a project");
        return;
      }

      if (!form.vendor_id) {
        toast.error("Please select a vendor");
        return;
      }

      const validItems = calculatedItems.filter(
        (item) => item.material_id && toNumber(item.ordered_quantity) > 0,
      );

      if (!validItems.length) {
        toast.error("Please add at least one valid material");
        return;
      }

      const payload = buildPayload(overrides);

      let savedPO;

      if (isEdit) {
        savedPO = await updatePurchaseOrder({
          id: initialData.id,
          ...payload,
        }).unwrap();
      } else {
        savedPO = await createPurchaseOrder(payload).unwrap();
      }

      toast.success(
        isEdit
          ? "Purchase Order updated successfully"
          : "Purchase Order created successfully",
      );

      /*
       * PO is already safely saved.
       *
       * Now synchronize checked Material Master
       * records.
       */
      let masterResult;

      try {
        masterResult = await syncMaterialMasters();
      } catch (masterError) {
        console.error("Material Master synchronization failed:", masterError);

        toast.warning("PO saved, but Material Master synchronization failed.");
      }

      if (masterResult && masterResult.failed?.length) {
        toast.warning(
          `PO saved, but ${masterResult.failed.length} Material Master ${
            masterResult.failed.length === 1 ? "record was" : "records were"
          } not updated.`,
        );
      } else if (masterResult?.total > 0) {
        toast.success(
          `${masterResult.total} Material Master ${
            masterResult.total === 1 ? "record" : "records"
          } updated successfully`,
        );
      }

      if (onSuccess) {
        onSuccess(savedPO);
      }
    } catch (error) {
      console.error("Purchase Order save error:", error);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to save Purchase Order",
      );
    }
  };

  const isSaving = isCreating || isUpdating || savingMasterIds.length > 0;

  /* =========================================================
     MATERIAL FILTER
     ========================================================= */

  const getFilteredMaterials = (index) => {
    const search = materialSearch[index]?.trim().toLowerCase() || "";

    const validMaterials = materials.filter((material) => {
      const id = getId(material);

      return id !== undefined && id !== null && String(id).trim() !== "";
    });

    if (!search) {
      return validMaterials;
    }

    return validMaterials.filter((material) => {
      const searchable = [
        getMaterialName(material),
        getMaterialCode(material),
        getMaterialDescription(material),
        getMaterialBrand(material),
        getMaterialSpecification(material),
        getMaterialUnitCode(material),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(search);
    });
  };


  /* =========================================================
     RENDER
     ========================================================= */

  const findMaterial = (materialId) =>
    materials.find((material) => String(getId(material)) === String(materialId));

  const hasMasterUpdates = calculatedItems.some(
    (item) => item.update_master && item.material_id,
  );

  const missing = [
    !form.project_id && "project",
    !form.vendor_id && "vendor",
    calculatedItems.every((item) => !item.material_id) && "at least one material",
  ].filter(Boolean);

  const lineCount = calculatedItems.filter((item) => item.material_id).length;

  return (
    <Page>
      <PageHeader
        crumbs={[
          { label: "Procurement", to: "/procurement" },
          { label: "Purchase orders", to: "/procurement/purchase-orders" },
          { label: isEdit ? "Edit" : "New" },
        ]}
        title={isEdit ? `Edit purchase order${form.po_number ? ` ${form.po_number}` : ""}` : "New purchase order"}
        subtitle="Pick the project and vendor, add materials, then review the totals before saving."
        actions={
          <Button variant="ghost" icon={ArrowLeft} onClick={onBack} disabled={isSaving}>
            Back to list
          </Button>
        }
      />

      <form
        className="inos-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleSave();
        }}
      >
        {/* 1 — Vendor & project */}
        <DocSection
          step={1}
          title="Vendor & project"
          description="Who you are ordering from and which project it is charged to."
        >
          <Grid cols={4}>
            <Field label="Project" required htmlFor="po-project">
              <SelectInput
                id="po-project"
                value={form.project_id || ""}
                onChange={(event) => updateForm("project_id", event.target.value)}
                disabled={projectsLoading}
                placeholder={projectsLoading ? "Loading projects…" : "Select project"}
              >
                {projects.map((project) => {
                  const id = getId(project);
                  if (!id) return null;
                  return (
                    <option key={id} value={String(id)}>
                      {getProjectName(project)}
                    </option>
                  );
                })}
              </SelectInput>
            </Field>

            <Field
              label="Site"
              optional
              htmlFor="po-site"
              hint={
                form.project_id && !(selectedProject?.sites || []).length
                  ? "This project has no sites set up."
                  : undefined
              }
            >
              <SelectInput
                id="po-site"
                value={form.site_id || ""}
                onChange={(event) => updateForm("site_id", event.target.value)}
                disabled={!form.project_id}
                placeholder={form.project_id ? "Select site" : "Pick a project first"}
              >
                {Array.isArray(selectedProject?.sites) &&
                  selectedProject.sites.map((site) => {
                    const id = getId(site);
                    if (!id) return null;
                    return (
                      <option key={id} value={String(id)}>
                        {getSiteName(site)}
                      </option>
                    );
                  })}
              </SelectInput>
            </Field>

            <div className="span-2">
            <Field label="Vendor" required htmlFor="po-vendor">
              <SelectInput
                id="po-vendor"
                value={form.vendor_id || ""}
                onChange={(event) => updateForm("vendor_id", event.target.value)}
                disabled={vendorsLoading}
                placeholder={vendorsLoading ? "Loading vendors…" : "Select vendor"}
              >
                {vendors.map((vendor) => {
                  const id = getId(vendor);
                  if (!id) return null;
                  return (
                    <option key={id} value={String(id)}>
                      {getVendorName(vendor)}
                    </option>
                  );
                })}
              </SelectInput>
            </Field>
            </div>

            <Field label="PO number" optional hint="Leave blank to auto-generate." htmlFor="po-number">
              <TextInput
                id="po-number"
                value={form.po_number || ""}
                onChange={(event) => updateForm("po_number", event.target.value)}
                placeholder="e.g. PO-2026-014"
              />
            </Field>

            <Field label="PO date" htmlFor="po-date">
              <TextInput
                id="po-date"
                type="date"
                value={form.po_date || ""}
                onChange={(event) => updateForm("po_date", event.target.value)}
              />
            </Field>

            <Field label="Status" htmlFor="po-status">
              <SelectInput
                id="po-status"
                value={form.status || "DRAFT"}
                onChange={(event) => updateForm("status", event.target.value)}
              >
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending approval</option>
                <option value="APPROVED">Approved</option>
                <option value="SENT">Sent</option>
                <option value="PARTIALLY_RECEIVED">Partially received</option>
                <option value="RECEIVED">Received</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="CLOSED">Closed</option>
              </SelectInput>
            </Field>

            <Field label="Source" htmlFor="po-source">
              <SelectInput
                id="po-source"
                value={form.source_type || "MANUAL"}
                onChange={(event) => updateForm("source_type", event.target.value)}
              >
                {["MANUAL", "ESTIMATE", "BOQ", "QUOTATION"].map((value) => (
                  <option key={value} value={value}>
                    {getSourceLabel(value)}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </Grid>

          <Disclosure
            title="Vendor contact"
            icon={Building2}
            summary={
              [form.contact_person, form.phone, form.email].filter(Boolean).join(" · ") ||
              (form.vendor_id ? "No contact details on the vendor record — add them here." : "Fills in when you pick a vendor.")
            }
          >
            <Grid cols={4}>
              <Field label="Agency / company">
                <TextInput
                  value={form.agency_name || ""}
                  onChange={(event) => updateForm("agency_name", event.target.value)}
                  placeholder="e.g. Shree Tiles & Co."
                />
              </Field>
              <Field label="Contact person">
                <TextInput
                  value={form.contact_person || ""}
                  onChange={(event) => updateForm("contact_person", event.target.value)}
                  placeholder="e.g. Rakesh Gupta"
                />
              </Field>
              <Field label="Phone">
                <TextInput
                  type="tel"
                  value={form.phone || ""}
                  onChange={(event) => updateForm("phone", event.target.value)}
                  placeholder="e.g. 98100 12345"
                />
              </Field>
              <Field label="Email">
                <TextInput
                  type="email"
                  value={form.email || ""}
                  onChange={(event) => updateForm("email", event.target.value)}
                  placeholder="name@vendor.com"
                />
              </Field>
              <Field label="Address" full>
                <TextInput
                  value={form.address || ""}
                  onChange={(event) => updateForm("address", event.target.value)}
                  placeholder="Billing / dispatch address"
                />
              </Field>
            </Grid>
          </Disclosure>
        </DocSection>

        {/* 2 — Line items */}
        <DocSection
          step={2}
          flush
          title="Line items"
          description="Pick a material to fill its unit, brand and master rate. Adjust quantity and rate per line."
          actions={
            <Button variant="secondary" size="sm" icon={Plus} onClick={addItem}>
              Add item
            </Button>
          }
          footer={
            <>
              <AddRow onClick={addItem}>Add item</AddRow>
              <span className="inos-hint tabular">
                {lineCount} of {calculatedItems.length} {calculatedItems.length === 1 ? "line" : "lines"} with a material · Subtotal{" "}
                <strong style={{ color: "var(--text)" }}>{inr(subtotal)}</strong>
              </span>
            </>
          }
        >
          <LineTable minWidth={1180}>
            <thead>
              <tr>
                <th>#</th>
                <th style={{ minWidth: 240 }}>Material</th>
                <th style={{ minWidth: 170 }}>Description</th>
                <th style={{ minWidth: 110 }}>Brand</th>
                <th style={{ minWidth: 150 }}>Specification</th>
                <th style={{ width: 80 }}>Unit</th>
                <th className="num" style={{ width: 96 }}>Qty</th>
                <th className="num" style={{ width: 124 }}>Rate</th>
                <th className="num" style={{ width: 120 }}>Amount</th>
                <th className="actions" aria-label="Row actions" />
              </tr>
            </thead>
            <tbody>
              {calculatedItems.map((item, index) => {
                const filteredMaterials = getFilteredMaterials(index);
                const selectedMaterial = item.material_id ? findMaterial(item.material_id) : null;
                const isMasterUpdating =
                  item.material_id && savingMasterIds.includes(item.material_id);

                return (
                  <tr key={item.id || `new-${index}`} className={item.update_master ? "is-flagged" : undefined}>
                    <td className="cf-idx">{index + 1}</td>

                    <td>
                      <Popover
                        open={Boolean(materialOpen[index])}
                        onOpenChange={(open) =>
                          setMaterialOpen((previous) => ({ ...previous, [index]: open }))
                        }
                      >
                        <PopoverTrigger asChild>
                          <button type="button" role="combobox" className="cf-combo" aria-expanded={Boolean(materialOpen[index])}>
                            <span style={{ minWidth: 0 }}>
                              {item.material_id ? (
                                <>
                                  <span className="block truncate" style={{ fontWeight: 600 }}>
                                    {getMaterialName(selectedMaterial) || item.description || "Selected material"}
                                  </span>
                                  {getMaterialCode(selectedMaterial) && (
                                    <span className="block cf-option__meta">{getMaterialCode(selectedMaterial)}</span>
                                  )}
                                </>
                              ) : (
                                <span className="cf-combo__placeholder">Search materials…</span>
                              )}
                            </span>
                            <ChevronsUpDown aria-hidden />
                          </button>
                        </PopoverTrigger>

                        <PopoverContent align="start" className="w-[400px] p-2">
                          <div style={{ display: "grid", gap: 8 }}>
                            <TextInput
                              autoFocus
                              placeholder="Search by name, code or brand"
                              value={materialSearch[index] || ""}
                              onChange={(event) =>
                                setMaterialSearch((previous) => ({ ...previous, [index]: event.target.value }))
                              }
                            />
                            <div style={{ maxHeight: 320, overflowY: "auto" }}>
                              {materialsLoading ? (
                                <LoadingBlock label="Loading materials…" />
                              ) : filteredMaterials.length === 0 ? (
                                <p className="inos-hint" style={{ padding: "24px 8px", textAlign: "center" }}>
                                  No materials match. Add it in the material master first.
                                </p>
                              ) : (
                                filteredMaterials.map((material) => {
                                  const id = getId(material);
                                  const selected = String(id) === String(item.material_id);
                                  return (
                                    <button
                                      key={id}
                                      type="button"
                                      className={`cf-option${selected ? " is-selected" : ""}`}
                                      onClick={() => populateMaterial(index, id)}
                                    >
                                      <span className="inos-icon-tile inos-icon-tile--sm">
                                        <Package aria-hidden />
                                      </span>
                                      <span style={{ minWidth: 0, flex: 1 }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                                          <span className="truncate">{getMaterialName(material)}</span>
                                          {selected && <Check size={14} color="var(--brand)" aria-hidden />}
                                        </span>
                                        <span className="cf-option__meta">
                                          {getMaterialCode(material) && <span>{getMaterialCode(material)}</span>}
                                          {getMaterialBrand(material) && <span>{getMaterialBrand(material)}</span>}
                                          {getMaterialUnitCode(material) && <span>per {getMaterialUnitCode(material)}</span>}
                                          <span className="tabular">{inr(getMaterialPrice(material))}</span>
                                        </span>
                                      </span>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>

                      {item.material_id && (
                        <div style={{ marginTop: 8 }}>
                          <CheckBox
                            checked={item.update_master}
                            onChange={(event) => updateItem(index, "update_master", event.target.checked)}
                          >
                            Save edits to material master
                          </CheckBox>
                          {item.update_master && (
                            <div className="cf-sub" style={{ color: "var(--brand)" }}>
                              {isMasterUpdating ? "Updating master…" : "Description, brand, spec, unit and rate will sync on save."}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td>
                      <TextInput
                        value={item.description || ""}
                        onChange={(event) => updateItem(index, "description", event.target.value)}
                        placeholder="e.g. 600×600 matt vitrified"
                      />
                    </td>
                    <td>
                      <TextInput
                        value={item.brand || ""}
                        onChange={(event) => updateItem(index, "brand", event.target.value)}
                        placeholder="Brand"
                      />
                    </td>
                    <td>
                      <TextInput
                        value={item.specification || ""}
                        onChange={(event) => updateItem(index, "specification", event.target.value)}
                        placeholder="Size, grade, finish"
                      />
                    </td>
                    <td>
                      <TextInput
                        value={item.unit || ""}
                        onChange={(event) => updateItem(index, "unit", event.target.value)}
                        placeholder="Nos"
                      />
                      {item.unit_id && <div className="cf-sub">Linked to master</div>}
                    </td>
                    <td className="num">
                      <TextInput
                        type="number"
                        min="0"
                        step="0.001"
                        inputMode="decimal"
                        value={item.ordered_quantity ?? ""}
                        onChange={(event) => updateItem(index, "ordered_quantity", event.target.value)}
                        invalid={item.material_id && toNumber(item.ordered_quantity) <= 0}
                      />
                    </td>
                    <td className="num">
                      <Affix pre="₹">
                        <TextInput
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={item.rate ?? ""}
                          onChange={(event) => updateItem(index, "rate", event.target.value)}
                          placeholder="0.00"
                        />
                      </Affix>
                      {item.material_id && (
                        <div className="cf-sub" style={{ textAlign: "right" }}>
                          Master {inr(getMaterialPrice(selectedMaterial))}
                        </div>
                      )}
                    </td>
                    <td className="cf-amount">{inr(item.amount)}</td>
                    <td className="actions">
                      <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                        <IconAction icon={Copy} label="Duplicate line" onClick={() => duplicateItem(index)} />
                        <RemoveRow onClick={() => removeItem(index)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </LineTable>
        </DocSection>

        {/* 3 — Terms + 4 — Review */}
        <DocLayout
          aside={
            <DocSection step={4} title="Review" description="Totals update as you edit lines.">
              <TotalsCard
                plain
                title={null}
                rows={[
                  { label: "Subtotal", value: inr(subtotal) },
                  {
                    label: "Discount (₹)",
                    control: (
                      <TextInput
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        aria-label="Discount in rupees"
                        value={form.discount ?? ""}
                        onChange={(event) => updateForm("discount", event.target.value)}
                      />
                    ),
                  },
                  { label: "Taxable amount", value: inr(taxableAmount) },
                  {
                    label: "GST",
                    control: (
                      <Affix post="%">
                        <TextInput
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          aria-label="GST percentage"
                          value={form.gst_percentage ?? ""}
                          onChange={(event) => updateForm("gst_percentage", event.target.value)}
                        />
                      </Affix>
                    ),
                    value: inr(gstAmount),
                  },
                  {
                    label: "Cartage (₹)",
                    control: (
                      <TextInput
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        aria-label="Cartage in rupees"
                        value={form.cartage ?? ""}
                        onChange={(event) => updateForm("cartage", event.target.value)}
                      />
                    ),
                  },
                ]}
                totalLabel="Grand total"
                total={inr(grandTotal)}
              />
              {missing.length > 0 && (
                <Callout tone="warn" title="Before saving">
                  Add {missing.join(", ")}.
                </Callout>
              )}
              {hasMasterUpdates && (
                <Callout tone="brand" title="Material master will be updated">
                  Checked lines sync their description, brand, spec, unit and rate to the master. This PO keeps its own
                  rates.
                </Callout>
              )}
            </DocSection>
          }
        >
          <DocSection
            step={3}
            title="Terms & delivery"
            description="When it should arrive and anything the vendor must follow."
          >
            <Grid cols={2}>
              <Field label="Expected delivery" optional htmlFor="po-delivery">
                <TextInput
                  id="po-delivery"
                  type="date"
                  min={form.po_date || undefined}
                  value={form.expected_delivery_date || ""}
                  onChange={(event) => updateForm("expected_delivery_date", event.target.value)}
                />
              </Field>
              <div />
              <Field label="Notes" optional full hint="Internal or vendor-facing notes printed on the PO.">
                <TextArea
                  rows={3}
                  value={form.notes || ""}
                  onChange={(event) => updateForm("notes", event.target.value)}
                  placeholder="e.g. Deliver to site gate 2, call supervisor on arrival"
                />
              </Field>
              <Field label="Terms & conditions" optional full>
                <TextArea
                  rows={5}
                  value={form.terms_and_conditions || ""}
                  onChange={(event) => updateForm("terms_and_conditions", event.target.value)}
                  placeholder={"e.g. 50% advance, balance on delivery\nPrices inclusive of loading\nWarranty as per manufacturer"}
                />
              </Field>
            </Grid>
          </DocSection>
        </DocLayout>

        <FormActions
          note={
            <span className="tabular">
              {lineCount} {lineCount === 1 ? "item" : "items"} · Grand total{" "}
              <strong style={{ color: "var(--brand)" }}>{inr(grandTotal)}</strong>
            </span>
          }
          onCancel={onBack}
          extra={
            <Button variant="secondary" icon={Save} onClick={() => handleSave({ status: "DRAFT" })} disabled={isSaving}>
              Save draft
            </Button>
          }
          submitLabel={isEdit ? "Update purchase order" : "Create purchase order"}
          submitting={isSaving}
        />
      </form>
    </Page>
  );
}
