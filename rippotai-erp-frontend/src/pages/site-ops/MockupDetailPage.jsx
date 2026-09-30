import { useParams } from "react-router-dom";
import { useState } from "react";
import {
  useGetMockupByIdQuery,
  useReviewMockupMutation,
} from "../../api/site-ops/site-ops.api";
import { PageHeader } from "@/components/site-ops/PageHeader";
import { StatusBadge } from "@/components/site-ops/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const REVIEW_STATUSES = ["UNDER_REVIEW", "APPROVED", "REJECTED"];

export default function MockupDetailPage() {
  const { id } = useParams();
  const mockupId = Number(id);
  const {
    data: mockup,
    isLoading,
    error,
  } = useGetMockupByIdQuery(mockupId, {
    skip: !mockupId,
  });
  const [review, { isLoading: reviewing }] = useReviewMockupMutation();
  const [status, setStatus] = useState("UNDER_REVIEW");
  const [reviewedBy, setReviewedBy] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const handleReview = async () => {
    if (!reviewedBy.trim()) {
      toast.error("Reviewer name is required");
      return;
    }
    try {
      await review({
        id: mockupId,
        status,
        reviewedBy,
        reviewNotes: reviewNotes || undefined,
      }).unwrap();
      toast.success("Review submitted");
    } catch (e) {
      toast.error(e?.data?.message || "Review failed");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-page min-h-full p-6 text-[var(--muted)]">Loading…</div>
    );
  }

  if (error || !mockup) {
    return (
      <div className="bg-page min-h-full p-6">
        <PageHeader title="Mockup not found" backTo="/site-ops/mockups" />
      </div>
    );
  }

  const canReview =
    mockup.status === "PROPOSED" || mockup.status === "UNDER_REVIEW";

  return (
    <div className="bg-page min-h-full p-6">
      <PageHeader
        title={mockup.name}
        description={`Project #${mockup.projectId}`}
        backTo="/site-ops/mockups"
      />

      <div className="grid gap-6 lg:grid-cols-2 max-w-5xl">
        <div className="bc-card p-6 space-y-4">
          <StatusBadge status={mockup.status} />
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-[var(--muted)]">Finish type</dt>
              <dd className="font-medium text-[var(--ink-green)]">
                {mockup.finishType || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Location</dt>
              <dd className="font-medium text-[var(--ink-green)]">
                {mockup.location || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Proposed by</dt>
              <dd className="font-medium text-[var(--ink-green)]">
                {mockup.proposedBy}
              </dd>
            </div>
            {mockup.description && (
              <div>
                <dt className="text-[var(--muted)]">Description</dt>
                <dd className="text-[var(--ink-green)] whitespace-pre-wrap mt-1">
                  {mockup.description}
                </dd>
              </div>
            )}
            {mockup.reviewNotes && (
              <div>
                <dt className="text-[var(--muted)]">Review notes</dt>
                <dd className="text-[var(--ink-green)] whitespace-pre-wrap mt-1">
                  {mockup.reviewNotes}
                  {mockup.reviewedBy && (
                    <span className="block text-xs text-[var(--muted)] mt-1">
                      — {mockup.reviewedBy}
                    </span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {canReview && (
          <div className="bc-card p-6 space-y-4">
            <h3 className="font-semibold text-[var(--ink-green)]">Review</h3>
            <div className="space-y-2">
              <Label>Decision</Label>
              <Select value={status} onValueChange={(v) => setStatus(v)}>
                <SelectTrigger className="bc-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reviewed by *</Label>
              <Input
                className="bc-input"
                value={reviewedBy}
                onChange={(e) => setReviewedBy(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                className="bc-input"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>
            <Button
              className="bc-btn-primary"
              onClick={handleReview}
              disabled={reviewing}
            >
              {reviewing ? "Submitting…" : "Submit review"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
