import React from "react";
import { BRAND, COVER, CONTENTS, CONTACT } from "../../data/staticContent";

// ============================================================
// Helpers
// ============================================================

const fmt = (n, currency = "₹") =>
  `${currency} ${Number(n || 0).toLocaleString("en-IN")}`;

const arr = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
};

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

const selected = (value, option) => {
  if (!value) return false;

  const a = String(value).trim().toLowerCase();
  const b = String(option).trim().toLowerCase();

  return a === b || a.includes(b) || b.includes(a);
};

// ============================================================
// Global PDF page
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
// Section divider
// ============================================================

function SectionDivider({ number, title, siteAddress }) {
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

      <div className="absolute bottom-2 left-0 right-0 hidden">
        <Footer dark siteAddress={siteAddress} />
      </div>
    </Page>
  );
}

// ============================================================
// Simple building illustration
// ============================================================

function BuildingIllustration() {
  return (
    <div className="relative h-full w-full opacity-70">
      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-white/30" />

      {/* Main building */}
      <div className="absolute bottom-0 left-[11%] h-[135px] w-[58%] border border-white/40">
        <div className="grid grid-cols-3 gap-x-7 gap-y-4 p-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-5 border border-white/30" />
          ))}
        </div>

        <div className="absolute bottom-0 left-[42%] h-12 w-8 border border-white/40" />
      </div>

      {/* Side building */}
      <div className="absolute bottom-0 left-[69%] h-[82px] w-[17%] border border-white/30">
        <div className="grid grid-cols-2 gap-2 p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 border border-white/25" />
          ))}
        </div>
      </div>

      {/* Tree */}
      <div className="absolute bottom-0 left-[5%] h-[72px] w-[42px]">
        <div className="absolute bottom-0 left-1/2 h-9 w-px -translate-x-1/2 bg-white/40" />

        <div className="absolute left-0 top-0 h-9 w-9 rounded-full border border-white/40" />
        <div className="absolute left-3 top-2 h-9 w-9 rounded-full border border-white/40" />
      </div>
    </div>
  );
}

// ============================================================
// Standard heading
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
// List
// ============================================================

function BulletList({ items = [], className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {normalizeItems(items).map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex gap-2 text-[9px] leading-relaxed"
        >
          <span className="mt-[5px] h-[3px] w-[3px] shrink-0 rounded-full bg-[var(--ink-green)]" />
          <span>{typeof item === "string" ? item : item?.label || ""}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Two-column info block
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
// Discipline block
// ============================================================

function DisciplineBlock({ name, items }) {
  return (
    <div className="border-b border-[var(--stroke)] pb-6">
      <p className="mb-2 text-[13px] font-medium">{name}</p>

      <div className="space-y-1.5 text-[9px] leading-relaxed text-[var(--ink-green)]">
        {normalizeItems(items).map((item, index) => (
          <p key={`${name}-${index}`}>
            {typeof item === "string" ? item : item?.label || ""}
          </p>
        ))}
      </div>
    </div>
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

  if (!pd || !sow || !poa || !be || !ps || !ns) {
    return null;
  }

  const siteAddress = pd.siteAddress || "49 PINK APPARTMENT, PASCHIM VIHAR";

  // ----------------------------------------------------------
  // Budget
  // ----------------------------------------------------------

  const lineItems = arr(be.lineItems);

  const subtotal = lineItems.reduce(
    (sum, item) => sum + Number(item?.amount || 0),
    0,
  );

  const contingency = Math.round(
    (subtotal * Number(be.contingencyPct || 0)) / 100,
  );

  const total = subtotal + contingency;

  // ----------------------------------------------------------
  // Project types
  // ----------------------------------------------------------

  const projectType = pd.projectType || "";

  // ----------------------------------------------------------
  // Work type
  // ----------------------------------------------------------

  const workType = pd.workType || "";

  // ----------------------------------------------------------
  // Payment total
  // ----------------------------------------------------------

  const paymentTotal = arr(ps.milestones).reduce(
    (sum, milestone) => sum + Number(milestone?.share || 0),
    0,
  );

  return (
    <div id="proposal-document" className="bg-[var(--mist-soft)] py-8">
      {/* ======================================================
          PAGE 1 — COVER
      ====================================================== */}

      <Page dark footer={false} className="items-center text-center">
        <div className="flex h-full flex-col items-center">
          <div className="mt-[100px]">
            {/* Logo */}
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
              {pd.projectName || "PINK APPARTMENT"} · {siteAddress}
            </p>

            <p className="mt-12 text-[7px] uppercase tracking-widest text-white/40">
              PREPARED FOR · {pd.clientName || "______________________"}
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
          PAGE 3 — SECTION DIVIDER
      ====================================================== */}

      <SectionDivider
        number="01"
        title="Welcome note"
        siteAddress={siteAddress}
      />

      {/* ======================================================
          PAGE 4 — WELCOME NOTE
      ====================================================== */}

      <Page>
        <SectionHeading number="01" title="Welcome note" />

        <div className="mt-10 space-y-5 text-[9px] leading-[1.65]">
          <p>
            Thank you for inviting {BRAND?.name || "Rippotai"} to work on your
            home at {pd.siteAddress}.
          </p>

          <p>
            This proposal sets out everything you need to make a decision — what
            we will build, how we will run the site, how long it takes, what it
            costs, and when each payment falls due. Nothing is held back for
            later.
          </p>

          <p>
            We work as a single accountable team. One Project Lead owns your
            project end to end, one BOQ prices every item line by line, and one
            schedule ties payment to visible stages of work rather than to
            calendar dates. You will never be asked to release money for
            something you cannot see.
          </p>

          <p>
            Rippotai is the architecture and turnkey arm of SP Syndicate,
            working across Delhi NCR on residential and commercial interiors. We
            design it, we cost it honestly, and we build it ourselves — which
            means no gap between the drawing you approve and the room you walk
            into.
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
            {CONTACT?.principal?.role || "Principle Architect · Rippotai"}
          </p>
        </div>
      </Page>

      {/* ======================================================
          PAGE 5 — SECTION DIVIDER
      ====================================================== */}

      <SectionDivider
        number="02"
        title="Project Detail"
        siteAddress={siteAddress}
      />

      {/* ======================================================
          PAGE 6 — PROJECT DETAIL
      ====================================================== */}

      <Page>
        <SectionHeading number="02" title="Project detail" />

        <div className="mt-9 grid grid-cols-2 gap-x-10 gap-y-5">
          <Field label="Project name" value={pd.projectName} />

          <Field label="Client name" value={pd.clientName} />

          <Field label="Site address" value={pd.siteAddress} />

          <Field label="Total area (sq ft)" value={pd.totalArea} />

          <Field label="Unit type" value={pd.unitType} />

          <Field label="Built-up area (sq ft)" value={pd.builtUpArea} />

          <Field label="Carpet area (sq ft)" value={pd.carpetArea} />

          <Field label="Bathrooms" value={pd.bathrooms} />

          <Field label="Bedrooms" value={pd.bedrooms} />

          <Field label="Date of issue" value={pd.dateOfIssue} />

          <Field label="Prepared by" value={pd.preparedBy} />

          <Field label="Reviewed by" value={pd.reviewedBy} />
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
          PAGE 7 — WORK TYPE
      ====================================================== */}

      <Page>
        <div className="border-t border-[var(--gold,#d9af61)] pt-3">
          <Eyebrow>Work type</Eyebrow>
        </div>

        <div className="grid grid-cols-2 gap-12">
          {/* Consultancy */}
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

          {/* Turnkey */}
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

          <div className="space-y-4">
            <div className="border-b border-[var(--stroke)] pb-5 text-[9px] leading-relaxed">
              {pd.brief || ""}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Eyebrow>Constraints and site conditions noted</Eyebrow>

          <div className="border-b border-[var(--stroke)] pb-5 text-[9px] leading-relaxed">
            {pd.constraints || ""}
          </div>
        </div>
      </Page>

      {/* ======================================================
          PAGE 8 — SECTION DIVIDER
      ====================================================== */}

      <SectionDivider
        number="03"
        title="Scope of Work"
        siteAddress={siteAddress}
      />

      {/* ======================================================
          PAGE 9 — SCOPE
      ====================================================== */}

      <Page>
        <SectionHeading number="03" title="Scope of work" />

        <div className="mt-10 grid grid-cols-3 gap-8">
          <InfoBlock
            title="INCLUDED"
            items={
              sow.included?.length
                ? sow.included
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
              sow.notIncluded?.length
                ? sow.notIncluded
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
              sow.optional?.length
                ? sow.optional
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
          PAGE 10 — SCOPE BY DISCIPLINE
      ====================================================== */}

      <Page>
        <Eyebrow>Scope by discipline</Eyebrow>

        <div className="border-t border-[var(--gold,#d9af61)] pt-7">
          <div className="grid grid-cols-2 gap-x-10 gap-y-7">
            {[
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
            ].map((discipline) => (
              <DisciplineBlock key={discipline.name} {...discipline} />
            ))}
          </div>
        </div>

        <p className="mt-8 border-t border-[var(--gold,#d9af61)] pt-5 text-[8px] leading-relaxed text-[var(--muted)]">
          The area-wise scope matrix — every discipline against every space — is
          issued as a separate annexure and forms part of the Agreement.
        </p>
      </Page>

      {/* ======================================================
          PAGE 11 — SECTION DIVIDER
      ====================================================== */}

      <SectionDivider
        number="04"
        title="How we Work"
        siteAddress={siteAddress}
      />

      {/* ======================================================
          PAGE 12 — HOW WE WORK
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
              "No lump sums, no allowances",
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
              <p className="text-[11px] font-medium">Principle Architect</p>
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
              <p className="mt-1 text-[10px]">Sarthi Jangra</p>
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
          PAGE 13 — GATES / CADENCE
      ====================================================== */}

      <Page>
        <Eyebrow>Where you sign off</Eyebrow>

        <div className="border-t border-[var(--gold,#d9af61)] pt-7">
          <div className="grid grid-cols-2 gap-x-12 gap-y-7">
            {[
              ["G1", "Concept", "Layout, look and material direction"],
              ["G2", "BOQ", "Cost, scope and quantities frozen"],
              ["G3", "GFC", "Working drawings and material samples"],
              ["G4", "Stage", "Each of the seven execution phases"],
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
                  Site photo report on WhatsApp
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
          PAGE 14 — SECTION DIVIDER
      ====================================================== */}

      <SectionDivider
        number="05"
        title="Plan of Action"
        siteAddress={siteAddress}
      />

      {/* ======================================================
          PAGE 15 — PLAN OF ACTION
      ====================================================== */}

      <Page>
        <SectionHeading number="05" title="Plan of action" />

        <p className="mt-8 text-[9px] leading-relaxed text-[var(--muted)]">
          Seven phases, sequenced at site. Phases overlap where the trade
          allows, which is how four to five months of work compresses into the
          stated programme.
        </p>

        <div className="mt-8">
          <div className="grid grid-cols-[38px_1fr_75px] gap-4 border-b border-[var(--stroke)] pb-3 text-[8px] uppercase tracking-wide text-[var(--muted)]">
            <span>Phase</span>
            <span>What happens</span>
            <span className="text-right">Duration</span>
          </div>

          <div className="space-y-0">
            {arr(poa.phases).map((phase, index) => (
              <div
                key={phase?.code || index}
                className="grid grid-cols-[38px_1fr_75px] gap-4 border-b border-[var(--stroke)] py-4"
              >
                <span className="text-[9px] font-semibold text-[var(--sage)]">
                  {phase?.code || String(index + 1).padStart(2, "0")}
                </span>

                <div>
                  <p className="text-[10px] font-medium">{phase?.name}</p>

                  <p className="mt-1 text-[8px] leading-relaxed text-[var(--muted)]">
                    {phase?.detail}
                  </p>

                  {phase?.parallel && (
                    <p className="mt-2 text-[7px] uppercase tracking-wide text-[var(--gold,#b8860b)]">
                      {phase.parallel}
                    </p>
                  )}
                </div>

                <span className="text-right text-[9px] font-medium">
                  {phase?.duration}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-7 text-[10px] font-medium">
          Overall programme: {poa.overallProgramme || "4–5 months"}
        </p>

        <p className="mt-2 text-[8px] leading-relaxed text-[var(--muted)]">
          {poa.note ||
            "Durations run from mobilisation of that phase and assume decisions within forty-eight hours and payments released on time. Statutory construction restrictions and material lead times extend the programme proportionately."}
        </p>
      </Page>

      {/* ======================================================
          PAGE 16 — SECTION DIVIDER
      ====================================================== */}

      <SectionDivider
        number="06"
        title="Budget Estimate"
        siteAddress={siteAddress}
      />

      {/* ======================================================
          PAGE 17 — BUDGET
      ====================================================== */}

      <Page>
        <SectionHeading number="06" title="Budget estimate" />

        <p className="mt-8 text-[9px] leading-relaxed text-[var(--muted)]">
          An indicative range at proposal stage, built from the areas and the
          finish level discussed. It becomes a firm number when the BOQ is
          priced line by line and frozen at Gate 02.
        </p>

        <table className="mt-8 w-full border-collapse text-[9px]">
          <thead>
            <tr className="border-b border-[var(--stroke)] text-left text-[8px] uppercase tracking-wide text-[var(--muted)]">
              <th className="py-3">Head of cost</th>
              <th className="py-3 text-right">Amount (₹)</th>
            </tr>
          </thead>

          <tbody>
            {lineItems.map((item, index) => (
              <tr
                key={`${item?.head || "item"}-${index}`}
                className="border-b border-[var(--stroke)]"
              >
                <td className="py-3">
                  <p className="font-medium">{item?.head}</p>

                  <p className="mt-1 text-[8px] text-[var(--muted)]">
                    {item?.description}
                  </p>
                </td>

                <td className="py-3 text-right font-medium">
                  {fmt(item?.amount, be.currency)}
                </td>
              </tr>
            ))}

            <tr className="border-b border-[var(--stroke)]">
              <td className="py-3 text-[var(--muted)]">Subtotal</td>

              <td className="py-3 text-right">{fmt(subtotal, be.currency)}</td>
            </tr>

            <tr className="border-b border-[var(--stroke)]">
              <td className="py-3 text-[var(--muted)]">Contingency</td>

              <td className="py-3 text-right">
                {fmt(contingency, be.currency)}
              </td>
            </tr>

            <tr>
              <td className="py-4 text-[12px] font-medium">
                Estimate, exclusive of GST
              </td>

              <td className="py-4 text-right text-[12px] font-medium">
                {fmt(total, be.currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </Page>

      {/* ======================================================
          PAGE 18 — BUDGET ASSUMPTIONS
      ====================================================== */}

      <Page>
        <div className="grid grid-cols-2 gap-12">
          <div>
            <Eyebrow>What the estimate assumes</Eyebrow>

            <div className="border-t border-[var(--gold,#d9af61)] pt-6">
              <BulletList
                items={
                  be.assumes?.length
                    ? be.assumes
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
                  be.excludes?.length
                    ? be.excludes
                    : [
                        "GST and statutory levies",
                        "Society charges, permissions and deposits",
                        "Appliances and loose furniture unless ticked",
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
                ["01", "Estimate", "This document — a range, not a quote"],
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
          PAGE 19 — SECTION DIVIDER
      ====================================================== */}

      <SectionDivider
        number="07"
        title="Payment Schedule"
        siteAddress={siteAddress}
      />

      {/* ======================================================
          PAGE 20 — PAYMENT SCHEDULE
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
            {arr(ps.milestones).map((milestone, index) => (
              <tr
                key={milestone?.code || index}
                className="border-b border-[var(--stroke)]"
              >
                <td className="py-3 font-medium">
                  {milestone?.code} — {milestone?.name}
                </td>

                <td className="py-3 text-[var(--muted)]">
                  {milestone?.trigger}
                </td>

                <td className="py-3 text-right font-medium">
                  {milestone?.share}%
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
          PAGE 21 — PAYMENT TERMS
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
              ["Variations", "Quoted in writing, billed 100% in advance"],
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
          The full sixteen-clause Payment Schedule is issued as a separate
          document and forms part of the Agreement.
        </p>
      </Page>

      {/* ======================================================
          PAGE 22 — SECTION DIVIDER
      ====================================================== */}

      <SectionDivider
        number="08"
        title="Next Steps"
        siteAddress={siteAddress}
      />

      {/* ======================================================
          PAGE 23 — NEXT STEPS
      ====================================================== */}

      <Page>
        <SectionHeading number="08" title="Next steps" />

        <p className="mt-8 text-[9px] leading-relaxed text-[var(--muted)]">
          Five things stand between this proposal and a live site. Most clients
          clear them inside a fortnight.
        </p>

        <div className="mt-8 space-y-6">
          {[
            [
              "01",
              "Review this proposal",
              "Take a week. Mark anything unclear",
              "We will walk it through with you",
            ],
            [
              "02",
              "Confirm the scope",
              "Tick the engagement and optional items",
              "We revise the BOQ against your ticks",
            ],
            [
              "03",
              "Freeze cost at Gate 02",
              "BOQ priced line by line and signed",
              "The estimate becomes a firm number",
            ],
            [
              "04",
              "Sign the Agreement",
              "Scope of Work, Payment Schedule, Plan of Action",
              "Issued together for signature",
            ],
            [
              "05",
              "Release M1 and mobilise",
              "15% booking and mobilisation",
              "Site team on the ground within five days",
            ],
          ].map(([code, title, line1, line2]) => (
            <div
              key={code}
              className="grid grid-cols-[35px_1fr] gap-4 border-b border-[var(--stroke)] pb-5"
            >
              <span className="text-[10px] font-semibold text-[var(--sage)]">
                {code}
              </span>

              <div>
                <p className="text-[11px] font-medium">{title}</p>

                <p className="mt-1 text-[8px] text-[var(--muted)]">{line1}</p>

                <p className="mt-1 text-[8px] text-[var(--muted)]">{line2}</p>
              </div>
            </div>
          ))}
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
          PAGE 24 — TALK TO US / ACCEPTANCE
      ====================================================== */}

      <Page>
        <Eyebrow>Talk to us</Eyebrow>

        <div className="border-t border-[var(--gold,#d9af61)] pt-8">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <p className="text-[11px] font-medium">Sagar Chhabra</p>

              <p className="mt-1 text-[8px] text-[var(--muted)]">
                Principle Architect
              </p>

              <p className="mt-3 text-[8px] text-[var(--muted)]">
                Design direction and approvals
              </p>
            </div>

            <div>
              <p className="text-[11px] font-medium">Sarthi Jangra</p>

              <p className="mt-1 text-[8px] text-[var(--muted)]">
                Project Lead
              </p>

              <p className="mt-3 text-[8px] text-[var(--muted)]">
                Your single point of contact
              </p>
            </div>
          </div>

          <div className="mt-10 border-t border-[var(--stroke)] pt-7">
            <p className="text-[11px] font-medium">Rippotai</p>

            <p className="mt-1 text-[8px] text-[var(--muted)]">
              Architecture · Interiors · Turnkey
            </p>

            <p className="mt-1 text-[8px] text-[var(--muted)]">Delhi NCR</p>
          </div>
        </div>

        <div className="mt-12 border-t border-[var(--stroke)] pt-7">
          <Eyebrow>Proposal validity</Eyebrow>

          <p className="text-[9px]">Thirty days from date of issue</p>

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

            <p className="mt-2 text-[8px]">Name · Sagar Chhabra</p>

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
