import React, { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Edit3, Trash2, Download, FileText } from "lucide-react";
import { usePdfDownload, pdfFileName, DocumentPreview } from "@/components/print-document";
import { Page, PageHeader, Button, EmptyState, StatusPill } from "@/components/inos";
import ClientBriefDocument from "@/components/brief-document/ClientBriefDocument";
import {
  useGetProjectBriefQuery,
  useDeleteProjectBriefMutation,
} from "../../api/documents/brief.api";

// Client Brief viewer: shows exactly what the client receives (A4 pages) and
// downloads the same pages as a PDF.
export function ProjectBriefView() {
  const { id } = useParams();
  const nav = useNavigate();
  const docRef = useRef(null);
  const { download, downloading } = usePdfDownload(docRef);

  const { data: brief, isFetching, isError } = useGetProjectBriefQuery(id, { skip: !id });
  const [deleteProjectBrief, { isLoading: deleting }] = useDeleteProjectBriefMutation();

  const removeBrief = async () => {
    if (!window.confirm("Delete this project brief? This cannot be undone.")) return;
    try {
      await deleteProjectBrief(id).unwrap();
      toast.success("Project brief deleted");
      nav("/crm/brief/all");
    } catch (e) {
      toast.error(e?.data?.detail || e?.data?.message || "Failed to delete");
    }
  };

  const downloadPdf = () =>
    download(pdfFileName("Client-Brief", brief?.project?.name || "project", brief?.version || 1), {
      title: `Client Brief — ${brief?.project?.name || "Project"}`,
      label: "client brief",
    });

  const crumbs = [{ label: "CRM", to: "/crm" }, { label: "Client briefs", to: "/crm/brief/all" }, { label: "Brief" }];

  if (isFetching && !brief) {
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Client brief" subtitle="Loading…" />
      </Page>
    );
  }

  if (isError || !brief) {
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Client brief" />
        <div className="inos-card">
          <EmptyState icon={FileText} title="Brief not found" text="It may have been deleted, or you don't have access to it." />
        </div>
      </Page>
    );
  }

  const project = brief.project || {};

  return (
    <Page>
      <PageHeader
        crumbs={crumbs}
        title={project.name || "Client brief"}
        subtitle={
          <span style={{ display: "inline-flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            Client brief · version {brief.version || 1}
            {brief.status && <StatusPill status={brief.status} size="sm" />}
          </span>
        }
        actions={
          <>
            <Button variant="ghost" icon={Trash2} onClick={removeBrief} disabled={deleting}>
              Delete
            </Button>
            <Button variant="secondary" icon={Edit3} onClick={() => nav(`/crm/brief/${id}/edit`)}>
              Edit
            </Button>
            <Button variant="primary" icon={Download} onClick={downloadPdf} loading={downloading}>
              Download PDF
            </Button>
          </>
        }
      />

      <DocumentPreview>
        <ClientBriefDocument ref={docRef} brief={brief} />
      </DocumentPreview>
    </Page>
  );
}

export default ProjectBriefView;
