import React, { useState } from "react";
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
  Loader2,
  Eye,
  Code,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  useGetTermsTemplatesQuery,
  useGetTermsTemplateVersionsQuery,
  useCreateTermsTemplateMutation,
  useUpdateTermsTemplateMutation,
  useUpdateTermsTemplateContentMutation,
  useDeleteTermsTemplateMutation,
} from "../../api/terms.api";

import {
  TermsPreview,
  TermsFullDisplay,
  TermsSection,
} from "../../components/settings/TermsDisplay";

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
    label: "Bill of Quantities",
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

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TermsSettings() {
  const { data: templates, isLoading } = useGetTermsTemplatesQuery();
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

  const resetCreateForm = () =>
    setCreateForm({ name: "", scope: "GLOBAL", content_html: "" });

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.content_html.trim()) {
      toast.error("Name and content are required");
      return;
    }
    try {
      await createTemplate(createForm).unwrap();
      toast.success("Template created");
      setCreateOpen(false);
      resetCreateForm();
    } catch {
      toast.error("Failed to create template");
    }
  };

  const openEditContent = (template) => {
    setEditingTemplate(template);
    setEditContent(template.content_html || "");
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
        content_html: editContent,
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

  const templatesByScope = (scope) =>
    (templates || []).filter((t) => t.scope === scope);

  const TemplateRow = ({ template }) => (
    <div className="flex items-start justify-between py-4 gap-3 group hover:bg-[#F5F9F8] px-6 -mx-6 px-6">
      <div className="flex gap-3 min-w-0 flex-1">
        <button
          onClick={() => toggleDefault(template)}
          title={template.is_default ? "Default template" : "Set as default"}
          className="w-10 h-10 rounded-lg bg-[#EDF4F2] flex items-center justify-center shrink-0 hover:bg-[#E2E8E6] transition-colors"
        >
          <Star
            size={18}
            style={{ color: "var(--ink-green)" }}
            fill={template.is_default ? "var(--ink-green)" : "none"}
          />
        </button>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[15px] text-[#2D3A3A] truncate">
            {template.name}
          </p>
          <p className="text-xs text-[#6B7B7C] mt-1">
            v{template.current_version} · updated{" "}
            {formatDate(template.updated_at)}
          </p>
          <div className="mt-3">
            <TermsPreview htmlContent={template.content_html} maxPreview={2} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setPreviewTemplateId(template.id)}
          title="Preview all terms"
          className="w-9 h-9 rounded-lg border border-[#E2E8E6] flex items-center justify-center hover:bg-[#EDF4F2]"
        >
          <Eye size={15} className="text-[#6B7B7C]" />
        </button>
        <button
          onClick={() => setHistoryTemplateId(template.id)}
          title="Version history"
          className="w-9 h-9 rounded-lg border border-[#E2E8E6] flex items-center justify-center hover:bg-[#EDF4F2]"
        >
          <History size={15} className="text-[#6B7B7C]" />
        </button>
        <button
          onClick={() => openEditContent(template)}
          title="Edit content"
          className="w-9 h-9 rounded-lg border border-[#E2E8E6] flex items-center justify-center hover:bg-[#EDF4F2]"
        >
          <Pencil size={15} className="text-[#6B7B7C]" />
        </button>
        <button
          onClick={() => handleDelete(template)}
          title="Delete"
          className="w-9 h-9 rounded-lg border border-[#E2E8E6] flex items-center justify-center hover:bg-red-50"
        >
          <Trash2 size={15} className="text-red-500" />
        </button>
        <Separator orientation="vertical" className="mx-1" />
        <Switch
          checked={template.is_active}
          onCheckedChange={() => toggleActive(template)}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            className="text-2xl font-semibold"
            style={{ color: "var(--ink-green)" }}
          >
            Terms & Conditions
          </h2>
          <p className="text-[#6B7B7C] mt-2 max-w-2xl">
            Manage reusable terms templates used across BOQs, invoices,
            contracts, and purchase orders. Each template is organized by scope
            for easy application. Editing a template's wording creates a new
            version — documents that already used an earlier version keep their
            original text.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="h-10 px-4 rounded-xl text-white text-[13px] font-semibold flex items-center gap-2 shrink-0"
          style={{ backgroundColor: "var(--ink-green)" }}
        >
          <Plus size={15} /> New Template
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-[#6B7B7C] text-sm py-8">
          <Loader2 size={15} className="animate-spin" /> Loading templates…
        </div>
      )}

      {!isLoading &&
        SCOPES.map(({ value, label, icon: Icon, description }) => {
          const scoped = templatesByScope(value);
          return (
            <div
              key={value}
              className="rounded-xl border border-[#E2E8E6] bg-white overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[#E2E8E6] bg-[#F5F9F8]">
                <h3 className="font-semibold flex items-center gap-3 text-[#2D3A3A]">
                  <Icon size={20} className="text-[#6B7B7C]" />
                  {label}
                  <span className="text-xs font-medium text-white bg-[#6B7B7C] px-2 py-1 rounded">
                    {scoped.length}
                  </span>
                </h3>
                <p className="text-sm text-[#6B7B7C] mt-2">{description}</p>
              </div>

              <div>
                {scoped.length === 0 ? (
                  <p className="py-8 text-sm text-[#6B7B7C] px-6 text-center">
                    No templates yet for this scope.
                  </p>
                ) : (
                  scoped.map((template, i) => (
                    <React.Fragment key={template.id}>
                      <TemplateRow template={template} />
                      {i < scoped.length - 1 && <Separator />}
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>
          );
        })}

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

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
    setPreviewMode(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Terms Template</DialogTitle>
          <DialogDescription>
            This becomes v1. You can edit the wording later — each edit creates
            a new version rather than overwriting this one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs uppercase tracking-widest text-[#6B7B7C] font-semibold">
              Template Name
            </label>
            <input
              className="mt-2 w-full h-10 px-3 rounded-lg border border-[#E2E8E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#E2E8E6]"
              placeholder="e.g. Standard Residential Terms"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Scope */}
          <div>
            <label className="text-xs uppercase tracking-widest text-[#6B7B7C] font-semibold">
              Scope
            </label>
            <select
              className="mt-2 w-full h-10 px-3 rounded-lg border border-[#E2E8E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#E2E8E6]"
              value={form.scope}
              onChange={(e) =>
                setForm((f) => ({ ...f, scope: e.target.value }))
              }
            >
              {SCOPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#6B7B7C] mt-1">
              {SCOPES.find((s) => s.value === form.scope)?.description}
            </p>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-widest text-[#6B7B7C] font-semibold">
                Terms Content
              </label>
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                {previewMode ? <Code size={14} /> : <Eye size={14} />}
                {previewMode ? "Edit" : "Preview"}
              </button>
            </div>

            {previewMode ? (
              <div className="w-full min-h-[160px] p-3 rounded-lg border border-[#E2E8E6] bg-[#F5F9F8]">
                {form.content_html.trim() ? (
                  <div className="space-y-2">
                    <TermsPreview
                      htmlContent={form.content_html}
                      maxPreview={10}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-[#6B7B7C] italic">
                    Enter content to see preview…
                  </p>
                )}
              </div>
            ) : (
              <textarea
                className="w-full min-h-[160px] px-3 py-2 rounded-lg border border-[#E2E8E6] text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#E2E8E6] font-mono text-xs"
                placeholder={`<ol>
  <li>All quantities are approximate and subject to site verification.</li>
  <li>Rates include labour, material, tools, and equipment unless otherwise specified.</li>
  <li>Any variation in scope shall be treated as extra work.</li>
</ol>`}
                value={form.content_html}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    content_html: e.target.value,
                  }))
                }
              />
            )}
            <p className="text-xs text-[#6B7B7C] mt-1">
              Paste HTML list format or plain text with line breaks
            </p>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={handleClose}
            className="h-10 px-4 rounded-xl border border-[#E2E8E6] text-[13px] font-semibold hover:bg-[#F5F9F8]"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            disabled={isCreating}
            className="h-10 px-4 rounded-xl text-white text-[13px] font-semibold disabled:opacity-50"
            style={{ backgroundColor: "var(--ink-green)" }}
          >
            {isCreating ? "Creating…" : "Create Template"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <Dialog open={!!template} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit "{template.name}"</DialogTitle>
          <DialogDescription>
            Saving creates v{(template.current_version || 1) + 1}. Documents
            that already snapshotted an earlier version are unaffected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview/Edit Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-widest text-[#6B7B7C] font-semibold">
              Content
            </label>
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              {previewMode ? <Code size={14} /> : <Eye size={14} />}
              {previewMode ? "Edit" : "Preview"}
            </button>
          </div>

          {previewMode ? (
            <div className="w-full min-h-[240px] p-4 rounded-lg border border-[#E2E8E6] bg-[#F5F9F8] overflow-y-auto">
              <TermsFullDisplay htmlContent={editContent} />
            </div>
          ) : (
            <textarea
              className="w-full min-h-[240px] px-3 py-2 rounded-lg border border-[#E2E8E6] text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#E2E8E6] font-mono text-xs"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
          )}

          {/* Change Note */}
          <div>
            <label className="text-xs uppercase tracking-widest text-[#6B7B7C] font-semibold">
              Change Note (optional)
            </label>
            <input
              className="mt-2 w-full h-10 px-3 rounded-lg border border-[#E2E8E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#E2E8E6]"
              placeholder="e.g. Updated payment terms clause"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
            />
            <p className="text-xs text-[#6B7B7C] mt-1">
              Describe what changed for version history
            </p>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-[#E2E8E6] text-[13px] font-semibold hover:bg-[#F5F9F8]"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="h-10 px-4 rounded-xl text-white text-[13px] font-semibold disabled:opacity-50"
            style={{ backgroundColor: "var(--ink-green)" }}
          >
            {isSaving ? "Saving…" : "Save as new version"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VersionHistoryDialog({ templateId, onClose }) {
  const { data: versions, isLoading } = useGetTermsTemplateVersionsQuery(
    templateId,
    { skip: !templateId },
  );

  if (!templateId) return null;

  return (
    <Dialog open={!!templateId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            Newest first. Each version is immutable once created.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[500px] overflow-y-auto space-y-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-[#6B7B7C] text-sm py-8">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          )}
          {!isLoading && (versions || []).length === 0 && (
            <p className="text-sm text-[#6B7B7C] py-8 text-center">
              No versions found.
            </p>
          )}
          {(versions || []).map((v, idx) => (
            <div key={v.id} className="rounded-lg border border-[#E2E8E6] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-[#2D3A3A] text-sm">
                  v{v.version}
                  {idx === 0 && (
                    <span className="text-xs ml-2 text-white bg-[#6B7B7C] px-2 py-1 rounded">
                      Latest
                    </span>
                  )}
                </span>
                <span className="text-xs text-[#6B7B7C]">
                  {formatDate(v.created_at)}
                </span>
              </div>

              {v.change_note && (
                <p className="text-xs text-[#6B7B7C] italic mb-3 p-2 bg-[#F5F9F8] rounded">
                  {v.change_note}
                </p>
              )}

              <div className="text-xs text-[#2D3A3A] max-h-[120px] overflow-y-auto">
                <TermsFullDisplay htmlContent={v.content_html} />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-[#E2E8E6] text-[13px] font-semibold hover:bg-[#F5F9F8]"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewTemplateDialog({ templateId, templates, onClose }) {
  const template = templates?.find((t) => t.id === templateId);

  if (!templateId || !template) return null;

  return (
    <Dialog open={!!templateId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>
            Full terms preview for v{template.current_version}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[500px] overflow-y-auto p-4 rounded-lg border border-[#E2E8E6] bg-[#F5F9F8]">
          <TermsFullDisplay htmlContent={template.content_html} />
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-[#E2E8E6] text-[13px] font-semibold hover:bg-[#F5F9F8]"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
