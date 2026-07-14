import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { Save, Upload, FileText } from "lucide-react";
import { Shell, Card, Input, TextArea } from "../hooks/shared";

/* ---------- Multi-section form (Brief / Reki share this) ---------- */
function useAutoSave(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    const t = setTimeout(
      () => localStorage.setItem(key, JSON.stringify(state)),
      500,
    );
    return () => clearTimeout(t);
  }, [state, key]);
  return [state, setState];
}

function SectionForm({
  title,
  subtitle,
  endpoint,
  sections,
  saveKey,
  withAttachments,
}) {
  const nav = useNavigate();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [active, setActive] = useState(0);
  const [values, setValues] = useAutoSave(saveKey, {});
  const [attachments, setAttachments] = useState([]); // {name, mime, size, remark, content_b64}
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.get("/projects").then((r) => setProjects(r.data || []));
  }, []);
  const update = (sec, k, v) =>
    setValues((o) => ({ ...o, [sec]: { ...(o[sec] || {}), [k]: v } }));

  const readFile = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () =>
        res({
          name: file.name,
          mime: file.type,
          size: file.size,
          content_b64: String(r.result).split(",")[1] || "",
          remark: "",
        });
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const results = [];
    for (const f of files) {
      if (f.size > 8 * 1024 * 1024) {
        toast.error(`${f.name}: max 8 MB`);
        continue;
      }
      try {
        results.push(await readFile(f));
      } catch {
        toast.error(`Failed to read ${f.name}`);
      }
    }
    setAttachments((a) => [...a, ...results]);
  };

  const submit = async () => {
    if (!projectId) return toast.error("Select a project first");
    setBusy(true);
    try {
      const body = { project_id: projectId, sections: values };
      if (withAttachments && attachments.length) {
        body.attachments = attachments.map((a) => ({
          filename: a.name,
          mime: a.mime,
          content_b64: a.content_b64,
          remark: a.remark || "",
        }));
      }
      const { data } = await api.post(endpoint, body);
      const attMsg = data.attachments?.length
        ? ` · ${data.attachments.length} attachment(s)`
        : "";
      toast.success(
        `Generated ${data.doc_no} · ${(data.pdf_size / 1024).toFixed(1)} KB${attMsg}`,
      );
      localStorage.removeItem(saveKey);
      if (withAttachments) nav(`/documents/site-reki/${data.id}`);
      else nav("/documents/all");
    } catch {
      toast.error("Submission failed");
    } finally {
      setBusy(false);
    }
  };
  const cur = sections[active];
  return (
    <Shell
      title={title}
      subtitle={subtitle}
      action={
        <button
          onClick={submit}
          disabled={busy}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
        >
          <Save size={14} /> {busy ? "Generating…" : "Complete & Generate PDF"}
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
          onChange={(e) => setProjectId(e.target.value)}
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
                className={`text-left px-3 py-2 rounded-lg text-[14px] ${active === i ? "bg-[#1F453B] text-white" : "hover:bg-[#F4F6F7] text-[#333333]"}`}
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
                    onChange={(e) => update(cur.title, f.key, e.target.value)}
                  />
                ) : f.type === "date" ? (
                  <Input
                    type="date"
                    value={(values[cur.title] || {})[f.key] || ""}
                    onChange={(e) => update(cur.title, f.key, e.target.value)}
                  />
                ) : (
                  <Input
                    value={(values[cur.title] || {})[f.key] || ""}
                    onChange={(e) => update(cur.title, f.key, e.target.value)}
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
            Draft autosaved to this browser · {Object.keys(values).length}{" "}
            section{Object.keys(values).length !== 1 ? "s" : ""} filled
          </div>
        </Card>
      </div>
      {withAttachments && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-[16px] font-semibold text-[#333333]">
                Attachments
              </div>
              <div className="text-[12.5px] text-[#6B7B7C]">
                Upload site photos and reference files. Add a remark to each so
                context isn&apos;t lost.
              </div>
            </div>
            <label
              className="h-9 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold cursor-pointer inline-flex items-center gap-1.5"
              data-testid="reki-upload-input-label"
            >
              <Upload size={14} /> Upload files
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
                data-testid="reki-upload-input"
              />
            </label>
          </div>
          {attachments.length === 0 ? (
            <div
              className="border border-dashed border-[#B5C4B6] rounded-lg py-8 text-center text-[12.5px] text-[#6B7B7C]"
              data-testid="reki-attach-empty"
            >
              No attachments yet. Upload JPG / PNG / PDF / DOC / XLSX (up to 8
              MB each).
            </div>
          ) : (
            <div className="grid gap-3" data-testid="reki-attachments-list">
              {attachments.map((a, i) => {
                const isImg = (a.mime || "").startsWith("image/");
                return (
                  <div
                    key={i}
                    className="flex gap-3 items-start border border-[#EAEEF0] rounded-lg p-2.5"
                    data-testid={`reki-attach-row-${i}`}
                  >
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-[#F4F6F7] flex items-center justify-center shrink-0 border border-[#EAEEF0]">
                      {isImg ? (
                        <img
                          alt={a.name}
                          src={`data:${a.mime};base64,${a.content_b64}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText size={22} className="text-[#6B7B7C]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[13px] font-semibold text-[#333333] truncate">
                          {a.name}
                        </div>
                        <button
                          onClick={() =>
                            setAttachments((list) =>
                              list.filter((_, j) => j !== i),
                            )
                          }
                          className="text-[#B04D26] text-[12px] font-semibold hover:underline shrink-0"
                          data-testid={`reki-attach-remove-${i}`}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="text-[11.5px] text-[#6B7B7C] mb-1.5">
                        {(a.size / 1024).toFixed(1)} KB · {a.mime || "—"}
                      </div>
                      <input
                        placeholder="Remark (optional) — e.g. 'North wall damp patch'"
                        value={a.remark}
                        onChange={(e) =>
                          setAttachments((list) =>
                            list.map((x, j) =>
                              j === i ? { ...x, remark: e.target.value } : x,
                            ),
                          )
                        }
                        className="w-full h-9 px-2 rounded-md border border-[#DDD8CE] bg-[#FAF8F5] text-[13px]"
                        data-testid={`reki-attach-remark-${i}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </Shell>
  );
}

const BRIEF_SECTIONS = [
  {
    title: "Project & Client Information",
    fields: [
      { key: "client_name", label: "Client Name" },
      { key: "contact", label: "Primary Contact" },
      { key: "site_address", label: "Site Address", type: "textarea" },
    ],
  },
  {
    title: "Project Purpose",
    fields: [
      { key: "purpose", label: "Purpose", type: "textarea", rows: 4 },
      { key: "style", label: "Design style / mood" },
    ],
  },
  {
    title: "Users and Occupancy",
    fields: [
      { key: "adults", label: "Adults" },
      { key: "kids", label: "Children" },
      { key: "lifestyle", label: "Lifestyle notes", type: "textarea" },
    ],
  },
  {
    title: "Space Requirements",
    fields: [
      {
        key: "rooms",
        label: "Room list (one per line)",
        type: "textarea",
        rows: 5,
      },
    ],
  },
  {
    title: "Design Preferences",
    fields: [
      { key: "palette", label: "Colour palette" },
      { key: "materials", label: "Preferred materials" },
      {
        key: "inspirations",
        label: "Inspiration references",
        type: "textarea",
      },
    ],
  },
  {
    title: "Functional Requirements",
    fields: [
      { key: "storage", label: "Storage / utility needs", type: "textarea" },
      { key: "tech", label: "Technology / smart home" },
    ],
  },
  {
    title: "Budget and Timeline",
    fields: [
      { key: "budget", label: "Budget range" },
      { key: "start_by", label: "Preferred start", type: "date" },
      { key: "complete_by", label: "Target completion", type: "date" },
    ],
  },
  {
    title: "Project Constraints",
    fields: [
      {
        key: "constraints",
        label: "Constraints / restrictions",
        type: "textarea",
      },
    ],
  },
  {
    title: "Sustainability and Maintenance",
    fields: [
      {
        key: "sustainability",
        label: "Sustainability preferences",
        type: "textarea",
      },
    ],
  },
  {
    title: "Priority and Confirmation",
    fields: [
      {
        key: "priorities",
        label: "Priorities (essential / preferred / optional)",
        type: "textarea",
        rows: 4,
      },
    ],
  },
  {
    title: "Sign-off",
    fields: [
      {
        key: "architect_summary",
        label: "Architect summary",
        type: "textarea",
      },
      { key: "open_questions", label: "Open questions", type: "textarea" },
      { key: "client_comments", label: "Client comments", type: "textarea" },
    ],
  },
];

const REKI_SECTIONS = [
  {
    title: "Survey Information",
    fields: [
      { key: "surveyor", label: "Surveyor" },
      { key: "survey_date", label: "Survey date", type: "date" },
      { key: "weather", label: "Weather / conditions" },
    ],
  },
  {
    title: "Site and Access",
    fields: [
      {
        key: "access_notes",
        label: "Access / lift / stairs",
        type: "textarea",
      },
      { key: "parking", label: "Parking" },
    ],
  },
  {
    title: "Room-by-Room Survey",
    fields: [
      {
        key: "rooms_measured",
        label: "Rooms measured (L×W×H per line)",
        type: "textarea",
        rows: 6,
      },
    ],
  },
  {
    title: "Doors and Windows",
    fields: [{ key: "openings", label: "Openings notes", type: "textarea" }],
  },
  {
    title: "Electrical Survey",
    fields: [
      { key: "electrical", label: "Electrical points / DBs", type: "textarea" },
    ],
  },
  {
    title: "Plumbing and Sanitary",
    fields: [
      { key: "plumbing", label: "Plumbing lines / fixtures", type: "textarea" },
    ],
  },
  {
    title: "HVAC and Ventilation",
    fields: [{ key: "hvac", label: "HVAC / ducts", type: "textarea" }],
  },
  {
    title: "Existing Construction",
    fields: [
      {
        key: "structure",
        label: "Existing structure / condition",
        type: "textarea",
      },
    ],
  },
  {
    title: "Light and Environment",
    fields: [
      { key: "light", label: "Natural light / noise / air", type: "textarea" },
    ],
  },
  {
    title: "Safety and Restrictions",
    fields: [
      {
        key: "safety",
        label: "Society / municipal restrictions",
        type: "textarea",
      },
    ],
  },
  {
    title: "Survey Completion",
    fields: [
      { key: "observations", label: "Major observations", type: "textarea" },
      { key: "missing", label: "Missing info / follow-ups", type: "textarea" },
      { key: "submitted_by", label: "Submitted by" },
    ],
  },
];

export const ProjectBriefForm = () => (
  <SectionForm
    title="Project Brief"
    subtitle="Multi-section client brief · autosaved locally · generates a signed PDF"
    endpoint="/documents/forms/project-brief"
    sections={BRIEF_SECTIONS}
    saveKey="bc.brief.draft"
  />
);
export const SiteRekiForm = () => (
  <SectionForm
    title="Site Reki"
    subtitle="Site survey · autosaves every keystroke · generates a Noto-Sans PDF with rooms table"
    endpoint="/documents/forms/site-reki"
    sections={REKI_SECTIONS}
    saveKey="bc.reki.draft"
    withAttachments
  />
);