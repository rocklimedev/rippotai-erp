import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button, Field, TextInput, SelectInput, ChoiceGroup } from "@/components/inos";
import { useGetClientsQuery } from "@/api/projects/client.api";
import { useCreateLeadMutation } from "@/api/connectors/leads.api";
import { STAGES, formatINR } from "@/hooks/stages";
import { Modal } from "./Modal";
import { errorText, parseRupees } from "./utils";

const TYPES = ["Residential", "Commercial", "Institutional"];

const empty = (stage) => ({
  clientMode: "existing",
  clientId: "",
  newClientName: "",
  phone: "",
  email: "",
  contact: "",
  dealName: "",
  amount: "",
  stage: stage || "capture",
  ownerId: "",
  source: "Referral",
  expectedClose: "",
  type: "Residential",
  location: "",
});

/**
 * Bigin-style quick create: client (pick or new), project name, value,
 * stage, owner, source, expected close. Everything else is edited later
 * in the deal drawer.
 */
export default function QuickCreateDeal({ open, onOpenChange, defaultStage, meta, onCreated }) {
  const [form, setForm] = useState(empty(defaultStage));
  const [errors, setErrors] = useState({});
  const { data: clients = [] } = useGetClientsQuery(undefined, { skip: !open });
  const [createLead, { isLoading }] = useCreateLeadMutation();

  useEffect(() => {
    if (open) {
      setForm(empty(defaultStage));
      setErrors({});
    }
  }, [open, defaultStage]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const sortedClients = useMemo(
    () => [...(Array.isArray(clients) ? clients : [])].sort((a, b) => a.name.localeCompare(b.name)),
    [clients],
  );
  const selectedClient = sortedClients.find((c) => c.id === form.clientId);
  const amountValue = parseRupees(form.amount);

  const onClientPick = (id) => {
    set("clientId", id);
    const c = sortedClients.find((x) => x.id === id);
    if (c && !form.dealName.trim()) {
      const surname = c.name.split(/\s+/).slice(-1)[0];
      setForm((f) => ({ ...f, clientId: id, dealName: `${surname} ${form.type === "Residential" ? "Residence" : "Project"}` }));
    }
  };

  const validate = () => {
    const e = {};
    if (form.clientMode === "existing" && !form.clientId) e.clientId = "Pick a client, or add a new one.";
    if (form.clientMode === "new" && !form.newClientName.trim()) e.newClientName = "Enter the client's name.";
    if (form.clientMode === "new" && !form.phone.trim() && !form.email.trim()) e.phone = "Add a phone number or email.";
    if (!form.dealName.trim()) e.dealName = "Name the deal, e.g. “Malhotra Residence”.";
    if (form.amount && Number.isNaN(amountValue)) e.amount = "Use a number, e.g. 45 L or 1.2 Cr.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async () => {
    if (!validate()) return;
    const owner = meta?.owners?.find((o) => (o.id || o.name) === form.ownerId);
    const body = {
      dealName: form.dealName.trim(),
      contact: form.contact.trim() || undefined,
      amount: amountValue ?? undefined,
      stage: form.stage,
      source: form.source || undefined,
      expectedClose: form.expectedClose || undefined,
      type: form.type,
      location: form.location.trim() || undefined,
      ...(owner ? (owner.id ? { ownerId: owner.id } : { owner: owner.name }) : {}),
      ...(form.clientMode === "existing"
        ? { clientId: form.clientId }
        : {
            newClient: {
              name: form.newClientName.trim(),
              phone: form.phone.trim() || undefined,
              email: form.email.trim() || undefined,
              contactPerson: form.contact.trim() || undefined,
            },
            phone: form.phone.trim() || undefined,
            email: form.email.trim() || undefined,
          }),
    };
    try {
      const deal = await createLead(body).unwrap();
      toast.success(`${deal.title} added to ${STAGES.find((s) => s.id === deal.stage)?.label}`);
      onOpenChange(false);
      onCreated?.(deal);
    } catch (err) {
      toast.error(errorText(err, "Couldn't create the deal."));
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New deal"
      description="The essentials now — add notes, tasks and documents from the deal page."
      testId="quick-create-deal"
      footer={
        <>
          <span className="note">Owner defaults to you.</span>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={isLoading} data-testid="create-deal-submit">
            Create deal
          </Button>
        </>
      }
    >
      <form
        className="inos-form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        {form.clientMode === "existing" ? (
          <Field
            label="Client"
            required
            htmlFor="qc-client"
            error={errors.clientId}
            hint={selectedClient ? [selectedClient.contact_person, selectedClient.phone].filter(Boolean).join(" · ") : undefined}
          >
            <SelectInput id="qc-client" value={form.clientId} onChange={(e) => onClientPick(e.target.value)} placeholder="Select a client…" invalid={!!errors.clientId}>
              {sortedClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectInput>
            <button type="button" className="crm-linkbtn" style={{ justifySelf: "start" }} onClick={() => set("clientMode", "new")}>
              + New client
            </button>
          </Field>
        ) : (
          <Field label="New client name" required htmlFor="qc-newclient" error={errors.newClientName}>
            <TextInput id="qc-newclient" value={form.newClientName} onChange={(e) => set("newClientName", e.target.value)} placeholder="e.g. Rhea Malhotra" autoFocus invalid={!!errors.newClientName} />
            <button type="button" className="crm-linkbtn" style={{ justifySelf: "start" }} onClick={() => set("clientMode", "existing")}>
              Pick an existing client instead
            </button>
          </Field>
        )}

        <Field label="Contact person" optional htmlFor="qc-contact">
          <TextInput id="qc-contact" value={form.contact} onChange={(e) => set("contact", e.target.value)} placeholder="Who you're speaking with" />
        </Field>

        {form.clientMode === "new" && (
          <>
            <Field label="Phone" htmlFor="qc-phone" error={errors.phone} hint="Phone or email is enough.">
              <TextInput id="qc-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98XXX XXXXX" inputMode="tel" invalid={!!errors.phone} />
            </Field>
            <Field label="Email" optional htmlFor="qc-email">
              <TextInput id="qc-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" />
            </Field>
          </>
        )}

        <Field label="Deal / project name" required htmlFor="qc-deal" error={errors.dealName}>
          <TextInput id="qc-deal" value={form.dealName} onChange={(e) => set("dealName", e.target.value)} placeholder="e.g. DLF Camellias apartment" invalid={!!errors.dealName} />
        </Field>

        <Field
          label="Deal value"
          optional
          htmlFor="qc-amount"
          error={errors.amount}
          hint={amountValue && !Number.isNaN(amountValue) ? `= ${formatINR(amountValue, { compact: false })}` : "Type 45 L, 1.2 Cr or a full amount."}
        >
          <div className="crm-input-prefix">
            <span>₹</span>
            <TextInput id="qc-amount" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="45 L" inputMode="decimal" invalid={!!errors.amount} />
          </div>
        </Field>

        <Field label="Stage" htmlFor="qc-stage">
          <SelectInput id="qc-stage" value={form.stage} onChange={(e) => set("stage", e.target.value)}>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Owner" htmlFor="qc-owner">
          <SelectInput id="qc-owner" value={form.ownerId} onChange={(e) => set("ownerId", e.target.value)}>
            <option value="">Me</option>
            {(meta?.owners || []).map((o) => (
              <option key={o.id || o.name} value={o.id || o.name}>
                {o.name}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Source" htmlFor="qc-source">
          <SelectInput id="qc-source" value={form.source} onChange={(e) => set("source", e.target.value)}>
            {(meta?.sources || ["Referral", "Website", "Instagram", "Walk-in", "Other"]).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Expected close" optional htmlFor="qc-close">
          <TextInput id="qc-close" type="date" value={form.expectedClose} onChange={(e) => set("expectedClose", e.target.value)} />
        </Field>

        <Field label="Location" optional htmlFor="qc-location">
          <TextInput id="qc-location" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Golf Course Road, Gurugram" />
        </Field>

        <Field label="Project type" full>
          <ChoiceGroup value={form.type} onChange={(v) => set("type", v)} options={TYPES.map((t) => ({ value: t, label: t }))} name="Project type" />
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
