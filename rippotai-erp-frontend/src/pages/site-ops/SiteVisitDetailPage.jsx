import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  useGetSiteVisitByIdQuery,
  useUpdateSiteVisitMutation,
  useDeleteSiteVisitMutation,
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
import { ARCHITECT_VISIT_STATUS_OPTIONS } from "../../hooks/site-ops.types";
import { toast } from "sonner";
import { Pencil, Trash2, Unlock } from "lucide-react";

export default function SiteVisitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: visit,
    isLoading,
    error,
  } = useGetSiteVisitByIdQuery(id, {
    skip: !id,
  });
  const [updateVisit, { isLoading: saving }] = useUpdateSiteVisitMutation();
  const [deleteVisit, { isLoading: deleting }] = useDeleteSiteVisitMutation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const startEdit = () => {
    if (!visit) return;
    setForm({
      status: visit.status,
      scheduled_date: visit.scheduled_date?.slice(0, 10) || "",
      visited_date: visit.visited_date?.slice(0, 10) || "",
      findings: visit.findings || "",
      remarks: visit.remarks || "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateVisit({
        id,
        status: form.status,
        scheduled_date: form.scheduled_date || undefined,
        visited_date: form.visited_date || undefined,
        findings: form.findings || undefined,
        remarks: form.remarks || undefined,
      }).unwrap();
      toast.success("Visit updated");
      setEditing(false);
    } catch (e) {
      toast.error(e?.data?.message || "Update failed");
    }
  };

  const handleReleaseHold = async () => {
    if (!id) return;
    try {
      await updateVisit({ id, hold_released: true }).unwrap();
      toast.success("Hold point released");
    } catch (e) {
      toast.error(e?.data?.message || "Failed to release hold");
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("Delete this visit?")) return;
    try {
      await deleteVisit(id).unwrap();
      toast.success("Visit deleted");
      navigate("/site-ops/visits");
    } catch (e) {
      toast.error(e?.data?.message || "Delete failed");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-page min-h-full p-6 text-[var(--muted)]">Loading…</div>
    );
  }

  if (error || !visit) {
    return (
      <div className="bg-page min-h-full p-6">
        <PageHeader title="Visit not found" backTo="/site-ops/visits" />
      </div>
    );
  }

  return (
    <div className="bg-page min-h-full p-6">
      <PageHeader
        title={visit.stage?.name || "Site Visit"}
        description={`Project: ${visit.project?.name || visit.project_id}`}
        backTo="/site-ops/visits"
        actions={
          <>
            {!editing && (
              <Button
                variant="outline"
                size="sm"
                className="bc-btn-secondary"
                onClick={startEdit}
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
            )}
            {visit.stage?.visit_type === "Hold Point" &&
              !visit.hold_released && (
                <Button
                  size="sm"
                  className="bc-btn-primary"
                  onClick={handleReleaseHold}
                  disabled={saving}
                >
                  <Unlock className="h-4 w-4 mr-1.5" />
                  Release hold
                </Button>
              )}
            <Button
              variant="outline"
              size="sm"
              className="text-red-700 border-red-200 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          </>
        }
      />

      <div className="bc-card p-6 max-w-3xl space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <StatusBadge status={visit.status} />
          {visit.stage?.visit_type && (
            <StatusBadge status={visit.stage.visit_type} />
          )}
          {visit.hold_released && (
            <span className="bc-badge bg-emerald-50 text-emerald-800 border border-emerald-200">
              Hold released
            </span>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger className="bc-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ARCHITECT_VISIT_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Scheduled date</Label>
                <Input
                  type="date"
                  className="bc-input"
                  value={form.scheduled_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, scheduled_date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Visited date</Label>
                <Input
                  type="date"
                  className="bc-input"
                  value={form.visited_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, visited_date: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Findings</Label>
              <Textarea
                className="bc-input min-h-[80px]"
                value={form.findings}
                onChange={(e) =>
                  setForm((p) => ({ ...p, findings: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                className="bc-input"
                value={form.remarks}
                onChange={(e) =>
                  setForm((p) => ({ ...p, remarks: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="bc-btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                variant="outline"
                className="bc-btn-secondary"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-[var(--muted)] mb-0.5">Scheduled</dt>
              <dd className="text-[var(--ink-green)] font-medium">
                {visit.scheduled_date
                  ? new Date(visit.scheduled_date).toLocaleDateString()
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)] mb-0.5">Visited</dt>
              <dd className="text-[var(--ink-green)] font-medium">
                {visit.visited_date
                  ? new Date(visit.visited_date).toLocaleDateString()
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)] mb-0.5">Architect</dt>
              <dd className="text-[var(--ink-green)]">
                {visit.architect_id || "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[var(--muted)] mb-0.5">Findings</dt>
              <dd className="text-[var(--ink-green)] whitespace-pre-wrap">
                {visit.findings || "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[var(--muted)] mb-0.5">Remarks</dt>
              <dd className="text-[var(--ink-green)] whitespace-pre-wrap">
                {visit.remarks || "—"}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
