import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatCurrency } from "../../utils/helpers";
import { useAuth } from "../../store/use-auth";
import {
  Plus,
  Trash2,
  Copy,
  GripVertical,
  X,
  Search,
  AlertCircle,
} from "lucide-react";
import { useGetUnitsQuery } from "../../api/unit.api";
import {
  useCreateQuotationMutation,
  useGetQuotationByIdQuery,
  useUpdateQuotationMutation,
  useSubmitQuotationMutation,
} from "../../api/quotation.api";
import {
  useCreateVendorMutation,
  useGetVendorsQuery,
} from "../../api/vendor.api";
import { useGetProjectsQuery } from "../../api/project.api";
import {
  useGetSettingsQuery,
  useGetSettingByKeyQuery,
} from "../../api/settings.api";
import VendorFormModal from "../../components/vendors/VendorFormModal";
const emptyItem = (sno) => ({
  sno,
  particular: "",
  rate: 0,
  quantity: 0,
  amount: 0,
  remarks: "",
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function CreateQuotation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  // Ref to skip the recalc effect right after loading edit data from the API,
  // so the backend values are not immediately overwritten by a stale recalc.
  const isLoadingEdit = useRef(false);

  const [form, setForm] = useState({
    quotation_number: "",
    quotation_date: new Date().toISOString().split("T")[0],
    project_id: "",
    project_name: "",
    site_location: "",
    vendor_id: "",
    vendor_name: "",
    vendor_contact: "",
    vendor_address: "",
    vendor_company: "",
    items: [emptyItem(1)],
    subtotal: 0,
    additional_charges: 0,
    global_discount_type: "fixed",
    global_discount_value: 0,
    discount: 0,
    tax_percent: 0,
    tax_amount: 0,
    total_amount: 0,
    terms_conditions: "",
  });

  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [projectSearch, setProjectSearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [showProjectDD, setShowProjectDD] = useState(false);
  const [showVendorDD, setShowVendorDD] = useState(false);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Row drag-reorder + right-click context menu state
  const [contextMenu, setContextMenu] = useState(null); // { idx, x, y }
  const dragItemIndex = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const { data: units = [] } = useGetUnitsQuery();
  // RTK Query hooks
  const { data: projectsData = [] } = useGetProjectsQuery();
  const { data: vendorsData = [] } = useGetVendorsQuery();
  const { data: settingsData = {} } = useGetSettingsQuery();
  const { data: quotationData } = useGetQuotationByIdQuery(id, {
    skip: !isEdit,
  });
  const { data: termsSetting } = useGetSettingByKeyQuery("terms", {
    skip: isEdit,
  });

  const [createQuotation] = useCreateQuotationMutation();
  const [updateQuotation] = useUpdateQuotationMutation();
  const [submitQuotation] = useSubmitQuotationMutation();
  const getUnitLabel = (unitId) => {
    const unit = units.find((u) => u.id === unitId);
    return unit ? `${unit.code}` : "";
  };
  // Sync projects
  useEffect(() => {
    if (projectsData?.length) setProjects(projectsData);
  }, [projectsData]);

  // Sync vendors
  useEffect(() => {
    if (vendorsData?.length) setVendors(vendorsData);
  }, [vendorsData]);

  // Default terms for new quotations only
  useEffect(() => {
    if (!isEdit && termsSetting?.value?.default_terms) {
      setForm((p) => ({
        ...p,
        terms_conditions: termsSetting.value.default_terms,
      }));
    }
  }, [termsSetting, isEdit]);

  // Load quotation data when editing.
  // We set isLoadingEdit = true so the recalc effect below skips one run
  // and does NOT overwrite the correct values we just loaded from the API.
  useEffect(() => {
    if (isEdit && quotationData) {
      const q = quotationData;

      const items = q.items?.length
        ? q.items.map((item, index) => ({
            ...item,
            sno: index + 1,
            rate: Number(item.rate) || 0,
            quantity: Number(item.quantity) || 0,
            amount: Number(item.amount) || 0,
          }))
        : [emptyItem(1)];

      // Use the pre-computed values from the backend directly.
      const subtotal = Number(q.subtotal) || 0;
      const additional_charges = Number(q.additionalCharges) || 0;
      const global_discount_type =
        q.globalDiscountType || q.global_discount_type || "fixed";
      const global_discount_value =
        Number(q.globalDiscountValue ?? q.global_discount_value) || 0;
      const discount = Number(q.discount) || 0;
      const tax_percent = Number(q.taxPercent ?? q.tax_percent) || 0;
      const tax_amount = Number(q.taxAmount ?? q.tax_amount) || 0;
      const total_amount = Number(q.totalAmount) || 0;

      // Block the recalc effect from firing and overwriting these values.
      isLoadingEdit.current = true;

      setForm({
        quotation_number: q.quotationNumber || "Auto-generated",
        quotation_date:
          q.quotationDate || new Date().toISOString().split("T")[0],
        project_id: q.project_id || q.project?.id || "",
        project_name: q.projectSnapshot?.name || q.project?.name || "",
        site_location:
          q.projectSnapshot?.site_location || q.project?.site_location || "",
        vendor_id: q.vendor_id || q.vendor?.id || "",
        vendor_name: q.vendorSnapshot?.name || q.vendor?.name || "",
        vendor_contact:
          q.vendorSnapshot?.contact_number || q.vendor?.contact_number || "",
        vendor_address: q.vendorSnapshot?.address || q.vendor?.address || "",
        vendor_company:
          q.vendorSnapshot?.company_name || q.vendor?.company_name || "",
        items,
        subtotal,
        additional_charges,
        global_discount_type,
        global_discount_value,
        discount,
        tax_percent,
        tax_amount,
        total_amount,
        terms_conditions: q.termsConditions || "",
      });

      setProjectSearch(q.projectSnapshot?.name || q.project?.name || "");
      setVendorSearch(q.vendorSnapshot?.name || q.vendor?.name || "");
    }
  }, [isEdit, quotationData]);

  // Recalculate totals whenever items or amount fields change.
  // Skips once after the edit data is loaded (isLoadingEdit guard) so the
  // backend values are not immediately zeroed out.
  useEffect(() => {
    if (isLoadingEdit.current) {
      isLoadingEdit.current = false;
      return;
    }

    const subtotal = form.items.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0,
    );
    const addl = Number(form.additional_charges) || 0;
    const discountValue = Number(form.global_discount_value) || 0;
    const discount =
      form.global_discount_type === "percentage"
        ? Math.round(((subtotal * discountValue) / 100) * 100) / 100
        : discountValue;
    const taxPct = Number(form.tax_percent) || 0;
    const taxableAmount = subtotal + addl - discount;
    const taxAmt = Math.round(((taxableAmount * taxPct) / 100) * 100) / 100;
    const total = taxableAmount + taxAmt;

    setForm((p) => ({
      ...p,
      subtotal,
      discount,
      tax_amount: taxAmt,
      total_amount: Math.max(0, total),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(form.items),
    form.additional_charges,
    form.global_discount_type,
    form.global_discount_value,
    form.tax_percent,
  ]);

  // Close the right-click context menu on any outside click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [contextMenu]);

  // ---------------------------------------------------------------------------
  // Item helpers
  // ---------------------------------------------------------------------------
  const updateItem = (idx, field, value) => {
    setUnsavedChanges(true);
    setForm((p) => {
      const items = [...p.items];
      if (field === "rate" || field === "quantity" || field === "amount") {
        let parsed = value === "" ? 0 : Number(value);
        if (isNaN(parsed)) parsed = 0;
        items[idx] = { ...items[idx], [field]: parsed };
        if (field === "rate" || field === "quantity") {
          const rate = field === "rate" ? parsed : Number(items[idx].rate);
          const qty =
            field === "quantity" ? parsed : Number(items[idx].quantity);
          items[idx].amount = Math.round(rate * qty * 100) / 100;
        }
      } else {
        items[idx] = { ...items[idx], [field]: value };
      }
      return { ...p, items };
    });
  };

  const addRow = () => {
    setUnsavedChanges(true);
    setForm((p) => ({
      ...p,
      items: [...p.items, emptyItem(p.items.length + 1)],
    }));
  };

  const deleteRow = (idx) => {
    if (form.items.length === 1) return;
    setUnsavedChanges(true);
    setForm((p) => {
      const items = p.items
        .filter((_, i) => i !== idx)
        .map((item, i) => ({ ...item, sno: i + 1 }));
      return { ...p, items };
    });
  };

  const duplicateRow = (idx) => {
    setUnsavedChanges(true);
    setForm((p) => {
      const items = [...p.items];
      const newItem = { ...items[idx], sno: items.length + 1 };
      items.splice(idx + 1, 0, newItem);
      return { ...p, items: items.map((item, i) => ({ ...item, sno: i + 1 })) };
    });
  };

  const reorderRow = (fromIdx, toIdx) => {
    if (fromIdx === toIdx || fromIdx == null || toIdx == null) return;
    setUnsavedChanges(true);
    setForm((prev) => {
      const items = [...prev.items];
      const [moved] = items.splice(fromIdx, 1);
      items.splice(toIdx, 0, moved);
      return {
        ...prev,
        items: items.map((item, i) => ({ ...item, sno: i + 1 })),
      };
    });
  };

  // ---------------------------------------------------------------------------
  // Drag-to-reorder + right-click menu handlers (grip icon)
  // ---------------------------------------------------------------------------
  const handleGripDragStart = (idx) => (e) => {
    dragItemIndex.current = idx;
    e.dataTransfer.effectAllowed = "move";
    // Some browsers require data to be set for drag to work
    e.dataTransfer.setData("text/plain", String(idx));
  };

  const handleRowDragOver = (idx) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  };

  const handleRowDragLeave = (idx) => () => {
    setDragOverIdx((cur) => (cur === idx ? null : cur));
  };

  const handleRowDrop = (idx) => (e) => {
    e.preventDefault();
    const fromIdx = dragItemIndex.current;
    dragItemIndex.current = null;
    setDragOverIdx(null);
    reorderRow(fromIdx, idx);
  };

  const handleGripDragEnd = () => {
    dragItemIndex.current = null;
    setDragOverIdx(null);
  };

  const handleGripContextMenu = (idx) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ idx, x: e.clientX, y: e.clientY });
  };

  // ---------------------------------------------------------------------------
  // Vendor / Project selection
  // ---------------------------------------------------------------------------
  const selectProject = (project) => {
    setForm((p) => ({
      ...p,
      project_id: project.id,
      project_name: project.name,
      site_location: project.site_location,
    }));
    setProjectSearch(project.name);
    setShowProjectDD(false);
    setUnsavedChanges(true);
  };

  const selectVendor = (vendor) => {
    setForm((p) => ({
      ...p,
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      vendor_contact: vendor.contact_number,
      vendor_address: vendor.address,
      vendor_company: vendor.company_name,
    }));
    setVendorSearch(vendor.name);
    setShowVendorDD(false);
    setUnsavedChanges(true);
  };

  const handleNewVendor = (vendor) => {
    setVendors((prev) => [vendor, ...prev]);
    selectVendor(vendor);
    setShowAddVendor(false);
  };

  // ---------------------------------------------------------------------------
  // Save / Submit
  // ---------------------------------------------------------------------------
  const getPayload = () => ({
    quotation_date: form.quotation_date,
    project_id: form.project_id,
    vendor_id: form.vendor_id,
    items: form.items,
    subtotal: form.subtotal,
    additional_charges: form.additional_charges,
    global_discount_type: form.global_discount_type,
    global_discount_value: form.global_discount_value,
    discount: form.discount,
    tax_percent: form.tax_percent,
    tax_amount: form.tax_amount,
    total_amount: form.total_amount,
    terms_conditions: form.terms_conditions,
    vendor_contact: form.vendor_contact,
    vendor_address: form.vendor_address,
    vendor_company: form.vendor_company,
  });

  const validate = () => {
    if (!form.project_id) return "Please select a project.";
    if (!form.vendor_id) return "Please select a vendor.";
    if (!form.items.some((i) => i.particular.trim()))
      return "Add at least one item.";
    return null;
  };

  const handleSubmitForApproval = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    if (!window.confirm("Submit this quotation for admin approval?")) return;
    setLoading(true);
    setError("");
    try {
      let quotationId = id;
      if (!isEdit) {
        const result = await createQuotation(getPayload()).unwrap();
        quotationId = result.id;
      } else {
        await updateQuotation({ id, ...getPayload() }).unwrap();
      }
      await submitQuotation({
        id: quotationId,
        submitted_by: user?.id,
      }).unwrap();
      setUnsavedChanges(false);
      navigate(`/quotations/${quotationId}`);
    } catch (err) {
      setError(err?.data?.message || "Failed to submit quotation");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Derived filter lists
  // ---------------------------------------------------------------------------
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()),
  );
  const filteredVendors = vendors
    .filter((v) => v.status !== "blacklisted" && v.status !== "blocked")
    .filter(
      (v) =>
        v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
        (v.company_name || "")
          .toLowerCase()
          .includes(vendorSearch.toLowerCase()),
    );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {showAddVendor && (
        <VendorFormModal
          onClose={() => setShowAddVendor(false)}
          onSave={handleNewVendor}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#333333]">
            {isEdit ? "Edit Quotation" : "Create Quotation"}
          </h1>
          {form.quotation_number && (
            <p className="text-sm text-gray-500 mt-0.5">
              {form.quotation_number}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            if (unsavedChanges && !window.confirm("Discard unsaved changes?"))
              return;
            navigate("/quotations");
          }}
          className="text-sm text-gray-500 hover:text-[#333333] flex items-center gap-1.5"
        >
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-md mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Section A: Basic Info */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
          <h2 className="text-sm font-semibold text-[#333333] uppercase tracking-wider mb-4">
            A. Basic Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quotation Number
              </label>
              <input
                value={form.quotation_number || "Auto-generated"}
                readOnly
                className="w-full border border-[#E5E7EB] bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quotation Date *
              </label>
              <input
                type="date"
                value={form.quotation_date}
                onChange={(e) => {
                  setForm((p) => ({ ...p, quotation_date: e.target.value }));
                  setUnsavedChanges(true);
                }}
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C34]"
              />
            </div>

            {/* Vendor Search */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    data-testid="vendor-search-input"
                    value={vendorSearch}
                    onChange={(e) => {
                      setVendorSearch(e.target.value);
                      setShowVendorDD(true);
                      if (!e.target.value) {
                        setForm((p) => ({
                          ...p,
                          vendor_id: "",
                          vendor_name: "",
                          vendor_contact: "",
                          vendor_address: "",
                          vendor_company: "",
                        }));
                      }
                    }}
                    onFocus={() => setShowVendorDD(true)}
                    onBlur={() => setTimeout(() => setShowVendorDD(false), 150)}
                    placeholder="Search vendor..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#1A3C34]"
                  />
                  {showVendorDD && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-md shadow-lg z-20 max-h-48 overflow-y-auto">
                      {filteredVendors.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">
                          No vendors found
                        </div>
                      ) : (
                        filteredVendors.slice(0, 10).map((v) => (
                          <button
                            key={v.id}
                            onMouseDown={() => selectVendor(v)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-[#F3F4F6] last:border-0"
                          >
                            <div className="font-medium text-[#333333]">
                              {v.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {v.company_name}
                              {v.businessType?.name &&
                                ` • ${v.businessType.name}`}
                              {v.contact_number && ` • ${v.contact_number}`}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <button
                  data-testid="add-vendor-btn"
                  onClick={() => setShowAddVendor(true)}
                  className="flex items-center gap-1.5 border border-[#E5E7EB] px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" /> New Vendor
                </button>
              </div>
            </div>

            {form.vendor_id && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    value={form.vendor_contact}
                    onChange={(e) => {
                      setForm((p) => ({
                        ...p,
                        vendor_contact: e.target.value,
                      }));
                      setUnsavedChanges(true);
                    }}
                    className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C34]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    value={form.vendor_company}
                    readOnly
                    className="w-full border border-[#E5E7EB] bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    value={form.vendor_address}
                    onChange={(e) => {
                      setForm((p) => ({
                        ...p,
                        vendor_address: e.target.value,
                      }));
                      setUnsavedChanges(true);
                    }}
                    className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C34]"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section B: Project Info */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
          <h2 className="text-sm font-semibold text-[#333333] uppercase tracking-wider mb-4">
            B. Project Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  data-testid="project-search-input"
                  value={projectSearch}
                  onChange={(e) => {
                    setProjectSearch(e.target.value);
                    setShowProjectDD(true);
                    if (!e.target.value) {
                      setForm((p) => ({
                        ...p,
                        project_id: "",
                        project_name: "",
                        site_location: "",
                      }));
                    }
                  }}
                  onFocus={() => setShowProjectDD(true)}
                  onBlur={() => setTimeout(() => setShowProjectDD(false), 150)}
                  placeholder="Search project..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#1A3C34]"
                />
                {showProjectDD && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-md shadow-lg z-20 max-h-48 overflow-y-auto">
                    {filteredProjects.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-400">
                        No projects found
                      </div>
                    ) : (
                      filteredProjects.slice(0, 10).map((p) => (
                        <button
                          key={p.id}
                          onMouseDown={() => selectProject(p)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-[#F3F4F6] last:border-0"
                        >
                          <div className="font-medium text-[#333333]">
                            {p.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {p.site_location}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Location
              </label>
              <input
                value={form.site_location}
                readOnly
                className="w-full border border-[#E5E7EB] bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Section C: Items Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
          <h2 className="text-sm font-semibold text-[#333333] uppercase tracking-wider mb-4">
            C. Quotation Items
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-[#E5E7EB] rounded-md overflow-hidden">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-16">
                    #
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] min-w-48">
                    Particular
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-24">
                    Rate (₹)
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-20">
                    Qty
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-24">
                    Unit
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-28">
                    Amount (₹)
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] min-w-32">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, idx) => (
                  <tr
                    key={item.sno}
                    onDragOver={handleRowDragOver(idx)}
                    onDragLeave={handleRowDragLeave(idx)}
                    onDrop={handleRowDrop(idx)}
                    className={`border-b border-[#F3F4F6] ${
                      dragOverIdx === idx
                        ? "bg-[#F0F7F5] border-t-2 border-t-[#1A3C34]"
                        : ""
                    }`}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          draggable
                          onDragStart={handleGripDragStart(idx)}
                          onDragEnd={handleGripDragEnd}
                          onContextMenu={handleGripContextMenu(idx)}
                          title="Drag to reorder • right-click for options"
                          className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-gray-100 text-gray-400 flex-shrink-0 flex items-center justify-center"
                        >
                          <GripVertical className="w-4 h-4" />
                        </button>
                        <span className="text-gray-400 text-xs leading-none">
                          {item.sno}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <textarea
                        rows={1}
                        value={item.particular}
                        onChange={(e) =>
                          updateItem(idx, "particular", e.target.value)
                        }
                        className="w-full border border-[#E5E7EB] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1A3C34] resize-none min-h-[32px]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate ?? ""}
                        onChange={(e) =>
                          updateItem(idx, "rate", e.target.value)
                        }
                        className="w-full border border-[#E5E7EB] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1A3C34] text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity ?? ""}
                        onChange={(e) =>
                          updateItem(idx, "quantity", e.target.value)
                        }
                        className="w-full border border-[#E5E7EB] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1A3C34] text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={item.unit_id || ""}
                        onChange={(e) =>
                          updateItem(idx, "unit_id", e.target.value)
                        }
                        className="w-full border border-[#E5E7EB] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1A3C34]"
                      >
                        <option value="">Select</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.code}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.amount ?? ""}
                        onChange={(e) =>
                          updateItem(idx, "amount", e.target.value)
                        }
                        className="w-full border border-[#E5E7EB] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1A3C34] text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={item.remarks}
                        onChange={(e) =>
                          updateItem(idx, "remarks", e.target.value)
                        }
                        className="w-full border border-[#E5E7EB] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1A3C34]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            data-testid="add-item-btn"
            onClick={addRow}
            className="mt-3 flex items-center gap-1.5 text-sm text-[#1A3C34] hover:text-red-700 font-medium"
          >
            <Plus className="w-4 h-4" /> Add Row
          </button>

          {/* Totals */}
          <div className="mt-4 border-t border-[#E5E7EB] pt-4">
            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-[#333333]">
                    {formatCurrency(form.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Additional Charges</span>
                  <input
                    type="number"
                    min="0"
                    value={form.additional_charges || ""}
                    onChange={(e) => {
                      setForm((p) => ({
                        ...p,
                        additional_charges: Number(e.target.value),
                      }));
                      setUnsavedChanges(true);
                    }}
                    className="w-28 border border-[#E5E7EB] rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#1A3C34]"
                  />
                </div>

                {/* Discount */}
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Discount</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex border border-[#E5E7EB] rounded overflow-hidden">
                      <button
                        type="button"
                        data-testid="discount-type-fixed"
                        onClick={() => {
                          setForm((p) => ({
                            ...p,
                            global_discount_type: "fixed",
                          }));
                          setUnsavedChanges(true);
                        }}
                        className={`px-2 py-1 text-xs font-semibold transition-colors ${
                          form.global_discount_type === "fixed"
                            ? "bg-[#1A3C34] text-white"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        ₹
                      </button>
                      <button
                        type="button"
                        data-testid="discount-type-percentage"
                        onClick={() => {
                          setForm((p) => ({
                            ...p,
                            global_discount_type: "percentage",
                          }));
                          setUnsavedChanges(true);
                        }}
                        className={`px-2 py-1 text-xs font-semibold border-l border-[#E5E7EB] transition-colors ${
                          form.global_discount_type === "percentage"
                            ? "bg-[#1A3C34] text-white"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        %
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      data-testid="discount-value-input"
                      value={form.global_discount_value || ""}
                      onChange={(e) => {
                        setForm((p) => ({
                          ...p,
                          global_discount_value: Number(e.target.value),
                        }));
                        setUnsavedChanges(true);
                      }}
                      className="w-20 border border-[#E5E7EB] rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#1A3C34]"
                    />
                  </div>
                </div>
                {form.discount > 0 && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Discount applied</span>
                    <span>- {formatCurrency(form.discount)}</span>
                  </div>
                )}

                {/* Tax */}
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Tax (%)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    data-testid="tax-percent-input"
                    value={form.tax_percent ?? ""}
                    onChange={(e) => {
                      setForm((p) => ({
                        ...p,
                        tax_percent:
                          e.target.value === "" ? 0 : Number(e.target.value),
                      }));
                      setUnsavedChanges(true);
                    }}
                    className="w-28 border border-[#E5E7EB] rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#1A3C34]"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Tax amount</span>
                  <span>{formatCurrency(form.tax_amount)}</span>
                </div>

                <div className="flex justify-between text-sm font-bold border-t border-[#E5E7EB] pt-2">
                  <span className="text-[#333333]">Grand Total</span>
                  <span className="text-[#1A3C34] text-base">
                    {formatCurrency(form.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
          <h2 className="text-sm font-semibold text-[#333333] uppercase tracking-wider mb-3">
            Terms & Conditions
          </h2>
          <textarea
            rows={4}
            value={form.terms_conditions}
            onChange={(e) => {
              setForm((p) => ({ ...p, terms_conditions: e.target.value }));
              setUnsavedChanges(true);
            }}
            placeholder="Enter terms and conditions..."
            className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C34] resize-y"
          />
        </div>

        {/* Actions */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 flex flex-wrap gap-3">
          <button
            data-testid="submit-approval-btn"
            onClick={handleSubmitForApproval}
            disabled={loading}
            className="bg-[#1A3C34] text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-[#1A3C34] disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit for Approval"}
          </button>
        </div>
      </div>

      {/* Right-click dropdown for the row grip icon */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-[#E5E7EB] rounded-md shadow-lg py-1 w-36"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              duplicateRow(contextMenu.idx);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600"
          >
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </button>
          <button
            onClick={() => {
              deleteRow(contextMenu.idx);
              setContextMenu(null);
            }}
            disabled={form.items.length === 1}
            className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-500 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
