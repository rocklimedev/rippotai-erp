import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileSpreadsheet } from "lucide-react";
import { Shell, Card } from "../../hooks/shared";
import { useGetRateComparisonsQuery } from "../../api/procuerment/vendor-rate-comparison.api";

const basePath = "/procurement/vendors/rate-comparison";
export default function VendorRateComparisonList() {
  const {
    data: sheets = [],
    isLoading,
    isError,
    refetch,
  } = useGetRateComparisonsQuery();
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState("");
  const projects = useMemo(
    () => [
      ...new Map(
        sheets.map((sheet) => [
          sheet.project_id,
          sheet.project?.name || sheet.project_id,
        ]),
      ).entries(),
    ],
    [sheets],
  );
  const visible = sheets.filter(
    (sheet) =>
      (!projectId || sheet.project_id === projectId) &&
      [sheet.title, sheet.project?.name, sheet.boq?.title]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <Shell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F453B]">
            Vendor Rate Comparisons
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Saved comparison sheets for your projects and BOQs.
          </p>
        </div>
        <Link
          to={`${basePath}/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1F453B] px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={16} />
          Create rate comparison sheet
        </Link>
      </div>
      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            aria-label="Search comparison sheets"
            className="inos-input"
            placeholder="Search sheets, projects or BOQs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            aria-label="Filter by project"
            className="inos-input"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">All projects</option>
            {projects.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        {isLoading ? (
          <p>Loading comparison sheets...</p>
        ) : isError ? (
          <p role="alert">
            Could not load comparison sheets.{" "}
            <button onClick={refetch} className="underline">
              Retry
            </button>
          </p>
        ) : visible.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            <FileSpreadsheet className="mx-auto mb-3" />
            <p>
              {sheets.length
                ? "No matching comparison sheets."
                : "Create your first rate comparison sheet to save vendor rates against a project BOQ."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="p-3">Sheet</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">BOQ</th>
                  <th className="p-3">Revision</th>
                  <th className="p-3">Last saved</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((sheet) => (
                  <tr key={sheet.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">
                      <Link
                        to={`${basePath}/${sheet.id}/edit`}
                        className="text-[#1F453B] underline"
                      >
                        {sheet.title}
                      </Link>
                    </td>
                    <td className="p-3">
                      {sheet.project?.name || sheet.project_id}
                    </td>
                    <td className="p-3">{sheet.boq?.title || sheet.boq_id}</td>
                    <td className="p-3">{sheet.revision}</td>
                    <td className="p-3">
                      {new Date(
                        sheet.updatedAt || sheet.updated_at,
                      ).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <Link
                        className="underline"
                        to={`${basePath}/${sheet.id}/edit`}
                      >
                        Open sheet
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Shell>
  );
}
