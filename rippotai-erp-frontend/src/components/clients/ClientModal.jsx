import React, { useEffect, useState } from "react";
import { Building2, Save, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  useCreateClientMutation,
  useUpdateClientMutation,
} from "../../api/projects/client.api";
import { Field, TextInput } from "@/components/inos";
import { AdminModal, ModalActions } from "@/pages/settings/_admin-ui";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ClientModal({ client, onClose }) {
  const isEdit = !!client;

  const [createClient, { isLoading: creating }] = useCreateClientMutation();

  const [updateClient, { isLoading: updating }] = useUpdateClientMutation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || client.mobile || "",
        company_name: client.company_name || client.company || "",
      });
    } else {
      setForm({
        name: "",
        email: "",
        phone: "",
        company_name: "",
      });
    }
  }, [client]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const next = {};
    if (!form.name.trim()) next.name = "Client name is required.";
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) next.email = "That doesn't look like an email address.";
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      if (isEdit) {
        await updateClient({
          id: client.id,
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          company_name: form.company_name.trim() || null,
        }).unwrap();

        toast.success("Client updated successfully");
      } else {
        await createClient({
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          company_name: form.company_name.trim() || null,
        }).unwrap();

        toast.success("Client created successfully");
      }

      onClose();
    } catch (error) {
      toast.error(
        error?.data?.detail ||
          error?.data?.message ||
          `Failed to ${isEdit ? "update" : "create"} client`,
      );
    }
  };

  const saving = creating || updating;

  return (
    <AdminModal
      as="form"
      onSubmit={handleSubmit}
      onClose={onClose}
      busy={saving}
      icon={isEdit ? Building2 : UserPlus}
      title={isEdit ? "Edit client" : "Add client"}
      subtitle={isEdit ? "Changes apply everywhere this client appears." : "Only the name is required — add contact details now or later."}
      width={560}
      testId="client-modal"
      footer={
        <ModalActions
          onCancel={onClose}
          submitting={saving}
          submitLabel={isEdit ? "Save changes" : "Add client"}
          icon={isEdit ? Save : undefined}
        />
      }
    >
      <div className="inos-form-grid">
        <Field label="Client name" required full error={errors.name} htmlFor="cm-name" hint="Person or family name as it should appear on documents.">
          <TextInput
            id="cm-name"
            name="name"
            value={form.name}
            onChange={handleChange}
            invalid={!!errors.name}
            placeholder="e.g. Sagar Mehta"
            autoFocus
          />
        </Field>

        <Field label="Company" optional full htmlFor="cm-company">
          <TextInput
            id="cm-company"
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            placeholder="e.g. Aurum Capital Pvt. Ltd."
          />
        </Field>

        <Field label="Email" optional error={errors.email} htmlFor="cm-email">
          <TextInput
            id="cm-email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            invalid={!!errors.email}
            placeholder="name@company.com"
          />
        </Field>

        <Field label="Phone" optional htmlFor="cm-phone">
          <TextInput
            id="cm-phone"
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+91 98100 00000"
          />
        </Field>
      </div>
    </AdminModal>
  );
}
