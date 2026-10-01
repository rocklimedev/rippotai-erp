import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateDailySiteReportMutation } from "../../api/site-ops/site-ops.api";
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

const WEATHER = [
  "CLEAR",
  "CLOUDY",
  "RAIN",
  "HEAVY_RAIN",
  "STORM",
  "EXTREME_HEAT",
  "OTHER",
];

export default function DailyReportCreatePage() {
  const navigate = useNavigate();
  const [createReport, { isLoading }] = useCreateDailySiteReportMutation();
  const [form, setForm] = useState({
    projectId: "",
    reportDate: new Date().toISOString().slice(0, 10),
    weatherCondition: "",
    weatherNotes: "",
    workCompleted: "",
    issues: "",
    reportedBy: "",
  });

  const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const projectId = Number(form.projectId);
    if (
      !projectId ||
      !form.reportDate ||
      !form.workCompleted ||
      !form.reportedBy
    ) {
      toast.error("Fill required fields");
      return;
    }
    try {
      const result = await createReport({
        projectId,
        reportDate: form.reportDate,
        weatherCondition: form.weatherCondition || undefined,
        weatherNotes: form.weatherNotes || undefined,
        workCompleted: form.workCompleted,
        issues: form.issues || undefined,
        reportedBy: form.reportedBy,
      }).unwrap();
      toast.success("Report created");
      navigate(`/site-ops/daily-reports/${result.id}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create report");
    }
  };

  return (
    <div className="bg-page min-h-full p-6">
      <PageHeader
        title="New Daily Site Report"
        description="Log today's site activity, weather and issues."
        backTo="/site-ops/daily-reports"
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
            <Label>Report date *</Label>
            <Input
              type="date"
              className="bc-input"
              value={form.reportDate}
              onChange={(e) => set("reportDate", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Weather</Label>
            <Select
              value={form.weatherCondition || "none"}
              onValueChange={(v) =>
                set("weatherCondition", v === "none" ? "" : v)
              }
            >
              <SelectTrigger className="bc-input">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {WEATHER.map((w) => (
                  <SelectItem key={w} value={w}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reported by *</Label>
            <Input
              className="bc-input"
              value={form.reportedBy}
              onChange={(e) => set("reportedBy", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Weather notes</Label>
          <Input
            className="bc-input"
            value={form.weatherNotes}
            onChange={(e) => set("weatherNotes", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Work completed *</Label>
          <Textarea
            className="bc-input min-h-[100px]"
            value={form.workCompleted}
            onChange={(e) => set("workCompleted", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Issues</Label>
          <Textarea
            className="bc-input"
            value={form.issues}
            onChange={(e) => set("issues", e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="bc-btn-primary" disabled={isLoading}>
            {isLoading ? "Saving…" : "Create report"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="bc-btn-secondary"
            onClick={() => navigate("/site-ops/daily-reports")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
