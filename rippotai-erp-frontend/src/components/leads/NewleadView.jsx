import { useState } from "react";
import { card, inputStyle, labelStyle } from "../constants/stages";
import { useCreateLeadMutation } from "../api/leadsApi";

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
  const waStyle = {
    border: "1px solid #B5BFC6",
    borderRadius: "10px",
    padding: "9px 12px",
    fontSize: "13px",
    color: samePhone ? "#6E7F8D" : "#161B1D",
    background: samePhone ? "#E4EBF1" : "#FFFFFF",
  };
  const bannerStyle = {
    width: "100%",
    maxWidth: "720px",
    background: bannerErr ? "#F5E7E4" : "#E3F0EA",
    color: bannerErr ? "#B0483A" : "#2E7D5B",
    border: "1px solid " + (bannerErr ? "#B0483A" : "#2E7D5B") + "33",
    borderRadius: "10px",
    padding: "11px 14px",
    fontSize: "13px",
    fontWeight: 400,
  };

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

  return (
    <div
      style={{
        padding: "24px 28px 40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "14px",
      }}
    >
      {banner && <div style={bannerStyle}>{banner}</div>}
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          ...card,
          padding: "26px 28px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: 700 }}>Lead Capture</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: "16px 20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={onForm}
              placeholder="e.g. Rhea Malhotra"
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={onForm}
              placeholder="+91 98XXX XXXXX"
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <label style={labelStyle}>WhatsApp</label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "11px",
                  color: "#6E7F8D",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={samePhone}
                  onChange={(e) => setSamePhone(e.target.checked)}
                  style={{ accentColor: "#161B1D" }}
                />
                Same as phone
              </label>
            </div>
            <input
              name="whatsapp"
              value={waValue}
              onChange={onForm}
              disabled={samePhone}
              placeholder="+91 98XXX XXXXX"
              style={waStyle}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>Email</label>
            <input
              name="email"
              value={form.email}
              onChange={onForm}
              placeholder="name@example.com"
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>Project Type</label>
            <select
              name="type"
              value={form.type}
              onChange={onForm}
              style={inputStyle}
            >
              <option>Residential</option>
              <option>Commercial</option>
              <option>Institutional</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>Location (City, State)</label>
            <input
              name="location"
              value={form.location}
              onChange={onForm}
              placeholder="Gurugram, Haryana"
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>Approx. Size (sq ft)</label>
            <input
              name="size"
              value={form.size}
              onChange={onForm}
              placeholder="e.g. 3,200"
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>Budget Range</label>
            <select
              name="budget"
              value={form.budget}
              onChange={onForm}
              style={inputStyle}
            >
              <option>Under ₹25L</option>
              <option>₹25L–₹75L</option>
              <option>₹75L–₹2Cr</option>
              <option>₹2Cr–₹5Cr</option>
              <option>₹5Cr+</option>
              <option>₹10Cr+</option>
              <option>₹15Cr+</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>Timeline</label>
            <select
              name="timeline"
              value={form.timeline}
              onChange={onForm}
              style={inputStyle}
            >
              <option>Immediate</option>
              <option>1–3 months</option>
              <option>3–6 months</option>
              <option>6+ months</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>Source</label>
            <select
              name="source"
              value={form.source}
              onChange={onForm}
              style={inputStyle}
            >
              <option>Website</option>
              <option>Referral — add name in notes</option>
              <option>Instagram</option>
              <option>WhatsApp</option>
              <option>Walk-in</option>
            </select>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            borderTop: "1px solid #E4EBF1",
            marginTop: "4px",
            paddingTop: "16px",
          }}
        >
          <button
            onClick={onCapture}
            disabled={isLoading}
            className="btn-dark"
            style={{
              background: "#161B1D",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "10px",
              padding: "10px 22px",
              fontSize: "13px",
              fontWeight: 400,
              cursor: "pointer",
            }}
          >
            {isLoading ? "Capturing…" : "Capture Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}
