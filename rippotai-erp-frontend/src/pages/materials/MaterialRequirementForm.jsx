import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Save,
  Package,
} from "lucide-react";

import { useAutoSave } from "../../hooks/use-autosave";

import { useCreateMaterialRequirementMutation } from "../../api/procurent.api";

import { useGetProjectsQuery } from "../../api/project.api";
import { useGetUsersQuery } from "../../api/user.api";

const SAVE_KEY = "bc.material-requirement";

const createEmptyRequirement = () => ({
  id: crypto.randomUUID(),
  itemName: "",
  category: "",
  selection: "",
  budgetAmount: "",
  style: "",
  functionalNeeds: "",
  expanded: false,
});

export function MaterialRequirementForm() {
  const navigate = useNavigate();

  const { data: projects = [] } = useGetProjectsQuery();
  const { data: users = [] } = useGetUsersQuery();

  const [createMaterialRequirement, { isLoading }] =
    useCreateMaterialRequirementMutation();

  const [projectId, setProjectId] = React.useState("");

  const [values, setValues] = useAutoSave(SAVE_KEY, {
    designerId: "",
    requirements: [createEmptyRequirement()],
  });

  const requirements = values.requirements || [];

  // =========================================================
  // UPDATE ROW
  // =========================================================

  const updateRequirement = (index, field, value) => {
    setValues((prev) => ({
      ...prev,
      requirements: (prev.requirements || []).map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }));
  };

  // =========================================================
  // ADD ROW
  // =========================================================

  const addRequirement = () => {
    setValues((prev) => ({
      ...prev,
      requirements: [...(prev.requirements || []), createEmptyRequirement()],
    }));
  };

  // =========================================================
  // DUPLICATE ROW
  // =========================================================

  const duplicateRequirement = (index) => {
    setValues((prev) => {
      const source = prev.requirements[index];

      const copy = {
        ...source,
        id: crypto.randomUUID(),
        itemName: source.itemName ? `${source.itemName} Copy` : "",
        expanded: false,
      };

      const requirements = [...prev.requirements];

      requirements.splice(index + 1, 0, copy);

      return {
        ...prev,
        requirements,
      };
    });
  };

  // =========================================================
  // REMOVE ROW
  // =========================================================

  const removeRequirement = (index) => {
    setValues((prev) => {
      const requirements = [...(prev.requirements || [])];

      if (requirements.length === 1) {
        return {
          ...prev,
          requirements: [createEmptyRequirement()],
        };
      }

      requirements.splice(index, 1);

      return {
        ...prev,
        requirements,
      };
    });
  };

  // =========================================================
  // TOGGLE DETAILS
  // =========================================================

  const toggleExpanded = (index) => {
    setValues((prev) => ({
      ...prev,
      requirements: (prev.requirements || []).map((item, i) =>
        i === index
          ? {
              ...item,
              expanded: !item.expanded,
            }
          : item,
      ),
    }));
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async () => {
    if (!projectId) {
      return toast.error("Please select a project.");
    }

    if (!values.designerId) {
      return toast.error("Please select a designer.");
    }

    const validRows = requirements.filter(
      (item) => item.itemName?.trim() || item.selection?.trim(),
    );

    if (!validRows.length) {
      return toast.error("Add at least one material requirement.");
    }

    const incompleteRows = validRows.filter(
      (item) => !item.itemName?.trim() || !item.selection?.trim(),
    );

    if (incompleteRows.length) {
      return toast.error(
        `${incompleteRows.length} material ${
          incompleteRows.length === 1 ? "row is" : "rows are"
        } incomplete. Add an item name and selection.`,
      );
    }

    try {
      /*
       * Create all material requirements.
       *
       * The backend currently exposes one create endpoint,
       * therefore each table row becomes one requirement.
       */
      await Promise.all(
        validRows.map((item) =>
          createMaterialRequirement({
            projectId,
            designerId: values.designerId,

            itemName: item.itemName.trim(),

            category: item.category?.trim() || undefined,

            selection: item.selection.trim(),

            budgetAmount:
              item.budgetAmount === "" ||
              item.budgetAmount === null ||
              item.budgetAmount === undefined
                ? undefined
                : Number(item.budgetAmount),

            style: item.style?.trim() || undefined,

            functionalNeeds: item.functionalNeeds?.trim() || undefined,
          }).unwrap(),
        ),
      );

      toast.success(
        `${validRows.length} material ${
          validRows.length === 1 ? "requirement" : "requirements"
        } created successfully.`,
      );

      localStorage.removeItem(SAVE_KEY);

      /*
       * Go back to the requirement list.
       *
       * Change this route if your actual list route differs.
       */
      navigate("/procurement/requirements");
    } catch (error) {
      console.error(error);

      toast.error(
        error?.data?.message || "Failed to create material requirements.",
      );
    }
  };

  const selectedProject = projects.find((project) => project.id === projectId);

  const selectedDesigner = users.find((user) => user.id === values.designerId);

  return (
    <div className="min-h-screen bg-[#F7F8F8]">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="border-b border-gray-200 bg-white">
        <div className="px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1F453B] text-white flex items-center justify-center">
                  <Package size={19} />
                </div>

                <div>
                  <h1 className="text-xl font-semibold text-[#333333]">
                    Material Requirements
                  </h1>

                  <p className="text-sm text-[#6B7B7C] mt-0.5">
                    Capture material selections and requirements for
                    procurement.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="h-10 px-5 rounded-lg bg-[#1F453B] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Save size={16} />

              {isLoading ? "Saving..." : "Save Requirements"}
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="p-6 space-y-5">
        {/* =====================================================
            CONTEXT
        ===================================================== */}

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Project */}

            <div>
              <label className="bc-label">Project</label>

              <select
                className="bc-input h-10 w-full"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">Select Project</option>

                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Designer */}

            <div>
              <label className="bc-label">Designer</label>

              <select
                className="bc-input h-10 w-full"
                value={values.designerId}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    designerId: e.target.value,
                  }))
                }
              >
                <option value="">Select Designer</option>

                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(selectedProject || selectedDesigner) && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
              {selectedProject && (
                <span className="px-3 py-1.5 rounded-full bg-[#F1F5F3] text-xs font-medium text-[#1F453B]">
                  Project: {selectedProject.name}
                </span>
              )}

              {selectedDesigner && (
                <span className="px-3 py-1.5 rounded-full bg-[#F1F5F3] text-xs font-medium text-[#1F453B]">
                  Designer: {selectedDesigner.name}
                </span>
              )}
            </div>
          )}
        </div>

        {/* =====================================================
            MATERIAL TABLE
        ===================================================== */}

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Table header */}

          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-[#333333]">Material Items</h2>

              <p className="text-xs text-[#94A3A5] mt-1">
                Add each material as a separate requirement.
              </p>
            </div>

            <div className="text-sm text-[#6B7B7C]">
              {requirements.length}{" "}
              {requirements.length === 1 ? "item" : "items"}
            </div>
          </div>

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr className="bg-[#F8FAF9] border-b border-gray-200">
                  <th className="w-12 px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[#6B7B7C]">
                    #
                  </th>

                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6B7B7C]">
                    Item
                  </th>

                  <th className="w-[150px] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6B7B7C]">
                    Category
                  </th>

                  <th className="min-w-[280px] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6B7B7C]">
                    Selection / Specification
                  </th>

                  <th className="w-[150px] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6B7B7C]">
                    Budget
                  </th>

                  <th className="w-[150px] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6B7B7C]">
                    Style
                  </th>

                  <th className="w-[120px] px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[#6B7B7C]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {requirements.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <tr className="border-b border-gray-100 hover:bg-[#FCFDFC]">
                      {/* Number */}

                      <td className="px-3 py-3 text-center text-xs font-semibold text-[#94A3A5]">
                        {index + 1}
                      </td>

                      {/* Item */}

                      <td className="px-3 py-3 align-top">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) =>
                            updateRequirement(index, "itemName", e.target.value)
                          }
                          placeholder="e.g. Wall Mixer"
                          className="bc-input h-9 w-full min-w-[180px]"
                        />
                      </td>

                      {/* Category */}

                      <td className="px-3 py-3 align-top">
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) =>
                            updateRequirement(index, "category", e.target.value)
                          }
                          placeholder="Bath"
                          className="bc-input h-9 w-full"
                        />
                      </td>

                      {/* Selection */}

                      <td className="px-3 py-3 align-top">
                        <input
                          type="text"
                          value={item.selection}
                          onChange={(e) =>
                            updateRequirement(
                              index,
                              "selection",
                              e.target.value,
                            )
                          }
                          placeholder="Product / finish / specification"
                          className="bc-input h-9 w-full"
                        />
                      </td>

                      {/* Budget */}

                      <td className="px-3 py-3 align-top">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3A5]">
                            ₹
                          </span>

                          <input
                            type="number"
                            min="0"
                            value={item.budgetAmount}
                            onChange={(e) =>
                              updateRequirement(
                                index,
                                "budgetAmount",
                                e.target.value,
                              )
                            }
                            placeholder="0"
                            className="bc-input h-9 w-full pl-7"
                          />
                        </div>
                      </td>

                      {/* Style */}

                      <td className="px-3 py-3 align-top">
                        <input
                          type="text"
                          value={item.style}
                          onChange={(e) =>
                            updateRequirement(index, "style", e.target.value)
                          }
                          placeholder="Modern"
                          className="bc-input h-9 w-full"
                        />
                      </td>

                      {/* Actions */}

                      <td className="px-3 py-3 align-top">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(index)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7B7C]"
                            title="Additional details"
                          >
                            {item.expanded ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => duplicateRequirement(index)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7B7C]"
                            title="Duplicate"
                          >
                            <Copy size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeRequirement(index)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* =================================================
                        EXPANDED DETAILS
                    ================================================= */}

                    {item.expanded && (
                      <tr className="border-b border-gray-200 bg-[#FAFBFB]">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="max-w-4xl">
                            <label className="bc-label">Functional Needs</label>

                            <textarea
                              rows={3}
                              value={item.functionalNeeds}
                              onChange={(e) =>
                                updateRequirement(
                                  index,
                                  "functionalNeeds",
                                  e.target.value,
                                )
                              }
                              placeholder="Describe functional requirements, installation constraints, compatibility requirements, performance requirements, etc."
                              className="bc-input w-full resize-y"
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* =================================================
              ADD ROW
          ================================================= */}

          <div className="px-5 py-4 border-t border-gray-200 bg-[#FAFBFB]">
            <button
              type="button"
              onClick={addRequirement}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1F453B] hover:text-[#16382F]"
            >
              <Plus size={17} />
              Add Material
            </button>
          </div>
        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="flex items-center justify-between">
          <div className="text-xs text-[#94A3A5]">Draft autosaved locally</div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/procurement/requirements")}
              className="h-10 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium text-[#333333] hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="h-10 px-5 rounded-lg bg-[#1F453B] text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Save size={16} />

              {isLoading
                ? "Saving..."
                : `Save ${requirements.length} ${
                    requirements.length === 1 ? "Requirement" : "Requirements"
                  }`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
