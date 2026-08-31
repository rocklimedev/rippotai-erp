import React from "react";

import { BRAND, COVER, CONTENTS, CONTACT } from "../../data/staticContent";

// ============================================================
// Helpers
// ============================================================

const fmt = (n, currency = "₹") =>
  `${currency} ${Number(n || 0).toLocaleString("en-IN")}`;

const arr = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === "") return [];
  return [value];
};

const first = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const normalizeItems = (items) =>
  arr(items)
    .flatMap((item) => {
      if (Array.isArray(item)) return item;

      if (typeof item === "string") {
        return item
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean);
      }

      return item;
    })
    .filter(Boolean);

const itemLabel = (item) => {
  if (typeof item === "string") return item;

  return (
    first(
      item?.label,
      item?.name,
      item?.title,
      item?.description,
      item?.item,
      item?.scope,
    ) || ""
  );
};

const selected = (value, option) => {
  if (!value) return false;

  const a = String(value).trim().toLowerCase();
  const b = String(option).trim().toLowerCase();

  return a === b || a.includes(b) || b.includes(a);
};

const num = (value) => Number(value || 0);

const getProjectField = (pd, ...keys) =>
  first(...keys.map((key) => pd?.[key])) || "";

const getBudgetItemAmount = (item) => {
  if (item?.amount !== undefined && item?.amount !== null) {
    return num(item.amount);
  }

  return num(item?.quantity) * num(item?.rate);
};

const getBudgetCategories = (budget) => {
  const categories = first(
    budget?.categories,
    budget?.estimate?.categories,
    budget?.data?.categories,
  );

  return arr(categories).filter(Boolean);
};

const getCategoryItems = (category) =>
  arr(
    first(category?.items, category?.estimateItems, category?.lineItems),
  ).filter(Boolean);

const getBudgetSubtotal = (budget) => {
  const backendSubtotal = first(
    budget?.subtotal,
    budget?.estimate?.subtotal,
    budget?.totals?.subtotal,
    budget?.summary?.subtotal,
  );

  if (backendSubtotal !== undefined) {
    return num(backendSubtotal);
  }

  return getBudgetCategories(budget).reduce(
    (categoryTotal, category) =>
      categoryTotal +
      getCategoryItems(category).reduce(
        (sum, item) => sum + getBudgetItemAmount(item),
        0,
      ),
    0,
  );
};

const getBudgetGST = (budget, subtotal) => {
  const backendGST = first(
    budget?.gstAmount,
    budget?.gst_amount,
    budget?.estimate?.gstAmount,
    budget?.estimate?.gst_amount,
    budget?.totals?.gstAmount,
    budget?.summary?.gstAmount,
  );

  if (backendGST !== undefined) {
    return num(backendGST);
  }

  const gstRate = num(
    first(
      budget?.gstRate,
      budget?.gst_rate,
      budget?.estimate?.gstRate,
      budget?.estimate?.gst_rate,
    ),
  );

  return Math.round((subtotal * gstRate) / 100);
};

const getBudgetTotal = (budget, subtotal, gstAmount) => {
  const backendTotal = first(
    budget?.totalAmount,
    budget?.total_amount,
    budget?.grandTotal,
    budget?.grand_total,
    budget?.estimate?.totalAmount,
    budget?.estimate?.total_amount,
    budget?.totals?.totalAmount,
    budget?.summary?.totalAmount,
  );

  if (backendTotal !== undefined) {
    return num(backendTotal);
  }

  return subtotal + gstAmount;
};

const getBudgetCurrency = (budget) =>
  first(
    budget?.currency,
    budget?.estimate?.currency,
    budget?.totals?.currency,
    "₹",
  );

const normalizePhase = (phase, index) => ({
  code:
    first(
      phase?.code,
      phase?.phaseCode,
      phase?.phase_code,
      phase?.sequence ? String(phase.sequence).padStart(2, "0") : undefined,
    ) || String(index + 1).padStart(2, "0"),

  name:
    first(phase?.name, phase?.title, phase?.phaseName, phase?.phase_name) ||
    `Phase ${index + 1}`,

  detail:
    first(
      phase?.detail,
      phase?.description,
      phase?.executionDescription,
      phase?.execution_description,
      phase?.scope,
      phase?.notes,
    ) || "",

  duration:
    first(
      phase?.duration,
      phase?.durationLabel,
      phase?.duration_label,
      phase?.estimatedDuration,
      phase?.estimated_duration,
    ) || "",

  parallel:
    first(phase?.parallel, phase?.parallelWith, phase?.parallel_with) || "",
});

const getPOAPhases = (poa) =>
  arr(
    first(
      poa?.phases,
      poa?.executionPhases,
      poa?.execution_phases,
      poa?.stages,
    ),
  )
    .filter(Boolean)
    .map(normalizePhase);

const normalizeDiscipline = (discipline, index) => ({
  name:
    first(
      discipline?.name,
      discipline?.title,
      discipline?.discipline,
      discipline?.label,
    ) || `Discipline ${index + 1}`,

  items: normalizeItems(
    first(
      discipline?.items,
      discipline?.scopeItems,
      discipline?.scope_items,
      discipline?.activities,
      discipline?.workItems,
      discipline?.work_items,
    ),
  ),
});

const getDisciplines = (sow) => {
  const source = first(
    sow?.disciplines,
    sow?.scopeByDiscipline,
    sow?.scope_by_discipline,
    sow?.disciplineScopes,
    sow?.discipline_scopes,
  );

  if (!source) return [];

  if (Array.isArray(source)) {
    return source.map(normalizeDiscipline);
  }

  if (typeof source === "object") {
    return Object.entries(source).map(([name, items], index) =>
      normalizeDiscipline(
        {
          name,
          items,
        },
        index,
      ),
    );
  }

  return [];
};

const DEFAULT_DISCIPLINES = [
  {
    name: "Civil & demolition",
    items: [
      "Removal, cutting and debris disposal",
      "Masonry, plaster and levelling",
      "Door and window openings",
    ],
  },
  {
    name: "Mill work & joinery",
    items: [
      "Modular kitchen and wardrobes",
      "Vanities and storage units",
      "Site-fabricated joinery",
    ],
  },
  {
    name: "MEP & waterproofing",
    items: [
      "Concealed wiring and conduits",
      "AC piping, drainage and plumbing",
      "Wet area and terrace treatment",
    ],
  },
  {
    name: "Paint & polish",
    items: [
      "Primer, putty and two coats",
      "Wood polish and veneer finish",
      "Touch-ups at snagging",
    ],
  },
  {
    name: "Flooring & tiling",
    items: [
      "Floor and wall tiling",
      "Counters, skirting and dado",
      "Grouting and edge finishing",
    ],
  },
  {
    name: "Fixtures & fittings",
    items: [
      "Light fixtures and switches",
      "CP fittings and sanitaryware",
      "Hardware and accessories",
    ],
  },
  {
    name: "Ceiling & POP",
    items: [
      "Framework and boarding",
      "Cove and profile detailing",
      "Punning and surface preparation",
    ],
  },
  {
    name: "Loose furniture",
    items: [
      "Sourcing and coordination",
      "Delivery and placement",
      "Optional — if selected",
    ],
  },
];

// ============================================================
// Global PDF Page
// ============================================================

function Page({ children, dark = false, footer = true, className = "" }) {
  return (
    <div
      className={[
        "pdf-page relative mx-auto mb-6 flex w-full max-w-[794px] flex-col overflow-hidden",
        dark
          ? "bg-[var(--ink-green)] text-white"
          : "bg-white text-[var(--ink-green)]",
        className,
      ].join(" ")}
      style={{
        width: "794px",
        minHeight: "1123px",
        height: "1123px",
        padding: "56px 56px 40px",
        breakAfter: "page",
        pageBreakAfter: "always",
      }}
    >
      <div className="min-h-0 flex-1">{children}</div>

      {footer && <Footer dark={dark} />}
    </div>
  );
}

// ============================================================
// Footer
// ============================================================

function Footer({ dark = false, siteAddress = "" }) {
  return (
    <div
      className={[
        "mt-auto flex items-center justify-between border-t pt-3 text-[8px] uppercase tracking-widest",
        dark
          ? "border-white/15 text-white/40"
          : "border-[var(--stroke)] text-[var(--muted)]",
      ].join(" ")}
    >
      <span>BUSINESS PROPOSAL</span>
      <span>{siteAddress}</span>
    </div>
  );
}

// ============================================================
// Section Divider
// ============================================================

function SectionDivider({ number, title }) {
  return (
    <Page dark footer={false} className="relative">
      <div className="absolute inset-x-0 bottom-0 h-[220px]">
        <BuildingIllustration />
      </div>

      <div className="relative mt-8 flex items-center gap-3">
        <span className="text-[92px] font-light leading-none text-white/10">
          {String(number).padStart(2, "0")}
        </span>

        <h1 className="text-[42px] font-light tracking-tight">{title}</h1>
      </div>

      <div className="absolute bottom-5 left-0 right-0 h-px bg-white/20" />
    </Page>
  );
}

// ============================================================
// Building Illustration
// ============================================================

function BuildingIllustration() {
  return (
    <div className="relative h-full w-full opacity-70">
      <div className="absolute bottom-0 left-0 right-0 border-t border-white/30" />

      <div className="absolute bottom-0 left-[11%] h-[135px] w-[58%] border border-white/40">
        <div className="grid grid-cols-3 gap-x-7 gap-y-4 p-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-5 border border-white/30" />
          ))}
        </div>

        <div className="absolute bottom-0 left-[42%] h-12 w-8 border border-white/40" />
      </div>

      <div className="absolute bottom-0 left-[69%] h-[82px] w-[17%] border border-white/30">
        <div className="grid grid-cols-2 gap-2 p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 border border-white/25" />
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-[5%] h-[72px] w-[42px]">
        <div className="absolute bottom-0 left-1/2 h-9 w-px -translate-x-1/2 bg-white/40" />

        <div className="absolute left-0 top-0 h-9 w-9 rounded-full border border-white/40" />
        <div className="absolute left-3 top-2 h-9 w-9 rounded-full border border-white/40" />
      </div>
    </div>
  );
}

// ============================================================
// Standard Heading
// ============================================================

function SectionHeading({ number, title }) {
  return (
    <>
      <div className="flex items-baseline gap-3">
        <p className="text-xs font-medium text-[var(--gold,#b8860b)]">
          {String(number).padStart(2, "0")}
        </p>

        <h2 className="text-[25px] font-medium tracking-tight">{title}</h2>
      </div>

      <div className="mt-10 border-t border-[var(--ink-green)]/70" />
    </>
  );
}

// ============================================================
// Eyebrow
// ============================================================

function Eyebrow({ children }) {
  return (
    <p className="mb-3 text-[8px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
      {children}
    </p>
  );
}

// ============================================================
// Field
// ============================================================

function Field({ label, value }) {
  return (
    <div className="border-b border-[var(--stroke)] pb-3">
      <p className="text-[8px] text-[var(--muted)]">{label}</p>

      <p className="mt-1 min-h-[16px] text-[11px] font-medium">{value || ""}</p>
    </div>
  );
}

// ============================================================
// Checkbox
// ============================================================

function Checkbox({ label, checked = false }) {
  return (
    <div className="flex items-center gap-2 text-[9px]">
      <span
        className={[
          "inline-flex h-[7px] w-[7px] shrink-0 items-center justify-center border",
          checked
            ? "border-[var(--ink-green)] bg-[var(--ink-green)]"
            : "border-[var(--stroke)]",
        ].join(" ")}
      >
        {checked && <span className="h-[3px] w-[3px] bg-white" />}
      </span>

      <span>{label}</span>
    </div>
  );
}

// ============================================================
// Bullet List
// ============================================================

function BulletList({ items = [], className = "" }) {
  const normalized = normalizeItems(items);

  return (
    <div className={`space-y-2 ${className}`}>
      {normalized.map((item, index) => (
        <div
          key={`${itemLabel(item)}-${index}`}
          className="flex gap-2 text-[9px] leading-relaxed"
        >
          <span className="mt-[5px] h-[3px] w-[3px] shrink-0 rounded-full bg-[var(--ink-green)]" />

          <span>{itemLabel(item)}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Info Block
// ============================================================

function InfoBlock({ title, items = [] }) {
  return (
    <div className="border-b border-[var(--stroke)] pb-4">
      <p className="mb-2 text-[13px] font-medium text-[var(--ink-green)]">
        {title}
      </p>

      <BulletList items={items} />
    </div>
  );
}

// ============================================================
// Discipline Block
// ============================================================

function DisciplineBlock({ name, items }) {
  return (
    <div className="border-b border-[var(--stroke)] pb-6">
      <p className="mb-2 text-[13px] font-medium">{name}</p>

      <div className="space-y-1.5 text-[9px] leading-relaxed text-[var(--ink-green)]">
        {normalizeItems(items).map((item, index) => (
          <p key={`${name}-${index}`}>{itemLabel(item)}</p>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Budget Category
// ============================================================

function BudgetCategory({ category, currency }) {
  const items = getCategoryItems(category);

  const categoryName =
    first(
      category?.name,
      category?.title,
      category?.categoryName,
      category?.category_name,
    ) || "Category";

  const categoryTotal = items.reduce(
    (sum, item) => sum + getBudgetItemAmount(item),
    0,
  );

  return (
    <React.Fragment>
      <tr className="border-b border-[var(--stroke)]">
        <td
          colSpan={4}
          className="bg-[var(--mist-soft)] py-2 text-[9px] font-semibold"
        >
          {categoryName}
        </td>
      </tr>

      {items.map((item, index) => {
        const amount = getBudgetItemAmount(item);

        return (
          <tr
            key={`${categoryName}-${index}`}
            className="border-b border-[var(--stroke)]"
          >
            <td className="py-2.5 pr-2">
              {first(
                item?.name,
                item?.title,
                item?.description,
                item?.item,
                item?.label,
              ) || ""}
            </td>

            <td className="py-2.5 text-right">{item?.quantity ?? ""}</td>

            <td className="py-2.5 text-right">
              {item?.rate !== undefined ? fmt(item.rate, currency) : ""}
            </td>

            <td className="py-2.5 text-right font-medium">
              {fmt(amount, currency)}
            </td>
          </tr>
        );
      })}

      <tr className="border-b border-[var(--stroke)]">
        <td
          colSpan={3}
          className="py-2 text-right text-[8px] text-[var(--muted)]"
        >
          {categoryName} subtotal
        </td>

        <td className="py-2 text-right text-[9px] font-medium">
          {fmt(categoryTotal, currency)}
        </td>
      </tr>
    </React.Fragment>
  );
}

// ============================================================
// Document Preview
// ============================================================

export default function DocumentPreview({ proposal }) {
  const {
    projectDetail: pd,
    scopeOfWork: sow,
    planOfAction: poa,
    budgetEstimate: be,
    paymentSchedule: ps,
    nextSteps: ns,
  } = proposal || {};

  if (!proposal) return null;

  if (!pd || !sow || !poa || !be || !ps || !ns) {
    return null;
  }

  const siteAddress =
    getProjectField(pd, "siteAddress", "site_address", "address") ||
    "49 PINK APPARTMENT, PASCHIM VIHAR";

  // ==========================================================
  // Project
  // ==========================================================

  const projectName = getProjectField(
    pd,
    "projectName",
    "project_name",
    "name",
  );

  const clientName = getProjectField(pd, "clientName", "client_name");

  const projectType = getProjectField(
    pd,
    "projectType",
    "project_type",
    "type",
  );

  const workType = getProjectField(pd, "workType", "work_type");

  // ==========================================================
  // Scope
  // ==========================================================

  const included = normalizeItems(
    first(sow?.included, sow?.includedItems, sow?.included_items),
  );

  const notIncluded = normalizeItems(
    first(
      sow?.notIncluded,
      sow?.not_included,
      sow?.excluded,
      sow?.excludedItems,
      sow?.excluded_items,
    ),
  );

  const optional = normalizeItems(
    first(sow?.optional, sow?.optionalItems, sow?.optional_items),
  );

  const scopeDisciplines =
    getDisciplines(sow).length > 0 ? getDisciplines(sow) : DEFAULT_DISCIPLINES;

  // ==========================================================
  // Plan of Action
  // ==========================================================

  const phases = getPOAPhases(poa);

  const overallProgramme =
    first(
      poa?.overallProgramme,
      poa?.overall_programme,
      poa?.programme,
      poa?.duration,
      poa?.overallDuration,
      poa?.overall_duration,
    ) || "4–5 months";

  // ==========================================================
  // Budget
  // ==========================================================

  const categories = getBudgetCategories(be);

  const currency = getBudgetCurrency(be);

  const subtotal = getBudgetSubtotal(be);

  const gstAmount = getBudgetGST(be, subtotal);

  const gstRate = num(
    first(
      be?.gstRate,
      be?.gst_rate,
      be?.estimate?.gstRate,
      be?.estimate?.gst_rate,
    ),
  );

  const grandTotal = getBudgetTotal(be, subtotal, gstAmount);

  const assumptions = normalizeItems(
    first(
      be?.assumes,
      be?.assumptions,
      be?.estimate?.assumes,
      be?.estimate?.assumptions,
    ),
  );

  const exclusions = normalizeItems(
    first(
      be?.excludes,
      be?.exclusions,
      be?.estimate?.excludes,
      be?.estimate?.exclusions,
    ),
  );

  // ==========================================================
  // Payments
  // ==========================================================

  const milestones = arr(
    first(ps?.milestones, ps?.paymentMilestones, ps?.payment_milestones),
  );

  const paymentTotal = milestones.reduce(
    (sum, milestone) =>
      sum +
      num(first(milestone?.share, milestone?.percentage, milestone?.percent)),
    0,
  );

  // ==========================================================
  // Next Steps
  // ==========================================================

  const nextStepItems = normalizeItems(
    first(ns?.items, ns?.steps, ns?.nextSteps, ns?.next_steps),
  );

  return (
    <div id="proposal-document" className="bg-[var(--mist-soft)] py-8">
      {/* ======================================================
          PAGE 1 — COVER
      ====================================================== */}

      <Page dark footer={false} className="items-center text-center">
        <div className="flex h-full flex-col items-center">
          <div className="mt-[100px]">
            <div className="relative mx-auto mb-5 h-[65px] w-[80px]">
              <div className="absolute left-[14px] top-[15px] h-[35px] w-[25px] rotate-[30deg] border-l-[10px] border-b-[10px] border-white" />

              <div className="absolute right-[14px] top-[15px] h-[35px] w-[25px] -rotate-[30deg] border-r-[10px] border-b-[10px] border-white" />

              <div className="absolute left-[32px] top-0 h-[14px] w-[20px] rotate-[30deg] border-t border-white/60" />

              <div className="absolute left-[35px] top-[10px] h-[8px] w-[16px] rounded-full bg-[var(--gold,#d9af61)]" />
            </div>

            <p className="text-[21px] font-light tracking-wide">
              {BRAND?.name || "RIPPŌTAI"}
            </p>

            <div className="mx-auto my-7 h-px w-[110px] bg-[var(--gold,#d9af61)]" />

            <p className="text-[15px] font-medium text-[var(--gold,#d9af61)]">
              {COVER?.title || "BUSINESS PROPOSAL"}
            </p>

            <p className="mt-4 text-[7px] uppercase tracking-widest text-white/50">
              {COVER?.subtitle || "INTERIOR DESIGN & TURNKEY EXECUTION"}
            </p>

            <p className="mt-1 text-[7px] uppercase tracking-widest text-white/50">
              {projectName || "PROJECT"} · {siteAddress}
            </p>

            <p className="mt-12 text-[7px] uppercase tracking-widest text-white/40">
              PREPARED FOR · {clientName || "______________________"}
            </p>
          </div>

          <div className="mt-auto w-full">
            <BuildingIllustration />
          </div>
        </div>
      </Page>

      {/* ======================================================
          PAGE 2 — CONTENTS
      ====================================================== */}

      <Page>
        <h2 className="mb-10 text-[25px] font-medium">Contents</h2>

        <div className="space-y-5">
          {CONTENTS.map((item) => (
            <div
              key={item.no}
              className="flex items-baseline gap-5 border-b border-[var(--stroke)] pb-3"
            >
              <span className="w-5 text-[9px] font-semibold text-[var(--sage)]">
                {item.no}
              </span>

              <span className="w-[145px] shrink-0 text-[10px] font-medium">
                {item.title}
              </span>

              <span className="text-[9px] leading-relaxed text-[var(--muted)]">
                {item.desc}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-12 max-w-[620px] text-[9px] leading-relaxed text-[var(--muted)]">
          This proposal is valid for thirty days from the date of issue. Figures
          are indicative until the BOQ is frozen and the Agreement is signed.
        </p>
      </Page>

      {/* ======================================================
          PAGE 3
      ====================================================== */}

      <SectionDivider number="01" title="Welcome note" />

      {/* ======================================================
          PAGE 4
      ====================================================== */}

      <Page>
        <SectionHeading number="01" title="Welcome note" />

        <div className="mt-10 space-y-5 text-[9px] leading-[1.65]">
          <p>
            Thank you for inviting {BRAND?.name || "Rippotai"} to work on your
            home at {siteAddress}.
          </p>

          <p>
            This proposal sets out everything you need to make a decision — what
            we will build, how we will run the site, how long it takes, what it
            costs, and when each payment falls due.
          </p>

          <p>
            We work as a single accountable team. One Project Lead owns your
            project end to end, one BOQ prices every item line by line, and one
            schedule ties payment to visible stages of work rather than calendar
            dates.
          </p>

          <p>
            Rippotai is the architecture and turnkey arm of SP Syndicate,
            working across Delhi NCR on residential and commercial interiors. We
            design it, cost it and coordinate its execution through a single
            accountable process.
          </p>
        </div>

        <div className="mt-10 border-t border-[var(--gold,#d9af61)] pt-7">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <Eyebrow>What this proposal covers</Eyebrow>

              <BulletList
                items={[
                  "Project detail and engagement type",
                  "Scope of work, discipline by discipline",
                  "Our process and where you sign off",
                  "Phase plan and timeline",
                ]}
              />
            </div>

            <div className="pt-5">
              <BulletList
                items={[
                  "Indicative budget estimate",
                  "Payment milestones and terms",
                  "What happens next, and when",
                  "Who to speak to at every stage",
                ]}
              />
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-[var(--stroke)] pt-7">
          <p className="text-[11px] font-medium">
            {CONTACT?.principal?.name || "Sagar Chhabra"}
          </p>

          <p className="mt-1 text-[8px] text-[var(--muted)]">
            {CONTACT?.principal?.role || "Principal Architect · Rippotai"}
          </p>
        </div>
      </Page>

      {/* ======================================================
          PAGE 5
      ====================================================== */}

      <SectionDivider number="02" title="Project Detail" />

      {/* ======================================================
          PAGE 6
      ====================================================== */}

      <Page>
        <SectionHeading number="02" title="Project detail" />

        <div className="mt-9 grid grid-cols-2 gap-x-10 gap-y-5">
          <Field
            label="Project name"
            value={getProjectField(pd, "projectName", "project_name", "name")}
          />

          <Field
            label="Client name"
            value={getProjectField(pd, "clientName", "client_name")}
          />

          <Field label="Site address" value={siteAddress} />

          <Field
            label="Total area (sq ft)"
            value={getProjectField(pd, "totalArea", "total_area")}
          />

          <Field
            label="Unit type"
            value={getProjectField(pd, "unitType", "unit_type")}
          />

          <Field
            label="Built-up area (sq ft)"
            value={getProjectField(pd, "builtUpArea", "built_up_area")}
          />

          <Field
            label="Carpet area (sq ft)"
            value={getProjectField(pd, "carpetArea", "carpet_area")}
          />

          <Field label="Bathrooms" value={pd.bathrooms} />

          <Field label="Bedrooms" value={pd.bedrooms} />

          <Field
            label="Date of issue"
            value={getProjectField(pd, "dateOfIssue", "date_of_issue")}
          />

          <Field label="Prepared by" value={pd.preparedBy || pd.prepared_by} />

          <Field label="Reviewed by" value={pd.reviewedBy || pd.reviewed_by} />
        </div>

        <div className="mt-10">
          <Eyebrow>Project type</Eyebrow>

          <div className="border-t border-[var(--gold,#d9af61)] pt-6">
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              {[
                "Residential",
                "Hospitality",
                "Commercial",
                "Institutional",
                "Industrial",
              ].map((type) => (
                <Checkbox
                  key={type}
                  label={type}
                  checked={selected(projectType, type)}
                />
              ))}
            </div>
          </div>
        </div>
      </Page>

      {/* ======================================================
          PAGE 7
      ====================================================== */}

      <Page>
        <div className="border-t border-[var(--gold,#d9af61)] pt-3">
          <Eyebrow>Work type</Eyebrow>
        </div>

        <div className="grid grid-cols-2 gap-12">
          <div>
            <Checkbox
              label="Consultancy"
              checked={selected(workType, "Consultancy")}
            />

            <div className="mt-6 border-t border-[var(--stroke)] pt-5">
              <BulletList
                items={[
                  "Design, drawings and specifications",
                  "Vendor tendering and rate comparison",
                  "Periodic site visits and quality checks",
                  "Execution contracted by the Client",
                ]}
              />
            </div>
          </div>

          <div>
            <Checkbox
              label="Turnkey execution"
              checked={selected(workType, "Turnkey")}
            />

            <div className="mt-6 border-t border-[var(--stroke)] pt-5">
              <p className="mb-3 text-[9px]">
                Everything under consultancy, plus
              </p>

              <BulletList
                items={[
                  "Procurement, labour and site management",
                  "Single-point delivery against a signed BOQ",
                  "Handover with warranties and as-built drawings",
                ]}
              />
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Eyebrow>The brief in one paragraph</Eyebrow>

          <div className="border-b border-[var(--stroke)] pb-5 text-[9px] leading-relaxed">
            {getProjectField(pd, "brief", "projectBrief", "project_brief")}
          </div>
        </div>

        <div className="mt-12">
          <Eyebrow>Constraints and site conditions noted</Eyebrow>

          <div className="border-b border-[var(--stroke)] pb-5 text-[9px] leading-relaxed">
            {getProjectField(
              pd,
              "constraints",
              "siteConstraints",
              "site_constraints",
            )}
          </div>
        </div>
      </Page>

      {/* ======================================================
          PAGE 8
      ====================================================== */}

      <SectionDivider number="03" title="Scope of Work" />

      {/* ======================================================
          PAGE 9
      ====================================================== */}

      <Page>
        <SectionHeading number="03" title="Scope of work" />

        <div className="mt-10 grid grid-cols-3 gap-8">
          <InfoBlock
            title="INCLUDED"
            items={
              included.length
                ? included
                : [
                    "Site supervision and skilled labour",
                    "Material procurement and delivery",
                    "All drawings up to GFC stage",
                    "Vendor selection and coordination",
                    "Debris removal and deep cleaning",
                    "Twelve-month workmanship cover",
                  ]
            }
          />

          <InfoBlock
            title="NOT INCLUDED"
            items={
              notIncluded.length
                ? notIncluded
                : [
                    "Society and authority approvals",
                    "Structural changes to the building",
                    "Electrical load enhancement",
                    "Appliances not listed in the BOQ",
                    "Curtains, art and styling accessories",
                    "GST and statutory levies",
                  ]
            }
          />

          <InfoBlock
            title="OPTIONAL — QUOTED SEPARATELY"
            items={
              optional.length
                ? optional
                : [
                    "Loose furniture sourcing",
                    "Curtains, blinds and sheers",
                    "Home automation and smart controls",
                    "Profile and cove lighting",
                    "Wardrobe internals upgrade",
                    "Balcony decking and planters",
                    "Appliance supply and installation",
                    "Art, decor and styling",
                  ]
            }
          />
        </div>
      </Page>

      {/* ======================================================
          PAGE 10
      ====================================================== */}

      <Page>
        <Eyebrow>Scope by discipline</Eyebrow>

        <div className="border-t border-[var(--gold,#d9af61)] pt-7">
          <div className="grid grid-cols-2 gap-x-10 gap-y-7">
            {scopeDisciplines.map((discipline, index) => (
              <DisciplineBlock
                key={`${discipline.name}-${index}`}
                {...discipline}
              />
            ))}
          </div>
        </div>

        <p className="mt-8 border-t border-[var(--gold,#d9af61)] pt-5 text-[8px] leading-relaxed text-[var(--muted)]">
          The area-wise scope matrix — every discipline against every space — is
          issued as a separate annexure and forms part of the Agreement.
        </p>
      </Page>

      {/* ======================================================
          PAGE 11
      ====================================================== */}

      <SectionDivider number="04" title="How we Work" />

      {/* ======================================================
          PAGE 12
      ====================================================== */}

      <Page>
        <SectionHeading number="04" title="How we work" />

        <div className="mt-10 grid grid-cols-2 gap-x-12 gap-y-8">
          <InfoBlock
            title="One point of contact"
            items={[
              "You speak to the Project Lead, start to finish",
              "Decisions confirmed in writing, on one channel",
            ]}
          />

          <InfoBlock
            title="Nothing hidden in the BOQ"
            items={[
              "Every item priced line by line",
              "No lump sums, no unexplained allowances",
            ]}
          />

          <InfoBlock
            title="Sign-off before spend"
            items={[
              "Nothing ordered before you approve it",
              "Changes quoted in writing, first",
            ]}
          />

          <InfoBlock
            title="Payment follows progress"
            items={[
              "Milestones release against stages of work",
              "Never against calendar dates",
            ]}
          />
        </div>

        <div className="mt-12">
          <Eyebrow>Who you deal with</Eyebrow>

          <div className="grid grid-cols-2 gap-x-12 gap-y-7">
            <div>
              <p className="text-[11px] font-medium">Principal Architect</p>

              <p className="mt-1 text-[10px]">
                {CONTACT?.principal?.name || "Sagar Chhabra"}
              </p>

              <p className="mt-1 text-[8px] text-[var(--muted)]">
                Design direction and final approvals
              </p>
            </div>

            <div>
              <p className="text-[11px] font-medium">Site Supervisor</p>

              <p className="mt-1 text-[8px] text-[var(--muted)]">
                On site every working day
              </p>

              <p className="mt-1 text-[8px] text-[var(--muted)]">
                Labour control and quality checks
              </p>
            </div>

            <div>
              <p className="text-[11px] font-medium">Project Lead</p>

              <p className="mt-1 text-[10px]">
                {CONTACT?.projectLead?.name || "Sarthi Jangra"}
              </p>

              <p className="mt-1 text-[8px] text-[var(--muted)]">
                Your single point of contact
              </p>
            </div>

            <div>
              <p className="text-[11px] font-medium">Admin Coordinator</p>

              <p className="mt-1 text-[8px] text-[var(--muted)]">
                Billing, documents and scheduling
              </p>

              <p className="mt-1 text-[8px] text-[var(--muted)]">
                Material tracking and warranties
              </p>
            </div>
          </div>
        </div>
      </Page>

      {/* ======================================================
          PAGE 13
      ====================================================== */}

      <Page>
        <Eyebrow>Where you sign off</Eyebrow>

        <div className="border-t border-[var(--gold,#d9af61)] pt-7">
          <div className="grid grid-cols-2 gap-x-12 gap-y-7">
            {[
              ["G1", "Concept", "Layout, look and material direction"],
              ["G2", "BOQ", "Cost, scope and quantities frozen"],
              ["G3", "GFC", "Working drawings and material samples"],
              ["G4", "Stage", "Each execution phase"],
              ["G5", "Handover", "Snag list closed and signed"],
            ].map(([code, title, desc]) => (
              <div key={code} className="border-b border-[var(--stroke)] pb-5">
                <p className="text-[10px] font-medium">
                  {code} {title}
                </p>

                <p className="mt-1 text-[8px] leading-relaxed text-[var(--muted)]">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <Eyebrow>What you receive, and when</Eyebrow>

          <div className="border-t border-[var(--gold,#d9af61)] pt-7">
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-medium">Daily</p>
                <p className="mt-1 text-[8px] text-[var(--muted)]">
                  Site photo report
                </p>
              </div>

              <div>
                <p className="text-[10px] font-medium">Weekly</p>
                <p className="mt-1 text-[8px] text-[var(--muted)]">
                  Progress walkthrough with the Project Lead
                </p>
              </div>

              <div>
                <p className="text-[10px] font-medium">Monthly</p>
                <p className="mt-1 text-[8px] text-[var(--muted)]">
                  Stage note, billing and revised timeline
                </p>
              </div>

              <div>
                <p className="text-[10px] font-medium">At each gate</p>
                <p className="mt-1 text-[8px] text-[var(--muted)]">
                  Written approval request with drawings
                </p>
              </div>
            </div>
          </div>
        </div>
      </Page>

      {/* ======================================================
          PAGE 14
      ====================================================== */}

      <SectionDivider number="05" title="Plan of Action" />

      {/* ======================================================
          PAGE 15
      ====================================================== */}

      <Page>
        <SectionHeading number="05" title="Plan of action" />

        <p className="mt-8 text-[9px] leading-relaxed text-[var(--muted)]">
          {first(
            poa?.executionDescription,
            poa?.execution_description,
            poa?.description,
          ) ||
            "The execution programme below is based on the approved project scope and the current site sequence."}
        </p>

        <div className="mt-8">
          <div className="grid grid-cols-[38px_1fr_75px] gap-4 border-b border-[var(--stroke)] pb-3 text-[8px] uppercase tracking-wide text-[var(--muted)]">
            <span>Phase</span>
            <span>What happens</span>
            <span className="text-right">Duration</span>
          </div>

          <div>
            {phases.length > 0 ? (
              phases.map((phase, index) => (
                <div
                  key={`${phase.code}-${index}`}
                  className="grid grid-cols-[38px_1fr_75px] gap-4 border-b border-[var(--stroke)] py-4"
                >
                  <span className="text-[9px] font-semibold text-[var(--sage)]">
                    {phase.code}
                  </span>

                  <div>
                    <p className="text-[10px] font-medium">{phase.name}</p>

                    <p className="mt-1 text-[8px] leading-relaxed text-[var(--muted)]">
                      {phase.detail}
                    </p>

                    {phase.parallel && (
                      <p className="mt-2 text-[7px] uppercase tracking-wide text-[var(--gold,#b8860b)]">
                        {phase.parallel}
                      </p>
                    )}
                  </div>

                  <span className="text-right text-[9px] font-medium">
                    {phase.duration}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-[9px] text-[var(--muted)]">
                No execution phases have been added yet.
              </div>
            )}
          </div>
        </div>

        <p className="mt-7 text-[10px] font-medium">
          Overall programme: {overallProgramme}
        </p>

        <p className="mt-2 text-[8px] leading-relaxed text-[var(--muted)]">
          {first(poa?.note, poa?.notes) ||
            "Durations assume timely decisions, approvals, payments, material availability and uninterrupted site access. Statutory restrictions and material lead times may extend the programme proportionately."}
        </p>
      </Page>

      {/* ======================================================
          PAGE 16
      ====================================================== */}

      <SectionDivider number="06" title="Budget Estimate" />

      {/* ======================================================
          PAGE 17
      ====================================================== */}

      <Page>
        <SectionHeading number="06" title="Budget estimate" />

        <p className="mt-8 text-[9px] leading-relaxed text-[var(--muted)]">
          {first(
            be?.description,
            be?.estimateDescription,
            be?.estimate_description,
          ) ||
            "The estimate below is based on the current project scope. The detailed BOQ remains the source of truth once quantities, specifications and rates are frozen."}
        </p>

        {categories.length > 0 ? (
          <table className="mt-8 w-full border-collapse text-[8px]">
            <thead>
              <tr className="border-b border-[var(--stroke)] text-left text-[7px] uppercase tracking-wide text-[var(--muted)]">
                <th className="py-3">Item</th>

                <th className="py-3 text-right">Qty</th>

                <th className="py-3 text-right">Rate</th>

                <th className="py-3 text-right">Amount</th>
              </tr>
            </thead>

            <tbody>
              {categories.map((category, index) => (
                <BudgetCategory
                  key={category?.id || category?.categoryId || index}
                  category={category}
                  currency={currency}
                />
              ))}

              <tr className="border-b border-[var(--stroke)]">
                <td
                  colSpan={3}
                  className="py-3 text-right text-[9px] text-[var(--muted)]"
                >
                  Subtotal
                </td>

                <td className="py-3 text-right font-medium">
                  {fmt(subtotal, currency)}
                </td>
              </tr>

              {gstRate > 0 && (
                <tr className="border-b border-[var(--stroke)]">
                  <td
                    colSpan={3}
                    className="py-3 text-right text-[9px] text-[var(--muted)]"
                  >
                    GST {gstRate}%
                  </td>

                  <td className="py-3 text-right font-medium">
                    {fmt(gstAmount, currency)}
                  </td>
                </tr>
              )}

              <tr>
                <td colSpan={3} className="py-4 text-[12px] font-medium">
                  Total estimate
                </td>

                <td className="py-4 text-right text-[12px] font-medium">
                  {fmt(grandTotal, currency)}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="mt-8 border-t border-[var(--stroke)] py-8 text-[9px] text-[var(--muted)]">
            No budget categories have been added yet.
          </div>
        )}

        <p className="mt-6 text-[8px] leading-relaxed text-[var(--muted)]">
          {first(be?.totalLabel, be?.estimateTotalLabel) ||
            "Budget remains subject to the final BOQ, approved specifications and applicable taxes."}
        </p>
      </Page>

      {/* ======================================================
          PAGE 18
      ====================================================== */}

      <Page>
        <div className="grid grid-cols-2 gap-12">
          <div>
            <Eyebrow>What the estimate assumes</Eyebrow>

            <div className="border-t border-[var(--gold,#d9af61)] pt-6">
              <BulletList
                items={
                  assumptions.length
                    ? assumptions
                    : [
                        "Finish level as discussed at the site visit",
                        "Standard ceiling height, no structural change",
                        "Material lead times within four weeks",
                        "Uninterrupted site access and services",
                        "Decisions returned within forty-eight hours",
                      ]
                }
              />
            </div>
          </div>

          <div>
            <Eyebrow>What sits outside it</Eyebrow>

            <div className="border-t border-[var(--gold,#d9af61)] pt-6">
              <BulletList
                items={
                  exclusions.length
                    ? exclusions
                    : [
                        "GST and statutory levies",
                        "Society charges, permissions and deposits",
                        "Appliances and loose furniture unless selected",
                        "Client-supplied material and its handling",
                        "Variations raised after the BOQ is frozen",
                      ]
                }
              />
            </div>
          </div>
        </div>

        <div className="mt-14">
          <Eyebrow>How the number firms up</Eyebrow>

          <div className="border-t border-[var(--gold,#d9af61)] pt-6">
            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
              {[
                ["01", "Estimate", "This document — proposal-stage estimate"],
                [
                  "02",
                  "Detailed BOQ",
                  "Every item priced, brand and quantity named",
                ],
                [
                  "03",
                  "Freeze at Gate 02",
                  "Scope and cost signed, Agreement issued",
                ],
                [
                  "04",
                  "Variations only",
                  "Any change quoted in writing before it is built",
                ],
              ].map(([code, title, desc]) => (
                <div
                  key={code}
                  className="border-b border-[var(--stroke)] pb-6"
                >
                  <p className="text-[9px] font-semibold text-[var(--sage)]">
                    {code}
                  </p>

                  <p className="mt-1 text-[11px] font-medium">{title}</p>

                  <p className="mt-1 text-[8px] leading-relaxed text-[var(--muted)]">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Page>

      {/* ======================================================
          PAGE 19
      ====================================================== */}

      <SectionDivider number="07" title="Payment Schedule" />

      {/* ======================================================
          PAGE 20
      ====================================================== */}

      <Page>
        <SectionHeading number="07" title="Payment schedule" />

        <p className="mt-8 text-[9px] leading-relaxed text-[var(--muted)]">
          Each milestone falls due before the corresponding phase is mobilised,
          so material can be ordered and labour deployed without a break between
          phases.
        </p>

        <table className="mt-8 w-full border-collapse text-[9px]">
          <thead>
            <tr className="border-b border-[var(--stroke)] text-left text-[8px] uppercase tracking-wide text-[var(--muted)]">
              <th className="py-3">Milestone</th>

              <th className="py-3">Release trigger</th>

              <th className="py-3 text-right">Share</th>
            </tr>
          </thead>

          <tbody>
            {milestones.map((milestone, index) => (
              <tr
                key={milestone?.id || milestone?.code || index}
                className="border-b border-[var(--stroke)]"
              >
                <td className="py-3 font-medium">
                  {first(
                    milestone?.code,
                    milestone?.sequence
                      ? String(milestone.sequence).padStart(2, "0")
                      : "",
                  )}
                  {" — "}
                  {first(
                    milestone?.name,
                    milestone?.title,
                    milestone?.milestone,
                  )}
                </td>

                <td className="py-3 text-[var(--muted)]">
                  {first(
                    milestone?.trigger,
                    milestone?.releaseTrigger,
                    milestone?.release_trigger,
                    milestone?.description,
                  )}
                </td>

                <td className="py-3 text-right font-medium">
                  {first(
                    milestone?.share,
                    milestone?.percentage,
                    milestone?.percent,
                    0,
                  )}
                  %
                </td>
              </tr>
            ))}

            <tr>
              <td colSpan={2} className="py-4 text-[10px] font-medium">
                Total contract value
              </td>

              <td className="py-4 text-right text-[10px] font-medium">
                {paymentTotal}%
              </td>
            </tr>
          </tbody>
        </table>
      </Page>

      {/* ======================================================
          PAGE 21
      ====================================================== */}

      <Page>
        <Eyebrow>Key terms</Eyebrow>

        <div className="border-t border-[var(--gold,#d9af61)] pt-7">
          <div className="grid grid-cols-2 gap-x-12 gap-y-7">
            {[
              [
                "Invoicing and due date",
                "Payment due within three working days of invoice",
              ],
              [
                "Mode of payment",
                "NEFT, RTGS or cheque to the Rippotai account only",
              ],
              ["Taxes", "All figures exclusive of GST"],
              [
                "Delay in release",
                "Beyond seven days, work may pause. Timeline extends day for day",
              ],
              ["Variations", "Quoted in writing before execution"],
              ["Retention", "Final 5% held until the snag list is signed"],
              [
                "Title of materials",
                "Passes to the Client on full milestone payment",
              ],
              [
                "Jurisdiction",
                "Settled amicably, failing which courts at Delhi",
              ],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-[var(--stroke)] pb-5">
                <p className="text-[10px] font-medium">{label}</p>

                <p className="mt-2 text-[8px] leading-relaxed text-[var(--muted)]">
                  {value}
                </p>

                {label === "Mode of payment" && (
                  <p className="mt-2 text-[8px] text-[var(--muted)]">
                    No cash, and no payment to anyone at site
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 text-[8px] leading-relaxed text-[var(--muted)]">
          The full Payment Schedule is issued as a separate document and forms
          part of the Agreement.
        </p>
      </Page>

      {/* ======================================================
          PAGE 22
      ====================================================== */}

      <SectionDivider number="08" title="Next Steps" />

      {/* ======================================================
          PAGE 23
      ====================================================== */}

      <Page>
        <SectionHeading number="08" title="Next steps" />

        <p className="mt-8 text-[9px] leading-relaxed text-[var(--muted)]">
          Five things stand between this proposal and a live site. Most clients
          clear them inside a fortnight.
        </p>

        <div className="mt-8 space-y-6">
          {(nextStepItems.length
            ? nextStepItems
            : [
                {
                  code: "01",
                  title: "Review this proposal",
                  line1: "Take a week. Mark anything unclear",
                  line2: "We will walk it through with you",
                },
                {
                  code: "02",
                  title: "Confirm the scope",
                  line1: "Confirm engagement and optional items",
                  line2: "We revise the BOQ against your decisions",
                },
                {
                  code: "03",
                  title: "Freeze cost at Gate 02",
                  line1: "BOQ priced line by line and signed",
                  line2: "The estimate becomes a firm number",
                },
                {
                  code: "04",
                  title: "Sign the Agreement",
                  line1: "Scope, Payment Schedule and Plan of Action",
                  line2: "Issued together for signature",
                },
                {
                  code: "05",
                  title: "Release M1 and mobilise",
                  line1: "Booking and mobilisation payment",
                  line2: "Site team mobilises after formal clearance",
                },
              ]
          ).map((step, index) => {
            const code =
              first(
                step?.code,
                step?.sequence
                  ? String(step.sequence).padStart(2, "0")
                  : undefined,
              ) || String(index + 1).padStart(2, "0");

            const title = first(step?.title, step?.name) || "";

            const line1 =
              first(step?.line1, step?.description, step?.detail) || "";

            const line2 = first(step?.line2, step?.action, step?.note) || "";

            return (
              <div
                key={`${code}-${index}`}
                className="grid grid-cols-[35px_1fr] gap-4 border-b border-[var(--stroke)] pb-5"
              >
                <span className="text-[10px] font-semibold text-[var(--sage)]">
                  {code}
                </span>

                <div>
                  <p className="text-[11px] font-medium">{title}</p>

                  <p className="mt-1 text-[8px] text-[var(--muted)]">{line1}</p>

                  {line2 && (
                    <p className="mt-1 text-[8px] text-[var(--muted)]">
                      {line2}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10">
          <Eyebrow>What we need from you to start</Eyebrow>

          <div className="grid grid-cols-2 gap-x-10 gap-y-3 border-t border-[var(--gold,#d9af61)] pt-6">
            {[
              "Signed Scope of Work and Agreement",
              "Booking and mobilisation payment",
              "Society permission for work and material lift",
              "Access, keys and a point of contact at site",
              "Water and power connection at the unit",
              "Any client-supplied material schedule",
            ].map((item) => (
              <div key={item} className="flex gap-2 text-[9px]">
                <span>☐</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </Page>

      {/* ======================================================
          PAGE 24
      ====================================================== */}

      <Page>
        <Eyebrow>Talk to us</Eyebrow>

        <div className="border-t border-[var(--gold,#d9af61)] pt-8">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <p className="text-[11px] font-medium">
                {CONTACT?.principal?.name || "Sagar Chhabra"}
              </p>

              <p className="mt-1 text-[8px] text-[var(--muted)]">
                Principal Architect
              </p>

              <p className="mt-3 text-[8px] text-[var(--muted)]">
                Design direction and approvals
              </p>
            </div>

            <div>
              <p className="text-[11px] font-medium">
                {CONTACT?.projectLead?.name || "Sarthi Jangra"}
              </p>

              <p className="mt-1 text-[8px] text-[var(--muted)]">
                Project Lead
              </p>

              <p className="mt-3 text-[8px] text-[var(--muted)]">
                Your single point of contact
              </p>
            </div>
          </div>

          <div className="mt-10 border-t border-[var(--stroke)] pt-7">
            <p className="text-[11px] font-medium">
              {BRAND?.name || "Rippotai"}
            </p>

            <p className="mt-1 text-[8px] text-[var(--muted)]">
              Architecture · Interiors · Turnkey
            </p>

            <p className="mt-1 text-[8px] text-[var(--muted)]">Delhi NCR</p>
          </div>
        </div>

        <div className="mt-12 border-t border-[var(--stroke)] pt-7">
          <Eyebrow>Proposal validity</Eyebrow>

          <p className="text-[9px]">
            {getProjectField(pd, "validity", "proposalValidity") ||
              "Thirty days from date of issue"}
          </p>

          <p className="mt-1 text-[8px] text-[var(--muted)]">
            Rates held for the stated period
          </p>
        </div>

        <div className="mt-10 border-t border-[var(--gold,#d9af61)] pt-7">
          <p className="text-[8px] leading-relaxed text-[var(--muted)]">
            The Client confirms having read this proposal and accepts the scope,
            programme, indicative budget and payment milestones set out in it,
            subject to the BOQ being frozen and the Agreement signed.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-12 border-t border-[var(--stroke)] pt-8">
          <div>
            <Eyebrow>For Rippotai</Eyebrow>

            <p className="text-[10px] font-medium">Authorised Signatory</p>

            <p className="mt-2 text-[8px]">
              Name · {CONTACT?.principal?.name || "Sagar Chhabra"}
            </p>

            <p className="mt-8 text-[8px] text-[var(--muted)]">
              Date · __________________
            </p>
          </div>

          <div>
            <Eyebrow>Accepted by the client</Eyebrow>

            <p className="text-[10px] font-medium">Client Signature</p>

            <p className="mt-2 text-[8px]">Name · __________________</p>

            <p className="mt-8 text-[8px] text-[var(--muted)]">
              Date · __________________
            </p>
          </div>
        </div>
      </Page>
    </div>
  );
}
