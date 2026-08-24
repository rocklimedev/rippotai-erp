// =========================================================
// ENUM-BACKED OPTION SETS
// -----------------------------------------------------------
// Mirrors the backend enums 1:1. `value` is sent to the API
// exactly as-is (matches the enum's string value), `label` is
// what the user sees.
// =========================================================

const SITE_AREA_UNIT_OPTIONS = [
  { value: "SQ_FT", label: "Sq. Ft." },
  { value: "GAJ", label: "Gaj" },
  { value: "OTHER", label: "Other" },
];

const SITE_TYPE_OPTIONS = [
  { value: "FLAT", label: "Flat" },
  { value: "FLOOR", label: "Floor" },
  { value: "KOTHI", label: "Kothi" },
  { value: "RAW", label: "Raw / Shell" },
  { value: "OTHER", label: "Other" },
];

const SITE_CONDITION_OPTIONS = [
  { value: "OCCUPIED", label: "Occupied" },
  { value: "UNOCCUPIED", label: "Unoccupied" },
];

const MAINTENANCE_APPETITE_OPTIONS = [
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const BUDGET_GST_STATUS_OPTIONS = [
  { value: "INCLUDES_GST", label: "Includes GST" },
  { value: "EXCLUDES_GST", label: "Excludes GST" },
  { value: "NOT_SPECIFIED", label: "Not Specified" },
];

const FUNDING_STAGE_OPTIONS = [
  { value: "SELF_FUNDED", label: "Self Funded" },
  { value: "LOAN", label: "Loan" },
  { value: "NOT_SPECIFIED", label: "Not Specified" },
];

const START_DATE_STATUS_OPTIONS = [
  { value: "FIXED", label: "Fixed" },
  { value: "PREFERRED", label: "Preferred" },
  { value: "NOT_SPECIFIED", label: "Not Specified" },
];

const WORK_TYPE_OPTIONS = [
  { value: "TURNKEY", label: "Turnkey" },
  { value: "CONSULTANCY", label: "Consultancy" },
  { value: "BUILDER_FINANCE", label: "Builder Finance" },
  { value: "PMC_WORK", label: "PMC Work" },
  { value: "OTHER", label: "Other" },
];

const SERVICE_TYPE_OPTIONS = [
  { value: "ARCHITECTURE_DESIGN", label: "Architecture Design" },
  { value: "INTERIOR_DESIGN", label: "Interior Design" },
  { value: "EXECUTION", label: "Execution" },
  { value: "LABOUR_WORK", label: "Labour Work" },
  { value: "LANDSCAPE_DESIGN", label: "Landscape Design" },
  { value: "MATERIAL_PROCUREMENT", label: "Material Procurement" },
  { value: "OTHER", label: "Other" },
];

const PROCUREMENT_CATEGORY_OPTIONS = [
  { value: "CIVIL_BUILDING_MATERIAL", label: "Civil / Building Material" },
  { value: "METAL_WORK", label: "Metal Work" },
  { value: "AC_PIPING_DRAINAGE", label: "AC, Piping & Drainage" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "NETWORKING", label: "Networking" },
  { value: "TILES", label: "Tiles" },
  { value: "SANITARY", label: "Sanitary" },
  { value: "CP_FITTINGS", label: "CP Fittings" },
  { value: "CHEMICALS_ADHESIVES", label: "Chemicals & Adhesives" },
  { value: "STONE", label: "Stone" },
  { value: "MARBLE", label: "Marble" },
  { value: "GRANITE", label: "Granite" },
  { value: "DOORS", label: "Doors" },
  { value: "CHAUKHATS", label: "Chaukhats" },
  { value: "HARDWARE", label: "Hardware" },
  { value: "PLY_WOOD", label: "Ply Wood" },
  { value: "PAINTS_POLISHES", label: "Paints & Polishes" },
  { value: "FACADE_WORK", label: "Facade Work" },
  { value: "FRP", label: "FRP" },
  { value: "MICRO_CONCRETE", label: "Micro Concrete" },
  { value: "OTHER", label: "Other" },
];

const STYLE_DIRECTION_OPTIONS = [
  { value: "CONTEMPORARY", label: "Contemporary" },
  { value: "MINIMAL", label: "Minimal" },
  { value: "CLASSIC_TRADITIONAL", label: "Classic / Traditional" },
  { value: "INDIAN_CONTEMPORARY", label: "Indian Contemporary" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "MID_CENTURY", label: "Mid-Century" },
  { value: "LUXE_OPULENT", label: "Luxe / Opulent" },
  { value: "WARM_RUSTIC", label: "Warm / Rustic" },
  { value: "OTHER", label: "Other" },
];

const YES_NO_OPTIONS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

// Not wired to any field below — there's no status/attachment/document
// field in this form yet. Kept here so they're easy to reach for if
// those fields get added later.
// ProjectBriefStatus, ProjectBriefAttachmentCategory, ProjectBriefDocumentType

export const BRIEF_SECTIONS = [
  // =========================================================
  // CLIENT & PROJECT
  // =========================================================

  {
    title: "Client & Project Information",
    fields: [
      {
        key: "relationshipToClient",
        label: "Relationship to Client",
      },
      {
        key: "referredBySource",
        label: "Referred By / Source",
      },
      {
        key: "briefDate",
        label: "Brief Date",
        type: "date",
      },
    ],
  },

  // =========================================================
  // SITE
  // =========================================================

  {
    title: "Site & Property",
    fields: [
      {
        key: "siteAddress",
        label: "Site Address",
        type: "textarea",
        rows: 3,
      },
      {
        key: "propertyType",
        label: "Property Type",
      },
      {
        key: "siteArea",
        label: "Site Area",
        type: "number",
      },
      {
        key: "siteAreaUnit",
        label: "Site Area Unit",
        type: "select",
        options: SITE_AREA_UNIT_OPTIONS,
      },
      {
        key: "siteAreaOtherUnit",
        label: "Other Area Unit",
      },
      {
        key: "facingOrientation",
        label: "Facing / Orientation",
      },
      {
        key: "parkingProvision",
        label: "Parking Provision",
        type: "textarea",
      },
      {
        key: "ownershipStatus",
        label: "Ownership Status",
      },
      {
        key: "numberOfFloors",
        label: "Number of Floors",
        type: "number",
      },
      {
        key: "liftAvailable",
        label: "Lift Available?",
        type: "select",
        options: YES_NO_OPTIONS,
      },
      {
        key: "siteType",
        label: "Site Type",
        type: "select",
        options: SITE_TYPE_OPTIONS,
      },
      {
        key: "siteTypeOther",
        label: "Other Site Type",
      },
      {
        key: "siteCondition",
        label: "Current Site Condition",
        type: "select",
        options: SITE_CONDITION_OPTIONS,
      },
      {
        key: "drawingsOther",
        label: "Other Drawings Available",
        type: "textarea",
        rows: 3,
      },
    ],
  },

  // =========================================================
  // SCOPE
  // =========================================================

  {
    title: "Scope & Work Requirements",
    fields: [
      {
        key: "workTypes",
        label: "Work Types",
        type: "multiselect",
        options: WORK_TYPE_OPTIONS,
      },
      {
        key: "workTypeOther",
        label: "Other Work Type",
      },
      {
        key: "services",
        label: "Services Required",
        type: "multiselect",
        options: SERVICE_TYPE_OPTIONS,
      },
      {
        key: "servicesOther",
        label: "Other Service",
      },
      {
        key: "procurementCategories",
        label: "Procurement Categories",
        type: "multiselect",
        options: PROCUREMENT_CATEGORY_OPTIONS,
      },
      {
        key: "areasIncludedInScope",
        label: "Areas Included in Scope",
        type: "textarea",
        rows: 4,
      },
      {
        key: "areasExcludedFromScope",
        label: "Areas Excluded from Scope",
        type: "textarea",
        rows: 4,
      },
      {
        key: "workAlreadyDoneByOthers",
        label: "Work Already Done by Others",
        type: "textarea",
        rows: 4,
      },
    ],
  },

  // =========================================================
  // SPACE REQUIREMENTS
  // =========================================================

  {
    title: "Space Requirements",
    fields: [
      {
        key: "spaceRequirements",
        label: "Required Spaces",
        type: "textarea",
        rows: 7,
        placeholder: "Enter one space / room per line",
      },
    ],
  },

  // =========================================================
  // DESIGN DIRECTION
  // =========================================================

  {
    title: "Design Direction",
    fields: [
      {
        key: "styleDirections",
        label: "Style Directions",
        type: "multiselect",
        options: STYLE_DIRECTION_OPTIONS,
      },
      {
        key: "vastuRequirements",
        label: "Vastu Requirements",
        type: "textarea",
        rows: 4,
      },
      {
        key: "coloursPreferred",
        label: "Preferred Colours",
        type: "textarea",
        rows: 3,
      },
      {
        key: "coloursToAvoid",
        label: "Colours to Avoid",
        type: "textarea",
        rows: 3,
      },
      {
        key: "materialsLiked",
        label: "Materials Liked",
        type: "textarea",
        rows: 4,
      },
      {
        key: "materialsDislikedHardNo",
        label: "Materials Disliked / Hard No",
        type: "textarea",
        rows: 4,
      },
      {
        key: "mustHaveElements",
        label: "Must-Have Elements",
        type: "textarea",
        rows: 4,
      },
      {
        key: "maintenanceAppetite",
        label: "Maintenance Appetite",
        type: "select",
        options: MAINTENANCE_APPETITE_OPTIONS,
      },
    ],
  },

  // =========================================================
  // REFERENCES
  // =========================================================

  {
    title: "References & Inspiration",
    fields: [
      {
        key: "references",
        label: "References",
        type: "textarea",
        rows: 6,
        placeholder: "Enter one reference per line",
      },
    ],
  },

  // =========================================================
  // PHASES
  // =========================================================

  {
    title: "Project Phasing",
    fields: [
      {
        key: "phases",
        label: "Project Phases",
        type: "textarea",
        rows: 5,
        placeholder: "Enter one phase per line",
      },
      {
        key: "phasingRequired",
        label: "Phasing Required?",
        type: "select",
        options: YES_NO_OPTIONS,
      },
    ],
  },

  // =========================================================
  // BUDGET
  // =========================================================

  {
    title: "Budget & Funding",
    fields: [
      {
        key: "initialClientBudget",
        label: "Initial Client Budget",
        type: "number",
      },
      {
        key: "budgetCurrency",
        label: "Budget Currency",
      },
      {
        key: "budgetGstStatus",
        label: "GST Status",
        type: "select",
        options: BUDGET_GST_STATUS_OPTIONS,
      },
      {
        key: "fundingStage",
        label: "Funding Stage",
        type: "select",
        options: FUNDING_STAGE_OPTIONS,
      },
      {
        key: "budgetFlexibility",
        label: "Budget Flexibility",
        type: "textarea",
        rows: 3,
      },
    ],
  },

  // =========================================================
  // TIMELINE
  // =========================================================

  {
    title: "Timeline & Delivery",
    fields: [
      {
        key: "desiredStartDate",
        label: "Desired Start Date",
        type: "date",
      },
      {
        key: "startDateStatus",
        label: "Start Date Status",
        type: "select",
        options: START_DATE_STATUS_OPTIONS,
      },
      {
        key: "siteHandoverDate",
        label: "Site Handover Date",
        type: "date",
      },
      {
        key: "targetCompletionDate",
        label: "Target Completion Date",
        type: "date",
      },
      {
        key: "deadlineReason",
        label: "Deadline Reason",
        type: "textarea",
        rows: 3,
      },
    ],
  },

  // =========================================================
  // SITE OPERATIONS / RESTRICTIONS
  // =========================================================

  {
    title: "Site Rules & Restrictions",
    fields: [
      {
        key: "societyRwaPermittedWorkTimings",
        label: "Society / RWA Permitted Work Timings",
        type: "textarea",
        rows: 3,
      },
      {
        key: "nocOrSecurityDepositRequired",
        label: "NOC / Security Deposit Requirements",
        type: "textarea",
        rows: 3,
      },
      {
        key: "structuralChangesPermitted",
        label: "Structural Changes Permitted?",
        type: "textarea",
        rows: 3,
      },
      {
        key: "materialMovementRestrictions",
        label: "Material Movement Restrictions",
        type: "textarea",
        rows: 3,
      },
      {
        key: "neighbourSensitivities",
        label: "Neighbour Sensitivities",
        type: "textarea",
        rows: 3,
      },
      {
        key: "powerAndWaterAvailability",
        label: "Power & Water Availability",
        type: "textarea",
        rows: 3,
      },
      {
        key: "accessStorageDebrisDisposal",
        label: "Access / Storage / Debris Disposal",
        type: "textarea",
        rows: 4,
      },
      {
        key: "ongoingWorkByOtherAgencies",
        label: "Ongoing Work by Other Agencies",
        type: "textarea",
        rows: 4,
      },
    ],
  },

  // =========================================================
  // OCCUPANTS
  // =========================================================

  {
    title: "Occupants & Household",
    fields: [
      {
        key: "occupants",
        label: "Occupants",
        type: "textarea",
        rows: 6,
        placeholder: "Enter one occupant / household member per line",
      },
      {
        key: "householdNotes",
        label: "Household Notes",
        type: "textarea",
        rows: 5,
      },
    ],
  },

  // =========================================================
  // NOTES
  // =========================================================

  {
    title: "Notes & Open Points",
    fields: [
      {
        key: "openPointsToClose",
        label: "Open Points to Close",
        type: "textarea",
        rows: 6,
      },
    ],
  },

  // =========================================================
  // BRIEF ADMINISTRATION
  // =========================================================

  {
    title: "Brief Administration",
    fields: [
      {
        key: "briefTakenBy",
        label: "Brief Taken By",
      },
      {
        key: "briefTakenDate",
        label: "Brief Taken Date",
        type: "date",
      },
    ],
  },
];
