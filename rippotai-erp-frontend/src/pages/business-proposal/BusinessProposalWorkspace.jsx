import { Link, useParams } from "react-router-dom";
import ProposalBuilder from "../documents/ProposalBuilder";
import { useBusinessProposal } from "./useBusinessProposal";
export default function BusinessProposalWorkspace() {
  const { id } = useParams();
  const { record, error } = useBusinessProposal(id);
  return (
    <>
      <div className="px-6 pt-4">
        <Link className="bc-btn-secondary" to="/crm/business-proposal/all">
          ← Business proposals
        </Link>
      </div>
      {id && !record ? (
        <p className="p-6">{error || "Loading proposal…"}</p>
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
