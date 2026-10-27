import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Download, Eye } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button, Field, SelectInput, Segmented, Pill, EmptyState } from "@/components/inos";
import { useAuth } from "@/context/AuthContext";
import { useGetDocumentsQuery, useApproveDocumentMutation } from "@/api/documents/document.api";
import { useGetDrawingsQuery, useApproveDrawingMutation } from "@/api/documents/drawing.api";
import { useGetProjectsQuery } from "@/api/projects/project.api";
import { formatDate, formatBytes } from "@/pages/design-studio/drawingUtils";
import { rowsOf, fileDate as stamp, evidenceEntries, canApproveEvidence } from "./evidence-drawer-data";
import { authenticatedFetch } from "@/lib/http-client";
import { API_URL } from "@/lib/config";

const previewType = (file) => {
  const extension = file.filename?.split(".").pop()?.toLowerCase();
  return ({ pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" })[extension] ||
    (["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.mime) ? file.mime : null);
};

export default function EvidenceDrawer({ target, onClose }) {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState(target.projectId || "");
  const [kind, setKind] = useState(target.targetType === "DRAWING" ? "DRAWING" : "DOCUMENT");
  const [selectedId, setSelectedId] = useState("");
  const [previewRequest, setPreviewRequest] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const { data: projectsResponse } = useGetProjectsQuery({}, { skip: !!target.projectId });
  const projects = rowsOf(projectsResponse);
  const documentsQuery = useGetDocumentsQuery({ projectId, documentTypeId: target.documentTypeId }, { skip: !projectId || kind !== "DOCUMENT" });
  const drawingsQuery = useGetDrawingsQuery({ projectId }, { skip: !projectId || kind !== "DRAWING" });
  const [approveDocument, documentApproval] = useApproveDocumentMutation();
  const [approveDrawing, drawingApproval] = useApproveDrawingMutation();
  const approving = documentApproval.isLoading || drawingApproval.isLoading;
  const query = kind === "DRAWING" ? drawingsQuery : documentsQuery;
  const entries = useMemo(() => {
    return evidenceEntries(kind, kind === "DOCUMENT" ? documentsQuery.currentData : drawingsQuery.currentData, target.documentTypeId);
  }, [kind, documentsQuery.currentData, drawingsQuery.currentData, target.documentTypeId]);
  const selected = entries.find((entry) => entry.key === selectedId) || entries[0];
  const hasFile = !!(selected?.file.storageFilename || selected?.file.url);
  const mime = selected && previewType(selected.file);
  const canPreview = hasFile && mime && Number(selected?.file.size || 0) <= 25 * 1024 * 1024;
  const canApprove = canApproveEvidence(selected, user?.permissions);

  useEffect(() => {
    setPreview(null);
    setPreviewError("");
    if (!previewRequest || previewRequest.key !== selected?.key) { setPreviewLoading(false); return; }
    const controller = new AbortController();
    let url;
    setPreviewLoading(true);
    (async () => {
      try {
        const response = await authenticatedFetch(`${API_URL}${previewRequest.path}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Could not load the file preview. Try downloading the file.");
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(new Blob([blob], { type: previewRequest.mime }));
        setPreview({ key: previewRequest.key, url, mime: previewRequest.mime });
      } catch (error) {
        if (!controller.signal.aborted) setPreviewError(error.message);
      } finally { if (!controller.signal.aborted) setPreviewLoading(false); }
    })();
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [previewRequest, selected?.key]);

  const download = async () => {
    if (!selected || downloading) return;
    setDownloading(true);
    try {
      const response = await authenticatedFetch(`${API_URL}${selected.path}`);
      if (!response.ok) throw new Error("Could not download this file");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = selected.file.filename || selected.title;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { toast.error(error.message); }
    finally { setDownloading(false); }
  };
  const approve = async () => {
    try {
      await (kind === "DRAWING" ? approveDrawing(selected.record.id) : approveDocument(selected.record.id)).unwrap();
      toast.success("Approved. Command Center checks are refreshing.");
    } catch (error) { toast.error(error?.data?.message || "Approval failed"); }
  };

  return (
    <Sheet open onOpenChange={(open) => !open && !approving && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto flex flex-col gap-5">
        <SheetHeader className="pr-7">
          <SheetTitle>{target.name || "Documents & drawings"}</SheetTitle>
          <SheetDescription>{target.projectName || "Browse project uploads, inspect files and approve current evidence."}</SheetDescription>
        </SheetHeader>
        {!target.projectId && <Field label="Project" required>
          <SelectInput value={projectId} disabled={approving} onChange={(event) => { setProjectId(event.target.value); setSelectedId(""); setPreviewRequest(null); }}>
            <option value="">Select project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </SelectInput>
        </Field>}
        {!target.documentTypeId && <Segmented value={kind} onChange={(value) => { if (approving) return; setKind(value); setSelectedId(""); setPreviewRequest(null); }} options={[{ value: "DOCUMENT", label: "Documents" }, { value: "DRAWING", label: "Drawings" }]} />}
        {!projectId ? <EmptyState title="Choose a project" text="Files load only for the selected project." /> : query.isFetching && !query.currentData ? <p>Loading uploads…</p> : query.isError ? <EmptyState title="Could not load uploads" text={query.error?.data?.message || "Check your access or try again."} action={<Button onClick={query.refetch}>Retry</Button>} /> : !entries.length ? <EmptyState title="No uploads yet" text="Upload a file for this project or checklist item to inspect it here." /> : <>
          <Field label={kind === "DRAWING" ? "Drawing sheet / revision" : "Uploaded document"}>
            <SelectInput value={selected?.key || ""} disabled={approving} onChange={(event) => setSelectedId(event.target.value)}>
              {entries.map((entry) => <option key={entry.key} value={entry.key}>{entry.title} · {entry.status || "Pending"}{entry.latest ? "" : " · Older upload"}</option>)}
            </SelectInput>
          </Field>
          {selected && <>
            <div className="flex flex-wrap items-center gap-3">
              <Pill tone={["approved", "Approved"].includes(selected.status) ? "ok" : "warn"}>{selected.status || "Pending"}</Pill>
              <span className="text-sm">{selected.file.filename} · {formatBytes(selected.file.size)} · {formatDate(stamp(selected.file))}</span>
            </div>
            {selected.record.remarks && <p className="text-sm whitespace-pre-wrap">{selected.record.remarks}</p>}
            {selected.file.uploadedByName && <p className="text-sm">Uploaded by {selected.file.uploadedByName}</p>}
            <div className="flex flex-wrap gap-2">
              {canPreview && <Button icon={Eye} disabled={previewLoading} onClick={() => setPreviewRequest({ key: selected.key, path: selected.path, mime })}>{previewLoading ? "Loading preview…" : "Preview"}</Button>}
              <Button icon={Download} disabled={!hasFile || downloading} onClick={download}>{downloading ? "Downloading…" : "Download"}</Button>
              {canApprove && <Button variant="primary" icon={CheckCircle2} disabled={approving} onClick={approve}>{approving ? "Approving…" : kind === "DRAWING" ? "Approve drawing" : "Approve document"}</Button>}
            </div>
            {!hasFile ? <p className="text-sm text-muted-foreground">No file is attached to this record yet.</p> : !canPreview && <p className="text-sm text-muted-foreground">Preview supports PDF and image files up to 25 MB. Download this file to view it.</p>}
            {!selected.latest && <p className="text-sm text-muted-foreground">This is an older upload. Select the latest upload to approve it.</p>}
            {previewError && <p role="alert" className="text-sm">{previewError}</p>}
            {preview?.key === selected.key && (preview.mime === "application/pdf" ? <iframe title={`Preview: ${selected.title}`} src={preview.url} className="w-full min-h-[60vh] border rounded" /> : <img alt={selected.title} src={preview.url} className="max-w-full h-auto object-contain" />)}
          </>}
        </>}
      </SheetContent>
    </Sheet>
  );
}
