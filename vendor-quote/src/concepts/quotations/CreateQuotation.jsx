import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatCurrency } from "../../utils/helpers";
import { useAuth } from "../../store/use-auth";
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  X,
  Search,
  AlertCircle,
} from "lucide-react";

// Import RTK Query hooks
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
import { useGetProjectsQuery } from "../../api/project.api"; // Assuming you have this
import { useGetSettingsQuery } from "../../api/settings.api";
const emptyItem = (sno) => ({
  sno,
  particular: "",
  rate: 0,
  quantity: 0,
  amount: 0,
  remarks: "",
});

// Add Vendor Modal
function AddVendorModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    company_name: "",
    position: "",
    vendor_category: "",
    type_of_business: "",
    contact_number: "",
    alternate_contact: "",
    address: "",
    notes: "",
    status: "active",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [duplicates, setDuplicates] = useState([]);

  const [createVendor] = useCreateVendorMutation();

  const VENDOR_CATEGORIES = {
    Material: [
      "Paint",
      "Wiring",
      "Glass",
      "Metal",
      "Tiles",
      "Cement",
      "Sand",
      "Steel",
      "Wood",
      "Flooring",
      "Plumbing Materials",
      "Electrical Materials",
      "Hardware",
    ],
    Contractor: [
      "Labour",
      "Labour Contractor",
      "Civil Contractor",
      "Electrician",
      "Plumbing Contractor",
      "Painter",
      "Polishing",
      "AC Work",
      "Interior Contractor",
      "Carpenter",
      "Mason",
      "Material Contractor",
    ],
  };

  const checkDuplicates = useCallback(async () => {
    if (!form.contact_number) return;
    try {
      // TODO: You need to create a check-duplicate endpoint in your API
      // For now, we'll skip this or implement it later
      setDuplicates([]);
    } catch {}
  }, [form.contact_number]);

  useEffect(() => {
    const t = setTimeout(checkDuplicates, 600);
    return () => clearTimeout(t);
  }, [checkDuplicates]);

  const availableTypes = form.vendor_category
    ? VENDOR_CATEGORIES[form.vendor_category] || []
    : [...VENDOR_CATEGORIES.Material, ...VENDOR_CATEGORIES.Contractor];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await createVendor(form).unwrap();
      onSave(result);
    } catch (err) {
      setError(err?.data?.message || "Failed to create vendor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#333333]">
            Add New Vendor
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded">
              {error}
            </div>
          )}
          {duplicates.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-center gap-1.5 text-yellow-700 text-xs font-medium mb-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Possible duplicates found
              </div>
              {duplicates.map((d) => (
                <div key={d.id} className="text-xs text-yellow-600">
                  {d.name} - {d.contact_number}
                </div>
              ))}
            </div>
          )}
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Vendor Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["Material", "Contractor"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      vendor_category: cat,
                      type_of_business: "",
                    }))
                  }
                  className={`py-2 text-sm font-semibold rounded-md border-2 transition-all ${
                    form.vendor_category === cat
                      ? "bg-[#E31E24] text-white border-[#E31E24]"
                      : "border-[#E5E7EB] text-gray-600 hover:border-[#E31E24] hover:text-[#E31E24]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Vendor Name *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#E31E24]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                value={form.company_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, company_name: e.target.value }))
                }
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#E31E24]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Contact Number *
              </label>
              <input
                required
                value={form.contact_number}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contact_number: e.target.value }))
                }
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#E31E24]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type of Business
                {form.vendor_category ? ` (${form.vendor_category})` : ""}
              </label>
              <select
                value={form.type_of_business}
                onChange={(e) =>
                  setForm((p) => ({ ...p, type_of_business: e.target.value }))
                }
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#E31E24]"
              >
                <option value="">Select type...</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                value={form.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#E31E24]"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#E5E7EB] text-sm font-medium py-2 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              data-testid="save-vendor-btn"
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#E31E24] text-white text-sm font-medium py-2 rounded hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateQuotation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

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
    discount: 0,
    tax: 0,
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
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // RTK Query hooks
  const { data: projectsData = [] } = useGetProjectsQuery();
  const { data: vendorsData = [] } = useGetVendorsQuery();
  const { data: settingsData = {} } = useGetSettingsQuery();
  const { data: quotationData } = useGetQuotationByIdQuery(id, {
    skip: !isEdit,
  });

  const [createQuotation] = useCreateQuotationMutation();
  const [updateQuotation] = useUpdateQuotationMutation();
  const [submitQuotation] = useSubmitQuotationMutation();

  // Sync RTK Query data to component state
  useEffect(() => {
    if (projectsData?.length) {
      setProjects(projectsData);
    }
  }, [projectsData]);

  useEffect(() => {
    if (vendorsData?.length) {
      setVendors(vendorsData);
    }
  }, [vendorsData]);

  useEffect(() => {
    if (settingsData?.terms) {
      setSettings(settingsData);
      if (!isEdit) {
        const terms = settingsData.terms.default_terms || "";
        setForm((p) => ({ ...p, terms_conditions: terms }));
      }
    }
  }, [settingsData, isEdit]);

  // Load quotation data if editing
  // Load quotation data if editing
  useEffect(() => {
    if (isEdit && quotationData) {
      const q = quotationData; // Your API response (matches the JSON you shared)

      setForm({
        quotation_number: q.quotationNumber || "Auto-generated",
        quotation_date:
          q.quotationDate || new Date().toISOString().split("T")[0],

        // Project
        project_id: q.project_id || q.project?.id || "",
        project_name: q.projectSnapshot?.name || q.project?.name || "",
        site_location:
          q.projectSnapshot?.site_location || q.project?.site_location || "",

        // Vendor
        vendor_id: q.vendor_id || q.vendor?.id || "",
        vendor_name: q.vendorSnapshot?.name || q.vendor?.name || "",
        vendor_contact:
          q.vendorSnapshot?.contact_number || q.vendor?.contact_number || "",
        vendor_address: q.vendorSnapshot?.address || q.vendor?.address || "",
        vendor_company:
          q.vendorSnapshot?.company_name || q.vendor?.company_name || "",

        // Items
        items: q.items?.length
          ? q.items.map((item, index) => ({
              ...item,
              sno: index + 1,
              rate: Number(item.rate) || 0,
              quantity: Number(item.quantity) || 0,
              amount: Number(item.amount) || 0,
            }))
          : [emptyItem(1)],

        // Amounts
        subtotal: Number(q.subtotal) || 0,
        additional_charges: Number(q.additionalCharges) || 0,
        discount: Number(q.discount) || 0,
        tax: Number(q.taxPercent) || 0, // or q.taxAmount if you store amount
        total_amount: Number(q.totalAmount) || 0,

        terms_conditions: q.termsConditions || "",
      });

      // Set search fields for dropdowns
      setProjectSearch(q.projectSnapshot?.name || q.project?.name || "");
      setVendorSearch(q.vendorSnapshot?.name || q.vendor?.name || "");
    }
  }, [isEdit, quotationData]);
  useEffect(() => {
    recalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.items, form.additional_charges, form.discount, form.tax, settings]);

  const recalculate = () => {
    const subtotal = form.items.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0,
    );
    const amtSettings = settings?.amount_settings || {};
    const addl = amtSettings.show_additional_charges
      ? Number(form.additional_charges) || 0
      : 0;
    const disc = amtSettings.show_discount ? Number(form.discount) || 0 : 0;
    const taxPct = amtSettings.show_tax
      ? Number(amtSettings.tax_percentage || form.tax || 0)
      : 0;
    const taxAmt = ((subtotal + addl - disc) * taxPct) / 100;
    const total = subtotal + addl - disc + taxAmt;
    setForm((p) => ({ ...p, subtotal, total_amount: Math.max(0, total) }));
  };

  const updateItem = (idx, field, value) => {
    setUnsavedChanges(true);

    setForm((p) => {
      const items = [...p.items];
      let parsedValue = null;

      if (field === "rate" || field === "quantity" || field === "amount") {
        // Allow empty during typing, but convert to number for storage
        parsedValue = value === "" ? 0 : Number(value);

        // Prevent NaN
        if (isNaN(parsedValue)) parsedValue = 0;

        items[idx] = {
          ...items[idx],
          [field]: parsedValue,
        };

        // Auto-calculate amount
        if (field === "rate" || field === "quantity") {
          const rate = field === "rate" ? parsedValue : Number(items[idx].rate);
          const qty =
            field === "quantity" ? parsedValue : Number(items[idx].quantity);
          items[idx].amount = Math.round(rate * qty * 100) / 100;
        }
      } else {
        // For text fields (particular, remarks)
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
  const moveRow = (idx, dir) => {
    setUnsavedChanges(true);

    setForm((prev) => {
      const items = [...prev.items];
      const newIdx = idx + dir;

      if (newIdx < 0 || newIdx >= items.length) return prev;

      // Swap items
      [items[idx], items[newIdx]] = [items[newIdx], items[idx]];

      // Re-number sno correctly
      const updatedItems = items.map((item, i) => ({
        ...item,
        sno: i + 1,
      }));

      return { ...prev, items: updatedItems };
    });
  };

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

  const getPayload = () => ({
    quotation_date: form.quotation_date,
    project_id: form.project_id,
    vendor_id: form.vendor_id,
    items: form.items,
    subtotal: form.subtotal,
    additional_charges: form.additional_charges,
    discount: form.discount,
    tax: form.tax,
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

  const handleSaveDraft = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (isEdit) {
        await updateQuotation({ id, ...getPayload() }).unwrap();
        setUnsavedChanges(false);
        navigate(`/quotations/${id}`);
      } else {
        const result = await createQuotation(getPayload()).unwrap();
        setUnsavedChanges(false);
        navigate(`/quotations/${result.id}`, { replace: true });
      }
    } catch (err) {
      setError(err?.data?.message || "Failed to save quotation");
    } finally {
      setLoading(false);
    }
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

  const amtSettings = settings?.amount_settings || {};
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {showAddVendor && (
        <AddVendorModal
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
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#E31E24]"
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
                    placeholder="Search vendor..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#E31E24]"
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
                              {v.company_name} · {v.contact_number}
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
                    className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#E31E24]"
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
                    className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#E31E24]"
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
                  placeholder="Search project..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#E31E24]"
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
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-10">
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
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-28">
                    Amount (₹)
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] min-w-32">
                    Remarks
                  </th>
                  <th className="px-3 py-2 border-b border-[#E5E7EB] w-24"></th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, idx) => (
                  <tr key={item.sno} className="border-b border-[#F3F4F6]">
                    <td className="px-3 py-2 text-gray-400 text-center">
                      {item.sno}
                    </td>
                    <td className="px-3 py-2">
                      <textarea
                        rows={1}
                        value={item.particular}
                        onChange={(e) =>
                          updateItem(idx, "particular", e.target.value)
                        }
                        className="w-full border border-[#E5E7EB] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#E31E24] resize-none min-h-[32px]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate ?? ""} // Use ?? instead of ||
                        onChange={(e) =>
                          updateItem(idx, "rate", e.target.value)
                        }
                        className="w-full border border-[#E5E7EB] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#E31E24] text-right"
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
                        className="w-full border border-[#E5E7EB] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#E31E24] text-right"
                      />
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
                        className="w-full border border-[#E5E7EB] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#E31E24] text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={item.remarks}
                        onChange={(e) =>
                          updateItem(idx, "remarks", e.target.value)
                        }
                        className="w-full border border-[#E5E7EB] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#E31E24]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => moveRow(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveRow(idx, 1)}
                          disabled={idx === form.items.length - 1}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => duplicateRow(idx)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteRow(idx)}
                          disabled={form.items.length === 1}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 disabled:opacity-30"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            data-testid="add-item-btn"
            onClick={addRow}
            className="mt-3 flex items-center gap-1.5 text-sm text-[#E31E24] hover:text-red-700 font-medium"
          >
            <Plus className="w-4 h-4" /> Add Row
          </button>

          {/* Totals */}
          <div className="mt-4 border-t border-[#E5E7EB] pt-4">
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-[#333333]">
                    {formatCurrency(form.subtotal)}
                  </span>
                </div>
                {amtSettings.show_additional_charges && (
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
                      className="w-28 border border-[#E5E7EB] rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#E31E24]"
                    />
                  </div>
                )}
                {amtSettings.show_discount && (
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Discount</span>
                    <input
                      type="number"
                      min="0"
                      value={form.discount || ""}
                      onChange={(e) => {
                        setForm((p) => ({
                          ...p,
                          discount: Number(e.target.value),
                        }));
                        setUnsavedChanges(true);
                      }}
                      className="w-28 border border-[#E5E7EB] rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#E31E24]"
                    />
                  </div>
                )}
                {amtSettings.show_tax && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Tax ({amtSettings.tax_percentage || 18}%)
                    </span>
                    <span className="font-medium text-[#333333]">
                      {formatCurrency(
                        ((form.subtotal +
                          (form.additional_charges || 0) -
                          (form.discount || 0)) *
                          (amtSettings.tax_percentage || 18)) /
                          100,
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-[#E5E7EB] pt-2">
                  <span className="text-[#333333]">Grand Total</span>
                  <span className="text-[#E31E24] text-base">
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
            className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#E31E24] resize-y"
          />
        </div>

        {/* Actions */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 flex flex-wrap gap-3">
          <button
            data-testid="save-draft-btn"
            onClick={handleSaveDraft}
            disabled={loading}
            className="border border-[#E5E7EB] text-sm font-medium px-5 py-2 rounded-md hover:bg-gray-50 text-[#333333] disabled:opacity-60"
          >
            Save as Draft
          </button>
          <button
            data-testid="submit-approval-btn"
            onClick={handleSubmitForApproval}
            disabled={loading}
            className="bg-[#E31E24] text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit for Approval"}
          </button>
        </div>
      </div>
    </div>
  );
}
