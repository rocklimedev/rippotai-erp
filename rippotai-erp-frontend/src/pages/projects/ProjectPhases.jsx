import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Layers3,
  RefreshCw,
} from "lucide-react";

import {
  useGetProjectPhasesQuery,
  useCreateProjectPhaseMutation,
  useUpdateProjectPhaseMutation,
  useDeleteProjectPhaseMutation,
} from "../../api/projects/project.api";

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
};

const ProjectPhases = () => {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const {
    data: projectPhases = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetProjectPhasesQuery({
    search: search.trim() || undefined,
  });

  const [createProjectPhase, { isLoading: isCreating }] =
    useCreateProjectPhaseMutation();

  const [updateProjectPhase, { isLoading: isUpdating }] =
    useUpdateProjectPhaseMutation();

  const [deleteProjectPhase, { isLoading: isDeleting }] =
    useDeleteProjectPhaseMutation();

  const normalizedPhases = useMemo(() => {
    if (!Array.isArray(projectPhases)) return [];

    const value = search.trim().toLowerCase();

    if (!value) return projectPhases;

    return projectPhases.filter((item) =>
      [item.name, item.code, item.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    );
  }, [projectPhases, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);

    setForm({
      name: item.name || "",
      code: item.code || item.phaseCode || "",
      description: item.description || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (isCreating || isUpdating) return;

    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Project phase name is required");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        description: form.description.trim() || undefined,
      };

      if (editingId) {
        await updateProjectPhase({
          id: editingId,
          ...payload,
        }).unwrap();

        toast.success("Project phase updated successfully");
      } else {
        await createProjectPhase(payload).unwrap();

        toast.success("Project phase created successfully");
      }

      closeModal();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to save project phase",
      );
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete project phase "${item.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await deleteProjectPhase(item.id).unwrap();

      toast.success("Project phase deleted successfully");
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to delete project phase",
      );
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1F453B] text-white">
            <Layers3 size={21} />
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Project Phases
            </h1>

            <p className="text-sm text-slate-500">
              Manage the master phases used throughout project workflows.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1F453B] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus size={17} />
          Add Project Phase
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search project phases..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#1F453B] focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total Phases
          </div>

          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {normalizedPhases.length}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Master Configuration
          </div>

          <div className="mt-2 text-sm font-medium text-[#1F453B]">
            Project Workflow
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Search Result
          </div>

          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {normalizedPhases.length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Phase
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Code
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Loading project phases...
                  </td>
                </tr>
              ) : normalizedPhases.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No project phases found.
                  </td>
                </tr>
              ) : (
                normalizedPhases.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D8E0DA] text-sm font-semibold text-[#1F453B]">
                          {index + 1}
                        </div>

                        <div>
                          <div className="font-medium text-slate-900">
                            {item.name || "—"}
                          </div>

                          <div className="text-xs text-slate-400">
                            ID: {item.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                        {item.code || item.phaseCode || "—"}
                      </span>
                    </td>

                    <td className="max-w-lg px-5 py-4 text-sm text-slate-600">
                      <div className="truncate">
                        {item.description || "No description"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-[#1F453B]"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={isDeleting}
                          className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingId ? "Edit Project Phase" : "Create Project Phase"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Define a phase for the project workflow.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Phase Name <span className="text-red-500">*</span>
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Design Development"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1F453B]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Phase Code
                  </label>

                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="e.g. DESIGN"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm uppercase outline-none focus:border-[#1F453B]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe what this project phase represents..."
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1F453B]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isCreating || isUpdating}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="rounded-lg bg-[#1F453B] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isCreating || isUpdating
                    ? "Saving..."
                    : editingId
                      ? "Update Project Phase"
                      : "Create Project Phase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPhases;
