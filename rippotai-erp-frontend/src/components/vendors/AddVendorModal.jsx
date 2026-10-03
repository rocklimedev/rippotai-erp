import React, { useState } from "react";
import { toast } from "sonner";
import { useCreateVendorMutation } from "../../api/vendors/vendor.api";
import { Button, Field as InosField, TextInput, SelectInput, ChoiceGroup } from "@/components/inos";
import { Modal } from "@/components/forms/commerce-form-ui";

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

const Field = ({ label, required, children, hint }) => (
  <InosField label={label} required={required} hint={hint}>
    {children}
  </InosField>
);
const Input = (props) => <TextInput {...props} />;

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
    <Modal
      title="New vendor"
      subtitle="Add the basics now — complete the profile later from the vendor directory."
      onClose={onClose}
      testId="new-vendor-modal"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={saving} data-testid="nv-save">
            {saving ? "Saving…" : "Add vendor"}
          </Button>
        </>
      }
    >
      <form
        className="inos-modal-body"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Company" hint="Company or contact name is required.">
          <Input
            autoFocus
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="e.g. Shree Tiles & Co."
            data-testid="nv-company"
          />
        </Field>
        <div className="inos-form-grid">
          <Field label="Contact name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Rakesh Gupta"
              data-testid="nv-name"
            />
          </Field>
          <Field label="Phone">
            <Input
              type="tel"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              placeholder="e.g. 98100 12345"
              data-testid="nv-phone"
            />
          </Field>
        </div>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="name@vendor.com"
            data-testid="nv-email"
          />
        </Field>
        <Field label="Primary category">
          <SelectInput
            value={form.primary_category}
            onChange={(e) => setForm({ ...form, primary_category: e.target.value })}
            data-testid="nv-category"
          >
            {VENDOR_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectInput>
        </Field>
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
