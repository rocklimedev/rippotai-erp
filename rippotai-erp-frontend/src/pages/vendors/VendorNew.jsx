import React, { useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { ArrowLeftIcon, CheckCircle2, Plus, X } from "lucide-react";
import {
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useGetVendorByIdQuery,
  useSetVendorStatusMutation,
  useGetVendorCategoriesQuery,
  useGetBusinessTypesQuery,
  useCreateBusinessTypeMutation,
} from "../../api/vendor.api"; // adjust this import path to wherever vendorsApi is actually exported from

// Only fields that exist on the Vendor model are collected here.
const initialForm = {
  name: "",
  company_name: "",
  position: "",
  vendor_category_id: "",
  business_type_id: "",
  contact_number: "",
  alternate_contact: "",
  address: "",
  notes: "",
};

// Strips the form state down to exactly the columns the Vendor model accepts,
// so we never send fields the backend will just ignore.
function toPayload(form) {
  return {
    name: form.name,
    company_name: form.company_name || null,
    position: form.position || null,
    vendor_category_id: form.vendor_category_id || null,
    business_type_id: form.business_type_id || null,
    contact_number: form.contact_number,
    alternate_contact: form.alternate_contact || null,
    address: form.address || null,
    notes: form.notes || null,
  };
}

export default function VendorNew() {
  const nav = useNavigate();
  const { id: routeVendorId } = useParams(); // present on /vendors/:id/edit, absent on /vendors/new
  const isEdit = Boolean(routeVendorId);

  const [vendorId, setVendorId] = useState(routeVendorId || null);
  const [form, setForm] = useState(initialForm);
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState({});
  const [isBusinessTypeModalOpen, setBusinessTypeModalOpen] = useState(false);
  const [newBusinessTypeName, setNewBusinessTypeName] = useState("");
  const [businessTypeError, setBusinessTypeError] = useState("");

  // Guards against the hydration-triggered form update firing an
  // immediate autosave PATCH of data we just loaded from the server.
  const suppressAutosave = useRef(false);

  const [createVendor, { isLoading: creating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: updating }] = useUpdateVendorMutation();
  const [setVendorStatus, { isLoading: activating }] =
    useSetVendorStatusMutation();
  const [createBusinessType, { isLoading: creatingBusinessType }] =
    useCreateBusinessTypeMutation();
  const saving = creating || updating;

  const {
    data: vendor,
    isFetching: vendorLoading,
    isError: vendorError,
  } = useGetVendorByIdQuery(routeVendorId, { skip: !isEdit });

  const { data: categories = [] } = useGetVendorCategoriesQuery();
  const { data: businessTypes = [] } = useGetBusinessTypesQuery(
    form.vendor_category_id,
    { skip: !form.vendor_category_id },
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setCategory = (categoryId) => {
    setForm((f) => ({
      ...f,
      vendor_category_id: categoryId,
      business_type_id: "", // dependent field, reset on category change
    }));
  };

  const persist = useCallback(async () => {
    const payload = toPayload(form);
    try {
      if (!vendorId) {
        const result = await createVendor(payload).unwrap();
        setVendorId(result.id);
      } else {
        await updateVendor({ id: vendorId, ...payload }).unwrap();
      }
    } catch {
      toast.error("Autosave failed");
    }
  }, [form, vendorId, createVendor, updateVendor]);

  const debouncedPersist = useDebouncedCallback(persist, 800);

  const openBusinessTypeModal = () => {
    setNewBusinessTypeName("");
    setBusinessTypeError("");
    setBusinessTypeModalOpen(true);
  };

  const closeBusinessTypeModal = () => {
    setBusinessTypeModalOpen(false);
  };

  const handleCreateBusinessType = async () => {
    if (!newBusinessTypeName.trim()) {
      setBusinessTypeError("Please enter a name");
      return;
    }
    try {
      const result = await createBusinessType({
        category_id: form.vendor_category_id,
        name: newBusinessTypeName.trim(),
      }).unwrap();
      set("business_type_id", result.id);
      toast.success("Business type created");
      setBusinessTypeModalOpen(false);
    } catch {
      toast.error("Failed to create business type");
    }
  };

  // Edit mode: once the vendor loads, hydrate the form from it. Guarded by
  // `hydrated` so a background refetch doesn't clobber what's being typed,
  // and suppresses the very next autosave so we don't immediately PATCH
  // back the data we just fetched.
  useEffect(() => {
    if (!isEdit || !vendor || hydrated) return;
    setForm({
      name: vendor.name || "",
      company_name: vendor.company_name || "",
      position: vendor.position || "",
      vendor_category_id:
        vendor.vendor_category_id || vendor.vendor_category?.id || "",
      business_type_id:
        vendor.business_type_id || vendor.business_type?.id || "",
      contact_number: vendor.contact_number || "",
      alternate_contact: vendor.alternate_contact || "",
      address: vendor.address || "",
      notes: vendor.notes || "",
    });
    setVendorId(vendor.id);
    suppressAutosave.current = true;
    setHydrated(true);
  }, [isEdit, vendor, hydrated]);

  useEffect(() => {
    if (vendorError) toast.error("Failed to load vendor");
  }, [vendorError]);

  useEffect(() => {
    if (suppressAutosave.current) {
      suppressAutosave.current = false;
      return;
    }
    if (form.name || form.company_name) debouncedPersist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const validate = () => {
    const next = {};
    if (!form.name) next.name = "Please enter the vendor's name";
    if (!form.contact_number)
      next.contact_number = "Please enter a contact number";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      toast.error("Please fill in the required fields");
      return;
    }
    await persist();
    if (!vendorId) {
      toast.error("Please fill vendor details first");
      return;
    }
    try {
      await setVendorStatus({ id: vendorId, status: "active" }).unwrap();
      toast.success("Vendor saved");
      nav(`/vendors/${vendorId}`);
    } catch {
      toast.error("Failed to activate vendor");
    }
  };

  if (isEdit && vendorLoading && !hydrated) {
    return (
      <div className="max-w-3xl mx-auto space-y-6" data-testid="vendor-new-form">
        <div className="text-[13px] text-[#6B7B7C]">Loading vendor…</div>
      </div>
    );
  }

  const backTarget = isEdit ? `/vendors/${vendorId}` : "/vendors";

  return (
    <div
      className="max-w-3xl mx-auto space-y-6"
      data-testid="vendor-new-form"
    >
      <button
        onClick={() => nav(backTarget)}
        className="text-[13px] text-[#6B7B7C] hover:text-[#333333] flex items-center gap-1"
      >
        <ArrowLeftIcon size={14} /> {isEdit ? "Back to Vendor" : "Back to Vendors"}
      </button>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5">
          {isEdit ? "Edit Vendor" : "Add Vendor"}
        </div>
        <h1 className="text-[32px] font-bold text-[#333333]">
          {isEdit ? "Edit Vendor" : "New Vendor"}
        </h1>
      </div>

      <div className="bc-card p-6 space-y-8">
        {/* Basic */}
        <div className="space-y-4">
          <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
            Basic
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
                Name *
              </label>
              <input
                className="bc-input mt-1"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                data-testid="w-name"
              />
              {errors.name && (
                <div className="text-[11.5px] text-red-500 mt-1">
                  {errors.name}
                </div>
              )}
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
                Company Name
              </label>
              <input
                className="bc-input mt-1"
                value={form.company_name}
                onChange={(e) => set("company_name", e.target.value)}
                data-testid="w-company"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
                Position
              </label>
              <input
                className="bc-input mt-1"
                value={form.position}
                onChange={(e) => set("position", e.target.value)}
                data-testid="w-position"
              />
            </div>
          </div>
        </div>

        {/* Category & Type */}
        <div className="space-y-4">
          <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
            Category &amp; Type
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
                Vendor Category
              </label>
              <select
                className="bc-input mt-1"
                value={form.vendor_category_id}
                onChange={(e) => setCategory(e.target.value)}
                data-testid="w-vendor-category"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
                  Business Type
                </label>
                <button
                  type="button"
                  onClick={openBusinessTypeModal}
                  disabled={!form.vendor_category_id}
                  className="text-[11.5px] font-semibold text-[#1F453B] hover:text-[#16332B] flex items-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  data-testid="w-business-type-add"
                >
                  <Plus size={12} /> Add
                </button>
              </div>
              <select
                className="bc-input mt-1"
                value={form.business_type_id}
                onChange={(e) => set("business_type_id", e.target.value)}
                disabled={!form.vendor_category_id}
                data-testid="w-business-type"
              >
                <option value="">
                  {form.vendor_category_id
                    ? "Select business type"
                    : "Select a category first"}
                </option>
                {businessTypes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
            Contact
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
                Contact Number *
              </label>
              <input
                className="bc-input mt-1"
                value={form.contact_number}
                onChange={(e) => set("contact_number", e.target.value)}
                data-testid="w-contact-number"
              />
              {errors.contact_number && (
                <div className="text-[11.5px] text-red-500 mt-1">
                  {errors.contact_number}
                </div>
              )}
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
                Alternate Contact
              </label>
              <input
                className="bc-input mt-1"
                value={form.alternate_contact}
                onChange={(e) => set("alternate_contact", e.target.value)}
                data-testid="w-alt-contact"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
              Address
            </label>
            <textarea
              className="bc-input mt-1 min-h-[70px]"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              data-testid="w-address"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
              Notes
            </label>
            <textarea
              className="bc-input mt-1 min-h-[80px]"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              data-testid="w-notes"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-[11.5px] text-[#B5C4B6]">
          {saving ? "Saving…" : "All changes auto-saved"}
        </div>
        <button
          onClick={submit}
          disabled={activating}
          className="h-11 px-6 rounded-xl bg-[#1F453B] hover:bg-[#1F453B] text-white text-[13px] font-semibold flex items-center gap-1 disabled:opacity-50"
          data-testid="form-submit"
        >
          Save Vendor <CheckCircle2 size={14} />
        </button>
      </div>

      {isBusinessTypeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeBusinessTypeModal}
        >
          <div
            className="bc-card w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
            data-testid="business-type-modal"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1">
                  New Business Type
                </div>
                <div className="text-[15px] font-bold text-[#333333]">
                  {categories.find((c) => c.id === form.vendor_category_id)
                    ?.name || "Business Type"}
                </div>
              </div>
              <button
                type="button"
                onClick={closeBusinessTypeModal}
                className="text-[#B5C4B6] hover:text-[#333333]"
                data-testid="business-type-modal-close"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
                Name *
              </label>
              <input
                className="bc-input mt-1"
                value={newBusinessTypeName}
                onChange={(e) => {
                  setNewBusinessTypeName(e.target.value);
                  if (businessTypeError) setBusinessTypeError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateBusinessType();
                }}
                autoFocus
                data-testid="business-type-name-input"
              />
              {businessTypeError && (
                <div className="text-[11.5px] text-red-500 mt-1">
                  {businessTypeError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeBusinessTypeModal}
                className="h-10 px-4 rounded-xl border border-[#B5C4B6] text-[13px] font-semibold text-[#6B7B7C]"
                data-testid="business-type-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateBusinessType}
                disabled={creatingBusinessType}
                className="h-10 px-4 rounded-xl bg-[#1F453B] hover:bg-[#1F453B] text-white text-[13px] font-semibold disabled:opacity-50"
                data-testid="business-type-save"
              >
                {creatingBusinessType ? "Saving…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}