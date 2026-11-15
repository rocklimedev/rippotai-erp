import { FileText } from "lucide-react";
import DocumentListPage from "@/components/doc-list/DocumentListPage";
import { useGetProjectBriefsQuery, useDeleteProjectBriefMutation } from "../../api/documents/brief.api";

const projectName = (b) => b.project?.name || b.projectName || b.siteAddress || "Untitled project";

export default function ProjectBriefList() {
  const { data: rows = [], isLoading, error } = useGetProjectBriefsQuery(undefined);
  const [deleteProjectBrief] = useDeleteProjectBriefMutation();
  return (
    <DocumentListPage
      type="client-brief"
      title="Client Brief"
      icon={FileText}
      rows={rows}
      loading={isLoading}
      error={error}
      latestPerProject
      getRow={(b) => ({
        id: b.id,
        name: "Client Brief",
        projectId: b.projectId || b.project?.id,
        projectName: projectName(b),
        version: b.version,
        status: b.status,
        updatedAt: b.updatedAt || b.createdAt,
        search: [b.siteAddress, b.propertyType].filter(Boolean).join(" "),
      })}
      viewTo={(r) => `/crm/brief/${r.id}`}
      editTo={(r) => `/crm/brief/${r.id}/edit`}
      onDelete={(r) => deleteProjectBrief(r.id).unwrap()}
      createTo="/crm/forms/project-brief"
    />
  );
}
