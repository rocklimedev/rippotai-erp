import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  useSiteProjects,
  useProjectParam,
  ProjectPicker,
  rowProjectName,
  useTradeTeams,
} from "./siteProjects";
import {
  useGetVisitAssignmentsQuery,
  useCreateVisitAssignmentMutation,
  useUpdateVisitAssignmentMutation,
  useDeactivateVisitAssignmentMutation,
} from "@/api/procuerment/site-ops.api";
import { useGetVisitStagesQuery } from "@/api/site-ops/site-ops.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
const initial = () => ({
  projectId: "",
  visitorType: "ARCHITECT",
  stageId: "",
  scheduledDate: "",
  teamId: "",
  externalPartyName: "",
  purpose: "",
});
const types = [
  "ARCHITECT",
  "SUPERVISOR",
  "VENDOR",
  "CONTRACTOR",
  "CLIENT",
  "OTHER",
];
const message = (e) =>
  Array.isArray(e?.data?.message)
    ? e.data.message.join(", ")
    : e?.data?.message || "Unable to save allocation";
export default function VisitAssignmentsPage() {
  const [projectId, setProjectId] = useProjectParam();
  const { projects, nameOf } = useSiteProjects();
  const teams = useTradeTeams();
  const { data, isLoading, error } = useGetVisitAssignmentsQuery({ projectId });
  const { data: stageData, isLoading: loadingStages } =
    useGetVisitStagesQuery();
  const stages = Array.isArray(stageData) ? stageData : stageData?.data || [];
  const [create, { isLoading: creating }] = useCreateVisitAssignmentMutation();
  const [update, { isLoading: updating }] = useUpdateVisitAssignmentMutation();
  const [deactivate] = useDeactivateVisitAssignmentMutation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initial);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const assignments = Array.isArray(data) ? data : data?.data || [];
  const rows = assignments.filter(
    (a) =>
      (status === "all" || Boolean(a.isActive) === (status === "active")) &&
      [
        rowProjectName(a, nameOf),
        a.stageName,
        a.purpose,
        a.externalPartyName,
        a.team?.name,
        a.visitorType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const selected = stages.find((s) => s.id === form.stageId);
  const change = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const start = (a) => {
    setEditing(a || null);
    setForm(
      a
        ? {
            ...initial(),
            ...a,
            teamId: a.teamId ? String(a.teamId) : "",
            externalPartyName: a.externalPartyName || "",
            purpose: a.purpose || "",
          }
        : { ...initial(), projectId: projectId || "" },
    );
    setOpen(true);
  };
  const save = async (e) => {
    e.preventDefault();
    const body = {
      projectId: form.projectId,
      visitorType: form.visitorType,
      scheduledDate: form.scheduledDate,
      stageId: form.visitorType === "ARCHITECT" ? form.stageId : undefined,
      teamId: form.teamId ? Number(form.teamId) : null,
      externalPartyName: form.externalPartyName.trim() || null,
      purpose:
        form.visitorType === "ARCHITECT" ? undefined : form.purpose.trim(),
    };
    try {
      if (editing) await update({ id: editing.id, ...body }).unwrap();
      else await create(body).unwrap();
      setOpen(false);
      toast.success(editing ? "Visit allocation updated" : "Visit allocated");
    } catch (e) {
      toast.error(message(e));
    }
  };
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Visit Assignments</h1>
          <p className="text-sm text-muted-foreground">
            Allocate a dated site visit. Architect stages and checks follow the
            site visit schedule.
          </p>
        </div>
        <Button onClick={() => start()}>Allocate visit</Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <ProjectPicker
          projects={projects}
          value={projectId}
          onChange={setProjectId}
        />
        <Input
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search allocations"
        />
        <select
          aria-label="Allocation status"
          className="rounded border p-2"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive / legacy</option>
          <option value="all">All</option>
        </select>
      </div>
      {error ? (
        <p role="alert">Unable to load allocations. Please try again.</p>
      ) : isLoading ? (
        <p>Loading allocations…</p>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                {[
                  "Project",
                  "Visitor",
                  "Date",
                  "Stage / Purpose",
                  "Visit type",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th className="p-3" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr className="border-t" key={a.id}>
                  <td className="p-3">{rowProjectName(a, nameOf)}</td>
                  <td className="p-3">
                    {a.externalPartyName ||
                      a.team?.name ||
                      `Team ${a.teamId || "—"}`}
                    <div className="text-xs text-muted-foreground">
                      {a.visitorType}
                    </div>
                  </td>
                  <td className="p-3">
                    {a.scheduledDate || "Legacy recurrence"}
                  </td>
                  <td className="max-w-md p-3">
                    {a.stageName || a.purpose || "Requires event allocation"}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.checksPurpose}
                    </p>
                  </td>
                  <td className="p-3">{a.visitType || "—"}</td>
                  <td className="p-3">
                    {a.visitLogs?.[0]?.status ||
                      (a.isActive ? "Allocated" : "Inactive")}
                  </td>
                  <td className="space-x-2 whitespace-nowrap p-3">
                    {a.isActive && a.visitLogs?.[0]?.status !== "COMPLETED" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!!a.visitLogs?.length}
                          onClick={() => start(a)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await deactivate(a.id).unwrap();
                              toast.success("Allocation cancelled");
                            } catch (e) {
                              toast.error(message(e));
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {a.visitLogs?.length ? (
                      <Link
                        className="underline"
                        to={`/site-operations/site-visits/${a.visitLogs[0].id}`}
                      >
                        View visit
                      </Link>
                    ) : a.isActive && a.scheduledDate ? (
                      <Link
                        className="underline"
                        to={`/site-operations/site-visits/new?assignment=${a.id}`}
                      >
                        Record visit
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={7} className="p-6 text-center">
                    No visit allocations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit visit allocation" : "Allocate visit"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Project, visitor type and stage are locked. Logged events cannot be edited."
                : "Choose the stage the architect is coming to inspect, then allocate the visitor and date."}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={save}>
            <div>
              <Label htmlFor="allocation-project">Project</Label>
              <select
                id="allocation-project"
                required
                disabled={!!editing}
                className="w-full rounded border p-2"
                value={form.projectId}
                onChange={(e) => change("projectId", e.target.value)}
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {nameOf(p.id)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="allocation-type">Visitor type</Label>
              <select
                id="allocation-type"
                disabled={!!editing}
                className="w-full rounded border p-2"
                value={form.visitorType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    visitorType: e.target.value,
                    stageId: "",
                    purpose: "",
                  }))
                }
              >
                {types.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            {form.visitorType === "ARCHITECT" ? (
              <div>
                <Label htmlFor="allocation-stage">Visit stage</Label>
                <select
                  id="allocation-stage"
                  required
                  disabled={!!editing || loadingStages}
                  className="w-full rounded border p-2"
                  value={form.stageId || ""}
                  onChange={(e) => change("stageId", e.target.value)}
                >
                  <option value="">Select purpose / stage</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.visit_no}. {s.stage}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm">
                  {editing?.checksPurpose || selected?.checks_purpose}
                </p>
                <p className="text-sm text-muted-foreground">
                  {editing?.visitType || selected?.visit_type}
                </p>
                {selected?.remarks && (
                  <p className="text-sm text-muted-foreground">
                    {selected.remarks}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <Label htmlFor="allocation-purpose">Purpose</Label>
                <Input
                  id="allocation-purpose"
                  required
                  maxLength={250}
                  value={form.purpose}
                  onChange={(e) => change("purpose", e.target.value)}
                />
              </div>
            )}
            <div>
              <Label htmlFor="allocation-date">Scheduled date</Label>
              <Input
                id="allocation-date"
                type="date"
                required
                value={form.scheduledDate || ""}
                onChange={(e) => change("scheduledDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="allocation-team">Allocated team</Label>
              <select
                id="allocation-team"
                className="w-full rounded border p-2"
                value={form.teamId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    teamId: e.target.value,
                    externalPartyName: "",
                  }))
                }
              >
                <option value="">Named visitor instead</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            {!form.teamId && (
              <div>
                <Label htmlFor="allocation-visitor">
                  Allocated visitor name
                </Label>
                <Input
                  id="allocation-visitor"
                  required
                  maxLength={150}
                  value={form.externalPartyName}
                  onChange={(e) => change("externalPartyName", e.target.value)}
                />
              </div>
            )}
            <Button
              type="submit"
              disabled={creating || updating || loadingStages}
            >
              {creating || updating ? "Saving…" : "Save allocation"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
