import { NotebookPen } from "lucide-react";
import DocumentListPage from "@/components/doc-list/DocumentListPage";
import { asRows, fmtDate, rowProjectId, rowProjectName, rowUpdated } from "@/components/doc-list/doc-utils";
import { useListDailySiteReportsQuery, useDeleteDailySiteReportMutation } from "@/api/procuerment/site-ops.api";

const BASE = "/site-operations/daily-reports";

export default function DailySiteReportsPage() {
  const { data, isLoading, error } = useListDailySiteReportsQuery({});
  const [remove] = useDeleteDailySiteReportMutation();
  return (
    <DocumentListPage
      type="daily-site-report"
      title="Daily Site Report"
      icon={NotebookPen}
      rows={asRows(data)}
      loading={isLoading}
      error={error}
      getRow={(r) => ({
        id: r.id,
        name: `Daily Site Report · ${fmtDate(r.reportDate || r.report_date)}`,
        projectId: rowProjectId(r),
        projectName: rowProjectName(r),
        status: r.status,
        updatedAt: rowUpdated(r),
      })}
      viewTo={(r) => `${BASE}/${r.id}`}
      editTo={(r) => `${BASE}/${r.id}/edit`}
      onDelete={(r) => remove(r.id).unwrap()}
      createTo={`${BASE}/new`}
    />
  );
}
