export const PAYMENT_SCHEDULE_SECTIONS = [
  { title: "Overview", type: "overview" },
  { title: "Milestones", type: "milestones" },
];

/**
 * Default milestone set, taken from the standard Rippotai payment
 * schedule template (booking through handover). Used by the
 * "Load Standard Milestones" quick-fill action on the Milestones
 * section — teams can still edit, reorder, add or remove any of them
 * before saving.
 */
export const STANDARD_MILESTONE_TEMPLATE = [
  {
    milestone_code: "M1",
    title: "Booking & Mobilisation",
    description:
      "Confirmation of the project and mobilisation of the site team. Covers site protection, initial procurement of core materials, and setting up of storage and access.",
    release_trigger: "Due on signing — before site start",
    percentage: 15,
  },
  {
    milestone_code: "M2",
    title: "MEP & Waterproofing",
    description:
      "Waterproofing of wet areas and terraces, air-conditioning piping and ducting, concealed wiring and conduiting, and plumbing lines.",
    release_trigger: "Parallel — overall material selection",
    percentage: 20,
  },
  {
    milestone_code: "M3",
    title: "Tiling & POP",
    description:
      "Floor and wall tiling, stone and dado work, POP punning, false ceiling framing and cove detailing as per the approved ceiling layout.",
    release_trigger: "Parallel — loose furniture finalisation",
    percentage: 20,
  },
  {
    milestone_code: "M4",
    title: "Mill Work & Joinery",
    description:
      "Modular kitchen, wardrobes, vanities and site-fabricated mill work as per approved drawings and finish samples, with the first coat of paint.",
    release_trigger: "Includes — paint 1st coat",
    percentage: 20,
  },
  {
    milestone_code: "M5",
    title: "Fixtures & Fittings",
    description:
      "Light fixtures, electrical fittings and appliances, CP fittings and sanitaryware, hardware and accessories, with testing and commissioning.",
    release_trigger: "",
    percentage: 10,
  },
  {
    milestone_code: "M6",
    title: "Paint & Polish",
    description:
      "Final coat of paint on all walls and ceilings, polishing of wood work and veneer surfaces, touch-ups and finishing of edges and joints.",
    release_trigger: "",
    percentage: 10,
  },
  {
    milestone_code: "M7",
    title: "Snagging & Handover",
    description:
      "Retained until the snag list is jointly signed off. Released against closure of every recorded item, deep cleaning, final walkthrough and handover of keys, warranty cards and as-built drawings.",
    release_trigger: "Site is not handed over until snags are closed",
    percentage: 5,
  },
];
