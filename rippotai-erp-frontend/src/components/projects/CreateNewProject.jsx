import React, { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";

import { useCreateProjectMutation } from "../../api/project.api";
import { useGetProjectTypesQuery } from "../../api/project-type.api";

/**
 * NewProjectModal
 *
 * Lightweight "create project" modal. Wraps useCreateProjectMutation from
 * project.api.js. On success it calls onCreated(project) so the parent
 * (e.g. BoqNew) can auto-select the freshly created project.
 *
 * NOTE: client is still a plain text field because there's no client list
 * API wired into this file yet. If you have useGetClientsQuery, swap the
 * client input for a select the same way project_type was done below.
 */
export default function NewProjectModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectTypeId, setProjectTypeId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [expectedCompletionDate, setExpectedCompletionDate] = useState("");
  const [description, setDescription] = useState("");

  const [createProject, { isLoading: busy }] = useCreateProjectMutation();
  const { data: projectTypes = [], isLoading: projectTypesLoading } =
    useGetProjectTypesQuery(undefined, { skip: !open });

  if (!open) return null;

  const reset = () => {
    setName("");
    setSiteLocation("");
    setClientName("");
    setProjectTypeId("");
    setPriority("MEDIUM");
    setExpectedCompletionDate("");
    setDescription("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Project name is required.");
      return;
    }

    if (!siteLocation.trim()) {
      toast.error("Site location is required.");
      return;
    }

    try {
      const project = await createProject({
        name: name.trim(),
        site_location: siteLocation.trim(),
        client_name: clientName || undefined,
        project_type_id: projectTypeId || undefined,
        priority,
        expected_completion_date: expectedCompletionDate || undefined,
        description: description || undefined,
      }).unwrap();

      toast.success("Project created.");

      reset();
      onCreated?.(project);
      onClose();
    } catch (err) {
      toast.error(
        err?.data?.message || err?.data?.detail || "Failed to create project.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bc-card w-full max-w-lg p-6 relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <p className="uppercase tracking-widest text-xs text-gray-400">
          New Project
        </p>
        <h2 className="text-xl font-bold mt-1 mb-5">Create Project</h2>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium">
              Project Name *
            </label>
            <input
              className="bc-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Riverside Tower"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              Site Location *
            </label>
            <input
              className="bc-input"
              value={siteLocation}
              onChange={(e) => setSiteLocation(e.target.value)}
              placeholder="e.g. Sector 21, Gurugram"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">Client</label>
              <input
                className="bc-input"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client name"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Project Type
              </label>
              <select
                className="bc-input"
                value={projectTypeId}
                onChange={(e) => setProjectTypeId(e.target.value)}
                disabled={projectTypesLoading}
              >
                <option value="">
                  {projectTypesLoading ? "Loading..." : "Select Type"}
                </option>

                {projectTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">Priority</label>
              <select
                className="bc-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Expected Completion
              </label>
              <input
                type="date"
                className="bc-input"
                value={expectedCompletionDate}
                onChange={(e) => setExpectedCompletionDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              Description
            </label>
            <textarea
              className="bc-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about this project"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="h-11 px-5 rounded-xl border"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={busy}
              className="flex-1 h-11 rounded-xl bg-[#1F453B] text-white flex items-center justify-center gap-2"
            >
              {busy ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
