import React, { useEffect, useState } from "react";
import { RefreshCw, FileText, PenLine, Plus, X, Pencil } from "lucide-react";
import { formatINR } from "@/lib/format";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { useGetTermsTemplatesQuery } from "../../api/terms.api";

function htmlToPlainText(html) {
  return (html || "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/\n+/g, "\n")
    .trim();
}

function plainTextToHtml(text) {
  return (
    "<ol>" +
    text
      .split("\n")
      .filter(Boolean)
      .map((l) => `<li>${l}</li>`)
      .join("") +
    "</ol>"
  );
}

// Extra named financial entries that don't fit the category/item structure
// (e.g. "Contingency", "Mobilization charge"). Rendered as a small editable
// list; their sum is boq.misc_amount, computed server-side from the
// BoqMiscellaneous rows (see BoqService.withComputedTotals).
function MiscellaneousList({
  boq,
  disabled,
  onLockedEdit,
  onAddMisc,
  onUpdateMisc,
  onDeleteMisc,
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editValue, setEditValue] = useState("");

  const rows = boq.miscellaneous || [];

  const startAdd = () => {
    if (disabled) return onLockedEdit();
    setAdding(true);
  };

  const cancelAdd = () => {
    setAdding(false);
    setName("");
    setValue("");
  };

  const submitAdd = async () => {
    if (!name.trim()) return;
    await onAddMisc({ name: name.trim(), value: Number(value) || 0 });
    cancelAdd();
  };

  const startEdit = (row) => {
    if (disabled) return onLockedEdit();
    setEditingId(row.id);
    setEditName(row.name);
    setEditValue(String(row.value ?? ""));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditValue("");
  };

  const submitEdit = async (row) => {
    if (!editName.trim()) return;
    await onUpdateMisc(row.id, {
      name: editName.trim(),
      value: Number(editValue) || 0,
    });
    cancelEdit();
  };

  return (
    <div className="mt-4 pt-4 border-t border-[#B5C4B6]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
          Miscellaneous
        </span>
        <button
          onClick={startAdd}
          className="text-[11.5px] font-semibold text-[#1F453B] hover:underline flex items-center gap-1"
          data-testid="add-misc-btn"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {rows.length === 0 && !adding && (
        <p className="text-[12px] text-[#B5C4B6]">
          No miscellaneous entries yet.
        </p>
      )}

      <ul className="space-y-1.5" data-testid="misc-list">
        {rows.map((row) =>
          editingId === row.id ? (
            <li key={row.id} className="flex items-center gap-2">
              <input
                className="bc-input h-8 py-0 text-[12px] flex-1"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Name"
              />
              <input
                className="bc-input h-8 py-0 text-[12px] w-28 text-right"
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Value"
              />
              <button
                onClick={() => submitEdit(row)}
                className="h-8 px-2 rounded-lg bg-[#1F453B] text-white text-[11.5px] font-semibold"
              >
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="h-8 w-8 rounded-lg border border-[#B5C4B6] flex items-center justify-center text-[#6B7B7C]"
              >
                <X size={12} />
              </button>
            </li>
          ) : (
            <li
              key={row.id}
              className="flex items-center justify-between text-[13px] group"
              data-testid="misc-row"
            >
              <span className="text-[#6B7B7C] flex items-center gap-1.5">
                {row.name}
                {row.notes && (
                  <span className="text-[11px] text-[#B5C4B6]">
                    ({row.notes})
                  </span>
                )}
              </span>
              <span className="flex items-center gap-2">
                <span className="font-semibold text-[#333333]">
                  {formatINR(row.value || 0)}
                </span>
                <button
                  onClick={() => startEdit(row)}
                  className="opacity-0 group-hover:opacity-100 text-[#6B7B7C] hover:text-[#333333]"
                  title="Edit"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() =>
                    disabled ? onLockedEdit() : onDeleteMisc(row.id)
                  }
                  className="opacity-0 group-hover:opacity-100 text-[#6B7B7C] hover:text-red-600"
                  title="Remove"
                >
                  <X size={12} />
                </button>
              </span>
            </li>
          ),
        )}

        {adding && (
          <li className="flex items-center gap-2">
            <input
              autoFocus
              className="bc-input h-8 py-0 text-[12px] flex-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Contingency"
              data-testid="misc-name-input"
            />
            <input
              className="bc-input h-8 py-0 text-[12px] w-28 text-right"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Value"
              data-testid="misc-value-input"
            />
            <button
              onClick={submitAdd}
              className="h-8 px-2 rounded-lg bg-[#1F453B] text-white text-[11.5px] font-semibold"
              data-testid="misc-submit-btn"
            >
              Add
            </button>
            <button
              onClick={cancelAdd}
              className="h-8 w-8 rounded-lg border border-[#B5C4B6] flex items-center justify-center text-[#6B7B7C]"
            >
              <X size={12} />
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

export function CostSummaryPanel({
  boq,
  disabled,
  onLockedEdit,
  onSaveTerms,
  onSaveMiscPct,
  onApplyTerms,
  applyingTerms,
  onAddMisc,
  onUpdateMisc,
  onDeleteMisc,
}) {
  // Local buffer for the textarea so typing isn't clobbered by prop
  // updates that lag behind the save request.
  const [termsText, setTermsText] = useState(() =>
    htmlToPlainText(boq.terms_html),
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Only resync from the prop when we're looking at a *different* BOQ,
  // not on every terms_html change (which would fight with local typing).
  useEffect(() => {
    setTermsText(htmlToPlainText(boq.terms_html));
    setSelectedTemplateId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boq.id]);

  const { data: templates } = useGetTermsTemplatesQuery("BOQ");

  const debouncedSaveTerms = useDebouncedCallback((text) => {
    onSaveTerms(plainTextToHtml(text));
  }, 500);

  const handleTermsChange = (e) => {
    if (disabled) return onLockedEdit();
    const value = e.target.value;
    setTermsText(value);
    debouncedSaveTerms(value);
  };

  const handleApply = async (templateId, version) => {
    if (disabled) return onLockedEdit();
    if (!templateId) return;
    const updated = await onApplyTerms(templateId, version);
    // onApplyTerms resolves with the fresh boq (or undefined on failure);
    // sync the local textarea buffer to whatever got snapshotted.
    if (updated?.terms_html) setTermsText(htmlToPlainText(updated.terms_html));
    setSelectedTemplateId("");
  };

  const currentTemplateName = boq.termsTemplate?.name;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bc-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
            Notes & Terms
          </div>

          <div className="flex items-center gap-2">
            <select
              className="bc-input h-8 py-0 text-[12px] min-w-[180px]"
              value={selectedTemplateId}
              disabled={disabled}
              onChange={(e) => {
                if (disabled) return onLockedEdit();
                setSelectedTemplateId(e.target.value);
              }}
              data-testid="terms-template-select"
            >
              <option value="">Apply a terms template…</option>
              {(templates || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleApply(selectedTemplateId)}
              disabled={disabled || !selectedTemplateId || applyingTerms}
              className="h-8 px-3 rounded-lg bg-[#1F453B] hover:opacity-90 disabled:opacity-40 text-white text-[12px] font-semibold whitespace-nowrap"
              data-testid="apply-terms-btn"
            >
              Apply
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 text-[11.5px]">
          {currentTemplateName ? (
            <span className="flex items-center gap-1 text-[#6B7B7C]">
              <FileText size={12} />
              From <span className="font-semibold">{currentTemplateName}</span>
              {boq.terms_template_version != null &&
                ` · v${boq.terms_template_version}`}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#6B7B7C]">
              <PenLine size={12} />
              Custom text — not from a template
            </span>
          )}

          {boq.terms_is_stale && (
            <button
              onClick={() =>
                handleApply(boq.terms_template_id /* latest version */)
              }
              disabled={disabled || applyingTerms}
              className="flex items-center gap-1 text-[#B45309] hover:underline disabled:opacity-40"
              data-testid="terms-update-latest-btn"
            >
              <RefreshCw size={11} />
              Newer version available — update
            </button>
          )}
        </div>

        <textarea
          className="bc-input min-h-[140px] text-[13px] leading-relaxed"
          value={termsText}
          onChange={handleTermsChange}
          readOnly={disabled}
          onClick={() => disabled && onLockedEdit()}
          data-testid="terms-textarea"
        />
      </div>
      <div className="bc-card p-6" data-testid="project-total-panel">
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-3">
          Cost Summary
        </div>
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between">
            <span className="text-[#6B7B7C]">Project Total</span>
            <span className="font-semibold text-[#333333]">
              {formatINR(boq.project_total || 0)}
            </span>
          </div>
          {boq.design_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-[#6B7B7C]">Design Fees</span>
              <span className="font-semibold">
                {formatINR(boq.design_amount)}
              </span>
            </div>
          )}
          {boq.execution_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-[#6B7B7C]">Execution</span>
              <span className="font-semibold">
                {formatINR(boq.execution_amount)}
              </span>
            </div>
          )}
          {boq.supervisor_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-[#6B7B7C]">Supervisor</span>
              <span className="font-semibold">
                {formatINR(boq.supervisor_amount)}
              </span>
            </div>
          )}
          {boq.additional_total > 0 && (
            <div className="flex justify-between">
              <span className="text-[#6B7B7C]">Additional</span>
              <span className="font-semibold">
                {formatINR(boq.additional_total)}
              </span>
            </div>
          )}
          {boq.misc_amount > 0 && (
            <div className="flex justify-between" data-testid="misc-amount-row">
              <span className="text-[#6B7B7C]">Miscellaneous</span>
              <span className="font-semibold">
                {formatINR(boq.misc_amount)}
              </span>
            </div>
          )}
        </div>

        <MiscellaneousList
          boq={boq}
          disabled={disabled}
          onLockedEdit={onLockedEdit}
          onAddMisc={onAddMisc}
          onUpdateMisc={onUpdateMisc}
          onDeleteMisc={onDeleteMisc}
        />

        <div className="mt-4 pt-4 border-t border-[#B5C4B6] flex items-baseline justify-between">
          <span className="text-[11.5px] uppercase tracking-widest text-[#B5C4B6]">
            Total Amount
          </span>
          <span
            className="text-[34px] font-bold text-[#333333]"
            data-testid="cost-final-total"
          >
            {formatINR(boq.final_total || 0)}
          </span>
        </div>
      </div>
    </section>
  );
}
