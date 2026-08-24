import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BriefSectionForm } from "../../components/BriefSectionForm";
import { useAutoSave } from "../../hooks/use-autosave";

import { useGetProjectsQuery } from "../../api/project.api";
import { useCreateProjectBriefMutation } from "../../api/brief.api";

import { BRIEF_SECTIONS } from "../../hooks/brief-sections";

const SAVE_KEY = "bc.project-brief.draft";

export function BriefForm() {
  const nav = useNavigate();

  const { data: projects = [] } = useGetProjectsQuery();

  const [createProjectBrief, { isLoading }] = useCreateProjectBriefMutation();

  const [projectId, setProjectId] = useState("");

  const [values, setValues] = useAutoSave(SAVE_KEY, {});

  // =========================================================
  // FIELD CHANGE
  // =========================================================

  const handleFieldChange = (section, key, value) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // =========================================================
  // HELPERS
  // =========================================================

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

    if (!value) {
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

  // =========================================================
  // BUILD PAYLOAD
  // =========================================================

  const buildPayload = () => {
    return {
      projectId,

      // -------------------------------------------------------
      // CLIENT / PROJECT
      // -------------------------------------------------------

      relationshipToClient: values.relationshipToClient || null,

      referredBySource: values.referredBySource || null,

      briefDate: values.briefDate || null,

      // -------------------------------------------------------
      // SITE
      // -------------------------------------------------------

      siteAddress: values.siteAddress || null,

      propertyType: values.propertyType || null,

      siteArea: values.siteArea ? Number(values.siteArea) : null,

      siteAreaUnit: values.siteAreaUnit || null,

      siteAreaOtherUnit: values.siteAreaOtherUnit || null,

      facingOrientation: values.facingOrientation || null,

      parkingProvision: values.parkingProvision || null,

      ownershipStatus: values.ownershipStatus || null,

      numberOfFloors: values.numberOfFloors
        ? Number(values.numberOfFloors)
        : null,

      liftAvailable: parseBoolean(values.liftAvailable),

      siteType: values.siteType || null,

      siteTypeOther: values.siteTypeOther || null,

      siteCondition: values.siteCondition || null,

      drawingsOther: values.drawingsOther || null,

      // -------------------------------------------------------
      // SCOPE
      // -------------------------------------------------------

      workTypeOther: values.workTypeOther || null,

      servicesOther: values.servicesOther || null,

      areasIncludedInScope: values.areasIncludedInScope || null,

      areasExcludedFromScope: values.areasExcludedFromScope || null,

      workAlreadyDoneByOthers: values.workAlreadyDoneByOthers || null,

      // -------------------------------------------------------
      // DESIGN
      // -------------------------------------------------------

      vastuRequirements: values.vastuRequirements || null,

      coloursToAvoid: values.coloursToAvoid || null,

      materialsLiked: values.materialsLiked || null,

      materialsDislikedHardNo: values.materialsDislikedHardNo || null,

      mustHaveElements: values.mustHaveElements || null,

      coloursPreferred: values.coloursPreferred || null,

      maintenanceAppetite: values.maintenanceAppetite || null,

      // -------------------------------------------------------
      // BUDGET
      // -------------------------------------------------------

      initialClientBudget: values.initialClientBudget
        ? Number(values.initialClientBudget)
        : null,

      budgetCurrency: values.budgetCurrency || "INR",

      budgetGstStatus: values.budgetGstStatus || null,

      fundingStage: values.fundingStage || null,

      budgetFlexibility: values.budgetFlexibility || null,

      // -------------------------------------------------------
      // TIMELINE
      // -------------------------------------------------------

      desiredStartDate: values.desiredStartDate || null,

      startDateStatus: values.startDateStatus || null,

      siteHandoverDate: values.siteHandoverDate || null,

      targetCompletionDate: values.targetCompletionDate || null,

      deadlineReason: values.deadlineReason || null,

      phasingRequired: parseBoolean(values.phasingRequired),

      // -------------------------------------------------------
      // SITE RESTRICTIONS
      // -------------------------------------------------------

      societyRwaPermittedWorkTimings:
        values.societyRwaPermittedWorkTimings || null,

      nocOrSecurityDepositRequired: values.nocOrSecurityDepositRequired || null,

      structuralChangesPermitted: values.structuralChangesPermitted || null,

      materialMovementRestrictions: values.materialMovementRestrictions || null,

      neighbourSensitivities: values.neighbourSensitivities || null,

      powerAndWaterAvailability: values.powerAndWaterAvailability || null,

      accessStorageDebrisDisposal: values.accessStorageDebrisDisposal || null,

      ongoingWorkByOtherAgencies: values.ongoingWorkByOtherAgencies || null,

      // -------------------------------------------------------
      // NOTES
      // -------------------------------------------------------

      householdNotes: values.householdNotes || null,

      openPointsToClose: values.openPointsToClose || null,

      // -------------------------------------------------------
      // BRIEF ADMIN
      // -------------------------------------------------------

      briefTakenBy: values.briefTakenBy || null,

      briefTakenDate: values.briefTakenDate || null,

      // -------------------------------------------------------
      // CHILD COLLECTIONS
      // -------------------------------------------------------
      // NOTE: each key below must match the actual Sequelize model
      // column name, not a generic "name" — the DTO validates against
      // the model's enum/columns directly.

      // ProjectBriefWorkType.workType — enum, unique per brief
      workTypes: splitLines(values.workTypes).map((workType) => ({
        workType,
      })),

      // ProjectBriefService.serviceType — enum, unique per brief
      services: splitLines(values.services).map((serviceType) => ({
        serviceType,
      })),

      // ProjectBriefProcurementCategory.category — enum, unique per brief
      procurementCategories: splitLines(values.procurementCategories).map(
        (category) => ({
          category,
        }),
      ),

      // ProjectBriefSpaceRequirement.spaceName — free text, ordered
      spaceRequirements: splitLines(values.spaceRequirements).map(
        (spaceName, index) => ({
          spaceName,
          sortOrder: index,
        }),
      ),

      // ProjectBriefStyleDirection.styleDirection — enum, unique per brief
      styleDirections: splitLines(values.styleDirections).map(
        (styleDirection) => ({
          styleDirection,
        }),
      ),

      // ProjectBriefReference.description — free text, ordered
      references: splitLines(values.references).map((description, index) => ({
        description,
        sortOrder: index,
      })),

      // ProjectBriefPhase.phaseName — free text, ordered
      phases: splitLines(values.phases).map((phaseName, index) => ({
        phaseName,
        sortOrder: index,
      })),

      // ProjectBriefOccupant.name — free text, ordered (already matches)
      occupants: splitLines(values.occupants).map((name, index) => ({
        name,
        sortOrder: index,
      })),
    };
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async () => {
    if (!projectId) {
      toast.error("Select a project first");
      return;
    }

    try {
      const payload = buildPayload();

      const data = await createProjectBrief(payload).unwrap();

      toast.success(`Project brief v${data.version ?? 1} created successfully`);

      localStorage.removeItem(SAVE_KEY);

      nav(`/documents/brief/${data.id}`);
    } catch (error) {
      console.error("Project brief creation failed:", error);

      toast.error(error?.data?.message || "Failed to create project brief");
    }
  };

  return (
    <BriefSectionForm
      title="Project Brief"
      subtitle="Capture the complete client brief, project requirements, design direction, budget, timeline and site constraints."
      sections={BRIEF_SECTIONS}
      values={values}
      onFieldChange={handleFieldChange}
      projects={projects}
      projectId={projectId}
      onProjectChange={setProjectId}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
    />
  );
}
