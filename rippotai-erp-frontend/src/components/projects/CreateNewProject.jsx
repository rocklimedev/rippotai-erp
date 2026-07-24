import React, { useState } from "react";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";

import { useCreateProjectMutation } from "../../api/project.api";
import { useGetProjectTypesQuery } from "../../api/project-type.api";
import {
  useGetClientsQuery,
  useCreateClientMutation,
} from "../../api/client.api";

/**
 * NewProjectModal
 *
 * Lightweight "create project" modal. Wraps useCreateProjectMutation from
 * project.api.js. On success it calls onCreated(project) so the parent
 * (e.g. BoqNew) can auto-select the freshly created project.
 *
 * Client is now a real relation: pulled from useGetClientsQuery and sent
 * as client_id on submit. An inline "+ Add New Client" affordance lets the
 * user create a client on the fly via useCreateClientMutation without
 * leaving the modal; the new client is auto-selected once created.
 */
export default function NewProjectModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectTypeId, setProjectTypeId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [expectedCompletionDate, setExpectedCompletionDate] = useState("");
  const [description, setDescription] = useState("");

  // Inline "new client" mini-form state
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  const [createProject, { isLoading: busy }] = useCreateProjectMutation();
  const { data: projectTypes = [], isLoading: projectTypesLoading } =
    useGetProjectTypesQuery(undefined, { skip: !open });

  const {
    data: clients = [],
    isLoading: clientsLoading,
    isFetching: clientsFetching,
  } = useGetClientsQuery(undefined, { skip: !open });

  const [createClient, { isLoading: creatingClient }] =
    useCreateClientMutation();

  if (!open) return null;

  const reset = () => {
    setName("");
    setSiteLocation("");
    setClientId("");
    setProjectTypeId("");
    setPriority("MEDIUM");
    setExpectedCompletionDate("");
    setDescription("");
    setShowNewClient(false);
    setNewClientName("");
    setNewClientEmail("");
    setNewClientPhone("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleClientSelectChange = (e) => {
    const value = e.target.value;
    if (value === "__new__") {
      setShowNewClient(true);
      setClientId("");
      return;
    }
    setShowNewClient(false);
    setClientId(value);
  };

  const cancelNewClient = () => {
    setShowNewClient(false);
    setNewClientName("");
    setNewClientEmail("");
    setNewClientPhone("");
  };

  const saveNewClient = async () => {
    if (!newClientName.trim()) {
      toast.error("Client name is required.");
      return;
    }

    try {
      const client = await createClient({
        name: newClientName.trim(),
        email: newClientEmail.trim() || undefined,
        phone: newClientPhone.trim() || undefined,
      }).unwrap();

      toast.success("Client created.");
      setClientId(client.id);
      setShowNewClient(false);
      setNewClientName("");
      setNewClientEmail("");
      setNewClientPhone("");
    } catch (err) {
      toast.error(
        err?.data?.message || err?.data?.detail || "Failed to create client.",
      );
    }
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
        client_id: clientId || undefined,
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
              <select
                className="bc-input"
                value={showNewClient ? "__new__" : clientId}
                onChange={handleClientSelectChange}
                disabled={clientsLoading}
              >
                <option value="">
                  {clientsLoading || clientsFetching
                    ? "Loading..."
                    : "Select Client"}
                </option>

                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}

                <option value="__new__">+ Add New Client</option>
              </select>
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

          {showNewClient && (
            <div className="rounded-xl border border-dashed p-4 space-y-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Plus size={14} /> New Client
                </p>
                <button
                  type="button"
                  onClick={cancelNewClient}
                  className="text-xs text-gray-400 hover:text-black"
                >
                  Cancel
                </button>
              </div>

              <input
                className="bc-input"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Client name *"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  className="bc-input"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="Email (optional)"
                  type="email"
                />
                <input
                  className="bc-input"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="Phone (optional)"
                />
              </div>

              <button
                type="button"
                onClick={saveNewClient}
                disabled={creatingClient}
                className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-sm"
              >
                {creatingClient ? "Saving..." : "Save Client"}
              </button>
            </div>
          )}

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
