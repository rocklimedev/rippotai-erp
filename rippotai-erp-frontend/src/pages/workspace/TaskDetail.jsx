// Task detail: /tasks/:id
import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Pencil, Trash2, CheckCircle2, RotateCcw, ListTodo } from "lucide-react";
import { Page, PageHeader, Card, Button, Pill, EmptyState, Avatar, ChoiceGroup } from "@/components/inos";
import { useGetWsTaskQuery, useUpdateWsTaskMutation, useDeleteWsTaskMutation, useGetWsActivityQuery } from "@/api/workspace/workspace.api";
import { TASK_STATUSES, priorityMeta, statusMeta, isOverdue } from "./taskMeta";
import { fmtDate, fmtDateTime, relTime, daysFromToday, Loading, Meta } from "./shared";

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: t, isLoading, isError } = useGetWsTaskQuery(id);
  const [updateTask, { isLoading: saving }] = useUpdateWsTaskMutation();
  const [deleteTask] = useDeleteWsTaskMutation();
  const [confirm, setConfirm] = useState(false);
  const { data: act } = useGetWsActivityQuery({ entity_type: "task", entity_id: id, limit: 20 });

  if (isLoading) return <Page><Card><Loading /></Card></Page>;
  if (isError || !t)
    return (
      <Page>
        <Card><EmptyState icon={ListTodo} title="Task not found" text="It may have been deleted." action={<Button onClick={() => navigate("/tasks")}>Back to tasks</Button>} /></Card>
      </Page>
    );

  const setStatus = async (status) => {
    try {
      await updateTask({ id, status }).unwrap();
      toast.success(`Marked as ${statusMeta(status).label.toLowerCase()}`);
    } catch (e) {
      toast.error(e?.data?.message || "Couldn't update");
    }
  };
  const remove = async () => {
    try {
      await deleteTask(id).unwrap();
      toast.success("Task deleted");
      navigate("/tasks");
    } catch (e) {
      toast.error(e?.data?.message || "Couldn't delete");
    }
  };
  const p = priorityMeta(t.priority);
  const s = statusMeta(t.status);
  const d = daysFromToday(t.due_date);
  const done = t.status === "completed";

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Tasks", to: "/tasks" }, { label: "Task" }]}
        title={t.title}
        subtitle={t.project?.name ? <>Part of <Link to={`/projects/${t.project.id}`} style={{ color: "var(--brand)", fontWeight: 600 }}>{t.project.name}</Link></> : "Not linked to a project"}
        actions={
          <>
            <Button icon={Pencil} onClick={() => navigate(`/tasks/${id}/edit`)} data-testid="edit-task">Edit</Button>
            {done ? (
              <Button icon={RotateCcw} onClick={() => setStatus("todo")} loading={saving}>Reopen</Button>
            ) : (
              <Button variant="primary" icon={CheckCircle2} onClick={() => setStatus("completed")} loading={saving} data-testid="complete-task">Mark done</Button>
            )}
          </>
        }
      />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)", gap: 20, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 20 }}>
          <Card title="Details">
            {t.description ? (
              <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6, color: "var(--text)" }}>{t.description}</p>
            ) : (
              <Meta>No details added. <Link to={`/tasks/${id}/edit`} style={{ color: "var(--brand)" }}>Add some</Link></Meta>
            )}
          </Card>
          <Card title="Move to">
            <ChoiceGroup name="Status" value={t.status} onChange={setStatus} options={TASK_STATUSES} />
          </Card>
          <Card title="History" subtitle="Changes recorded on this task">
            {(act?.rows || []).filter((r) => r.entity_id === t.id).length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {act.rows.filter((r) => r.entity_id === t.id).map((r) => (
                  <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Avatar name={r.user_name || r.user_email} size={26} />
                    <span style={{ flex: 1 }}><b style={{ fontWeight: 600 }}>{r.user_name || r.user_email}</b> — {String(r.action).replace(/_/g, " ")}</span>
                    <Meta>{relTime(r.created_at)}</Meta>
                  </div>
                ))}
              </div>
            ) : (
              <Meta>Created {fmtDateTime(t.created_at)}{t.creator?.name ? ` by ${t.creator.name}` : ""}. Last updated {relTime(t.updated_at)}.</Meta>
            )}
          </Card>
        </div>
        <Card title="Summary">
          <dl className="inos-kv">
            <dt>Status</dt><dd><Pill tone={s.tone}>{s.label}</Pill></dd>
            <dt>Priority</dt><dd><Pill tone={p.tone}>{p.label}</Pill></dd>
            <dt>Assignee</dt>
            <dd>{t.assignee ? <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><Avatar name={t.assignee.name} size={24} />{t.assignee.name}</span> : "Unassigned"}</dd>
            <dt>Due</dt>
            <dd>
              {t.due_date ? fmtDate(t.due_date) : "—"}{" "}
              {isOverdue(t) ? <Pill tone="bad" size="sm">{Math.abs(d)} d overdue</Pill> : !done && d === 0 ? <Pill tone="warn" size="sm">Today</Pill> : null}
            </dd>
            <dt>Start</dt><dd>{t.start_date ? fmtDate(t.start_date) : "—"}</dd>
            <dt>Estimate</dt><dd>{t.workload_estimate_hours ? `${t.workload_estimate_hours} h` : "—"}</dd>
            <dt>Created by</dt><dd>{t.creator?.name || "—"}</dd>
            <dt>Created</dt><dd>{fmtDate(t.created_at)}</dd>
          </dl>
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 16, paddingTop: 12 }}>
            {confirm ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Meta style={{ flex: 1 }}>Delete this task for everyone?</Meta>
                <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>Keep</Button>
                <Button size="sm" variant="danger" onClick={remove} data-testid="confirm-delete">Delete</Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirm(true)}>Delete task</Button>
            )}
          </div>
        </Card>
      </div>
    </Page>
  );
}
