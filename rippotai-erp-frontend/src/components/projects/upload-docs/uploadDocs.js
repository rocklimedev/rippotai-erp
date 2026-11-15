// Upload-type project documents (Contract, Agreement, Design, Material Palette,
// Tender / Working Drawings and the Pre Design slots) on top of the existing
// document_types + documents / drawings system.
import { useMemo } from "react";
import { toast } from "sonner";
import { useGetDocumentTypesQuery, useGetDocumentsQuery } from "@/api/documents/document.api";
import { useGetDrawingsQuery } from "@/api/documents/drawing.api";
import { useGetProjectsQuery } from "@/api/projects/project.api";
import { authenticatedFetch } from "@/lib/http-client";
import { API_URL } from "@/lib/config";
import { latestRevision, sortedRevisions } from "@/pages/design-studio/drawingUtils";
import { openInNewTab } from "@/components/record-context/openFile";

export const asList = (v) =>
  Array.isArray(v) ? v : Array.isArray(v?.items) ? v.items : Array.isArray(v?.data) ? v.data : Array.isArray(v?.results) ? v.results : [];

const at = (r) => r?.updatedAt || r?.updated_at || r?.createdAt || r?.created_at || null;

/** Active document types of an upload config (exact codes or a whole phase). */
export function useFlowTypes(cfg) {
  const { data, isLoading } = useGetDocumentTypesQuery({ isActive: true });
  const types = useMemo(() => {
    const all = asList(data).filter((t) => t.isActive !== false);
    return all
      .filter((t) =>
        cfg.typeCodes ? cfg.typeCodes.includes(t.code) : t.phaseCode === cfg.phaseCode && !(cfg.excludeCodes || []).includes(t.code),
      )
      .filter((t) => (cfg.target === "DRAWING" ? t.targetType === "DRAWING" : t.targetType !== "DRAWING"))
      .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  }, [data, cfg]);
  return { types, isLoading };
}

export function useProjectsList() {
  const { data, isLoading } = useGetProjectsQuery({});
  const projects = useMemo(() => asList(data), [data]);
  const byId = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);
  return { projects, byId, isLoading };
}

/**
 * One row per uploaded record of the config's types: { id, kind, typeId,
 * typeName, projectId, projectName, version, status, updatedAt, record }.
 */
export function useUploadRows(cfg, projectId) {
  const { types, isLoading: typesLoading } = useFlowTypes(cfg);
  const { byId } = useProjectsList();
  const isDrawing = cfg.target === "DRAWING";
  const docsQ = useGetDocumentsQuery(projectId ? { projectId } : {}, { skip: isDrawing });
  const drawingsQ = useGetDrawingsQuery(projectId ? { projectId } : {}, { skip: !isDrawing });
  const typeIds = useMemo(() => new Set(types.map((t) => t.id)), [types]);
  const typeById = useMemo(() => Object.fromEntries(types.map((t) => [t.id, t])), [types]);

  const rows = useMemo(() => {
    if (!types.length) return [];
    const src = asList(isDrawing ? drawingsQ.data : docsQ.data);
    return src
      .filter((r) => typeIds.has(r.documentTypeId || r.document_type_id))
      .filter((r) => !projectId || (r.projectId || r.project_id) === projectId)
      .map((r) => {
        const typeId = r.documentTypeId || r.document_type_id;
        const pid = r.projectId || r.project_id;
        const rev = isDrawing ? latestRevision(r) : null;
        return {
          id: r.id,
          kind: isDrawing ? "drawing" : "document",
          typeId,
          typeName: typeById[typeId]?.name || cfg.name,
          title: isDrawing ? `${r.drawingNumber ? `${r.drawingNumber} · ` : ""}${r.title || ""}` : r.title,
          projectId: pid,
          projectName: byId[pid]?.name || r.project?.name || "—",
          version: isDrawing ? rev?.revision || "—" : r.version || "V1",
          revisions: isDrawing ? sortedRevisions(r).length : Math.max(asList(r.versions).length, 1),
          status: r.status || (isDrawing ? "Draft" : "draft"),
          updatedAt: at(isDrawing ? rev || r : r),
          hasFile: isDrawing ? !!rev : !!(r.storageFilename || r.url),
          record: r,
        };
      })
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }, [types, typeIds, typeById, isDrawing, docsQ.data, drawingsQ.data, projectId, byId, cfg.name]);

  const q = isDrawing ? drawingsQ : docsQ;
  return { rows, types, isLoading: typesLoading || q.isLoading, isFetching: q.isFetching, refetch: q.refetch };
}

async function saveBlob(path, fallbackName) {
  const res = await authenticatedFetch(`${API_URL}${path}`);
  if (!res.ok) {
    let msg = "Could not download the file.";
    try {
      msg = (await res.json())?.message || msg;
    } catch {
      /* not json */
    }
    throw new Error(msg);
  }
  const disposition = res.headers.get("content-disposition") || "";
  const name = /filename="?([^"]+)"?/i.exec(disposition)?.[1] || fallbackName || "download";
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Download the latest file of a row (document or drawing). */
export async function downloadRow(row) {
  try {
    if (row.kind === "drawing") {
      const rev = latestRevision(row.record);
      if (!rev) throw new Error("No file uploaded yet.");
      await saveBlob(`/drawings/${row.id}/revisions/${rev.id}/download`, rev.filename);
    } else {
      await saveBlob(`/documents/${row.id}/download`, row.record?.filename || row.title);
    }
  } catch (e) {
    toast.error(e.message);
  }
}

/** Open the latest file of a row (document or drawing) in a new tab. */
export function openRow(row) {
  if (row.kind === "drawing") {
    const rev = latestRevision(row.record);
    if (!rev) return toast.error("No file uploaded yet.");
    return openInNewTab(`/drawings/${row.id}/revisions/${rev.id}/download`, { title: rev.filename });
  }
  return openInNewTab(`/documents/${row.id}/download`, { title: row.record?.filename || row.title });
}

/** Open one earlier version of an uploaded document in a new tab. */
export function openDocumentVersion(documentId, version) {
  return openInNewTab(`/documents/${documentId}/versions/${version.id}/download`, { title: version.filename });
}

export async function downloadDocumentVersion(documentId, version) {
  try {
    await saveBlob(`/documents/${documentId}/versions/${version.id}/download`, version.filename);
  } catch (e) {
    toast.error(e.message);
  }
}

export const viewPathFor = (row) => (row.kind === "drawing" ? `/design-studio/${row.id}` : `/projects/documents/${row.id}`);

export function formatDay(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
