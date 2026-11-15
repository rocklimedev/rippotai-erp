import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button, Field, TextInput, SelectInput, ChoiceGroup } from '@/components/inos';
import { useGetClientsQuery } from '@/api/projects/client.api';
import { useCreateLeadMutation, useUpdateLeadMutation } from '@/api/connectors/leads.api';
import { STAGES, formatINR } from '@/hooks/stages';
import { Modal } from './Modal';
import { errorText, parseRupees } from './utils';
import { SERVICES, TEMPERATURES } from './dealMeta';

const TYPES = ['Residential', 'Commercial', 'Institutional'];
const DEFAULT_SOURCES = ['Referral', 'Website', 'Social Media', 'Walk-in', 'Other'];

// Digits only, max 10. Handles pasted "+91 98765 43210" / "098765 43210".
const toTenDigits = (raw) => {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length > 10) {
    if (digits.startsWith('91')) digits = digits.slice(2);
    else if (digits.startsWith('0')) digits = digits.slice(1);
  }
  return digits.slice(0, 10);
};

const ALLOWED_KEYS = [
  'Backspace',
  'Delete',
  'Tab',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'Enter',
];
const blockNonDigits = (e) => {
  if (ALLOWED_KEYS.includes(e.key) || e.ctrlKey || e.metaKey) return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
};

const empty = (stage) => ({
  clientMode: 'existing', // default: pick an existing client
  clientId: '',
  newClientName: '',
  phone: '',
  email: '',
  whatsapp: '',
  contact: '',
  dealName: '',
  amount: '',
  stage: stage || 'capture',
  ownerId: '',
  source: 'Referral',
  expectedClose: '',
  type: 'Residential',
  location: '',
  size: '',
  service: 'DESIGN',
  tag: '',
  description: '',
});

// 6500000 -> "65 L", 12000000 -> "1.2 Cr" (what the value field accepts).
const rupeesText = (n) => {
  const v = Number(n);
  if (!v) return '';
  const trim = (x) => String(Math.round(x * 100) / 100);
  if (v >= 1e7) return `${trim(v / 1e7)} Cr`;
  if (v >= 1e5) return `${trim(v / 1e5)} L`;
  return String(v);
};

// Edit mode: the form starts from the deal (client / project facts already merged by the API).
const fromDeal = (d) => ({
  ...empty(d.stage),
  clientId: d.clientId || '',
  phone: toTenDigits(d.phone || ''),
  email: d.email || '',
  whatsapp: d.whatsapp && d.whatsapp !== d.phone ? d.whatsapp : '',
  contact: d.contact && d.contact !== d.title ? d.contact : '',
  dealName: d.dealName || d.title || '',
  amount: rupeesText(d.amount),
  ownerId: d.ownerId || d.owner || '',
  source: d.source || '',
  expectedClose: d.expectedClose ? String(d.expectedClose).slice(0, 10) : '',
  type: d.type || 'Residential',
  location: d.location || '',
  size: d.size || '',
  service: d.service === 'BUILD' ? 'BUILD' : 'DESIGN',
  tag: d.tag || '',
  description: d.description || '',
});

/**
 * Quick create / edit: client (pick existing by default, or new), project name,
 * value, stage, owner, source, expected close, location, size, type, service
 * (Design / Build) and lead temperature. Pass `deal` to edit an existing deal.
 * The deal's project and client are created / filled on the server so every
 * document for that project autofills.
 */
export default function QuickCreateDeal({ open, onOpenChange, defaultStage, meta, onCreated, deal }) {
  const editing = !!deal;
  const [form, setForm] = useState(() => (deal ? fromDeal(deal) : empty(defaultStage)));
  const [errors, setErrors] = useState({});
  const { data: clients = [], isSuccess: clientsLoaded } = useGetClientsQuery(undefined, {
    skip: !open,
  });
  const [createLead, { isLoading: creating }] = useCreateLeadMutation();
  const [updateLead, { isLoading: updating }] = useUpdateLeadMutation();
  const isLoading = creating || updating;

  // Reset every time the modal opens (create: "existing client"; edit: the deal).
  useEffect(() => {
    if (open) {
      setForm(deal ? fromDeal(deal) : empty(defaultStage));
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultStage, deal?.id]);

  const sortedClients = useMemo(
    () =>
      [...(Array.isArray(clients) ? clients : [])].sort((a, b) =>
        (a.name || '').localeCompare(b.name || ''),
      ),
    [clients],
  );

  // No clients to pick from? Fall back to "new client" so the user isn't stuck.
  useEffect(() => {
    if (open && !editing && clientsLoaded && sortedClients.length === 0) {
      setForm((f) => (f.clientMode === 'existing' ? { ...f, clientMode: 'new' } : f));
    }
  }, [open, editing, clientsLoaded, sortedClients.length]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: k === 'phone' || k === 'whatsapp' ? toTenDigits(v) : v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const setMode = (mode) => {
    setForm((f) => ({
      ...f,
      clientMode: mode,
      clientId: mode === 'existing' ? f.clientId : '',
      newClientName: mode === 'new' ? f.newClientName : '',
      phone: mode === 'new' ? f.phone : '',
      email: mode === 'new' ? f.email : '',
    }));
    setErrors((e) => ({
      ...e,
      clientId: undefined,
      newClientName: undefined,
      phone: undefined,
    }));
  };

  const selectedClient = sortedClients.find((c) => c.id === form.clientId);
  const amountValue = parseRupees(form.amount);

  const onClientPick = (id) => {
    const c = sortedClients.find((x) => x.id === id);
    setForm((f) => {
      const next = { ...f, clientId: id };
      if (c && !editing && !f.dealName.trim()) {
        const surname = (c.name || '').split(/\s+/).slice(-1)[0];
        next.dealName = `${surname} ${f.type === 'Residential' ? 'Residence' : 'Project'}`;
      }
      return next;
    });
    if (errors.clientId) setErrors((e) => ({ ...e, clientId: undefined }));
  };

  const sources = useMemo(
    () => [
      ...new Set(
        (meta?.sources?.length ? meta.sources : DEFAULT_SOURCES)
          .filter((s) => !/zoho|bigin/i.test(s))
          .map((s) => (s === 'Instagram' ? 'Social Media' : s)),
      ),
    ],
    [meta],
  );

  const validate = () => {
    const e = {};
    if (form.clientMode === 'existing' && !form.clientId && !editing)
      e.clientId = 'Pick a client, or add a new one.';
    if (form.clientMode === 'new') {
      if (!form.newClientName.trim()) e.newClientName = "Enter the client's name.";
      if (!form.phone && !form.email.trim()) e.phone = 'Add a phone number or email.';
    }
    if (form.phone && form.phone.length !== 10) e.phone = 'Enter a 10-digit phone number.';
    if (form.whatsapp && form.whatsapp.length !== 10)
      e.whatsapp = 'Enter a 10-digit WhatsApp number.';
    if (!form.service) e.service = 'Pick Design or Build.';
    if (!form.dealName.trim()) e.dealName = 'Name the deal, e.g. “Malhotra Residence”.';
    if (form.amount && Number.isNaN(amountValue)) e.amount = 'Use a number, e.g. 45 L or 1.2 Cr.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async () => {
    if (isLoading || !validate()) return;
    const owner = meta?.owners?.find((o) => (o.id || o.name) === form.ownerId);
    if (editing) return submitEdit(owner);
    const body = {
      dealName: form.dealName.trim(),
      contact: form.contact.trim() || undefined,
      amount: amountValue ?? undefined,
      stage: form.stage,
      source: form.source || undefined,
      expectedClose: form.expectedClose || undefined,
      type: form.type,
      location: form.location.trim() || undefined,
      size: form.size.trim() || undefined,
      service: form.service,
      tag: form.tag || undefined,
      description: form.description.trim() || undefined,
      whatsapp: form.whatsapp || undefined,
      ...(owner ? (owner.id ? { ownerId: owner.id } : { owner: owner.name }) : {}),
      ...(form.clientMode === 'existing'
        ? { clientId: form.clientId }
        : {
            newClient: {
              name: form.newClientName.trim(),
              phone: form.phone || undefined,
              email: form.email.trim() || undefined,
              contactPerson: form.contact.trim() || undefined,
            },
            phone: form.phone || undefined,
            email: form.email.trim() || undefined,
          }),
    };
    try {
      const deal = await createLead(body).unwrap();
      toast.success(`${deal.title} added to ${STAGES.find((s) => s.id === deal.stage)?.label}`);
      onCreated?.(deal); // before closing, so callers can flag "created"
      onOpenChange(false);
    } catch (err) {
      toast.error(errorText(err, "Couldn't create the deal."));
    }
  };

  // Edit: send every field; the server only records (and writes through) real changes.
  const submitEdit = async (owner) => {
    const body = {
      id: deal.id,
      dealName: form.dealName.trim(),
      contact: form.contact.trim() || deal.contact || undefined,
      phone: form.phone || null,
      email: form.email.trim() || null,
      whatsapp: form.whatsapp || null,
      amount: amountValue ?? null,
      source: form.source || null,
      expectedClose: form.expectedClose || null,
      type: form.type,
      location: form.location.trim() || null,
      size: form.size.trim() || null,
      service: form.service,
      tag: form.tag || null,
      description: form.description.trim() || null,
      ...(form.stage !== deal.stage && form.stage !== 'lost' ? { stage: form.stage } : {}),
      ...(owner
        ? owner.id
          ? { ownerId: owner.id }
          : { owner: owner.name, ownerId: null }
        : {}),
      ...(form.clientMode === 'existing'
        ? form.clientId && form.clientId !== deal.clientId
          ? { clientId: form.clientId }
          : {}
        : {
            newClient: {
              name: form.newClientName.trim(),
              phone: form.phone || undefined,
              email: form.email.trim() || undefined,
              contactPerson: form.contact.trim() || undefined,
            },
          }),
    };
    try {
      const saved = await updateLead(body).unwrap();
      toast.success(`Saved — ${saved?.title || form.dealName}`);
      onOpenChange(false);
    } catch (err) {
      toast.error(errorText(err, "Couldn't save the deal."));
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit deal' : 'New deal'}
      description={
        editing
          ? 'Changes to location, size, budget and contact also update the linked project and client.'
          : 'A project is created for this client so briefs, recce and scope autofill from these details.'
      }
      testId={editing ? 'edit-deal' : 'quick-create-deal'}
      footer={
        <>
          <span className="note">{editing ? '' : 'Owner defaults to you.'}</span>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            loading={isLoading}
            data-testid={editing ? 'edit-deal-submit' : 'create-deal-submit'}
          >
            {editing ? 'Save changes' : 'Create deal'}
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
        {form.clientMode === 'existing' ? (
          <Field
            label="Client"
            required
            htmlFor="qc-client"
            error={errors.clientId}
            hint={
              selectedClient
                ? [selectedClient.contact_person, selectedClient.phone].filter(Boolean).join(' · ')
                : undefined
            }
          >
            <SelectInput
              id="qc-client"
              value={form.clientId}
              onChange={(e) => onClientPick(e.target.value)}
              placeholder={editing ? 'No client linked' : 'Select an existing client…'}
              invalid={!!errors.clientId}
            >
              {sortedClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectInput>
            <button
              type="button"
              className="crm-linkbtn"
              style={{ justifySelf: 'start' }}
              onClick={() => setMode('new')}
            >
              + New client
            </button>
          </Field>
        ) : (
          <Field
            label="New client name"
            required
            htmlFor="qc-newclient"
            error={errors.newClientName}
          >
            <TextInput
              id="qc-newclient"
              value={form.newClientName}
              onChange={(e) => set('newClientName', e.target.value)}
              placeholder="e.g. Rhea Malhotra"
              autoFocus
              invalid={!!errors.newClientName}
            />
            {sortedClients.length > 0 && (
              <button
                type="button"
                className="crm-linkbtn"
                style={{ justifySelf: 'start' }}
                onClick={() => setMode('existing')}
              >
                Pick an existing client instead
              </button>
            )}
          </Field>
        )}

        <Field label="Contact person" optional htmlFor="qc-contact">
          <TextInput
            id="qc-contact"
            value={form.contact}
            onChange={(e) => set('contact', e.target.value)}
            placeholder="Who you're speaking with"
          />
        </Field>

        {(form.clientMode === 'new' || editing) && (
          <>
            <Field label="Phone" htmlFor="qc-phone" error={errors.phone}>
              <TextInput
                id="qc-phone"
                name="phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                onKeyDown={blockNonDigits}
                placeholder="10-digit phone number"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="tel-national"
                invalid={!!errors.phone}
              />
            </Field>
            <Field label="Email" optional htmlFor="qc-email">
              <TextInput
                id="qc-email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="name@example.com"
              />
            </Field>
            <Field label="WhatsApp" optional htmlFor="qc-whatsapp" error={errors.whatsapp}>
              <TextInput
                id="qc-whatsapp"
                value={form.whatsapp}
                onChange={(e) => set('whatsapp', e.target.value)}
                onKeyDown={blockNonDigits}
                placeholder="If different from phone"
                inputMode="numeric"
                invalid={!!errors.whatsapp}
              />
            </Field>
          </>
        )}

        <Field label="Deal / project name" required htmlFor="qc-deal" error={errors.dealName}>
          <TextInput
            id="qc-deal"
            value={form.dealName}
            onChange={(e) => set('dealName', e.target.value)}
            placeholder="e.g. DLF Camellias apartment"
            invalid={!!errors.dealName}
          />
        </Field>

        <Field
          label="Deal value"
          optional
          htmlFor="qc-amount"
          error={errors.amount}
          hint={
            amountValue && !Number.isNaN(amountValue)
              ? `= ${formatINR(amountValue, { compact: false })}`
              : 'Type 45 L, 1.2 Cr or a full amount.'
          }
        >
          <div className="crm-input-prefix">
            <span>₹</span>
            <TextInput
              id="qc-amount"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              placeholder="45 L"
              inputMode="decimal"
              invalid={!!errors.amount}
            />
          </div>
        </Field>

        <Field label="Stage" htmlFor="qc-stage">
          <SelectInput
            id="qc-stage"
            value={form.stage}
            onChange={(e) => set('stage', e.target.value)}
          >
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Owner" htmlFor="qc-owner">
          <SelectInput
            id="qc-owner"
            value={form.ownerId}
            onChange={(e) => set('ownerId', e.target.value)}
          >
            <option value="">Me</option>
            {(meta?.owners || []).map((o) => (
              <option key={o.id || o.name} value={o.id || o.name}>
                {o.name}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Source" htmlFor="qc-source">
          <SelectInput
            id="qc-source"
            value={form.source}
            onChange={(e) => set('source', e.target.value)}
          >
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Expected close" optional htmlFor="qc-close">
          <TextInput
            id="qc-close"
            type="date"
            value={form.expectedClose}
            onChange={(e) => set('expectedClose', e.target.value)}
          />
        </Field>

        <Field label="Location" optional htmlFor="qc-location">
          <TextInput
            id="qc-location"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="e.g. Golf Course Road, Gurugram"
          />
        </Field>

        <Field label="Size" optional htmlFor="qc-size" hint="e.g. 2500 sq ft or 200 gaj">
          <TextInput
            id="qc-size"
            value={form.size}
            onChange={(e) => set('size', e.target.value)}
            placeholder="2500 sq ft"
          />
        </Field>

        <Field label="Service" required error={errors.service}>
          <div data-testid="qc-service">
            <ChoiceGroup
              value={form.service}
              onChange={(v) => set('service', v)}
              options={SERVICES}
              name="Service"
            />
          </div>
        </Field>

        <Field label="Project type" full>
          <ChoiceGroup
            value={form.type}
            onChange={(v) => set('type', v)}
            options={TYPES.map((t) => ({ value: t, label: t }))}
            name="Project type"
          />
        </Field>

        <Field label="Lead temperature" optional full>
          <div data-testid="qc-temp">
            <ChoiceGroup
              value={form.tag}
              onChange={(v) => set('tag', form.tag === v ? '' : v)}
              options={TEMPERATURES}
              name="Lead temperature"
            />
          </div>
        </Field>

        <Field label="Notes / brief" optional full htmlFor="qc-desc">
          <TextInput
            id="qc-desc"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="e.g. G+2 farmhouse, full interiors"
          />
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
