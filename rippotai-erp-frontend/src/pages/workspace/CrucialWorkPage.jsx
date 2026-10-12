import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Download, AlertTriangle } from "lucide-react";
import { Page, PageHeader, Card, Button, Field, TextInput, TextArea, SelectInput, Toolbar, Pill, EmptyState } from "@/components/inos";
import { useGetCrucialWorkQuery, useSaveCrucialCheckMutation, useExportCrucialWorkMutation, useDownloadCrucialTemplateMutation } from "@/api/workspace/workspace.api";
import { ProjectPicker, Loading, fmtDate } from "./shared";
import ZohoSyncControl from "./ZohoSyncControl";

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const registerStatus = (status) => status === "completed" ? "Closed" : status === "todo" ? "Open" : "In Progress";
const message = (e) => Array.isArray(e?.data?.message) ? e.data.message.join(", ") : e?.data?.message || "Couldn't complete this action";

function ChecklistRow({ task, check, cycle, cycleDate, onDirty }) {
  const [status, setStatus] = useState(check?.check_status || "not_checked");
  const [followUp, setFollowUp] = useState(check?.follow_up || "");
  const [save, { isLoading }] = useSaveCrucialCheckMutation();
  useEffect(() => { setStatus(check?.check_status || "not_checked"); setFollowUp(check?.follow_up || ""); }, [check]);
  useEffect(() => {
    onDirty(task.id, status !== (check?.check_status || "not_checked") || followUp !== (check?.follow_up || ""));
  }, [task.id, status, followUp, check, onDirty]);
  return <tr>
    <td>{task.crucial_ref}</td>
    <td><Link to={`/tasks/${task.id}`}>{task.title}</Link><div>{task.project?.name}</div></td>
    <td><SelectInput aria-label={`Check status for ${task.title}`} value={status} onChange={(e) => setStatus(e.target.value)}>
      <option value="not_checked">Not checked</option><option value="in_progress">In progress</option><option value="checked">Checked</option>
    </SelectInput></td>
    <td><TextArea aria-label={`Follow-up for ${task.title}`} rows={2} maxLength={4000} value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="Next action or recheck" /></td>
    <td>{check?.checker?.name || "—"}<Button size="sm" loading={isLoading} onClick={async () => {
      try { await save({ id: task.id, cycle, cycle_date: cycleDate, check_status: status, follow_up: followUp }).unwrap(); onDirty(task.id, false); toast.success("Checklist saved"); }
      catch (e) { toast.error(message(e)); }
    }}>Save check</Button></td>
  </tr>;
}

export default function CrucialWorkPage() {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState(null);
  const [cycle, setCycle] = useState("weekly");
  const [cycleDate, setCycleDate] = useState(today);
  const [dirtyRows, setDirtyRows] = useState({});
  const onDirty = useCallback((id, dirty) => setDirtyRows(rows => rows[id] === dirty ? rows : { ...rows, [id]: dirty }), []);
  const hasUnsavedChecks = Object.values(dirtyRows).some(Boolean);
  useEffect(() => { setDirtyRows({}); }, [projectId, cycle, cycleDate]);
  const query = { project_id: projectId, cycle, cycle_date: cycleDate };
  const { currentData: data, isLoading, isFetching, isError, refetch } = useGetCrucialWorkQuery(query, { skip: !cycleDate });
  const [exportWork, { isLoading: exporting }] = useExportCrucialWorkMutation();
  const [downloadTemplate, { isLoading: downloading }] = useDownloadCrucialTemplateMutation();
  const download = async (format) => {
    try { await exportWork({ ...query, format }).unwrap(); toast.success(`${format === "docx" ? "Word" : "PDF"} export downloaded`); }
    catch (e) { toast.error(message(e)); }
  };
  const tasks = data?.tasks || [];
  const checklist = data?.checklist || [];
  return <Page>
    <PageHeader crumbs={[{ label: "Tasks", to: "/tasks" }, { label: "Crucial Work" }]} title="Crucial Work"
      subtitle="The items that cannot be missed, tracked until closed."
      actions={<><ZohoSyncControl kind="tasks" /><Button variant="primary" icon={Plus} onClick={() => navigate(`/tasks/new?crucial=1${projectId ? `&project_id=${projectId}` : ""}`)}>New crucial task</Button></>} />
    <Toolbar>
      <Field label="Project"><ProjectPicker value={projectId} onChange={setProjectId} placeholder="All projects" /></Field>
      <Field label="Checklist cycle"><SelectInput value={cycle} onChange={(e) => setCycle(e.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly</option></SelectInput></Field>
      <Field label="Cycle start"><TextInput type="date" value={cycleDate} onChange={(e) => setCycleDate(e.target.value)} /></Field>
      <Button icon={Download} loading={exporting} disabled={!cycleDate || isFetching || isError || !tasks.length || hasUnsavedChecks} onClick={() => download("docx")}>Export Word</Button>
      <Button icon={Download} loading={exporting} disabled={!cycleDate || isFetching || isError || !tasks.length || hasUnsavedChecks} onClick={() => download("pdf")}>Export PDF</Button>
      <Button variant="ghost" loading={downloading} onClick={async () => {
        try { await downloadTemplate().unwrap(); } catch (e) { toast.error(message(e)); }
      }}>Reference template</Button>
    </Toolbar>
    <p>Exports include every marked task in {projectId ? "the selected project" : "all projects"}, including closed items. The checklist covers {cycleDate || "the selected date"}{cycle === "weekly" && data?.cycle_end ? ` through ${data.cycle_end}` : ""}, overdue items and tasks without a target date. Checks are saved separately for each cycle.</p>
    {hasUnsavedChecks && <p role="status">Save your checklist changes before exporting.</p>}
    {isLoading || (!data && isFetching) ? <Card><Loading /></Card> : isError ? <Card><EmptyState title="Couldn't load Crucial Work" action={<Button onClick={refetch}>Retry</Button>} /></Card> : <>
      <Card title="01   Master List — Running Register" subtitle={`${tasks.length} marked tasks · ${tasks.filter(t => t.status === "completed").length} closed`}>
        {!tasks.length ? <EmptyState icon={AlertTriangle} title="No crucial tasks yet" text="Mark existing tasks as Crucial Work in Edit task, or create a crucial task." /> :
          <div className="inos-table-wrap"><table className="inos-table"><thead><tr><th>Ref</th><th>Item</th><th>Why it’s crucial</th><th>Owner</th><th>Target date</th><th>Status</th></tr></thead><tbody>
            {tasks.map(t => <tr key={t.id}><td>{t.crucial_ref}</td><td><Link to={`/tasks/${t.id}`}>{t.title}</Link><div>{t.project?.name}</div></td><td style={{ whiteSpace: "pre-wrap", maxWidth: 300 }}>{t.crucial_reason || "—"}</td><td>{t.assignee?.name || "Unassigned"}</td><td>{t.due_date ? fmtDate(t.due_date) : "—"}</td><td><Pill tone={t.status === "completed" ? "ok" : "warn"}>{registerStatus(t.status)}</Pill></td></tr>)}
          </tbody></table></div>}
      </Card>
      <Card title="02   Daily / Weekly Checklist" subtitle="Filled fresh each cycle. Save checks before exporting.">
        {!checklist.length ? <p>No items need attention in this cycle.</p> : <div className="inos-table-wrap"><table className="inos-table"><thead><tr><th>Ref from Part 1</th><th>Item</th><th>Checked today?</th><th>Follow-up needed</th><th>Checked by</th></tr></thead><tbody>
          {checklist.map(t => <ChecklistRow key={`${cycle}:${cycleDate}:${t.id}`} task={t} check={data.checks.find(c => c.task_id === t.id)} cycle={cycle} cycleDate={cycleDate} onDirty={onDirty} />)}
        </tbody></table></div>}
      </Card>
    </>}
  </Page>;
}
