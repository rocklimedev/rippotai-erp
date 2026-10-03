// Add / edit client: /clients/new, /clients/:id/edit
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { workspaceApi } from "@/api/workspace/workspace.api";
import { Page, PageHeader, FormSection, Field, TextInput, TextArea, FormActions, Card } from "@/components/inos";
import { useGetClientByIdQuery, useCreateClientMutation, useUpdateClientMutation } from "@/api/projects/client.api";
import { Loading } from "./shared";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ClientForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data: client, isLoading } = useGetClientByIdQuery({ id }, { skip: !editing });
  const [createClient, { isLoading: c }] = useCreateClientMutation();
  const [updateClient, { isLoading: u }] = useUpdateClientMutation();
  const [f, setF] = useState({ name: "", contact_person: "", phone: "", email: "", address: "" });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    if (client) setF({ name: client.name || "", contact_person: client.contact_person || "", phone: client.phone || "", email: client.email || "", address: client.address || "" });
  }, [client]);

  const validate = () => {
    const e = {};
    if (!f.name.trim()) e.name = "Enter the client's name or company.";
    if (f.email && !EMAIL.test(f.email.trim())) e.email = "That doesn't look like an email address.";
    if (f.phone && f.phone.replace(/[^\d]/g, "").length < 8) e.phone = "Enter a full phone number.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const body = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim() || undefined]));
    try {
      const saved = editing ? await updateClient({ id, ...body }).unwrap() : await createClient(body).unwrap();
      dispatch(workspaceApi.util.invalidateTags(["WsClientOverview"]));
      toast.success(editing ? "Client updated" : "Client added");
      navigate(`/clients/${saved?.id || id}`);
    } catch (e) {
      const m = e?.data?.message;
      toast.error(Array.isArray(m) ? m.join(", ") : m || "Couldn't save the client");
    }
  };

  if (editing && isLoading) return <Page width="form"><Card><Loading /></Card></Page>;
  return (
    <Page width="form">
      <PageHeader
        crumbs={[{ label: "Clients", to: "/clients" }, ...(editing ? [{ label: client?.name || "Client", to: `/clients/${id}` }] : []), { label: editing ? "Edit" : "Add client" }]}
        title={editing ? "Edit client" : "Add client"}
        subtitle="Only the name is required — add contact details now or later."
      />
      <form className="inos-form" onSubmit={submit} noValidate>
        <FormSection step={1} title="Who is the client" description="A person or a company.">
          <Field label="Client name" required error={errors.name} htmlFor="cl-name">
            <TextInput id="cl-name" autoFocus value={f.name} onChange={set("name")} onBlur={() => errors.name && validate()} invalid={!!errors.name} placeholder="e.g. Malhotra Residence or Arora Foods Pvt Ltd" data-testid="client-name" />
          </Field>
          <Field label="Contact person" optional hint="For companies — who you deal with day to day.">
            <TextInput value={f.contact_person} onChange={set("contact_person")} placeholder="e.g. Siddharth Arora" data-testid="client-contact" />
          </Field>
        </FormSection>
        <FormSection step={2} title="How to reach them">
          <Field label="Phone" optional error={errors.phone}>
            <TextInput type="tel" value={f.phone} onChange={set("phone")} invalid={!!errors.phone} placeholder="+91 98100 12345" data-testid="client-phone" />
          </Field>
          <Field label="Email" optional error={errors.email}>
            <TextInput type="email" value={f.email} onChange={set("email")} invalid={!!errors.email} placeholder="name@example.com" data-testid="client-email" />
          </Field>
          <Field label="Address" optional full hint="Billing or residence address; the site address lives on each project.">
            <TextArea rows={3} value={f.address} onChange={set("address")} placeholder="House / office, street, city, PIN" />
          </Field>
        </FormSection>
        <FormActions onCancel={() => navigate(editing ? `/clients/${id}` : "/clients")} submitLabel={editing ? "Save changes" : "Add client"} submitting={c || u} />
      </form>
    </Page>
  );
}
