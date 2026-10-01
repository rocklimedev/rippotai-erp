import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreateSiteVisitMutation,
  useGetVisitStagesQuery,
} from "../../api/site-ops/site-ops.api";
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
import { ARCHITECT_VISIT_STATUS_OPTIONS } from "../../hooks/site-ops.types";
import { toast } from "sonner";

export default function SiteVisitCreatePage() {
  const navigate = useNavigate();
  const [createVisit, { isLoading }] = useCreateSiteVisitMutation();
  const { data: stages = [] } = useGetVisitStagesQuery();
  const { data: projectsData } = useGetProjectsQuery({});
  const projects = Array.isArray(projectsData)
    ? projectsData
    : projectsData?.data || projectsData?.items || [];

  const [form, setForm] = useState({
    project_id: "",
    stage_id: "",
    status: "Not Scheduled",
    scheduled_date: "",
    visited_date: "",
    architect_id: "",
    findings: "",
    remarks: "",
  });

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project_id || !form.stage_id) {
      toast.error("Project and stage are required");
      return;
    }
    try {
      const body = {
        project_id: form.project_id,
        stage_id: form.stage_id,
        status: form.status,
        scheduled_date: form.scheduled_date || undefined,
        visited_date: form.visited_date || undefined,
        architect_id: form.architect_id || undefined,
        findings: form.findings || undefined,
        remarks: form.remarks || undefined,
      };
      const result = await createVisit(body).unwrap();
      toast.success("Site visit created");
      navigate(`/site-ops/visits/${result.id}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create visit");
    }
  };

  return (
    <div className="bg-page min-h-full p-6">
      <PageHeader
        title="New Site Visit"
        description="Schedule an architect site visit for a project stage."
        backTo="/site-ops/visits"
      />

      <form onSubmit={handleSubmit} className="bc-card p-6 max-w-2xl space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 bc-form-2col">
          <div className="space-y-2">
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
            <Label className="bc-form-label">Visit stage *</Label>
            <Select
              value={form.stage_id}
              onValueChange={(v) => set("stage_id", v)}
            >
              <SelectTrigger className="bc-input">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(stages) ? stages : []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.visit_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="bc-form-label">Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
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
            <Label className="bc-form-label">Architect ID (optional)</Label>
            <Input
              className="bc-input"
              value={form.architect_id}
              onChange={(e) => set("architect_id", e.target.value)}
              placeholder="UUID"
            />
          </div>

          <div className="space-y-2">
            <Label className="bc-form-label">Scheduled date</Label>
            <Input
              type="date"
              className="bc-input"
              value={form.scheduled_date}
              onChange={(e) => set("scheduled_date", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="bc-form-label">Visited date</Label>
            <Input
              type="date"
              className="bc-input"
              value={form.visited_date}
              onChange={(e) => set("visited_date", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="bc-form-label">Findings</Label>
          <Textarea
            className="bc-input min-h-[80px]"
            value={form.findings}
            onChange={(e) => set("findings", e.target.value)}
            placeholder="Site findings…"
          />
        </div>

        <div className="space-y-2">
          <Label className="bc-form-label">Remarks</Label>
          <Textarea
            className="bc-input min-h-[60px]"
            value={form.remarks}
            onChange={(e) => set("remarks", e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="bc-btn-primary" disabled={isLoading}>
            {isLoading ? "Creating…" : "Create visit"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="bc-btn-secondary"
            onClick={() => navigate("/site-ops/visits")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
