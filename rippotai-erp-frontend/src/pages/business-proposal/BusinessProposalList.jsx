import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
export default function BusinessProposalList() {
  const [params] = useSearchParams();
  const projectId = params.get("project_id") || "";
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api
      .get("/business-proposals", { params: { project_id: projectId, search } })
      .then(({ data }) => {
        if (active) setRows(data);
      })
      .catch(() => {
        if (active) setError("Could not load business proposals.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId, search, reload]);
  return (
    <div className="bg-page p-6 space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Business proposals</h1>
        <Link
          className="bc-btn-primary"
          to={`/crm/business-proposal/workspace${projectId ? `?project_id=${encodeURIComponent(projectId)}` : ""}`}
        >
          Create business proposal
        </Link>
      </div>
      <input
        className="bc-input"
        aria-label="Search proposals"
        placeholder="Search proposals…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading ? (
        <p>Loading proposals…</p>
      ) : error ? (
        <button onClick={() => setReload(reload + 1)}>{error} Retry</button>
      ) : !rows.length ? (
        <div className="bc-card p-8">No saved business proposals yet.</div>
      ) : (
        <div className="bc-card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-4">Proposal</th>
                <th className="p-4">Updated</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-4">
                    <Link to={`/crm/business-proposal/${row.id}`}>
                      {row.title}
                    </Link>
                  </td>
                  <td className="p-4">
                    {new Date(
                      row.updatedAt || row.updated_at,
                    ).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-3">
                      <Link to={`/crm/business-proposal/${row.id}`}>View</Link>
                      <Link to={`/crm/business-proposal/${row.id}/workspace`}>
                        Open workspace
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
