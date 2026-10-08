import { Link, useParams } from "react-router-dom";
import ProposalBuilder from "../documents/ProposalBuilder";
import { useGetBusinessProposalQuery } from "@/api/documents/business-proposals.api";
export default function BusinessProposalWorkspace() {
  const { id } = useParams();
  const { currentData: record, isError, refetch } = useGetBusinessProposalQuery(id, { skip: !id });
  const error = isError ? "Could not load this business proposal." : "";
  return (
    <>
      <div className="px-6 pt-4">
        <Link className="bc-btn-secondary" to="/crm/business-proposal/all">
          ← Business proposals
        </Link>
      </div>
      {id && !record ? (
        <div className="p-6"><p>{error || "Loading proposal…"}</p>{isError && <button onClick={refetch}>Retry</button>}</div>
      ) : (
        <ProposalBuilder
          key={id || "new"}
          savedRecord={record}
          projectId={record?.project_id}
        />
      )}
    </>
  );
}
