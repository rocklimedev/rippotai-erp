import React, { useState } from "react";
import { toast } from "sonner";
import { useCreateVendorMutation } from "../../api/vendor.api"; // adjust import path to wherever vendorsApi.js lives

const VENDOR_CATEGORIES = [
  "General",
  "Civil",
  "Electrical",
  "Plumbing",
  "Carpentry",
  "Painting",
  "Flooring",
  "Fabrication",
  "Other",
];

// Local, self-contained copies of the Field/Input primitives used on the
// estimate page, so this file has no dependency on EstimateNew.jsx.
const Field = ({ label, required, children }) => (
  <div>
    <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
      {label}
      {required && <span className="text-[#B04D26] ml-0.5">*</span>}
    </label>
    {children}
  </div>
);
const Input = (props) => (
  <input
    {...props}
    className={`h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px] disabled:opacity-70 disabled:cursor-not-allowed ${props.className || ""}`}
  />
);

export default function NewVendorModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    company: "",
    contact: "",
    email: "",
    primary_category: "General",
  });

  const [createVendor, { isLoading: saving }] = useCreateVendorMutation();

  const save = async () => {
    if (!form.company.trim() && !form.name.trim())
      return toast.error("Company or name required");
    try {
      const data = await createVendor(form).unwrap();
      toast.success(`Vendor "${data.company || data.name}" added`);
      onCreated(data);
    } catch (e) {
      toast.error(e?.data?.detail || e?.error || "Failed to add vendor");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-[480px] p-6"
        onClick={(e) => e.stopPropagation()}
        data-testid="new-vendor-modal"
      >
        <div className="text-[18px] font-semibold text-[#333333] mb-4">
          New Vendor
        </div>
        <div className="grid gap-3">
          <Field label="Company">
            <Input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              data-testid="nv-company"
            />
          </Field>
          <Field label="Contact name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              data-testid="nv-name"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              data-testid="nv-phone"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              data-testid="nv-email"
            />
          </Field>
          <Field label="Primary Category">
            <select
              value={form.primary_category}
              onChange={(e) =>
                setForm({ ...form, primary_category: e.target.value })
              }
              className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
              data-testid="nv-category"
            >
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-[#DDD8CE] text-[13px] font-semibold text-[#333333]"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold"
            data-testid="nv-save"
          >
            {saving ? "Saving…" : "Save Vendor"}
          </button>
        </div>
      </div>
    </div>
  );
}
