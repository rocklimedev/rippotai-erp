export const UNITS = [
  "Sq.ft.",
  "Sq.m.",
  "Rft.",
  "Nos.",
  "Set",
  "Lump",
  "Kg",
  "Cu.ft.",
  "Cu.m.",
  "Ltr.",
  "Bag",
  "Roll",
];

export const STATUS_META = {
  draft: { label: "Draft", bg: "#B5C4B6", fg: "#6B7B7C" },
  in_progress: { label: "In Progress", bg: "#EAEEF0", fg: "#1F453B" },
  awaiting_approval: {
    label: "Awaiting Approval",
    bg: "#EAEEF0",
    fg: "#1F453B",
  },
  returned: { label: "Returned", bg: "#EAEEF0", fg: "#1F453B" },
  approved: { label: "Approved", bg: "#EAEEF0", fg: "#1F453B" },
  final: { label: "Final", bg: "#EAEEF0", fg: "#1F453B" },
  archived: { label: "Archived", bg: "#B5C4B6", fg: "#6B7B7C" },
};

export const LOCKED_STATUSES = ["approved", "final", "awaiting_approval"];

export const isBoqDisabled = (boq) =>
  !!boq?.locked || LOCKED_STATUSES.includes(boq?.status);
