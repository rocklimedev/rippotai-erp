import React, { useEffect, useState } from "react";
import { useSharedProjectData } from "../../hooks/use-shared-project-data";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Page, EmptyState, Button } from "@/components/inos";
import { useAuth } from "../../context/AuthContext";
import { BriefSectionForm } from "../../components/BriefSectionForm";

import { useGetProjectsQuery } from "../../api/projects/project.api";
import {
  useCreateProjectBriefMutation,
  useGetProjectBriefQuery,
  useUpdateProjectBriefMutation,
} from "../../api/documents/brief.api";
import {
  PROJECT_TYPE_OPTIONS,
  SITE_TYPES_BY_PROJECT,
  SITE_CONDITIONS_BY_PROJECT,
  projectCategoryFromName,
  changeBriefSiteField,
} from "../../hooks/brief-site-options";

import { BRIEF_SECTIONS } from "../../hooks/brief-sections"; // or wherever you place the updated config
import NewProjectModal from "../../components/projects/CreateNewProject";

import {
  normalizeProjectBrief,
  buildProjectBriefPayload,
  todayISO,
} from "../../hooks/brief-form-helpers"; // adjust import path

// One-line guidance shown under each section title.
const SECTION_DESCRIPTIONS = {
  clientProject: "Who the client is and how they reached us.",
  siteProperty: "Where the site is and what exists there today.",
  scope: "What we are being hired to do and what we will procure.",
  occupants: "Who will live or work in the space and their needs.",
  spaceRequirementsSection: "Rooms or areas with specific requirements.",
  designDirection: "Style, colours, materials and must-haves.",
  references: "Links, images or projects the client likes.",
  projectPhasing: "Whether the work happens in phases, and when.",
  budget: "The budget the client has in mind and how firm it is.",
  timeline: "Target start and handover dates.",
  siteRestrictions: "Society, access and working-hour rules at the site.",
  notes: "Anything still to be confirmed with the client.",
};

// ============================================================
// COMPONENT
// ============================================================

export function BriefForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
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

  // Preselect the project when opened from a project (?project_id=…)
  const [projectId, setProjectId] = useState(
    () => searchParams.get("project_id") || searchParams.get("projectId") || "",
  );

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
      projectCategory:
        current.projectCategory ||
        projectCategoryFromName(selectedProject.project_type?.name),
    }));
  }, [projectId, projects]);
  // ==========================================================
  // FIELD CHANGE
  // ==========================================================

  useSharedProjectData(
    projectId,
    "brief",
    values,
    setValues,
    !isEditMode || initialized,
  );

  const handleFieldChange = (section, key, value) => {
    setValues((current) => changeBriefSiteField(current, key, value));
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
    if (!values.projectCategory) {
      toast.error("Select Residential, Commercial or Institutional");
      return;
    }
    if (values.siteType === "OTHER" && !values.siteTypeOther?.trim()) {
      toast.error("Enter the other site type");
      return;
    }
    if (
      values.siteCondition === "OTHER" &&
      !values.siteConditionOther?.trim()
    ) {
      toast.error("Enter the other site condition");
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
      <Page width="form">
        <EmptyState icon={Loader2} title="Loading project brief…" />
      </Page>
    );
  }

  if (isEditMode && briefError && !initialized) {
    return (
      <Page width="form">
        <EmptyState
          icon={AlertCircle}
          title="Unable to load this brief"
          text="Reload the page to try again."
          action={
            <Button onClick={() => window.location.reload()}>Reload</Button>
          }
        />
      </Page>
    );
  }

  const title = isEditMode ? "Edit project brief" : "Project brief";

  const subtitle = isEditMode
    ? "Update the client brief. Saving creates a new version of the brief document."
    : "Capture the client's requirements in one place. Produces a versioned project brief document.";

  // Inject live project type options into the sections config
  const sectionsWithProjectTypes = BRIEF_SECTIONS.map((baseSection) => {
    const section = {
      ...baseSection,
      description:
        baseSection.description || SECTION_DESCRIPTIONS[baseSection.key],
    };
    if (section.key !== "siteProperty") return section;

    return {
      ...section,
      fields: section.fields.map((field) => {
        if (field.key === "projectCategory")
          return { ...field, options: PROJECT_TYPE_OPTIONS };
        if (field.key === "siteType" || field.key === "siteCondition") {
          const groups =
            field.key === "siteType"
              ? SITE_TYPES_BY_PROJECT
              : SITE_CONDITIONS_BY_PROJECT;
          const options = groups[values.projectCategory] || [];
          // Keep legacy values visible while editing an existing brief.
          const selected = values[field.key];
          return {
            ...field,
            options:
              selected && !options.some((item) => item.value === selected)
                ? [
                    ...options,
                    {
                      value: selected,
                      label: `${selected} (previous selection)`,
                    },
                  ]
                : options,
          };
        }
        return field;
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
        crumbs={[
          { label: "CRM", to: "/crm" },
          { label: "Forms" },
          { label: isEditMode ? "Edit project brief" : "Project brief" },
        ]}
        submitLabel={isEditMode ? "Update brief" : "Save brief"}
        projectId={projectId}
        onProjectChange={setProjectId}
        onAddProject={() => setShowNewProjectModal(true)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting || projectsLoading || briefLoading}
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
