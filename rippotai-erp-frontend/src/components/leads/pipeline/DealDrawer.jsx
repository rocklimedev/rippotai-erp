import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  X,
  Trophy,
  XCircle,
  Trash2,
  StickyNote,
  ArrowRightLeft,
  ListTodo,
  Sparkles,
  RefreshCw,
  PencilLine,
  FileText,
  Camera,
  ClipboardList,
  ListChecks,
  Presentation,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  FolderPlus,
  Users,
} from "lucide-react";
import { Button, Card, Tabs, TextArea, TextInput, SelectInput, Pill, Avatar, EmptyState } from "@/components/inos";
import {
  useGetLeadQuery,
  useUpdateLeadMutation,
  useAddNoteMutation,
  useDeleteNoteMutation,
  useAddLeadTaskMutation,
  useUpdateLeadTaskMutation,
  useDeleteLeadTaskMutation,
  useDeleteLeadMutation,
} from "@/api/connectors/leads.api";
import { useGetProjectsQuery, useCreateProjectMutation } from "@/api/projects/project.api";
import { useGetClientsQuery } from "@/api/projects/client.api";
import { STAGES, PIPELINE_STEPS, stageOf, formatINR, TAG_COLORS } from "@/hooks/stages";
import { Drawer, DrawerClose } from "./Modal";
import EditableField from "./EditableField";
import { shortDate, dateTime, relative, isPast, todayISO, errorText, parseRupees } from "./utils";

const KIND_ICON = {
  note: StickyNote,
  stage: ArrowRightLeft,
  won: Trophy,
  lost: XCircle,
  task: ListTodo,
  created: Sparkles,
  zoho: RefreshCw,
  update: PencilLine,
  call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  meeting: Users,
  site_visit: MapPin,
  visit: MapPin,
  proposed: Presentation,
};

const DOCS = [
  { key: "brief", label: "Client brief", icon: FileText, view: (id) => `/crm/brief/${id}`, create: "/crm/forms/project-brief" },
  { key: "recce", label: "Site recce", icon: Camera, view: (id) => `/crm/recce/${id}`, create: "/crm/forms/site-reki" },
  { key: "planOfAction", label: "Plan of action", icon: ClipboardList, view: (id) => `/crm/plan-of-action/${id}`, create: "/crm/forms/plan-of-action" },
  { key: "scopeOfWork", label: "Scope of work", icon: ListChecks, view: (id) => `/crm/scope-of-work/${id}`, create: "/crm/forms/scope-of-work" },
  { key: "proposal", label: "Business proposal", icon: Presentation, view: () => null, create: "/crm/forms/business-proposal" },
];

function Stepper({ stage, onPick }) {
  const idx = PIPELINE_STEPS.findIndex((s) => s.id === stage);
  return (
    <div className="crm-stepper" role="list" aria-label="Pipeline stage" data-testid="stage-stepper">
      {PIPELINE_STEPS.map((s, i) => (
        <button
          key={s.id}
          type="button"
          role="listitem"
          title={s.label}
          className={`crm-step ${i < idx ? "is-done" : ""} ${i === idx ? "is-current" : ""} ${s.won ? "is-won" : ""}`}
          onClick={() => i !== idx && onPick(s.id)}
          aria-current={i === idx ? "step" : undefined}
          data-stage={s.id}
        >
          <span>{s.short}</span>
        </button>
      ))}
    </div>
  );
}

function Fact({ label, children }) {
  return (
    <div className="crm-fact">
      <span>{label}</span>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

export default function DealDrawer({ dealId, open, onOpenChange, meta, onMove, onAskLost }) {
  const navigate = useNavigate();
  const { data: deal, isLoading, isError } = useGetLeadQuery(dealId, { skip: !dealId });
  const [tab, setTab] = useState("timeline");
  const [note, setNote] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [linkProject, setLinkProject] = useState("");

  const [updateLead] = useUpdateLeadMutation();
  const [addNote, { isLoading: addingNote }] = useAddNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();
  const [addTask, { isLoading: addingTask }] = useAddLeadTaskMutation();
  const [updateTask] = useUpdateLeadTaskMutation();
  const [deleteTask] = useDeleteLeadTaskMutation();
  const [deleteLead] = useDeleteLeadMutation();
  const [createProject, { isLoading: creatingProject }] = useCreateProjectMutation();
  const { data: projects = [] } = useGetProjectsQuery(undefined, { skip: !open || tab !== "documents" });
  const { data: clients = [] } = useGetClientsQuery(undefined, { skip: !open });

  const save = (patch, msg) =>
    updateLead({ id: dealId, ...patch })
      .unwrap()
      .then(() => msg && toast.success(msg))
      .catch((err) => toast.error(errorText(err, "Couldn't save.")));

  const timeline = useMemo(() => {
    if (!deal) return [];
    const notes = (deal.notes || []).map((n) => ({ ...n, kind: "note", isNote: true }));
    const acts = (deal.activity || []).map((a) => ({ ...a }));
    return [...notes, ...acts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [deal]);

  const ownerOptions = (meta?.owners || []).map((o) => ({ value: o.id || `name:${o.name}`, label: o.name }));
  const clientOptions = (Array.isArray(clients) ? clients : []).map((c) => ({ value: c.id, label: c.name })).sort((a, b) => a.label.localeCompare(b.label));

  const submitNote = async () => {
    if (!note.trim()) return;
    try {
      await addNote({ id: dealId, text: note }).unwrap();
      setNote("");
      toast.success("Note added");
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const submitTask = async () => {
    if (!taskTitle.trim()) return;
    try {
      await addTask({ id: dealId, title: taskTitle, dueDate: taskDue || undefined }).unwrap();
      setTaskTitle("");
      setTaskDue("");
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const createProjectFromDeal = async () => {
    try {
      const p = await createProject({
        name: deal.title,
        site_location: deal.location || "To be confirmed",
        priority: "MEDIUM",
        ...(deal.clientId ? { client_id: deal.clientId } : {}),
      }).unwrap();
      const pid = p?.id || p?.data?.id;
      if (pid) await updateLead({ id: dealId, projectId: pid }).unwrap();
      toast.success("Project created and linked");
    } catch (err) {
      toast.error(errorText(err, "Couldn't create the project."));
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete “${deal.title}”? Notes, tasks and history go with it.`)) return;
    try {
      await deleteLead(dealId).unwrap();
      toast.success("Deal deleted");
      onOpenChange(false);
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const s = deal ? stageOf(deal.stage) : null;
  const isOpenDeal = deal && !s.closed && !s.won;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} label={deal?.title || "Deal"} testId="deal-drawer">
      {isLoading || !deal ? (
        <div className="crm-drawer__body">
          {isError ? <EmptyState title="Couldn't load this deal" text="It may have been deleted." /> : <p className="inos-hint">Loading deal…</p>}
        </div>
      ) : (
        <>
          <div className="crm-drawer__head">
            <div className="crm-drawer__top">
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Pill tone={s.tone === "mute" ? "mute" : s.tone} size="sm">
                    {s.label}
                  </Pill>
                  {deal.tag && <Pill tone={TAG_COLORS[deal.tag]?.tone} size="sm">{deal.tag}</Pill>}
                  {deal.stuck && <Pill tone="warn" size="sm">Stuck {deal.daysInStage}d</Pill>}
                  {deal.zohoId && <Pill tone="info" size="sm">Synced with Bigin</Pill>}
                </div>
                <div style={{ marginTop: 6 }}>
                  <EditableField value={deal.title} display={<h2 className="crm-drawer__title">{deal.title}</h2>} onSave={(v) => v && save({ dealName: v })} testId="deal-title" />
                </div>
                <div className="crm-drawer__sub">
                  <span>{deal.clientName || deal.company || "No client linked"}</span>
                  {deal.contact && deal.contact !== deal.title && <span>· {deal.contact}</span>}
                  <span>· created {shortDate(deal.createdAt)}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {isOpenDeal && (
                  <>
                    <Button variant="soft" size="sm" icon={Trophy} onClick={() => onMove(deal, "contract")} data-testid="mark-won">
                      Won
                    </Button>
                    <Button variant="secondary" size="sm" icon={XCircle} onClick={() => onAskLost(deal)} data-testid="mark-lost">
                      Lost
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" icon={Trash2} onClick={remove} aria-label="Delete deal" title="Delete deal" />
                <DrawerClose asChild>
                  <Button variant="ghost" size="sm" icon={X} aria-label="Close" />
                </DrawerClose>
              </div>
            </div>

            <div className="crm-keyfacts">
              <div className="crm-keyfact">
                <span>Value</span>
                <b>
                  <EditableField
                    value={deal.amount ?? ""}
                    display={formatINR(deal.amount)}
                    type="money"
                    placeholder="Add value"
                    parse={(v) => {
                      if (v === "" || v == null) return null;
                      const n = parseRupees(v);
                      if (Number.isNaN(n)) {
                        toast.error("Use a number, e.g. 45 L or 1.2 Cr.");
                        return undefined;
                      }
                      return n;
                    }}
                    onSave={(v) => save({ amount: v })}
                    testId="deal-value"
                  />
                </b>
              </div>
              <div className="crm-keyfact">
                <span>Expected close</span>
                <b style={{ fontSize: 15, color: deal.expectedClose && isPast(deal.expectedClose) && isOpenDeal ? "var(--bad-fg)" : undefined }}>
                  <EditableField value={deal.expectedClose || ""} display={shortDate(deal.expectedClose)} type="date" placeholder="Set date" onSave={(v) => save({ expectedClose: v || null })} />
                </b>
              </div>
              <div className="crm-keyfact">
                <span>Owner</span>
                <b style={{ fontSize: 15 }}>
                  <EditableField
                    value={deal.ownerId || (deal.owner ? `name:${deal.owner}` : "")}
                    display={
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Avatar name={deal.owner || "?"} size={22} /> {deal.owner}
                      </span>
                    }
                    type="select"
                    options={ownerOptions}
                    placeholder="Assign"
                    onSave={(v) => (String(v).startsWith("name:") ? save({ owner: v.slice(5), ownerId: null }) : save({ ownerId: v || null, ...(v ? {} : { owner: null }) }))}
                  />
                </b>
              </div>
              <div className="crm-keyfact">
                <span>In stage</span>
                <b style={{ fontSize: 15 }}>{deal.daysInStage} days</b>
              </div>
            </div>

            <Stepper stage={deal.stage} onPick={(stage) => onMove(deal, stage)} />
            {deal.stage === "lost" && (
              <div className="crm-closed-banner crm-closed-banner--lost">
                <XCircle size={16} /> Closed lost{deal.lostReason ? ` — ${deal.lostReason}` : ""}
                <Button size="sm" variant="secondary" onClick={() => onMove(deal, "qual")}>
                  Reopen
                </Button>
              </div>
            )}
            {deal.stage === "nurture" && (
              <div className="crm-closed-banner crm-closed-banner--nurture">
                Parked in nurture — revisit later.
                <Button size="sm" variant="secondary" onClick={() => onMove(deal, "qual")}>
                  Reopen
                </Button>
              </div>
            )}
          </div>

          <div className="crm-drawer__body">
            <div className="crm-drawer__cols">
              <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
                <Tabs
                  value={tab}
                  onChange={setTab}
                  options={[
                    { value: "timeline", label: "Timeline", count: timeline.length },
                    { value: "tasks", label: "Tasks", count: (deal.tasks || []).filter((t) => !t.done).length },
                    { value: "documents", label: "Documents" },
                  ]}
                />

                {tab === "timeline" && (
                  <Card>
                    <div className="crm-composer">
                      <TextArea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add a note — call summary, site visit remarks, client preferences…"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitNote();
                        }}
                        data-testid="note-input"
                      />
                      <div className="crm-composer__foot">
                        <span className="crm-hint-inline">Ctrl + Enter to save</span>
                        <Button variant="primary" size="sm" onClick={submitNote} loading={addingNote} disabled={!note.trim()} data-testid="note-save">
                          Add note
                        </Button>
                      </div>
                    </div>
                    <div className="crm-timeline" style={{ marginTop: 8 }} data-testid="timeline">
                      {timeline.length === 0 && <p className="inos-hint" style={{ padding: "12px 0" }}>No activity yet.</p>}
                      {timeline.map((item) => {
                        const Icon = KIND_ICON[item.kind] || PencilLine;
                        return (
                          <div className="crm-tl-item" key={`${item.kind}-${item.id}`}>
                            <span className={`crm-tl-icon crm-tl-icon--${item.kind}`}>
                              <Icon aria-hidden />
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div className={`crm-tl-text ${item.isNote ? "crm-tl-note" : ""}`}>{item.text}</div>
                              <div className="crm-tl-meta">
                                <span title={dateTime(item.createdAt)}>
                                  {item.author ? `${item.author} · ` : ""}
                                  {relative(item.createdAt)}
                                </span>
                                {item.isNote && (
                                  <button type="button" onClick={() => deleteNote({ id: dealId, noteId: item.id })}>
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {tab === "tasks" && (
                  <Card>
                    {(deal.tasks || []).length === 0 && <p className="inos-hint">No tasks yet — add the next step so this deal keeps moving.</p>}
                    {(deal.tasks || []).map((t) => (
                      <div key={t.id} className={`crm-task ${t.done ? "is-done" : ""}`}>
                        <input type="checkbox" checked={t.done} onChange={() => updateTask({ id: dealId, taskId: t.id, done: !t.done })} aria-label={`Mark ${t.title} done`} />
                        <span className="crm-task__title">{t.title}</span>
                        {t.dueDate && <span className={`crm-task__due ${!t.done && isPast(t.dueDate) ? "is-late" : ""}`}>{shortDate(t.dueDate)}</span>}
                        <Button variant="ghost" size="sm" icon={Trash2} aria-label="Delete task" onClick={() => deleteTask({ id: dealId, taskId: t.id })} />
                      </div>
                    ))}
                    <form
                      className="crm-task-add"
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitTask();
                      }}
                    >
                      <TextInput value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Call back with revised quote" aria-label="Task" />
                      <TextInput type="date" value={taskDue} min={todayISO()} onChange={(e) => setTaskDue(e.target.value)} aria-label="Due date" />
                      <Button type="submit" variant="secondary" size="sm" loading={addingTask} disabled={!taskTitle.trim()}>
                        Add
                      </Button>
                    </form>
                  </Card>
                )}

                {tab === "documents" && (
                  <Card>
                    {!deal.projectId ? (
                      <div style={{ display: "grid", gap: 12 }}>
                        <p className="inos-hint" style={{ margin: 0 }}>
                          CRM documents (brief, site recce, plan of action, scope of work, proposal) are kept against a project. Create one from this deal, or link an existing project.
                        </p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Button variant="primary" size="sm" icon={FolderPlus} onClick={createProjectFromDeal} loading={creatingProject}>
                            Create project from deal
                          </Button>
                          <SelectInput className="crm-select-sm" value={linkProject} onChange={(e) => setLinkProject(e.target.value)} placeholder="Link existing project…" style={{ maxWidth: 260 }}>
                            {(Array.isArray(projects) ? projects : projects?.data || []).map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </SelectInput>
                          <Button size="sm" disabled={!linkProject} onClick={() => save({ projectId: linkProject }, "Project linked")}>
                            Link
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="crm-docs">
                        <div className="crm-hint-inline" style={{ marginBottom: 2 }}>
                          Project: <b style={{ color: "var(--text)" }}>{deal.project?.name || "—"}</b>
                          <button type="button" className="crm-linkbtn" style={{ marginLeft: 8 }} onClick={() => navigate(`/projects/${deal.projectId}`)}>
                            Open
                          </button>
                        </div>
                        {DOCS.map((d) => {
                          const info = deal.documents?.[d.key] || { count: 0 };
                          const Icon = d.icon;
                          const pq = `?project_id=${deal.projectId}`;
                          const viewUrl = info.latest ? d.view(info.latest.id) : null;
                          return (
                            <div className="crm-doc" key={d.key}>
                              <span className={`inos-icon-tile inos-icon-tile--sm ${info.count ? "inos-icon-tile--ok" : ""}`}>
                                <Icon aria-hidden />
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <div className="crm-doc__name">{d.label}</div>
                                <div className="crm-doc__sub">
                                  {info.count ? `${info.count} on file · latest ${shortDate(info.latest?.createdAt)}${info.latest?.status ? ` · ${info.latest.status}` : ""}` : "Not started"}
                                </div>
                              </div>
                              <div className="crm-doc__actions">
                                {info.count > 0 && (viewUrl || d.key === "proposal") && (
                                  <Button size="sm" variant="ghost" onClick={() => navigate(viewUrl || `${d.create}${pq}`)}>
                                    Open
                                  </Button>
                                )}
                                {!(d.key === "proposal" && info.count > 0) && (
                                  <Button size="sm" variant={info.count ? "secondary" : "soft"} onClick={() => navigate(`${d.create}${pq}`)}>
                                    {info.count ? "New" : "Create"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                )}
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <Card title="Contact" headerPlain>
                  <div className="crm-facts">
                    <Fact label="Client">
                      <EditableField value={deal.clientId || ""} display={deal.clientName} type="select" options={clientOptions} placeholder="Link client" onSave={(v) => save({ clientId: v || null })} />
                    </Fact>
                    <Fact label="Contact">
                      <EditableField value={deal.contact || ""} onSave={(v) => save({ contact: v })} />
                    </Fact>
                    <Fact label={<Phone size={13} />}>
                      <EditableField value={deal.phone || ""} placeholder="Add phone" onSave={(v) => save({ phone: v })} />
                    </Fact>
                    <Fact label={<Mail size={13} />}>
                      <EditableField value={deal.email || ""} placeholder="Add email" onSave={(v) => save({ email: v })} />
                    </Fact>
                    <Fact label={<MapPin size={13} />}>
                      <EditableField value={deal.location || ""} placeholder="Add location" onSave={(v) => save({ location: v })} />
                    </Fact>
                  </div>
                  {deal.whatsapp && (
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <Button size="sm" variant="secondary" icon={Phone} onClick={() => window.open(`tel:${deal.phone}`)}>
                        Call
                      </Button>
                      <Button size="sm" variant="secondary" icon={MessageCircle} onClick={() => window.open(`https://wa.me/${String(deal.whatsapp).replace(/\D/g, "")}`, "_blank")}>
                        WhatsApp
                      </Button>
                    </div>
                  )}
                </Card>
                <Card title="Deal details" headerPlain>
                  <div className="crm-facts">
                    <Fact label="Stage">
                      <EditableField value={deal.stage} display={s.label} type="select" options={STAGES.map((x) => ({ value: x.id, label: x.label }))} onSave={(v) => v && onMove(deal, v)} />
                    </Fact>
                    <Fact label="Source">
                      <EditableField value={deal.source || ""} type="select" options={(meta?.sources || []).map((x) => ({ value: x, label: x }))} onSave={(v) => save({ source: v })} />
                    </Fact>
                    <Fact label="Type">
                      <EditableField value={deal.type || ""} type="select" options={["Residential", "Commercial", "Institutional"].map((x) => ({ value: x, label: x }))} onSave={(v) => save({ type: v })} />
                    </Fact>
                    <Fact label="Size">
                      <EditableField value={deal.size || ""} placeholder="e.g. 4,500 sq ft" onSave={(v) => save({ size: v })} />
                    </Fact>
                    <Fact label="Tag">
                      <EditableField value={deal.tag || ""} type="select" options={["Hot", "Warm", "Cold"].map((x) => ({ value: x, label: x }))} onSave={(v) => save({ tag: v || null })} />
                    </Fact>
                    <Fact label="Proposal">
                      <span style={{ fontWeight: 550 }}>{deal.proposal ? `${formatINR(Number(deal.proposal.amount) || deal.proposal.amount)}${deal.proposal.timeline ? ` · ${deal.proposal.timeline}` : ""}` : "—"}</span>
                    </Fact>
                    <Fact label="Created">
                      <span>{shortDate(deal.createdAt)}</span>
                    </Fact>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </>
      )}
    </Drawer>
  );
}
