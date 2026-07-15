import React, { useState } from "react";
import { Save } from "lucide-react";
import { Shell, Card, Input, TextArea } from "../hooks/shared";

/**
 * Generic multi-section form shell. Owns section navigation + field
 * rendering only — submission, autosave, and attachments (if any) stay in
 * the caller (BriefForm / SiteRekiForm) so each document type wires its own
 * RTK Query hook rather than sharing one big component.
 *
 * Anything passed as `children` renders below the sections card, which is
 * how SiteRekiForm slots in <AttachmentsPanel /> without BriefForm needing
 * to know it exists.
 */
export function SectionForm({
  title,
  subtitle,
  sections,
  values,
  onFieldChange,
  projects,
  projectId,
  onProjectChange,
  onSubmit,
  isSubmitting,
  children,
}) {
  const [active, setActive] = useState(0);
  const cur = sections[active];
  const filledCount = Object.keys(values).length;

  return (
    <Shell
      title={title}
      subtitle={subtitle}
      action={
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
        >
          <Save size={14} />{" "}
          {isSubmitting ? "Generating…" : "Complete & Generate PDF"}
        </button>
      }
    >
      <Card>
        <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
          Project
        </label>
        <select
          className="bc-input h-10 max-w-md"
          value={projectId}
          onChange={(e) => onProjectChange(e.target.value)}
        >
          <option value="">Choose…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Card>
      <div className="grid md:grid-cols-[220px_1fr] gap-4">
        <Card>
          <div className="text-[12px] uppercase tracking-widest text-[#6B7B7C] mb-2">
            Sections
          </div>
          <div className="flex flex-col gap-1">
            {sections.map((s, i) => (
              <button
                key={s.title}
                onClick={() => setActive(i)}
                className={`text-left px-3 py-2 rounded-lg text-[14px] ${
                  active === i
                    ? "bg-[#1F453B] text-white"
                    : "hover:bg-[#F4F6F7] text-[#333333]"
                }`}
              >
                {i + 1}. {s.title}
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <div className="text-[16px] font-semibold text-[#333333] mb-3">
            {cur?.title}
          </div>
          <div className="grid gap-3">
            {(cur?.fields || []).map((f) => (
              <div key={f.key}>
                <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                  {f.label}
                </label>
                {f.type === "textarea" ? (
                  <TextArea
                    rows={f.rows || 3}
                    value={(values[cur.title] || {})[f.key] || ""}
                    onChange={(e) =>
                      onFieldChange(cur.title, f.key, e.target.value)
                    }
                  />
                ) : f.type === "date" ? (
                  <Input
                    type="date"
                    value={(values[cur.title] || {})[f.key] || ""}
                    onChange={(e) =>
                      onFieldChange(cur.title, f.key, e.target.value)
                    }
                  />
                ) : (
                  <Input
                    value={(values[cur.title] || {})[f.key] || ""}
                    onChange={(e) =>
                      onFieldChange(cur.title, f.key, e.target.value)
                    }
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            <button
              disabled={active === 0}
              onClick={() => setActive((a) => a - 1)}
              className="h-9 px-3 rounded-lg border border-[rgba(31,69,59,0.14)] text-[13px]"
            >
              ← Previous
            </button>
            <button
              disabled={active === sections.length - 1}
              onClick={() => setActive((a) => a + 1)}
              className="h-9 px-3 rounded-lg border border-[rgba(31,69,59,0.14)] text-[13px]"
            >
              Next →
            </button>
          </div>
          <div className="text-[11.5px] text-[#B5C4B6] mt-3">
            Draft autosaved to this browser · {filledCount} section
            {filledCount !== 1 ? "s" : ""} filled
          </div>
        </Card>
      </div>
      {children}
    </Shell>
  );
}
