import { MapPin } from "lucide-react";
import DocumentListPage from "@/components/doc-list/DocumentListPage";
import { rowProjectId, rowProjectName, rowUpdated } from "@/components/doc-list/doc-utils";
import { useGetSiteReccesQuery, useDeleteSiteRecceMutation } from "../../api/documents/site-recce.api";

export default function SiteRecceList() {
  const { data: rows = [], isLoading, error } = useGetSiteReccesQuery();
  const [deleteSiteRecce] = useDeleteSiteRecceMutation();
  return (
    <DocumentListPage
      type="site-recce"
      title="Site Recce"
      icon={MapPin}
      rows={rows}
      loading={isLoading}
      error={error}
      getRow={(r) => ({
        id: r.id,
        name: "Site Recce",
        projectId: rowProjectId(r),
        projectName: rowProjectName(r),
        updatedAt: rowUpdated(r),
        search: [r.client_name, r.recce_date].filter(Boolean).join(" "),
      })}
      viewTo={(r) => `/crm/recce/${r.id}`}
      editTo={(r) => `/crm/recce/${r.id}/edit`}
      onDelete={(r) => deleteSiteRecce(r.id).unwrap()}
      createTo="/crm/forms/site-reki"
    />
  );
}
