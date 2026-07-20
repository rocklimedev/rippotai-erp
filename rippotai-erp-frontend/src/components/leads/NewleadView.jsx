import { useState } from "react";
import { labelStyle } from "../../hooks/stages";
import { useCreateLeadMutation } from "../../api/leads.api";

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
};

export default function NewLeadView({ onCaptured }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [samePhone, setSamePhone] = useState(true);
  const [banner, setBanner] = useState("");
  const [bannerErr, setBannerErr] = useState(false);
  const [createLead, { isLoading }] = useCreateLeadMutation();

  const onForm = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const waValue = samePhone ? form.phone : form.whatsapp;

  const onCapture = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setBanner("Full Name and Phone are required to capture a lead.");
      setBannerErr(true);
      return;
    }
    try {
      const res = await createLead({
        ...form,
        whatsapp: samePhone ? form.phone : form.whatsapp || undefined,
      }).unwrap();
      setForm({ ...EMPTY_FORM });
      setSamePhone(true);
      setBannerErr(false);
      setBanner(
        `${res.name} captured — added to Lead Capture and assigned to ${res.owner}.`,
      );
      onCaptured && onCaptured(res);
    } catch {
      setBannerErr(true);
      setBanner("Something went wrong capturing this lead. Please try again.");
    }
  };

  const field = (label, children) => (
    <div className="flex flex-col gap-1.5">
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-3.5 px-7 pt-6 pb-10">
      {banner && (
        <div
          className="w-full max-w-[720px] rounded-[10px] px-3.5 py-2.5 text-[13px] font-medium"
          style={
            bannerErr
              ? {
                  background: "#f5e7e4",
                  color: "#a54536",
                  border: "1px solid #a5453633",
                }
              : {
                  background: "#e3f0ea",
                  color: "#1f453b",
                  border: "1px solid #1f453b33",
                }
          }
        >
          {banner}
        </div>
      )}

      <div className="w-full max-w-[720px] bc-card p-6 flex flex-col gap-4.5">
        <div className="text-[16px] font-semibold text-[var(--ink-green)]">
          Lead Capture
        </div>

        <div
          className="bc-form-2col grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}
        >
          {field(
            "Full Name",
            <input
              name="name"
              value={form.name}
              onChange={onForm}
              placeholder="e.g. Rhea Malhotra"
              className="bc-input"
            />,
          )}
          {field(
            "Phone",
            <input
              name="phone"
              value={form.phone}
              onChange={onForm}
              placeholder="+91 98XXX XXXXX"
              className="bc-input"
            />,
          )}
          {field(
            <div className="flex items-center justify-between w-full">
              <span>WhatsApp</span>
              <label className="flex items-center gap-1.5 text-[11px] text-[var(--muted)] cursor-pointer normal-case tracking-normal font-normal">
                <input
                  type="checkbox"
                  checked={samePhone}
                  onChange={(e) => setSamePhone(e.target.checked)}
                  style={{ accentColor: "var(--ink-green)" }}
                />
                Same as phone
              </label>
            </div>,
            <input
              name="whatsapp"
              value={waValue}
              onChange={onForm}
              disabled={samePhone}
              placeholder="+91 98XXX XXXXX"
              className="bc-input"
              style={
                samePhone
                  ? { background: "var(--mist)", color: "var(--muted)" }
                  : undefined
              }
            />,
          )}
          {field(
            "Email",
            <input
              name="email"
              value={form.email}
              onChange={onForm}
              placeholder="name@example.com"
              className="bc-input"
            />,
          )}
          {field(
            "Project Type",
            <select
              name="type"
              value={form.type}
              onChange={onForm}
              className="bc-input"
            >
              <option>Residential</option>
              <option>Commercial</option>
              <option>Institutional</option>
            </select>,
          )}
          {field(
            "Location (City, State)",
            <input
              name="location"
              value={form.location}
              onChange={onForm}
              placeholder="Gurugram, Haryana"
              className="bc-input"
            />,
          )}
          {field(
            "Approx. Size (sq ft)",
            <input
              name="size"
              value={form.size}
              onChange={onForm}
              placeholder="e.g. 3,200"
              className="bc-input"
            />,
          )}
          {field(
            "Budget Range",
            <select
              name="budget"
              value={form.budget}
              onChange={onForm}
              className="bc-input"
            >
              <option>Under ₹25L</option>
              <option>₹25L–₹75L</option>
              <option>₹75L–₹2Cr</option>
              <option>₹2Cr–₹5Cr</option>
              <option>₹5Cr+</option>
              <option>₹10Cr+</option>
              <option>₹15Cr+</option>
            </select>,
          )}
          {field(
            "Timeline",
            <select
              name="timeline"
              value={form.timeline}
              onChange={onForm}
              className="bc-input"
            >
              <option>Immediate</option>
              <option>1–3 months</option>
              <option>3–6 months</option>
              <option>6+ months</option>
            </select>,
          )}
          {field(
            "Source",
            <select
              name="source"
              value={form.source}
              onChange={onForm}
              className="bc-input"
            >
              <option>Website</option>
              <option>Referral — add name in notes</option>
              <option>Instagram</option>
              <option>WhatsApp</option>
              <option>Walk-in</option>
            </select>,
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-[var(--stroke)] mt-1 pt-4">
          <button
            onClick={onCapture}
            disabled={isLoading}
            className="bc-btn-primary"
          >
            {isLoading ? "Capturing…" : "Capture Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}
