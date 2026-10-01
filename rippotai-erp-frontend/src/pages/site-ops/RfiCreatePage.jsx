import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRaiseRfiMutation } from "../../api/site-ops/site-ops.api";
import { PageHeader } from "@/components/site-ops/PageHeader";
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

const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];

export default function RfiCreatePage() {
  const navigate = useNavigate();
  const [raiseRfi, { isLoading }] = useRaiseRfiMutation();
  const [form, setForm] = useState({
    projectId: "",
    stepId: "",
    subject: "",
    query: "",
    raisedBy: "",
    priority: "NORMAL",
    routedToTeamId: "",
  });

  const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const projectId = Number(form.projectId);
    const routedToTeamId = Number(form.routedToTeamId);
    if (
      !projectId ||
      !form.subject ||
      !form.query ||
      !form.raisedBy ||
      !routedToTeamId
    ) {
      toast.error("Fill all required fields");
      return;
    }
    try {
      const result = await raiseRfi({
        projectId,
        stepId: form.stepId ? Number(form.stepId) : undefined,
        subject: form.subject,
        query: form.query,
        raisedBy: form.raisedBy,
        priority: form.priority,
        routedToTeamId,
      }).unwrap();
      toast.success("RFI raised");
      navigate(`/site-ops/rfis/${result.id}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to raise RFI");
    }
  };

  return (
    <div className="bg-page min-h-full p-6">
      <PageHeader
        title="Raise RFI"
        description="Submit a request for information to a team."
        backTo="/site-ops/rfis"
      />

      <form onSubmit={handleSubmit} className="bc-card p-6 max-w-2xl space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Project ID *</Label>
            <Input
              type="number"
              className="bc-input"
              value={form.projectId}
              onChange={(e) => set("projectId", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Route to team ID *</Label>
            <Input
              type="number"
              className="bc-input"
              value={form.routedToTeamId}
              onChange={(e) => set("routedToTeamId", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Step ID (optional)</Label>
            <Input
              type="number"
              className="bc-input"
              value={form.stepId}
              onChange={(e) => set("stepId", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={form.priority}
              onValueChange={(v) => set("priority", v)}
            >
              <SelectTrigger className="bc-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Subject *</Label>
            <Input
              className="bc-input"
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              maxLength={200}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Raised by *</Label>
            <Input
              className="bc-input"
              value={form.raisedBy}
              onChange={(e) => set("raisedBy", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Query *</Label>
          <Textarea
            className="bc-input min-h-[120px]"
            value={form.query}
            onChange={(e) => set("query", e.target.value)}
            required
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="bc-btn-primary" disabled={isLoading}>
            {isLoading ? "Submitting…" : "Raise RFI"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="bc-btn-secondary"
            onClick={() => navigate("/site-ops/rfis")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
