import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetAllocatedVisitQuery,
  useUpdateAllocatedVisitMutation,
  useCheckInSiteVisitMutation,
} from "@/api/procuerment/site-ops.api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
export default function SiteVisitDetailPage() {
  const { id } = useParams();
  const { data: visit, isLoading, error } = useGetAllocatedVisitQuery(id);
  const [update, { isLoading: saving }] = useUpdateAllocatedVisitMutation();
  const [checkIn, { isLoading: checkingIn }] = useCheckInSiteVisitMutation();
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("SCHEDULED");
  useEffect(() => {
    if (visit) {
      setNotes(visit.notes || "");
      setStatus(visit.status);
    }
  }, [visit]);
  if (isLoading) return <p className="p-6">Loading visit…</p>;
  if (error || !visit)
    return (
      <p role="alert" className="p-6">
        Unable to load visit.
      </p>
    );
  const allocation = visit.visitAssignment;
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <Link className="underline" to="/site-operations/site-visits">
        Back to visits
      </Link>
      <h1 className="text-2xl font-semibold">
        {allocation?.stageName || visit.purpose || "Site visit"}
      </h1>
      <p>
        {visit.project?.name} · {visit.visitorName} · {visit.scheduledDate}
      </p>
      <div className="rounded border p-4">
        <p>{allocation?.checksPurpose}</p>
        <p className="text-sm text-muted-foreground">{allocation?.visitType}</p>
        <p>
          Actual visit:{" "}
          {visit.actualVisitAt
            ? new Date(visit.actualVisitAt).toLocaleString()
            : "Awaiting attendance"}
        </p>
      </div>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await update({ id, notes, status }).unwrap();
            toast.success("Visit updated");
          } catch (e) {
            toast.error(e?.data?.message || "Unable to update visit");
          }
        }}
      >
        <label className="block">
          Status
          <select
            className="ml-3 rounded border p-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {["SCHEDULED", "COMPLETED", "MISSED", "CANCELLED"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block">
          Findings / notes
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <Button type="submit" disabled={saving}>
          Save findings
        </Button>
      </form>
      {visit.status === "SCHEDULED" && (
        <Button
          disabled={checkingIn}
          onClick={async () => {
            try {
              await checkIn(id).unwrap();
              toast.success("Visit checked in");
            } catch (e) {
              toast.error(e?.data?.message || "Unable to check in");
            }
          }}
        >
          Check in
        </Button>
      )}
    </div>
  );
}
