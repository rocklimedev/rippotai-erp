// Create / edit a native task. /tasks/new (?project_id=&due=) and /tasks/:id/edit
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Page, PageHeader, FormSection, Field, TextInput, TextArea, ChoiceGroup, FormActions, Card, Button } from "@/components/inos";
import { useAuth } from "@/context/AuthContext";
import { useGetWsTaskQuery, useCreateWsTaskMutation, useUpdateWsTaskMutation } from "@/api/workspace/workspace.api";
import { TASK_STATUSES, TASK_PRIORITIES } from "./taskMeta";
import { ProjectPicker, UserPicker, ymd, Loading } from "./shared";

const blank = { title: "", description: "", project_id: null, assigned_to: null, priority: "medium", status: "todo", start_date: "", due_date: "", workload_estimate_hours: "" };

export default function TaskForm() {
  const { id } = useParams();
  const editing = !!id;
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: task, isLoading } = useGetWsTaskQuery(id, { skip: !editing });
  const [createTask, { isLoading: creating }] = useCreateWsTaskMutation();
  const [updateTask, { isLoading: updating }] = useUpdateWsTaskMutation();

  const [f, setF] = useState(() => ({
    ...blank,
    project_id: sp.get("project_id") || null,
    assigned_to: user?.id || null,
    due_date: sp.get("due") || ymd(new Date(Date.now() + 2 * 86400000)),
  }));
  const [errors, setErrors] = useState({});
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v?.target ? v.target.value : v }));

  useEffect(() => {
    if (task)
      setF({
        title: task.title || "",
        description: task.description || "",
        project_id: task.project_id,
        assigned_to: task.assigned_to,
        priority: task.priority,
        status: task.status,
        start_date: task.start_date ? ymd(task.start_date) : "",
        due_date: task.due_date ? ymd(task.due_date) : "",
        workload_estimate_hours: task.workload_estimate_hours || "",
      });
  }, [task]);

  const validate = () => {
    const e = {};
    if (!f.title.trim()) e.title = "Give the task a short title.";
    else if (f.title.length > 255) e.title = "Keep the title under 255 characters.";
    if (f.start_date && f.due_date && f.start_date > f.due_date) e.due_date = "Due date can't be before the start date.";
    if (f.workload_estimate_hours !== "" && (isNaN(f.workload_estimate_hours) || Number(f.workload_estimate_hours) < 0)) e.workload_estimate_hours = "Enter hours as a positive number.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev?.preventDefault();
    if (!validate()) return;
    const body = {
      title: f.title.trim(),
      description: f.description.trim() || null,
      project_id: f.project_id || null,
      assigned_to: f.assigned_to || null,
      priority: f.priority,
      status: f.status,
      start_date: f.start_date ? new Date(`${f.start_date}T09:00:00`).toISOString() : null,
      due_date: f.due_date ? new Date(`${f.due_date}T18:00:00`).toISOString() : null,
      workload_estimate_hours: f.workload_estimate_hours === "" ? 0 : Number(f.workload_estimate_hours),
    };
    try {
      const saved = editing ? await updateTask({ id, ...body }).unwrap() : await createTask(body).unwrap();
      toast.success(editing ? "Task updated" : "Task created");
      navigate(`/tasks/${saved?.id || id}`);
    } catch (e) {
      const m = e?.data?.message;
      toast.error(Array.isArray(m) ? m.join(", ") : m || "Couldn't save the task");
    }
  };

  if (editing && isLoading) return <Page width="form"><Card><Loading /></Card></Page>;

  return (
    <Page width="form">
      <PageHeader
        crumbs={[{ label: "Tasks", to: "/tasks" }, ...(editing ? [{ label: task?.title || "Task", to: `/tasks/${id}` }] : []), { label: editing ? "Edit" : "New task" }]}
        title={editing ? "Edit task" : "New task"}
        subtitle="Short title, one owner and a due date is all a task needs."
      />
      <form className="inos-form" onSubmit={submit} noValidate>
        <FormSection step={1} title="What needs doing" description="Write it as an action, e.g. “Share revised kitchen layout with client”.">
          <Field label="Title" required error={errors.title} full htmlFor="task-title">
            <TextInput id="task-title" autoFocus value={f.title} onChange={set("title")} onBlur={() => errors.title && validate()} invalid={!!errors.title} placeholder="e.g. Confirm tile samples with vendor" data-testid="task-title" />
          </Field>
          <Field label="Details" optional full hint="Context, links or acceptance notes.">
            <TextArea rows={4} value={f.description} onChange={set("description")} placeholder="Anything the assignee should know" data-testid="task-description" />
          </Field>
          <Field label="Project" optional hint="Link it to a project so it shows on the project calendar.">
            <ProjectPicker value={f.project_id} onChange={set("project_id")} data-testid="task-project" />
          </Field>
          <Field label="Assignee" hint="Defaults to you.">
            <UserPicker value={f.assigned_to} onChange={set("assigned_to")} data-testid="task-assignee" />
          </Field>
        </FormSection>

        <FormSection step={2} title="Priority and status" columns={1}>
          <Field label="Priority">
            <ChoiceGroup name="Priority" value={f.priority} onChange={set("priority")} options={TASK_PRIORITIES} />
          </Field>
          <Field label="Status">
            <ChoiceGroup name="Status" value={f.status} onChange={set("status")} options={TASK_STATUSES} />
          </Field>
        </FormSection>

        <FormSection step={3} title="Schedule" description="Due dates put the task on the calendar." columns={3}>
          <Field label="Start" optional>
            <TextInput type="date" value={f.start_date} onChange={set("start_date")} />
          </Field>
          <Field label="Due" error={errors.due_date}>
            <TextInput type="date" value={f.due_date} onChange={set("due_date")} invalid={!!errors.due_date} data-testid="task-due" />
          </Field>
          <Field label="Estimate (hours)" optional error={errors.workload_estimate_hours}>
            <TextInput type="number" min="0" step="1" value={f.workload_estimate_hours} onChange={set("workload_estimate_hours")} placeholder="e.g. 4" invalid={!!errors.workload_estimate_hours} />
          </Field>
        </FormSection>

        <FormActions
          note={editing ? "Changes are logged in Activity." : "The assignee is notified when you save."}
          onCancel={() => navigate(editing ? `/tasks/${id}` : "/tasks")}
          submitLabel={editing ? "Save changes" : "Create task"}
          submitting={creating || updating}
        />
      </form>
    </Page>
  );
}
