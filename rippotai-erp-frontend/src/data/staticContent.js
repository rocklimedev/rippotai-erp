// src/data/staticContent.js
// Everything here is brand boilerplate that does not change project to project.
// It is intentionally NOT wired to an API — edit it directly when the brand copy changes.

export const BRAND = {
  name: "Rippotai",
  tagline: "Architecture · Interiors · Turnkey",
  location: "Delhi NCR",
};

export const COVER = {
  title: "Business Proposal",
  subtitle: "Interior Design & Turnkey Execution",
};

export const CONTENTS = [
  {
    no: "01",
    title: "Welcome note",
    desc: "Why we are the right team for this",
  },
  {
    no: "02",
    title: "Project detail",
    desc: "The unit, the brief and the engagement",
  },
  {
    no: "03",
    title: "Scope of work",
    desc: "What is included, and what is not",
  },
  {
    no: "04",
    title: "How we work",
    desc: "Our process, from first call to handover",
  },
  {
    no: "05",
    title: "Plan of action",
    desc: "Seven phases across four to five months",
  },
  {
    no: "06",
    title: "Budget estimate",
    desc: "Indicative cost, discipline by discipline",
  },
  {
    no: "07",
    title: "Payment schedule",
    desc: "Seven milestones against stages of work",
  },
  { no: "08", title: "Next steps", desc: "What happens after you say yes" },
];

export const WELCOME_NOTE = {
  body: [
    "This proposal sets out everything you need to make a decision — what we will build, how we will run the site, how long it takes, what it costs, and when each payment falls due. Nothing is held back for later.",
    "We work as a single accountable team. One Project Lead owns your project end to end, one BOQ prices every item line by line, and one schedule ties payment to visible stages of work rather than to calendar dates. You will never be asked to release money for something you cannot see.",
    "Rippotai is the architecture and turnkey arm of SP Syndicate, working across Delhi NCR on residential and commercial interiors. We design it, we cost it honestly, and we build it ourselves — which means no gap between the drawing you approve and the room you walk into.",
  ],
  covers: [
    "Project detail and engagement type",
    "Scope of work, discipline by discipline",
    "Our process and where you sign off",
    "Phase plan and timeline",
  ],
  coversAnd: [
    "Indicative budget estimate",
    "Payment milestones and terms",
    "What happens next, and when",
    "Who to speak to at every stage",
  ],
  signatoryName: "Sagar Chhabra",
  signatoryTitle: "Principle Architect · Rippotai",
};

export const HOW_WE_WORK = {
  principles: [
    {
      title: "One point of contact",
      points: [
        "You speak to the Project Lead, start to finish",
        "Decisions confirmed in writing, on one channel",
      ],
    },
    {
      title: "Nothing hidden in the BOQ",
      points: ["Every item priced line by line", "No lump sums, no allowances"],
    },
    {
      title: "Sign-off before spend",
      points: [
        "Nothing ordered before you approve it",
        "Changes quoted in writing, first",
      ],
    },
    {
      title: "Payment follows progress",
      points: [
        "Milestones release against stages of work",
        "Never against calendar dates",
      ],
    },
  ],
  team: [
    {
      role: "Principle Architect",
      name: "Sagar Chhabra",
      desc: "Design direction and final approvals",
    },
    {
      role: "Project Lead",
      name: "Sarthi Jangra",
      desc: "Your single point of contact",
    },
    {
      role: "Site Supervisor",
      name: "",
      desc: "On site every working day · Labour control and quality checks",
    },
    {
      role: "Admin Coordinator",
      name: "",
      desc: "Billing, documents and scheduling · Material tracking and warranties",
    },
  ],
  gates: [
    {
      code: "G1",
      title: "Concept",
      desc: "Layout, look and material direction",
    },
    { code: "G2", title: "BOQ", desc: "Cost, scope and quantities frozen" },
    { code: "G3", title: "GFC", desc: "Working drawings and material samples" },
    { code: "G4", title: "Stage", desc: "Each of the seven execution phases" },
    { code: "G5", title: "Handover", desc: "Snag list closed and signed" },
  ],
  cadence: [
    { freq: "Daily", what: "Site photo report on WhatsApp" },
    { freq: "Weekly", what: "Progress walkthrough with the Project Lead" },
    { freq: "Monthly", what: "Stage note, billing and revised timeline" },
    { freq: "At each gate", what: "Written approval request with drawings" },
  ],
};

export const CONTACT = {
  principal: {
    name: "Sagar Chhabra",
    role: "Principle Architect",
    desc: "Design direction and approvals",
  },
  lead: {
    name: "Sarthi Jangra",
    role: "Project Lead",
    desc: "Your single point of contact",
  },
  validityDays: 30,
  acceptanceLine:
    "The Client confirms having read this proposal and accepts the scope, programme, indicative budget and payment milestones set out in it, subject to the BOQ being frozen and the Agreement signed.",
};
