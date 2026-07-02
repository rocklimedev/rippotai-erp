import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { formatApiError } from "../../utils/api";
import { useGetBusinessTypesQuery } from "../../api/vendor.api"; // adjust path as needed

export default function VendorFormModal({
  vendor,
  onClose,
  onSave,
  onSubmit,
  categories,
}) {
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
                  className={`py-2.5 text-sm font-semibold rounded-md border-2 transition-all ${categoryId === cat.id ? "bg-[#1A3C34] text-white border-[#1A3C34]" : "border-[#E5E7EB] text-gray-600 hover:border-[#1A3C34] hover:text-[#1A3C34]"}`}
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
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#1A3C34]"
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
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#1A3C34]"
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
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#1A3C34]"
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
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#1A3C34]"
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
                  className="w-full mt-1.5 border border-[#1A3C34] rounded px-3 py-1.5 text-sm focus:outline-none"
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
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#1A3C34]"
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
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#1A3C34]"
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
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#1A3C34]"
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
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#1A3C34]"
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
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#1A3C34] resize-none"
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
              className="flex-1 bg-[#1A3C34] text-white text-sm py-2 rounded hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : isEdit ? "Update" : "Create Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
