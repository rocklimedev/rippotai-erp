// Design Studio → Upload drawings.
// Full-width batch uploader: drop zone + queue (left), details for the selected file(s) (right),
// recent drawings of the chosen project underneath the queue so the page never sits empty.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  CheckCircle2,
  CloudUpload,
  FolderOpen,
  LayoutGrid,
  Plug,
  Trash2,
  Wand2,
  X,
} from "lucide-react";

import {
  Page,
  PageHeader,
  Card,
  Button,
  Pill,
  EmptyState,
  Progress,
  Field,
  TextInput,
  SelectInput,
  TextArea,
  FormActions,
} from "@/components/inos";
import { useAuth } from "@/context/AuthContext";
import {
  drawingApi,
  useGetDrawingsQuery,
  useGetDrawingByIdQuery,
  useCreateDrawingMutation,
} from "@/api/documents/drawing.api";
import { useGetProjectsQuery } from "@/api/projects/project.api";
import { useGetUsersQuery } from "@/api/users/user.api";

import { FileThumb, ProjectPicker } from "./DrawingBits";
import {
  ACCEPT,
  ACCEPT_EXT,
  PHASES,
  STATUSES,
  errMessage,
  extOf,
  fileKind,
  formatBytes,
  formatDate,
  latestRevision,
  maxSequence,
  nextRevisionLabel,
  projectCode,
  pad3,
  phaseLabel,
  statusTone,
  titleFromFilename,
  updatedAt,
  uploadRevision,
} from "./drawingUtils";
import "./drawings.css";

const MIXED = Symbol("mixed");
const MAX_BYTES = 500 * 1024 * 1024;
const today = () => new Date().toISOString().slice(0, 10);
let keySeq = 0;

export default function DrawingUploadPage() {
  const nav = useNavigate();
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const presetDrawingId = params.get("drawing") || "";
  const [projectId, setProjectId] = useState(params.get("project") || "");
  const [defaults, setDefaults] = useState(() => ({
    title: "",
    phaseCode: "05_DESIGN",
    revision: "",
    issueDate: today(),
    sheetNumber: "",
    drawnBy: "",
    checkedBy: "",
    remarks: "",
  }));
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const inputRef = useRef(null);
  const presetUsed = useRef(false);

  const { data: projects = [] } = useGetProjectsQuery({});
  const { data: users = [] } = useGetUsersQuery({});
  const { data: projectDrawings = [], isFetching: drawingsLoading } = useGetDrawingsQuery(
    projectId ? { projectId } : {},
  );
  const { data: presetDrawing } = useGetDrawingByIdQuery(presetDrawingId, { skip: !presetDrawingId });
  const [createDrawing] = useCreateDrawingMutation();

  const project = projects.find((p) => p.id === projectId);
  const userList = Array.isArray(users) ? users : users?.data || [];

  // current user = default "drawn by"
  useEffect(() => {
    if (user?.id) setDefaults((d) => (d.drawnBy ? d : { ...d, drawnBy: user.id }));
  }, [user?.id]);

  // ?drawing=<id> → new revision of an existing drawing
  useEffect(() => {
    if (!presetDrawing) return;
    setProjectId(presetDrawing.projectId);
    setDefaults((d) => ({
      ...d,
      phaseCode: presetDrawing.phaseCode || d.phaseCode,
      sheetNumber: presetDrawing.sheetNumber || "",
    }));
  }, [presetDrawing]);

  // revoke previews on unmount
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => () => itemsRef.current.forEach((i) => i.previewUrl && URL.revokeObjectURL(i.previewUrl)), []);

  /* ------------------------------------------------ numbering + matching */

  const existingByNumber = useMemo(() => {
    const m = new Map();
    if (!projectId) return m;
    projectDrawings.forEach((d) => d.projectId === projectId && m.set(String(d.drawingNumber).toUpperCase(), d));
    return m;
  }, [projectDrawings, projectId]);

  // Project code: reuse the prefix the project's register already uses (e.g. KAP), else initials of the name.
  const projCode = useMemo(() => {
    const tally = {};
    for (const n of existingByNumber.keys()) {
      const seg = String(n).split("-")[0];
      if (seg && seg.length <= 5) tally[seg] = (tally[seg] || 0) + 1;
    }
    const best = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : projectCode(project?.name);
  }, [existingByNumber, project?.name]);

  // Effective drawing numbers: manual numbers as typed, auto numbers continue each project+discipline series.
  const numbers = useMemo(() => {
    const out = {};
    const used = [...existingByNumber.keys(), ...items.filter((i) => !i.autoNumber).map((i) => i.drawingNumber)];
    const counters = {};
    for (const it of items) {
      if (!it.autoNumber) {
        out[it.key] = it.drawingNumber;
        continue;
      }
      if (!projectId) {
        out[it.key] = "";
        continue;
      }
      const prefix = `${projCode}-`;
      if (counters[prefix] == null) counters[prefix] = maxSequence(used, prefix);
      counters[prefix] += 1;
      out[it.key] = `${prefix}${pad3(counters[prefix])}`;
    }
    return out;
  }, [items, existingByNumber, projectId, projCode]);

  const nextNumberPreview = useMemo(() => {
    if (!projectId) return "";
    const prefix = `${projCode}-`;
    const used = [...existingByNumber.keys(), ...Object.values(numbers)];
    return `${prefix}${pad3(maxSequence(used, prefix) + 1)}`;
  }, [projectId, projCode, existingByNumber, numbers]);

  const issues = useMemo(() => {
    const res = {};
    const counts = {};
    items.forEach((i) => {
      if (i.state === "done") return;
      const n = String(numbers[i.key] || "").toUpperCase();
      if (n) counts[n] = (counts[n] || 0) + 1;
    });
    items.forEach((i) => {
      if (i.state === "done") return;
      const n = String(numbers[i.key] || "").toUpperCase();
      const e = {};
      if (!i.title.trim()) e.title = "Name is required";
      if (!n) e.number = projectId ? "Drawing number is required" : "Pick a project to number this drawing";
      else if (counts[n] > 1) e.number = "Same number used twice in this batch";
      res[i.key] = e;
    });
    return res;
  }, [items, numbers, projectId]);

  /* ------------------------------------------------ queue ops */

  const patch = useCallback((key, p) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...p } : i))), []);

  const addFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []);
      const skipped = [];
      const fresh = [];
      files.forEach((file) => {
        if (!ACCEPT_EXT.includes(extOf(file.name))) return skipped.push(`${file.name} (type)`);
        if (file.size > MAX_BYTES) return skipped.push(`${file.name} (over 500 MB)`);
        const kind = fileKind({ name: file.name, mime: file.type });
        const usePreset = presetDrawing && !presetUsed.current;
        if (usePreset) presetUsed.current = true;
        fresh.push({
          key: `f${++keySeq}`,
          file,
          kind,
          previewUrl: kind === "image" ? URL.createObjectURL(file) : null,
          ...defaults,
          title: usePreset ? presetDrawing.title : defaults.title || titleFromFilename(file.name),
          drawingNumber: usePreset ? presetDrawing.drawingNumber : "",
          autoNumber: !usePreset,
          state: "ready",
          progress: 0,
          error: null,
          drawingId: null,
        });
      });
      if (skipped.length) toast.error(`Skipped ${skipped.length} file${skipped.length > 1 ? "s" : ""}: ${skipped.join(", ")}`);
      if (!fresh.length) return;
      setItems((list) => [...list, ...fresh]);
      setSelected(fresh.map((f) => f.key));
    },
    [defaults, presetDrawing],
  );

  const removeItem = (key) => {
    setItems((list) => {
      const it = list.find((i) => i.key === key);
      if (it?.previewUrl) URL.revokeObjectURL(it.previewUrl);
      return list.filter((i) => i.key !== key);
    });
    setSelected((s) => s.filter((k) => k !== key));
  };

  const clearDone = () => {
    items.filter((i) => i.state === "done").forEach((i) => removeItem(i.key));
  };

  const toggleSelect = (key, additive) => {
    setSelected((s) => {
      if (!additive) return s.length === 1 && s[0] === key ? [] : [key];
      return s.includes(key) ? s.filter((k) => k !== key) : [...s, key];
    });
  };

  const editable = items.filter((i) => selected.includes(i.key) && i.state !== "done");
  const pending = items.filter((i) => i.state !== "done");
  const allSelected = pending.length > 0 && pending.every((i) => selected.includes(i.key));

  /* ------------------------------------------------ field binding (defaults or selection) */

  const valueOf = (field) => {
    if (!editable.length) return defaults[field] ?? "";
    const vals = [...new Set(editable.map((i) => i[field] ?? ""))];
    return vals.length === 1 ? vals[0] : MIXED;
  };
  const setField = (field, v) => {
    setDefaults((d) => ({ ...d, [field]: v }));
    if (!editable.length) return;
    const keys = new Set(editable.map((i) => i.key));
    setItems((list) => list.map((i) => (keys.has(i.key) ? { ...i, [field]: v } : i)));
  };
  const bindText = (field) => {
    const v = valueOf(field);
    return {
      value: v === MIXED ? "" : v,
      placeholder: v === MIXED ? "Mixed values — type to set for all" : undefined,
      onChange: (e) => setField(field, e.target.value),
    };
  };

  const single = editable.length === 1 ? editable[0] : null;
  const singleExisting = single ? existingByNumber.get(String(numbers[single.key] || "").toUpperCase()) : null;

  /* ------------------------------------------------ upload */

  const ready = items.filter((i) => i.state === "ready" || i.state === "error");
  const invalidCount = ready.filter((i) => Object.keys(issues[i.key] || {}).length).length;
  const doneCount = items.filter((i) => i.state === "done").length;

  const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== "" && v !== null && v !== undefined));

  const uploadAll = async () => {
    setTriedSubmit(true);
    if (!projectId) {
      toast.error("Choose the project these drawings belong to");
      return;
    }
    if (!ready.length) return;
    if (invalidCount) {
      toast.error(`${invalidCount} file${invalidCount > 1 ? "s need" : " needs"} a name or drawing number`);
      setSelected(ready.filter((i) => Object.keys(issues[i.key] || {}).length).map((i) => i.key));
      return;
    }

    // freeze numbers so later refetches can't shift them mid-batch
    const snapshot = ready.map((i) => ({ ...i, drawingNumber: numbers[i.key], autoNumber: false }));
    setItems((list) =>
      list.map((i) => {
        const s = snapshot.find((x) => x.key === i.key);
        return s ? { ...i, drawingNumber: s.drawingNumber, autoNumber: false } : i;
      }),
    );

    setBusy(true);
    let ok = 0;
    for (const it of snapshot) {
      patch(it.key, { state: "uploading", progress: 0, error: null });
      try {
        const existing = existingByNumber.get(String(it.drawingNumber).toUpperCase());
        let drawingId = it.drawingId || existing?.id;
        if (!drawingId) {
          const created = await createDrawing(
            clean({
              projectId,
              title: it.title.trim(),
              drawingNumber: it.drawingNumber.trim(),
              phaseCode: it.phaseCode,
              sheetNumber: it.sheetNumber,
              remarks: it.remarks,
              drawnBy: it.drawnBy,
              checkedBy: it.checkedBy,
            }),
          ).unwrap();
          drawingId = created.id;
          patch(it.key, { drawingId });
        }
        await uploadRevision({
          drawingId,
          file: it.file,
          data: clean({
            revision: it.revision?.trim(),
            issueDate: it.issueDate,
            remarks: it.remarks,
            uploadedBy: user?.id,
            uploadedByName: user?.name,
          }),
          onProgress: (p) => patch(it.key, { progress: p }),
        });
        patch(it.key, { state: "done", progress: 100, drawingId });
        ok += 1;
      } catch (e) {
        patch(it.key, { state: "error", error: errMessage(e, "Upload failed") });
      }
    }
    setBusy(false);
    setSelected([]);
    setTriedSubmit(false);
    dispatch(drawingApi.util.invalidateTags([{ type: "Drawing", id: "LIST" }]));
    const failed = snapshot.length - ok;
    if (ok) toast.success(`${ok} drawing${ok > 1 ? "s" : ""} uploaded to ${project?.name || "the project"}`);
    if (failed) toast.error(`${failed} upload${failed > 1 ? "s" : ""} failed — see the queue`);
  };

  /* ------------------------------------------------ recent panel data */

  const recent = useMemo(
    () => [...projectDrawings].sort((a, b) => new Date(updatedAt(b) || 0) - new Date(updatedAt(a) || 0)).slice(0, 8),
    [projectDrawings],
  );
  const statusCounts = useMemo(() => {
    const c = {};
    projectDrawings.forEach((d) => (c[d.status || "Draft"] = (c[d.status || "Draft"] || 0) + 1));
    return c;
  }, [projectDrawings]);
  const projectName = (id) => projects.find((p) => p.id === id)?.name || "—";

  /* ------------------------------------------------ render */

  const scopeBanner = !editable.length ? (
    <div className="ds-scope">
      <Wand2 size={16} aria-hidden />
      <span>
        <strong>Defaults for new files.</strong> Set these once — every file you add picks them up.
      </span>
    </div>
  ) : editable.length === 1 ? (
    <div className="ds-scope">
      <FileThumb name={single.file.name} mime={single.file.type} src={single.previewUrl} size="sm" />
      <span style={{ minWidth: 0 }}>
        Editing <strong style={{ overflowWrap: "anywhere" }}>{single.file.name}</strong>
      </span>
    </div>
  ) : (
    <div className="ds-scope ds-scope--batch">
      <LayoutGrid size={16} aria-hidden />
      <span>
        <strong>Batch edit · {editable.length} files.</strong> Changes apply to every selected file.
      </span>
    </div>
  );


  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Design Studio", to: "/design-studio" }, { label: "Drawings", to: "/design-studio/all" }, { label: "Upload" }]}
        title={presetDrawing ? `New revision · ${presetDrawing.drawingNumber}` : "Upload drawings"}
        subtitle="Drop in PDFs, CAD files or images, tag them once, and they land in the project's drawing register with revision history."
        actions={
          <>
            <Button variant="ghost" icon={Plug} onClick={() => nav("/design-studio/integrations")}>
              Integration diagnostics
            </Button>
            <Button variant="secondary" icon={FolderOpen} onClick={() => nav(projectId ? `/design-studio/all?project=${projectId}` : "/design-studio/all")}>
              Drawing register
            </Button>
          </>
        }
      />

      <div className="ds-upload">
        {/* ============================== LEFT: drop + queue + recent */}
        <div className="ds-upload__left">
          <div
            role="button"
            tabIndex={0}
            className={`ds-drop ${items.length ? "" : "ds-drop--tall"} ${over ? "is-over" : ""}`}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              addFiles(e.dataTransfer.files);
            }}
            data-testid="drawing-dropzone"
          >
            <span className="ds-drop__art">
              <CloudUpload aria-hidden />
            </span>
            <div style={{ minWidth: 0 }}>
              <p className="ds-drop__title">
                Drop drawings here or <u>browse files</u>
              </p>
              <p className="ds-drop__text">Add as many sheets as you like — each one becomes a drawing (or a new revision if its number already exists).</p>
              <div className="ds-drop__formats">
                {[
                  ["PDF", "peach"],
                  ["DWG", "info"],
                  ["DXF", "lilac"],
                  ["JPG", "ok"],
                  ["PNG", "ok"],
                ].map(([f, t]) => (
                  <span key={f} className="ds-drop__fmt" style={{ background: `var(--${t}-bg)`, color: `var(--${t}-fg)` }}>
                    {f}
                  </span>
                ))}
                <span className="ds-drop__fmt" style={{ color: "var(--text-3)" }}>
                  up to 500 MB each
                </span>
              </div>
            </div>
            <div className="ds-drop__side">
              <Button variant="soft" icon={CloudUpload} onClick={(e) => (e.stopPropagation(), inputRef.current?.click())}>
                Choose files
              </Button>
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT}
              hidden
              data-testid="drawing-file-input"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          <Card
            flush
            title={items.length ? `Upload queue · ${items.length} file${items.length > 1 ? "s" : ""}` : "How it works"}
            subtitle={
              items.length
                ? "Click a file to edit its details. Tick several to edit them together."
                : "Three steps from your drafting software to the project register."
            }
            actions={
              items.length ? (
                <>
                  {doneCount > 0 && (
                    <Button variant="ghost" size="sm" icon={CheckCircle2} onClick={clearDone}>
                      Clear uploaded
                    </Button>
                  )}
                  {!busy && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => {
                        items.forEach((i) => i.previewUrl && URL.revokeObjectURL(i.previewUrl));
                        setItems([]);
                        setSelected([]);
                      }}
                    >
                      Clear all
                    </Button>
                  )}
                </>
              ) : null
            }
          >
            {!items.length ? (
              <div className="ds-steps">
                {[
                  ["Add files", "Drag sheets in from your computer. Names are read from the file names."],
                  ["Tag them once", "Pick the project, phase; numbers auto-continue the project's series."],
                  ["Upload", "Each file is stored with its revision and issue date, ready to share."],
                ].map(([t, d], i) => (
                  <div className="ds-step" key={t}>
                    <span className="ds-step__n">{i + 1}</span>
                    <p className="ds-step__t">{t}</p>
                    <p className="ds-step__d">{d}</p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="ds-queue__bar">
                  <input
                    type="checkbox"
                    aria-label="Select all pending files"
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? [] : pending.map((i) => i.key))}
                    style={{ width: 16, height: 16, accentColor: "var(--brand)" }}
                  />
                  <span className="grow">
                    {selected.length ? `${editable.length} selected` : "Select all"}
                  </span>
                  <span>
                    {formatBytes(items.reduce((s, i) => s + i.file.size, 0))} total
                  </span>
                </div>
                <div className="ds-queue__list">
                  {items.map((it) => {
                    const num = numbers[it.key];
                    const iss = issues[it.key] || {};
                    const existing = it.state !== "done" && !it.drawingId ? existingByNumber.get(String(num || "").toUpperCase()) : null;
                    const isSel = selected.includes(it.key);
                    return (
                      <div
                        key={it.key}
                        className={`ds-qrow ${isSel ? "is-selected" : ""}`}
                        onClick={(e) => it.state !== "done" && toggleSelect(it.key, e.metaKey || e.ctrlKey || e.shiftKey)}
                        data-testid="queue-row"
                      >
                        <input
                          type="checkbox"
                          checked={isSel}
                          disabled={it.state === "done"}
                          aria-label={`Select ${it.file.name}`}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleSelect(it.key, true)}
                        />
                        <FileThumb name={it.file.name} mime={it.file.type} src={it.previewUrl} />
                        <div className="ds-qrow__main">
                          <span className={`ds-qrow__title ${iss.title && triedSubmit ? "is-missing" : ""}`}>
                            {it.title || "Unnamed — add a name"}
                          </span>
                          <span className="ds-qrow__meta">
                            <span className="ds-qrow__num">{num || "No number yet"}</span>
                            <span className="ds-rev">Rev {it.revision || (existing ? nextRevisionLabel(existing) : "A")}</span>
                            <span>{phaseLabel(it.phaseCode)}</span>
                            <span>{formatBytes(it.file.size)}</span>
                            {existing && (
                              <Pill tone="warn" size="sm" dot={false}>
                                New revision
                              </Pill>
                            )}
                          </span>
                          {triedSubmit && (iss.number || iss.title) && it.state !== "done" && (
                            <span className="ds-qrow__err" style={{ textAlign: "left" }}>
                              {iss.title || iss.number}
                            </span>
                          )}
                        </div>
                        <div className="ds-qrow__state">
                          {it.state === "uploading" ? (
                            <>
                              <span style={{ fontSize: 12, color: "var(--text-2)" }}>Uploading {it.progress}%</span>
                              <Progress value={it.progress} />
                            </>
                          ) : it.state === "done" ? (
                            <button
                              type="button"
                              className="inos-pill inos-pill--ok"
                              onClick={(e) => {
                                e.stopPropagation();
                                nav(`/design-studio/${it.drawingId}`);
                              }}
                              title="Open drawing"
                            >
                              <CheckCircle2 size={13} aria-hidden /> Uploaded · open
                            </button>
                          ) : it.state === "error" ? (
                            <>
                              <Pill tone="bad" size="sm">
                                Failed
                              </Pill>
                              <span className="ds-qrow__err">{it.error}</span>
                            </>
                          ) : (
                            <Pill tone="neutral" size="sm">
                              Ready
                            </Pill>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={X}
                          aria-label="Remove file"
                          title="Remove from queue"
                          disabled={it.state === "uploading"}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(it.key);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>

          {/* Recent drawings for the project */}
          <Card
            title={project ? `Recent in ${project.name}` : "Recently uploaded"}
            subtitle={
              project
                ? `${projectDrawings.length} drawing${projectDrawings.length === 1 ? "" : "s"} in this project's register`
                : "Latest drawings across all projects — pick a project to focus"
            }
            actions={
              <Button
                variant="ghost"
                size="sm"
                icon={FolderOpen}
                onClick={() => nav(projectId ? `/design-studio/all?project=${projectId}` : "/design-studio/all")}
              >
                Open register
              </Button>
            }
          >
            {Object.keys(statusCounts).length > 0 && (
              <div className="ds-summary" style={{ marginBottom: 16 }}>
                {STATUSES.filter((s) => statusCounts[s]).map((s) => (
                  <Pill key={s} tone={statusTone(s)}>
                    {s} · {statusCounts[s]}
                  </Pill>
                ))}
              </div>
            )}
            {drawingsLoading && !recent.length ? (
              <div style={{ color: "var(--text-3)", fontSize: 13 }}>Loading drawings…</div>
            ) : !recent.length ? (
              <EmptyState
                icon={LayoutGrid}
                title={project ? "No drawings in this project yet" : "No drawings uploaded yet"}
                text="Your first uploads will appear here with their latest revision and status."
              />
            ) : (
              <div className="ds-cards ds-cards--tight">
                {recent.map((d) => {
                  const rev = latestRevision(d);
                  return (
                    <button type="button" key={d.id} className="ds-dcard" onClick={() => nav(`/design-studio/${d.id}`)}>
                      <FileThumb name={rev?.filename || d.drawingNumber} mime={rev?.mime} src={rev?.url} size="lg" />
                      <div className="ds-dcard__body">
                        <span className="ds-dcard__num">{d.drawingNumber}</span>
                        <span className="ds-dcard__title">{d.title}</span>
                        <span className="ds-dcard__sub">
                          {project ? d.discipline || "—" : projectName(d.projectId)} · {formatDate(updatedAt(d))}
                        </span>
                        <div className="ds-dcard__foot">
                          <span className="ds-rev">Rev {rev?.revision || "—"}</span>
                          <Pill tone={statusTone(d.status)} size="sm">
                            {d.status || "Draft"}
                          </Pill>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ============================== RIGHT: details */}
        <aside className="ds-upload__right">
          <Card className="ds-details" title="Drawing details" subtitle="Applied to the selected file(s)">
            {scopeBanner}

            <div className="ds-group">
              <div className="ds-group__head">
                <h3 className="ds-group__title">Project</h3>
              </div>
              <Field label="Project" required error={triedSubmit && !projectId ? "Choose a project" : null} hint="Applies to the whole batch">
                <ProjectPicker id="ds-project" projects={projects} value={projectId} onChange={setProjectId} invalid={triedSubmit && !projectId} />
              </Field>
              <div className="ds-grid2">
                <Field label="Phase" htmlFor="ds-phase">
                  <SelectInput id="ds-phase" {...bindText("phaseCode")} placeholder={valueOf("phaseCode") === MIXED ? "Mixed" : undefined}>
                    {PHASES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Sheet no." optional htmlFor="ds-sheet">
                  <TextInput id="ds-sheet" {...bindText("sheetNumber")} placeholder={valueOf("sheetNumber") === MIXED ? "Mixed" : "e.g. 3 of 12"} />
                </Field>
              </div>
            </div>

            <div className="ds-group">
              <div className="ds-group__head">
                <h3 className="ds-group__title">Identification</h3>
                {editable.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Wand2}
                    onClick={() => {
                      const keys = new Set(editable.map((i) => i.key));
                      setItems((l) => l.map((i) => (keys.has(i.key) ? { ...i, autoNumber: true } : i)));
                    }}
                  >
                    Re-number selected
                  </Button>
                )}
              </div>
                  <Field label="Name" required htmlFor="ds-title" error={triedSubmit && single ? issues[single.key]?.title : null}>
                    <TextInput
                      id="ds-title"
                      {...bindText("title")}
                      maxLength={255}
                      placeholder={valueOf("title") === MIXED ? "Mixed names — type to set for selected files" : "e.g. Ground floor plan"}
                    />
                  </Field>
              {single ? (
                <>
                  <Field
                    label="Drawing number"
                    required
                    htmlFor="ds-number"
                    error={triedSubmit ? issues[single.key]?.number : null}
                    hint={
                      singleExisting
                        ? `Matches “${singleExisting.title}” — this file uploads as revision ${single.revision || nextRevisionLabel(singleExisting)}.`
                        : single.autoNumber
                          ? "Auto-numbered from project. Type to override."
                          : "Custom number."
                    }
                  >
                    <div className="ds-inline">
                      <TextInput
                        id="ds-number"
                        className="ds-mono"
                        value={numbers[single.key] || ""}
                        placeholder={projectId ? "" : "Pick a project first"}
                        onChange={(e) => patch(single.key, { drawingNumber: e.target.value.toUpperCase(), autoNumber: false })}
                      />
                      {!single.autoNumber && (
                        <Button variant="secondary" icon={Wand2} title="Use the next number in the series" onClick={() => patch(single.key, { autoNumber: true })}>
                          Auto
                        </Button>
                      )}
                    </div>
                  </Field>
                </>
              ) : (
                <p className="inos-hint" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                  {editable.length > 1
                    ? "Names come from each file name and numbers continue the series in queue order. Click a single file to edit its name or number."
                    : projectId
                      ? <>Next number in this series: <strong className="ds-mono" style={{ color: "var(--text)" }}>{nextNumberPreview}</strong></>
                      : "Pick a project to start auto-numbering (project code · sequence)."}
                </p>
              )}
              <div className="ds-grid2">
                <Field label="Revision" htmlFor="ds-rev" hint={singleExisting ? `Next is ${nextRevisionLabel(singleExisting)}` : "Blank = A for new drawings"}>
                  <TextInput id="ds-rev" {...bindText("revision")} placeholder={valueOf("revision") === MIXED ? "Mixed" : "Auto"} />
                </Field>
                <Field label="Issue date" htmlFor="ds-date">
                  <TextInput id="ds-date" type="date" {...bindText("issueDate")} />
                </Field>
              </div>
            </div>

            <div className="ds-group">
              <h3 className="ds-group__title">People</h3>
              <div className="ds-grid2">
                <Field label="Drawn by" htmlFor="ds-drawn">
                  <SelectInput id="ds-drawn" {...bindText("drawnBy")} placeholder="—">
                    {userList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.email}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Checked by" htmlFor="ds-checked">
                  <SelectInput id="ds-checked" {...bindText("checkedBy")} placeholder="—">
                    {userList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.email}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
              <Field label="Notes" optional htmlFor="ds-notes">
                <TextArea id="ds-notes" rows={3} {...bindText("remarks")} placeholder={valueOf("remarks") === MIXED ? "Mixed values" : "What changed, who it's for…"} />
              </Field>
            </div>
          </Card>
        </aside>
      </div>

      <div className="ds-actionbar">
        <FormActions
          note={
            !items.length
              ? "Add files to start."
              : busy
                ? "Uploading… keep this page open."
                : ready.length
                  ? `${ready.length} ready${project ? ` for ${project.name}` : " — choose a project"}${invalidCount && triedSubmit ? ` · ${invalidCount} need attention` : ""}`
                  : `${doneCount} uploaded.`
          }
          extra={
            doneCount > 0 && !busy ? (
              <Button variant="secondary" icon={FolderOpen} onClick={() => nav(`/design-studio/all?project=${projectId}`)}>
                View in register
              </Button>
            ) : null
          }
          submitLabel={ready.length > 1 ? `Upload ${ready.length} drawings` : "Upload drawing"}
          submitting={busy}
          submitDisabled={!ready.length || busy}
          onSubmit={uploadAll}
        />
      </div>
    </Page>
  );
}
