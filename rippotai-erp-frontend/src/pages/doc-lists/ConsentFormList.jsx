// Consent Form: generated per project from project data (CONSENT FORM TEMPLATE).
// View opens the generated document with PDF download; it is not stored.
import { useRef, useState } from "react";
import { Download, FileSignature } from "lucide-react";
import { Button } from "@/components/inos";
import { Modal } from "@/components/projects/_projects-ui";
import { DocumentPreview, usePdfDownload } from "@/components/print-document";
import { TEMPLATES } from "@/components/project-templates/templates.config";
import { useGetProjectByIdQuery } from "@/api/projects/project.api";
import ProjectRegisterList from "./ProjectRegisterList";

const template = TEMPLATES.find((t) => t.id === "client-consent-form");

function ConsentPreview({ projectId, onClose }) {
  const ref = useRef(null);
  const { data, isLoading } = useGetProjectByIdQuery(projectId);
  const project = data?.data ?? data;
  const { download, downloading } = usePdfDownload(ref);
  const { Document } = template;
  return (
    <Modal
      open
      onClose={onClose}
      title="Consent Form"
      width={920}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            icon={Download}
            disabled={downloading || !project}
            onClick={() => download(template.fileName(project), template.pdfOptions(project))}
          >
            {downloading ? "Preparing PDF…" : "Download PDF"}
          </Button>
        </>
      }
    >
      {isLoading || !project ? (
        <p style={{ padding: 24, color: "var(--text-3)" }}>Loading…</p>
      ) : (
        <DocumentPreview>
          <Document ref={ref} values={template.getValues(project)} />
        </DocumentPreview>
      )}
    </Modal>
  );
}

export default function ConsentFormList() {
  const [open, setOpen] = useState(null);
  return (
    <>
      <ProjectRegisterList
        type="consent-form"
        title="Consent Form"
        icon={FileSignature}
        onView={(r) => setOpen(r.id)}
        editTo={(r) => `/projects/${r.id}/edit`}
      />
      {open && <ConsentPreview projectId={open} onClose={() => setOpen(null)} />}
    </>
  );
}
