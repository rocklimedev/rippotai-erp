import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { BriefSectionForm } from "../../components/BriefSectionForm";

import { useGetProjectsQuery } from "../../api/projects/project.api";
import {
  useCreateProjectBriefMutation,
  useGetProjectBriefQuery,
  useUpdateProjectBriefMutation,
} from "../../api/documents/brief.api";
import { useGetProjectTypesQuery } from "../../api/projects/project-type.api"; // adjust path if needed

import { BRIEF_SECTIONS } from "../../hooks/brief-sections"; // or wherever you place the updated config
import NewProjectModal from "../../components/projects/CreateNewProject";

import {
  normalizeProjectBrief,
  buildProjectBriefPayload,
  todayISO,
} from "../../hooks/brief-form-helpers"; // adjust import path

// ============================================================
// OCCUPANT -> SPACE AUTO-SYNC HELPERS
// ============================================================

const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const autoSpaceName = (occupant, index) =>
  occupant?.name?.trim()
    ? `${occupant.name.trim()}'s Room`
    : `Occupant ${index + 1}'s Room`;

// Keeps the Space Requirements table in step with the Occupants table.
// - New occupant  -> new space row (tagged with autoFor = occupant._id)
// - Removed       -> its auto-created space row is removed
// - Renamed       -> its auto-created space row is renamed (unless the user
//                    edited the space name by hand)
const syncSpacesWithOccupants = (prev, next) => {
  const prevOcc = Array.isArray(prev.occupants) ? prev.occupants : [];
  const nextOcc = Array.isArray(next.occupants) ? next.occupants : [];
  let spaces = Array.isArray(next.spaceRequirements)
    ? [...next.spaceRequirements]
    : [];

  // 1. Tag new occupants and add a space row for each
  const occupants = nextOcc.map((occ, i) => {
    if (occ._id) return occ;
    const _id = uid();
    spaces.push({
      spaceName: autoSpaceName(occ, i),
      requirements: "",
      autoFor: _id,
    });
    return { ...occ, _id };
  });

  // 2. Remove auto-created spaces of deleted occupants
  const liveIds = new Set(occupants.map((o) => o._id));
  spaces = spaces.filter((s) => !s.autoFor || liveIds.has(s.autoFor));

  // 3. Rename auto-created spaces when the occupant's name changes
  spaces = spaces.map((s) => {
    if (!s.autoFor) return s;
    const idx = occupants.findIndex((o) => o._id === s.autoFor);
    if (idx < 0) return s;
    const prevIdx = prevOcc.findIndex((o) => o._id === s.autoFor);
    const prevAuto =
      prevIdx >= 0 ? autoSpaceName(prevOcc[prevIdx], prevIdx) : null;
    if (s.spaceName === prevAuto) {
      return { ...s, spaceName: autoSpaceName(occupants[idx], idx) };
    }
    return s;
  });

  return {
    ...next,
    occupants,
    spaceRequirements: spaces,
    hasSpaceRequirements:
      occupants.length > 0 ? "Yes" : next.hasSpaceRequirements,
  };
};

// ============================================================
// COMPONENT
// ============================================================

export function BriefForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEditMode = Boolean(id);

  // ==========================================================
  // PROJECTS
  // ==========================================================

  const {
    data: projects = [],
    isLoading: projectsLoading,
    refetch: refetchProjects,
  } = useGetProjectsQuery();

  // ==========================================================
  // PROJECT TYPES (for Project Type dropdown)
  // ==========================================================

  const { data: projectTypes = [], isLoading: projectTypesLoading } =
    useGetProjectTypesQuery();

  // ==========================================================
  // NEW PROJECT MODAL
  // ==========================================================

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  const handleProjectCreated = (project) => {
    refetchProjects();
    setProjectId(project.id);
  };

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

  const [values, setValues] = useState({});

  const [initialized, setInitialized] = useState(false);

  // ==========================================================
  // AUTO-SELECT BRIEF DATE (create mode only)
  // ==========================================================

  useEffect(() => {
    if (isEditMode || initialized) return;

    const currentDate = todayISO();

    setValues((current) => ({
      ...current,
      briefDate: current.briefDate || currentDate,
      briefTakenDate: current.briefTakenDate || currentDate,
      briefTakenBy: current.briefTakenBy || user?.id || "",
    }));
  }, [isEditMode, initialized, user?.id]);

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

    // Tag loaded occupants so they don't get a duplicate space auto-added
    if (Array.isArray(normalized.occupants)) {
      normalized.occupants = normalized.occupants.map((o) => ({
        ...o,
        _id: o._id || uid(),
      }));
    }

    setProjectId(existingBrief.projectId ?? "");
    setValues(normalized);
    setInitialized(true);
  }, [isEditMode, existingBrief, initialized]);

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
  // AUTO-FILL SITE ADDRESS + PROJECT TYPE FROM SELECTED PROJECT
  // ==========================================================

  useEffect(() => {
    if (!projectId) return;

    const selectedProject = projects.find((p) => p.id === projectId);
    if (!selectedProject) return;

    setValues((current) => ({
      ...current,
      siteAddress: current.siteAddress || selectedProject.site_location || "",
      projectType:
        current.projectType ||
        selectedProject.project_type_id ||
        selectedProject.project_type?.id ||
        "",
    }));
  }, [projectId, projects]);

  // ==========================================================
  // FIELD CHANGE
  // ==========================================================

  const handleFieldChange = (section, key, value) => {
    setValues((current) => {
      let next = { ...current, [key]: value };

      // Occupants -> auto-manage Space Requirements rows
      if (key === "occupants") {
        next = syncSpacesWithOccupants(current, next);
      }

      // "Material Procurement" unticked in Services -> clear its categories
      if (
        key === "services" &&
        !(Array.isArray(value) && value.includes("MATERIAL_PROCUREMENT"))
      ) {
        next.procurementCategories = [];
      }

      return next;
    });
  };

  // ==========================================================
  // BUILD PAYLOAD
  // ==========================================================

  const buildPayload = () => {
    // Strip internal helper keys (_id, autoFor) before sending to the API
    const cleaned = {
      ...values,
      occupants: (values.occupants || []).map(({ _id, ...row }) => row),
      spaceRequirements: (values.spaceRequirements || []).map(
        ({ autoFor, ...row }) => row,
      ),
    };

    return buildProjectBriefPayload(projectId, cleaned);
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

        nav(`/crm/brief/${data?.id ?? id}`);
        return;
      }

      // ======================================================
      // CREATE
      // ======================================================

      const data = await createProjectBrief(payload).unwrap();

      toast.success(
        `Project brief v${data?.version ?? 1} created successfully`,
      );

      nav(`/brief/${data.id}`);
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

  if (isEditMode && briefError && !initialized) {
    return (
      <div role="alert" className="p-8 text-sm text-destructive">
        Unable to load this brief. Reload the page to try again.
      </div>
    );
  }

  const title = isEditMode ? "Edit Project Brief" : "Project Brief";

  const subtitle = isEditMode
    ? "Update the client brief, project requirements, design direction, budget, timeline and site constraints."
    : "Capture the complete client brief, project requirements, design direction, budget, timeline and site constraints.";

  // Inject live project type options into the sections config
  const sectionsWithProjectTypes = BRIEF_SECTIONS.map((section) => {
    if (section.key !== "siteProperty") return section;

    return {
      ...section,
      fields: section.fields.map((field) => {
        if (field.key !== "projectType") return field;

        return {
          ...field,
          options: (projectTypes || []).map((pt) => ({
            value: pt.id ?? pt.value ?? pt.name,
            label: pt.name ?? pt.label ?? String(pt.id),
          })),
        };
      }),
    };
  });

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <BriefSectionForm
        title={title}
        subtitle={subtitle}
        sections={sectionsWithProjectTypes}
        values={values}
        onFieldChange={handleFieldChange}
        projects={projects}
        projectsLoading={projectsLoading}
        projectId={projectId}
        onProjectChange={setProjectId}
        onAddProject={() => setShowNewProjectModal(true)}
        onSubmit={handleSubmit}
        isSubmitting={
          isSubmitting || projectsLoading || briefLoading || projectTypesLoading
        }
      />

      <NewProjectModal
        open={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreated={handleProjectCreated}
      />
    </>
  );
}

export default BriefForm;
