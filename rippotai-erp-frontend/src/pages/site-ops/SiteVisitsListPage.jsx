import { Link } from "react-router-dom";
import { useGetAllocatedVisitLogsQuery } from "@/api/procuerment/site-ops.api";
import {
  useSiteProjects,
  useProjectParam,
  ProjectPicker,
  rowProjectName,
} from "./siteProjects";
export default function SiteVisitsListPage() {
  const [projectId, setProjectId] = useProjectParam();
  const { projects, nameOf } = useSiteProjects();
  const { data, isLoading, error } = useGetAllocatedVisitLogsQuery({
    projectId,
  });
  const visits = Array.isArray(data) ? data : data?.data || [];
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Site Visits</h1>
          <p className="text-sm text-muted-foreground">
            Attendance and findings for allocated visit events.
          </p>
        </div>
        <Link
          className="rounded border px-4 py-2"
          to="/site-operations/site-visits/new"
        >
          Record visit
        </Link>
      </div>
      <ProjectPicker
        projects={projects}
        value={projectId}
        onChange={setProjectId}
      />
      {error ? (
        <p role="alert">Unable to load visits.</p>
      ) : isLoading ? (
        <p>Loading visits…</p>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                {[
                  "Project",
                  "Visitor",
                  "Scheduled date",
                  "Stage / Purpose",
                  "Status",
                ].map((h) => (
                  <th key={h} className="p-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visits.map((v) => (
                <tr className="border-t" key={v.id}>
                  <td className="p-3">{rowProjectName(v, nameOf)}</td>
                  <td className="p-3">
                    {v.visitorName}
                    <p className="text-xs text-muted-foreground">
                      {v.visitorType}
                    </p>
                  </td>
                  <td className="p-3">{v.scheduledDate}</td>
                  <td className="p-3">
                    <Link
                      className="underline"
                      to={`/site-operations/site-visits/${v.id}`}
                    >
                      {v.visitAssignment?.stageName ||
                        v.purpose ||
                        "View visit"}
                    </Link>
                  </td>
                  <td className="p-3">{v.status}</td>
                </tr>
              ))}
              {!visits.length && (
                <tr>
                  <td colSpan={5} className="p-6 text-center">
                    No recorded visits.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
