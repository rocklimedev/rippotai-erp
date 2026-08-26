// src/lib/mockApi.js
// -----------------------------------------------------------------------------
// Stand-in for real endpoints. Every function returns a Promise and resolves
// with the exact shape the UI expects, so swapping these for real `fetch()`
// calls later is a drop-in change — just keep the return shape identical.
// -----------------------------------------------------------------------------

const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

// GET /api/projects/:id
export async function fetchProjectDetail(projectId) {
  await delay();
  return {
    projectName: "Pink Appartment — Interior Fit-out",
    siteAddress: "49 Pink Appartment, Paschim Vihar, New Delhi",
    clientName: "",
    unitType: "3 BHK Apartment",
    carpetArea: 1180,
    builtUpArea: 1420,
    totalArea: 1420,
    bedrooms: 3,
    bathrooms: 3,
    preparedBy: "Sagar Chhabra",
    reviewedBy: "Sarthi Jangra",
    dateOfIssue: new Date().toISOString().slice(0, 10),
    projectType: "Residential",
    workType: "Turnkey execution",
    brief:
      "Complete interior fit-out of a 3 BHK unit — modular kitchen, all wardrobes, false ceiling, flooring, and MEP — delivered turnkey with a single point of accountability from design freeze to handover.",
    constraints:
      "Society lift access permitted only 11am–4pm on weekdays. No structural or load-bearing changes. Existing electrical riser has limited spare load.",
  };
}

// GET /api/projects/:id/scope-of-work
export async function fetchScopeOfWork(projectId) {
  await delay();
  return {
    included: [
      "Site supervision and skilled labour",
      "Material procurement and delivery",
      "All drawings up to GFC stage",
      "Vendor selection and coordination",
      "Debris removal and deep cleaning",
      "Twelve-month workmanship cover",
    ],
    notIncluded: [
      "Society and authority approvals",
      "Structural changes to the building",
      "Electrical load enhancement",
      "Appliances not listed in the BOQ",
      "Curtains, art and styling accessories",
      "GST and statutory levies",
    ],
    optional: [
      "Loose furniture sourcing",
      "Curtains, blinds and sheers",
      "Home automation and smart controls",
      "Profile and cove lighting",
      "Wardrobe internals upgrade",
      "Balcony decking and planters",
      "Appliance supply and installation",
      "Art, decor and styling",
    ],
    disciplines: [
      { name: "Civil & demolition", items: "Removal, cutting and debris disposal · Masonry, plaster and levelling · Door and window openings" },
      { name: "MEP & waterproofing", items: "Concealed wiring and conduits · AC piping, drainage and plumbing · Wet area and terrace treatment" },
      { name: "Flooring & tiling", items: "Floor and wall tiling · Counters, skirting and dado · Grouting and edge finishing" },
      { name: "Ceiling & POP", items: "Framework and boarding · Cove and profile detailing · Punning and surface preparation" },
      { name: "Mill work & joinery", items: "Modular kitchen and wardrobes · Vanities and storage units · Site-fabricated joinery" },
      { name: "Paint & polish", items: "Primer, putty and two coats · Wood polish and veneer finish · Touch-ups at snagging" },
      { name: "Fixtures & fittings", items: "Light fixtures and switches · CP fittings and sanitaryware · Hardware and accessories" },
      { name: "Loose furniture", items: "Sourcing and coordination · Delivery and placement · Optional — if selected" },
    ],
  };
}

// GET /api/projects/:id/plan-of-action
export async function fetchPlanOfAction(projectId) {
  await delay();
  return {
    phases: [
      { code: "01", name: "MEP & Waterproofing", detail: "Waterproofing of wet areas and terraces, AC piping and ducting, concealed wiring and plumbing lines.", parallel: "PARALLEL — OVERALL MATERIAL SELECTION", duration: "30–45 days" },
      { code: "02", name: "Tiling & POP", detail: "Floor and wall tiling, stone and dado work, POP punning, false ceiling framing and cove detailing.", parallel: "PARALLEL — LOOSE FURNITURE FINALISATION", duration: "25–30 days" },
      { code: "03", name: "Mill Work & Joinery", detail: "Modular kitchen, wardrobes, vanities and site-fabricated mill work, with the first coat of paint.", parallel: "INCLUDES — PAINT 1ST COAT", duration: "30–40 days" },
      { code: "04", name: "Fixtures & Fittings", detail: "Light fixtures, electrical fittings and appliances, CP fittings and sanitaryware, hardware and accessories.", parallel: "", duration: "12–15 days" },
      { code: "05", name: "Paint & Polish", detail: "Final coat on all walls and ceilings, polishing of wood work and veneer, touch-ups and edge finishing.", parallel: "", duration: "15–20 days" },
      { code: "06", name: "Snagging", detail: "Joint walkthrough room by room, written defect list, closure of every recorded item.", parallel: "", duration: "7–10 days" },
      { code: "07", name: "Handover", detail: "Deep clean, final walkthrough, keys, warranty cards and as-built service drawings.", parallel: "", duration: "3–5 days" },
    ],
    overallProgramme: "4–5 months",
    note: "Durations run from mobilisation of that phase and assume decisions within forty-eight hours and payments released on time. Statutory construction restrictions and material lead times extend the programme proportionately.",
  };
}

// GET /api/projects/:id/budget-estimate
export async function fetchBudgetEstimate(projectId) {
  await delay();
  return {
    lineItems: [
      { head: "Civil & demolition", description: "Removal, masonry, plaster and making good", amount: 185000 },
      { head: "MEP & waterproofing", description: "Electrical, plumbing, AC and wet area treatment", amount: 420000 },
      { head: "Flooring & tiling", description: "Floor, wall, counters and skirting", amount: 610000 },
      { head: "Ceiling & POP", description: "Framework, boarding and cove detailing", amount: 240000 },
      { head: "Mill work & joinery", description: "Kitchen, wardrobes, vanities and storage", amount: 1450000 },
      { head: "Paint & polish", description: "Walls, ceilings, wood polish and veneer", amount: 275000 },
      { head: "Fixtures & fittings", description: "Lighting, CP fittings, sanitaryware and hardware", amount: 380000 },
      { head: "Loose furniture & decor", description: "Optional — included only if ticked in scope", amount: 0 },
      { head: "Site management & supervision", description: "Labour control, logistics and quality checks", amount: 210000 },
    ],
    contingencyPct: 5,
    currency: "₹",
    assumes: [
      "Finish level as discussed at the site visit",
      "Standard ceiling height, no structural change",
      "Material lead times within four weeks",
      "Uninterrupted site access and services",
      "Decisions returned within forty-eight hours",
    ],
    excludes: [
      "GST and statutory levies",
      "Society charges, permissions and deposits",
      "Appliances and loose furniture unless ticked",
      "Client-supplied material and its handling",
      "Variations raised after the BOQ is frozen",
    ],
  };
}

// GET /api/projects/:id/payment-schedule
export async function fetchPaymentSchedule(projectId) {
  await delay();
  return {
    milestones: [
      { code: "M1", name: "Booking & mobilisation", trigger: "On signing, before site start", share: 15 },
      { code: "M2", name: "MEP & waterproofing", trigger: "Before Phase 01 mobilises", share: 20 },
      { code: "M3", name: "Tiling & POP", trigger: "Before Phase 02 mobilises", share: 20 },
      { code: "M4", name: "Mill work & joinery", trigger: "Before Phase 03 mobilises", share: 20 },
      { code: "M5", name: "Fixtures & fittings", trigger: "Before Phase 04 mobilises", share: 10 },
      { code: "M6", name: "Paint & polish", trigger: "Before Phase 05 mobilises", share: 10 },
      { code: "M7", name: "Snagging & handover", trigger: "On closure of the signed snag list", share: 5 },
    ],
    keyTerms: [
      { label: "Invoicing and due date", value: "Payment due within three working days of invoice" },
      { label: "Mode of payment", value: "NEFT, RTGS or cheque to the Rippotai account only. No cash, and no payment to anyone at site." },
      { label: "Taxes", value: "All figures exclusive of GST" },
      { label: "Delay in release", value: "Beyond seven days, work may pause. Timeline extends day for day." },
      { label: "Variations", value: "Quoted in writing, billed 100% in advance" },
      { label: "Retention", value: "Final 5% held until the snag list is signed" },
      { label: "Title of materials", value: "Passes to the Client on full milestone payment" },
      { label: "Jurisdiction", value: "Settled amicably, failing which courts at Delhi" },
    ],
  };
}

// GET /api/projects/:id/next-steps  (defaults — overwritten by any saved state)
export async function fetchNextSteps(projectId) {
  await delay(200);
  return {
    steps: [
      { id: "review", title: "Review this proposal", detail: "Take a week. Mark anything unclear — we will walk it through with you.", done: false },
      { id: "confirm", title: "Confirm the scope", detail: "Tick the engagement and optional items — we revise the BOQ against your ticks.", done: false },
      { id: "freeze", title: "Freeze cost at Gate 02", detail: "BOQ priced line by line and signed — the estimate becomes a firm number.", done: false },
      { id: "sign", title: "Sign the Agreement", detail: "Scope of Work, Payment Schedule, Plan of Action issued together for signature.", done: false },
      { id: "mobilise", title: "Release M1 and mobilise", detail: "15% booking and mobilisation — site team on the ground within five days.", done: false },
    ],
    checklist: [
      { id: "sow", label: "Signed Scope of Work and Agreement", done: false },
      { id: "payment", label: "Booking and mobilisation payment", done: false },
      { id: "society", label: "Society permission for work and material lift", done: false },
      { id: "access", label: "Access, keys and a point of contact at site", done: false },
      { id: "utilities", label: "Water and power connection at the unit", done: false },
      { id: "material", label: "Any client-supplied material schedule", done: false },
    ],
  };
}

// POST /api/projects/:id/next-steps  — persists whatever the user ticked
export async function saveNextSteps(projectId, payload) {
  await delay(300);
  console.info("[mockApi] saved next steps for", projectId, payload);
  return { ok: true, savedAt: new Date().toISOString() };
}

// Fetches every API-backed section in parallel — used on load.
export async function fetchFullProposal(projectId) {
  const [projectDetail, scopeOfWork, planOfAction, budgetEstimate, paymentSchedule, nextSteps] =
    await Promise.all([
      fetchProjectDetail(projectId),
      fetchScopeOfWork(projectId),
      fetchPlanOfAction(projectId),
      fetchBudgetEstimate(projectId),
      fetchPaymentSchedule(projectId),
      fetchNextSteps(projectId),
    ]);
  return { projectDetail, scopeOfWork, planOfAction, budgetEstimate, paymentSchedule, nextSteps };
}
