import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText, RefreshCw, SearchX, PenTool } from "lucide-react";

import {
  Page,
  PageHeader,
  Card,
  Button,
  Toolbar,
  ToolbarSpacer,
  SearchInput,
  Segmented,
  Pill,
  Field,
  TextInput,
  TextArea,
  SelectInput,
  ChoiceGroup,
} from "@/components/inos";

import {
  useGetDocumentTypesQuery,
  useCreateDocumentTypeMutation,
  useUpdateDocumentTypeMutation,
  useDeleteDocumentTypeMutation,
} from "../../api/documents/document.api";
import { useGetProjectPhasesQuery } from "../../api/projects/project.api";
import {
  AdminModal,
  ModalActions,
  SkeletonRows,
  TableEmpty,
  ToggleRow,
  adminCrumbs,
  humanize,
  plural,
} from "../settings/_admin-ui";

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
  phaseCode: "",
  projectPhaseId: "",
  targetType: "DOCUMENT",
  isActive: true,
};

const TARGETS = [
  { value: "DOCUMENT", label: "Document", icon: FileText },
  { value: "DRAWING", label: "Drawing", icon: PenTool },
];

const toCode = (s) =>
  String(s || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const DocumentTypes = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [codeTouched, setCodeTouched] = useState(false);
  const [errors, setErrors] = useState({});

  const {
    data: documentTypes = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetDocumentTypesQuery({});

  const { data: phasesData = [] } = useGetProjectPhasesQuery({});
  const phases = Array.isArray(phasesData) ? phasesData : [];
  const phaseById = useMemo(() => Object.fromEntries(phases.map((p) => [p.id, p])), [phases]);

  const [createDocumentType, { isLoading: isCreating }] =
    useCreateDocumentTypeMutation();

  const [updateDocumentType, { isLoading: isUpdating }] =
    useUpdateDocumentTypeMutation();

  const [deleteDocumentType, { isLoading: isDeleting }] =
    useDeleteDocumentTypeMutation();

  const allTypes = Array.isArray(documentTypes) ? documentTypes : [];
  const activeCount = allTypes.filter((t) => t.isActive !== false).length;

  const filteredDocumentTypes = useMemo(() => {
    const list = Array.isArray(documentTypes) ? documentTypes : [];
    const value = search.trim().toLowerCase();

    return list.filter((item) => {
      const active = item.isActive !== false;
      if (statusFilter === "active" && !active) return false;
      if (statusFilter === "inactive" && active) return false;
      if (!value) return true;
      return [item.name, item.code, item.description, item.phaseCode, item.targetType]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value));
    });
  }, [documentTypes, search, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setCodeTouched(false);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);

    setForm({
      name: item.name || "",
      code: item.code || "",
      description: item.description || "",
      phaseCode: item.phaseCode || "",
      projectPhaseId: item.projectPhaseId || "",
      targetType: item.targetType || "DOCUMENT",
      isActive:
        item.isActive === undefined || item.isActive === null
          ? true
          : Boolean(item.isActive),
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

  const setField = (name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "name" && !codeTouched) next.code = toCode(value);
      if (name === "projectPhaseId") next.phaseCode = phaseById[value]?.phase_code || phaseById[value]?.code || "";
      return next;
    });
    if (name === "code") setCodeTouched(true);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleChange = (event) => setField(event.target.name, event.target.value);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const next = {};
    if (!form.name.trim()) next.name = "Document type name is required.";
    if (!form.code.trim()) next.code = "A short code is required.";
    if (!form.projectPhaseId) next.projectPhaseId = "Choose the phase this document belongs to.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const phase = phaseById[form.projectPhaseId];

    try {
      const payload = {
        name: form.name.trim(),
        code: toCode(form.code) || undefined,
        description: form.description.trim() || undefined,
        phaseCode: form.phaseCode.trim() || phase?.phase_code || undefined,
        phaseName: phase?.title || phase?.name || undefined,
        projectPhaseId: form.projectPhaseId || undefined,
        targetType: form.targetType || undefined,
        isActive: form.isActive,
      };

      if (editingId) {
        await updateDocumentType({
          id: editingId,
          data: payload,
        }).unwrap();

        toast.success("Document type updated successfully");
      } else {
        await createDocumentType(payload).unwrap();

        toast.success("Document type created successfully");
      }

      setShowModal(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (error) {
      const msg = error?.data?.message;
      toast.error(
        (Array.isArray(msg) ? msg.join(" ") : msg) ||
          error?.message ||
          "Unable to save document type",
      );
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete document type "${item.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await deleteDocumentType(item.id).unwrap();
      toast.success("Document type deleted successfully");
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to delete document type",
      );
    }
  };

  const saving = isCreating || isUpdating;

  return (
    <Page>
      <PageHeader
        crumbs={adminCrumbs("Document types")}
        title="Document types"
        subtitle="The kinds of documents and drawings each project phase expects — briefs, recce reports, GFC drawings and more."
        actions={
          <Button variant="primary" icon={Plus} onClick={openCreate} data-testid="add-doc-type-btn">
            Add document type
          </Button>
        }
      />

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, code or phase" />
        <Segmented
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: `All · ${allTypes.length}` },
            { value: "active", label: `Active · ${activeCount}` },
            { value: "inactive", label: `Inactive · ${allTypes.length - activeCount}` },
          ]}
        />
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
                <th>Document type</th>
                <th>Code</th>
                <th className="adm-hide-sm">Phase</th>
                <th className="adm-hide-sm">Kind</th>
                <th>Status</th>
                <th className="actions" aria-label="Actions" />
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <SkeletonRows cols={6} rows={3} />
              ) : allTypes.length === 0 ? (
                <TableEmpty
                  cols={6}
                  icon={FileText}
                  title={isError ? "Couldn't load document types" : "No document types yet"}
                  text={
                    isError
                      ? "The documents service didn't respond. Try refreshing."
                      : "Define what each phase should produce — e.g. Site recce report under 02 Recce — and projects will track them automatically."
                  }
                  action={!isError && <Button variant="soft" icon={Plus} onClick={openCreate}>Add document type</Button>}
                />
              ) : filteredDocumentTypes.length === 0 ? (
                <TableEmpty cols={6} icon={SearchX} title="No matching document types" text="Try a different search or filter." />
              ) : (
                filteredDocumentTypes.map((item) => {
                  const phase = phaseById[item.projectPhaseId];
                  const active = item.isActive !== false;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="adm-cell-main">
                          <span className="inos-icon-tile inos-icon-tile--sm">
                            {item.targetType === "DRAWING" ? <PenTool aria-hidden /> : <FileText aria-hidden />}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div className="adm-cell-title">{item.name || "Untitled"}</div>
                            {item.description && <div className="adm-cell-sub">{item.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{item.code ? <span className="adm-code">{item.code}</span> : <span className="muted">—</span>}</td>
                      <td className="adm-cell-2 adm-hide-sm">{phase?.title || item.phaseName || item.phaseCode || <span className="muted">—</span>}</td>
                      <td className="adm-hide-sm">
                        {item.targetType ? <Pill tone={item.targetType === "DRAWING" ? "lilac" : "info"} dot={false}>{humanize(item.targetType)}</Pill> : <span className="muted">—</span>}
                      </td>
                      <td>
                        <Pill tone={active ? "ok" : "mute"}>{active ? "Active" : "Inactive"}</Pill>
                      </td>
                      <td className="actions">
                        <div className="adm-icon-btns">
                          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(item)} title="Edit" aria-label={`Edit ${item.name}`} />
                          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(item)} disabled={isDeleting} title="Delete" aria-label={`Delete ${item.name}`} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {allTypes.length > 0 && <div className="adm-table-foot">{plural(filteredDocumentTypes.length, "document type")} shown</div>}
      </Card>

      <AdminModal
        open={showModal}
        as="form"
        onSubmit={handleSubmit}
        onClose={closeModal}
        busy={saving}
        icon={FileText}
        title={editingId ? "Edit document type" : "Add document type"}
        subtitle="Document types sit under a project phase and appear in every project's checklist."
        width={620}
        testId="doc-type-modal"
        footer={<ModalActions onCancel={closeModal} submitting={saving} submitLabel={editingId ? "Save changes" : "Add document type"} />}
      >
        <div className="inos-form-grid">
          <Field label="Name" required full error={errors.name} htmlFor="dt-name">
            <TextInput id="dt-name" name="name" autoFocus value={form.name} invalid={!!errors.name} onChange={handleChange} placeholder="e.g. Site recce report" />
          </Field>

          <Field label="Project phase" required error={errors.projectPhaseId} htmlFor="dt-phase">
            <SelectInput
              id="dt-phase"
              name="projectPhaseId"
              value={form.projectPhaseId}
              invalid={!!errors.projectPhaseId}
              onChange={handleChange}
              placeholder={phases.length ? "Choose a phase" : "No phases yet"}
            >
              {phases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.name}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Code" required error={errors.code} htmlFor="dt-code" hint="Filled in from the name.">
            <TextInput id="dt-code" name="code" value={form.code} invalid={!!errors.code} onChange={handleChange} placeholder="e.g. SITE_RECCE_REPORT" className="adm-upper" />
          </Field>

          <Field label="Kind" full>
            <ChoiceGroup name="Kind" value={form.targetType} onChange={(v) => setField("targetType", v)} options={TARGETS} />
          </Field>

          <Field label="Description" optional full htmlFor="dt-desc">
            <TextArea id="dt-desc" name="description" value={form.description} onChange={handleChange} rows={3} placeholder="What this document contains and who prepares it." />
          </Field>

          <div className="span-full">
            <ToggleRow
              label="Active"
              hint="Inactive types stay on record but aren't offered for new projects."
              checked={form.isActive}
              onChange={(v) => setField("isActive", v)}
            />
          </div>
        </div>
      </AdminModal>
    </Page>
  );
};

export default DocumentTypes;
