// ============================================================
// HELPERS
// ============================================================

export const splitLines = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return String(value)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const parseBoolean = (value) => {
  if (value === true || value === false) {
    return value;
  }

  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["yes", "true", "1"].includes(normalized)) {
    return true;
  }

  if (["no", "false", "0"].includes(normalized)) {
    return false;
  }

  return null;
};

export const todayISO = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ============================================================
// API RESPONSE -> FORM VALUES
// ============================================================

export const normalizeProjectBrief = (brief) => {
  if (!brief) {
    return {};
  }

  // Site restrictions – table shape from the backend child model
  const siteRestrictions = Array.isArray(brief.siteRestrictions)
    ? [...brief.siteRestrictions]
        .sort((a, b) => Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0))
        .map((item) => ({
          type: item.type,
          details: item.details ?? "",
        }))
    : [];

  // Space requirements – table shape (backend column is requirementDetails)
  let spaceRequirements = [];
  let hasSpaceRequirements = "No";

  if (
    Array.isArray(brief.spaceRequirements) &&
    brief.spaceRequirements.length > 0
  ) {
    spaceRequirements = [...brief.spaceRequirements]
      .sort((a, b) => Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0))
      .map((item) => ({
        spaceName: item.spaceName ?? "",
        requirements: item.requirementDetails ?? "",
      }));
    hasSpaceRequirements = "Yes";
  }

  // Phases
  let phases = [];
  if (Array.isArray(brief.phases) && brief.phases.length > 0) {
    phases = [...brief.phases]
      .sort((a, b) => Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0))
      .map((item) => ({
        phaseName: item.phaseName ?? "",
        startDate: item.startDate ?? "",
        endDate: item.endDate ?? "",
        expectedTime: item.expectedTime ?? "",
      }));
  }

  // Occupants (backend columns: relationship, specificNeedsPreferences)
  let occupants = [];
  if (Array.isArray(brief.occupants) && brief.occupants.length > 0) {
    occupants = [...brief.occupants]
      .sort((a, b) => Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0))
      .map((item) => ({
        name: item.name ?? "",
        relation: item.relationship ?? "",
        specificNeeds: item.specificNeedsPreferences ?? "",
      }));
  }

  // Style directions – pull "Other" description off the OTHER row
  const styleDirectionRows = brief.styleDirections ?? [];
  const otherStyleRow = styleDirectionRows.find(
    (row) => (row?.styleDirection ?? row) === "OTHER",
  );

  // Procurement categories – pull "Other" description off the OTHER row
  const procurementRows = brief.procurementCategories ?? [];
  const otherProcurementRow = procurementRows.find(
    (row) => (row?.category ?? row) === "OTHER",
  );

  return {
    // ========================================================
    // CLIENT / PROJECT
    // ========================================================
    relationshipToClient: brief.relationshipToClient ?? "",
    referredBySource: brief.referredBySource ?? "",
    briefDate: brief.briefDate ?? "",

    // ========================================================
    // SITE
    // ========================================================
    siteAddress: brief.siteAddress ?? "",
    projectType: brief.projectTypeId ?? "",
    siteArea: brief.siteArea ?? "",
    siteAreaUnit: brief.siteAreaUnit ?? "",
    facingOrientation: brief.facingOrientation ?? "",
    parkingProvision: brief.parkingProvision ?? "",
    ownershipStatus: brief.ownershipStatus ?? "",
    numberOfFloors: brief.numberOfFloors ?? "",
    liftAvailable:
      brief.liftAvailable === true
        ? "Yes"
        : brief.liftAvailable === false
          ? "No"
          : (brief.liftAvailable ?? ""),
    siteType: brief.siteType ?? "",
    siteCondition: brief.siteCondition ?? "",
    drawingsAvailable: brief.drawingsAvailable ?? "",
    drawingsOther: brief.drawingsOther ?? "",

    // ========================================================
    // SCOPE
    // ========================================================
    workTypeOther: brief.workTypeOther ?? "",
    servicesOther: brief.servicesOther ?? "",
    procurementOther: otherProcurementRow?.otherDescription ?? "",
    areasIncludedInScope: brief.areasIncludedInScope ?? "",
    areasExcludedFromScope: brief.areasExcludedFromScope ?? "",
    workAlreadyDoneByOthers: brief.workAlreadyDoneByOthers ?? "",

    // ========================================================
    // DESIGN
    // ========================================================
    vastuRequirements: brief.vastuRequirements ?? "",
    coloursToAvoid: brief.coloursToAvoid ?? "",
    materialsLiked: brief.materialsLiked ?? "",
    materialsDislikedHardNo: brief.materialsDislikedHardNo ?? "",
    mustHaveElements: brief.mustHaveElements ?? "",
    coloursPreferred: brief.coloursPreferred ?? "",
    maintenanceAppetite: brief.maintenanceAppetite ?? "",
    styleDirectionOther: otherStyleRow?.otherDescription ?? "",

    // ========================================================
    // BUDGET
    // ========================================================
    initialClientBudget: brief.initialClientBudget ?? "",
    budgetCurrency: brief.budgetCurrency ?? "INR",
    budgetFlexibility: brief.budgetFlexibility ?? "",

    // ========================================================
    // TIMELINE
    // ========================================================
    desiredStartDate: brief.desiredStartDate ?? "",
    siteHandoverDate: brief.siteHandoverDate ?? "",
    targetCompletionDate: brief.targetCompletionDate ?? "",
    deadlineReason: brief.deadlineReason ?? "",
    phasingRequired:
      brief.phasingRequired === true
        ? "Yes"
        : brief.phasingRequired === false
          ? "No"
          : (brief.phasingRequired ?? ""),

    // ========================================================
    // SITE RESTRICTIONS (table)
    // ========================================================
    siteRestrictions,

    // ========================================================
    // NOTES
    // ========================================================
    householdNotes: brief.householdNotes ?? "",
    openPointsToClose: brief.openPointsToClose ?? "",

    // ========================================================
    // ADMIN
    // ========================================================
    briefTakenBy: brief.briefTakenBy ?? "",
    briefTakenDate: brief.briefTakenDate ?? "",

    // ========================================================
    // CHILD COLLECTIONS
    // ========================================================
    workTypes: (brief.workTypes ?? [])
      .map((item) => item?.workType ?? item)
      .filter(Boolean),

    services: (brief.services ?? [])
      .map((item) => item?.serviceType ?? item)
      .filter(Boolean),

    procurementCategories: procurementRows
      .map((item) => item?.category ?? item)
      .filter(Boolean),

    hasSpaceRequirements,
    spaceRequirements,

    styleDirections: styleDirectionRows
      .map((item) => item?.styleDirection ?? item)
      .filter(Boolean),

    references: [...(brief.references ?? [])]
      .sort((a, b) => Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0))
      .map((item) => item?.description ?? item)
      .filter(Boolean)
      .join("\n"),

    phases,
    occupants,
  };
};

// ============================================================
// FORM VALUES -> API PAYLOAD
// ============================================================

export const buildProjectBriefPayload = (projectId, values) => {
  const styleDirectionList = Array.isArray(values.styleDirections)
    ? values.styleDirections
    : splitLines(values.styleDirections);

  const procurementCategoryList = Array.isArray(values.procurementCategories)
    ? values.procurementCategories
    : splitLines(values.procurementCategories);

  return {
    projectId,

    // CLIENT / PROJECT
    relationshipToClient: values.relationshipToClient || null,
    referredBySource: values.referredBySource || null,
    briefDate: values.briefDate || null,

    // SITE
    siteAddress: values.siteAddress || null,
    projectTypeId: values.projectType || null,
    siteArea:
      values.siteArea !== "" &&
      values.siteArea !== null &&
      values.siteArea !== undefined
        ? Number(values.siteArea)
        : null,
    siteAreaUnit: values.siteAreaUnit || null,
    facingOrientation: values.facingOrientation || null,
    parkingProvision: values.parkingProvision || null,
    ownershipStatus: values.ownershipStatus || null,
    numberOfFloors:
      values.numberOfFloors !== "" &&
      values.numberOfFloors !== null &&
      values.numberOfFloors !== undefined
        ? Number(values.numberOfFloors)
        : null,
    liftAvailable: parseBoolean(values.liftAvailable),
    siteType: values.siteType || null,
    siteCondition: values.siteCondition || null,
    drawingsAvailable: values.drawingsAvailable || null,
    drawingsOther: values.drawingsOther || null,

    // SCOPE
    workTypeOther: values.workTypeOther || null,
    servicesOther: values.servicesOther || null,
    areasIncludedInScope: values.areasIncludedInScope || null,
    areasExcludedFromScope: values.areasExcludedFromScope || null,
    workAlreadyDoneByOthers: values.workAlreadyDoneByOthers || null,

    // DESIGN
    vastuRequirements: values.vastuRequirements || null,
    coloursToAvoid: values.coloursToAvoid || null,
    materialsLiked: values.materialsLiked || null,
    materialsDislikedHardNo: values.materialsDislikedHardNo || null,
    mustHaveElements: values.mustHaveElements || null,
    coloursPreferred: values.coloursPreferred || null,
    maintenanceAppetite: values.maintenanceAppetite || null,

    // BUDGET
    initialClientBudget:
      values.initialClientBudget !== "" &&
      values.initialClientBudget !== null &&
      values.initialClientBudget !== undefined
        ? Number(values.initialClientBudget)
        : null,
    budgetCurrency: values.budgetCurrency || "INR",
    budgetFlexibility: values.budgetFlexibility || null,

    // TIMELINE
    desiredStartDate: values.desiredStartDate || null,
    siteHandoverDate: values.siteHandoverDate || null,
    targetCompletionDate: values.targetCompletionDate || null,
    deadlineReason: values.deadlineReason || null,
    phasingRequired: parseBoolean(values.phasingRequired),

    // SITE RESTRICTIONS
    siteRestrictions: (values.siteRestrictions || []).map((row, index) => ({
      type: row.type,
      details: row.details || null,
      sortOrder: index,
    })),

    // NOTES
    householdNotes: values.householdNotes || null,
    openPointsToClose: values.openPointsToClose || null,

    // ADMIN
    briefTakenBy: values.briefTakenBy || null,
    briefTakenDate: values.briefTakenDate || null,

    // CHILD COLLECTIONS
    workTypes: (Array.isArray(values.workTypes)
      ? values.workTypes
      : splitLines(values.workTypes)
    ).map((workType) => ({ workType })),

    services: (Array.isArray(values.services)
      ? values.services
      : splitLines(values.services)
    ).map((serviceType) => ({ serviceType })),

    procurementCategories: procurementCategoryList.map((category) => ({
      category,
      otherDescription:
        category === "OTHER" ? values.procurementOther || null : null,
    })),

    spaceRequirements:
      values.hasSpaceRequirements === "Yes"
        ? (values.spaceRequirements || []).map((row, index) => ({
            spaceName: row.spaceName || "",
            requirementDetails: row.requirements || "",
            sortOrder: index,
          }))
        : [],

    styleDirections: styleDirectionList.map((styleDirection) => ({
      styleDirection,
      otherDescription:
        styleDirection === "OTHER" ? values.styleDirectionOther || null : null,
    })),

    references: splitLines(values.references).map((description, index) => ({
      description,
      sortOrder: index,
    })),

    phases:
      values.phasingRequired === "Yes"
        ? (values.phases || []).map((row, index) => ({
            phaseName: row.phaseName || "",
            startDate: row.startDate || null,
            endDate: row.endDate || null,
            expectedTime: row.expectedTime || null,
            sortOrder: index,
          }))
        : [],

    occupants: (values.occupants || []).map((row, index) => ({
      name: row.name || "",
      relationship: row.relation || null,
      specificNeedsPreferences: row.specificNeeds || null,
      sortOrder: index,
    })),
  };
};
