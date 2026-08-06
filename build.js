const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  BorderStyle,
  Numbering,
  LevelFormat,
  convertInchesToTwip,
  TableOfContents,
  PageBreak,
  VerticalAlign,
} = require("docx");
const fs = require("fs");

// ---------- palette ----------
const INK = "1A1917";
const MUTE = "55524B";
const RULE = "1A1917";
const ACCENT = "4A6FA5";
const BAND = "F5F3EE";
const HEAD_BAND = "1A1917";

// ---------- helpers ----------
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    border: {
      bottom: { color: RULE, space: 6, style: BorderStyle.SINGLE, size: 8 },
    },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 30,
        color: INK,
        allCaps: true,
        font: "Arial",
      }),
    ],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
    children: [
      new TextRun({ text, bold: true, size: 24, color: ACCENT, font: "Arial" }),
    ],
  });
}
function bullet(text, opts = {}) {
  return new Paragraph({
    numbering: { reference: "feature-bullets", level: opts.level || 0 },
    spacing: { after: 60 },
    children: [
      opts.bold
        ? new TextRun({
            text: opts.bold,
            bold: true,
            size: 21,
            color: INK,
            font: "Arial",
          })
        : null,
      opts.bold
        ? new TextRun({ text: " — ", size: 21, color: MUTE, font: "Arial" })
        : null,
      new TextRun({
        text,
        size: 21,
        color: opts.bold ? MUTE : INK,
        font: "Arial",
      }),
    ].filter(Boolean),
  });
}
function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 160 },
    children: [
      new TextRun({
        text,
        size: opts.size || 21,
        color: opts.color || MUTE,
        italics: opts.italics,
        font: "Arial",
      }),
    ],
  });
}
function moduleHeader(code, title, status) {
  return new Table({
    width: { size: 9350, type: WidthType.DXA },
    columnWidths: [1400, 6350, 1600],
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1400, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: HEAD_BAND },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: code,
                    bold: true,
                    size: 20,
                    color: "FBFAF8",
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 6350, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: BAND },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 100, bottom: 100, left: 160, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 22,
                    color: INK,
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 1600, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: BAND },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: status,
                    size: 17,
                    color: MUTE,
                    italics: true,
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function spacer(h = 160) {
  return new Paragraph({ spacing: { after: h }, children: [] });
}

// ---------- module content ----------
// Each module: code, title, status, intro, groups: [{ title(optional), items: [ {b, t} ] }]
const modules = [
  {
    code: "01",
    title: "CRM & Lead Management",
    status: "Live",
    intro:
      "Captures every enquiry from first contact through to a signed contract, and hands off cleanly into Projects once a lead converts.",
    groups: [
      {
        items: [
          {
            b: "Lead capture",
            t: "structured intake covering contact details, project type (Residential / Commercial / Institutional), location, size, budget, timeline and source.",
          },
          {
            b: "Pipeline stages",
            t: "Capture → Qualification → Discovery → Proposal → Negotiation → Contract → Handoff → Nurture / Lost, with automatic days-in-stage tracking.",
          },
          {
            b: "Lead scoring & tagging",
            t: "Hot / Warm / Cold tags and colour flags for quick triage across the pipeline board.",
          },
          {
            b: "Stuck-lead detection",
            t: "automatic or manual flagging of leads that have stalled in a stage beyond the expected window.",
          },
          {
            b: "Follow-up scheduling",
            t: "per-lead follow-up dates surfaced on the owner's calendar and dashboard.",
          },
          {
            b: "Proposal tracking",
            t: "proposed amount, proposed timeline and remarks captured against each lead.",
          },
          {
            b: "Notes & activity timeline",
            t: "threaded notes and a full activity log per lead, visible to the whole sales team.",
          },
          {
            b: "Document checklist",
            t: "brief, proposal and contract document status tracked per lead before conversion.",
          },
          {
            b: "Lead → Project conversion",
            t: "one-click handoff that seeds a new project record from a won lead.",
          },
        ],
      },
    ],
  },
  {
    code: "02",
    title: "Project Management",
    status: "Live",
    intro:
      "The central record for every job — one project ties together the client, the process timeline, every document, drawing, quotation and site event.",
    groups: [
      {
        items: [
          {
            b: "Project profile",
            t: "client link, project type, site location, priority, description and expected completion date.",
          },
          {
            b: "Status tracking",
            t: "Active / On Hold / Completed / Inactive, with soft-delete and archive trails.",
          },
          {
            b: "Progress tracking",
            t: "live progress percentage, current phase, timeline status (on track / at risk / delayed) and schedule variance.",
          },
          {
            b: "Next milestone indicator",
            t: "always-visible pointer to what's due next on the project.",
          },
          {
            b: "Client directory",
            t: "linked client records with contact details, independent of the project itself.",
          },
          {
            b: "Project types library",
            t: "configurable catalogue of project types used for reporting and templating.",
          },
          {
            b: "Milestones",
            t: "weighted, ordered milestones with planned start, due date, assignee and status, rolling up into overall project progress.",
          },
          {
            b: "Task board",
            t: "priority-ranked task list per project with due-date buckets and workload estimates.",
          },
        ],
      },
    ],
  },
  {
    code: "03",
    title: "Process Workflow Engine — Master Process Brain",
    status: "Planned",
    intro:
      "Encodes the full Brief → Handover methodology as configurable phases, steps and gates, and tracks every live project against it.",
    groups: [
      {
        items: [
          {
            b: "Phase & step library",
            t: "the complete process — Brief, Survey, Pre-Design, Payment, Design, Tender Drawings, Working Drawings, Execution, Snag & Handover — plus the parallel Vendor & Trades and Material & Procurement tracks.",
          },
          {
            b: "Gate tracking",
            t: "hard gates (Token Received, Concept 02 Finalised, Design Closed, Tender Drawings Finalised, Working Drawings Issued — GFC, Final Client Sign-off, etc.) logged with timestamp and approver.",
          },
          {
            b: "Team responsibility mapping",
            t: "every step tagged with the owning team(s) — Architect, Supervisor, Admin, Accounts, Planning, Procurement, Client, and the 12 contractor trades.",
          },
          {
            b: "Deliverable catalogue",
            t: "the named deliverable(s) expected from every step, generating a live document register per project.",
          },
          {
            b: "Per-project progress tracking",
            t: "phase-level and step-level status (not started / in progress / completed / blocked), assignee and sign-off.",
          },
          {
            b: "Process timeline visualisation",
            t: "Gantt-style view of a project plotted against the full phase ruler, with gate markers.",
          },
          {
            b: "Continuity roles",
            t: "tracking of roles that run end-to-end (Architect, Site Supervisor, Client) versus roles that open and close at specific gates.",
          },
        ],
      },
    ],
  },
  {
    code: "04",
    title: "Estimation & Quotation",
    status: "Live / Extending",
    intro:
      "One conversion rule for both trades and materials: every rate or vendor quote stays an ESTIMATE until it is approved, at which point it converts into a contractual QUOTATION.",
    groups: [
      {
        items: [
          {
            b: "Two estimate paths",
            t: "Path A (rates only, built against the Architect's quantities) and Path B (vendor's own quote reworked line-by-line into the RIPPOTAI template).",
          },
          {
            b: "Estimate approval workflow",
            t: "draft → submitted → approved / rejected, with the approved estimate converting automatically into a quotation.",
          },
          {
            b: "Quotation lifecycle",
            t: "draft → submitted → approved → returned-for-editing → declined → cancelled, with full version history and snapshots.",
          },
          {
            b: "Multi-vendor comparison",
            t: "side-by-side comparison of quotations against the same scope, with comparison notes and a selected-winner flag.",
          },
          {
            b: "Line-item detail",
            t: "particulars, unit, quantity, rate and amount per item, with remarks.",
          },
          {
            b: "Discounts, tax & additional charges",
            t: "global discount (fixed or percentage), tax percentage and additional charges rolled into the total.",
          },
          {
            b: "Quotation versioning",
            t: "every revision snapshotted and retrievable, with remarks on what changed.",
          },
          {
            b: "Notifications",
            t: "automatic alerts to reviewers and submitters on submission, approval, return or decline.",
          },
        ],
      },
    ],
  },
  {
    code: "05",
    title: "BOQ (Bill of Quantities) Management",
    status: "Live",
    intro:
      "Owned by Accounts & Finance — only possible once tender drawings are final and trade quotations are approved.",
    groups: [
      {
        items: [
          {
            b: "BOQ builder",
            t: "categorised, ordered line items with quantity, rate, calculation type (measured / lump-sum) and computed amount.",
          },
          {
            b: "BOQ templates",
            t: "Essential / Premium / Luxury tier templates that can be cloned into a new project BOQ.",
          },
          {
            b: "Versioning",
            t: "named, dated BOQ versions with full change history.",
          },
          {
            b: "Approval & locking",
            t: "draft → pending approval → approved / rejected, with a lock flag to freeze an approved BOQ.",
          },
          {
            b: "Cost breakdown",
            t: "design, execution and supervisor amounts tracked separately, plus a configurable miscellaneous percentage.",
          },
          {
            b: "Activity trail",
            t: "every item add, edit, move, rate change and approval logged against the BOQ.",
          },
          {
            b: "Work-package split",
            t: "BOQ broken into a work package per contractor trade, each with its own schedule and payment milestones.",
          },
        ],
      },
    ],
  },
  {
    code: "06",
    title: "Vendor & Contractor Management",
    status: "Live / Extending",
    intro:
      "Twelve contractor trades — Civil, Electrical, Plumbing, Mechanical/HVAC, Metal, Tiling, False Ceiling, Mill Work, Painting, Glass & Window, Specialist, Landscape — searched, tendered, and finalised into a per-project lineup.",
    groups: [
      {
        items: [
          {
            b: "Vendor directory",
            t: "categorised by trade / business type, with contact details, address and status (active / inactive / blacklisted / blocked).",
          },
          {
            b: "Vendor search & shortlisting",
            t: "opens as soon as the layout is finalised, before any commercial commitment.",
          },
          {
            b: "Site visit & measurement scheduling",
            t: "assigned and aligned centrally, with a recorded vendor site measurement sheet per visit.",
          },
          {
            b: "Tender gate enforcement",
            t: "no vendor can be finalised, no quote is valid, and no BOQ can exist until tender drawings are issued.",
          },
          {
            b: "Contractor lineup",
            t: "final trade-to-vendor assignment per project, with mobilisation status.",
          },
          {
            b: "Vendor rate cards",
            t: "reusable rate references per vendor for fast Path-A estimating.",
          },
        ],
      },
    ],
  },
  {
    code: "07",
    title: "Material & Procurement",
    status: "Planned",
    intro:
      "Opens the moment Concept Design 02 is finalised and does not close until handover — sourcing, selection, purchase, staged delivery and on-site inventory.",
    groups: [
      {
        items: [
          {
            b: "Material requirements",
            t: "captured directly from the design team — selections, budget, style and functional needs.",
          },
          {
            b: "Sourcing & sample boards",
            t: "sample boards and material rate sheets tracked per requirement, with approval status.",
          },
          {
            b: "Material estimate → quotation",
            t: "identical estimate → approval → quotation conversion rule as trades.",
          },
          {
            b: "Purchase orders",
            t: "issued against approved material quotations, with line-item tracking of delivered vs. ordered quantity.",
          },
          {
            b: "Staged deliveries",
            t: "delivery challans logged against each purchase order and tagged to the site stage that needs them.",
          },
          {
            b: "Site inventory register",
            t: "live on-site stock levels with inward / outward / adjustment / damage transactions, reconciled against purchase orders.",
          },
        ],
      },
    ],
  },
  {
    code: "08",
    title: "Drawings & Documents",
    status: "Live",
    intro:
      "Two drawing sets, two purposes — tender drawings exist so vendors can price; working drawings are the construction set that goes Good-For-Construction, organised by the contractor team that builds from each group.",
    groups: [
      {
        items: [
          {
            b: "Drawing register",
            t: "drawing number, discipline, revision, issue date, issue purpose and status, per project.",
          },
          {
            b: "Document library",
            t: "categorised documents with version, status, visibility (internal / client-facing) and lock control.",
          },
          {
            b: "Document attachments",
            t: "multi-file attachments per document with independent metadata.",
          },
          {
            b: "Site recce records",
            t: "structured site survey capturing accessibility, utilities, structural condition, plumbing/electrical readiness and more, per floor and per room.",
          },
          {
            b: "Site layout & image attachments",
            t: "floor-plan layouts and site photos linked to the recce and to specific floors.",
          },
        ],
      },
    ],
  },
  {
    code: "09",
    title: "Site Operations — Quality, Reporting & Mockups",
    status: "Planned",
    intro:
      "The Site Supervisor's core role: every phase is checked and signed off against a standard checklist before the next trade is allowed to start.",
    groups: [
      {
        items: [
          {
            b: "QC checklist templates",
            t: "reusable, trade-specific checklists that every phase must pass before hand-off to the next trade.",
          },
          {
            b: "Phase QC sign-off",
            t: "pass / fail / rework recorded per phase, per trade, with the checking user and timestamp.",
          },
          {
            b: "Daily site reports",
            t: "one report a day — weather, manpower, work completed and issues — shared with the whole team.",
          },
          {
            b: "Site visit log",
            t: "every visit (Supervisor daily, Architect on a fixed schedule, vendor, contractor, client) centrally assigned and logged.",
          },
          {
            b: "Site mockups",
            t: "full-size mockups proposed, reviewed and approved before a finish is rolled out at volume.",
          },
          {
            b: "Design clarifications (RFIs)",
            t: "site queries raised, routed to the Architect, and closed out with a recorded response.",
          },
        ],
      },
    ],
  },
  {
    code: "10",
    title: "Execution Tracking",
    status: "Planned",
    intro:
      "Every contractor trade tracked against its own completion milestones — civil, MEP percentages embedded at fixed stages, and fit-out trades overlapping by room.",
    groups: [
      {
        items: [
          {
            b: "Trade-level progress",
            t: "per-trade percentage complete (e.g. Electrical 20 → 60 → 95 → 100%, Plumbing 20 → 40 → 100%, Mechanical 20 → 60 → 100%).",
          },
          {
            b: "Work package scheduling",
            t: "each contractor's package tracked against its own start / end dates and payment milestones.",
          },
          {
            b: "Continuous quality gate",
            t: "QC sign-off enforced before the next trade in the sequence is released to start.",
          },
        ],
      },
    ],
  },
  {
    code: "11",
    title: "Payments & Finance",
    status: "Planned",
    intro:
      "Every document, payment, estimate, quotation, BOQ and budget consolidated under Accounts & Finance, from the brief-stage budget sheet to the consolidated bills at handover.",
    groups: [
      {
        items: [
          {
            b: "Payment schedules",
            t: "per-project schedule of milestone-based payments tied to process gates (token, design close, phase completions).",
          },
          {
            b: "Payment milestones",
            t: "amount or percentage-of-total, due date, and status (pending / invoiced / received / overdue / waived).",
          },
          {
            b: "Payment recording",
            t: "token payments, phase payments and vendor payments logged with mode, reference number and supporting document.",
          },
          {
            b: "Consolidated billing at handover",
            t: "the commercial file closed at the same moment the physical handover happens.",
          },
        ],
      },
    ],
  },
  {
    code: "12",
    title: "Snag List & Handover",
    status: "Planned",
    intro:
      "The last gate belongs to the client — a trade-by-trade snag walkthrough closed item by item, then a clean handover pack.",
    groups: [
      {
        items: [
          {
            b: "Snag list & walkthrough",
            t: "structured snag capture by location and trade, with photo evidence.",
          },
          {
            b: "Rectification tracking",
            t: "open → in progress → rectified → verified, assigned back to the owning contractor.",
          },
          {
            b: "Final client sign-off",
            t: "the terminal gate of the whole process, recorded against the project.",
          },
          {
            b: "Handover pack",
            t: "warranty pack, as-built drawing set, care & maintenance notes and consolidated bills issued together.",
          },
        ],
      },
    ],
  },
  {
    code: "13",
    title: "Calendar & Tasks",
    status: "Live",
    intro:
      "A single shared calendar spanning client meetings, internal meetings, vendor calls, site visits, milestones and quotation deadlines.",
    groups: [
      {
        items: [
          {
            b: "Unified calendar",
            t: "task, client meeting, internal meeting, vendor call, presentation, note, timeline, milestone-due, quotation-deadline, site visit, handover and personal event types.",
          },
          {
            b: "Project-linked events",
            t: "every event can be tied back to its project for full context.",
          },
          {
            b: "Attendee tracking",
            t: "multi-attendee events with per-user visibility.",
          },
          {
            b: "Personal task board",
            t: "priority, due-bucket, ordering and workload-hour estimates per task, per user.",
          },
        ],
      },
    ],
  },
  {
    code: "14",
    title: "Notifications & Activity Log",
    status: "Live",
    intro:
      "Nothing changes silently — every meaningful action is logged and, where relevant, notified to the right person.",
    groups: [
      {
        items: [
          {
            b: "In-app notifications",
            t: "quotation submitted / approved / returned / declined, with read / unread tracking.",
          },
          {
            b: "System-wide activity log",
            t: "every login, create, update, submit, approve, return, decline and delete action recorded with actor, IP address and device.",
          },
          {
            b: "Entity-level audit trail",
            t: "BOQ, quotation and project changes independently logged for compliance and dispute resolution.",
          },
        ],
      },
    ],
  },
  {
    code: "15",
    title: "Users, Roles & Permissions",
    status: "Live",
    intro:
      "Fine-grained, resource-and-action based permissions assigned through named roles.",
    groups: [
      {
        items: [
          {
            b: "User accounts",
            t: "profile, job title, avatar, phone and activation status, with full login/session tracking.",
          },
          {
            b: "Role-based access control",
            t: "named roles mapped to granular resource + action permissions.",
          },
          {
            b: "Digital signatures",
            t: "stored per-user signature files for use on approvals and issued documents.",
          },
          {
            b: "Session & token management",
            t: "refresh and session tokens with device info, IP tracking and revocation.",
          },
          {
            b: "Email verification & password reset",
            t: "secure, time-boxed verification tokens.",
          },
        ],
      },
    ],
  },
  {
    code: "16",
    title: "Dashboards & Personalisation",
    status: "Live",
    intro: "Each user sees the system through a dashboard they control.",
    groups: [
      {
        items: [
          {
            b: "Configurable dashboard layouts",
            t: "per-user, per-app widget layout with the ability to hide unused widgets.",
          },
          {
            b: "Role-aware views",
            t: "dashboard content adapts to what a given role is responsible for — sales pipeline for CRM users, site QC for supervisors, approvals for finance.",
          },
        ],
      },
    ],
  },
  {
    code: "17",
    title: "Settings & Administration",
    status: "Live",
    intro:
      "Central configuration so the system reflects how RIPPOTAI actually runs.",
    groups: [
      {
        items: [
          {
            b: "Global settings",
            t: "key/value configuration store for system-wide behaviour.",
          },
          {
            b: "Master data management",
            t: "units, library items & categories, project types, vendor categories & business types, trade/team master and process phase library, all editable without code changes.",
          },
        ],
      },
    ],
  },
];

// ---------- build children ----------
const children = [];

// Cover page
children.push(
  new Paragraph({ spacing: { before: 2400 }, children: [] }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    border: {
      bottom: { color: RULE, space: 10, style: BorderStyle.SINGLE, size: 10 },
    },
    spacing: { after: 200 },
    children: [
      new TextRun({
        text: "RIPPOTAI",
        bold: true,
        size: 72,
        color: INK,
        font: "Arial",
      }),
    ],
  }),
  new Paragraph({
    spacing: { after: 600 },
    children: [
      new TextRun({
        text: "INTERIOR & ARCHITECTURE  ·  ERP PLATFORM",
        size: 26,
        color: MUTE,
        font: "Arial",
        characterSpacing: 20,
      }),
    ],
  }),
  new Paragraph({
    spacing: { before: 1600, after: 80 },
    children: [
      new TextRun({
        text: "SYSTEM FEATURE LIST",
        bold: true,
        size: 40,
        color: ACCENT,
        font: "Arial",
      }),
    ],
  }),
  new Paragraph({
    spacing: { after: 40 },
    children: [
      new TextRun({
        text: "Complete inventory of features across the platform — live and planned — from lead capture through to project handover.",
        size: 22,
        color: MUTE,
        italics: true,
        font: "Arial",
      }),
    ],
  }),
  new Paragraph({
    spacing: { before: 1200 },
    children: [
      new TextRun({
        text: "Prepared for internal planning use.",
        size: 19,
        color: MUTE,
        font: "Arial",
      }),
    ],
  }),
  new Paragraph({ children: [new PageBreak()] }),
);

// Contents (manual index — reliable across viewers without a field-update pass)
children.push(h1("Contents"));
modules.forEach((m) => {
  children.push(
    new Paragraph({
      spacing: { after: 90 },
      children: [
        new TextRun({
          text: `${m.code}   `,
          bold: true,
          size: 21,
          color: ACCENT,
          font: "Arial",
        }),
        new TextRun({ text: m.title, size: 21, color: INK, font: "Arial" }),
      ],
    }),
  );
});
children.push(new Paragraph({ children: [new PageBreak()] }));

// Intro section
children.push(
  h1("Overview"),
  para(
    "This document lists every feature planned across the RIPPOTAI ERP platform, organised into the seventeen functional modules that make up the system. Each module maps directly onto a stage or supporting function of the RIPPOTAI Master Process Brain — the Brief → Handover workflow that governs how a project actually moves through the studio.",
    { after: 160 },
  ),
  para(
    "Modules marked Live are implemented in the current schema. Modules marked Planned or Live / Extending are the next build phases layered on top of the existing core tables, without altering them.",
    { after: 300 },
  ),
);

// Legend
children.push(
  new Table({
    width: { size: 9350, type: WidthType.DXA },
    columnWidths: [3116, 3116, 3118],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "E2DFD8" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2DFD8" },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E2DFD8" },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: ["Live", "Live / Extending", "Planned"].map(
          (label) =>
            new TableCell({
              width: { size: 3116, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label,
                      bold: true,
                      size: 18,
                      color: INK,
                      font: "Arial",
                    }),
                  ],
                }),
              ],
            }),
        ),
      }),
      new TableRow({
        children: [
          "Built and in current schema.",
          "Built, being extended with new tables in this phase.",
          "New module introduced in this phase.",
        ].map(
          (label) =>
            new TableCell({
              width: { size: 3116, type: WidthType.DXA },
              margins: { top: 40, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label,
                      size: 17,
                      color: MUTE,
                      font: "Arial",
                    }),
                  ],
                }),
              ],
            }),
        ),
      }),
    ],
  }),
  new Paragraph({ children: [new PageBreak()] }),
);

// Modules
modules.forEach((m, idx) => {
  children.push(h1(`${m.code}  ·  ${m.title}`));
  children.push(moduleHeader(m.code, m.title, m.status));
  children.push(spacer(120));
  children.push(para(m.intro, { italics: true, after: 200, color: MUTE }));
  m.groups.forEach((g) => {
    if (g.title) children.push(h2(g.title));
    g.items.forEach((it) => children.push(bullet(it.t, { bold: it.b })));
  });
  if (idx < modules.length - 1) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }
});

// ---------- document ----------
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "feature-bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "—",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 260 } } },
          },
        ],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 21, color: INK } },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 }, // US Letter
          margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
        },
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(
    "/mnt/user-data/outputs/RIPPOTAI_ERP_Feature_List.docx",
    buf,
  );
  console.log("written");
});
