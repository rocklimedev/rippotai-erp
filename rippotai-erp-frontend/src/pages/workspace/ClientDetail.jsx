// Client detail: /clients/:id — contact card, projects, payments, quotations, documents, notes.
import React, { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Pencil, Plus, Phone, Mail, MapPin, Building2, Wallet, FileText, StickyNote, Receipt, Trash2, Users } from "lucide-react";
import { Page, PageHeader, Card, Button, Tabs, Pill, StatusPill, EmptyState, Avatar, Stats, StatTile, Progress } from "@/components/inos";
import { useGetWsClientOverviewQuery } from "@/api/workspace/workspace.api";
import { useDeleteClientMutation } from "@/api/projects/client.api";
import { NoteCard, NoteEditor } from "./NotesPage";
import { fmtDate, inr, relTime, daysFromToday, Loading, Meta } from "./shared";

const Table = ({ head, children }) => (
  <div className="inos-table-wrap">
    <table className="inos-table">
      <thead><tr>{head.map((h, i) => <th key={i} className={h.num ? "num" : undefined}>{h.label ?? h}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetWsClientOverviewQuery(id);
  const [del] = useDeleteClientMutation();
  const [tab, setTab] = useState("projects");
  const [note, setNote] = useState(null);

  const stats = useMemo(() => {
    if (!data) return {};
    const payable = data.milestones.reduce((n, m) => n + Number(m.amount || 0), 0);
    const paid = data.milestones.reduce((n, m) => n + Number(m.paid_amount || 0), 0);
    const overdue = data.milestones.filter((m) => m.due_date && daysFromToday(m.due_date) < 0 && !/paid/i.test(m.status) && Number(m.paid_amount || 0) < Number(m.amount || 0));
    return {
      active: data.projects.filter((p) => p.status === "active").length,
      value: data.projects.reduce((n, p) => n + Number(p.approved_value || 0), 0),
      payable, paid, overdue: overdue.length,
    };
  }, [data]);

  if (isLoading) return <Page><Card><Loading /></Card></Page>;
  if (isError || !data)
    return <Page><Card><EmptyState icon={Users} title="Client not found" text="It may have been removed." action={<Button onClick={() => navigate("/clients")}>Back to clients</Button>} /></Card></Page>;

  const c = data.client;
  const remove = async () => {
    if (data.projects.length) return toast.error("This client has projects. Archive or reassign them first.");
    if (!window.confirm(`Remove ${c.name}? You can restore them from the Admin Console.`)) return;
    try { await del(id).unwrap(); toast.success("Client removed"); navigate("/clients"); } catch (e) { toast.error(e?.data?.message || "Couldn't remove"); }
  };

  const tabs = [
    { value: "projects", label: "Projects", icon: Building2, count: data.projects.length },
    { value: "payments", label: "Payments", icon: Wallet, count: data.milestones.length },
    { value: "quotations", label: "Quotations", icon: Receipt, count: data.quotations.length },
    { value: "documents", label: "Documents", icon: FileText, count: data.documents.length },
    { value: "notes", label: "Notes", icon: StickyNote, count: data.notes.length },
  ];

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Clients", to: "/clients" }, { label: c.name }]}
        title={c.name}
        subtitle={c.contact_person && c.contact_person !== c.name ? `Contact: ${c.contact_person}` : c.address || "Client"}
        actions={
          <>
            <Button icon={Pencil} onClick={() => navigate(`/clients/${id}/edit`)} data-testid="edit-client">Edit</Button>
            <Button variant="primary" icon={Plus} onClick={() => navigate(`/projects/new?client_id=${id}`)}>New project</Button>
          </>
        }
      />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) minmax(0, 3fr)", gap: 20, alignItems: "start" }}>
        <Card title="Contact">
          <div style={{ display: "grid", gap: 12, fontSize: "var(--fs-body)" }}>
            <span style={{ display: "flex", gap: 10 }}><Phone size={16} color="var(--text-3)" />{c.phone ? <a href={`tel:${c.phone}`} style={{ color: "var(--text)" }}>{c.phone}</a> : <Meta>No phone</Meta>}</span>
            <span style={{ display: "flex", gap: 10, minWidth: 0 }}><Mail size={16} color="var(--text-3)" style={{ flexShrink: 0 }} />{c.email ? <a href={`mailto:${c.email}`} style={{ color: "var(--brand)", overflowWrap: "anywhere" }}>{c.email}</a> : <Meta>No email</Meta>}</span>
            <span style={{ display: "flex", gap: 10 }}><MapPin size={16} color="var(--text-3)" style={{ flexShrink: 0 }} />{c.address || <Meta>No address</Meta>}</span>
          </div>
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 16, paddingTop: 12, display: "grid", gap: 6 }}>
            <Meta>Client since {fmtDate(c.created_at)}</Meta>
            <Button size="sm" variant="ghost" icon={Trash2} onClick={remove}>Remove client</Button>
          </div>
        </Card>
        <div style={{ display: "grid", gap: 20, minWidth: 0 }}>
          <Stats>
            <StatTile label="Active projects" value={`${stats.active} / ${data.projects.length}`} icon={<Building2 size={16} />} tone="ok" />
            <StatTile label="Approved value" value={inr(stats.value)} icon={<Receipt size={16} />} tone="lilac" />
            <StatTile label="Received" value={inr(stats.paid)} meta={stats.payable ? `of ${inr(stats.payable)} scheduled` : "No schedule yet"} icon={<Wallet size={16} />} tone="info" />
            <StatTile label="Overdue payments" value={stats.overdue} icon={<Wallet size={16} />} tone={stats.overdue ? "bad" : "ok"} onClick={() => setTab("payments")} />
          </Stats>
          <Tabs value={tab} onChange={setTab} options={tabs} />

          {tab === "projects" && (
            <Card flush>
              {!data.projects.length ? (
                <EmptyState icon={Building2} title="No projects yet" text="Start the first project for this client." action={<Button variant="primary" icon={Plus} onClick={() => navigate(`/projects/new?client_id=${id}`)}>New project</Button>} />
              ) : (
                <Table head={["Project", "Phase", "Progress", { label: "Approved", num: true }, "Completion", "Status"]}>
                  {data.projects.map((p) => (
                    <tr key={p.id} className="is-clickable" onClick={() => navigate(`/projects/${p.id}`)}>
                      <td><div style={{ fontWeight: 600 }}>{p.name}</div><Meta>{p.site_location}</Meta></td>
                      <td>{p.current_phase ? String(p.current_phase).replace(/^\d+_/, "").replace(/_/g, " ").toLowerCase().replace(/^\w/, (m) => m.toUpperCase()) : "—"}</td>
                      <td style={{ minWidth: 120 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 80 }}><Progress value={p.progress_pct} /></div><Meta>{Math.round(p.progress_pct || 0)}%</Meta></div></td>
                      <td className="num tabular">{inr(p.approved_value)}</td>
                      <td>{p.expected_completion_date ? fmtDate(p.expected_completion_date) : "—"}</td>
                      <td><StatusPill status={p.status} size="sm" /></td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
          )}

          {tab === "payments" && (
            <Card flush title="Payment milestones" subtitle={`${data.payment_schedules.length} payment schedule${data.payment_schedules.length === 1 ? "" : "s"}`}>
              {!data.milestones.length ? (
                <EmptyState icon={Wallet} title="No payment schedule yet" text="Create a payment schedule in Ledger to track what this client owes." action={<Button onClick={() => navigate("/ledger/forms/payment-schedule")}>Create schedule</Button>} />
              ) : (
                <Table head={["Milestone", "Project", "Due", { label: "Amount", num: true }, { label: "Received", num: true }, "Status"]}>
                  {data.milestones.map((m) => {
                    const late = m.due_date && daysFromToday(m.due_date) < 0 && Number(m.paid_amount || 0) < Number(m.amount || 0);
                    return (
                      <tr key={m.id} className="is-clickable" onClick={() => navigate(`/ledger/payment-schedule/${m.payment_schedule_id}`)}>
                        <td><div style={{ fontWeight: 600 }}>{m.title}</div>{m.percentage != null && <Meta>{Number(m.percentage)}% of contract</Meta>}</td>
                        <td>{m.project_name}</td>
                        <td>{m.due_date ? fmtDate(m.due_date) : "—"} {late && <Pill tone="bad" size="sm">Overdue</Pill>}</td>
                        <td className="num tabular">{inr(m.amount)}</td>
                        <td className="num tabular">{Number(m.paid_amount) ? inr(m.paid_amount) : "—"}</td>
                        <td><StatusPill status={m.status} size="sm" /></td>
                      </tr>
                    );
                  })}
                </Table>
              )}
            </Card>
          )}

          {tab === "quotations" && (
            <Card flush>
              {!data.quotations.length ? (
                <EmptyState icon={Receipt} title="No quotations for this client's projects" />
              ) : (
                <Table head={["Quotation", "Project", "Date", "Valid until", { label: "Total", num: true }, "Status"]}>
                  {data.quotations.map((q) => (
                    <tr key={q.id} className="is-clickable" onClick={() => navigate(`/procurement/estimates/${q.id}`)}>
                      <td style={{ fontWeight: 600 }}>{q.quotation_number}</td>
                      <td>{q.project_name}</td>
                      <td>{fmtDate(q.quotation_date)}</td>
                      <td>{q.expiry_date ? fmtDate(q.expiry_date) : "—"}</td>
                      <td className="num tabular">{inr(q.total_amount)}</td>
                      <td><StatusPill status={q.status} size="sm" /></td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
          )}

          {tab === "documents" && (
            <Card flush actions={<Link to="/projects/documents/all" style={{ color: "var(--brand)", fontWeight: 600, fontSize: "var(--fs-sm)" }}>All documents</Link>} title="Latest documents">
              {!data.documents.length ? (
                <EmptyState icon={FileText} title="No documents yet" text="Briefs, drawings, BOQs and agreements for this client's projects appear here." />
              ) : (
                <Table head={["Document", "Project", "Type", "Updated", "Status"]}>
                  {data.documents.map((d) => (
                    <tr key={d.id} className="is-clickable" onClick={() => (d.url ? window.open(d.url, "_blank", "noopener") : navigate(`/projects/${d.project_id}`))}>
                      <td><div style={{ fontWeight: 600 }}>{d.title || d.doc_no || "Untitled"}</div>{d.doc_no && <Meta>{d.doc_no}</Meta>}</td>
                      <td>{d.project_name}</td>
                      <td>{(d.doc_type || d.category || "—").toString().replace(/_/g, " ")}</td>
                      <td><Meta>{relTime(d.updated_at)}</Meta></td>
                      <td>{d.status ? <StatusPill status={d.status} size="sm" /> : "—"}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
          )}

          {tab === "notes" && (
            <Card title="Notes" actions={<Button size="sm" icon={Plus} onClick={() => setNote({})} data-testid="client-add-note">Add note</Button>}>
              {!data.notes.length ? (
                <EmptyState icon={StickyNote} title="No notes yet" text="Keep call notes and decisions with the client." />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                  {data.notes.map((n) => <NoteCard key={n.id} note={{ ...n, is_shared: true }} onOpen={setNote} />)}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
      {note && <NoteEditor note={note.id ? note : null} defaults={{ client_id: id, category: "client" }} onClose={() => setNote(null)} />}
    </Page>
  );
}
