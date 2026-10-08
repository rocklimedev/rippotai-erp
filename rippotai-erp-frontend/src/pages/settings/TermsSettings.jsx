import { termsToText, textToTermsHtml } from "@/lib/terms";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  ClipboardList,
  Building2,
  Users,
  Calculator,
  Plus,
  History,
  Star,
  Trash2,
  Pencil,
  Eye,
  ScrollText,
} from "lucide-react";

import {
  Page,
  PageHeader,
  Card,
  Button,
  Tabs,
  EmptyState,
  Pill,
  Field,
  TextInput,
  TextArea,
  ChoiceGroup,
  Segmented,
} from "@/components/inos";

import {
  useGetTermsTemplatesQuery,
  useGetTermsTemplateVersionsQuery,
  useCreateTermsTemplateMutation,
  useUpdateTermsTemplateMutation,
  useUpdateTermsTemplateContentMutation,
  useDeleteTermsTemplateMutation,
} from "../../api/meta/terms.api";

import {
  TermsPreview,
  TermsFullDisplay,
} from "../../components/settings/TermsDisplay";
import {
  AdminModal,
  ModalActions,
  Switch,
  adminCrumbs,
  plural,
} from "./_admin-ui";

const SCOPES = [
  {
    value: "GLOBAL",
    label: "Global",
    icon: FileText,
    description: "Usable anywhere in the platform.",
  },
  {
    value: "PROJECT",
    label: "Projects",
    icon: Building2,
    description: "Shown when applying terms to a project.",
  },
  {
    value: "CLIENT",
    label: "Clients",
    icon: Users,
    description: "Shown when applying terms to a client.",
  },
  {
    value: "BOQ",
    label: "Bill of quantities",
    icon: ClipboardList,
    description: "Shown in the BOQ terms picker.",
  },
  {
    value: "ESTIMATE",
    label: "Estimates",
    icon: Calculator,
    description: "Shown when applying terms to an estimate.",
  },
];

const SCOPE_TONE = {
  GLOBAL: "brand",
  PROJECT: "info",
  CLIENT: "lilac",
  BOQ: "peach",
  ESTIMATE: "ok",
};

const CONTENT_PLACEHOLDER = `All quantities are approximate and subject to site verification.
Rates include labour, material, tools and equipment unless stated otherwise.
Any variation in scope will be treated as extra work.`;

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TermsSettings() {
  const {
    data: templates,
    isLoading,
    isError,
  } = useGetTermsTemplatesQuery({ includeInactive: true });
  const [createTemplate, { isLoading: creating }] =
    useCreateTermsTemplateMutation();
  const [updateTemplate] = useUpdateTermsTemplateMutation();
  const [updateContent, { isLoading: savingContent }] =
    useUpdateTermsTemplateContentMutation();
  const [deleteTemplate] = useDeleteTermsTemplateMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    scope: "GLOBAL",
    content_html: "",
  });

  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [previewMode, setPreviewMode] = useState(true);

  const [historyTemplateId, setHistoryTemplateId] = useState(null);
  const [previewTemplateId, setPreviewTemplateId] = useState(null);

  const [scopeFilter, setScopeFilter] = useState("ALL");

  const resetCreateForm = () =>
    setCreateForm({ name: "", scope: "GLOBAL", content_html: "" });

  const openCreate = (scope) => {
    setCreateForm({
      name: "",
      scope: scope && scope !== "ALL" ? scope : "GLOBAL",
      content_html: "",
    });
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.content_html.trim()) {
      toast.error("Name and content are required");
      return false;
    }
    try {
      await createTemplate({
        ...createForm,
        name: createForm.name.trim(),
        content_html: textToTermsHtml(createForm.content_html),
      }).unwrap();
      toast.success("Template created");
      setCreateOpen(false);
      resetCreateForm();
      return true;
    } catch {
      toast.error("Failed to create template");
      return false;
    }
  };

  const openEditContent = (template) => {
    setEditingTemplate(template);
    setEditContent(termsToText(template.content_html));
    setChangeNote("");
    setPreviewMode(false);
  };

  const handleSaveContent = async () => {
    if (!editingTemplate) return;
    if (!editContent.trim()) {
      toast.error("Content can't be empty");
      return;
    }
    try {
      await updateContent({
        id: editingTemplate.id,
        content_html: textToTermsHtml(editContent),
        change_note: changeNote || undefined,
      }).unwrap();
      toast.success(`Saved as v${(editingTemplate.current_version || 1) + 1}`);
      setEditingTemplate(null);
    } catch {
      toast.error("Failed to save changes");
    }
  };

  const toggleActive = async (template) => {
    try {
      await updateTemplate({
        id: template.id,
        is_active: !template.is_active,
      }).unwrap();
    } catch {
      toast.error("Update failed");
    }
  };

  const toggleDefault = async (template) => {
    try {
      await updateTemplate({
        id: template.id,
        is_default: !template.is_default,
      }).unwrap();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (template) => {
    if (!confirm(`Delete "${template.name}"? This can't be undone.`)) return;
    try {
      await deleteTemplate(template.id).unwrap();
      toast.success("Template deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const all = useMemo(
    () => (Array.isArray(templates) ? templates : []),
    [templates],
  );
  const templatesByScope = (scope) => all.filter((t) => t.scope === scope);

  const visibleScopes =
    scopeFilter === "ALL"
      ? SCOPES.filter((s) => templatesByScope(s.value).length > 0)
      : SCOPES.filter((s) => s.value === scopeFilter);

  const renderRow = (template) => (
    <div key={template.id} className="adm-term-row">
      <button
        type="button"
        className="adm-star"
        aria-pressed={!!template.is_default}
        onClick={() => toggleDefault(template)}
        title={
          template.is_default
            ? "Default template — click to unset"
            : "Set as default"
        }
      >
        <Star
          aria-hidden
          fill={template.is_default ? "currentColor" : "none"}
        />
      </button>

      <div style={{ minWidth: 0, flex: 1, display: "grid", gap: 8 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span className="adm-cell-title" style={{ fontSize: 15 }}>
            {template.name}
          </span>
          {template.is_default && (
            <Pill tone="warn" size="sm">
              Default
            </Pill>
          )}
          {!template.is_active && (
            <Pill tone="mute" size="sm">
              Inactive
            </Pill>
          )}
        </div>
        <div className="adm-cell-sub" style={{ marginTop: -4 }}>
          v{template.current_version} · updated{" "}
          {formatDate(template.updated_at)}
        </div>
        <TermsPreview htmlContent={template.content_html} maxPreview={2} />
      </div>

      <div
        style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
      >
        <Button
          variant="ghost"
          size="sm"
          icon={Eye}
          title="Preview all terms"
          aria-label="Preview all terms"
          onClick={() => setPreviewTemplateId(template.id)}
        />
        <Button
          variant="ghost"
          size="sm"
          icon={History}
          title="Version history"
          aria-label="Version history"
          onClick={() => setHistoryTemplateId(template.id)}
        />
        <Button
          variant="ghost"
          size="sm"
          icon={Pencil}
          title="Edit wording"
          aria-label="Edit wording"
          onClick={() => openEditContent(template)}
        />
        <Button
          variant="ghost"
          size="sm"
          icon={Trash2}
          title="Delete"
          aria-label="Delete"
          onClick={() => handleDelete(template)}
        />
        <span
          style={{
            width: 1,
            height: 20,
            background: "var(--line)",
            margin: "0 6px",
          }}
          aria-hidden
        />
        <Switch
          checked={!!template.is_active}
          onChange={() => toggleActive(template)}
          label={
            template.is_active ? "Deactivate template" : "Activate template"
          }
        />
      </div>
    </div>
  );

  return (
    <Page>
      <PageHeader
        crumbs={adminCrumbs("Terms & conditions")}
        title="Terms & conditions"
        subtitle="Reusable terms for BOQs, estimates, projects and clients. Editing wording saves a new version — documents keep the text they were issued with."
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => openCreate(scopeFilter)}
            data-testid="new-terms-btn"
          >
            New template
          </Button>
        }
      />

      <Tabs
        value={scopeFilter}
        onChange={setScopeFilter}
        options={[
          { value: "ALL", label: "All", count: all.length },
          ...SCOPES.map((s) => ({
            value: s.value,
            label: s.label,
            icon: s.icon,
            count: templatesByScope(s.value).length,
          })),
        ]}
      />

      {isLoading ? (
        <Card>
          <div style={{ display: "grid", gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="adm-skel"
                style={{ height: 16, width: `${80 - i * 12}%` }}
              />
            ))}
          </div>
        </Card>
      ) : scopeFilter === "ALL" && all.length === 0 ? (
        <Card>
          <EmptyState
            icon={ScrollText}
            title={
              isError ? "Couldn't load templates" : "No terms templates yet"
            }
            text={
              isError
                ? "The terms service didn't respond. Try again in a moment."
                : "Write your standard terms once — payment, scope, validity — and apply them to BOQs and estimates in a click."
            }
            action={
              !isError && (
                <Button
                  variant="soft"
                  icon={Plus}
                  onClick={() => openCreate("GLOBAL")}
                >
                  Create first template
                </Button>
              )
            }
          />
        </Card>
      ) : (
        visibleScopes.map(({ value, label, icon: Icon, description }) => {
          const scoped = templatesByScope(value);
          return (
            <section key={value} className="inos-card">
              <div className="inos-card__header">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    minWidth: 0,
                  }}
                >
                  <span
                    className={`inos-icon-tile inos-icon-tile--${SCOPE_TONE[value] === "brand" ? "" : SCOPE_TONE[value]}`}
                  >
                    <Icon aria-hidden />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h2 className="inos-section-title">{label}</h2>
                    <p className="inos-section-sub">
                      {description} · {plural(scoped.length, "template")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Plus}
                  onClick={() => openCreate(value)}
                >
                  Add
                </Button>
              </div>
              {scoped.length === 0 ? (
                <EmptyState
                  icon={Icon}
                  title={`No ${label.toLowerCase()} templates`}
                  text="Templates you add for this scope will appear here."
                />
              ) : (
                scoped.map(renderRow)
              )}
            </section>
          );
        })
      )}

      {/* Create Template Dialog */}
      <CreateTemplateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        form={createForm}
        setForm={setCreateForm}
        onCreate={handleCreate}
        isCreating={creating}
        resetForm={resetCreateForm}
      />

      {/* Edit Template Dialog */}
      <EditTemplateDialog
        template={editingTemplate}
        editContent={editContent}
        setEditContent={setEditContent}
        changeNote={changeNote}
        setChangeNote={setChangeNote}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        onSave={handleSaveContent}
        isSaving={savingContent}
        onClose={() => setEditingTemplate(null)}
      />

      {/* Version History Dialog */}
      <VersionHistoryDialog
        templateId={historyTemplateId}
        onClose={() => setHistoryTemplateId(null)}
      />

      {/* Preview Dialog */}
      <PreviewTemplateDialog
        templateId={previewTemplateId}
        templates={templates}
        onClose={() => setPreviewTemplateId(null)}
      />
    </Page>
  );
}

function WriteOrPreview({
  value,
  onChange,
  preview,
  setPreview,
  rows = 8,
  placeholder,
  invalid,
  full,
}) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Segmented
          value={preview ? "preview" : "write"}
          onChange={(v) => setPreview(v === "preview")}
          options={[
            { value: "write", label: "Write", icon: Pencil },
            { value: "preview", label: "Preview", icon: Eye },
          ]}
        />
      </div>
      {preview ? (
        <div className="adm-preview-box">
          {value.trim() ? (
            full ? (
              <TermsFullDisplay htmlContent={textToTermsHtml(value)} />
            ) : (
              <TermsPreview
                htmlContent={textToTermsHtml(value)}
                maxPreview={50}
              />
            )
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>
              Write some terms to see the preview.
            </p>
          )}
        </div>
      ) : (
        <TextArea
          rows={rows}
          value={value}
          invalid={invalid}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function CreateTemplateDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onCreate,
  isCreating,
  resetForm,
}) {
  const [previewMode, setPreviewMode] = useState(false);
  const [errors, setErrors] = useState({});

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
    setPreviewMode(false);
    setErrors({});
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    const next = {};
    if (!form.name.trim()) next.name = "Give the template a name.";
    if (!form.content_html.trim()) next.content = "Write at least one term.";
    setErrors(next);
    if (Object.keys(next).length) {
      if (next.content) setPreviewMode(false);
      return;
    }
    const ok = await onCreate();
    if (ok) {
      setPreviewMode(false);
      setErrors({});
    }
  };

  return (
    <AdminModal
      open={open}
      as="form"
      onSubmit={submit}
      onClose={handleClose}
      busy={isCreating}
      icon={ScrollText}
      title="New terms template"
      subtitle="This becomes v1. Later edits create new versions instead of overwriting it."
      width={680}
      testId="terms-create-modal"
      footer={
        <ModalActions
          onCancel={handleClose}
          submitting={isCreating}
          submittingLabel="Creating…"
          submitLabel="Create template"
        />
      }
    >
      <Field
        label="Template name"
        required
        htmlFor="tt-name"
        error={errors.name}
      >
        <TextInput
          id="tt-name"
          autoFocus
          placeholder="e.g. Standard residential terms"
          value={form.name}
          invalid={!!errors.name}
          onChange={(e) => {
            setForm((f) => ({ ...f, name: e.target.value }));
            setErrors((x) => ({ ...x, name: undefined }));
          }}
        />
      </Field>

      <Field
        label="Where it's offered"
        required
        hint={SCOPES.find((s) => s.value === form.scope)?.description}
      >
        <ChoiceGroup
          name="Scope"
          value={form.scope}
          onChange={(v) => setForm((f) => ({ ...f, scope: v }))}
          options={SCOPES.map((s) => ({
            value: s.value,
            label: s.label,
            icon: s.icon,
          }))}
        />
      </Field>

      <Field
        label="Terms"
        required
        error={errors.content}
        hint="Write one term per line."
      >
        <WriteOrPreview
          value={form.content_html}
          onChange={(v) => {
            setForm((f) => ({ ...f, content_html: v }));
            setErrors((x) => ({ ...x, content: undefined }));
          }}
          preview={previewMode}
          setPreview={setPreviewMode}
          placeholder={CONTENT_PLACEHOLDER}
          invalid={!!errors.content}
        />
      </Field>
    </AdminModal>
  );
}

function EditTemplateDialog({
  template,
  editContent,
  setEditContent,
  changeNote,
  setChangeNote,
  previewMode,
  setPreviewMode,
  onSave,
  isSaving,
  onClose,
}) {
  if (!template) return null;

  return (
    <AdminModal
      as="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      onClose={onClose}
      busy={isSaving}
      icon={Pencil}
      title={`Edit “${template.name}”`}
      subtitle={`Saving creates v${(template.current_version || 1) + 1}. Documents that used an earlier version are unaffected.`}
      width={680}
      footer={
        <ModalActions
          onCancel={onClose}
          submitting={isSaving}
          submitLabel="Save as new version"
        />
      }
    >
      <Field label="Terms" required>
        <WriteOrPreview
          value={editContent}
          onChange={setEditContent}
          preview={previewMode}
          setPreview={setPreviewMode}
          rows={10}
          full
        />
      </Field>

      <Field
        label="What changed?"
        optional
        htmlFor="tt-note"
        hint="Shown in version history so your team knows why."
      >
        <TextInput
          id="tt-note"
          placeholder="e.g. Updated payment terms clause"
          value={changeNote}
          onChange={(e) => setChangeNote(e.target.value)}
        />
      </Field>
    </AdminModal>
  );
}

function VersionHistoryDialog({ templateId, onClose }) {
  const { data: versions, isLoading } = useGetTermsTemplateVersionsQuery(
    templateId,
    { skip: !templateId },
  );

  if (!templateId) return null;

  return (
    <AdminModal
      onClose={onClose}
      icon={History}
      title="Version history"
      subtitle="Newest first. Each version is locked once created."
      width={680}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {isLoading && (
        <div style={{ display: "grid", gap: 10 }}>
          <div className="adm-skel" style={{ width: "50%" }} />
          <div className="adm-skel" style={{ height: 60 }} />
        </div>
      )}
      {!isLoading && (versions || []).length === 0 && (
        <EmptyState
          icon={History}
          title="No versions found"
          text="Versions appear here after the template is created."
        />
      )}
      {(versions || []).map((v, idx) => (
        <div
          key={v.id}
          style={{
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: 16,
            display: "grid",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="adm-cell-title">v{v.version}</span>
              {idx === 0 && (
                <Pill tone="ok" size="sm">
                  Latest
                </Pill>
              )}
            </span>
            <span className="adm-cell-sub" style={{ marginTop: 0 }}>
              {formatDate(v.created_at)}
            </span>
          </div>

          {v.change_note && (
            <div
              className="adm-callout adm-callout--info"
              style={{ padding: "8px 12px" }}
            >
              {v.change_note}
            </div>
          )}

          <div style={{ maxHeight: 140, overflowY: "auto" }}>
            <TermsFullDisplay htmlContent={v.content_html} />
          </div>
        </div>
      ))}
    </AdminModal>
  );
}

function PreviewTemplateDialog({ templateId, templates, onClose }) {
  const template = templates?.find((t) => t.id === templateId);

  if (!templateId || !template) return null;

  return (
    <AdminModal
      onClose={onClose}
      icon={Eye}
      title={template.name}
      subtitle={`Full terms · v${template.current_version}`}
      width={680}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="adm-preview-box" style={{ maxHeight: 480 }}>
        <TermsFullDisplay htmlContent={template.content_html} />
      </div>
    </AdminModal>
  );
}
