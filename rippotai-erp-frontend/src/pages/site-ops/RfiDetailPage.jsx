import { useParams } from "react-router-dom";
import { useState } from "react";
import {
  useGetRfiByIdQuery,
  useRespondToRfiMutation,
  useCloseRfiMutation,
  useRerouteRfiMutation,
} from "../../api/site-ops/site-ops.api";
import { PageHeader } from "@/components/site-ops/PageHeader";
import { StatusBadge } from "@/components/site-ops/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function RfiDetailPage() {
  const { id } = useParams();
  const rfiId = Number(id);
  const {
    data: rfi,
    isLoading,
    error,
  } = useGetRfiByIdQuery(rfiId, {
    skip: !rfiId,
  });
  const [respond, { isLoading: responding }] = useRespondToRfiMutation();
  const [closeRfi, { isLoading: closing }] = useCloseRfiMutation();
  const [reroute, { isLoading: rerouting }] = useRerouteRfiMutation();

  const [response, setResponse] = useState("");
  const [respondedBy, setRespondedBy] = useState("");
  const [newTeamId, setNewTeamId] = useState("");

  const handleRespond = async () => {
    if (!response.trim() || !respondedBy.trim()) {
      toast.error("Response and name are required");
      return;
    }
    try {
      await respond({ id: rfiId, response, respondedBy }).unwrap();
      toast.success("Response submitted");
      setResponse("");
    } catch (e) {
      toast.error(e?.data?.message || "Failed to respond");
    }
  };

  const handleClose = async () => {
    try {
      await closeRfi(rfiId).unwrap();
      toast.success("RFI closed");
    } catch (e) {
      toast.error(e?.data?.message || "Failed to close");
    }
  };

  const handleReroute = async () => {
    const teamId = Number(newTeamId);
    if (!teamId) {
      toast.error("Enter a valid team ID");
      return;
    }
    try {
      await reroute({ id: rfiId, routedToTeamId: teamId }).unwrap();
      toast.success("RFI rerouted");
      setNewTeamId("");
    } catch (e) {
      toast.error(e?.data?.message || "Failed to reroute");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-page min-h-full p-6 text-[var(--muted)]">Loading…</div>
    );
  }

  if (error || !rfi) {
    return (
      <div className="bg-page min-h-full p-6">
        <PageHeader title="RFI not found" backTo="/site-ops/rfis" />
      </div>
    );
  }

  return (
    <div className="bg-page min-h-full p-6">
      <PageHeader
        title={rfi.subject}
        description={`Project #${rfi.projectId}`}
        backTo="/site-ops/rfis"
        actions={
          rfi.status !== "CLOSED" ? (
            <Button
              className="bc-btn-primary"
              onClick={handleClose}
              disabled={closing}
            >
              Close RFI
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-2 max-w-5xl">
        <div className="bc-card p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={rfi.status} />
            <StatusBadge status={rfi.priority} />
          </div>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-[var(--muted)]">Raised by</dt>
              <dd className="font-medium text-[var(--ink-green)]">
                {rfi.raisedBy}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Routed to team</dt>
              <dd className="font-medium text-[var(--ink-green)]">
                #{rfi.routedToTeamId}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Query</dt>
              <dd className="text-[var(--ink-green)] whitespace-pre-wrap mt-1">
                {rfi.query}
              </dd>
            </div>
            {rfi.response && (
              <div>
                <dt className="text-[var(--muted)]">Response</dt>
                <dd className="text-[var(--ink-green)] whitespace-pre-wrap mt-1">
                  {rfi.response}
                  {rfi.respondedBy && (
                    <span className="block text-xs text-[var(--muted)] mt-1">
                      — {rfi.respondedBy}
                    </span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {rfi.status === "OPEN" && (
          <div className="space-y-4">
            <div className="bc-card p-6 space-y-4">
              <h3 className="font-semibold text-[var(--ink-green)]">Respond</h3>
              <div className="space-y-2">
                <Label>Your name</Label>
                <Input
                  className="bc-input"
                  value={respondedBy}
                  onChange={(e) => setRespondedBy(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Response</Label>
                <Textarea
                  className="bc-input min-h-[100px]"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                />
              </div>
              <Button
                className="bc-btn-primary"
                onClick={handleRespond}
                disabled={responding}
              >
                {responding ? "Submitting…" : "Submit response"}
              </Button>
            </div>

            <div className="bc-card p-6 space-y-4">
              <h3 className="font-semibold text-[var(--ink-green)]">Reroute</h3>
              <div className="space-y-2">
                <Label>New team ID</Label>
                <Input
                  type="number"
                  className="bc-input"
                  value={newTeamId}
                  onChange={(e) => setNewTeamId(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="bc-btn-secondary"
                onClick={handleReroute}
                disabled={rerouting}
              >
                Reroute
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
