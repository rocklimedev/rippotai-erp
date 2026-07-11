import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftIcon,
  CheckCircle2,
} from "lucide-react";
import {
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useSetVendorStatusMutation,
  useGetVendorCategoriesQuery,
  useGetBusinessTypesQuery,
} from "../../api/vendor.api"; // adjust this import path to wherever vendorsApi is actually exported from

const STEPS = ["Basic", "Category & Type", "Contact", "Review"];

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
  const [step, setStep] = useState(0);
  const [vendorId, setVendorId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [createVendor, { isLoading: creating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: updating }] = useUpdateVendorMutation();
  const [setVendorStatus] = useSetVendorStatusMutation();
  const saving = creating || updating;

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

  useEffect(() => {
    if (form.name || form.company_name) debouncedPersist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const validateStep = () => {
    if (step === 0 && !form.name) {
      toast.error("Please enter the vendor's name");
      return false;
    }
    if (step === 2 && !form.contact_number) {
      toast.error("Please enter a contact number");
      return false;
    }
    return true;
  };

  const next = async () => {
    if (!validateStep()) return;
    await persist();
    if (step < STEPS.length - 1) setStep(step + 1);
  };
  const back = () => setStep(Math.max(0, step - 1));

  const submit = async () => {
    if (!validateStep()) return;
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

  return (
    <div
      className="max-w-3xl mx-auto space-y-6"
      data-testid="vendor-new-wizard"
    >
      <button
        onClick={() => nav("/vendors")}
        className="text-[13px] text-[#6B7B7C] hover:text-[#333333] flex items-center gap-1"
      >
        <ArrowLeftIcon size={14} /> Back to Vendors
      </button>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5">
          Add Vendor · Step {step + 1} of {STEPS.length}
        </div>
        <h1 className="text-[32px] font-bold text-[#333333]">{STEPS[step]}</h1>
        <div className="mt-4 flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[#1F453B]" : "bg-[#B5C4B6]"}`}
            />
          ))}
        </div>
      </div>

      <div className="bc-card p-6 space-y-4">
        {step === 0 && (
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
        )}

        {step === 1 && (
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
              <label className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
                Business Type
              </label>
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
        )}

        {step === 2 && (
          <div className="space-y-4">
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
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="text-[13px] text-[#6B7B7C]">
              Please review the details before saving.
            </div>
            <div className="grid grid-cols-2 gap-2 text-[13px]">
              {[
                ["Name", form.name],
                ["Company", form.company_name],
                ["Position", form.position],
                [
                  "Category",
                  categories.find((c) => c.id === form.vendor_category_id)
                    ?.name,
                ],
                [
                  "Business Type",
                  businessTypes.find((b) => b.id === form.business_type_id)
                    ?.name,
                ],
                ["Contact Number", form.contact_number],
                ["Alternate Contact", form.alternate_contact],
                ["Address", form.address],
                ["Notes", form.notes],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                    {k}
                  </div>
                  <div className="text-[#333333]">{v || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={back}
          disabled={step === 0}
          className="h-11 px-4 rounded-xl border border-[#B5C4B6] text-[13px] font-semibold text-[#6B7B7C] flex items-center gap-1 disabled:opacity-50"
          data-testid="wizard-back"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="text-[11.5px] text-[#B5C4B6]">
          {saving ? "Saving…" : "All changes auto-saved"}
        </div>
        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            className="h-11 px-4 rounded-xl bg-[#1F453B] hover:bg-[#1F453B] text-white text-[13px] font-semibold flex items-center gap-1"
            data-testid="wizard-next"
          >
            Next <ArrowRight size={14} />
          </button>
        ) : (
          <button
            onClick={submit}
            className="h-11 px-6 rounded-xl bg-[#1F453B] hover:bg-[#1F453B] text-white text-[13px] font-semibold flex items-center gap-1"
            data-testid="wizard-submit"
          >
            Save Vendor <CheckCircle2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
