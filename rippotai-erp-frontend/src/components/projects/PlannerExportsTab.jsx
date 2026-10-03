import React, { useMemo, useRef } from "react";
import { Download, FileText } from "lucide-react";

import { useGetPlannerItemsQuery, useGetProjectLocationsQuery } from "../../api/documents/project-planner.api";
import { useGetProjectByIdQuery } from "../../api/projects/project.api";
import { Card, Button, EmptyState } from "@/components/inos";
import { DocumentPreview, usePdfDownload } from "@/components/print-document";
import PlannerDocument, { plannerFileName } from "./PlannerDocument";

const unwrapArray = (data) => (Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);

// Planner export: the same A4 document as the planner workspace's "Download PDF", for one module.
export function PlannerExportsTab({ projectId, plannerId, module, moduleLabel }) {
  const docRef = useRef(null);
  const { download, downloading } = usePdfDownload(docRef);

  const { data: itemsRes, isFetching: loadingItems } = useGetPlannerItemsQuery({ plannerId: plannerId || "" }, { skip: !plannerId });
  const { data: locationsRes, isFetching: loadingLocations } = useGetProjectLocationsQuery(projectId, { skip: !projectId });
  const { data: projectRes } = useGetProjectByIdQuery(projectId, { skip: !projectId });
  const project = projectRes?.data || projectRes;

  const items = unwrapArray(itemsRes);
  const view = module === "CONSULTANCY" ? "Consultancy" : module === "PMC" ? "PMC" : "Overview";
  const overview = useMemo(
    () => ({ project, locations: unwrapArray(locationsRes), planners: [{ items }] }),
    [project, locationsRes, items],
  );

  return (
    <Card
      title={`${moduleLabel || view} export`}
      subtitle="The planner as a client-ready A4 document."
      actions={
        <Button
          variant="primary"
          icon={Download}
          loading={downloading}
          disabled={!items.length || loadingItems || loadingLocations}
          onClick={() => download(plannerFileName(project?.name, view), { title: `Project Planner — ${project?.name || ""}`, label: "planner" })}
        >
          Download PDF
        </Button>
      }
    >
      {!items.length ? (
        <EmptyState icon={FileText} title="Nothing to export" text="Initialize the planner before generating a PDF." />
      ) : (
        <DocumentPreview>
          <PlannerDocument ref={docRef} overview={overview} view={view} project={project} />
        </DocumentPreview>
      )}
    </Card>
  );
}

export default PlannerExportsTab;
