import { Navigate, useLocation } from "react-router-dom";

/** /projects/documents/all?project_id=X → that project's Documents tab. */
export default function ProjectDocumentsRedirect() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const projectId = params.get("project_id") || params.get("projectId");
  return <Navigate to={projectId ? `/projects/${projectId}?tab=documents` : "/projects"} replace />;
}
