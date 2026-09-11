import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { BriefSectionForm } from "../../components/BriefSectionForm";
import { useAutoSave } from "../../hooks/use-autosave";

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

const SAVE_KEY = "bc.project-brief.draft";

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

  const [values, setValues] = useAutoSave(SAVE_KEY, {});

  const [initialized, setInitialized] = useState(false);

  // ==========================================================
  // AUTO-SELECT BRIEF DATE (create mode only)
  // ==========================================================

  useEffect(() => {
    if (isEditMode) return;
    if (initialized) return;

    setValues((current) => {
      if (current.briefDate) return current; // already set (draft or user)
      return {
        ...current,
        briefDate: todayISO(),
      };
    });
  }, [isEditMode, initialized, setValues]);

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
