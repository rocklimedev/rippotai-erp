import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateSnagMutation } from "../../api/site-ops/site-ops.api";
import { useGetProjectsQuery } from "../../api/projects/project.api";
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

const STATUS_OPTIONS = ["Open", "In Progress", "Rectified", "Closed"];

export default function SnagCreatePage() {
  const navigate = useNavigate();
  const [createSnag, { isLoading }] = useCreateSnagMutation();
  const { data: projectsData } = useGetProjectsQuery({});
  const projects = Array.isArray(projectsData)
    ? projectsData
    : projectsData?.data || projectsData?.items || [];

  const [form, setForm] = useState({
    project_id: "",
    floor: "",
    room: "",
    category: "",
    observation: "",
    scope: "",
    status: "Open",
    remarks: "",
    visit_id: "",
  });

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project_id || !form.observation.trim()) {
      toast.error("Project and observation are required");
      return;
    }
    try {
      const result = await createSnag({
        project_id: form.project_id,
        observation: form.observation.trim(),
        floor: form.floor || undefined,
        room: form.room || undefined,
        category: form.category || undefined,
        scope: form.scope || undefined,
        status: form.status,
        remarks: form.remarks || undefined,
        visit_id: form.visit_id || undefined,
      }).unwrap();
      toast.success("Snag created");
      navigate(`/site-ops/snags/${result.id}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create snag");
    }
  };

  return (
    <div className="bg-page min-h-full p-6">
      <PageHeader
        title="New Snag"
        description="Log a site defect or observation for rectification."
        backTo="/site-ops/snags"
      />

      <form onSubmit={handleSubmit} className="bc-card p-6 max-w-2xl space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label className="bc-form-label">Project *</Label>
            <Select
              value={form.project_id}
              onValueChange={(v) => set("project_id", v)}
            >
              <SelectTrigger className="bc-input">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name || p.code || p.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="bc-form-label">Floor</Label>
            <Input
              className="bc-input"
              value={form.floor}
              onChange={(e) => set("floor", e.target.value)}
              placeholder="e.g. Ground, L1"
            />
          </div>
          <div className="space-y-2">
            <Label className="bc-form-label">Room / Area</Label>
            <Input
              className="bc-input"
              value={form.room}
              onChange={(e) => set("room", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="bc-form-label">Category</Label>
            <Input
              className="bc-input"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="e.g. Finishes, MEP"
            />
          </div>
          <div className="space-y-2">
            <Label className="bc-form-label">Scope</Label>
            <Input
              className="bc-input"
              value={form.scope}
              onChange={(e) => set("scope", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="bc-form-label">Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
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
            <Label className="bc-form-label">Linked visit ID</Label>
            <Input
              className="bc-input"
              value={form.visit_id}
              onChange={(e) => set("visit_id", e.target.value)}
              placeholder="Optional UUID"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="bc-form-label">Observation *</Label>
          <Textarea
            className="bc-input min-h-[100px]"
            value={form.observation}
            onChange={(e) => set("observation", e.target.value)}
            placeholder="Describe the defect or observation…"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="bc-form-label">Remarks</Label>
          <Textarea
            className="bc-input"
            value={form.remarks}
            onChange={(e) => set("remarks", e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="bc-btn-primary" disabled={isLoading}>
            {isLoading ? "Creating…" : "Create snag"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="bc-btn-secondary"
            onClick={() => navigate("/site-ops/snags")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
