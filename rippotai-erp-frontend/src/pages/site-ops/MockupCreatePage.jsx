import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProposeMockupMutation } from "../../api/site-ops/site-ops.api";
import { PageHeader } from "@/components/site-ops/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function MockupCreatePage() {
  const navigate = useNavigate();
  const [propose, { isLoading }] = useProposeMockupMutation();
  const [form, setForm] = useState({
    projectId: "",
    stepId: "",
    name: "",
    finishType: "",
    location: "",
    description: "",
    proposedBy: "",
  });

  const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const projectId = Number(form.projectId);
    if (!projectId || !form.name || !form.proposedBy) {
      toast.error("Project, name and proposed by are required");
      return;
    }
    try {
      const result = await propose({
        projectId,
        stepId: form.stepId ? Number(form.stepId) : undefined,
        name: form.name,
        finishType: form.finishType || undefined,
        location: form.location || undefined,
        description: form.description || undefined,
        proposedBy: form.proposedBy,
      }).unwrap();
      toast.success("Mockup proposed");
      navigate(`/site-ops/mockups/${result.id}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to propose mockup");
    }
  };

  return (
    <div className="bg-page min-h-full p-6">
      <PageHeader
        title="Propose Mockup"
        description="Submit a finish or material mockup for review."
        backTo="/site-ops/mockups"
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
            <Label>Step ID</Label>
            <Input
              type="number"
              className="bc-input"
              value={form.stepId}
              onChange={(e) => set("stepId", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Name *</Label>
            <Input
              className="bc-input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Finish type</Label>
            <Input
              className="bc-input"
              value={form.finishType}
              onChange={(e) => set("finishType", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              className="bc-input"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Proposed by *</Label>
            <Input
              className="bc-input"
              value={form.proposedBy}
              onChange={(e) => set("proposedBy", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            className="bc-input"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="bc-btn-primary" disabled={isLoading}>
            {isLoading ? "Submitting…" : "Propose"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="bc-btn-secondary"
            onClick={() => navigate("/site-ops/mockups")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
