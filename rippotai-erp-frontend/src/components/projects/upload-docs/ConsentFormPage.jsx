// Build › Contracts › Consent Form: generate the CONSENT FORM TEMPLATE for a project.
import { useSearchParams } from "react-router-dom";
import { Card, EmptyState, Field, Page, PageHeader, SelectInput } from "@/components/inos";
import { FileText } from "lucide-react";
import { useGetProjectByIdQuery } from "@/api/projects/project.api";
import ProjectTemplatesPanel from "@/components/project-templates/ProjectTemplatesPanel";
import { useProjectsList } from "./uploadDocs";

export default function ConsentFormPage() {
  const [params, setParams] = useSearchParams();
  const projectId = params.get("projectId") || "";
  const { projects } = useProjectsList();
  const { data } = useGetProjectByIdQuery(projectId, { skip: !projectId });
  const project = data?.data || data;
  return (
    <Page>
      <PageHeader title="Consent Form" />
      <Card>
        <Field label="Project">
          <SelectInput
            value={projectId}
            onChange={(e) => setParams(e.target.value ? { projectId: e.target.value } : {}, { replace: true })}
            style={{ maxWidth: 360 }}
            data-testid="consent-project"
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectInput>
        </Field>
      </Card>
      {projectId && project?.id ? (
        <ProjectTemplatesPanel key={projectId} project={project} />
      ) : (
        <Card>
          <EmptyState icon={FileText} title="Select a project" />
        </Card>
      )}
    </Page>
  );
}
