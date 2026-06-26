import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiError } from "../../utils/api";
import { getStatusConfig } from "../../utils/helpers";
import { useAuth } from "../../store/use-auth";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  Phone,
  Upload,
  LayoutGrid,
  LayoutList,
} from "lucide-react";

// RTK Query hooks
import {
  useGetVendorCategoriesQuery,
  useGetBusinessTypesQuery,
  useGetVendorsQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
} from "../../api/vendor.api"; // adjust path as needed

function VendorFormModal({ vendor, onClose, onSave, onSubmit, categories }) {
  const isEdit = !!vendor;

  // figure out initial category id from vendor (supports vendor_category_id or vendor_category name)
  const getInitialCategoryId = () => {
    if (vendor?.vendor_category_id) return vendor.vendor_category_id;
    if (vendor?.vendor_category && categories?.length) {
      const found = categories.find((c) => c.name === vendor.vendor_category);
      return found ? found.id : "";
    }
    return "";
  };

  const [form, setForm] = useState(
    vendor || {
      name: "",
      company_name: "",
      position: "",
      vendor_category: "", // name (kept for compatibility)
      vendor_category_id: null, // id from API
      type_of_business: "",
      business_type_id: null,
      contact_number: "",
      alternate_contact: "",
      address: "",
      notes: "",
      status: "active",
    },
  );

  const [categoryId, setCategoryId] = useState(getInitialCategoryId());
  const [customMode, setCustomMode] = useState(false);
  const [customTypeValue, setCustomTypeValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // load business types for this category
  const { data: businessTypes = [], isFetching: businessTypesLoading } =
    useGetBusinessTypesQuery(categoryId, { skip: !categoryId });

  // On open for edit, if vendor has a business type name but not in list -> custom
  useEffect(() => {
    if (vendor) {
      const initialCategory = getInitialCategoryId();
      setCategoryId(initialCategory);
      setForm((p) => ({
        ...p,
        ...vendor,
        vendor_category_id:
          vendor.vendor_category_id || initialCategory || null,
      }));

      if (vendor.type_of_business) {
        // if we have category id and businessTypes, check presence
        if (initialCategory && businessTypes.length > 0) {
          const found = businessTypes.find(
            (bt) => bt.name === vendor.type_of_business,
          );
          if (!found) {
            setCustomMode(true);
            setCustomTypeValue(vendor.type_of_business);
          } else {
            setCustomMode(false);
            setCustomTypeValue("");
            setForm((p) => ({ ...p, business_type_id: found.id }));
          }
        } else {
          // unknown yet — set custom temporarily
          setCustomMode(true);
          setCustomTypeValue(vendor.type_of_business);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor]);

  useEffect(() => {
    // when category changes, reset type
    setForm((p) => ({
      ...p,
      vendor_category_id: categoryId || null,
      vendor_category:
        categories?.find((c) => c.id === categoryId)?.name || p.vendor_category,
      type_of_business: "",
      business_type_id: null,
    }));
    setCustomMode(false);
    setCustomTypeValue("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const handleTypeSelect = (e) => {
    const val = e.target.value;
    if (val === "__custom__") {
      setCustomMode(true);
      setForm((p) => ({
        ...p,
        type_of_business: customTypeValue,
        business_type_id: null,
      }));
    } else {
      setCustomMode(false);
      setCustomTypeValue("");
      const bt = businessTypes.find((b) => String(b.id) === String(val));
      setForm((p) => ({
        ...p,
        type_of_business: bt ? bt.name : "",
        business_type_id: bt ? bt.id : null,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Construct payload with both ids and names so backend can accept either
    const payload = {
      ...form,
      vendor_category_id: categoryId || form.vendor_category_id || null,
      vendor_category:
        categories?.find(
          (c) => c.id === (categoryId || form.vendor_category_id),
        )?.name ||
        form.vendor_category ||
        "",
      type_of_business: form.type_of_business || customTypeValue || "",
      business_type_id: form.business_type_id || null,
    };

    try {
      await onSubmit(payload, isEdit, vendor?.id);
      onSave();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#333333]">
            {isEdit ? "Edit Vendor" : "Add Vendor"}
          </h3>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
              {error}
            </div>
          )}

          {/* Category selector (from API categories) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Vendor Category *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(categories || []).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`py-2.5 text-sm font-semibold rounded-md border-2 transition-all ${categoryId === cat.id ? "bg-[#E31E24] text-white border-[#E31E24]" : "border-[#E5E7EB] text-gray-600 hover:border-[#E31E24] hover:text-[#E31E24]"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {!categoryId && (
              <p className="text-xs text-gray-400 mt-1">
                Select a category to see relevant business types
              </p>
            )}
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
                Position
              </label>
              <input
                value={form.position}
                onChange={(e) =>
                  setForm((p) => ({ ...p, position: e.target.value }))
                }
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#E31E24]"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type of Business
                {categoryId
                  ? ` (${categories?.find((c) => c.id === categoryId)?.name || ""})`
                  : ""}
              </label>

              <select
                value={
                  customMode ? "__custom__" : (form.business_type_id ?? "")
                }
                onChange={handleTypeSelect}
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#E31E24]"
              >
                <option value="">
                  {categoryId ? `Select type...` : "Select category first..."}
                </option>
                {(businessTypes || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
                <option value="__custom__">+ Add custom type...</option>
              </select>

              {customMode && (
                <input
                  autoFocus
                  value={customTypeValue}
                  onChange={(e) => {
                    setCustomTypeValue(e.target.value);
                    setForm((p) => ({
                      ...p,
                      type_of_business: e.target.value,
                      business_type_id: null,
                    }));
                  }}
                  placeholder="Enter custom business type..."
                  className="w-full mt-1.5 border border-[#E31E24] rounded px-3 py-1.5 text-sm focus:outline-none"
                />
              )}
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

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Alternate Contact
              </label>
              <input
                value={form.alternate_contact}
                onChange={(e) =>
                  setForm((p) => ({ ...p, alternate_contact: e.target.value }))
                }
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#E31E24]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value }))
                }
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#E31E24]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blacklisted">Blacklisted</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#E31E24]"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Address / Location
              </label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#E31E24] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#E5E7EB] text-sm py-2 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              data-testid="save-vendor-modal-btn"
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#E31E24] text-white text-sm py-2 rounded hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : isEdit ? "Update" : "Create Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExcelImportModal({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError("Please select an Excel/CSV file (.xlsx, .xls, .csv)");
      return;
    }
    setFile(f);
    setError("");
    setResult(null);
  };

  const downloadTemplate = () => {
    const headers = [
      "Name",
      "Company Name",
      "Position",
      "Vendor Category",
      "Type of Business",
      "Contact Number",
      "Alternate Contact",
      "Address",
      "Notes",
      "Status",
    ];
    const sample = [
      "John Doe",
      "ABC Pvt Ltd",
      "Owner",
      "Contractor",
      "Labour",
      "9876543210",
      "",
      "Mumbai, Maharashtra",
      "",
      "active",
    ];
    const csv = [headers.join(","), sample.map((v) => `"${v}"`).join(",")].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendor_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/vendors/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
      if (data.imported > 0) onImported();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#333333]">
            Import Vendors from Excel
          </h3>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
              {error}
            </div>
          )}
          {!result ? (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragOver ? "border-[#E31E24] bg-red-50" : "border-[#E5E7EB] hover:border-[#E31E24] hover:bg-gray-50"}`}
              >
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                {file ? (
                  <p className="text-sm font-medium text-[#333333]">
                    {file.name}
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-gray-500">
                      Drag & drop file here
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      or click to browse
                    </p>
                  </>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Supports .xlsx, .xls and .csv
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded p-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-blue-700">
                    Need a template?
                  </p>
                  <p className="text-xs text-blue-500 mt-0.5">
                    Columns: Name, Vendor Category (Material/Contractor), Type
                    of Business...
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap mt-0.5"
                >
                  Download
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-[#E5E7EB] text-sm py-2 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  data-testid="import-vendors-btn"
                  onClick={handleImport}
                  disabled={!file || loading}
                  className="flex-1 bg-[#E31E24] text-white text-sm py-2 rounded hover:bg-red-700 disabled:opacity-60"
                >
                  {loading
                    ? "Importing..."
                    : file
                      ? `Import "${file.name}"`
                      : "Select a file first"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-3">
                <div
                  className={`text-3xl font-bold mb-1 ${result.imported > 0 ? "text-green-600" : "text-gray-400"}`}
                >
                  {result.imported}
                </div>
                <div className="text-sm text-gray-600">
                  vendor{result.imported !== 1 ? "s" : ""} imported successfully
                </div>
                {result.errors?.length > 0 && (
                  <div className="mt-1 text-sm text-orange-500">
                    {result.errors.length} row
                    {result.errors.length > 1 ? "s" : ""} skipped
                  </div>
                )}
              </div>
              {result.errors?.length > 0 && (
                <div className="max-h-36 overflow-y-auto border border-[#E5E7EB] rounded text-xs">
                  {result.errors.map((e, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 border-b last:border-0 text-gray-600"
                    >
                      <span className="font-medium text-gray-800">
                        Row {e.row}: {e.name || "—"}
                      </span>{" "}
                      — {e.reason}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={onClose}
                className="w-full bg-[#E31E24] text-white text-sm py-2 rounded hover:bg-red-700"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VendorsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(""); // will hold category id
  const [typeFilter, setTypeFilter] = useState(""); // will hold business type id
  const [modal, setModal] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [view, setView] = useState(
    () => localStorage.getItem("vendors_view") || "list",
  );

  const setViewPref = (v) => {
    setView(v);
    localStorage.setItem("vendors_view", v);
  };

  // categories from API
  const { data: categories = [], isFetching: categoriesLoading } =
    useGetVendorCategoriesQuery();

  // business types for active category (for chips)
  const { data: subTypes = [], isFetching: subTypesLoading } =
    useGetBusinessTypesQuery(categoryFilter, { skip: !categoryFilter });

  // vendors from API using category/type ids for server filtering
  const {
    data: vendors = [],
    isLoading,
    refetch,
  } = useGetVendorsQuery({
    status: undefined,
    vendor_category_id: categoryFilter || undefined,
    business_type_id: typeFilter || undefined,
  });

  const [createVendor] = useCreateVendorMutation();
  const [updateVendor] = useUpdateVendorMutation();
  const [deleteVendor] = useDeleteVendorMutation();

  // client-side text search (server-side search can be added if API supports it)
  const filteredVendors = React.useMemo(() => {
    if (!search) return vendors;
    const q = search.toLowerCase();
    return (vendors || []).filter((v) => {
      return (
        (v.name || "").toLowerCase().includes(q) ||
        (v.type_of_business || "").toLowerCase().includes(q) ||
        (v.address || "").toLowerCase().includes(q)
      );
    });
  }, [vendors, search]);

  const handleSubmitVendor = async (payload, isEdit, id) => {
    if (isEdit) {
      await updateVendor({ id, ...payload }).unwrap();
    } else {
      await createVendor(payload).unwrap();
    }
    await refetch();
  };

  const handleSave = () => {
    setModal(null);
    refetch();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Archive this vendor?")) return;
    try {
      await deleteVendor(id).unwrap();
      await refetch();
    } catch (err) {
      console.error("Error deleting vendor:", err);
    }
  };

  const handleCategoryClick = (catId) => {
    if (categoryFilter === catId) {
      setCategoryFilter("");
      setTypeFilter("");
    } else {
      setCategoryFilter(catId);
      setTypeFilter("");
    }
  };

  const currentCategoryName = categories.find(
    (c) => c.id === categoryFilter,
  )?.name;

  return (
    <div className="p-6">
      {modal && (
        <VendorFormModal
          vendor={modal.vendor}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onSubmit={handleSubmitVendor}
          categories={categories}
        />
      )}
      {showImport && (
        <ExcelImportModal
          onClose={() => setShowImport(false)}
          onImported={() => refetch()}
        />
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-[#333333]">Vendors</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[#E5E7EB] rounded-md overflow-hidden">
            <button
              onClick={() => setViewPref("list")}
              className={`p-2 ${view === "list" ? "bg-[#E31E24] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              title="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewPref("grid")}
              className={`p-2 ${view === "grid" ? "bg-[#E31E24] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button
            data-testid="import-excel-btn"
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 border border-[#E5E7EB] text-sm font-medium px-3 py-2 rounded-md hover:bg-gray-50 text-gray-600"
          >
            <Upload className="w-4 h-4" /> Import Excel
          </button>
          <button
            data-testid="add-vendor-btn"
            onClick={() => setModal({ type: "add" })}
            className="flex items-center gap-2 bg-[#E31E24] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-red-700"
          >
            <Plus className="w-4 h-4" /> Add Vendor
          </button>
        </div>
      </div>

      {/* Category Tabs — Level 1 */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => {
            setCategoryFilter("");
            setTypeFilter("");
          }}
          className={`px-5 py-2 text-sm font-semibold rounded-md border-2 transition-all ${!categoryFilter ? "bg-[#333333] text-white border-[#333333]" : "border-[#E5E7EB] text-gray-500 hover:border-gray-300"}`}
        >
          All
        </button>

        {(categories || []).map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={`px-5 py-2 text-sm font-semibold rounded-md border-2 transition-all ${categoryFilter === cat.id ? "bg-[#E31E24] text-white border-[#E31E24]" : "border-[#E5E7EB] text-gray-600 hover:border-[#E31E24] hover:text-[#E31E24]"}`}
          >
            {cat.name}
          </button>
        ))}

        <span className="text-xs text-gray-400 ml-1">
          {categoryFilter
            ? `${filteredVendors.length} ${currentCategoryName || ""} vendor${filteredVendors.length !== 1 ? "s" : ""}`
            : `${filteredVendors.length} total`}
        </span>
      </div>

      {/* Sub-type chips — Level 2 (from API business types) */}
      {(subTypes || []).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 pl-1">
          {subTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(typeFilter === t.id ? "" : t.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${typeFilter === t.id ? "bg-[#E31E24] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Search & Status Filter Row */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            data-testid="vendor-search"
            placeholder="Search by name, type, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#E31E24] w-64"
          />
        </div>
        <select
          value={""} // keep status filter UI but not wired to server in this example
          onChange={() => {}}
          className="py-2 px-3 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#E31E24] text-gray-600"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-gray-400">Loading...</div>
      ) : !filteredVendors || filteredVendors.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-400">No vendors found</p>
          <button
            onClick={() => setModal({ type: "add" })}
            className="mt-2 text-sm text-[#E31E24] hover:underline"
          >
            Add your first vendor
          </button>
        </div>
      ) : view === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVendors.map((v) => {
            const cfg = getStatusConfig(v.status);
            return (
              <div
                key={v.id}
                onClick={() => navigate(`/vendors/${v.id}`)}
                className="bg-white border border-[#E5E7EB] rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#333333] text-sm truncate group-hover:text-[#E31E24] transition-colors">
                      {v.name}
                    </div>
                    {v.position && (
                      <div className="text-xs text-gray-400">{v.position}</div>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    {cfg.label}
                  </span>
                </div>
                {v.company_name && (
                  <div className="text-xs text-gray-500 mb-1 truncate">
                    {v.company_name}
                  </div>
                )}
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {v.vendor_category && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${v.vendor_category === "Material" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}
                    >
                      {v.vendor_category}
                    </span>
                  )}
                  {v.type_of_business && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      {v.type_of_business}
                    </span>
                  )}
                </div>
                {v.address && (
                  <div className="text-xs text-gray-400 truncate mb-1">
                    {v.address}
                  </div>
                )}
                <div className="mt-auto pt-3 border-t border-[#F3F4F6]">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Phone className="w-3 h-3 flex-shrink-0 text-gray-400" />
                    {v.contact_number}
                  </div>
                </div>
                <div
                  className="mt-2 flex items-center justify-between text-xs text-gray-400"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>
                    {v.quotation_count || 0} quotation
                    {v.quotation_count !== 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setModal({ type: "edit", vendor: v })}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {user?.role === "admin" && (
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View — sticky header */
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase bg-[#F9FAFB] w-10">
                    #
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase bg-[#F9FAFB]">
                    Name
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase bg-[#F9FAFB]">
                    Company
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase bg-[#F9FAFB]">
                    Category / Type
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase bg-[#F9FAFB]">
                    Contact
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase bg-[#F9FAFB]">
                    Address
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase bg-[#F9FAFB]">
                    Status
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase bg-[#F9FAFB]">
                    Quotations
                  </th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase bg-[#F9FAFB]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((v, idx) => {
                  const cfg = getStatusConfig(v.status);
                  return (
                    <tr
                      key={v.id}
                      className="border-b border-[#F3F4F6] hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#333333]">
                          {v.name}
                        </div>
                        {v.position && (
                          <div className="text-xs text-gray-400">
                            {v.position}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {v.company_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {v.vendor_category && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold w-fit ${v.vendor_category === "Material" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}
                            >
                              {v.vendor_category}
                            </span>
                          )}
                          {v.type_of_business && (
                            <span className="text-xs text-gray-500">
                              {v.type_of_business}
                            </span>
                          )}
                          {!v.vendor_category && !v.type_of_business && (
                            <span className="text-gray-300">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="w-3 h-3" />
                          {v.contact_number}
                        </div>
                        {v.alternate_contact && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {v.alternate_contact}
                          </div>
                        )}
                      </td>
                      <td
                        className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate"
                        title={v.address}
                      >
                        {v.address || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-[#333333]">
                        {v.quotation_count || 0}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            data-testid={`view-vendor-${v.id}`}
                            onClick={() => navigate(`/vendors/${v.id}`)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setModal({ type: "edit", vendor: v })
                            }
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user?.role === "admin" && (
                            <button
                              onClick={() => handleDelete(v.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
