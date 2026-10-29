import { useParams, useNavigate } from "react-router-dom";
import { useGetDocumentQuery } from "@/api/documents/document.api";
import { Page, PageHeader, Card, Button, EmptyState } from "@/components/inos";
import { authenticatedFetch } from "@/lib/http-client";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";
import { useState } from "react";
import DrawingPreview from "../design-studio/DrawingPreview";
import { fileKind } from "../design-studio/drawingUtils";

export default function DocumentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentData: document, isLoading, isError } = useGetDocumentQuery(id);
  const [downloading, setDownloading] = useState(false);
  const download = async () => {
    setDownloading(true);
    try {
      const response = await authenticatedFetch(`${API_URL}/documents/${id}/download`);
      if (!response.ok) throw new Error("Could not download document.");
      const url = URL.createObjectURL(await response.blob());
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.filename || document.title;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { toast.error(error.message); }
    finally { setDownloading(false); }
  };
  const kind = fileKind({ name: document?.filename, mime: document?.mime });
  const hasFile = !!(document?.storageFilename || document?.url);
  return <Page>
    <PageHeader title={document?.title || "Document"} subtitle={document?.filename} actions={<>
      <Button variant="secondary" onClick={() => navigate(`/projects/documents/all${document?.projectId ? `?project_id=${encodeURIComponent(document.projectId)}` : ""}`)}>All documents</Button>
      {hasFile && <Button disabled={downloading} onClick={download}>{downloading ? "Downloading…" : "Download"}</Button>}
    </>} />
    <Card>
      {isLoading ? <p>Loading document…</p> : isError || !document ? <EmptyState title="Document unavailable" text="The document may have been deleted or you may not have access." />
        : !hasFile ? <EmptyState title="No file attached" />
        : ["image", "pdf"].includes(kind) ? <div className="ds-preview"><DrawingPreview key={`${id}:${document.storageFilename}`} drawingId={id} revision={document} kind={kind} title={document.title} downloadPath={`/documents/${id}/download`} /></div>
        : <p>Download this file to open it.</p>}
      {document?.remarks && <p>{document.remarks}</p>}
    </Card>
  </Page>;
}
