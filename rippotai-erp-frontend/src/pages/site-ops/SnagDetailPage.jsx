import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  useGetSnagByIdQuery,
  useUpdateSnagMutation,
  useDeleteSnagMutation,
} from "../../api/site-ops/site-ops.api";
import { PageHeader } from "@/components/site-ops/PageHeader";
import { StatusBadge } from "@/components/site-ops/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

const STATUS_OPTIONS = ["Open", "In Progress", "Rectified", "Closed"];

export default function SnagDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: snag,
    isLoading,
    error,
  } = useGetSnagByIdQuery(id, {
    skip: !id,
  });
  const [updateSnag, { isLoading: saving }] = useUpdateSnagMutation();
  const [deleteSnag, { isLoading: deleting }] = useDeleteSnagMutation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const startEdit = () => {
    if (!snag) return;
    setForm({
      status: snag.status,
      floor: snag.floor || "",
      room: snag.room || "",
      category: snag.category || "",
      observation: snag.observation,
      scope: snag.scope || "",
      remarks: snag.remarks || "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateSnag({
        id,
        status: form.status,
        floor: form.floor || undefined,
        room: form.room || undefined,
        category: form.category || undefined,
        observation: form.observation,
        scope: form.scope || undefined,
        remarks: form.remarks || undefined,
      }).unwrap();
      toast.success("Snag updated");
      setEditing(false);
    } catch (e) {
      toast.error(e?.data?.message || "Update failed");
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("Delete this snag?")) return;
    try {
      await deleteSnag(id).unwrap();
      toast.success("Snag deleted");
      navigate("/site-ops/snags");
    } catch (e) {
      toast.error(e?.data?.message || "Delete failed");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-page min-h-full p-6 text-[var(--muted)]">Loading…</div>
    );
  }

  if (error || !snag) {
    return (
      <div className="bg-page min-h-full p-6">
        <PageHeader title="Snag not found" backTo="/site-ops/snags" />
      </div>
    );
  }

  return (
    <div className="bg-page min-h-full p-6">
      <PageHeader
        title="Snag detail"
        description={`Project: ${snag.project?.name || snag.project_id}`}
        backTo="/site-ops/snags"
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
        <StatusBadge status={snag.status} />

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
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  className="bc-input"
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Floor</Label>
                <Input
                  className="bc-input"
                  value={form.floor}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, floor: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Room</Label>
                <Input
                  className="bc-input"
                  value={form.room}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, room: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observation</Label>
              <Textarea
                className="bc-input min-h-[100px]"
                value={form.observation}
                onChange={(e) =>
                  setForm((p) => ({ ...p, observation: e.target.value }))
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
              <dt className="text-[var(--muted)] mb-0.5">Location</dt>
              <dd className="text-[var(--ink-green)] font-medium">
                {[snag.floor, snag.room].filter(Boolean).join(" · ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)] mb-0.5">Category</dt>
              <dd className="text-[var(--ink-green)]">
                {snag.category || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)] mb-0.5">Scope</dt>
              <dd className="text-[var(--ink-green)]">{snag.scope || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[var(--muted)] mb-0.5">Observation</dt>
              <dd className="text-[var(--ink-green)] whitespace-pre-wrap">
                {snag.observation}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[var(--muted)] mb-0.5">Remarks</dt>
              <dd className="text-[var(--ink-green)] whitespace-pre-wrap">
                {snag.remarks || "—"}
              </dd>
            </div>
            {snag.photos && snag.photos.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-[var(--muted)] mb-2">Photos</dt>
                <dd className="flex flex-wrap gap-2">
                  {snag.photos.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-[var(--ink-green)] underline"
                    >
                      Photo {i + 1}
                    </a>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </div>
  );
}
