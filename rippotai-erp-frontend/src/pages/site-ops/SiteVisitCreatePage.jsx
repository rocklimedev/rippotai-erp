import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  useCreateSiteVisitMutation,
  useGetVisitStagesQuery,
} from "../../api/site-ops/site-ops.api";

import { useGetProjectsQuery } from "../../api/projects/project.api";
import { useGetUsersByRoleNameQuery } from "../../api/users/user.api";

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

  const { data: stages = [], isLoading: stagesLoading } =
    useGetVisitStagesQuery();
  const { data: projectsData } = useGetProjectsQuery({});
  const { data: architectsData, isLoading: architectsLoading } =
    useGetUsersByRoleNameQuery("SENIOR_ARCHITECT");

  const projects = Array.isArray(projectsData)
    ? projectsData
    : projectsData?.data || projectsData?.items || [];

  const architects = Array.isArray(architectsData)
    ? architectsData
    : architectsData?.data || architectsData?.items || [];

  // -------------------------------------------------------
  // Sort stages by visit_no so the table matches the Excel
  // -------------------------------------------------------
  const sortedStages = useMemo(() => {
    const list = Array.isArray(stages) ? [...stages] : [];
    return list.sort((a, b) => (a.visit_no || 0) - (b.visit_no || 0));
  }, [stages]);

  // -------------------------------------------------------
  // Form state
  // -------------------------------------------------------
  const [projectId, setProjectId] = useState("");
  const [architectId, setArchitectId] = useState("");

  // Keyed by stage.id → row data
  const [rows, setRows] = useState({});

  const getRow = (stageId) =>
    rows[stageId] || {
      status: "Not Scheduled",
      scheduled_date: "",
      visited_date: "",
      findings: "",
      remarks: "",
    };

  const updateRow = (stageId, key, value) => {
    setRows((prev) => ({
      ...prev,
      [stageId]: {
        ...getRow(stageId),
        [key]: value,
      },
    }));
  };

  // -------------------------------------------------------
  // Submit – create one visit per stage that has data
  // (unique constraint: project_id + stage_id)
  // -------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!projectId) {
      toast.error("Please select a project");
      return;
    }

    // Only create rows that the user actually touched
    const toCreate = sortedStages.filter((stage) => {
      const r = getRow(stage.id);
      return (
        r.findings.trim() ||
        r.remarks.trim() ||
        r.scheduled_date ||
        r.visited_date ||
        r.status !== "Not Scheduled"
      );
    });

    if (toCreate.length === 0) {
      toast.error(
        "Fill at least one stage (findings, date or status) before saving",
      );
      return;
    }

    try {
      let created = 0;
      let skipped = 0;

      for (const stage of toCreate) {
        const r = getRow(stage.id);
        try {
          await createVisit({
            project_id: projectId,
            stage_id: stage.id,
            status: r.status,
            scheduled_date: r.scheduled_date || undefined,
            visited_date: r.visited_date || undefined,
            architect_id: architectId || undefined,
            findings: r.findings || undefined,
            remarks: r.remarks || undefined,
          }).unwrap();
          created++;
        } catch (err) {
          // Most likely unique constraint (visit already exists for this project+stage)
          skipped++;
          console.warn(`Skipped stage ${stage.visit_no}:`, err);
        }
      }

      if (created > 0) {
        toast.success(
          `${created} site visit(s) created` +
            (skipped ? ` (${skipped} already existed)` : ""),
        );
        navigate("/site-ops/visits");
      } else {
        toast.error(
          "No new visits created (they may already exist for this project)",
        );
      }
    } catch (err) {
      toast.error(
        err?.data?.message || err?.error || "Failed to create visits",
      );
    }
  };

  // -------------------------------------------------------
  // Helper for visit-type badge colour
  // -------------------------------------------------------
  const visitTypeBadge = (type) => {
    if (!type) return null;
    const t = type.toLowerCase();
    if (t.includes("hold")) return "bg-amber-100 text-amber-800";
    if (t.includes("critical")) return "bg-red-100 text-red-800";
    if (t.includes("mandatory")) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-700";
  };

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------
  return (
    <div className="bg-page min-h-full p-6">
      <PageHeader
        title="Architect Visit Schedule"
        description="Fill findings for each stage – just like the Excel sheet."
        backTo="/site-ops/visits"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========== Top bar: Project + Architect ========== */}
        <div className="bc-card p-5 grid gap-4 sm:grid-cols-2 max-w-4xl">
          <div className="space-y-2">
            <Label className="bc-form-label">Project *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="bc-input">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name || p.code || p.project_name || p.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="bc-form-label">Architect</Label>
            <Select
              value={architectId}
              onValueChange={setArchitectId}
              disabled={architectsLoading}
            >
              <SelectTrigger className="bc-input">
                <SelectValue
                  placeholder={
                    architectsLoading ? "Loading..." : "Select architect"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {architects.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No architects found
                  </SelectItem>
                ) : (
                  architects.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name ||
                        a.full_name ||
                        `${a.first_name || ""} ${a.last_name || ""}`.trim() ||
                        a.email ||
                        a.id}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ========== The Excel-like schedule table ========== */}
        <div className="bc-card overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/60 border-b">
                <th className="p-3 text-left w-16">No.</th>
                <th className="p-3 text-left min-w-[180px]">Stage</th>
                <th className="p-3 text-left min-w-[240px]">
                  Main checks / Purpose
                </th>
                <th className="p-3 text-left w-32">Visit Type</th>
                <th className="p-3 text-left w-36">Status</th>
                <th className="p-3 text-left w-36">Scheduled</th>
                <th className="p-3 text-left w-36">Visited</th>
                <th className="p-3 text-left min-w-[220px]">Findings</th>
                <th className="p-3 text-left min-w-[160px]">Remarks</th>
              </tr>
            </thead>

            <tbody>
              {stagesLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-8 text-center text-muted-foreground"
                  >
                    Loading stages…
                  </td>
                </tr>
              ) : sortedStages.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No visit stages found. Please seed the stages first.
                  </td>
                </tr>
              ) : (
                sortedStages.map((stage) => {
                  const row = getRow(stage.id);
                  return (
                    <tr key={stage.id} className="border-b hover:bg-muted/30">
                      {/* Visit No */}
                      <td className="p-2 font-medium text-center align-top">
                        {stage.visit_no ?? "–"}
                      </td>

                      {/* Stage name */}
                      <td className="p-2 font-medium align-top">
                        {stage.stage || "–"}
                      </td>

                      {/* Purpose / Main checks  ← real field name */}
                      <td className="p-2 text-muted-foreground text-xs leading-snug align-top">
                        {stage.checks_purpose || "–"}
                      </td>

                      {/* Visit Type */}
                      <td className="p-2 align-top">
                        {stage.visit_type ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${visitTypeBadge(
                              stage.visit_type,
                            )}`}
                          >
                            {stage.visit_type}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            –
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-2 align-top">
                        <Select
                          value={row.status}
                          onValueChange={(v) =>
                            updateRow(stage.id, "status", v)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
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
                      </td>

                      {/* Scheduled date */}
                      <td className="p-2 align-top">
                        <Input
                          type="date"
                          className="h-8 text-xs"
                          value={row.scheduled_date}
                          onChange={(e) =>
                            updateRow(
                              stage.id,
                              "scheduled_date",
                              e.target.value,
                            )
                          }
                        />
                      </td>

                      {/* Visited date */}
                      <td className="p-2 align-top">
                        <Input
                          type="date"
                          className="h-8 text-xs"
                          value={row.visited_date}
                          onChange={(e) =>
                            updateRow(stage.id, "visited_date", e.target.value)
                          }
                        />
                      </td>

                      {/* Findings */}
                      <td className="p-2 align-top">
                        <Textarea
                          className="min-h-[60px] text-xs resize-y"
                          placeholder="Findings…"
                          value={row.findings}
                          onChange={(e) =>
                            updateRow(stage.id, "findings", e.target.value)
                          }
                        />
                      </td>

                      {/* Remarks */}
                      <td className="p-2 align-top">
                        <Textarea
                          className="min-h-[60px] text-xs resize-y"
                          placeholder="Remarks…"
                          value={row.remarks}
                          onChange={(e) =>
                            updateRow(stage.id, "remarks", e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ========== Actions ========== */}
        <div className="flex gap-3">
          <Button type="submit" className="bc-btn-primary" disabled={isLoading}>
            {isLoading ? "Saving schedule…" : "Save visit schedule"}
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
