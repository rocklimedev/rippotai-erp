import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Page,
  PageHeader,
  FormSection,
  Field,
  TextInput,
  SelectInput,
  ChoiceGroup,
  FormActions,
} from "@/components/inos";
import { Callout } from "@/components/forms/crm-form-ui";
import {
  useCreateLeadMutation,
  useGetLeadsMetaQuery,
} from "../../api/connectors/leads.api";
import { STAGES, formatINR } from "../../hooks/stages";
import { parseRupees } from "../../components/leads/pipeline/utils";

// Full-page lead capture. Creates the deal in INOS's own pipeline
// (/crm/pipeline); if Zoho Bigin is connected the backend mirrors it there.

const EMPTY_FORM = {
  name: "",
  phone: "",
  whatsapp: "",
  email: "",
  type: "Residential",
  location: "",
  size: "",
  budget: "₹25L–₹75L",
  timeline: "1–3 months",
  source: "Website",
  dealName: "",
  amount: "",
  stage: "capture",
  ownerId: "",
  expectedClose: "",
};

export default function NewLeadPage({ onCaptured }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    stage: STAGES.some((s) => s.id === location.state?.stage)
      ? location.state.stage
      : "capture",
  }));
  const [samePhone, setSamePhone] = useState(true);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [bannerErr, setBannerErr] = useState(false);
  const [createLead, { isLoading }] = useCreateLeadMutation();
  const { data: meta } = useGetLeadsMetaQuery();

  const sources = useMemo(() => {
    const list = [
      ...new Set(
        (meta?.sources?.length ? meta.sources : SOURCES)
          .filter((s) => !/zoho|bigin/i.test(s))
          .map((s) => (s === "Instagram" ? "Social Media" : s)),
      ),
    ];
    return list.includes(form.source) ? list : [form.source, ...list];
  }, [meta, form.source]);

  const onForm = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({
      ...current,
      [name]: ["phone", "whatsapp"].includes(name)
        ? value.replace(/\D/g, "").slice(0, 10)
        : value,
    }));
    if (errors[name]) setErrors((x) => ({ ...x, [name]: undefined }));
    if (bannerErr) {
      setBanner("");
      setBannerErr(false);
    }
  };
  const setValue = (name, value) => onForm({ target: { name, value } });
  const fieldError = (key) => errors[key];
  const amountValue = parseRupees(form.amount);

  const onCapture = async () => {
    const next = {};
    if (!form.name.trim()) next.name = "Enter the lead's full name.";
    if (!form.phone.trim()) next.phone = "A phone number is required.";
    else if (form.phone.length !== 10)
      next.phone = "Enter a 10-digit phone number.";
    if (!samePhone && form.whatsapp && form.whatsapp.length !== 10)
      next.whatsapp = "Enter a 10-digit WhatsApp number.";
    if (form.amount && Number.isNaN(amountValue))
      next.amount = "Use a number, e.g. 45 L or 1.2 Cr.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const owner = meta?.owners?.find((o) => (o.id || o.name) === form.ownerId);
    try {
      const res = await createLead({
        name: form.name.trim(),
        dealName: form.dealName.trim() || undefined,
        phone: form.phone.trim(),
        whatsapp: samePhone
          ? form.phone.trim()
          : form.whatsapp.trim() || undefined,
        email: form.email.trim() || undefined,
        type: form.type,
        location: form.location.trim() || undefined,
        size: form.size.trim() ? `${form.size.trim()} sq ft` : undefined,
        budget: form.budget,
        amount: amountValue ?? undefined,
        timeline: form.timeline,
        source: form.source,
        stage: form.stage,
        expectedClose: form.expectedClose || undefined,
        ...(owner
          ? owner.id
            ? { ownerId: owner.id }
            : { owner: owner.name }
          : {}),
      }).unwrap();
      onCaptured?.(res);
      navigate(`/crm/pipeline?deal=${res.id}`);
    } catch (error) {
      const m = error?.data?.message;
      setBanner(
        `We couldn't capture this lead${m ? `: ${Array.isArray(m) ? m.join(", ") : m}` : ". Please check the details and try again."}`,
      );
      setBannerErr(true);
    }
  };

  return (
    <Page width="form">
      <PageHeader
        crumbs={[
          { label: "CRM", to: "/crm" },
          { label: "Pipeline", to: "/crm/pipeline" },
          { label: "New lead" },
        ]}
        title="New lead"
        subtitle="Capture the essentials now — the deal lands in your pipeline and can be enriched later."
      />

      {banner && <Callout tone={bannerErr ? "bad" : "ok"}>{banner}</Callout>}

      <form
        className="inos-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isLoading) onCapture();
        }}
        noValidate
      >
        <FormSection
          step={1}
          title="Contact"
          description="Who are you speaking with?"
        >
          <Field
            label="Full name"
            required
            htmlFor="lead-name"
            error={fieldError("name")}
          >
            <TextInput
              id="lead-name"
              name="name"
              value={form.name}
              onChange={onForm}
              placeholder="e.g. Rhea Malhotra"
              autoComplete="name"
              autoFocus
              invalid={Boolean(fieldError("name"))}
            />
          </Field>

          <Field
            label="Phone"
            required
            htmlFor="lead-phone"
            error={fieldError("phone")}
          >
            <TextInput
              id="lead-phone"
              name="phone"
              value={form.phone}
              onChange={onForm}
              placeholder="10-digit phone number"
              maxLength={10}
              inputMode="tel"
              autoComplete="tel"
              invalid={Boolean(fieldError("phone"))}
            />
          </Field>

          <Field
            label="WhatsApp"
            htmlFor="lead-whatsapp"
            error={fieldError("whatsapp")}
          >
            <TextInput
              id="lead-whatsapp"
              name="whatsapp"
              value={samePhone ? form.phone : form.whatsapp}
              onChange={onForm}
              disabled={samePhone}
              placeholder="10-digit phone number"
              maxLength={10}
              inputMode="tel"
            />
            <label className="crmf-check">
              <input
                type="checkbox"
                checked={samePhone}
                onChange={(e) => setSamePhone(e.target.checked)}
              />
              Same as phone
            </label>
          </Field>

          <Field label="Email" optional htmlFor="lead-email">
            <TextInput
              id="lead-email"
              name="email"
              value={form.email}
              onChange={onForm}
              placeholder="name@example.com"
              type="email"
              autoComplete="email"
            />
          </Field>
        </FormSection>

        <FormSection
          step={2}
          title="Project"
          description="Enough context to understand the opportunity."
        >
          <Field label="Project type" full>
            <ChoiceGroup
              name="Project type"
              value={form.type}
              onChange={(v) => setValue("type", v)}
              options={PROJECT_TYPES.map((v) => ({ value: v, label: v }))}
            />
          </Field>

          <Field
            label="Location"
            optional
            htmlFor="lead-location"
            hint="City and state."
          >
            <TextInput
              id="lead-location"
              name="location"
              value={form.location}
              onChange={onForm}
              placeholder="e.g. Gurugram, Haryana"
              autoComplete="address-level2"
            />
          </Field>

          <Field label="Approx. size" optional htmlFor="lead-size">
            <div className="crmf-affix">
              <TextInput
                id="lead-size"
                name="size"
                value={form.size}
                onChange={onForm}
                placeholder="e.g. 3,200"
                inputMode="numeric"
              />
              <span className="crmf-affix__end">sq ft</span>
            </div>
          </Field>
        </FormSection>

        <FormSection
          step={3}
          title="Qualification"
          description="How valuable and how urgent is this lead?"
        >
          <Field label="Budget range" htmlFor="lead-budget">
            <SelectInput
              id="lead-budget"
              name="budget"
              value={form.budget}
              onChange={onForm}
            >
              {BUDGETS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </SelectInput>
          </Field>

          <Field
            label="Lead source"
            htmlFor="lead-source"
            hint={
              form.source.startsWith("Referral")
                ? "Add the referrer's name in the lead notes later."
                : undefined
            }
          >
            <SelectInput
              id="lead-source"
              name="source"
              value={form.source}
              onChange={onForm}
            >
              {sources.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Expected timeline" full>
            <ChoiceGroup
              name="Expected timeline"
              value={form.timeline}
              onChange={(v) => setValue("timeline", v)}
              options={TIMELINES.map((v) => ({ value: v, label: v }))}
            />
          </Field>
        </FormSection>

        <FormSection
          step={4}
          title="Pipeline"
          description="Where the deal lands on the board and who owns it."
        >
          <Field
            label="Deal / project name"
            optional
            htmlFor="lead-deal"
            hint="Defaults to the contact's name."
          >
            <TextInput
              id="lead-deal"
              name="dealName"
              value={form.dealName}
              onChange={onForm}
              placeholder="e.g. Malhotra Residence, Vasant Vihar"
            />
          </Field>

          <Field
            label="Estimated value"
            optional
            htmlFor="lead-amount"
            error={fieldError("amount")}
            hint={
              amountValue && !Number.isNaN(amountValue)
                ? `= ${formatINR(amountValue, { compact: false })}`
                : "Leave empty to estimate from the budget range."
            }
          >
            <TextInput
              id="lead-amount"
              name="amount"
              value={form.amount}
              onChange={onForm}
              placeholder="e.g. 60 L or 1.5 Cr"
              invalid={Boolean(fieldError("amount"))}
            />
          </Field>

          <Field label="Stage" htmlFor="lead-stage">
            <SelectInput
              id="lead-stage"
              name="stage"
              value={form.stage}
              onChange={onForm}
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Owner" htmlFor="lead-owner">
            <SelectInput
              id="lead-owner"
              name="ownerId"
              value={form.ownerId}
              onChange={onForm}
            >
              <option value="">Me</option>
              {(meta?.owners || []).map((o) => (
                <option key={o.id || o.name} value={o.id || o.name}>
                  {o.name}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Expected close" optional htmlFor="lead-close">
            <TextInput
              id="lead-close"
              name="expectedClose"
              type="date"
              value={form.expectedClose}
              onChange={onForm}
            />
          </Field>
        </FormSection>

        <FormActions
          note={
            meta?.zohoConnected
              ? "Saved in INOS and mirrored to Zoho Bigin"
              : "Saved to the INOS pipeline"
          }
          onCancel={() => navigate(-1)}
          submitLabel={isLoading ? "Capturing lead…" : "Capture lead"}
          submitting={isLoading}
        />
      </form>
    </Page>
  );
}

const PROJECT_TYPES = ["Residential", "Commercial", "Institutional"];
const BUDGETS = [
  "Under ₹25L",
  "₹25L–₹75L",
  "₹75L–₹2Cr",
  "₹2Cr–₹5Cr",
  "₹5Cr+",
  "₹10Cr+",
  "₹15Cr+",
];
const TIMELINES = ["Immediate", "1–3 months", "3–6 months", "6+ months"];
const SOURCES = [
  "Website",
  "Referral — add name in notes",
  "Social Media",
  "WhatsApp",
  "Walk-in",
];
