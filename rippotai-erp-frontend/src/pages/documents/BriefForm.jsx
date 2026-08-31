import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { BriefSectionForm } from "../../components/BriefSectionForm";
import { useAutoSave } from "../../hooks/use-autosave";

import { useGetProjectsQuery } from "../../api/project.api";
import {
  useCreateProjectBriefMutation,
  useGetProjectBriefQuery,
  useUpdateProjectBriefMutation,
} from "../../api/brief.api";

import { BRIEF_SECTIONS } from "../../hooks/brief-sections";

const SAVE_KEY = "bc.project-brief.draft";

// ============================================================
// HELPERS
// ============================================================

const splitLines = (value) => {
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

const parseBoolean = (value) => {
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

// ============================================================
// API RESPONSE -> FORM VALUES
// ============================================================

const normalizeProjectBrief = (brief) => {
  if (!brief) {
    return {};
  }

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

    propertyType: brief.propertyType ?? "",

    siteArea: brief.siteArea ?? "",

    siteAreaUnit: brief.siteAreaUnit ?? "",

    siteAreaOtherUnit: brief.siteAreaOtherUnit ?? "",

    facingOrientation: brief.facingOrientation ?? "",

    parkingProvision: brief.parkingProvision ?? "",

    ownershipStatus: brief.ownershipStatus ?? "",

    numberOfFloors: brief.numberOfFloors ?? "",

    liftAvailable: brief.liftAvailable ?? "",

    siteType: brief.siteType ?? "",

    siteTypeOther: brief.siteTypeOther ?? "",

    siteCondition: brief.siteCondition ?? "",

    drawingsOther: brief.drawingsOther ?? "",

    // ========================================================
    // SCOPE
    // ========================================================

    workTypeOther: brief.workTypeOther ?? "",

    servicesOther: brief.servicesOther ?? "",

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

    // ========================================================
    // BUDGET
    // ========================================================

    initialClientBudget: brief.initialClientBudget ?? "",

    budgetCurrency: brief.budgetCurrency ?? "INR",

    budgetGstStatus: brief.budgetGstStatus ?? "",

    fundingStage: brief.fundingStage ?? "",

    budgetFlexibility: brief.budgetFlexibility ?? "",

    // ========================================================
    // TIMELINE
    // ========================================================

    desiredStartDate: brief.desiredStartDate ?? "",

    startDateStatus: brief.startDateStatus ?? "",

    siteHandoverDate: brief.siteHandoverDate ?? "",

    targetCompletionDate: brief.targetCompletionDate ?? "",

    deadlineReason: brief.deadlineReason ?? "",

    phasingRequired: brief.phasingRequired ?? "",

    // ========================================================
    // SITE RESTRICTIONS
    // ========================================================

    societyRwaPermittedWorkTimings: brief.societyRwaPermittedWorkTimings ?? "",

    nocOrSecurityDepositRequired: brief.nocOrSecurityDepositRequired ?? "",

    structuralChangesPermitted: brief.structuralChangesPermitted ?? "",

    materialMovementRestrictions: brief.materialMovementRestrictions ?? "",

    neighbourSensitivities: brief.neighbourSensitivities ?? "",

    powerAndWaterAvailability: brief.powerAndWaterAvailability ?? "",

    accessStorageDebrisDisposal: brief.accessStorageDebrisDisposal ?? "",

    ongoingWorkByOtherAgencies: brief.ongoingWorkByOtherAgencies ?? "",

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

    // ProjectBriefWorkType.workType
    workTypes: (brief.workTypes ?? [])
      .map((item) => item?.workType)
      .filter(Boolean)
      .join("\n"),

    // ProjectBriefService.serviceType
    services: (brief.services ?? [])
      .map((item) => item?.serviceType)
      .filter(Boolean)
      .join("\n"),

    // ProjectBriefProcurementCategory.category
    procurementCategories: (brief.procurementCategories ?? [])
      .map((item) => item?.category)
      .filter(Boolean)
      .join("\n"),

    // ProjectBriefSpaceRequirement.spaceName
    spaceRequirements: [...(brief.spaceRequirements ?? [])]
      .sort((a, b) => Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0))
      .map((item) => item?.spaceName)
      .filter(Boolean)
      .join("\n"),

    // ProjectBriefStyleDirection.styleDirection
    styleDirections: (brief.styleDirections ?? [])
      .map((item) => item?.styleDirection)
      .filter(Boolean)
      .join("\n"),

    // ProjectBriefReference.description
    references: [...(brief.references ?? [])]
      .sort((a, b) => Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0))
      .map((item) => item?.description)
      .filter(Boolean)
      .join("\n"),

    // ProjectBriefPhase.phaseName
    phases: [...(brief.phases ?? [])]
      .sort((a, b) => Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0))
      .map((item) => item?.phaseName)
      .filter(Boolean)
      .join("\n"),

    // ProjectBriefOccupant.name
    occupants: [...(brief.occupants ?? [])]
      .sort((a, b) => Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0))
      .map((item) => item?.name)
      .filter(Boolean)
      .join("\n"),
  };
};

// ============================================================
// FORM VALUES -> API PAYLOAD
// ============================================================

const buildProjectBriefPayload = (projectId, values) => {
  return {
    // ========================================================
    // PROJECT
    // ========================================================

    projectId,

    // ========================================================
    // CLIENT / PROJECT
    // ========================================================

    relationshipToClient: values.relationshipToClient || null,

    referredBySource: values.referredBySource || null,

    briefDate: values.briefDate || null,

    // ========================================================
    // SITE
    // ========================================================

    siteAddress: values.siteAddress || null,

    propertyType: values.propertyType || null,

    siteArea:
      values.siteArea !== "" &&
      values.siteArea !== null &&
      values.siteArea !== undefined
        ? Number(values.siteArea)
        : null,

    siteAreaUnit: values.siteAreaUnit || null,

    siteAreaOtherUnit: values.siteAreaOtherUnit || null,

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

    siteTypeOther: values.siteTypeOther || null,

    siteCondition: values.siteCondition || null,

    drawingsOther: values.drawingsOther || null,

    // ========================================================
    // SCOPE
    // ========================================================

    workTypeOther: values.workTypeOther || null,

    servicesOther: values.servicesOther || null,

    areasIncludedInScope: values.areasIncludedInScope || null,

    areasExcludedFromScope: values.areasExcludedFromScope || null,

    workAlreadyDoneByOthers: values.workAlreadyDoneByOthers || null,

    // ========================================================
    // DESIGN
    // ========================================================

    vastuRequirements: values.vastuRequirements || null,

    coloursToAvoid: values.coloursToAvoid || null,

    materialsLiked: values.materialsLiked || null,

    materialsDislikedHardNo: values.materialsDislikedHardNo || null,

    mustHaveElements: values.mustHaveElements || null,

    coloursPreferred: values.coloursPreferred || null,

    maintenanceAppetite: values.maintenanceAppetite || null,

    // ========================================================
    // BUDGET
    // ========================================================

    initialClientBudget:
      values.initialClientBudget !== "" &&
      values.initialClientBudget !== null &&
      values.initialClientBudget !== undefined
        ? Number(values.initialClientBudget)
        : null,

    budgetCurrency: values.budgetCurrency || "INR",

    budgetGstStatus: values.budgetGstStatus || null,

    fundingStage: values.fundingStage || null,

    budgetFlexibility: values.budgetFlexibility || null,

    // ========================================================
    // TIMELINE
    // ========================================================

    desiredStartDate: values.desiredStartDate || null,

    startDateStatus: values.startDateStatus || null,

    siteHandoverDate: values.siteHandoverDate || null,

    targetCompletionDate: values.targetCompletionDate || null,

    deadlineReason: values.deadlineReason || null,

    phasingRequired: parseBoolean(values.phasingRequired),

    // ========================================================
    // SITE RESTRICTIONS
    // ========================================================

    societyRwaPermittedWorkTimings:
      values.societyRwaPermittedWorkTimings || null,

    nocOrSecurityDepositRequired: values.nocOrSecurityDepositRequired || null,

    structuralChangesPermitted: values.structuralChangesPermitted || null,

    materialMovementRestrictions: values.materialMovementRestrictions || null,

    neighbourSensitivities: values.neighbourSensitivities || null,

    powerAndWaterAvailability: values.powerAndWaterAvailability || null,

    accessStorageDebrisDisposal: values.accessStorageDebrisDisposal || null,

    ongoingWorkByOtherAgencies: values.ongoingWorkByOtherAgencies || null,

    // ========================================================
    // NOTES
    // ========================================================

    householdNotes: values.householdNotes || null,

    openPointsToClose: values.openPointsToClose || null,

    // ========================================================
    // ADMIN
    // ========================================================

    briefTakenBy: values.briefTakenBy || null,

    briefTakenDate: values.briefTakenDate || null,

    // ========================================================
    // CHILD COLLECTIONS
    // ========================================================

    workTypes: splitLines(values.workTypes).map((workType) => ({
      workType,
    })),

    services: splitLines(values.services).map((serviceType) => ({
      serviceType,
    })),

    procurementCategories: splitLines(values.procurementCategories).map(
      (category) => ({
        category,
      }),
    ),

    spaceRequirements: splitLines(values.spaceRequirements).map(
      (spaceName, index) => ({
        spaceName,
        sortOrder: index,
      }),
    ),

    styleDirections: splitLines(values.styleDirections).map(
      (styleDirection) => ({
        styleDirection,
      }),
    ),

    references: splitLines(values.references).map((description, index) => ({
      description,
      sortOrder: index,
    })),

    phases: splitLines(values.phases).map((phaseName, index) => ({
      phaseName,
      sortOrder: index,
    })),

    occupants: splitLines(values.occupants).map((name, index) => ({
      name,
      sortOrder: index,
    })),
  };
};

// ============================================================
// COMPONENT
// ============================================================

export function BriefForm() {
  const nav = useNavigate();
  const { id } = useParams();

  const isEditMode = Boolean(id);

  // ==========================================================
  // PROJECTS
  // ==========================================================

  const { data: projects = [], isLoading: projectsLoading } =
    useGetProjectsQuery();

  // ==========================================================
  // EXISTING BRIEF
  // ==========================================================

  const {
    data: existingBrief,
    isLoading: briefLoading,
    isFetching: briefFetching,
    error: briefError,
  } = useGetProjectBriefQuery(id, {
    skip: !isEditMode,
  });

  // ==========================================================
  // MUTATIONS
  // ==========================================================

  const [createProjectBrief, { isLoading: isCreating }] =
    useCreateProjectBriefMutation();

  const [updateProjectBrief, { isLoading: isUpdating }] =
    useUpdateProjectBriefMutation();

  const isSubmitting = isCreating || isUpdating;

  // ==========================================================
  // STATE
  // ==========================================================

  const [projectId, setProjectId] = useState("");

  const [values, setValues] = useAutoSave(SAVE_KEY, {});

  const [initialized, setInitialized] = useState(false);

  // ==========================================================
  // LOAD EXISTING BRIEF INTO FORM
  // ==========================================================

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    if (!existingBrief) {
      return;
    }

    if (initialized) {
      return;
    }

    const normalized = normalizeProjectBrief(existingBrief);

    setProjectId(existingBrief.projectId ?? "");

    setValues(normalized);

    setInitialized(true);
  }, [isEditMode, existingBrief, initialized, setValues]);

  // ==========================================================
  // ERROR LOADING BRIEF
  // ==========================================================

  useEffect(() => {
    if (!briefError) {
      return;
    }

    console.error("Failed to load project brief:", briefError);

    toast.error(briefError?.data?.message || "Failed to load project brief");
  }, [briefError]);

  // ==========================================================
  // FIELD CHANGE
  // ==========================================================

  const handleFieldChange = (section, key, value) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // ==========================================================
  // BUILD PAYLOAD
  // ==========================================================

  const buildPayload = () => {
    return buildProjectBriefPayload(projectId, values);
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async () => {
    if (!projectId) {
      toast.error("Select a project first");
      return;
    }

    try {
      const payload = buildPayload();

      // ======================================================
      // UPDATE
      // ======================================================

      if (isEditMode) {
        const data = await updateProjectBrief({
          id,
          body: payload,
        }).unwrap();

        toast.success(
          `Project brief v${
            data?.version ?? existingBrief?.version ?? 1
          } updated successfully`,
        );

        localStorage.removeItem(SAVE_KEY);

        nav(`/documents/brief/${data?.id ?? id}`);

        return;
      }

      // ======================================================
      // CREATE
      // ======================================================

      const data = await createProjectBrief(payload).unwrap();

      toast.success(
        `Project brief v${data?.version ?? 1} created successfully`,
      );

      localStorage.removeItem(SAVE_KEY);

      nav(`/documents/brief/${data.id}`);
    } catch (error) {
      console.error(
        isEditMode
          ? "Project brief update failed:"
          : "Project brief creation failed:",
        error,
      );

      toast.error(
        error?.data?.message ||
          error?.error ||
          (isEditMode
            ? "Failed to update project brief"
            : "Failed to create project brief"),
      );
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (isEditMode && (briefLoading || briefFetching) && !initialized) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-sm text-muted-foreground">
          Loading project brief...
        </div>
      </div>
    );
  }

  // ==========================================================
  // TITLE
  // ==========================================================

  const title = isEditMode ? "Edit Project Brief" : "Project Brief";

  const subtitle = isEditMode
    ? "Update the client brief, project requirements, design direction, budget, timeline and site constraints."
    : "Capture the complete client brief, project requirements, design direction, budget, timeline and site constraints.";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <BriefSectionForm
      title={title}
      subtitle={subtitle}
      sections={BRIEF_SECTIONS}
      values={values}
      onFieldChange={handleFieldChange}
      projects={projects}
      projectId={projectId}
      onProjectChange={setProjectId}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting || projectsLoading || briefLoading}
    />
  );
}
