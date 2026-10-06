import { useParams } from "react-router-dom";
import {
  useGetDailySiteReportByIdQuery,
  useShareDailySiteReportMutation,
} from "../../api/site-ops/site-ops.api";
import { PageHeader } from "@/components/site-ops/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Share2 } from "lucide-react";

export default function DailyReportDetailPage() {
  const { id } = useParams();
  const reportId = id;
  const {
    data: report,
    isLoading,
    error,
  } = useGetDailySiteReportByIdQuery(reportId, { skip: !reportId });
  const [share, { isLoading: sharing }] = useShareDailySiteReportMutation();

  const handleShare = async () => {
    try {
      await share(reportId).unwrap();
      toast.success("Report marked as shared");
    } catch (e) {
      toast.error(e?.data?.message || "Failed to share");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-page min-h-full p-6 text-[var(--muted)]">Loading…</div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-page min-h-full p-6">
        <PageHeader title="Report not found" backTo="/site-ops/daily-reports" />
      </div>
    );
  }

  return (
    <div className="bg-page min-h-full p-6">
      <PageHeader
        title={`Daily report — ${
          report.reportDate
            ? new Date(report.reportDate).toLocaleDateString()
            : id
        }`}
        description={`Project #${report.projectId}`}
        backTo="/site-ops/daily-reports"
        actions={
          !report.sharedAt ? (
            <Button
              className="bc-btn-primary"
              onClick={handleShare}
              disabled={sharing}
            >
              <Share2 className="h-4 w-4 mr-1.5" />
              Mark shared
            </Button>
          ) : undefined
        }
      />

      <div className="bc-card p-6 max-w-3xl space-y-5">
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-[var(--muted)]">Weather</dt>
            <dd className="font-medium text-[var(--ink-green)]">
              {report.weatherCondition || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Reported by</dt>
            <dd className="font-medium text-[var(--ink-green)]">
              {report.reportedBy}
            </dd>
          </div>
          {report.weatherNotes && (
            <div className="sm:col-span-2">
              <dt className="text-[var(--muted)]">Weather notes</dt>
              <dd className="text-[var(--ink-green)]">{report.weatherNotes}</dd>
            </div>
          )}
          <div className="sm:col-span-2">
            <dt className="text-[var(--muted)]">Work completed</dt>
            <dd className="text-[var(--ink-green)] whitespace-pre-wrap mt-1">
              {report.workCompleted}
            </dd>
          </div>
          {report.issues && (
            <div className="sm:col-span-2">
              <dt className="text-[var(--muted)]">Issues</dt>
              <dd className="text-[var(--ink-green)] whitespace-pre-wrap mt-1">
                {report.issues}
              </dd>
            </div>
          )}
          {report.manpower && report.manpower.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="text-[var(--muted)] mb-2">Manpower</dt>
              <dd>
                <ul className="space-y-1">
                  {report.manpower.map((m, i) => (
                    <li key={i} className="text-[var(--ink-green)]">
                      Team #{m.teamId}: {m.headcount}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          {report.sharedAt && (
            <div>
              <dt className="text-[var(--muted)]">Shared at</dt>
              <dd className="text-[var(--ink-green)]">
                {new Date(report.sharedAt).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
