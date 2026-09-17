import { useMemo, useState } from "react";
import { labelStyle } from "../../hooks/stages";
import {
  useGetZohoPipelineStageMapQuery,
  useCreateZohoPipelineMutation,
} from "../../api/connectors/zoho-crm.api";
import { useZohoStatusQuery } from "../../api/auth/authConnectors.api";

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
  subPipeline: "",
  stage: "",
};

/* ------------------------------------------------------------------
 * Sub_Pipeline -> Stage mapping
 *
 * Source: GET /zoho/bigin/:ownerKey/settings/pipeline-stage-map
 *
 * The old implementation derived Sub Pipeline and Stage options from
 * GET /settings/fields?module=Pipelines. That endpoint returns the
 * Sub_Pipeline and Stage picklists completely unlinked — no `maps`
 * data at all — so the Stage dropdown always fell back to showing
 * every stage from every pipeline combined. That let users pick a
 * Stage that didn't belong to the chosen Sub_Pipeline, which Bigin
 * then rejected with MAPPING_MISMATCH.
 *
 * The backend now calls the Layouts Metadata API instead, which does
 * carry the Sub_Pipeline -> Stage relationship, and returns it here
 * pre-shaped as:
 *   { "<Sub_Pipeline display value>": [{ display_value, actual_value, id }, ...] }
 * ------------------------------------------------------------------ */

function getSubPipelineNames(stageMap) {
  return Object.keys(stageMap || {}).sort((a, b) => a.localeCompare(b));
}

function getStagesForSubPipeline(stageMap, subPipeline) {
  const list = stageMap?.[subPipeline] || [];
  return [...new Set(list.map((s) => s?.display_value).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );
}

export default function NewLeadPage({ onCaptured }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [samePhone, setSamePhone] = useState(true);
  const [banner, setBanner] = useState("");
  const [bannerErr, setBannerErr] = useState(false);

  const [createPipeline, { isLoading }] = useCreateZohoPipelineMutation();

  /* ------------------------------------------------------------------
   * Zoho connection status
   * ------------------------------------------------------------------ */
  const {
    data: zohoStatus,
    isLoading: zohoStatusLoading,
    isFetching: zohoStatusFetching,
    error: zohoStatusError,
  } = useZohoStatusQuery();

  const zohoConnected = useMemo(() => {
    if (!zohoStatus) return false;

    if (typeof zohoStatus.connected === "boolean") {
      return zohoStatus.connected;
    }

    if (typeof zohoStatus.data?.connected === "boolean") {
      return zohoStatus.data.connected;
    }

    if (
      typeof zohoStatus.status === "string" &&
      zohoStatus.status.toLowerCase() === "connected"
    ) {
      return true;
    }

    if (
      typeof zohoStatus.data?.status === "string" &&
      zohoStatus.data.status.toLowerCase() === "connected"
    ) {
      return true;
    }

    return false;
  }, [zohoStatus]);

  /* ------------------------------------------------------------------
   * Sub_Pipeline -> Stage map
   * ------------------------------------------------------------------ */
  const {
    data: stageMap,
    isLoading: stageMapLoading,
    isFetching: stageMapFetching,
    error: stageMapError,
    refetch: refetchStageMap,
  } = useGetZohoPipelineStageMapQuery(undefined, {
    skip: zohoStatusLoading || zohoStatusFetching || !zohoConnected,
    refetchOnMountOrArgChange: true,
  });

  const subPipelines = useMemo(() => getSubPipelineNames(stageMap), [stageMap]);

  // Stages scoped to the selected Sub_Pipeline via the real Bigin mapping.
  // No "return everything" fallback here — if the mapping can't be
  // resolved for a pipeline, that pipeline simply has no stage options,
  // which is surfaced through pipelinesUnavailable below rather than
  // silently letting an invalid Stage be picked.
  const stages = useMemo(
    () => getStagesForSubPipeline(stageMap, form.subPipeline),
    [stageMap, form.subPipeline],
  );

  const pipelinesUnavailable =
    !zohoStatusLoading &&
    !zohoStatusFetching &&
    !stageMapLoading &&
    !stageMapFetching &&
    (!zohoConnected || !!stageMapError || subPipelines.length === 0);

  const pipelineLoading =
    zohoStatusLoading ||
    zohoStatusFetching ||
    stageMapLoading ||
    stageMapFetching;

  /* ------------------------------------------------------------------
   * Form handlers
   * ------------------------------------------------------------------ */
  const onForm = (e) => {
    const { name, value } = e.target;

    setForm((current) => {
      const next = { ...current, [name]: value };
      // Changing Sub Pipeline invalidates Stage (must belong to that pipeline)
      if (name === "subPipeline") {
        next.stage = "";
      }
      return next;
    });

    if (bannerErr) {
      setBanner("");
      setBannerErr(false);
    }
  };

  /* ------------------------------------------------------------------
   * Submit
   * ------------------------------------------------------------------ */
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

    if (!zohoConnected) {
      setBanner(
        "Zoho Bigin is not connected. Please connect Zoho before capturing a lead.",
      );
      setBannerErr(true);
      return;
    }

    if (!form.subPipeline.trim()) {
      setBanner("Select a Bigin Sub Pipeline.");
      setBannerErr(true);
      return;
    }

    const stageValue = form.stage.trim();

    if (!stageValue) {
      setBanner(
        stages.length
          ? "Select a Stage that belongs to the chosen Sub Pipeline."
          : "No Stage is mapped to this Sub Pipeline in Bigin.",
      );
      setBannerErr(true);
      return;
    }

    // Safety: stage must still be in the filtered list
    if (stages.length && !stages.includes(stageValue)) {
      setBanner(
        `"${stageValue}" is not a valid Stage for "${form.subPipeline}". Pick a stage from the list.`,
      );
      setBannerErr(true);
      return;
    }

    try {
      const res = await createPipeline({
        Deal_Name: form.name.trim(),
        Sub_Pipeline: form.subPipeline.trim(),
        Stage: stageValue,
        Phone: form.phone.trim(),
        Email: form.email.trim() || undefined,
      }).unwrap();

      setForm({ ...EMPTY_FORM });
      setSamePhone(true);
      setBannerErr(false);

      const displayName =
        res?.data?.[0]?.details?.Deal_Name ||
        res?.data?.[0]?.Deal_Name ||
        res?.Deal_Name ||
        form.name;

      setBanner(`${displayName} captured successfully in Bigin.`);

      onCaptured?.(res);
    } catch (error) {
      const zohoMessage =
        error?.data?.message ||
        error?.data?.error ||
        error?.data?.data?.[0]?.message ||
        error?.data?.data?.[0]?.code ||
        error?.message ||
        "";

      setBanner(
        zohoMessage
          ? `We couldn't capture this lead: ${zohoMessage}`
          : "We couldn't capture this lead. Please check the details and try again.",
      );

      setBannerErr(true);
    }
  };

  /* ------------------------------------------------------------------
   * Field helper
   * ------------------------------------------------------------------ */
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
        {/* PAGE HEADER */}
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

        {/* BANNER */}
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

        <div className="overflow-hidden rounded-2xl border border-[var(--stroke)] bg-paper shadow-[0_3px_18px_rgba(15,31,26,0.05)]">
          {/* SECTION 01 — CONTACT */}
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
                      style={{ accentColor: "var(--ink-green)" }}
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

          {/* SECTION 02 — PROJECT */}
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
                { hint: "City / State" },
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

          {/* SECTION 03 — QUALIFICATION */}
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

              {/* Sub Pipeline — select first */}
              {field(
                "Sub Pipeline",
                <div className="relative">
                  <select
                    name="subPipeline"
                    value={form.subPipeline}
                    onChange={onForm}
                    disabled={pipelineLoading || !zohoConnected}
                    className={[
                      "bc-input",
                      !form.subPipeline ? "text-[var(--muted)]" : "",
                    ].join(" ")}
                  >
                    <option value="">
                      {zohoStatusLoading || zohoStatusFetching
                        ? "Checking Zoho connection…"
                        : !zohoConnected
                          ? "Connect Zoho Bigin first"
                          : stageMapLoading || stageMapFetching
                            ? "Loading Sub Pipelines…"
                            : subPipelines.length
                              ? "Select Sub Pipeline"
                              : "No Sub Pipelines found"}
                    </option>
                    {subPipelines.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  {pipelineLoading && (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--stroke)] border-t-[var(--ink-green)]" />
                    </span>
                  )}
                </div>,
                {
                  required: true,
                  hint: "From Bigin",
                  className: "md:col-span-2",
                },
              )}

              {/* Stage — filtered by Sub Pipeline */}
              {field(
                "Stage",
                <select
                  name="stage"
                  value={form.stage}
                  onChange={onForm}
                  disabled={
                    pipelineLoading ||
                    !zohoConnected ||
                    !form.subPipeline ||
                    stages.length === 0
                  }
                  className={[
                    "bc-input",
                    !form.stage ? "text-[var(--muted)]" : "",
                  ].join(" ")}
                >
                  <option value="">
                    {!form.subPipeline
                      ? "Select Sub Pipeline first"
                      : stages.length
                        ? "Select Stage"
                        : "No stages for this pipeline"}
                  </option>
                  {stages.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>,
                {
                  required: true,
                  hint: form.subPipeline
                    ? stages.length
                      ? `${stages.length} for this pipeline`
                      : "None mapped"
                    : "Pick pipeline first",
                  className: "md:col-span-1",
                },
              )}
            </div>

            {/* Status banner */}
            <div
              className={[
                "mt-4 rounded-xl border px-4 py-3",
                pipelinesUnavailable
                  ? "border-[#a5453633] bg-[#f8eeeb]"
                  : "border-[#c6a15b33] bg-[#fbf7ee]",
              ].join(" ")}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={[
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
                    pipelinesUnavailable
                      ? "bg-[#a5453622] text-[#a54536]"
                      : "bg-[#c6a15b22] text-[#9b783b]",
                  ].join(" ")}
                >
                  {pipelinesUnavailable ? (
                    <svg
                      width="12"
                      height="12"
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
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className={[
                      "text-[10.5px] font-semibold",
                      pipelinesUnavailable
                        ? "text-[#a54536]"
                        : "text-[#71582d]",
                    ].join(" ")}
                  >
                    {zohoStatusLoading || zohoStatusFetching
                      ? "Checking Zoho Bigin connection"
                      : !zohoConnected
                        ? "Zoho Bigin is not connected"
                        : pipelinesUnavailable
                          ? "Bigin Sub Pipelines unavailable"
                          : "Bigin Sub Pipeline & Stage"}
                  </div>

                  <div
                    className={[
                      "mt-0.5 text-[9.5px] leading-4",
                      pipelinesUnavailable
                        ? "text-[#8e5045]"
                        : "text-[#806b48]",
                    ].join(" ")}
                  >
                    {zohoStatusLoading || zohoStatusFetching
                      ? "Checking your connected Zoho account…"
                      : !zohoConnected
                        ? "Connect Zoho from Auth Connectors before creating leads in Bigin."
                        : pipelinesUnavailable
                          ? "Could not load the Sub Pipeline → Stage mapping from Bigin's layout settings."
                          : "Stages are filtered to those mapped to the selected Sub Pipeline (avoids MAPPING_MISMATCH)."}
                  </div>

                  {pipelinesUnavailable && zohoConnected && (
                    <button
                      type="button"
                      onClick={() => refetchStageMap()}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#a5453644] bg-white px-2.5 py-1.5 text-[9.5px] font-semibold text-[#a54536] transition hover:bg-[#f8eeeb]"
                    >
                      Retry
                    </button>
                  )}

                  {zohoStatusError && (
                    <div className="mt-1 text-[9px] text-[#8e5045]">
                      Unable to verify the Zoho connection.
                    </div>
                  )}

                  {stageMapError && zohoConnected && (
                    <div className="mt-1 text-[9px] text-[#8e5045]">
                      Failed to load the Pipelines layout. Check Bigin's
                      Sub_Pipeline / Stage configuration for the Pipelines
                      module.
                    </div>
                  )}
                </div>

                {!pipelinesUnavailable &&
                  zohoConnected &&
                  subPipelines.length > 0 && (
                    <span className="shrink-0 rounded-full bg-[#1f453b12] px-2 py-1 text-[9px] font-semibold text-[var(--ink-green)]">
                      {subPipelines.length} pipelines
                      {form.subPipeline && stages.length
                        ? ` · ${stages.length} stages`
                        : ""}
                    </span>
                  )}
              </div>
            </div>
          </FormSection>

          {/* FOOTER */}
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
                  Creates a Bigin Pipeline with Deal_Name, Sub_Pipeline, and a
                  Stage that belongs to that pipeline.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onCapture}
              disabled={
                isLoading ||
                pipelineLoading ||
                !zohoConnected ||
                subPipelines.length === 0 ||
                !form.subPipeline ||
                !form.stage
              }
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
