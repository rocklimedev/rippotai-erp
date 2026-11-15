// List page of one upload-type document (Contract, Agreement, Design, Material
// Palette, Tender / Working Drawings) in the shared DocumentListPage format.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import DocumentListPage from "@/components/doc-list/DocumentListPage";
import { useDeleteDocumentMutation } from "@/api/documents/document.api";
import { useDeleteDrawingMutation } from "@/api/documents/drawing.api";
import { UPLOAD_DOCUMENTS } from "@/config/projectDocuments";
import { useUploadRows, viewPathFor } from "./uploadDocs";
import UploadDocModal from "./UploadDocModal";

const versionNumber = (row) => {
  if (row.kind === "drawing") return row.revisions || 1;
  const m = /(\d+)/.exec(String(row.version || ""));
  return m ? Number(m[1]) : 1;
};

export default function UploadDocListPage({ docKey, actions }) {
  const cfg = UPLOAD_DOCUMENTS[docKey];
  const nav = useNavigate();
  const [upload, setUpload] = useState(null);
  const { rows, types, isLoading } = useUploadRows(cfg);
  const [deleteDocument] = useDeleteDocumentMutation();
  const [deleteDrawing] = useDeleteDrawingMutation();
  const isDrawing = cfg.target === "DRAWING";

  return (
    <>
      <DocumentListPage
        type={isDrawing ? "drawing" : "document"}
        title={cfg.name}
        icon={FileText}
        rows={rows}
        loading={isLoading}
        getRow={(r) => ({
          id: r.id,
          name: isDrawing || types.length > 1 ? r.typeName : cfg.name,
          code: (isDrawing ? r.record?.drawingNumber ?? r.record?.drawing_number : r.record?.docNo ?? r.record?.doc_no) || null,
          projectId: r.projectId,
          projectName: r.projectName,
          version: versionNumber(r),
          status: r.status,
          updatedAt: r.updatedAt,
          search: r.title,
        })}
        onView={(row) => nav(viewPathFor(row.raw))}
        // Edit = upload a new version (documents) / add a revision on the drawing page.
        onEdit={(row) =>
          row.raw.kind === "drawing" ? nav(viewPathFor(row.raw)) : setUpload({ projectId: row.raw.projectId, typeId: row.raw.typeId })
        }
        onDelete={(row) => (row.raw.kind === "drawing" ? deleteDrawing(row.id).unwrap() : deleteDocument(row.id).unwrap())}
        onCreate={() => setUpload({})}
        createLabel="Upload"
        headerActions={actions}
      />
      {upload && (
        <UploadDocModal
          cfg={cfg}
          types={types}
          rows={rows}
          projectId={upload.projectId}
          typeId={upload.typeId}
          onClose={() => setUpload(null)}
        />
      )}
    </>
  );
}
