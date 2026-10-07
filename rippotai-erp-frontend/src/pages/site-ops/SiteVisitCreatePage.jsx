import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetVisitAssignmentsQuery,
  useLogSiteVisitMutation,
} from "@/api/procuerment/site-ops.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSiteProjects, rowProjectName } from "./siteProjects";
export default function SiteVisitCreatePage() {
  const [params] = useSearchParams();
  const [assignmentId, setAssignmentId] = useState(
    params.get("assignment") || "",
  );
  const { nameOf } = useSiteProjects();
  const { data, isLoading, error } = useGetVisitAssignmentsQuery();
  const assignments = (Array.isArray(data) ? data : data?.data || []).filter(
    (a) => a.isActive && a.scheduledDate && !a.visitLogs?.length,
  );
  const allocation = assignments.find((a) => String(a.id) === assignmentId);
  const [visitorName, setVisitorName] = useState("");
  const [loggedBy, setLoggedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [actualVisitAt, setActualVisitAt] = useState("");
  const [log, { isLoading: saving }] = useLogSiteVisitMutation();
  const navigate = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    if (!allocation) return toast.error("Select a visit allocation");
    try {
      const result = await log({
        projectId: allocation.projectId,
        visitAssignmentId: allocation.id,
        visitorType: allocation.visitorType,
        visitorName: visitorName.trim(),
        scheduledDate: allocation.scheduledDate,
        actualVisitAt: actualVisitAt
          ? new Date(actualVisitAt).toISOString()
          : undefined,
        notes,
        loggedBy: loggedBy.trim(),
      }).unwrap();
      toast.success("Visit recorded");
      navigate(`/site-operations/site-visits/${result.id}`);
    } catch (e) {
      toast.error(e?.data?.message || "Unable to record visit");
    }
  };
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <h1 className="text-2xl font-semibold">Record site visit</h1>
      <p>
        Select the allocated event. The project, date and architect stage come
        from that allocation.
      </p>
      <Link className="underline" to="/site-operations/visit-assignments">
        Allocate a new visit
      </Link>
      {error && <p role="alert">Unable to load visit allocations.</p>}
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <Label htmlFor="visit-allocation">Allocated event</Label>
          <select
            id="visit-allocation"
            required
            disabled={isLoading}
            className="w-full rounded border p-2"
            value={assignmentId}
            onChange={(e) => {
              const a = assignments.find(
                (a) => String(a.id) === e.target.value,
              );
              setAssignmentId(e.target.value);
              setVisitorName(a?.externalPartyName || "");
            }}
          >
            <option value="">Select allocation</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {rowProjectName(a, nameOf)} · {a.scheduledDate} ·{" "}
                {a.stageName || a.purpose} ·{" "}
                {a.externalPartyName || a.team?.name}
              </option>
            ))}
          </select>
        </div>
        {allocation && (
          <div className="rounded border p-4">
            <p>{allocation.stageName || allocation.purpose}</p>
            <p className="mt-2 text-sm">{allocation.checksPurpose}</p>
            <p className="text-sm text-muted-foreground">
              {allocation.visitType}
            </p>
          </div>
        )}
        <div>
          <Label htmlFor="visit-name">Visitor who attended / will attend</Label>
          <Input
            id="visit-name"
            required
            maxLength={150}
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="visit-actual">
            Actual visit time (leave blank until attended)
          </Label>
          <Input
            id="visit-actual"
            type="datetime-local"
            value={actualVisitAt}
            onChange={(e) => setActualVisitAt(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="visit-notes">Findings / notes</Label>
          <Textarea
            id="visit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="visit-logged-by">Recorded by</Label>
          <Input
            id="visit-logged-by"
            required
            maxLength={150}
            value={loggedBy}
            onChange={(e) => setLoggedBy(e.target.value)}
          />
        </div>
        <Button disabled={saving || !allocation} type="submit">
          {saving ? "Saving…" : "Record visit"}
        </Button>
      </form>
    </div>
  );
}
