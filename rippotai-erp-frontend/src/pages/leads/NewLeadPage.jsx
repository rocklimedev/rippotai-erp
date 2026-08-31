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

export default function NewLeadPage({ onCaptured }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [samePhone, setSamePhone] = useState(true);
  const [banner, setBanner] = useState("");
  const [bannerErr, setBannerErr] = useState(false);

  const [createLead, { isLoading }] = useCreateLeadMutation();

  const onForm = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (bannerErr) {
      setBanner("");
      setBannerErr(false);
    }
  };

  const onCapture = async () => {
    if (!form.name.trim()) {
      setBanner("Enter the lead's full name.");
      setBannerErr(true);
      return;
    }

    if (!form.phone.trim()) {
      setBanner("A phone number is required.");
      setBannerErr(true);
      return;
    }

    try {
      const res = await createLead({
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim(),
        whatsapp: samePhone
          ? form.phone.trim()
          : form.whatsapp.trim() || undefined,
        email: form.email.trim() || undefined,
        location: form.location.trim() || undefined,
        size: form.size.trim() || undefined,
      }).unwrap();

      setForm({ ...EMPTY_FORM });
      setSamePhone(true);
      setBannerErr(false);

      setBanner(
        `${res.name} captured successfully and assigned to ${res.owner}.`,
      );

      onCaptured?.(res);
    } catch {
      setBanner(
        "We couldn't capture this lead. Please check the details and try again.",
      );
      setBannerErr(true);
    }
  };

  const field = (
    label,
    children,
    { required = false, hint = "", className = "" } = {},
  ) => (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label style={labelStyle} className="flex items-center gap-1">
          {label}

          {required && <span className="text-[#a54536]">*</span>}
        </label>

        {hint && (
          <span className="text-[9.5px] text-[var(--muted)]">{hint}</span>
        )}
      </div>

      {children}
    </div>
  );

  return (
    <div className="min-h-full px-7 pt-6 pb-12">
      <div className="mx-auto w-full max-w-[940px]">
        {/* ======================================================== */}
        {/* PAGE HEADER                                              */}
        {/* ======================================================== */}

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ink-green)] text-white">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 3v12" />
                <path d="M3 9h12" />
              </svg>
            </div>

            <div>
              <h1 className="text-[20px] font-semibold tracking-[-0.025em] text-[var(--ink-green)]">
                Capture a new lead
              </h1>

              <p className="mt-0.5 text-[12px] text-[var(--muted)]">
                Add the essential details now. You can enrich the lead later.
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SUCCESS / ERROR                                          */}
        {/* ======================================================== */}

        {banner && (
          <div
            className={[
              "mb-4 flex items-start gap-3 rounded-xl border px-4 py-3",
              bannerErr
                ? "border-[#a5453633] bg-[#f8eeeb] text-[#a54536]"
                : "border-[#1f453b33] bg-[#e6f1ec] text-[#1f453b]",
            ].join(" ")}
          >
            <div className="mt-0.5 shrink-0">
              {bannerErr ? (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 4.5v4" />
                  <path d="M8 11.5h.01" />
                </svg>
              ) : (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="8" cy="8" r="6" />
                  <path d="M5 8l2 2 4-4" />
                </svg>
              )}
            </div>

            <span className="text-[12px] font-medium leading-5">{banner}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* FORM                                                     */}
        {/* ======================================================== */}

        <div className="overflow-hidden rounded-2xl border border-[var(--stroke)] bg-paper shadow-[0_3px_18px_rgba(15,31,26,0.05)]">
          {/* ====================================================== */}
          {/* SECTION 01 — CONTACT                                  */}
          {/* ====================================================== */}

          <FormSection
            number="01"
            title="Contact details"
            description="Who are you speaking with?"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {field(
                "Full Name",
                <input
                  name="name"
                  value={form.name}
                  onChange={onForm}
                  placeholder="e.g. Rhea Malhotra"
                  autoComplete="name"
                  autoFocus
                  className="bc-input"
                />,
                { required: true },
              )}

              {field(
                "Phone",
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onForm}
                  placeholder="+91 98XXX XXXXX"
                  inputMode="tel"
                  autoComplete="tel"
                  className="bc-input"
                />,
                { required: true },
              )}

              {field(
                "WhatsApp",
                <div className="relative">
                  <input
                    name="whatsapp"
                    value={samePhone ? form.phone : form.whatsapp}
                    onChange={onForm}
                    disabled={samePhone}
                    placeholder="+91 98XXX XXXXX"
                    inputMode="tel"
                    className={[
                      "bc-input pr-[118px]",
                      samePhone ? "bg-[var(--mist)] text-[var(--muted)]" : "",
                    ].join(" ")}
                  />

                  <label className="absolute right-2.5 top-1/2 flex -translate-y-1/2 cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-[9.5px] font-medium text-[var(--muted)] hover:bg-[var(--mist-soft)]">
                    <input
                      type="checkbox"
                      checked={samePhone}
                      onChange={(e) => setSamePhone(e.target.checked)}
                      style={{
                        accentColor: "var(--ink-green)",
                      }}
                    />
                    Same as phone
                  </label>
                </div>,
              )}

              {field(
                "Email",
                <input
                  name="email"
                  value={form.email}
                  onChange={onForm}
                  placeholder="name@example.com"
                  type="email"
                  autoComplete="email"
                  className="bc-input"
                />,
                { hint: "Optional" },
              )}
            </div>
          </FormSection>

          {/* ====================================================== */}
          {/* SECTION 02 — PROJECT                                  */}
          {/* ====================================================== */}

          <FormSection
            number="02"
            title="Project"
            description="Get enough context to understand the opportunity."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                "Location",
                <input
                  name="location"
                  value={form.location}
                  onChange={onForm}
                  placeholder="Gurugram, Haryana"
                  autoComplete="address-level2"
                  className="bc-input"
                />,
                {
                  hint: "City / State",
                },
              )}

              {field(
                "Approx. Size",
                <div className="relative">
                  <input
                    name="size"
                    value={form.size}
                    onChange={onForm}
                    placeholder="e.g. 3,200"
                    inputMode="numeric"
                    className="bc-input pr-14"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)]">
                    sq ft
                  </span>
                </div>,
                { hint: "Optional" },
              )}
            </div>
          </FormSection>

          {/* ====================================================== */}
          {/* SECTION 03 — QUALIFICATION                             */}
          {/* ====================================================== */}

          <FormSection
            number="03"
            title="Qualification"
            description="Help the team understand how valuable and urgent this lead is."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                "Expected Timeline",
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
                "Lead Source",
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
          </FormSection>

          {/* ====================================================== */}
          {/* FOOTER                                                 */}
          {/* ====================================================== */}

          <div className="flex flex-col gap-4 border-t border-[var(--stroke)] bg-[var(--mist-soft)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-paper text-[var(--muted)]">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 7v4" />
                  <path d="M8 5h.01" />
                </svg>
              </div>

              <div>
                <div className="text-[10.5px] font-semibold text-[var(--ink-green)]">
                  What happens next?
                </div>

                <div className="mt-0.5 text-[9.5px] text-[var(--muted)]">
                  The lead will be added to Lead Capture and assigned
                  automatically.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onCapture}
              disabled={isLoading}
              className={[
                "inline-flex h-10 items-center justify-center gap-2",
                "rounded-xl px-5",
                "text-[11.5px] font-semibold",
                "transition-all",
                "disabled:cursor-not-allowed disabled:opacity-60",
                "bc-btn-primary",
              ].join(" ")}
            >
              {isLoading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Capturing lead…
                </>
              ) : (
                <>
                  Capture Lead
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 8h10" />
                    <path d="M9 4l4 4-4 4" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* FORM SECTION                                                       */
/* ================================================================== */

function FormSection({ number, title, description, children }) {
  return (
    <section className="px-5 py-6 sm:px-7">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--mist)] text-[9px] font-bold tracking-[0.05em] text-[var(--muted)]">
          {number}
        </div>

        <div>
          <h2 className="text-[13px] font-semibold text-[var(--ink-green)]">
            {title}
          </h2>

          <p className="mt-0.5 text-[10.5px] leading-4 text-[var(--muted)]">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}
