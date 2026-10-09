import "@/components/business-proposal/proposal-template.css";
import { useGetBusinessProposalsQuery } from "@/api/documents/business-proposals.api";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
export default function BusinessProposalList() {
  const [params] = useSearchParams();
  const projectId = params.get("project_id") || params.get("projectId") || "";
  const [search, setSearch] = useState("");
  const { currentData: rows = [], isFetching: loading, isError, refetch } = useGetBusinessProposalsQuery({ projectId, search });
  const error = isError ? "Could not load business proposals." : "";
return (
    <div className="bp-workspace bp-library p-6 space-y-5">
      <div className="bp-library-header flex flex-wrap gap-4 justify-between items-center">
        <div><p className="bp-eyebrow">RIPPŌTAI · CLIENT DOCUMENTS</p><h1 className="text-2xl font-semibold">Business proposals</h1><p className="bp-library-description">From the first brief to the final proposal.</p></div>
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
        <button onClick={() => refetch()}>{error} Retry</button>
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
