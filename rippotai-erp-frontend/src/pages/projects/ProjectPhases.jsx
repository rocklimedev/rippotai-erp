import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Layers3, RefreshCw, SearchX } from "lucide-react";

import {
  Page,
  PageHeader,
  Card,
  Button,
  Toolbar,
  ToolbarSpacer,
  SearchInput,
  Pill,
  Field,
  TextInput,
  TextArea,
} from "@/components/inos";

import {
  useGetProjectPhasesQuery,
  useCreateProjectPhaseMutation,
  useUpdateProjectPhaseMutation,
  useDeleteProjectPhaseMutation,
} from "../../api/projects/project.api";
import {
  AdminModal,
  ModalActions,
  SkeletonRows,
  TableEmpty,
  adminCrumbs,
  humanize,
  plural,
} from "../settings/_admin-ui";

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
  phase_number: "",
};

const toCode = (s) =>
  String(s || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/** "01 BRIEF" -> "Brief" — the number already has its own column */
const phaseLabel = (item) => {
  const raw = String(item.title || item.name || "").replace(/^\d+[\s._-]+/, "");
  return humanize(raw) || item.title || item.name || "Untitled phase";
};

const ProjectPhases = () => {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [codeTouched, setCodeTouched] = useState(false);
  const [errors, setErrors] = useState({});

  const {
    data: projectPhases = [],
    isLoading,
    isFetching,
    isError,
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

  const allPhases = Array.isArray(projectPhases) ? projectPhases : [];

  const normalizedPhases = useMemo(() => {
    const list = Array.isArray(projectPhases) ? projectPhases : [];
    const value = search.trim().toLowerCase();

    if (!value) return list;

    return list.filter((item) =>
      [item.title, item.name, item.code, item.phase_code, item.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    );
  }, [projectPhases, search]);

  const nextNumber =
    allPhases.reduce((m, p) => Math.max(m, Number(p.phase_number) || 0), 0) + 1;

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, phase_number: String(nextNumber) });
    setCodeTouched(false);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);

    setForm({
      name: item.title || item.name || "",
      code: item.phase_code || item.code || item.phaseCode || "",
      description: item.description || "",
      phase_number: item.phase_number != null ? String(item.phase_number) : "",
    });
    setCodeTouched(true);
    setErrors({});
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

    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Suggest a code from the name until the user edits the code themselves
      if (name === "name" && !codeTouched) next.code = toCode(value);
      return next;
    });
    if (name === "code") setCodeTouched(true);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const next = {};
    if (!form.name.trim()) next.name = "Phase name is required.";
    if (!form.code.trim()) next.code = "A short code is required.";
    const num = Number(form.phase_number);
    if (!Number.isInteger(num) || num < 1) next.phase_number = "Use a whole number from 1.";
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      const title = form.name.trim();
      const code = toCode(form.code);
      const payload = {
        // API fields (title / phase_code / phase_number) + legacy aliases
        title,
        name: title,
        phase_code: code,
        code,
        phase_number: num,
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

      setShowModal(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (error) {
      const msg = error?.data?.message;
      toast.error(
        (Array.isArray(msg) ? msg.join(" ") : msg) ||
          error?.message ||
          "Unable to save project phase",
      );
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete project phase "${item.title}"? This action cannot be undone.`,
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

  const saving = isCreating || isUpdating;

  return (
    <Page>
      <PageHeader
        crumbs={adminCrumbs("Project phases")}
        title="Project phases"
        subtitle="The master stages every project moves through, from brief to handover."
        actions={
          <Button variant="primary" icon={Plus} onClick={openCreate} data-testid="add-phase-btn">
            Add phase
          </Button>
        }
      />

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search phases" />
        <ToolbarSpacer />
        <Button variant="ghost" icon={RefreshCw} onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </Toolbar>

      <Card flush>
        <div className="inos-table-wrap">
          <table className="inos-table">
            <thead>
              <tr>
                <th style={{ width: 64 }}>No.</th>
                <th>Phase</th>
                <th>Code</th>
                <th className="adm-hide-sm">Module</th>
                <th className="actions" aria-label="Actions" />
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <SkeletonRows cols={5} rows={4} />
              ) : allPhases.length === 0 && !search ? (
                <TableEmpty
                  cols={5}
                  icon={Layers3}
                  title={isError ? "Couldn't load phases" : "No phases yet"}
                  text={isError ? "The phases service didn't respond. Try refreshing." : "Add the stages your projects move through — for example Brief, Design, Execution."}
                  action={!isError && <Button variant="soft" icon={Plus} onClick={openCreate}>Add phase</Button>}
                />
              ) : normalizedPhases.length === 0 ? (
                <TableEmpty cols={5} icon={SearchX} title="No matching phases" text="Try a different name or code." />
              ) : (
                normalizedPhases.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <span className="adm-num">{item.phase_number ?? index + 1}</span>
                    </td>
                    <td>
                      <div className="adm-cell-title">{phaseLabel(item)}</div>
                      {item.description && <div className="adm-cell-sub">{item.description}</div>}
                    </td>
                    <td>
                      {item.phase_code || item.code ? (
                        <span className="adm-code">{item.phase_code || item.code}</span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="adm-hide-sm">
                      {item.module ? <Pill tone="info" dot={false}>{humanize(item.module)}</Pill> : <span className="muted">—</span>}
                    </td>
                    <td className="actions">
                      <div className="adm-icon-btns">
                        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(item)} title="Edit" aria-label={`Edit ${item.title}`} />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDelete(item)}
                          disabled={isDeleting}
                          title="Delete"
                          aria-label={`Delete ${item.title}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {allPhases.length > 0 && (
          <div className="adm-table-foot">
            {search ? `${plural(normalizedPhases.length, "phase")} match` : plural(allPhases.length, "phase")}
          </div>
        )}
      </Card>

      <AdminModal
        open={showModal}
        as="form"
        onSubmit={handleSubmit}
        onClose={closeModal}
        busy={saving}
        icon={Layers3}
        title={editingId ? "Edit phase" : "Add phase"}
        subtitle="Phases order the project workflow and group its documents."
        width={560}
        testId="phase-modal"
        footer={
          <ModalActions
            onCancel={closeModal}
            submitting={saving}
            submitLabel={editingId ? "Save changes" : "Add phase"}
          />
        }
      >
        <div className="inos-form-grid">
          <Field label="Phase name" required full error={errors.name} htmlFor="ph-name">
            <TextInput
              id="ph-name"
              name="name"
              autoFocus
              value={form.name}
              invalid={!!errors.name}
              onChange={handleChange}
              placeholder="e.g. Design development"
            />
          </Field>

          <Field label="Code" required error={errors.code} htmlFor="ph-code" hint="Filled in from the name — edit if you like.">
            <TextInput
              id="ph-code"
              name="code"
              value={form.code}
              invalid={!!errors.code}
              onChange={handleChange}
              placeholder="e.g. 05_DESIGN"
              className="adm-upper"
            />
          </Field>

          <Field label="Order" required error={errors.phase_number} htmlFor="ph-num" hint="Position in the workflow.">
            <TextInput
              id="ph-num"
              name="phase_number"
              type="number"
              min={1}
              value={form.phase_number}
              invalid={!!errors.phase_number}
              onChange={handleChange}
            />
          </Field>

          <Field label="Description" optional full htmlFor="ph-desc">
            <TextArea
              id="ph-desc"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="What happens in this phase and what it delivers."
            />
          </Field>
        </div>
      </AdminModal>
    </Page>
  );
};

export default ProjectPhases;
