import React, { useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

import { Button, Field, TextInput, SelectInput, TextArea, ChoiceGroup } from "@/components/inos";
import { Modal } from "./_projects-ui";

import { useCreateProjectMutation } from "../../api/projects/project.api";
import { useGetProjectTypesQuery } from "../../api/projects/project-type.api";
import {
  useGetClientsQuery,
  useCreateClientMutation,
} from "../../api/projects/client.api";

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
    <Modal
      open
      onClose={handleClose}
      title="New project"
      description="Only the name and site location are required."
      width={560}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="create-project-modal-form" loading={busy}>
            Create project
          </Button>
        </>
      }
    >
      <form id="create-project-modal-form" onSubmit={submit} className="inos-form-grid">
        <Field label="Project name" required full>
          <TextInput
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Riverside Tower"
            required
          />
        </Field>

        <Field label="Site location" required full>
          <TextInput
            value={siteLocation}
            onChange={(e) => setSiteLocation(e.target.value)}
            placeholder="e.g. Sector 21, Gurugram"
            required
          />
        </Field>

        <Field label="Client" optional>
          <SelectInput value={showNewClient ? "__new__" : clientId} onChange={handleClientSelectChange} disabled={clientsLoading}>
            <option value="">{clientsLoading || clientsFetching ? "Loading…" : "Select client"}</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
            <option value="__new__">+ Add new client</option>
          </SelectInput>
        </Field>

        <Field label="Project type" optional>
          <SelectInput value={projectTypeId} onChange={(e) => setProjectTypeId(e.target.value)} disabled={projectTypesLoading}>
            <option value="">{projectTypesLoading ? "Loading…" : "Select type"}</option>
            {projectTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </SelectInput>
        </Field>

        {showNewClient && (
          <div className="pj-inline-panel">
            <div className="pj-inline-panel__head">
              <span className="pj-inline-panel__title">
                <UserPlus size={15} aria-hidden /> New client
              </span>
              <Button variant="ghost" size="sm" onClick={cancelNewClient}>
                Cancel
              </Button>
            </div>
            <TextInput value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="Client name" aria-label="Client name" />
            <div className="inos-form-grid">
              <TextInput value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} placeholder="Email (optional)" type="email" aria-label="Client email" />
              <TextInput value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} placeholder="Phone (optional)" aria-label="Client phone" />
            </div>
            <div>
              <Button variant="soft" onClick={saveNewClient} loading={creatingClient}>
                Save client
              </Button>
            </div>
          </div>
        )}

        <Field label="Priority" full>
          <ChoiceGroup
            name="Priority"
            value={priority}
            onChange={setPriority}
            options={[
              { value: "LOW", label: "Low" },
              { value: "MEDIUM", label: "Medium" },
              { value: "HIGH", label: "High" },
              { value: "CRITICAL", label: "Critical" },
            ]}
          />
        </Field>

        <Field label="Expected completion" optional>
          <TextInput type="date" value={expectedCompletionDate} onChange={(e) => setExpectedCompletionDate(e.target.value)} />
        </Field>

        <Field label="Description" optional full>
          <TextArea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short brief for the team" />
        </Field>
      </form>
    </Modal>
  );
}
