import React from "react";
import { Plus, Search } from "lucide-react";

export default function BasicInfoSection({
  form,
  setForm,
  setUnsavedChanges,
  vendorSearch,
  setVendorSearch,
  showVendorDD,
  setShowVendorDD,
  filteredVendors,
  selectVendor,
  onAddVendor,
}) {
  return (
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
              onClick={onAddVendor}
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
  );
}
