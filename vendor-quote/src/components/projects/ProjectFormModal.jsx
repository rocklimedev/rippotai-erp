import React, { useState } from "react";
import { X } from "lucide-react";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from "../../api/project.api";

export default function ProjectFormModal({ project, onClose, onSave }) {
  const [form, setForm] = useState(
    project || {
      name: "",
      site_location: "",
      description: "",
      status: "active",
    },
  );
  const [error, setError] = useState("");
  const isEdit = !!project;

  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();

  const loading = isCreating || isUpdating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isEdit) {
        await updateProject({ id: project.id, ...form }).unwrap();
        onSave();
      } else {
        await createProject(form).unwrap();
        onSave();
      }
    } catch (err) {
      setError(err?.data?.message || "An error occurred");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#333333]">
            {isEdit ? "Edit Project" : "Add Project"}
          </h3>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Project Name *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#1A3C34]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Site Location *
            </label>
            <input
              required
              value={form.site_location}
              onChange={(e) =>
                setForm((p) => ({ ...p, site_location: e.target.value }))
              }
              className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#1A3C34]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#1A3C34] resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value }))
              }
              className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#1A3C34]"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#E5E7EB] text-sm py-2 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              data-testid="save-project-btn"
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#1A3C34] text-white text-sm py-2 rounded hover:bg-[#16352F] disabled:opacity-60 transition-colors"
            >
              {loading ? "Saving..." : isEdit ? "Update" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
