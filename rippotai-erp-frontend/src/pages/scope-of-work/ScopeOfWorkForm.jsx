import React, { useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Folder, ListChecks, Loader2, FileSearch } from "lucide-react";

import { PlanOfActionSectionForm } from "../../components/plan-of-action/PlanOfActionSectionForm";
import {
  Page,
  EmptyState,
  Button,
  Field,
  TextInput,
  TextArea,
  SelectInput,
} from "@/components/inos";
import {
  Choices,
  RowCard,
  AddRowButton,
  EmptyRows,
  Callout,
} from "@/components/forms/crm-form-ui";
import { useAutoSave } from "../../hooks/use-autosave";
import { useSharedProjectData } from '../../hooks/use-shared-project-data';
import { useGetProjectsQuery } from "../../api/projects/project.api";

import {
  useCreateScopeOfWorkMutation,
  useUpdateScopeOfWorkMutation,
  useGetScopeOfWorkByIdQuery,
  useCreateProjectSpaceMutation,
  useGetProjectSpacesQuery,
  useCreateScopeItemMutation,
  useUpdateScopeItemMutation,
  useDeleteScopeItemMutation,
  useAddCategoryToProjectMutation,
  useGetProjectCategoriesQuery,
  useGetScopeCategoriesQuery,
} from "../../api/documents/scope-of-work.api";

const SAVE_KEY = "bc.scope-of-work";

const SCOPE_OF_WORK_SECTIONS = [
  { title: "Overview", type: "overview" },
  { title: "Spaces", type: "spaces" },
  { title: "Scope Items", type: "items" },
];

const PROJECT_MODE_OPTIONS = [
  { value: "TURNKEY", label: "Turnkey" },
  { value: "DESIGN_BUILD", label: "Design & build" },
  { value: "DESIGN_ONLY", label: "Design only" },
  { value: "EXECUTION_ONLY", label: "Execution only" },
  { value: "CONSULTANCY", label: "Consultancy" },
  { value: "OTHER", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "REVIEW", label: "Under review" },
  { value: "APPROVED", label: "Approved" },
  { value: "ACCEPTED", label: "Accepted" },
];

// ============================================================
// SLUG HELPERS
// ============================================================

const slugify = (text) =>
  (text || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const generateUniqueSlug = (name, existingSlugs) => {
  const base = slugify(name) || "space";
  let slug = base;
  let counter = 2;

  while (existingSlugs.has(slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
};

export function ScopeOfWorkForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: scopeOfWorkId } = useParams();

  const isEditMode = Boolean(scopeOfWorkId);

  // ============================================================
  // PROJECTS
  // ============================================================

  const { data: projects = [] } = useGetProjectsQuery();

  // ============================================================
  // PROJECT
  // ============================================================

  const initialProjectId = searchParams.get("project_id") || searchParams.get("projectId") || "";

  const [projectId, setProjectId] = React.useState(initialProjectId);

  // Inline errors appear only after the first submit attempt
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  // ============================================================
  // FORM STATE
  // ============================================================

  const draftKey = `${SAVE_KEY}.${scopeOfWorkId || projectId || 'new'}`;
  const [values, setValues] = useAutoSave(draftKey, {
    Overview: {
      scope_summary: "",
      specific_exclusions: "",
      notes: "",
      project_mode: "",

      status: "DRAFT",
    },

    Spaces: [],

    Categories: [],

    Items: [],
  });
  useSharedProjectData(projectId, 'scope', values, setValues, !scopeOfWorkId);

  // ============================================================
  // LOAD EXISTING SCOPE OF WORK
  // ============================================================

  const {
    data: existingScopeOfWork,
    isLoading: isLoadingScopeOfWork,
    isFetching: isFetchingScopeOfWork,
  } = useGetScopeOfWorkByIdQuery(scopeOfWorkId, {
    skip: !scopeOfWorkId,
  });

  // ============================================================
  // API MUTATIONS
  // ============================================================

  const [createScopeOfWork, { isLoading: isCreating }] =
    useCreateScopeOfWorkMutation();

  const [updateScopeOfWork, { isLoading: isUpdating }] =
    useUpdateScopeOfWorkMutation();

  const [createProjectSpace, { isLoading: isCreatingSpace }] =
    useCreateProjectSpaceMutation();

  const [createScopeItem, { isLoading: isCreatingItem }] =
    useCreateScopeItemMutation();

  const [updateScopeItem, { isLoading: isUpdatingItem }] =
    useUpdateScopeItemMutation();

  const [deleteScopeItem, { isLoading: isDeletingItem }] =
    useDeleteScopeItemMutation();

  const [addCategoryToProject, { isLoading: isAddingCategory }] =
    useAddCategoryToProjectMutation();

  // ============================================================
  // PROJECT DATA
  // ============================================================

  const { data: projectSpaces = [] } = useGetProjectSpacesQuery(projectId, {
    skip: !projectId,
  });

  const { data: projectCategories = [] } = useGetProjectCategoriesQuery(
    projectId,
    {
      skip: !projectId,
    },
  );

  const { data: scopeCategories = [] } = useGetScopeCategoriesQuery();

  // ============================================================
  // LOAD EXISTING DATA INTO FORM
  // ============================================================

  useEffect(() => {
    if (!existingScopeOfWork) return;

    // ----------------------------------------------------------
    // PROJECT
    // ----------------------------------------------------------

    if (existingScopeOfWork.projectId) {
      setProjectId(existingScopeOfWork.projectId);
    }

    // ----------------------------------------------------------
    // SPACES
    //
    // Your GET response does not contain a top-level spaces[]
    // array. Spaces are available through:
    //
    // items[].projectSpace
    //
    // So we extract unique spaces from the items.
    // ----------------------------------------------------------

    const uniqueSpaces = new Map();

    (existingScopeOfWork.items || []).forEach((item) => {
      const space = item.projectSpace;

      if (space?.id) {
        uniqueSpaces.set(space.id, {
          id: space.id,

          name: space.name || "",

          description: space.description || "",

          sort_order: space.sortOrder || 1,

          slug: space.slug || "",
        });
      }
    });

    // ----------------------------------------------------------
    // CATEGORIES
    //
    // Extract unique categories from items.
    // ----------------------------------------------------------

    const uniqueCategories = new Map();

    (existingScopeOfWork.items || []).forEach((item) => {
      const category = item.scopeCategory;

      if (category?.id) {
        uniqueCategories.set(category.id, {
          id: category.id,

          name: category.name || "",

          description: category.description || "",

          sort_order: category.sortOrder || 1,
        });
      }
    });

    // ----------------------------------------------------------
    // MAP API RESPONSE → FORM STATE
    // ----------------------------------------------------------

    const mappedValues = {
      Overview: {
        scope_summary: existingScopeOfWork.scopeSummary || "",

        specific_exclusions: existingScopeOfWork.specificExclusions || "",

        notes: existingScopeOfWork.notes || "",

        project_mode: existingScopeOfWork.projectMode || "",

        status: existingScopeOfWork.status || "DRAFT",
      },

      Spaces: Array.from(uniqueSpaces.values()),

      Categories: Array.from(uniqueCategories.values()),

      Items: (existingScopeOfWork.items || []).map((item) => ({
        id: item.id,

        project_space_id: item.projectSpaceId || "",

        scope_category_id: item.scopeCategoryId || "",

        scope_of_work: item.scopeOfWork || "",

        is_included: item.isIncluded !== false,

        is_excluded: item.isExcluded === true,

        notes: item.notes || "",

        sort_order: item.sortOrder || 1,
      })),
    };

    setValues(mappedValues);
  }, [existingScopeOfWork, setValues]);

  // ============================================================
  // GENERIC FIELD CHANGE
  // ============================================================

  const handleFieldChange = (section, key, value) => {
    setValues((prev) => ({
      ...prev,

      [section]: {
        ...(prev[section] || {}),
        [key]: value,
      },
    }));
  };

  // ============================================================
  // DERIVED STATE
  // ============================================================

  const overview = values.Overview || {};

  const spaces = values.Spaces || [];

  const categories = values.Categories || [];

  const items = values.Items || [];

  const summaryError = submitAttempted && !overview.scope_summary?.trim();
  const spacesTouched = submitAttempted;
  const itemsTouched = submitAttempted;

  // ============================================================
  // OVERVIEW SECTION
  // ============================================================

  const renderOverviewSection = () => (
    <div className="inos-form-grid">
      <Field label="Project mode" full>
        <Choices
          name="Project mode"
          value={overview.project_mode || ""}
          options={PROJECT_MODE_OPTIONS}
          columns={3}
          onChange={(value) =>
            handleFieldChange("Overview", "project_mode", value)
          }
        />
      </Field>

      <Field label="Status" full hint="Keep as draft until the client has reviewed it.">
        <Choices
          name="Status"
          value={overview.status || "DRAFT"}
          options={STATUS_OPTIONS}
          columns={4}
          onChange={(value) => handleFieldChange("Overview", "status", value)}
        />
      </Field>

      <Field
        label="Scope summary"
        required
        full
        error={summaryError ? "Enter the scope summary." : undefined}
      >
        <TextArea
          rows={5}
          value={overview.scope_summary || ""}
          invalid={summaryError}
          onChange={(e) =>
            handleFieldChange("Overview", "scope_summary", e.target.value)
          }
          placeholder="e.g. Complete interior fit-out of a 3BHK apartment including civil, electrical, plumbing and furniture."
        />
      </Field>

      <Field label="Specific exclusions" full hint="One exclusion per line reads best in the document.">
        <TextArea
          rows={4}
          value={overview.specific_exclusions || ""}
          onChange={(e) =>
            handleFieldChange(
              "Overview",
              "specific_exclusions",
              e.target.value,
            )
          }
          placeholder="e.g. Loose furniture, appliances, structural changes"
        />
      </Field>

      <Field label="Notes" optional full>
        <TextArea
          rows={3}
          value={overview.notes || ""}
          onChange={(e) =>
            handleFieldChange("Overview", "notes", e.target.value)
          }
          placeholder="Anything else the team should know"
        />
      </Field>
    </div>
  );

  // ============================================================
  // SPACES SECTION
  // ============================================================

  const renderSpacesSection = () => {
    const addSpace = () => {
      setValues((prev) => ({
        ...prev,

        Spaces: [
          ...(prev.Spaces || []),

          {
            id: crypto.randomUUID(),

            name: "",

            description: "",

            slug: "",

            sort_order: (prev.Spaces || []).length + 1,
          },
        ],
      }));
    };

    const updateSpace = (index, field, value) => {
      setValues((prev) => {
        const currentSpaces = prev.Spaces || [];

        // ------------------------------------------------------
        // Whenever the name changes, (re)derive a unique slug
        // from it so the payload never ships an empty slug.
        // Uniqueness is checked against both already-saved
        // project spaces and the other spaces in this form.
        // ------------------------------------------------------

        if (field === "name") {
          const existingSlugs = new Set([
            ...projectSpaces.map((space) => space.slug).filter(Boolean),

            ...currentSpaces
              .filter((_, i) => i !== index)
              .map((space) => space.slug)
              .filter(Boolean),
          ]);

          const newSlug = generateUniqueSlug(value, existingSlugs);

          return {
            ...prev,

            Spaces: currentSpaces.map((space, i) =>
              i === index
                ? {
                    ...space,
                    name: value,
                    slug: newSlug,
                  }
                : space,
            ),
          };
        }

        return {
          ...prev,

          Spaces: currentSpaces.map((space, i) =>
            i === index
              ? {
                  ...space,
                  [field]: value,
                }
              : space,
          ),
        };
      });
    };

    const removeSpace = (index) => {
      setValues((prev) => ({
        ...prev,

        Spaces: (prev.Spaces || []).filter((_, i) => i !== index),
      }));
    };

    return (
      <>
        {projectSpaces.length > 0 && (
          <Callout title={`${projectSpaces.length} space${projectSpaces.length > 1 ? "s" : ""} already on this project`}>
            {projectSpaces.map((space) => space.name).join(", ")}. These are available for scope items without adding them again.
          </Callout>
        )}

        {spaces.length === 0 ? (
          <EmptyRows
            icon={Folder}
            title="No new spaces added"
            text="Add spaces such as Living room, Kitchen, Master bedroom or Bathroom."
          />
        ) : (
          <div className="crmf-rows">
            {spaces.map((space, index) => {
              const missingName = spacesTouched && !space.name?.trim();
              return (
                <RowCard
                  key={space.id}
                  index={index + 1}
                  title={space.name?.trim() || `Space ${index + 1}`}
                  meta={space.slug ? `/${space.slug}` : undefined}
                  onRemove={() => removeSpace(index)}
                  removeLabel="Remove space"
                >
                  <div className="inos-form-grid">
                    <Field label="Space name" required error={missingName ? "Name this space." : undefined}>
                      <TextInput
                        value={space.name || ""}
                        invalid={missingName}
                        autoFocus={!space.name}
                        onChange={(e) => updateSpace(index, "name", e.target.value)}
                        placeholder="e.g. Living room"
                      />
                    </Field>

                    <Field label="Description" optional>
                      <TextInput
                        value={space.description || ""}
                        onChange={(e) =>
                          updateSpace(index, "description", e.target.value)
                        }
                        placeholder="e.g. Double-height living with balcony"
                      />
                    </Field>
                  </div>
                </RowCard>
              );
            })}
          </div>
        )}

        <AddRowButton onClick={addSpace}>
          {spaces.length ? "Add space" : "Add first space"}
        </AddRowButton>
      </>
    );
  };

  // ============================================================
  // ITEMS SECTION
  // ============================================================

  const renderItemsSection = () => {
    const addItem = () => {
      setValues((prev) => ({
        ...prev,

        Items: [
          ...(prev.Items || []),

          {
            id: crypto.randomUUID(),

            project_space_id: "",

            scope_category_id: "",

            scope_of_work: "",

            is_included: true,

            is_excluded: false,

            notes: "",

            sort_order: (prev.Items || []).length + 1,
          },
        ],
      }));
    };

    const updateItem = (index, field, value) => {
      setValues((prev) => ({
        ...prev,

        Items: (prev.Items || []).map((item, i) =>
          i === index
            ? {
                ...item,
                [field]: value,
              }
            : item,
        ),
      }));
    };

    const removeItem = (index) => {
      setValues((prev) => ({
        ...prev,

        Items: (prev.Items || []).filter((_, i) => i !== index),
      }));
    };

    const spaceOptions = [
      ...projectSpaces,
      ...spaces.filter(
        (space) => !projectSpaces.some((existing) => existing.id === space.id),
      ),
    ];

    return (
      <>
        {items.length === 0 ? (
          <EmptyRows
            icon={ListChecks}
            title="No scope items yet"
            text="Add the detailed work for each space — what is included and what is excluded."
          />
        ) : (
          <div className="crmf-rows">
            {items.map((item, index) => {
              const spaceName = spaceOptions.find(
                (s) => s.id === item.project_space_id,
              )?.name;
              const categoryName = scopeCategories.find(
                (c) => c.id === item.scope_category_id,
              )?.name;
              const showErrors = itemsTouched;

              return (
                <RowCard
                  key={item.id}
                  index={index + 1}
                  title={
                    [spaceName, categoryName].filter(Boolean).join(" · ") ||
                    `Scope item ${index + 1}`
                  }
                  meta={item.is_excluded ? "Excluded" : "Included"}
                  onRemove={() => removeItem(index)}
                  removeLabel="Remove scope item"
                >
                  <div className="inos-form-grid">
                    <Field
                      label="Space"
                      required
                      error={showErrors && !item.project_space_id ? "Pick a space." : undefined}
                      hint={spaceOptions.length ? undefined : "Add a space in the section above first."}
                    >
                      <SelectInput
                        value={item.project_space_id || ""}
                        invalid={showErrors && !item.project_space_id}
                        onChange={(e) =>
                          updateItem(index, "project_space_id", e.target.value)
                        }
                        placeholder="Select space"
                      >
                        {spaceOptions.map((space) => (
                          <option key={space.id} value={space.id}>
                            {space.name || "(unnamed space)"}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>

                    <Field
                      label="Category"
                      required
                      error={showErrors && !item.scope_category_id ? "Pick a category." : undefined}
                    >
                      <SelectInput
                        value={item.scope_category_id || ""}
                        invalid={showErrors && !item.scope_category_id}
                        onChange={(e) =>
                          updateItem(index, "scope_category_id", e.target.value)
                        }
                        placeholder="Select category"
                      >
                        {scopeCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>

                    <Field
                      label="Scope of work"
                      required
                      full
                      error={showErrors && !item.scope_of_work?.trim() ? "Describe the work." : undefined}
                    >
                      <TextArea
                        rows={3}
                        value={item.scope_of_work || ""}
                        invalid={showErrors && !item.scope_of_work?.trim()}
                        onChange={(e) =>
                          updateItem(index, "scope_of_work", e.target.value)
                        }
                        placeholder="e.g. Supply and install 600×1200 vitrified tiles with skirting"
                      />
                    </Field>

                    <Field label="Inclusion">
                      <Choices
                        name="Inclusion"
                        columns={2}
                        value={item.is_excluded ? "excluded" : "included"}
                        options={[
                          { value: "included", label: "Included" },
                          { value: "excluded", label: "Excluded" },
                        ]}
                        onChange={(value) => {
                          const excluded = value === "excluded";

                          setValues((prev) => ({
                            ...prev,

                            Items: (prev.Items || []).map((currentItem, i) =>
                              i === index
                                ? {
                                    ...currentItem,

                                    is_excluded: excluded,

                                    is_included: !excluded,
                                  }
                                : currentItem,
                            ),
                          }));
                        }}
                      />
                    </Field>

                    <Field label="Notes" optional>
                      <TextInput
                        value={item.notes || ""}
                        onChange={(e) =>
                          updateItem(index, "notes", e.target.value)
                        }
                        placeholder="e.g. Client to approve tile sample"
                      />
                    </Field>
                  </div>
                </RowCard>
              );
            })}
          </div>
        )}

        <AddRowButton onClick={addItem}>
          {items.length ? "Add scope item" : "Add first scope item"}
        </AddRowButton>
      </>
    );
  };

  // ============================================================
  // SECTION ROUTER
  // ============================================================

  const renderSection = (section) => {
    if (section.type === "overview") {
      return renderOverviewSection();
    }

    if (section.type === "spaces") {
      return renderSpacesSection();
    }

    if (section.type === "items") {
      return renderItemsSection();
    }

    return null;
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!projectId) {
      return toast.error("Please select a project.");
    }

    if (!overview.scope_summary?.trim()) {
      return toast.error("Please enter the scope summary.");
    }

    // ----------------------------------------------------------
    // SPACE VALIDATION
    // ----------------------------------------------------------

    const incompleteSpaces = spaces.filter((space) => !space.name?.trim());

    if (incompleteSpaces.length > 0) {
      return toast.error(
        `${incompleteSpaces.length} space${
          incompleteSpaces.length > 1 ? "s are" : " is"
        } missing a name.`,
      );
    }

    // ----------------------------------------------------------
    // ITEM VALIDATION
    // ----------------------------------------------------------

    const incompleteItems = items.filter(
      (item) =>
        !item.project_space_id ||
        !item.scope_category_id ||
        !item.scope_of_work?.trim(),
    );

    if (incompleteItems.length > 0) {
      return toast.error(
        `${incompleteItems.length} scope item${
          incompleteItems.length > 1 ? "s are" : " is"
        } incomplete.`,
      );
    }

    try {
      // ========================================================
      // 1. CREATE OR UPDATE SCOPE OF WORK
      // ========================================================

      let scopeOfWork;

      if (isEditMode) {
        // ------------------------------------------------------
        // UPDATE
        // ------------------------------------------------------

        scopeOfWork = await updateScopeOfWork({
          id: scopeOfWorkId,

          body: {
            scopeSummary: overview.scope_summary?.trim() || undefined,

            specificExclusions:
              overview.specific_exclusions?.trim() || undefined,

            notes: overview.notes?.trim() || undefined,

            projectMode: overview.project_mode || undefined,

            status: overview.status || "DRAFT",
          },
        }).unwrap();
      } else {
        // ------------------------------------------------------
        // CREATE
        // ------------------------------------------------------

        scopeOfWork = await createScopeOfWork({
          projectId,

          body: {
            scopeSummary: overview.scope_summary?.trim() || undefined,

            specificExclusions:
              overview.specific_exclusions?.trim() || undefined,

            notes: overview.notes?.trim() || undefined,

            projectMode: overview.project_mode || undefined,

            status: overview.status || "DRAFT",
          },
        }).unwrap();
      }

      // --------------------------------------------------------
      // Determine final SOW ID
      // --------------------------------------------------------

      const finalScopeOfWorkId =
        scopeOfWork?.id || existingScopeOfWork?.id || scopeOfWorkId;

      // ========================================================
      // 2. BUILD SPACE ID MAP
      // ========================================================

      const spaceIdMap = new Map();

      // --------------------------------------------------------
      // Existing DB spaces
      // --------------------------------------------------------

      projectSpaces.forEach((space) => {
        spaceIdMap.set(space.id, space.id);
      });

      // ========================================================
      // 3. CREATE ONLY NEW SPACES
      //
      // Every new space needs a unique slug or the backend
      // silently drops it. We derive one from the name (it was
      // already computed on name-change in updateSpace, but we
      // re-check/regenerate here too in case a space was loaded
      // without one or a collision slipped through) and track
      // slugs already used in this project + this submit batch
      // so two new spaces can never collide with each other.
      // ========================================================

      const usedSlugs = new Set(
        projectSpaces.map((space) => space.slug).filter(Boolean),
      );

      for (let index = 0; index < spaces.length; index++) {
        const space = spaces[index];

        // ------------------------------------------------------
        // Check if this space already exists
        // ------------------------------------------------------

        const existingSpace = projectSpaces.find(
          (projectSpace) => projectSpace.id === space.id,
        );

        if (existingSpace) {
          // Existing DB space
          spaceIdMap.set(space.id, space.id);

          if (existingSpace.slug) {
            usedSlugs.add(existingSpace.slug);
          }

          continue;
        }

        // ------------------------------------------------------
        // New frontend-only space — ensure a unique slug
        // ------------------------------------------------------

        const slug =
          space.slug && !usedSlugs.has(space.slug)
            ? space.slug
            : generateUniqueSlug(space.name, usedSlugs);

        usedSlugs.add(slug);

        const createdSpace = await createProjectSpace({
          projectId,

          body: {
            name: space.name.trim(),

            slug,

            description: space.description?.trim() || undefined,

            sortOrder: index + 1,

            isActive: true,
          },
        }).unwrap();

        // ------------------------------------------------------
        // Map temporary frontend ID → real DB ID
        // ------------------------------------------------------

        spaceIdMap.set(space.id, createdSpace.id);
      }

      // ========================================================
      // 4. DELETE REMOVED ITEMS
      // ========================================================

      if (isEditMode && existingScopeOfWork?.items) {
        const originalItemIds = new Set(
          existingScopeOfWork.items.map((item) => item.id),
        );

        const currentItemIds = new Set(
          items.filter((item) => item.id).map((item) => item.id),
        );

        for (const originalItemId of originalItemIds) {
          if (!currentItemIds.has(originalItemId)) {
            await deleteScopeItem(originalItemId).unwrap();
          }
        }
      }

      // ========================================================
      // 5. CREATE / UPDATE SCOPE ITEMS
      // ========================================================

      for (let index = 0; index < items.length; index++) {
        const item = items[index];

        // ------------------------------------------------------
        // Resolve real space ID
        // ------------------------------------------------------

        const realSpaceId = spaceIdMap.get(item.project_space_id);

        if (!realSpaceId) {
          console.warn(
            `Skipping item ${index + 1}: could not resolve space ID`,
            item.project_space_id,
          );

          continue;
        }

        // ------------------------------------------------------
        // Item body
        // ------------------------------------------------------

        const itemBody = {
          projectSpaceId: realSpaceId,

          scopeCategoryId: item.scope_category_id,

          scopeOfWork: item.scope_of_work?.trim(),

          isIncluded: item.is_included !== false,

          isExcluded: item.is_excluded === true,

          notes: item.notes?.trim() || undefined,

          sortOrder: index + 1,
        };

        // ======================================================
        // EXISTING ITEM → UPDATE
        // ======================================================

        if (
          isEditMode &&
          item.id &&
          existingScopeOfWork?.items?.some(
            (existingItem) => existingItem.id === item.id,
          )
        ) {
          await updateScopeItem({
            id: item.id,

            body: itemBody,
          }).unwrap();

          continue;
        }

        // ======================================================
        // NEW ITEM → CREATE
        // ======================================================

        await createScopeItem({
          projectId,

          body: {
            scopeOfWorkId: finalScopeOfWorkId,

            ...itemBody,
          },
        }).unwrap();
      }

      // ========================================================
      // SUCCESS
      // ========================================================

      toast.success(
        isEditMode
          ? "Scope of Work updated successfully."
          : "Scope of Work created successfully.",
      );

      // --------------------------------------------------------
      // Clear autosave
      // --------------------------------------------------------

      localStorage.removeItem(draftKey);

      // --------------------------------------------------------
      // Navigate to document
      // --------------------------------------------------------

      navigate(`/documents/scope-of-work/${finalScopeOfWorkId}`);
    } catch (error) {
      console.error("Scope of Work save failed:", error);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to save Scope of Work.",
      );
    }
  };

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (isEditMode && (isLoadingScopeOfWork || isFetchingScopeOfWork)) {
    return (
      <Page width="form">
        <EmptyState icon={Loader2} title="Loading scope of work…" />
      </Page>
    );
  }

  // ============================================================
  // NOT FOUND
  // ============================================================

  if (isEditMode && !isLoadingScopeOfWork && !existingScopeOfWork) {
    return (
      <Page width="form">
        <EmptyState
          icon={FileSearch}
          title="Scope of work not found"
          text="The requested scope of work could not be loaded."
          action={
            <Button onClick={() => navigate("/documents/scope-of-work")}>
              Back to scope of work
            </Button>
          }
        />
      </Page>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <PlanOfActionSectionForm
      title={isEditMode ? "Edit scope of work" : "Scope of work"}
      subtitle={
        isEditMode
          ? "Update what is included, the spaces covered and each work item."
          : "Define what is included, the spaces covered and each work item. Produces the scope of work document."
      }
      crumbs={[
        { label: "CRM", to: "/crm" },
        { label: "Forms" },
        { label: isEditMode ? "Edit scope of work" : "Scope of work" },
      ]}
      submitLabel={isEditMode ? "Update scope of work" : "Save scope of work"}
      sections={SCOPE_OF_WORK_SECTIONS}
      sectionMeta={{
        Overview: {
          description: "Project mode, summary and what is excluded.",
          done: Boolean(overview.scope_summary?.trim()),
        },
        Spaces: {
          description:
            "Rooms or areas this scope covers. Existing project spaces are reused.",
          done: spaces.length > 0 || projectSpaces.length > 0,
          count: spaces.length,
        },
        "Scope Items": {
          description:
            "Each piece of work, tied to a space and category, marked included or excluded.",
          done: items.length > 0,
          count: items.length,
        },
      }}
      onSaveDraft={() => {
        try {
          localStorage.setItem(draftKey, JSON.stringify(values));
          toast.success("Draft saved on this device.");
        } catch {
          toast.error("Could not save the draft.");
        }
      }}
      values={values}
      onFieldChange={handleFieldChange}
      projects={projects}
      projectId={projectId}
      onProjectChange={setProjectId}
      onSubmit={handleSubmit}
      isSubmitting={
        isCreating ||
        isUpdating ||
        isCreatingSpace ||
        isCreatingItem ||
        isUpdatingItem ||
        isDeletingItem ||
        isAddingCategory
      }
      renderSection={renderSection}
    />
  );
}
