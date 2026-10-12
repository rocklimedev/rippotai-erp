import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FileText, RefreshCw } from "lucide-react";
import { Card, Button, EmptyState, Pill } from "@/components/inos";
import { useGetProjectPhasesQuery } from "@/api/projects/command-center.api";
import { PhaseDetailCard, UploadDocumentModal } from "../../pages/CommandCenter";

export default function ProjectDocumentsBoard({ projects = [], projectId }) {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [uploadTarget, setUploadTarget] = useState(null);
  const activeProjectId = projectId || selectedProject || projects[0]?.id;
  const { data: project, isLoading, isFetching, isError, refetch } =
    useGetProjectPhasesQuery(activeProjectId, { skip: !activeProjectId });
  const phases = project?.phases || [];
  const phase = phases.find((item) => item.id === selectedPhase)
    || phases.find((item) => item.phaseNumber === project?.currentPhaseSeq)
    || phases[0];

  return (
    <Card title="Project documents" subtitle="Create or upload documents for each project phase."
      actions={activeProjectId && <Button variant="ghost" size="sm" icon={RefreshCw}
        disabled={isFetching} onClick={refetch}>Refresh</Button>}>
      {!projectId && projects.length > 0 && (
        <label style={{ display: "grid", gap: 6, marginBottom: 20 }}>
          <span className="cc-detail-head">Project</span>
          <select className="inos-input" value={activeProjectId || ""}
            onChange={(event) => { setSelectedProject(event.target.value); setSelectedPhase(null); }}>
            {projects.map((item) => <option key={item.id} value={item.id}>{item.name || item.project_name || item.code || item.id}</option>)}
          </select>
        </label>
      )}
      {!activeProjectId && <EmptyState icon={FileText} title="No projects yet" text="Create a project to manage its documents." />}
      {isLoading && <p className="cc-muted" role="status">Loading project phases…</p>}
      {isError && <EmptyState icon={FileText} title="Documents could not be loaded"
        text="Try refreshing the project documents." action={<Button onClick={refetch}>Try again</Button>} />}
      {project && !isError && (
        <>
          <div className="cc-phase-pills" role="group" aria-label="Document phases"
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {phases.map((item) => <Button key={item.id} size="sm"
              variant={item.id === phase?.id ? "primary" : "secondary"}
              aria-pressed={item.id === phase?.id} onClick={() => setSelectedPhase(item.id)}>
              {item.name} <span>{item.docsDone || 0}/{item.docsTotal || 0}</span>
            </Button>)}
          </div>
          {phase ? <>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h3 className="cc-detail-head">{phase.name}</h3>
              <Pill size="sm" tone="brand">{phase.docsDone || 0}/{phase.docsTotal || 0} complete</Pill>
            </div>
            <PhaseDetailCard key={`${project.id}:${phase.id}`} project={project} phase={phase}
              documentsOnly onOpen={{ navigate, uploadDoc: setUploadTarget }} onFlash={toast} />
          </> : <EmptyState icon={FileText} title="No document phases configured"
            text="Configure the project document phases to start creating and uploading documents." />}
        </>
      )}
      {uploadTarget && <UploadDocumentModal key={`${uploadTarget.projectId}:${uploadTarget.documentTypeId}`}
        target={uploadTarget} onClose={() => setUploadTarget(null)} onFlash={toast.error}
        onUploaded={() => { setUploadTarget(null); toast.success("Document uploaded."); }} />}
    </Card>
  );
}
