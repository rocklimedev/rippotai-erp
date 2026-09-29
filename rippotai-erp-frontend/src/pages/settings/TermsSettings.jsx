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
  Loader2,
  Eye,
  Code,
  GripVertical,
  ChevronUp,
  ChevronDown,
  PlusCircle,
  X,
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
} from "../../api/meta/terms.api";

import {
  TermsPreview,
  TermsFullDisplay,
} from "../../components/settings/TermsDisplay";

/* ============================================================
   SCOPE CONFIG
   ============================================================ */

const SCOPES = [
  {
    value: "GLOBAL",
    label: "Global",
    icon: FileText,
    description: "Reusable terms available across the platform.",
  },
  {
    value: "PROJECT",
    label: "Projects",
    icon: Building2,
    description: "Terms applicable to project-level documents.",
  },
  {
    value: "PLAN_OF_ACTION",
    label: "Plan of Action",
    icon: ClipboardList,
    description:
      "Terms used with Plan of Action, payment schedules and project execution planning.",
  },
  {
    value: "CLIENT",
    label: "Clients",
    icon: Users,
    description: "Terms applicable to client-facing documents.",
  },
  {
    value: "BOQ",
    label: "Bill of Quantities",
    icon: ClipboardList,
    description: "Terms used with BOQs and quantity schedules.",
  },
  {
    value: "ESTIMATE",
    label: "Estimates",
    icon: Calculator,
    description: "Terms used with estimates and quotations.",
  },
];

/* ============================================================
   HELPERS
   ============================================================ */

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Converts structured sections into HTML.
 *
 * The API can continue to store content_html while the UI gives
 * the user a much cleaner structured editing experience.
 */
function sectionsToHtml(title, sections) {
  const safeTitle = title?.trim() || "Terms & Conditions";

  const html = sections
    .filter((section) => {
      return (
        section &&
        String(section.title || "").trim() &&
        Array.isArray(section.blocks) &&
        section.blocks.some((block) => String(block?.text || "").trim())
      );
    })
    .map((section, index) => {
      const number = section.number != null ? section.number : index + 1;

      const blocks = (section.blocks || [])
        .filter((block) => String(block?.text || "").trim())
        .map((block) => {
          const text = escapeHtml(String(block.text).trim());

          if (block.type === "list") {
            const items = text
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean)
              .map((item) => `<li>${item}</li>`)
              .join("");

            return `<ul>${items}</ul>`;
          }

          return `<p>${text.replace(/\n/g, "<br />")}</p>`;
        })
        .join("\n");

      return `
<h3>${number}. ${escapeHtml(section.title.trim())}</h3>
${blocks}
`;
    })
    .join("\n");

  return `<h2>${escapeHtml(safeTitle)}</h2>\n${html}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Parses existing HTML content into the structured editor.
 *
 * This is intentionally tolerant because your existing records
 * contain <h2>, <h3> and <p> based HTML.
 */
function htmlToSections(html) {
  if (!html || !String(html).trim()) {
    return [
      {
        id: createId(),
        number: 1,
        title: "",
        blocks: [
          {
            id: createId(),
            type: "paragraph",
            text: "",
          },
        ],
      },
    ];
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(html), "text/html");

    const title =
      doc.querySelector("h2")?.textContent?.trim() || "Terms & Conditions";

    const headings = Array.from(doc.querySelectorAll("h3"));

    if (headings.length === 0) {
      const paragraphs = Array.from(doc.querySelectorAll("p"))
        .map((p) => p.textContent?.trim())
        .filter(Boolean);

      return [
        {
          id: createId(),
          number: 1,
          title,
          blocks:
            paragraphs.length > 0
              ? paragraphs.map((text) => ({
                  id: createId(),
                  type: "paragraph",
                  text,
                }))
              : [
                  {
                    id: createId(),
                    type: "paragraph",
                    text: "",
                  },
                ],
        },
      ];
    }

    return headings.map((heading, index) => {
      const headingText = heading.textContent?.trim() || "";

      const match = headingText.match(/^(\d+)[.)]?\s+(.*)$/);

      const number = match ? Number(match[1]) : index + 1;

      const titleText = match ? match[2] : headingText;

      const blocks = [];

      let node = heading.nextElementSibling;

      while (node && node.tagName !== "H3") {
        if (node.tagName === "P") {
          const text = node.textContent?.trim();

          if (text) {
            blocks.push({
              id: createId(),
              type: "paragraph",
              text,
            });
          }
        }

        if (node.tagName === "UL" || node.tagName === "OL") {
          const items = Array.from(node.querySelectorAll("li"))
            .map((li) => li.textContent?.trim())
            .filter(Boolean);

          if (items.length) {
            blocks.push({
              id: createId(),
              type: "list",
              text: items.join("\n"),
            });
          }
        }

        node = node.nextElementSibling;
      }

      return {
        id: createId(),
        number,
        title: titleText,
        blocks:
          blocks.length > 0
            ? blocks
            : [
                {
                  id: createId(),
                  type: "paragraph",
                  text: "",
                },
              ],
      };
    });
  } catch {
    return [
      {
        id: createId(),
        number: 1,
        title: "",
        blocks: [
          {
            id: createId(),
            type: "paragraph",
            text: String(html),
          },
        ],
      },
    ];
  }
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptySection(number = 1) {
  return {
    id: createId(),
    number,
    title: "",
    blocks: [
      {
        id: createId(),
        type: "paragraph",
        text: "",
      },
    ],
  };
}

function createEmptyBlock(type = "paragraph") {
  return {
    id: createId(),
    type,
    text: "",
  };
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function TermsSettings() {
  const { data: templates, isLoading } = useGetTermsTemplatesQuery();

  const [createTemplate, { isLoading: creating }] =
    useCreateTermsTemplateMutation();

  const [updateTemplate] = useUpdateTermsTemplateMutation();

  const [updateContent, { isLoading: savingContent }] =
    useUpdateTermsTemplateContentMutation();

  const [deleteTemplate] = useDeleteTermsTemplateMutation();

  /* ----------------------------------------------------------
     Create
     ---------------------------------------------------------- */

  const [createOpen, setCreateOpen] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    scope: "GLOBAL",
    title: "Terms & Conditions",
    sections: [createEmptySection(1)],
  });

  /* ----------------------------------------------------------
     Edit
     ---------------------------------------------------------- */

  const [editingTemplate, setEditingTemplate] = useState(null);

  const [editTitle, setEditTitle] = useState("Terms & Conditions");

  const [editSections, setEditSections] = useState([]);

  const [changeNote, setChangeNote] = useState("");

  const [previewMode, setPreviewMode] = useState(false);

  /* ----------------------------------------------------------
     Other dialogs
     ---------------------------------------------------------- */

  const [historyTemplateId, setHistoryTemplateId] = useState(null);

  const [previewTemplateId, setPreviewTemplateId] = useState(null);

  /* ==========================================================
     CREATE
     ========================================================== */

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      scope: "GLOBAL",
      title: "Terms & Conditions",
      sections: [createEmptySection(1)],
    });
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    const validSections = createForm.sections.filter(
      (section) =>
        section.title.trim() ||
        section.blocks.some((block) => block.text.trim()),
    );

    if (validSections.length === 0) {
      toast.error("Add at least one terms section");
      return;
    }

    const contentHtml = sectionsToHtml(createForm.title, validSections);

    try {
      await createTemplate({
        name: createForm.name.trim(),
        scope: createForm.scope,
        content_html: contentHtml,
      }).unwrap();

      toast.success("Template created");

      setCreateOpen(false);
      resetCreateForm();
    } catch {
      toast.error("Failed to create template");
    }
  };

  /* ==========================================================
     EDIT
     ========================================================== */

  const openEditContent = (template) => {
    const sections = htmlToSections(template.content_html || "");

    const title =
      sections.length === 1 && sections[0].title === "Terms & Conditions"
        ? "Terms & Conditions"
        : extractDocumentTitle(template.content_html);

    setEditingTemplate(template);
    setEditTitle(title || "Terms & Conditions");
    setEditSections(normalizeSections(sections));
    setChangeNote("");
    setPreviewMode(false);
  };

  const handleSaveContent = async () => {
    if (!editingTemplate) return;

    const validSections = editSections.filter(
      (section) =>
        section.title.trim() ||
        section.blocks.some((block) => block.text.trim()),
    );

    if (validSections.length === 0) {
      toast.error("Add at least one terms section");
      return;
    }

    const contentHtml = sectionsToHtml(editTitle, validSections);

    try {
      await updateContent({
        id: editingTemplate.id,
        content_html: contentHtml,
        change_note: changeNote.trim() || undefined,
      }).unwrap();

      toast.success(`Saved as v${(editingTemplate.current_version || 1) + 1}`);

      setEditingTemplate(null);
    } catch {
      toast.error("Failed to save changes");
    }
  };

  /* ==========================================================
     TEMPLATE ACTIONS
     ========================================================== */

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
    if (!window.confirm(`Delete "${template.name}"? This can't be undone.`)) {
      return;
    }

    try {
      await deleteTemplate(template.id).unwrap();

      toast.success("Template deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  /* ==========================================================
     GROUPING
     ========================================================== */

  const templatesByScope = (scope) =>
    (templates || []).filter((template) => template.scope === scope);

  const knownScopes = useMemo(() => {
    const configured = new Set(SCOPES.map((scope) => scope.value));

    const extraScopes = [
      ...new Set(
        (templates || [])
          .map((template) => template.scope)
          .filter((scope) => scope && !configured.has(scope)),
      ),
    ];

    return [
      ...SCOPES,
      ...extraScopes.map((scope) => ({
        value: scope,
        label: formatScopeLabel(scope),
        icon: FileText,
        description: "Additional terms scope currently used by the system.",
      })),
    ];
  }, [templates]);

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="space-y-8 max-w-5xl">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            className="text-2xl font-semibold"
            style={{
              color: "var(--ink-green)",
            }}
          >
            Terms & Conditions
          </h2>

          <p className="text-[#6B7B7C] mt-2 max-w-2xl">
            Manage reusable terms templates used across projects, Plan of
            Action, BOQs, estimates, work orders and other documents. Each
            template maintains immutable versions when its wording changes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="h-10 px-4 rounded-xl text-white text-[13px] font-semibold flex items-center gap-2 shrink-0"
          style={{
            backgroundColor: "var(--ink-green)",
          }}
        >
          <Plus size={15} />
          New Template
        </button>
      </div>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {isLoading && (
        <div className="flex items-center gap-2 text-[#6B7B7C] text-sm py-8">
          <Loader2 size={15} className="animate-spin" />
          Loading templates…
        </div>
      )}

      {/* =====================================================
          SCOPES
      ===================================================== */}

      {!isLoading &&
        knownScopes.map(({ value, label, icon: Icon, description }) => {
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
                  scoped.map((template, index) => (
                    <React.Fragment key={template.id}>
                      <TemplateRow
                        template={template}
                        onToggleDefault={toggleDefault}
                        onPreview={() => setPreviewTemplateId(template.id)}
                        onHistory={() => setHistoryTemplateId(template.id)}
                        onEdit={() => openEditContent(template)}
                        onDelete={handleDelete}
                        onToggleActive={toggleActive}
                      />

                      {index < scoped.length - 1 && <Separator />}
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>
          );
        })}

      {/* =====================================================
          CREATE
      ===================================================== */}

      <CreateTemplateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        form={createForm}
        setForm={setCreateForm}
        onCreate={handleCreate}
        isCreating={creating}
        resetForm={resetCreateForm}
      />

      {/* =====================================================
          EDIT
      ===================================================== */}

      <EditTemplateDialog
        template={editingTemplate}
        title={editTitle}
        setTitle={setEditTitle}
        sections={editSections}
        setSections={setEditSections}
        changeNote={changeNote}
        setChangeNote={setChangeNote}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        onSave={handleSaveContent}
        isSaving={savingContent}
        onClose={() => setEditingTemplate(null)}
      />

      {/* =====================================================
          HISTORY
      ===================================================== */}

      <VersionHistoryDialog
        templateId={historyTemplateId}
        onClose={() => setHistoryTemplateId(null)}
      />

      {/* =====================================================
          PREVIEW
      ===================================================== */}

      <PreviewTemplateDialog
        templateId={previewTemplateId}
        templates={templates}
        onClose={() => setPreviewTemplateId(null)}
      />
    </div>
  );
}

/* ============================================================
   TEMPLATE ROW
   ============================================================ */

function TemplateRow({
  template,
  onToggleDefault,
  onPreview,
  onHistory,
  onEdit,
  onDelete,
  onToggleActive,
}) {
  return (
    <div className="flex items-start justify-between py-4 gap-3 group hover:bg-[#F5F9F8] px-6">
      <div className="flex gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onToggleDefault(template)}
          title={template.is_default ? "Default template" : "Set as default"}
          className="w-10 h-10 rounded-lg bg-[#EDF4F2] flex items-center justify-center shrink-0 hover:bg-[#E2E8E6] transition-colors"
        >
          <Star
            size={18}
            style={{
              color: "var(--ink-green)",
            }}
            fill={template.is_default ? "var(--ink-green)" : "none"}
          />
        </button>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[15px] text-[#2D3A3A] truncate">
            {template.name}
          </p>

          <p className="text-xs text-[#6B7B7C] mt-1">
            v{template.current_version || 1} · updated{" "}
            {formatDate(template.updated_at)}
          </p>

          <div className="mt-3">
            <TermsPreview
              htmlContent={template.content_html || ""}
              maxPreview={2}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onPreview}
          title="Preview all terms"
          className="w-9 h-9 rounded-lg border border-[#E2E8E6] flex items-center justify-center hover:bg-[#EDF4F2]"
        >
          <Eye size={15} className="text-[#6B7B7C]" />
        </button>

        <button
          type="button"
          onClick={onHistory}
          title="Version history"
          className="w-9 h-9 rounded-lg border border-[#E2E8E6] flex items-center justify-center hover:bg-[#EDF4F2]"
        >
          <History size={15} className="text-[#6B7B7C]" />
        </button>

        <button
          type="button"
          onClick={onEdit}
          title="Edit content"
          className="w-9 h-9 rounded-lg border border-[#E2E8E6] flex items-center justify-center hover:bg-[#EDF4F2]"
        >
          <Pencil size={15} className="text-[#6B7B7C]" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          className="w-9 h-9 rounded-lg border border-[#E2E8E6] flex items-center justify-center hover:bg-red-50"
        >
          <Trash2 size={15} className="text-red-500" />
        </button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Switch
          checked={!!template.is_active}
          onCheckedChange={() => onToggleActive(template)}
        />
      </div>
    </div>
  );
}

/* ============================================================
   CREATE DIALOG
   ============================================================ */

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

  const updateSection = (sectionId, updater) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? updater(section) : section,
      ),
    }));
  };

  const updateBlock = (sectionId, blockId, updater) => {
    updateSection(sectionId, (section) => ({
      ...section,
      blocks: section.blocks.map((block) =>
        block.id === blockId ? updater(block) : block,
      ),
    }));
  };

  const addSection = () => {
    setForm((current) => ({
      ...current,
      sections: [
        ...current.sections,
        createEmptySection(current.sections.length + 1),
      ],
    }));
  };

  const removeSection = (sectionId) => {
    setForm((current) => {
      if (current.sections.length <= 1) {
        return current;
      }

      return {
        ...current,
        sections: renumberSections(
          current.sections.filter((section) => section.id !== sectionId),
        ),
      };
    });
  };

  const moveSection = (index, direction) => {
    setForm((current) => ({
      ...current,
      sections: moveItem(current.sections, index, direction).map(
        (section, sectionIndex) => ({
          ...section,
          number: sectionIndex + 1,
        }),
      ),
    }));
  };

  const addBlock = (sectionId) => {
    updateSection(sectionId, (section) => ({
      ...section,
      blocks: [...section.blocks, createEmptyBlock("paragraph")],
    }));
  };

  const removeBlock = (sectionId, blockId) => {
    updateSection(sectionId, (section) => {
      if (section.blocks.length <= 1) {
        return section;
      }

      return {
        ...section,
        blocks: section.blocks.filter((block) => block.id !== blockId),
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Terms Template</DialogTitle>

          <DialogDescription>
            Create structured terms and conditions. Saving the template creates
            version 1.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* NAME */}

          <div>
            <label className="text-xs uppercase tracking-widest text-[#6B7B7C] font-semibold">
              Template Name
            </label>

            <input
              className="mt-2 w-full h-10 px-3 rounded-lg border border-[#E2E8E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#E2E8E6]"
              placeholder="e.g. Standard Residential Terms"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </div>

          {/* SCOPE */}

          <div>
            <label className="text-xs uppercase tracking-widest text-[#6B7B7C] font-semibold">
              Scope
            </label>

            <select
              className="mt-2 w-full h-10 px-3 rounded-lg border border-[#E2E8E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#E2E8E6]"
              value={form.scope}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  scope: event.target.value,
                }))
              }
            >
              {SCOPES.map((scope) => (
                <option key={scope.value} value={scope.value}>
                  {scope.label}
                </option>
              ))}
            </select>

            <p className="text-xs text-[#6B7B7C] mt-1">
              {SCOPES.find((scope) => scope.value === form.scope)?.description}
            </p>
          </div>

          {/* TITLE */}

          <div>
            <label className="text-xs uppercase tracking-widest text-[#6B7B7C] font-semibold">
              Document Title
            </label>

            <input
              className="mt-2 w-full h-10 px-3 rounded-lg border border-[#E2E8E6] text-sm"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </div>

          {/* EDIT / PREVIEW */}

          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-widest text-[#6B7B7C] font-semibold">
              Terms Sections
            </label>

            <button
              type="button"
              onClick={() => setPreviewMode((value) => !value)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              {previewMode ? <Code size={14} /> : <Eye size={14} />}

              {previewMode ? "Edit" : "Preview"}
            </button>
          </div>

          {previewMode ? (
            <div className="rounded-xl border border-[#E2E8E6] bg-[#F5F9F8] p-5">
              <TermsFullDisplay
                htmlContent={sectionsToHtml(form.title, form.sections)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {form.sections.map((section, index) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  index={index}
                  total={form.sections.length}
                  onChange={(updater) => updateSection(section.id, updater)}
                  onMoveUp={() => moveSection(index, -1)}
                  onMoveDown={() => moveSection(index, 1)}
                  onRemove={() => removeSection(section.id)}
                  onAddBlock={() => addBlock(section.id)}
                  onRemoveBlock={(blockId) => removeBlock(section.id, blockId)}
                  onBlockChange={(blockId, updater) =>
                    updateBlock(section.id, blockId, updater)
                  }
                />
              ))}

              <button
                type="button"
                onClick={addSection}
                className="w-full border border-dashed border-[#B9C9C5] rounded-xl py-4 text-sm font-semibold text-[#52706A] hover:bg-[#F5F9F8] flex items-center justify-center gap-2"
              >
                <PlusCircle size={16} />
                Add Terms Section
              </button>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={handleClose}
            className="h-10 px-4 rounded-xl border border-[#E2E8E6] text-[13px] font-semibold hover:bg-[#F5F9F8]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onCreate}
            disabled={isCreating}
            className="h-10 px-4 rounded-xl text-white text-[13px] font-semibold disabled:opacity-50"
            style={{
              backgroundColor: "var(--ink-green)",
            }}
          >
            {isCreating ? "Creating…" : "Create Template"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   EDIT DIALOG
   ============================================================ */

function EditTemplateDialog({
  template,
  title,
  setTitle,
  sections,
  setSections,
  changeNote,
  setChangeNote,
  previewMode,
  setPreviewMode,
  onSave,
  isSaving,
  onClose,
}) {
  if (!template) return null;

  const updateSection = (sectionId, updater) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId ? updater(section) : section,
      ),
    );
  };

  const updateBlock = (sectionId, blockId, updater) => {
    updateSection(sectionId, (section) => ({
      ...section,
      blocks: section.blocks.map((block) =>
        block.id === blockId ? updater(block) : block,
      ),
    }));
  };

  const addSection = () => {
    setSections((current) => [
      ...current,
      createEmptySection(current.length + 1),
    ]);
  };

  const removeSection = (sectionId) => {
    setSections((current) => {
      if (current.length <= 1) {
        return current;
      }

      return renumberSections(
        current.filter((section) => section.id !== sectionId),
      );
    });
  };

  const moveSection = (index, direction) => {
    setSections((current) =>
      moveItem(current, index, direction).map((section, sectionIndex) => ({
        ...section,
        number: sectionIndex + 1,
      })),
    );
  };

  const addBlock = (sectionId) => {
    updateSection(sectionId, (section) => ({
      ...section,
      blocks: [...section.blocks, createEmptyBlock("paragraph")],
    }));
  };

  const removeBlock = (sectionId, blockId) => {
    updateSection(sectionId, (section) => {
      if (section.blocks.length <= 1) {
        return section;
      }

      return {
        ...section,
        blocks: section.blocks.filter((block) => block.id !== blockId),
      };
    });
  };

  return (
    <Dialog open={!!template} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit "{template.name}"</DialogTitle>

          <DialogDescription>
            Saving creates v{(template.current_version || 1) + 1}. Existing
            documents remain unchanged.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* TITLE */}

          <div>
            <label className="text-xs uppercase tracking-widest text-[#6B7B7C] font-semibold">
              Document Title
            </label>

            <input
              className="mt-2 w-full h-10 px-3 rounded-lg border border-[#E2E8E6] text-sm"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          {/* TOOLBAR */}

          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-widest text-[#6B7B7C] font-semibold">
              Terms Sections
            </label>

            <button
              type="button"
              onClick={() => setPreviewMode((value) => !value)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              {previewMode ? <Code size={14} /> : <Eye size={14} />}

              {previewMode ? "Edit" : "Preview"}
            </button>
          </div>

          {previewMode ? (
            <div className="w-full min-h-[240px] p-5 rounded-lg border border-[#E2E8E6] bg-[#F5F9F8] overflow-y-auto">
              <TermsFullDisplay htmlContent={sectionsToHtml(title, sections)} />
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, index) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  index={index}
                  total={sections.length}
                  onChange={(updater) => updateSection(section.id, updater)}
                  onMoveUp={() => moveSection(index, -1)}
                  onMoveDown={() => moveSection(index, 1)}
                  onRemove={() => removeSection(section.id)}
                  onAddBlock={() => addBlock(section.id)}
                  onRemoveBlock={(blockId) => removeBlock(section.id, blockId)}
                  onBlockChange={(blockId, updater) =>
                    updateBlock(section.id, blockId, updater)
                  }
                />
              ))}

              <button
                type="button"
                onClick={addSection}
                className="w-full border border-dashed border-[#B9C9C5] rounded-xl py-4 text-sm font-semibold text-[#52706A] hover:bg-[#F5F9F8] flex items-center justify-center gap-2"
              >
                <PlusCircle size={16} />
                Add Terms Section
              </button>
            </div>
          )}

          {/* CHANGE NOTE */}

          <div>
            <label className="text-xs uppercase tracking-widest text-[#6B7B7C] font-semibold">
              Change Note
            </label>

            <input
              className="mt-2 w-full h-10 px-3 rounded-lg border border-[#E2E8E6] text-sm"
              placeholder="e.g. Updated payment terms clause"
              value={changeNote}
              onChange={(event) => setChangeNote(event.target.value)}
            />

            <p className="text-xs text-[#6B7B7C] mt-1">
              Describe what changed for version history.
            </p>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-[#E2E8E6] text-[13px] font-semibold hover:bg-[#F5F9F8]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="h-10 px-4 rounded-xl text-white text-[13px] font-semibold disabled:opacity-50"
            style={{
              backgroundColor: "var(--ink-green)",
            }}
          >
            {isSaving ? "Saving…" : "Save as new version"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   SECTION EDITOR
   ============================================================ */

function SectionEditor({
  section,
  index,
  total,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  onAddBlock,
  onRemoveBlock,
  onBlockChange,
}) {
  return (
    <div className="rounded-xl border border-[#E2E8E6] bg-white overflow-hidden">
      {/* HEADER */}

      <div className="flex items-center gap-3 px-4 py-3 bg-[#F5F9F8] border-b border-[#E2E8E6]">
        <GripVertical size={16} className="text-[#9AA9A5]" />

        <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E8E6] flex items-center justify-center text-sm font-semibold text-[#52706A]">
          {section.number}
        </div>

        <input
          className="flex-1 h-9 px-3 rounded-lg border border-[#E2E8E6] bg-white text-sm font-semibold"
          placeholder="Section title"
          value={section.title}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              title: event.target.value,
            }))
          }
        />

        <button
          type="button"
          disabled={index === 0}
          onClick={onMoveUp}
          className="w-8 h-8 rounded-lg border border-[#E2E8E6] flex items-center justify-center disabled:opacity-30 hover:bg-white"
          title="Move up"
        >
          <ChevronUp size={15} />
        </button>

        <button
          type="button"
          disabled={index === total - 1}
          onClick={onMoveDown}
          className="w-8 h-8 rounded-lg border border-[#E2E8E6] flex items-center justify-center disabled:opacity-30 hover:bg-white"
          title="Move down"
        >
          <ChevronDown size={15} />
        </button>

        <button
          type="button"
          disabled={total <= 1}
          onClick={onRemove}
          className="w-8 h-8 rounded-lg border border-[#E2E8E6] flex items-center justify-center disabled:opacity-30 hover:bg-red-50"
          title="Remove section"
        >
          <X size={15} className="text-red-500" />
        </button>
      </div>

      {/* BLOCKS */}

      <div className="p-4 space-y-3">
        {section.blocks.map((block, blockIndex) => (
          <div key={block.id} className="flex gap-2 items-start">
            <div className="pt-2 text-[10px] text-[#9AA9A5] w-5">
              {blockIndex + 1}.
            </div>

            <div className="flex-1">
              <textarea
                className="w-full min-h-[90px] px-3 py-2 rounded-lg border border-[#E2E8E6] text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[#E2E8E6]"
                placeholder={
                  block.type === "list"
                    ? "Enter one list item per line..."
                    : "Enter the terms and conditions text..."
                }
                value={block.text}
                onChange={(event) =>
                  onBlockChange(block.id, (current) => ({
                    ...current,
                    text: event.target.value,
                  }))
                }
              />
            </div>

            <button
              type="button"
              disabled={section.blocks.length <= 1}
              onClick={() => onRemoveBlock(block.id)}
              className="w-8 h-8 mt-1 rounded-lg border border-[#E2E8E6] flex items-center justify-center disabled:opacity-30 hover:bg-red-50"
              title="Remove paragraph"
            >
              <Trash2 size={14} className="text-red-500" />
            </button>
          </div>
        ))}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onAddBlock}
            className="text-xs font-semibold text-[#52706A] hover:text-[#103E31] flex items-center gap-1"
          >
            <PlusCircle size={14} />
            Add paragraph
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   VERSION HISTORY
   ============================================================ */

function VersionHistoryDialog({ templateId, onClose }) {
  const { data: versions, isLoading } = useGetTermsTemplateVersionsQuery(
    templateId,
    {
      skip: !templateId,
    },
  );

  if (!templateId) return null;

  return (
    <Dialog open={!!templateId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>

          <DialogDescription>
            Newest first. Each version is immutable once created.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[500px] overflow-y-auto space-y-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-[#6B7B7C] text-sm py-8">
              <Loader2 size={14} className="animate-spin" />
              Loading…
            </div>
          )}

          {!isLoading && (versions || []).length === 0 && (
            <p className="text-sm text-[#6B7B7C] py-8 text-center">
              No versions found.
            </p>
          )}

          {(versions || []).map((version, index) => (
            <div
              key={version.id}
              className="rounded-lg border border-[#E2E8E6] p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-[#2D3A3A] text-sm">
                  v{version.version}
                  {index === 0 && (
                    <span className="text-xs ml-2 text-white bg-[#6B7B7C] px-2 py-1 rounded">
                      Latest
                    </span>
                  )}
                </span>

                <span className="text-xs text-[#6B7B7C]">
                  {formatDate(version.created_at)}
                </span>
              </div>

              {version.change_note && (
                <p className="text-xs text-[#6B7B7C] italic mb-3 p-2 bg-[#F5F9F8] rounded">
                  {version.change_note}
                </p>
              )}

              <div className="text-xs text-[#2D3A3A] max-h-[180px] overflow-y-auto">
                <TermsFullDisplay htmlContent={version.content_html || ""} />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <button
            type="button"
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

/* ============================================================
   PREVIEW
   ============================================================ */

function PreviewTemplateDialog({ templateId, templates, onClose }) {
  const template = templates?.find((item) => item.id === templateId);

  if (!templateId || !template) {
    return null;
  }

  return (
    <Dialog open={!!templateId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>

          <DialogDescription>
            Full terms preview for v{template.current_version || 1}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[500px] overflow-y-auto p-5 rounded-lg border border-[#E2E8E6] bg-[#F5F9F8]">
          <TermsFullDisplay htmlContent={template.content_html || ""} />
        </div>

        <DialogFooter>
          <button
            type="button"
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

/* ============================================================
   UTILS
   ============================================================ */

function normalizeSections(sections) {
  return sections.map((section, index) => ({
    ...section,
    number: index + 1,
    blocks:
      section.blocks?.length > 0
        ? section.blocks
        : [createEmptyBlock("paragraph")],
  }));
}

function renumberSections(sections) {
  return sections.map((section, index) => ({
    ...section,
    number: index + 1,
  }));
}

function moveItem(items, index, direction) {
  const targetIndex = index + direction;

  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const result = [...items];

  [result[index], result[targetIndex]] = [result[targetIndex], result[index]];

  return result;
}

function extractDocumentTitle(html) {
  if (!html) {
    return "Terms & Conditions";
  }

  try {
    const parser = new DOMParser();

    const doc = parser.parseFromString(html, "text/html");

    return doc.querySelector("h2")?.textContent?.trim() || "Terms & Conditions";
  } catch {
    return "Terms & Conditions";
  }
}

function formatScopeLabel(scope) {
  return String(scope)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
