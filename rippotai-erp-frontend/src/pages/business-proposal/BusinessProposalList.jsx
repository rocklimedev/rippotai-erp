import { Presentation } from "lucide-react";
import DocumentListPage from "@/components/doc-list/DocumentListPage";
import { rowProjectId, rowProjectName, rowUpdated } from "@/components/doc-list/doc-utils";
import { useGetBusinessProposalsQuery } from "@/api/documents/business-proposals.api";

export default function BusinessProposalList() {
  const { data: rows = [], isLoading, error } = useGetBusinessProposalsQuery({});
  return (
    <DocumentListPage
      type="business-proposal"
      title="Business Proposal"
      icon={Presentation}
      rows={rows}
      loading={isLoading}
      error={error}
      getRow={(r) => ({
        id: r.id,
        name: r.title || "Business Proposal",
        projectId: rowProjectId(r),
        projectName: rowProjectName(r),
        updatedAt: rowUpdated(r),
      })}
      viewTo={(r) => `/crm/business-proposal/${r.id}`}
      editTo={(r) => `/crm/business-proposal/${r.id}/workspace`}
      createTo="/crm/business-proposal/workspace"
    />
  );
}
