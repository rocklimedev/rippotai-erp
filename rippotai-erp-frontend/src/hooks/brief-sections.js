// =========================================================
// ENUM-BACKED OPTION SETS
// -----------------------------------------------------------
// Mirrors the backend enums 1:1. `value` is sent to the API
// exactly as-is (matches the enum's string value), `label` is
// what the user sees.
// =========================================================

export const SITE_AREA_UNIT_OPTIONS = [
  { value: "SQ_FT", label: "Sq. Ft." },
  { value: "GAJ", label: "Gaj" },
  { value: "OTHER", label: "Other" },
];

export const SITE_TYPE_OPTIONS = [
  { value: "FLAT", label: "Flat" },
  { value: "FLOOR", label: "Floor" },
  { value: "KOTHI", label: "Kothi" },
  { value: "RAW", label: "Raw / Shell" },
  { value: "OTHER", label: "Other" },
];

export const SITE_CONDITION_OPTIONS = [
  { value: "OCCUPIED", label: "Occupied" },
  { value: "UNOCCUPIED", label: "Unoccupied" },
];

export const MAINTENANCE_APPETITE_OPTIONS = [
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

export const WORK_TYPE_OPTIONS = [
  { value: "TURNKEY", label: "Turnkey" },
  { value: "CONSULTANCY", label: "Consultancy" },
  { value: "BUILDER_FINANCE", label: "Builder Finance" },
  { value: "PMC_WORK", label: "PMC Work" },
  { value: "OTHER", label: "Other" },
];

export const SERVICE_TYPE_OPTIONS = [
  { value: "ARCHITECTURE_DESIGN", label: "Architecture Design" },
  { value: "INTERIOR_DESIGN", label: "Interior Design" },
  { value: "EXECUTION", label: "Execution" },
  { value: "LABOUR_WORK", label: "Labour Work" },
  { value: "LANDSCAPE_DESIGN", label: "Landscape Design" },
  { value: "MATERIAL_PROCUREMENT", label: "Material Procurement" },
  { value: "OTHER", label: "Other" },
];

export const PROCUREMENT_CATEGORY_OPTIONS = [
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

export const STYLE_DIRECTION_OPTIONS = [
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

export const YES_NO_OPTIONS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

// Mock data for drawings available — replace with real API later
export const DRAWINGS_AVAILABLE_OPTIONS = [
  { value: "ARCHITECTURAL", label: "Architectural Drawings" },
  { value: "STRUCTURAL", label: "Structural Drawings" },
  { value: "MEP", label: "MEP Drawings" },
  { value: "WORKING", label: "Working Drawings" },
  { value: "AS_BUILT", label: "As-Built Drawings" },
  { value: "NONE", label: "None Available" },
  { value: "OTHER", label: "Other" },
];

// Restriction types for the Site Rules table
export const SITE_RESTRICTION_TYPES = [
  {
    value: "societyRwaPermittedWorkTimings",
    label: "Society / RWA Permitted Work Timings",
  },
  {
    value: "nocOrSecurityDepositRequired",
    label: "NOC / Security Deposit Requirements",
  },
  {
    value: "structuralChangesPermitted",
    label: "Structural Changes Permitted?",
  },
  {
    value: "materialMovementRestrictions",
    label: "Material Movement Restrictions (lift, staircase, hours)",
  },
  { value: "neighbourSensitivities", label: "Neighbour Sensitivities" },
  {
    value: "powerAndWaterAvailability",
    label: "Power & Water Availability at Site",
  },
  {
    value: "accessStorageDebrisDisposal",
    label: "Access, Storage and Debris Disposal",
  },
  {
    value: "ongoingWorkByOtherAgencies",
    label: "Any Ongoing Work by Other Agencies",
  },
];

// =========================================================
// BRIEF SECTIONS CONFIG
// =========================================================

export const BRIEF_SECTIONS = [
  // =========================================================
  // CLIENT & PROJECT
  // =========================================================
  {
    title: "Client & Project Information",
    key: "clientProject",
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
    key: "siteProperty",
    fields: [
      {
        key: "siteAddress",
        label: "Site Address",
        type: "textarea",
        rows: 3,
      },
      {
        key: "projectType", // renamed from propertyType
        label: "Project Type",
        type: "select",
        // options will be injected from projectTypesApi at runtime
        optionsSource: "projectTypes",
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
      // siteAreaOtherUnit REMOVED
      {
        key: "facingOrientation",
        label: "Facing / Orientation",
      },
      {
        key: "parkingProvision",
        label: "Parking Provision",
        // changed from textarea → normal input
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
      // siteTypeOther REMOVED
      {
        key: "siteCondition",
        label: "Current Site Condition",
        type: "select",
        options: SITE_CONDITION_OPTIONS,
      },
      {
        key: "drawingsAvailable",
        label: "Drawings Available",
        type: "select",
        options: DRAWINGS_AVAILABLE_OPTIONS, // mock – replace later
      },
      {
        key: "drawingsOther",
        label: "Other Drawings / Notes",
        // small input (not textarea)
      },
    ],
  },

  // =========================================================
  // SCOPE
  // =========================================================
  {
    title: "Scope & Work Requirements",
    key: "scope",
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
        label: "Material Procurement", // renamed
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
  // SPACE REQUIREMENTS  (boolean + table)
  // =========================================================
  {
    title: "Space Requirements",
    key: "spaceRequirementsSection",
    fields: [
      {
        key: "hasSpaceRequirements",
        label: "Do you have specific space requirements?",
        type: "select",
        options: YES_NO_OPTIONS,
      },
      {
        key: "spaceRequirements",
        label: "Required Spaces",
        type: "table",
        // shown only when hasSpaceRequirements === "Yes"
        showWhen: { field: "hasSpaceRequirements", value: "Yes" },
        columns: [
          { key: "spaceName", label: "Space / Room", type: "text" },
          { key: "requirements", label: "Requirements", type: "text" },
        ],
        addLabel: "Add Space",
      },
    ],
  },

  // =========================================================
  // DESIGN DIRECTION
  // =========================================================
  {
    title: "Design Direction",
    key: "designDirection",
    fields: [
      {
        key: "styleDirections",
        label: "Style Directions",
        type: "multiselect",
        options: STYLE_DIRECTION_OPTIONS,
      },
      {
        key: "styleDirectionOther",
        label: "Other Style Direction",
        // shown when "OTHER" is selected in styleDirections
        showWhenMultiselectIncludes: {
          field: "styleDirections",
          value: "OTHER",
        },
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
    key: "references",
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
  // PROJECT PHASES  (table)
  // =========================================================
  {
    title: "Project Phasing",
    key: "projectPhasing",
    fields: [
      {
        key: "phasingRequired",
        label: "Phasing Required?",
        type: "select",
        options: YES_NO_OPTIONS,
      },
      {
        key: "phases",
        label: "Project Phases",
        type: "table",
        showWhen: { field: "phasingRequired", value: "Yes" },
        columns: [
          { key: "phaseName", label: "Phase", type: "text" },
          { key: "startDate", label: "Start Date", type: "date" },
          { key: "endDate", label: "End Date", type: "date" },
          {
            key: "expectedTime",
            label: "Expected Time",
            type: "text",
            placeholder: "e.g. 4 weeks",
          },
        ],
        addLabel: "Add Phase",
      },
    ],
  },

  // =========================================================
  // BUDGET  (GST status & Funding Stage removed)
  // =========================================================
  {
    title: "Budget & Funding",
    key: "budget",
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
      // budgetGstStatus REMOVED
      // fundingStage REMOVED
      {
        key: "budgetFlexibility",
        label: "Budget Flexibility",
        type: "textarea",
        rows: 3,
      },
    ],
  },

  // =========================================================
  // TIMELINE  (startDateStatus removed)
  // =========================================================
  {
    title: "Timeline & Delivery",
    key: "timeline",
    fields: [
      {
        key: "desiredStartDate",
        label: "Desired Start Date",
        type: "date",
      },
      // startDateStatus REMOVED
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
  // SITE RULES & RESTRICTIONS  (table driven by dropdown)
  // =========================================================
  {
    title: "Site Rules & Restrictions",
    key: "siteRestrictions",
    fields: [
      {
        key: "siteRestrictions",
        label: "Site Restrictions",
        type: "restriction-table",
        restrictionOptions: SITE_RESTRICTION_TYPES,
        columns: [
          { key: "type", label: "Restriction Type", type: "select" },
          { key: "details", label: "Details / Notes", type: "text" },
        ],
        addLabel: "Add Restriction",
      },
    ],
  },

  // =========================================================
  // OCCUPANTS  (table)
  // =========================================================
  {
    title: "Occupants & Household",
    key: "occupants",
    fields: [
      {
        key: "occupants",
        label: "Occupants",
        type: "table",
        columns: [
          { key: "name", label: "Name", type: "text" },
          { key: "relation", label: "Relation", type: "text" },
          {
            key: "specificNeeds",
            label: "Specific Needs / Preferences",
            type: "text",
          },
        ],
        addLabel: "Add Occupant",
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
    key: "notes",
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
    key: "admin",
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
