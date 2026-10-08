// Admin Console → Company profile. Letterhead, tax ids, bank account and billing
// defaults printed on quotations, POs, work orders and challans.
// Stored in the settings table as JSON: company_profile, bank_details, billing
// (read by print-document/commerce.jsx → useCompanyProfile()).
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ImageUp, X } from "lucide-react";
import {
  Page,
  PageHeader,
  Button,
  Field,
  TextInput,
  TextArea,
  FormSection,
  FormActions,
  Pill,
} from "@/components/inos";
import {
  useGetSettingsQuery,
  useUpsertSettingMutation,
} from "@/api/meta/settings.api";
import {
  settingObject,
  COMPANY_PROFILE_KEY,
  BANK_DETAILS_KEY,
} from "@/components/print-document/commerce";
import { useAuth } from "@/context/AuthContext";
import { AdminAccessDenied, adminCrumbs } from "./_admin-ui";

const BILLING_KEY = "billing";

const EMPTY = {
  name: "",
  legalName: "",
  tagline: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  gstin: "",
  pan: "",
  logoUrl: "",
  bank: "",
  accountName: "",
  accountNumber: "",
  ifsc: "",
  branch: "",
  upi: "",
  defaultGstRate: "18",
  quotationValidityDays: "30",
  invoicePrefix: "",
};

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const UPI_RE = /^[\w.-]{2,}@[a-zA-Z]{2,}$/;

function validate(f) {
  const e = {};
  if (!f.name.trim()) e.name = "Enter the name printed on documents.";
  if (f.gstin && !GSTIN_RE.test(f.gstin))
    e.gstin = "15 characters, e.g. 07AAVFR4821K1Z6.";
  if (f.pan && !PAN_RE.test(f.pan)) e.pan = "10 characters, e.g. AAVFR4821K.";
  if (
    f.gstin &&
    f.pan &&
    GSTIN_RE.test(f.gstin) &&
    f.gstin.slice(2, 12) !== f.pan
  )
    e.pan = "PAN doesn't match the GSTIN (characters 3–12).";
  if (f.ifsc && !IFSC_RE.test(f.ifsc))
    e.ifsc = "11 characters, e.g. HDFC0000236.";
  if (f.accountNumber && !/^\d{9,18}$/.test(f.accountNumber))
    e.accountNumber = "9–18 digits.";
  if (f.accountNumber && !f.ifsc) e.ifsc = "Needed with an account number.";
  if (f.upi && !UPI_RE.test(f.upi)) e.upi = "Looks like name@bank.";
  if (f.email && !/^\S+@\S+\.\S+$/.test(f.email))
    e.email = "Enter a valid email.";
  const gst = Number(f.defaultGstRate);
  if (f.defaultGstRate !== "" && (!Number.isFinite(gst) || gst < 0 || gst > 28))
    e.defaultGstRate = "0–28%.";
  return e;
}

export default function CompanyProfile() {
  const { user } = useAuth();
  const { data, isLoading } = useGetSettingsQuery();
  const [upsert] = useUpsertSettingMutation();
  const [form, setForm] = useState(EMPTY);
  const [stored, setStored] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const settings = useMemo(() => {
    const list = Array.isArray(data) ? data : data?.data || [];
    const byKey = {};
    list.forEach((s) => (byKey[s.key] = settingObject(s.value) || {}));
    return byKey;
  }, [data]);

  useEffect(() => {
    if (!data || dirty) return;
    const c = settings[COMPANY_PROFILE_KEY] || {};
    const b = settings[BANK_DETAILS_KEY] || {};
    const bl = settings[BILLING_KEY] || {};
    setStored({ c, b, bl });
    const s = (v) => (v == null ? "" : String(v));
    setForm({
      name: s(c.name),
      legalName: s(c.legalName),
      tagline: s(c.tagline),
      address: s(c.address),
      phone: s(c.phone),
      email: s(c.email),
      website: s(c.website),
      gstin: s(c.gstin),
      pan: s(c.pan),
      logoUrl: s(c.logoUrl),
      bank: s(b.bank),
      accountName: s(b.accountName),
      accountNumber: s(b.accountNumber),
      ifsc: s(b.ifsc),
      branch: s(b.branch),
      upi: s(b.upi),
      defaultGstRate: s(bl.defaultGstRate ?? 18),
      quotationValidityDays: s(bl.quotationValidityDays ?? 30),
      invoicePrefix: s(bl.invoicePrefix),
    });
  }, [data, settings, dirty]);

  const set = (k, upper) => (e) => {
    const v = upper
      ? e.target.value.toUpperCase().replace(/\s/g, "")
      : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const onLogo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\//.test(file.type))
      return toast.error("Choose an image (PNG, JPG or SVG).");
    if (file.size > 300 * 1024)
      return toast.error("Keep the logo under 300 KB.");
    const r = new FileReader();
    r.onload = () => {
      setForm((f) => ({ ...f, logoUrl: String(r.result) }));
      setDirty(true);
    };
    r.readAsDataURL(file);
  };

  const save = async () => {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Check the highlighted fields.");
      return;
    }
    setSaving(true);
    const t = (v) => String(v || "").trim();
    try {
      await upsert({
        key: COMPANY_PROFILE_KEY,
        value: {
          ...stored.c,
          name: t(form.name),
          legalName: t(form.legalName),
          tagline: t(form.tagline),
          address: t(form.address),
          phone: t(form.phone),
          email: t(form.email),
          website: t(form.website),
          gstin: t(form.gstin),
          pan: t(form.pan),
          logoUrl: t(form.logoUrl),
        },
      }).unwrap();
      await upsert({
        key: BANK_DETAILS_KEY,
        value: {
          ...stored.b,
          bank: t(form.bank),
          accountName: t(form.accountName),
          accountNumber: t(form.accountNumber),
          ifsc: t(form.ifsc),
          branch: t(form.branch),
          upi: t(form.upi),
        },
      }).unwrap();
      await upsert({
        key: BILLING_KEY,
        value: {
          ...stored.bl,
          defaultGstRate:
            form.defaultGstRate === "" ? 18 : Number(form.defaultGstRate),
          quotationValidityDays:
            form.quotationValidityDays === ""
              ? 30
              : Number(form.quotationValidityDays),
          invoicePrefix: t(form.invoicePrefix),
        },
      }).unwrap();
      setDirty(false);
      toast.success("Company profile saved — new PDFs will use it.");
    } catch (err) {
      toast.error(err?.data?.message || "Couldn't save the company profile.");
    } finally {
      setSaving(false);
    }
  };

  if (
    user &&
    !["ADMIN", "SUPERADMIN"].includes(
      String(user.role?.name || user.role || "").toUpperCase(),
    )
  ) {
    return (
      <AdminAccessDenied
        crumb="Company profile"
        text="Only administrators can change the company letterhead and bank details."
      />
    );
  }
  const bankReady = form.accountNumber && form.ifsc;

  return (
    <Page width="narrow">
      <PageHeader
        crumbs={adminCrumbs("Company profile")}
        title="Company profile"
        subtitle="Letterhead, tax registration and bank details printed on quotations, purchase orders, work orders and challans."
        actions={
          bankReady ? (
            <Pill tone="ok">Bank details on PDFs</Pill>
          ) : (
            <Pill tone="warn">No bank account yet</Pill>
          )
        }
      />

      <div>
        {isLoading ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div className="adm-skel" style={{ width: "40%" }} />
            <div
              className="adm-skel"
              style={{ height: 160, borderRadius: 12 }}
            />
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <FormSection
              step={1}
              title="Company"
              description="How the firm appears in the letterhead block."
            >
              <Field label="Name on documents" required error={errors.name}>
                <TextInput
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Rippotai Architecture"
                  invalid={!!errors.name}
                />
              </Field>
              <Field
                label="Legal name"
                optional
                hint="Registered entity, if different."
              >
                <TextInput
                  value={form.legalName}
                  onChange={set("legalName")}
                  placeholder="Rippotai Architecture LLP"
                />
              </Field>
              <Field label="Address" full>
                <TextArea
                  rows={2}
                  value={form.address}
                  onChange={set("address")}
                  placeholder="Street, area, city, PIN"
                />
              </Field>
              <Field label="Phone">
                <TextInput
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+91 98xxx xxxxx"
                />
              </Field>
              <Field label="Email" error={errors.email}>
                <TextInput
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="studio@rippotai.in"
                  invalid={!!errors.email}
                />
              </Field>
              <Field label="Website" optional>
                <TextInput
                  value={form.website}
                  onChange={set("website")}
                  placeholder="https://rippotai.in"
                />
              </Field>
              <Field label="Tagline" optional>
                <TextInput
                  value={form.tagline}
                  onChange={set("tagline")}
                  placeholder="Architecture | Interiors | Turnkey"
                />
              </Field>
              <Field
                label="Logo"
                full
                hint="PNG/SVG under 300 KB. Used on client-facing pages; PDF covers keep the standard Rippotai logo."
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    className="adm-sig"
                    style={{ minHeight: 64, minWidth: 160, padding: 10 }}
                  >
                    {form.logoUrl ? (
                      <img
                        src={form.logoUrl}
                        alt="Company logo"
                        style={{ maxHeight: 48 }}
                      />
                    ) : (
                      <span className="adm-cell-sub">No logo</span>
                    )}
                  </div>
                  <label
                    className="inos-btn inos-btn--soft"
                    style={{ cursor: "pointer" }}
                  >
                    <ImageUp size={16} aria-hidden /> Upload
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={onLogo}
                    />
                  </label>
                  {form.logoUrl && (
                    <Button
                      variant="ghost"
                      icon={X}
                      onClick={() => (
                        setForm((f) => ({ ...f, logoUrl: "" })),
                        setDirty(true)
                      )}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </Field>
            </FormSection>

            <FormSection
              step={2}
              title="Tax registration"
              description="Printed under the company name on every commercial document."
            >
              <Field label="GSTIN" error={errors.gstin} hint="15 characters">
                <TextInput
                  value={form.gstin}
                  onChange={set("gstin", true)}
                  maxLength={15}
                  placeholder="07AAVFR4821K1Z6"
                  invalid={!!errors.gstin}
                />
              </Field>
              <Field label="PAN" error={errors.pan} hint="10 characters">
                <TextInput
                  value={form.pan}
                  onChange={set("pan", true)}
                  maxLength={10}
                  placeholder="AAVFR4821K"
                  invalid={!!errors.pan}
                />
              </Field>
            </FormSection>

            <FormSection
              step={3}
              title="Bank account"
              description="Shown in the “Bank details” section of quotations. Leave the account number empty to hide it."
            >
              <Field label="Bank name">
                <TextInput
                  value={form.bank}
                  onChange={set("bank")}
                  placeholder="HDFC Bank"
                />
              </Field>
              <Field label="Branch">
                <TextInput
                  value={form.branch}
                  onChange={set("branch")}
                  placeholder="Nehru Place, New Delhi"
                />
              </Field>
              <Field label="Account name">
                <TextInput
                  value={form.accountName}
                  onChange={set("accountName")}
                  placeholder="Rippotai Architecture LLP"
                />
              </Field>
              <Field label="Account number" error={errors.accountNumber}>
                <TextInput
                  inputMode="numeric"
                  value={form.accountNumber}
                  onChange={set("accountNumber", true)}
                  placeholder="50200071234567"
                  invalid={!!errors.accountNumber}
                />
              </Field>
              <Field label="IFSC" error={errors.ifsc}>
                <TextInput
                  value={form.ifsc}
                  onChange={set("ifsc", true)}
                  maxLength={11}
                  placeholder="HDFC0000236"
                  invalid={!!errors.ifsc}
                />
              </Field>
              <Field label="UPI ID" optional error={errors.upi}>
                <TextInput
                  value={form.upi}
                  onChange={set("upi")}
                  placeholder="rippotai@hdfcbank"
                  invalid={!!errors.upi}
                />
              </Field>
            </FormSection>

            <FormSection
              step={4}
              title="Billing defaults"
              description="Pre-filled on new quotations and invoices."
              columns={3}
            >
              <Field label="Default GST rate (%)" error={errors.defaultGstRate}>
                <TextInput
                  type="number"
                  min={0}
                  max={28}
                  value={form.defaultGstRate}
                  onChange={set("defaultGstRate")}
                  invalid={!!errors.defaultGstRate}
                />
              </Field>
              <Field label="Quotation validity (days)">
                <TextInput
                  type="number"
                  min={1}
                  value={form.quotationValidityDays}
                  onChange={set("quotationValidityDays")}
                />
              </Field>
              <Field label="Invoice prefix" optional>
                <TextInput
                  value={form.invoicePrefix}
                  onChange={set("invoicePrefix")}
                  placeholder="RA/INV/"
                />
              </Field>
            </FormSection>

            <FormActions
              note={dirty ? "Unsaved changes" : "All changes saved"}
              submitLabel="Save profile"
              submitting={saving}
              submitDisabled={!dirty}
            />
          </form>
        )}
      </div>
    </Page>
  );
}
