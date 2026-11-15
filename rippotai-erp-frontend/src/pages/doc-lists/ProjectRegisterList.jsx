// Project-level registers (one "document" per project): Site Inventory,
// Architect Site Visit Schedule, Consent Form. Rows come from the generic
// doc-flow rows endpoint; view/edit open the project's register page.
import DocumentListPage from "@/components/doc-list/DocumentListPage";
import { useGetDocRowsQuery } from "@/api/doc-flow/doc-flow.api";

export default function ProjectRegisterList({ type, title, icon, viewTo, onView, editTo, createTo, createLabel }) {
  const { data: rows = [], isLoading, error } = useGetDocRowsQuery(type);
  return (
    <DocumentListPage
      type={type}
      title={title}
      icon={icon}
      rows={rows}
      loading={isLoading}
      error={error}
      getRow={(r) => ({
        id: r.id,
        name: title,
        projectId: r.id,
        projectName: r.name,
        updatedAt: r.updated_at,
      })}
      viewTo={viewTo}
      onView={onView}
      editTo={editTo}
      createTo={createTo}
      createLabel={createLabel}
      canDelete={false}
    />
  );
}
