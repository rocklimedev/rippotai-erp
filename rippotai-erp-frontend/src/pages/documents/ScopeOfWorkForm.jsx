import React, { useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, Folder, ListChecks } from "lucide-react";

import { PaymentSectionForm } from "../../components/payments/PaymentSectionForm";
import { useAutoSave } from "../../hooks/use-autosave";
import { useGetProjectsQuery } from "../../api/project.api";

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
} from "../../api/scope-of-work.api";

const SAVE_KEY = "bc.scope-of-work";

const SCOPE_OF_WORK_SECTIONS = [
  { title: "Overview", type: "overview" },
  { title: "Spaces", type: "spaces" },
  { title: "Scope Items", type: "items" },
  { title: "Review", type: "review" },
];

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

  const initialProjectId = searchParams.get("project_id") || "";

  const [projectId, setProjectId] = React.useState(initialProjectId);

  // ============================================================
  // FORM STATE
  // ============================================================

  const [values, setValues] = useAutoSave(SAVE_KEY, {
    Overview: {
      scope_summary: "",
      specific_exclusions: "",
      notes: "",
      project_mode: "",
      version: "1",
      status: "DRAFT",
    },

    Spaces: [],

    Categories: [],

    Items: [],
  });

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

          slug: space.slug || "",

          description: space.description || "",

          sort_order: space.sortOrder || 1,
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

          slug: category.slug || "",

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

        version: String(existingScopeOfWork.version || 1),

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

  // ============================================================
  // OVERVIEW SECTION
  // ============================================================

  const renderOverviewSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Scope of Work Overview</h3>

        <p className="text-sm text-[#6B7B7C] mt-1">
          Define the overall scope, exclusions, project mode and document
          status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PROJECT MODE */}

        <div>
          <label className="bc-label">Project Mode</label>

          <select
            className="bc-input w-full"
            value={overview.project_mode || ""}
            onChange={(e) =>
              handleFieldChange("Overview", "project_mode", e.target.value)
            }
          >
            <option value="">Select Project Mode</option>

            <option value="TURNKEY">Turnkey</option>

            <option value="DESIGN_BUILD">Design & Build</option>

            <option value="DESIGN_ONLY">Design Only</option>

            <option value="EXECUTION_ONLY">Execution Only</option>

            <option value="CONSULTANCY">Consultancy</option>

            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* VERSION */}

        <div>
          <label className="bc-label">Version</label>

          <input
            type="number"
            min="1"
            value={overview.version || "1"}
            onChange={(e) =>
              handleFieldChange("Overview", "version", e.target.value)
            }
            className="bc-input w-full"
          />
        </div>

        {/* STATUS */}

        <div>
          <label className="bc-label">Status</label>

          <select
            className="bc-input w-full"
            value={overview.status || "DRAFT"}
            onChange={(e) =>
              handleFieldChange("Overview", "status", e.target.value)
            }
          >
            <option value="DRAFT">Draft</option>

            <option value="REVIEW">Under Review</option>

            <option value="APPROVED">Approved</option>

            <option value="ACCEPTED">Accepted</option>
          </select>
        </div>

        {/* SCOPE SUMMARY */}

        <div className="md:col-span-2">
          <label className="bc-label">Scope Summary</label>

          <textarea
            rows={6}
            value={overview.scope_summary || ""}
            onChange={(e) =>
              handleFieldChange("Overview", "scope_summary", e.target.value)
            }
            placeholder="Describe the overall scope of work..."
            className="bc-input w-full"
          />
        </div>

        {/* EXCLUSIONS */}

        <div className="md:col-span-2">
          <label className="bc-label">Specific Exclusions</label>

          <textarea
            rows={5}
            value={overview.specific_exclusions || ""}
            onChange={(e) =>
              handleFieldChange(
                "Overview",
                "specific_exclusions",
                e.target.value,
              )
            }
            placeholder="List anything specifically excluded from the scope..."
            className="bc-input w-full"
          />
        </div>

        {/* NOTES */}

        <div className="md:col-span-2">
          <label className="bc-label">Notes</label>

          <textarea
            rows={4}
            value={overview.notes || ""}
            onChange={(e) =>
              handleFieldChange("Overview", "notes", e.target.value)
            }
            placeholder="Additional notes..."
            className="bc-input w-full"
          />
        </div>
      </div>
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

            slug: "",

            description: "",

            sort_order: (prev.Spaces || []).length + 1,
          },
        ],
      }));
    };

    const updateSpace = (index, field, value) => {
      setValues((prev) => ({
        ...prev,

        Spaces: (prev.Spaces || []).map((space, i) =>
          i === index
            ? {
                ...space,
                [field]: value,
              }
            : space,
        ),
      }));
    };

    const removeSpace = (index) => {
      setValues((prev) => ({
        ...prev,

        Spaces: (prev.Spaces || []).filter((_, i) => i !== index),
      }));
    };

    return (
      <div className="space-y-6">
        {/* HEADER */}

        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold">Project Spaces</h3>

            <p className="text-sm text-[#6B7B7C] mt-1">
              Define the spaces or areas covered by this project.
            </p>
          </div>

          <button
            type="button"
            onClick={addSpace}
            className="flex items-center gap-2 bg-[#1F453B] text-white px-4 py-2 rounded-lg text-sm"
          >
            <Plus size={16} />
            Add Space
          </button>
        </div>

        {/* EMPTY */}

        {spaces.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
            <Folder size={28} className="mx-auto text-[#94A3A5] mb-2" />

            <p className="text-gray-500">No spaces added yet.</p>

            <p className="text-xs text-[#94A3A5] mt-1">
              Add spaces such as Living Room, Kitchen, Bedroom, Bathroom, etc.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {spaces.map((space, index) => (
              <div
                key={space.id}
                className="border border-gray-200 rounded-xl p-5 bg-white"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#1F453B] text-white flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>

                    <span className="font-semibold">Space {index + 1}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSpace(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Remove space"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* NAME */}

                  <div>
                    <label className="bc-label">Space Name</label>

                    <input
                      type="text"
                      value={space.name || ""}
                      onChange={(e) =>
                        updateSpace(index, "name", e.target.value)
                      }
                      placeholder="e.g. Living Room"
                      className="bc-input w-full"
                    />
                  </div>

                  {/* SLUG */}

                  <div>
                    <label className="bc-label">Slug</label>

                    <input
                      type="text"
                      value={space.slug || ""}
                      onChange={(e) =>
                        updateSpace(index, "slug", e.target.value)
                      }
                      placeholder="living-room"
                      className="bc-input w-full"
                    />
                  </div>

                  {/* DESCRIPTION */}

                  <div className="md:col-span-2">
                    <label className="bc-label">Description</label>

                    <textarea
                      rows={3}
                      value={space.description || ""}
                      onChange={(e) =>
                        updateSpace(index, "description", e.target.value)
                      }
                      placeholder="Describe this space..."
                      className="bc-input w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EXISTING PROJECT SPACES */}

        {projectSpaces.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Existing Project Spaces</h4>

            <div className="grid md:grid-cols-2 gap-3">
              {projectSpaces.map((space) => (
                <div key={space.id} className="border rounded-lg p-3">
                  <div className="font-medium">{space.name}</div>

                  {space.description && (
                    <div className="text-xs text-[#6B7B7C] mt-1">
                      {space.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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

    return (
      <div className="space-y-6">
        {/* HEADER */}

        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold">Scope Items</h3>

            <p className="text-sm text-[#6B7B7C] mt-1">
              Define the detailed scope of work for each project space and
              category.
            </p>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-2 bg-[#1F453B] text-white px-4 py-2 rounded-lg text-sm"
          >
            <Plus size={16} />
            Add Scope Item
          </button>
        </div>

        {/* EMPTY */}

        {items.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
            <ListChecks size={28} className="mx-auto text-[#94A3A5] mb-2" />

            <p className="text-gray-500">No scope items added yet.</p>

            <p className="text-xs text-[#94A3A5] mt-1">
              Add the detailed work included or excluded from the project.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* ITEM HEADER */}

                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#1F453B] text-white flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>

                    <span className="font-semibold">
                      Scope Item {index + 1}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* ITEM BODY */}

                <div className="p-5 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PROJECT SPACE */}

                    <div>
                      <label className="bc-label">Project Space</label>

                      <select
                        className="bc-input w-full"
                        value={item.project_space_id || ""}
                        onChange={(e) =>
                          updateItem(index, "project_space_id", e.target.value)
                        }
                      >
                        <option value="">Select Space</option>

                        {[
                          ...projectSpaces,
                          ...spaces.filter(
                            (space) =>
                              !projectSpaces.some(
                                (existing) => existing.id === space.id,
                              ),
                          ),
                        ].map((space) => (
                          <option key={space.id} value={space.id}>
                            {space.name || "(unnamed space)"}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* CATEGORY */}

                    <div>
                      <label className="bc-label">Scope Category</label>

                      <select
                        className="bc-input w-full"
                        value={item.scope_category_id || ""}
                        onChange={(e) =>
                          updateItem(index, "scope_category_id", e.target.value)
                        }
                      >
                        <option value="">Select Category</option>

                        {scopeCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* SCOPE OF WORK */}

                    <div className="md:col-span-2">
                      <label className="bc-label">Scope of Work</label>

                      <textarea
                        rows={5}
                        value={item.scope_of_work || ""}
                        onChange={(e) =>
                          updateItem(index, "scope_of_work", e.target.value)
                        }
                        placeholder="Describe the work to be carried out..."
                        className="bc-input w-full"
                      />
                    </div>

                    {/* INCLUSION */}

                    <div>
                      <label className="bc-label">Inclusion</label>

                      <select
                        className="bc-input w-full"
                        value={item.is_excluded ? "excluded" : "included"}
                        onChange={(e) => {
                          const excluded = e.target.value === "excluded";

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
                      >
                        <option value="included">Included</option>

                        <option value="excluded">Excluded</option>
                      </select>
                    </div>

                    {/* NOTES */}

                    <div>
                      <label className="bc-label">Notes</label>

                      <textarea
                        rows={3}
                        value={item.notes || ""}
                        onChange={(e) =>
                          updateItem(index, "notes", e.target.value)
                        }
                        placeholder="Additional notes..."
                        className="bc-input w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // REVIEW SECTION
  // ============================================================

  const renderReviewSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Review Scope of Work</h3>

        <p className="text-sm text-[#6B7B7C] mt-1">
          Review the information before {isEditMode ? "updating" : "creating"}{" "}
          the Scope of Work document.
        </p>
      </div>

      {/* PROJECT */}

      <div className="border rounded-xl p-4">
        <div className="text-xs uppercase tracking-widest text-[#6B7B7C] mb-2">
          Project
        </div>

        <div className="font-semibold">
          {projects.find((p) => p.id === projectId)?.name ||
            existingScopeOfWork?.project?.name ||
            "No project selected"}
        </div>
      </div>

      {/* OVERVIEW */}

      <div className="border rounded-xl p-4">
        <div className="text-xs uppercase tracking-widest text-[#6B7B7C] mb-3">
          Overview
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-[#94A3A5]">Project Mode</div>

            <div className="font-medium">{overview.project_mode || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-[#94A3A5]">Version</div>

            <div className="font-medium">v{overview.version || 1}</div>
          </div>

          <div>
            <div className="text-xs text-[#94A3A5]">Status</div>

            <div className="font-medium">{overview.status || "DRAFT"}</div>
          </div>
        </div>

        {/* SUMMARY */}

        <div className="mt-4">
          <div className="text-xs text-[#94A3A5]">Scope Summary</div>

          <div className="mt-1 whitespace-pre-wrap text-sm">
            {overview.scope_summary || "—"}
          </div>
        </div>

        {/* EXCLUSIONS */}

        <div className="mt-4">
          <div className="text-xs text-[#94A3A5]">Specific Exclusions</div>

          <div className="mt-1 whitespace-pre-wrap text-sm">
            {overview.specific_exclusions || "—"}
          </div>
        </div>

        {/* NOTES */}

        <div className="mt-4">
          <div className="text-xs text-[#94A3A5]">Notes</div>

          <div className="mt-1 whitespace-pre-wrap text-sm">
            {overview.notes || "—"}
          </div>
        </div>
      </div>

      {/* COUNTS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-xl p-4">
          <div className="text-xs text-[#94A3A5]">Spaces</div>

          <div className="text-2xl font-semibold mt-1">{spaces.length}</div>
        </div>

        <div className="border rounded-xl p-4">
          <div className="text-xs text-[#94A3A5]">Categories</div>

          <div className="text-2xl font-semibold mt-1">{categories.length}</div>
        </div>

        <div className="border rounded-xl p-4">
          <div className="text-xs text-[#94A3A5]">Scope Items</div>

          <div className="text-2xl font-semibold mt-1">{items.length}</div>
        </div>
      </div>
    </div>
  );

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

    if (section.type === "review") {
      return renderReviewSection();
    }

    return null;
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async () => {
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

            version: Number(overview.version) || 1,

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

            version: Number(overview.version) || 1,

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
      // ========================================================

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

          continue;
        }

        // ------------------------------------------------------
        // New frontend-only space
        // ------------------------------------------------------

        const generatedSlug = space.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const createdSpace = await createProjectSpace({
          projectId,

          body: {
            name: space.name.trim(),

            slug: space.slug?.trim() || generatedSlug,

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

      localStorage.removeItem(SAVE_KEY);

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#1F453B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />

          <p className="text-sm text-[#6B7B7C]">Loading Scope of Work...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // NOT FOUND
  // ============================================================

  if (isEditMode && !isLoadingScopeOfWork && !existingScopeOfWork) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Scope of Work not found
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            The requested Scope of Work could not be loaded.
          </p>

          <button
            type="button"
            onClick={() => navigate("/documents/scope-of-work")}
            className="mt-4 bg-[#1F453B] text-white px-4 py-2 rounded-lg text-sm"
          >
            Back to Scope of Work
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <PaymentSectionForm
      title={isEditMode ? "Edit Scope of Work" : "Scope of Work"}
      subtitle={
        isEditMode
          ? "Update the project scope, spaces, categories and detailed work items"
          : "Define the project scope, spaces, categories and detailed work items"
      }
      submitLabel={isEditMode ? "Update Scope of Work" : "Save Scope of Work"}
      sections={SCOPE_OF_WORK_SECTIONS}
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
