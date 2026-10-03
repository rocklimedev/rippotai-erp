import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, UserPlus, Tag, Flag, ArrowDown, ArrowUp, AlertTriangle, Minus } from "lucide-react";

import {
  Page,
  PageHeader,
  Button,
  FormSection,
  Field,
  TextInput,
  SelectInput,
  TextArea,
  ChoiceGroup,
} from "@/components/inos";
import { Skeleton } from "@/components/projects/_projects-ui";

import {
  useCreateProjectMutation,
  useGetProjectByIdQuery,
  useUpdateProjectMutation,
} from "../../api/projects/project.api";

import { useGetProjectTypesQuery, useCreateProjectTypeMutation } from "../../api/projects/project-type.api";

import { useGetClientsQuery, useCreateClientMutation } from "../../api/projects/client.api";

// ============================================================
// CONSTANTS
// ============================================================

const PRIORITY_OPTIONS = [
  { label: "Low", value: "LOW", icon: ArrowDown },
  { label: "Medium", value: "MEDIUM", icon: Minus },
  { label: "High", value: "HIGH", icon: ArrowUp },
  { label: "Critical", value: "CRITICAL", icon: AlertTriangle },
];

// ============================================================
// HELPERS
// ============================================================

const toDateInputValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const todayInput = () => new Date().toISOString().slice(0, 10);

// ============================================================
// COMPONENT
// ============================================================

export default function ProjectNew() {
  const nav = useNavigate();
  const { id: projectId } = useParams();
  const isEdit = Boolean(projectId);
  const [searchParams] = useSearchParams();

  // ------------------------------------------------------------ form
  const [form, setForm] = useState({
    name: "",
    client_id: searchParams.get("client_id") || "", // prefilled from Client detail → New project
    project_type_id: "",
    site_location: "",
    priority: "MEDIUM",
    expected_completion_date: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [hydrated, setHydrated] = useState(false);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // ------------------------------------------------------------ inline "add" panels
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  // ------------------------------------------------------------ data
  const {
    data: project,
    isFetching: projectLoading,
    isError: projectError,
  } = useGetProjectByIdQuery(projectId, { skip: !isEdit });

  const { data: types = [], isFetching: typesLoading, isError: typesError } = useGetProjectTypesQuery();
  const { data: clients = [], isFetching: clientsLoading, isError: clientsError } = useGetClientsQuery();

  const [createProjectType, { isLoading: creatingType }] = useCreateProjectTypeMutation();
  const [createClient, { isLoading: creatingClient }] = useCreateClientMutation();
  const [createProject, { isLoading: creatingProject }] = useCreateProjectMutation();
  const [updateProject, { isLoading: updatingProject }] = useUpdateProjectMutation();

  const busy = isEdit ? updatingProject : creatingProject;

  useEffect(() => {
    if (projectError) toast.error("Failed to load project");
  }, [projectError]);
  useEffect(() => {
    if (typesError) toast.error("Failed to load project types");
  }, [typesError]);
  useEffect(() => {
    if (clientsError) toast.error("Failed to load clients");
  }, [clientsError]);

  // ------------------------------------------------------------ hydrate edit form
  useEffect(() => {
    if (!isEdit || !project || hydrated) return;
    setForm({
      name: project.name || "",
      client_id: project.client_id || project.client?.id || "",
      project_type_id: project.project_type_id || project.project_type?.id || "",
      site_location: project.site_location || "",
      priority: project.priority || "MEDIUM",
      expected_completion_date: toDateInputValue(project.expected_completion_date),
      description: project.description || "",
    });
    setHydrated(true);
  }, [isEdit, project, hydrated]);

  // ------------------------------------------------------------ default project type (first in list)
  useEffect(() => {
    if (isEdit) return;
    if (!form.project_type_id && types.length) {
      setForm((f) => ({ ...f, project_type_id: types[0].id }));
    }
  }, [isEdit, types, form.project_type_id]);

  // ------------------------------------------------------------ add project type
  const saveNewType = async () => {
    if (!newTypeName.trim()) {
      toast.error("Name required");
      return;
    }
    try {
      const data = await createProjectType({ name: newTypeName.trim() }).unwrap();
      toast.success(`Project type "${data.name}" added`);
      setShowAddType(false);
      setNewTypeName("");
      setForm((f) => ({ ...f, project_type_id: data.id }));
    } catch (e) {
      toast.error(e?.data?.detail || e?.data?.message || "Failed to add project type");
    }
  };

  // ------------------------------------------------------------ add client
  const saveNewClient = async () => {
    if (!newClientName.trim()) {
      toast.error("Name required");
      return;
    }
    try {
      const data = await createClient({
        name: newClientName.trim(),
        ...(newClientEmail.trim() ? { email: newClientEmail.trim() } : {}),
        ...(newClientPhone.trim() ? { phone: newClientPhone.trim() } : {}),
      }).unwrap();
      toast.success(`Client "${data.name}" added`);
      setShowAddClient(false);
      setNewClientName("");
      setNewClientEmail("");
      setNewClientPhone("");
      setForm((f) => ({ ...f, client_id: data.id }));
    } catch (e) {
      toast.error(e?.data?.detail || e?.data?.message || "Failed to add client");
    }
  };

  // ------------------------------------------------------------ validation
  const validate = (keys = ["name", "site_location"]) => {
    const next = { ...errors };
    if (keys.includes("name")) next.name = form.name.trim() ? undefined : "Give the project a name.";
    if (keys.includes("site_location"))
      next.site_location = form.site_location.trim() ? undefined : "Where is the site? A locality and city is enough.";
    setErrors(next);
    return next;
  };

  // ------------------------------------------------------------ submit
  const submit = async (event) => {
    event?.preventDefault?.();
    const v = validate();
    if (v.name) return toast.error("Name required");
    if (v.site_location) return toast.error("Location required");

    const payload = {
      name: form.name.trim(),
      site_location: form.site_location.trim(),
      priority: form.priority,
      ...(form.client_id ? { client_id: form.client_id } : {}),
      ...(form.project_type_id ? { project_type_id: form.project_type_id } : {}),
      ...(form.expected_completion_date ? { expected_completion_date: form.expected_completion_date } : {}),
      ...(form.description.trim() || isEdit ? { description: form.description.trim() } : {}),
    };

    try {
      if (isEdit) {
        const data = await updateProject({ id: projectId, ...payload }).unwrap();
        toast.success("Project updated");
        nav(`/projects/${data?.id || projectId}`);
      } else {
        const data = await createProject(payload).unwrap();
        toast.success("Project created");
        nav(`/projects/${data.id}`);
      }
    } catch (e) {
      const messages = e?.data?.message;
      toast.error(Array.isArray(messages) ? messages[0] : messages || e?.data?.detail || "Failed");
    }
  };

  const backTarget = isEdit ? `/projects/${projectId}` : "/projects";

  // ------------------------------------------------------------ loading (edit)
  if (isEdit && projectLoading && !hydrated) {
    return (
      <Page width="form">
        <PageHeader crumbs={[{ label: "Projects", to: "/projects" }, { label: "Edit" }]} title="Edit project" />
        <Skeleton height={220} />
        <Skeleton height={160} />
      </Page>
    );
  }

  const selectedClient = clients.find((c) => String(c.id) === String(form.client_id));

  // ------------------------------------------------------------ render
  return (
    <Page width="form">
      <PageHeader
        crumbs={
          isEdit
            ? [
                { label: "Projects", to: "/projects" },
                { label: project?.name || "Project", to: backTarget },
                { label: "Edit" },
              ]
            : [{ label: "Projects", to: "/projects" }, { label: "New project" }]
        }
        title={isEdit ? "Edit project" : "New project"}
        subtitle={
          isEdit
            ? "Update the basics — phases, documents and team stay as they are."
            : "Two fields are required: a name and the site location. Everything else can be added later."
        }
      />

      <form className="inos-form" onSubmit={submit} noValidate>
        {/* 1 — Basics */}
        <FormSection step={1} title="Basics" description="What the project is called and where the site is.">
          <Field label="Project name" required full htmlFor="pj-name" error={errors.name} hint="Usually the client or building name.">
            <TextInput
              id="pj-name"
              autoFocus={!isEdit}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={() => form.name && validate(["name"])}
              placeholder="e.g. Malhotra Residence, Golf Links"
              invalid={Boolean(errors.name)}
              data-testid="new-name"
            />
          </Field>

          <Field label="Site location" required htmlFor="pj-site" error={errors.site_location}>
            <TextInput
              id="pj-site"
              value={form.site_location}
              onChange={(e) => set("site_location", e.target.value)}
              onBlur={() => form.site_location && validate(["site_location"])}
              placeholder="e.g. Sector 42, Gurugram"
              invalid={Boolean(errors.site_location)}
              data-testid="new-site-location"
            />
          </Field>

          <Field
            label="Project type"
            htmlFor="pj-type"
            hint={types.length ? undefined : typesLoading ? "Loading types…" : "No types yet — add one."}
          >
            <div className="pj-input-row">
              <SelectInput
                id="pj-type"
                value={form.project_type_id}
                onChange={(e) => set("project_type_id", e.target.value)}
                disabled={typesLoading}
                data-testid="project-type-select"
              >
                {typesLoading && <option value="">Loading…</option>}
                {!typesLoading && types.length === 0 && <option value="">No types yet</option>}
                {!typesLoading &&
                  types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </SelectInput>
              <Button
                variant="secondary"
                icon={Plus}
                onClick={() => setShowAddType((v) => !v)}
                title="Add new project type"
                aria-label="Add new project type"
                data-testid="add-project-type-btn"
              />
            </div>
          </Field>

          {showAddType && (
            <div className="pj-inline-panel" data-testid="add-type-modal">
              <div className="pj-inline-panel__head">
                <span className="pj-inline-panel__title">
                  <Tag size={15} aria-hidden /> New project type
                </span>
                <Button variant="ghost" size="sm" onClick={() => setShowAddType(false)}>
                  Cancel
                </Button>
              </div>
              <div className="pj-input-row">
                <TextInput
                  autoFocus
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="e.g. Boutique retail"
                  aria-label="New project type name"
                  data-testid="new-type-name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveNewType();
                    }
                  }}
                />
                <Button variant="primary" onClick={saveNewType} loading={creatingType} data-testid="new-type-save">
                  Add type
                </Button>
              </div>
              <span className="inos-hint">Becomes available for every future project.</span>
            </div>
          )}
        </FormSection>

        {/* 2 — Client */}
        <FormSection step={2} title="Client" description="Pick an existing client, or add a new one without leaving this page.">
          <Field
            label="Client"
            optional
            full
            htmlFor="pj-client"
            hint={
              selectedClient
                ? [selectedClient.contact_person, selectedClient.email, selectedClient.phone].filter(Boolean).join(" · ") || undefined
                : "You can link a client later."
            }
          >
            <div className="pj-input-row">
              <SelectInput
                id="pj-client"
                value={form.client_id}
                onChange={(e) => set("client_id", e.target.value)}
                disabled={clientsLoading}
                data-testid="client-select"
              >
                <option value="">{clientsLoading ? "Loading…" : clients.length ? "Select a client" : "No clients yet"}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
              <Button
                variant="secondary"
                icon={UserPlus}
                onClick={() => setShowAddClient((v) => !v)}
                title="Add new client"
                data-testid="add-client-btn"
              >
                New client
              </Button>
            </div>
          </Field>

          {showAddClient && (
            <div className="pj-inline-panel" data-testid="add-client-modal">
              <div className="pj-inline-panel__head">
                <span className="pj-inline-panel__title">
                  <UserPlus size={15} aria-hidden /> New client
                </span>
                <Button variant="ghost" size="sm" onClick={() => setShowAddClient(false)}>
                  Cancel
                </Button>
              </div>
              <div className="inos-form-grid">
                <Field label="Client name" required full>
                  <TextInput
                    autoFocus
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Apex Buildcon Pvt Ltd"
                    data-testid="new-client-name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveNewClient();
                      }
                    }}
                  />
                </Field>
                <Field label="Email" optional>
                  <TextInput type="email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} placeholder="name@company.com" />
                </Field>
                <Field label="Phone" optional>
                  <TextInput type="tel" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} placeholder="+91 98100 00000" />
                </Field>
              </div>
              <div>
                <Button variant="primary" onClick={saveNewClient} loading={creatingClient} data-testid="new-client-save">
                  Add client
                </Button>
              </div>
            </div>
          )}
        </FormSection>

        {/* 3 — Details */}
        <FormSection step={3} title="Details" description="Priority, target date and a short brief. All optional.">
          <Field label="Priority" full>
            <div data-testid="new-priority">
              <ChoiceGroup name="Priority" value={form.priority} onChange={(v) => set("priority", v)} options={PRIORITY_OPTIONS} />
            </div>
          </Field>

          <Field label="Expected completion" optional htmlFor="pj-ecd" hint="Used for the ECD on the projects list.">
            <TextInput
              id="pj-ecd"
              type="date"
              min={isEdit ? undefined : todayInput()}
              value={form.expected_completion_date}
              onChange={(e) => set("expected_completion_date", e.target.value)}
              data-testid="new-expected-completion"
            />
          </Field>

          <Field label="Description" optional full htmlFor="pj-desc">
            <TextArea
              id="pj-desc"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="e.g. 4BHK residence — full interiors, landscaping and façade refresh"
            />
          </Field>
        </FormSection>

        <div className="inos-form-actions">
          <span className="inos-form-actions__note">
            <Flag size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} aria-hidden />
            {isEdit ? "Changes apply immediately to the project workspace." : "Phases and document checklists appear in the project workspace."}
          </span>
          <div className="inos-form-actions__buttons">
            <Button variant="ghost" onClick={() => nav(backTarget)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={busy} data-testid="btn-create-project-confirm">
              {isEdit ? "Save changes" : "Create project"}
            </Button>
          </div>
        </div>
      </form>
    </Page>
  );
}
