// Daily site report — create / edit. Full page, 8 numbered sections, sticky Save draft / Submit bar.
// Payload is built by payloadFromForm() in ./reportModel.js to match the backend DTO exactly.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, Camera, Loader2, FileText, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

import {
  Page,
  PageHeader,
  Button,
  FormSection,
  Field,
  TextInput,
  SelectInput,
  TextArea,
  EmptyState,
} from "@/components/inos";
import { useAuth } from "@/context/AuthContext";
import { useGetProjectsQuery } from "@/api/projects/project.api";
import { useGetMaterialsQuery } from "@/api/procuerment/material-master.api";
import {
  useGetDailySiteReportQuery,
  useCreateDailySiteReportMutation,
  useUpdateDailySiteReportMutation,
  useUploadDailyReportPhotoMutation,
  useListDailySiteReportsQuery,
} from "@/api/procuerment/site-ops.api";
import {
  WEATHER,
  SITE_CONDITIONS,
  TRADES,
  ISSUE_TYPES,
  IMPACTS,
  UNITS,
  emptyForm,
  formFromReport,
  payloadFromForm,
  validateForm,
  blankManpower,
  blankWork,
  blankMaterial,
  blankEquipment,
  blankIssue,
  rowKey,
  todayISO,
  fmtDate,
} from "./reportModel";
import "./daily-reports.css";

const BASE = "/site-operations/daily-reports";

/* ------------------------------------------------------------ small controls */

function Chips({ value, onChange, options, name }) {
  return (
    <div className="dsr-chips" role="radiogroup" aria-label={name}>
      {options.map((o) => {
        const I = o.icon;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className="dsr-chip" onClick={() => onChange(o.value)}>
            {I && <I aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} className="dsr-toggle" onClick={() => onChange(!checked)}>
      <span className="dsr-toggle__track" aria-hidden />
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
    </button>
  );
}

const RemoveBtn = ({ onClick, label }) => (
  <div className="dsr-row__remove">
    <Button variant="ghost" icon={Trash2} aria-label={label} title={label} onClick={onClick} />
  </div>
);

/* ------------------------------------------------------------ page */

export default function DailyReportForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const { data: projectsData } = useGetProjectsQuery({});
  const projects = useMemo(() => {
    const rows = Array.isArray(projectsData) ? projectsData : projectsData?.data || projectsData?.items || [];
    return rows.filter((p) => !p.deleted_at && !p.archived_at);
  }, [projectsData]);

  const { data: materialsData } = useGetMaterialsQuery({ isActive: true });
  const materials = useMemo(() => (Array.isArray(materialsData) ? materialsData : materialsData?.data || []), [materialsData]);

  const { data: recent } = useListDailySiteReportsQuery({}, { skip: isEdit });
  const { data: existing, isFetching: loadingExisting, isError: loadError } = useGetDailySiteReportQuery(id, { skip: !isEdit });

  const [form, setForm] = useState(() => emptyForm({ projectId: params.get("projectId") || "", reportedBy: user?.name || "" }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(null); // "DRAFT" | "SUBMITTED"
  const [uploading, setUploading] = useState(0);
  const loaded = useRef(false);
  const fileRef = useRef(null);

  const [createReport] = useCreateDailySiteReportMutation();
  const [updateReport] = useUpdateDailySiteReportMutation();
  const [uploadPhoto] = useUploadDailyReportPhotoMutation();

  // Edit: hydrate once.
  useEffect(() => {
    if (isEdit && existing && !loaded.current) {
      loaded.current = true;
      setForm(formFromReport(existing));
    }
  }, [isEdit, existing]);

  // New: default project = ?projectId, else the project reported on most recently, else the first active one.
  useEffect(() => {
    if (isEdit || form.projectId || !projects.length) return;
    const rows = Array.isArray(recent) ? recent : [];
    const fromRecent = rows.find((r) => projects.some((p) => p.id === r.projectId))?.projectId;
    const active = projects.find((p) => String(p.status).toLowerCase() === "active") || projects[0];
    setForm((f) => ({ ...f, projectId: fromRecent || active?.id || "" }));
  }, [isEdit, projects, recent, form.projectId]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const setRow = (list, idx, key, value) => {
    setForm((f) => ({ ...f, [list]: f[list].map((r, i) => (i === idx ? { ...r, [key]: value } : r)) }));
    const ek = `${list}.${idx}.${key}`;
    if (errors[ek] || errors[list]) setErrors((e) => ({ ...e, [ek]: undefined, [list]: undefined }));
  };
  const addRow = (list, row) => setForm((f) => ({ ...f, [list]: [...f[list], row] }));
  const removeRow = (list, idx) => setForm((f) => ({ ...f, [list]: f[list].filter((_, i) => i !== idx) }));
  const err = (k) => errors[k];

  const wasSubmitted = isEdit && existing?.status === "SUBMITTED";
  const manpowerTotal = form.manpower.reduce((s, m) => s + (Number(m.headcount) || 0), 0);
  const project = projects.find((p) => p.id === form.projectId) || existing?.project;

  /* ---------- photos ---------- */
  const onFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    setUploading((n) => n + files.length);
    for (const file of files) {
      try {
        const res = await uploadPhoto(file).unwrap();
        setForm((f) => ({
          ...f,
          photos: [...f.photos, { key: rowKey(), url: res.url, filename: res.filename, caption: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ") }],
        }));
      } catch (e) {
        toast.error(`${file.name}: ${e?.data?.message || "upload failed"}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  /* ---------- material master link ---------- */
  const onMaterialName = (idx, name) => {
    const hit = materials.find((m) => String(m.name).toLowerCase() === name.trim().toLowerCase());
    setForm((f) => ({
      ...f,
      materials: f.materials.map((r, i) =>
        i === idx ? { ...r, name, materialId: hit?.id || "", unit: hit?.unit?.code || r.unit } : r,
      ),
    }));
    if (errors[`materials.${idx}.name`]) setErrors((e) => ({ ...e, [`materials.${idx}.name`]: undefined }));
  };

  /* ---------- save ---------- */
  const save = async (status) => {
    const e = validateForm(form, status);
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Please fix the highlighted fields");
      requestAnimationFrame(() => {
        const el = document.querySelector('[aria-invalid="true"], .inos-error');
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    if (uploading) {
      toast.error("Wait for photos to finish uploading");
      return;
    }
    setSaving(status);
    try {
      const body = payloadFromForm(form, status, { includeProject: !isEdit });
      const res = isEdit ? await updateReport({ id, ...body }).unwrap() : await createReport(body).unwrap();
      toast.success(status === "SUBMITTED" ? "Report submitted" : "Draft saved");
      nav(`${BASE}/${res.id}`);
    } catch (e2) {
      const msg = e2?.data?.message;
      if (e2?.status === 409 && e2?.data?.existingId) {
        setErrors((x) => ({ ...x, reportDate: "A report already exists for this project on this date" }));
        toast.error("A report for this date already exists", {
          action: { label: "Open it", onClick: () => nav(`${BASE}/${e2.data.existingId}/edit`) },
        });
      } else {
        toast.error(Array.isArray(msg) ? msg[0] : msg || "Could not save the report");
      }
    } finally {
      setSaving(null);
    }
  };

  const crumbs = [
    { label: "Site Operations", to: "/site-operations" },
    { label: "Daily reports", to: BASE },
    { label: isEdit ? "Edit" : "New" },
  ];

  if (isEdit && loadError) {
    return (
      <Page width="form">
        <PageHeader crumbs={crumbs} title="Daily site report" />
        <div className="inos-card">
          <EmptyState icon={FileText} title="Report not found" text="It may have been deleted." action={<Button onClick={() => nav(BASE)}>Back to reports</Button>} />
        </div>
      </Page>
    );
  }
  if (isEdit && loadingExisting && !loaded.current) {
    return (
      <Page width="form">
        <PageHeader crumbs={crumbs} title="Edit daily report" subtitle="Loading…" />
      </Page>
    );
  }

  const received = form.materials.map((m, i) => ({ m, i })).filter((x) => x.m.direction === "RECEIVED");
  const used = form.materials.map((m, i) => ({ m, i })).filter((x) => x.m.direction === "USED");

  const materialRow = ({ m, i }) => (
    <div className="dsr-row dsr-row--material" key={m.key}>
      <div className="dsr-wide">
        <Field label="Material" error={err(`materials.${i}.name`)} hint={m.materialId ? "Linked to material master" : undefined}>
          <TextInput list="dsr-materials" value={m.name} placeholder="e.g. Cement OPC 53" invalid={!!err(`materials.${i}.name`)} onChange={(e) => onMaterialName(i, e.target.value)} />
        </Field>
      </div>
      <Field label="Qty" error={err(`materials.${i}.quantity`)}>
        <TextInput type="number" inputMode="decimal" min="0" step="any" value={m.quantity} invalid={!!err(`materials.${i}.quantity`)} onChange={(e) => setRow("materials", i, "quantity", e.target.value)} />
      </Field>
      <Field label="Unit">
        <SelectInput value={m.unit} onChange={(e) => setRow("materials", i, "unit", e.target.value)}>
          {UNITS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </SelectInput>
      </Field>
      <div className="dsr-wide">
        <Field label="Remarks">
          <TextInput value={m.remarks} placeholder={m.direction === "RECEIVED" ? "Challan no. / supplier" : "Where used"} onChange={(e) => setRow("materials", i, "remarks", e.target.value)} />
        </Field>
      </div>
      <RemoveBtn label="Remove material" onClick={() => removeRow("materials", i)} />
    </div>
  );

  return (
    <Page width="form" className="dsr-page">
      <PageHeader
        crumbs={crumbs}
        title={isEdit ? "Edit daily report" : "New daily report"}
        subtitle={
          isEdit && existing
            ? `${existing.project?.name || "Project"} · ${fmtDate(existing.reportDate)}`
            : "Log today's site activity — fill what applies, save a draft anytime, submit at the end of the day."
        }
      />

      <form className="inos-form" onSubmit={(e) => { e.preventDefault(); save("SUBMITTED"); }} noValidate>
        {/* 1 ---------------------------------------------------- basics */}
        <FormSection step={1} title="Basics" description="Project, date and conditions on site.">
          <Field label="Project" required error={err("projectId")}>
            <SelectInput value={form.projectId} disabled={isEdit} invalid={!!err("projectId")} placeholder={projects.length ? "Select a project" : "Loading projects…"} onChange={(e) => set("projectId", e.target.value)}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Report date" required error={err("reportDate")} hint={project?.site_location || undefined}>
            <TextInput type="date" max={todayISO()} value={form.reportDate} invalid={!!err("reportDate")} onChange={(e) => set("reportDate", e.target.value)} />
          </Field>
          <Field label="Weather" full>
            <Chips name="Weather" value={form.weatherCondition} onChange={(v) => set("weatherCondition", v)} options={WEATHER} />
          </Field>
          <Field label="Site condition" full>
            <Chips name="Site condition" value={form.siteCondition} onChange={(v) => set("siteCondition", v)} options={SITE_CONDITIONS} />
          </Field>
          <Field label="Weather / site notes" optional full>
            <TextInput value={form.weatherNotes} placeholder="e.g. Rain from 2 pm, basement pumped out" onChange={(e) => set("weatherNotes", e.target.value)} />
          </Field>
          <Field label="Reported by" required error={err("reportedBy")}>
            <TextInput value={form.reportedBy} invalid={!!err("reportedBy")} onChange={(e) => set("reportedBy", e.target.value)} />
          </Field>
        </FormSection>

        {/* 2 ---------------------------------------------------- manpower */}
        <FormSection step={2} title="Manpower" description="Workers on site today, by trade and contractor." columns={1}>
          <div className="dsr-rows">
            {form.manpower.map((m, i) => (
              <div className="dsr-row dsr-row--manpower" key={m.key}>
                <Field label="Trade" error={err(`manpower.${i}.trade`)}>
                  <SelectInput value={m.trade} placeholder="Select trade" invalid={!!err(`manpower.${i}.trade`)} onChange={(e) => setRow("manpower", i, "trade", e.target.value)}>
                    {TRADES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Contractor / agency">
                  <TextInput value={m.contractorName} placeholder="e.g. Sharma Electricals" onChange={(e) => setRow("manpower", i, "contractorName", e.target.value)} />
                </Field>
                <Field label="Headcount" error={err(`manpower.${i}.headcount`)}>
                  <TextInput type="number" inputMode="numeric" min="0" value={m.headcount} invalid={!!err(`manpower.${i}.headcount`)} onChange={(e) => setRow("manpower", i, "headcount", e.target.value)} />
                </Field>
                <RemoveBtn label="Remove trade" onClick={() => removeRow("manpower", i)} />
              </div>
            ))}
            {err("manpower") && <span className="inos-error">{err("manpower")}</span>}
            <Button className="dsr-add" variant="soft" size="sm" icon={Plus} onClick={() => addRow("manpower", blankManpower())}>Add trade</Button>
            <div className="dsr-total">
              <span>Total on site</span>
              <strong>{manpowerTotal}</strong>
            </div>
          </div>
        </FormSection>

        {/* 3 ---------------------------------------------------- work done */}
        <FormSection step={3} title="Work done today" description="One row per activity. Progress is cumulative % complete." columns={1}>
          <div className="dsr-rows">
            {form.workItems.map((w, i) => (
              <div className="dsr-row dsr-row--work" key={w.key}>
                <div className="dsr-wide">
                  <Field label="Activity" error={err(`workItems.${i}.activity`)}>
                    <TextInput value={w.activity} placeholder="e.g. Brickwork for partition walls" invalid={!!err(`workItems.${i}.activity`)} onChange={(e) => setRow("workItems", i, "activity", e.target.value)} />
                  </Field>
                </div>
                <Field label="Location / area">
                  <TextInput value={w.location} placeholder="e.g. First floor, bedroom 2" onChange={(e) => setRow("workItems", i, "location", e.target.value)} />
                </Field>
                <Field label="Progress %" error={err(`workItems.${i}.progress`)}>
                  <TextInput type="number" inputMode="numeric" min="0" max="100" value={w.progress} placeholder="0–100" invalid={!!err(`workItems.${i}.progress`)} onChange={(e) => setRow("workItems", i, "progress", e.target.value)} />
                </Field>
                <RemoveBtn label="Remove activity" onClick={() => removeRow("workItems", i)} />
              </div>
            ))}
            {err("workItems") && <span className="inos-error">{err("workItems")}</span>}
            <Button className="dsr-add" variant="soft" size="sm" icon={Plus} onClick={() => addRow("workItems", blankWork())}>Add activity</Button>
          </div>
          <Field label="Summary" optional hint="A line or two for the client, if needed.">
            <TextArea rows={3} value={form.workCompleted} placeholder="Overall summary of the day" onChange={(e) => set("workCompleted", e.target.value)} />
          </Field>
        </FormSection>

        {/* 4 ---------------------------------------------------- materials + equipment */}
        <FormSection step={4} title="Materials & equipment" description="What arrived on site and what was used. Pick from the material list where possible." columns={1}>
          <datalist id="dsr-materials">
            {materials.map((m) => (
              <option key={m.id} value={m.name} />
            ))}
          </datalist>
          <div className="dsr-rows">
            <p className="dsr-sub">Received</p>
            {received.map(materialRow)}
            <Button className="dsr-add" variant="soft" size="sm" icon={ArrowDownToLine} onClick={() => addRow("materials", blankMaterial("RECEIVED"))}>Add received</Button>
            <p className="dsr-sub">Used / consumed</p>
            {used.map(materialRow)}
            <Button className="dsr-add" variant="soft" size="sm" icon={ArrowUpFromLine} onClick={() => addRow("materials", blankMaterial("USED"))}>Add used</Button>
            <p className="dsr-sub">Equipment on site</p>
            {form.equipment.map((q, i) => (
              <div className="dsr-row dsr-row--equipment" key={q.key}>
                <div className="dsr-wide">
                  <Field label="Equipment">
                    <TextInput value={q.name} placeholder="e.g. Concrete mixer" onChange={(e) => setRow("equipment", i, "name", e.target.value)} />
                  </Field>
                </div>
                <Field label="Count">
                  <TextInput type="number" inputMode="numeric" min="0" value={q.count} onChange={(e) => setRow("equipment", i, "count", e.target.value)} />
                </Field>
                <Field label="Hours used">
                  <TextInput type="number" inputMode="decimal" min="0" step="any" value={q.hours} onChange={(e) => setRow("equipment", i, "hours", e.target.value)} />
                </Field>
                <RemoveBtn label="Remove equipment" onClick={() => removeRow("equipment", i)} />
              </div>
            ))}
            <Button className="dsr-add" variant="soft" size="sm" icon={Plus} onClick={() => addRow("equipment", blankEquipment())}>Add equipment</Button>
          </div>
        </FormSection>

        {/* 5 ---------------------------------------------------- issues + safety */}
        <FormSection step={5} title="Issues, delays & safety" description="Anything that held up work or needs a decision. Flag what needs attention." columns={1}>
          <div className="dsr-rows">
            {form.issueItems.map((it, i) => (
              <div className="dsr-row dsr-row--issue" key={it.key}>
                <Field label="Type">
                  <SelectInput value={it.type} onChange={(e) => setRow("issueItems", i, "type", e.target.value)}>
                    {ISSUE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </SelectInput>
                </Field>
                <div className="dsr-wide">
                  <Field label="Description" error={err(`issueItems.${i}.description`)}>
                    <TextInput value={it.description} placeholder="What happened and what is needed" invalid={!!err(`issueItems.${i}.description`)} onChange={(e) => setRow("issueItems", i, "description", e.target.value)} />
                  </Field>
                </div>
                <RemoveBtn label="Remove issue" onClick={() => removeRow("issueItems", i)} />
                <div className="dsr-issue-foot">
                  <Chips name="Impact" value={it.impact} onChange={(v) => setRow("issueItems", i, "impact", v)} options={IMPACTS.map((o) => ({ ...o, label: `${o.label} impact` }))} />
                  <Toggle checked={it.needsAttention} onChange={(v) => setRow("issueItems", i, "needsAttention", v)} label="Needs attention" />
                </div>
              </div>
            ))}
            {!form.issueItems.length && <p className="dsr-muted">No issues logged. Add one if anything held up work.</p>}
            <Button className="dsr-add" variant="soft" size="sm" icon={Plus} onClick={() => addRow("issueItems", blankIssue())}>Add issue</Button>
          </div>
          <Toggle checked={form.safetyIncident} onChange={(v) => set("safetyIncident", v)} label="Safety incident today" hint="Injury, near miss or unsafe condition" />
          <Field label={form.safetyIncident ? "Incident details" : "Safety notes"} required={form.safetyIncident} optional={!form.safetyIncident} error={err("safetyNotes")}>
            <TextArea rows={2} value={form.safetyNotes} invalid={!!err("safetyNotes")} placeholder="e.g. Toolbox talk on scaffolding; helmets checked" onChange={(e) => set("safetyNotes", e.target.value)} />
          </Field>
        </FormSection>

        {/* 6 ---------------------------------------------------- photos */}
        <FormSection step={6} title="Photos" description="Progress photos with a short caption. Several at once is fine." columns={1}>
          <div className="dsr-photos">
            {form.photos.map((p, i) => (
              <div className="dsr-photo" key={p.key}>
                <div className="dsr-photo__img">
                  <img src={p.url} alt={p.caption || `Photo ${i + 1}`} />
                  <Button size="sm" variant="ghost" icon={Trash2} aria-label="Remove photo" onClick={() => removeRow("photos", i)} />
                </div>
                <input className="inos-input" value={p.caption} placeholder="Caption" aria-label={`Caption for photo ${i + 1}`} onChange={(e) => setRow("photos", i, "caption", e.target.value)} />
              </div>
            ))}
            <label className="dsr-drop">
              {uploading ? <Loader2 className="animate-spin" size={22} /> : <Camera size={22} />}
              {uploading ? `Uploading ${uploading}…` : "Add photos"}
              <small>Camera or gallery · JPG / PNG</small>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden data-testid="dsr-photo-input" onChange={(e) => onFiles(e.target.files)} />
            </label>
          </div>
        </FormSection>

        {/* 7 ---------------------------------------------------- tomorrow */}
        <FormSection step={7} title="Tomorrow's plan" description="Work planned for the next day, and anything that must arrive first." columns={1}>
          <Field label="Plan" optional>
            <TextArea rows={3} value={form.nextDayPlan} placeholder="e.g. Start plastering first floor; need 40 bags cement by 10 am" onChange={(e) => set("nextDayPlan", e.target.value)} />
          </Field>
        </FormSection>

        {/* 8 ---------------------------------------------------- share */}
        <FormSection step={8} title="Share" description="Submitted reports can be shared with the client." columns={1}>
          <Toggle
            checked={form.shareWithClient}
            onChange={(v) => set("shareWithClient", v)}
            label="Share with client"
            hint={form.shareWithClient ? "Marked as shared when you submit." : "Stays internal to the team."}
          />
        </FormSection>

        <div className="inos-form-actions">
          <span className="inos-form-actions__note">
            {manpowerTotal} on site · {form.workItems.filter((w) => w.activity.trim()).length} activities · {form.photos.length} photos
          </span>
          <div className="inos-form-actions__buttons">
            <Button variant="ghost" onClick={() => nav(isEdit ? `${BASE}/${id}` : BASE)}>Cancel</Button>
            {!wasSubmitted && (
              <Button variant="secondary" loading={saving === "DRAFT"} disabled={!!saving} onClick={() => save("DRAFT")}>Save draft</Button>
            )}
            <Button variant="primary" type="submit" loading={saving === "SUBMITTED"} disabled={!!saving}>
              {wasSubmitted ? "Save changes" : "Submit report"}
            </Button>
          </div>
        </div>
      </form>
    </Page>
  );
}
