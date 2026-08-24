import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, Folder, ListChecks } from "lucide-react";

import { PaymentSectionForm } from "../../components/payments/PaymentSectionForm";
import { useAutoSave } from "../../hooks/use-autosave";
import { useGetProjectsQuery } from "../../api/project.api";

import {
  useCreateScopeOfWorkMutation,
  useCreateProjectSpaceMutation,
  useCreateScopeItemMutation,
  useAddCategoryToProjectMutation,
  useGetProjectSpacesQuery,
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
  // API
  // ============================================================
  const [createScopeOfWork, { isLoading: isCreating }] =
    useCreateScopeOfWorkMutation();

  const [createProjectSpace, { isLoading: isCreatingSpace }] =
    useCreateProjectSpaceMutation();

  const [createScopeItem, { isLoading: isCreatingItem }] =
    useCreateScopeItemMutation();

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
    { skip: !projectId },
  );

  const { data: scopeCategories = [] } = useGetScopeCategoriesQuery();

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
          i === index ? { ...space, [field]: value } : space,
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
                  <div>
                    <label className="bc-label">Space Name</label>
                    <input
                      type="text"
                      value={space.name}
                      onChange={(e) =>
                        updateSpace(index, "name", e.target.value)
                      }
                      placeholder="e.g. Living Room"
                      className="bc-input w-full"
                    />
                  </div>

                  <div>
                    <label className="bc-label">Slug</label>
                    <input
                      type="text"
                      value={space.slug}
                      onChange={(e) =>
                        updateSpace(index, "slug", e.target.value)
                      }
                      placeholder="living-room"
                      className="bc-input w-full"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="bc-label">Description</label>
                    <textarea
                      rows={3}
                      value={space.description}
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
          i === index ? { ...item, [field]: value } : item,
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

                <div className="p-5 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        {[...projectSpaces, ...spaces].map((space) => (
                          <option key={space.id} value={space.id}>
                            {space.name || "(unnamed space)"}
                          </option>
                        ))}
                      </select>
                    </div>

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

                    <div>
                      <label className="bc-label">Inclusion</label>
                      <select
                        className="bc-input w-full"
                        value={item.is_excluded ? "excluded" : "included"}
                        onChange={(e) => {
                          const excluded = e.target.value === "excluded";
                          updateItem(index, "is_excluded", excluded);
                          updateItem(index, "is_included", !excluded);
                        }}
                      >
                        <option value="included">Included</option>
                        <option value="excluded">Excluded</option>
                      </select>
                    </div>

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
          Review the information before creating the Scope of Work document.
        </p>
      </div>

      <div className="border rounded-xl p-4">
        <div className="text-xs uppercase tracking-widest text-[#6B7B7C] mb-2">
          Project
        </div>
        <div className="font-semibold">
          {projects.find((p) => p.id === projectId)?.name ||
            "No project selected"}
        </div>
      </div>

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

        <div className="mt-4">
          <div className="text-xs text-[#94A3A5]">Scope Summary</div>
          <div className="mt-1 whitespace-pre-wrap text-sm">
            {overview.scope_summary || "—"}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs text-[#94A3A5]">Specific Exclusions</div>
          <div className="mt-1 whitespace-pre-wrap text-sm">
            {overview.specific_exclusions || "—"}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs text-[#94A3A5]">Notes</div>
          <div className="mt-1 whitespace-pre-wrap text-sm">
            {overview.notes || "—"}
          </div>
        </div>
      </div>

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
    if (section.type === "overview") return renderOverviewSection();
    if (section.type === "spaces") return renderSpacesSection();
    if (section.type === "items") return renderItemsSection();
    if (section.type === "review") return renderReviewSection();
    return null;
  };

  // ============================================================
  // SUBMIT (FIXED)
  // ============================================================
  const handleSubmit = async () => {
    // Validation
    if (!projectId) {
      return toast.error("Please select a project.");
    }

    if (!overview.scope_summary?.trim()) {
      return toast.error("Please enter the scope summary.");
    }

    const incompleteSpaces = spaces.filter((s) => !s.name?.trim());
    if (incompleteSpaces.length > 0) {
      return toast.error(
        `${incompleteSpaces.length} space${
          incompleteSpaces.length > 1 ? "s are" : " is"
        } missing a name.`,
      );
    }

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
      // --------------------------------------------------------
      // 1. CREATE SCOPE OF WORK DOCUMENT
      // --------------------------------------------------------
      const scopeOfWork = await createScopeOfWork({
        projectId,
        body: {
          scopeSummary: overview.scope_summary?.trim() || undefined,
          specificExclusions: overview.specific_exclusions?.trim() || undefined,
          notes: overview.notes?.trim() || undefined,
          projectMode: overview.project_mode || undefined,
          version: Number(overview.version) || 1,
          status: overview.status || "DRAFT",
        },
      }).unwrap();

      // --------------------------------------------------------
      // 2. BUILD SPACE ID MAP (existing + newly created)
      // --------------------------------------------------------
      const spaceIdMap = new Map();

      // Existing project spaces
      projectSpaces.forEach((space) => {
        spaceIdMap.set(space.id, space.id);
      });

      // Create new spaces and map clientId → real UUID
      for (let index = 0; index < spaces.length; index++) {
        const space = spaces[index];

        const createdSpace = await createProjectSpace({
          projectId,
          body: {
            name: space.name.trim(),
            slug:
              space.slug?.trim() ||
              space.name
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
            description: space.description?.trim() || undefined,
            sortOrder: index + 1,
            isActive: true,
          },
        }).unwrap();

        // Map the temporary client ID to the real ID returned by the API
        spaceIdMap.set(space.id, createdSpace.id);
      }

      // --------------------------------------------------------
      // 3. CREATE SCOPE ITEMS (now with real space IDs + scopeOfWorkId)
      // --------------------------------------------------------
      for (let index = 0; index < items.length; index++) {
        const item = items[index];

        const realSpaceId = spaceIdMap.get(item.project_space_id);

        if (!realSpaceId) {
          console.warn(
            `Skipping item ${index + 1}: could not resolve space ID`,
            item.project_space_id,
          );
          continue;
        }

        await createScopeItem({
          projectId,
          body: {
            // Required by backend
            scopeOfWorkId: scopeOfWork.id,

            projectSpaceId: realSpaceId,
            scopeCategoryId: item.scope_category_id,
            scopeOfWork: item.scope_of_work?.trim(),
            isIncluded: item.is_included !== false,
            isExcluded: item.is_excluded === true,
            notes: item.notes?.trim() || undefined,
            sortOrder: index + 1,
          },
        }).unwrap();
      }

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------
      toast.success("Scope of Work created successfully.");
      localStorage.removeItem(SAVE_KEY);
      navigate(`/documents/scope-of-work/${scopeOfWork.id}`);
    } catch (error) {
      console.error("Scope of Work creation failed:", error);
      toast.error(error?.data?.message || "Failed to create Scope of Work.");
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <PaymentSectionForm
      title="Scope of Work"
      subtitle="Define the project scope, spaces, categories and detailed work items"
      submitLabel="Save Scope of Work"
      sections={SCOPE_OF_WORK_SECTIONS}
      values={values}
      onFieldChange={handleFieldChange}
      projects={projects}
      projectId={projectId}
      onProjectChange={setProjectId}
      onSubmit={handleSubmit}
      isSubmitting={
        isCreating || isCreatingSpace || isCreatingItem || isAddingCategory
      }
      renderSection={renderSection}
    />
  );
}
