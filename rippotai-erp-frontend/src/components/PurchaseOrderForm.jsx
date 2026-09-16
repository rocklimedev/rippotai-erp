import React, { useEffect, useMemo, useState } from "react";
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  onBack,
  onSuccess,
}) {
  const isEdit = Boolean(initialData?.id);

  const [form, setForm] = useState(() => {
    if (!initialData) return emptyForm;

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

  const buildPayload = () => {
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

      status: form.status || "DRAFT",

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

  const handleSave = async () => {
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

      const payload = buildPayload();

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="flex min-h-[72px] items-center justify-between gap-4 px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button type="button" variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1F453B] text-white">
              <ShoppingCart className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">
                {isEdit ? "Edit Purchase Order" : "Create Purchase Order"}
              </h1>

              <p className="text-xs text-muted-foreground">
                Procurement / Purchase Orders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSaving}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#1F453B] hover:bg-[#17362f]"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}

              {isEdit ? "Update PO" : "Save PO"}
            </Button>
          </div>
        </div>
      </header>

      {/* =====================================================
          BODY
          ===================================================== */}

      <main className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-[1800px] space-y-6">
          {/* =================================================
              BASIC INFORMATION
              ================================================= */}

          <section className="rounded-xl border bg-card">
            <div className="flex items-center gap-3 border-b px-5 py-4">
              <FileText className="h-5 w-5 text-[#1F453B]" />

              <div>
                <h2 className="font-semibold">Purchase Order Details</h2>

                <p className="text-xs text-muted-foreground">
                  Basic PO and procurement information
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
              {/* PROJECT */}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Project
                  <span className="ml-1 text-destructive">*</span>
                </label>

                <Select
                  value={form.project_id || ""}
                  onValueChange={(value) => updateForm("project_id", value)}
                  disabled={projectsLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        projectsLoading
                          ? "Loading projects..."
                          : "Select project"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {projects.map((project) => {
                      const id = getId(project);

                      if (!id) return null;

                      return (
                        <SelectItem key={id} value={String(id)}>
                          {getProjectName(project)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {selectedProject && (
                  <p className="text-xs text-muted-foreground">
                    {getProjectName(selectedProject)}
                  </p>
                )}
              </div>

              {/* SITE */}

              <div className="space-y-2">
                <label className="text-sm font-medium">Site</label>

                <Select
                  value={form.site_id || ""}
                  onValueChange={(value) => updateForm("site_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>

                  <SelectContent>
                    {Array.isArray(selectedProject?.sites) &&
                      selectedProject.sites.map((site) => {
                        const id = getId(site);

                        if (!id) return null;

                        return (
                          <SelectItem key={id} value={String(id)}>
                            {getSiteName(site)}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>

              {/* VENDOR */}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Vendor
                  <span className="ml-1 text-destructive">*</span>
                </label>

                <Select
                  value={form.vendor_id || ""}
                  onValueChange={(value) => updateForm("vendor_id", value)}
                  disabled={vendorsLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        vendorsLoading ? "Loading vendors..." : "Select vendor"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {vendors.map((vendor) => {
                      const id = getId(vendor);

                      if (!id) return null;

                      return (
                        <SelectItem key={id} value={String(id)}>
                          {getVendorName(vendor)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* PO NUMBER */}

              <div className="space-y-2">
                <label className="text-sm font-medium">PO Number</label>

                <Input
                  value={form.po_number || ""}
                  onChange={(event) =>
                    updateForm("po_number", event.target.value)
                  }
                  placeholder="Auto-generated if blank"
                />
              </div>

              {/* PO DATE */}

              <div className="space-y-2">
                <label className="text-sm font-medium">PO Date</label>

                <Input
                  type="date"
                  value={form.po_date || ""}
                  onChange={(event) =>
                    updateForm("po_date", event.target.value)
                  }
                />
              </div>

              {/* EXPECTED DELIVERY */}

              <div className="space-y-2">
                <label className="text-sm font-medium">Expected Delivery</label>

                <Input
                  type="date"
                  value={form.expected_delivery_date || ""}
                  onChange={(event) =>
                    updateForm("expected_delivery_date", event.target.value)
                  }
                />
              </div>

              {/* STATUS */}

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>

                <Select
                  value={form.status || "DRAFT"}
                  onValueChange={(value) => updateForm("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>

                    <SelectItem value="PENDING_APPROVAL">
                      Pending Approval
                    </SelectItem>

                    <SelectItem value="APPROVED">Approved</SelectItem>

                    <SelectItem value="SENT">Sent</SelectItem>

                    <SelectItem value="PARTIALLY_RECEIVED">
                      Partially Received
                    </SelectItem>

                    <SelectItem value="RECEIVED">Received</SelectItem>

                    <SelectItem value="CANCELLED">Cancelled</SelectItem>

                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* SOURCE */}

              <div className="space-y-2">
                <label className="text-sm font-medium">Source</label>

                <Select
                  value={form.source_type || "MANUAL"}
                  onValueChange={(value) => updateForm("source_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="MANUAL">Manual</SelectItem>

                    <SelectItem value="ESTIMATE">Estimate</SelectItem>

                    <SelectItem value="BOQ">BOQ</SelectItem>

                    <SelectItem value="QUOTATION">Quotation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* =================================================
              VENDOR INFORMATION
              ================================================= */}

          <section className="rounded-xl border bg-card">
            <div className="flex items-center gap-3 border-b px-5 py-4">
              <Building2 className="h-5 w-5 text-[#1F453B]" />

              <div>
                <h2 className="font-semibold">Vendor Information</h2>

                <p className="text-xs text-muted-foreground">
                  Vendor contact information
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Agency / Company</label>

                <Input
                  value={form.agency_name || ""}
                  onChange={(event) =>
                    updateForm("agency_name", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Person</label>

                <Input
                  value={form.contact_person || ""}
                  onChange={(event) =>
                    updateForm("contact_person", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>

                <Input
                  value={form.phone || ""}
                  onChange={(event) => updateForm("phone", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>

                <Input
                  type="email"
                  value={form.email || ""}
                  onChange={(event) => updateForm("email", event.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2 xl:col-span-4">
                <label className="text-sm font-medium">Address</label>

                <Textarea
                  value={form.address || ""}
                  onChange={(event) =>
                    updateForm("address", event.target.value)
                  }
                  rows={2}
                />
              </div>
            </div>
          </section>

          {/* =================================================
              MATERIALS
              ================================================= */}

          <section className="overflow-hidden rounded-xl border bg-card">
            <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-[#1F453B]" />

                <div>
                  <h2 className="font-semibold">Materials</h2>

                  <p className="text-xs text-muted-foreground">
                    Add materials and procurement quantities
                  </p>
                </div>
              </div>

              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1500px] border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs font-medium">
                    <th className="w-12 px-3 py-3">#</th>

                    <th className="min-w-[280px] px-3 py-3">Material</th>

                    <th className="min-w-[180px] px-3 py-3">Description</th>

                    <th className="min-w-[130px] px-3 py-3">Brand</th>

                    <th className="min-w-[220px] px-3 py-3">Specification</th>

                    <th className="min-w-[100px] px-3 py-3">Unit</th>

                    <th className="min-w-[110px] px-3 py-3">Qty</th>

                    <th className="min-w-[130px] px-3 py-3">Rate</th>

                    <th className="min-w-[130px] px-3 py-3 text-right">
                      Amount
                    </th>

                    <th className="min-w-[180px] px-3 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {calculatedItems.map((item, index) => {
                    const filteredMaterials = getFilteredMaterials(index);

                    const isMasterUpdating =
                      item.material_id &&
                      savingMasterIds.includes(item.material_id);

                    return (
                      <tr
                        key={item.id || `new-${index}`}
                        className={cn(
                          "border-b align-top",
                          item.update_master && "bg-[#1F453B]/[0.025]",
                        )}
                      >
                        {/* NUMBER */}

                        <td className="px-3 py-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-medium">
                            {index + 1}
                          </div>
                        </td>

                        {/* MATERIAL */}

                        <td className="px-3 py-4">
                          <Popover
                            open={Boolean(materialOpen[index])}
                            onOpenChange={(open) =>
                              setMaterialOpen((previous) => ({
                                ...previous,
                                [index]: open,
                              }))
                            }
                          >
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                className="h-auto min-h-10 w-full justify-between text-left font-normal"
                              >
                                <div className="min-w-0">
                                  {item.material_id ? (
                                    <div className="min-w-0">
                                      <div className="truncate font-medium">
                                        {getMaterialName(
                                          materials.find(
                                            (material) =>
                                              String(getId(material)) ===
                                              String(item.material_id),
                                          ),
                                        ) ||
                                          item.description ||
                                          "Selected Material"}
                                      </div>

                                      {(() => {
                                        const material = materials.find(
                                          (material) =>
                                            String(getId(material)) ===
                                            String(item.material_id),
                                        );

                                        const code = getMaterialCode(material);

                                        return code ? (
                                          <div className="text-[11px] text-muted-foreground">
                                            {code}
                                          </div>
                                        ) : null;
                                      })()}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      Select material
                                    </span>
                                  )}
                                </div>

                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>

                            <PopoverContent
                              align="start"
                              className="w-[420px] p-2"
                            >
                              <div className="space-y-2">
                                <Input
                                  autoFocus
                                  placeholder="Search material, code, brand..."
                                  value={materialSearch[index] || ""}
                                  onChange={(event) =>
                                    setMaterialSearch((previous) => ({
                                      ...previous,
                                      [index]: event.target.value,
                                    }))
                                  }
                                />

                                <div className="max-h-[320px] overflow-y-auto">
                                  {materialsLoading ? (
                                    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Loading materials...
                                    </div>
                                  ) : filteredMaterials.length === 0 ? (
                                    <div className="py-8 text-center text-sm text-muted-foreground">
                                      No materials found
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      {filteredMaterials.map((material) => {
                                        const id = getId(material);

                                        const selected =
                                          String(id) ===
                                          String(item.material_id);

                                        return (
                                          <button
                                            key={id}
                                            type="button"
                                            className={cn(
                                              "flex w-full items-start gap-3 rounded-md p-3 text-left hover:bg-muted",
                                              selected && "bg-muted",
                                            )}
                                            onClick={() =>
                                              populateMaterial(index, id)
                                            }
                                          >
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1F453B]/10 text-[#1F453B]">
                                              <Package className="h-4 w-4" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-2">
                                                <span className="truncate text-sm font-medium">
                                                  {getMaterialName(material)}
                                                </span>

                                                {selected && (
                                                  <Check className="h-4 w-4 shrink-0 text-[#1F453B]" />
                                                )}
                                              </div>

                                              <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                                {getMaterialCode(material) && (
                                                  <span>
                                                    Code:{" "}
                                                    {getMaterialCode(material)}
                                                  </span>
                                                )}

                                                {getMaterialBrand(material) && (
                                                  <span>
                                                    Brand:{" "}
                                                    {getMaterialBrand(material)}
                                                  </span>
                                                )}

                                                {getMaterialUnitCode(
                                                  material,
                                                ) && (
                                                  <span>
                                                    Unit:{" "}
                                                    {getMaterialUnitCode(
                                                      material,
                                                    )}
                                                  </span>
                                                )}

                                                <span>
                                                  Rate: ₹
                                                  {money(
                                                    getMaterialPrice(material),
                                                  )}
                                                </span>
                                              </div>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>

                          {/* MASTER UPDATE CHECKBOX */}

                          {item.material_id && (
                            <label
                              className={cn(
                                "mt-2 flex cursor-pointer items-start gap-2 rounded-md border px-2.5 py-2 transition-colors",
                                item.update_master
                                  ? "border-[#1F453B]/30 bg-[#1F453B]/5"
                                  : "border-transparent",
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(item.update_master)}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "update_master",
                                    event.target.checked,
                                  )
                                }
                                className="mt-0.5 h-3.5 w-3.5 rounded border-input accent-[#1F453B]"
                              />

                              <div>
                                <div
                                  className={cn(
                                    "text-xs font-medium",
                                    item.update_master
                                      ? "text-[#1F453B]"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  Save changes to Material Master
                                </div>

                                {item.update_master && (
                                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                                    Edited master fields will be updated when
                                    this PO is saved.
                                  </div>
                                )}
                              </div>
                            </label>
                          )}
                        </td>

                        {/* DESCRIPTION */}

                        <td className="px-3 py-4">
                          <Input
                            value={item.description || ""}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "description",
                                event.target.value,
                              )
                            }
                            className={cn(
                              item.update_master &&
                                "border-[#1F453B]/40 ring-1 ring-[#1F453B]/10",
                            )}
                            placeholder="Description"
                          />
                        </td>

                        {/* BRAND */}

                        <td className="px-3 py-4">
                          <Input
                            value={item.brand || ""}
                            onChange={(event) =>
                              updateItem(index, "brand", event.target.value)
                            }
                            className={cn(
                              item.update_master &&
                                "border-[#1F453B]/40 ring-1 ring-[#1F453B]/10",
                            )}
                            placeholder="Brand"
                          />
                        </td>

                        {/* SPECIFICATION */}

                        <td className="px-3 py-4">
                          <Input
                            value={item.specification || ""}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "specification",
                                event.target.value,
                              )
                            }
                            className={cn(
                              item.update_master &&
                                "border-[#1F453B]/40 ring-1 ring-[#1F453B]/10",
                            )}
                            placeholder="Specification"
                          />
                        </td>

                        {/* UNIT */}

                        <td className="px-3 py-4">
                          <Input
                            value={item.unit || ""}
                            onChange={(event) =>
                              updateItem(index, "unit", event.target.value)
                            }
                            className={cn(
                              item.update_master &&
                                "border-[#1F453B]/40 ring-1 ring-[#1F453B]/10",
                            )}
                            placeholder="Nos"
                          />

                          {item.unit_id && (
                            <div className="mt-1 text-[10px] text-muted-foreground">
                              Master Unit Linked
                            </div>
                          )}
                        </td>

                        {/* QUANTITY */}

                        <td className="px-3 py-4">
                          <Input
                            type="number"
                            min="0"
                            step="0.001"
                            value={item.ordered_quantity ?? ""}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "ordered_quantity",
                                event.target.value,
                              )
                            }
                          />
                        </td>

                        {/* RATE */}

                        <td className="px-3 py-4">
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              ₹
                            </span>

                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate ?? ""}
                              onChange={(event) =>
                                updateItem(index, "rate", event.target.value)
                              }
                              className={cn(
                                "pl-7",
                                item.update_master &&
                                  "border-[#1F453B]/50 ring-1 ring-[#1F453B]/20",
                              )}
                            />
                          </div>

                          {item.material_id && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                              <RefreshCw className="h-3 w-3" />
                              Master: ₹
                              {money(
                                getMaterialPrice(
                                  materials.find(
                                    (material) =>
                                      String(getId(material)) ===
                                      String(item.material_id),
                                  ),
                                ),
                              )}
                            </div>
                          )}
                        </td>

                        {/* AMOUNT */}

                        <td className="px-3 py-4 text-right">
                          <div className="pt-2 font-medium">
                            ₹{money(item.amount)}
                          </div>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-3 py-4">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => duplicateItem(index)}
                              title="Duplicate"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {item.update_master && item.material_id && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-[#1F453B]">
                              {isMasterUpdating ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Updating master...
                                </>
                              ) : (
                                <>
                                  <Check className="h-3 w-3" />
                                  Master update enabled
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* EMPTY / ADD */}

            <div className="border-t bg-muted/20 px-5 py-3">
              <Button
                type="button"
                variant="ghost"
                onClick={addItem}
                className="text-[#1F453B]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add another material
              </Button>
            </div>
          </section>

          {/* =================================================
              CALCULATIONS
              ================================================= */}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
            {/* NOTES */}

            <section className="rounded-xl border bg-card">
              <div className="flex items-center gap-3 border-b px-5 py-4">
                <FileText className="h-5 w-5 text-[#1F453B]" />

                <div>
                  <h2 className="font-semibold">Notes & Terms</h2>

                  <p className="text-xs text-muted-foreground">
                    Additional PO instructions
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>

                  <Textarea
                    rows={5}
                    value={form.notes || ""}
                    onChange={(event) =>
                      updateForm("notes", event.target.value)
                    }
                    placeholder="Add notes..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Terms & Conditions
                  </label>

                  <Textarea
                    rows={7}
                    value={form.terms_and_conditions || ""}
                    onChange={(event) =>
                      updateForm("terms_and_conditions", event.target.value)
                    }
                    placeholder="Add terms and conditions..."
                  />
                </div>
              </div>
            </section>

            {/* TOTALS */}

            <section className="h-fit rounded-xl border bg-card">
              <div className="flex items-center gap-3 border-b px-5 py-4">
                <Calculator className="h-5 w-5 text-[#1F453B]" />

                <div>
                  <h2 className="font-semibold">Order Summary</h2>

                  <p className="text-xs text-muted-foreground">
                    PO calculation
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>

                  <span className="font-medium">₹{money(subtotal)}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <label className="text-muted-foreground">Discount</label>

                    <div className="w-32">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.discount ?? ""}
                        onChange={(event) =>
                          updateForm("discount", event.target.value)
                        }
                        className="h-8 text-right"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Taxable Amount</span>

                  <span>₹{money(taxableAmount)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">GST</span>

                    <div className="w-20">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.gst_percentage ?? ""}
                        onChange={(event) =>
                          updateForm("gst_percentage", event.target.value)
                        }
                        className="h-8 text-right"
                      />
                    </div>

                    <span className="text-muted-foreground">%</span>
                  </div>

                  <span>₹{money(gstAmount)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cartage</span>

                  <div className="w-32">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.cartage ?? ""}
                      onChange={(event) =>
                        updateForm("cartage", event.target.value)
                      }
                      className="h-8 text-right"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Grand Total
                      </div>

                      <div className="mt-1 text-2xl font-bold text-[#1F453B]">
                        ₹{money(grandTotal)}
                      </div>
                    </div>

                    <ShoppingCart className="h-6 w-6 text-[#1F453B]" />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* =================================================
              MASTER UPDATE INFORMATION
              ================================================= */}

          {calculatedItems.some(
            (item) => item.update_master && item.material_id,
          ) && (
            <section className="rounded-xl border border-[#1F453B]/20 bg-[#1F453B]/5">
              <div className="flex gap-3 p-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1F453B]/10 text-[#1F453B]">
                  <Check className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#1F453B]">
                    Material Master updates enabled
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    The checked material lines will update their Material Master
                    description, brand, specification, price, unit and HSN when
                    this Purchase Order is saved.
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    The Purchase Order keeps its own historical rate, so
                    changing the master later will not change existing PO
                    values.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* =================================================
              VALIDATION NOTE
              ================================================= */}

          {!form.project_id ||
          !form.vendor_id ||
          calculatedItems.every((item) => !item.material_id) ? (
            <section className="rounded-xl border border-amber-200 bg-amber-50/60">
              <div className="flex gap-3 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                <div>
                  <h3 className="text-sm font-medium text-amber-900">
                    Before saving
                  </h3>

                  <ul className="mt-1 space-y-1 text-xs text-amber-800">
                    {!form.project_id && <li>Select a project.</li>}

                    {!form.vendor_id && <li>Select a vendor.</li>}

                    {calculatedItems.every((item) => !item.material_id) && (
                      <li>Add at least one material.</li>
                    )}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </main>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="sticky bottom-0 z-20 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-6 py-4">
          <div className="text-xs text-muted-foreground">
            {calculatedItems.length}{" "}
            {calculatedItems.length === 1 ? "material" : "materials"} · Subtotal
            ₹{money(subtotal)}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Grand Total</div>

              <div className="text-lg font-bold text-[#1F453B]">
                ₹{money(grandTotal)}
              </div>
            </div>

            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#1F453B] px-6 hover:bg-[#17362f]"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}

              {isEdit ? "Update Purchase Order" : "Create Purchase Order"}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
