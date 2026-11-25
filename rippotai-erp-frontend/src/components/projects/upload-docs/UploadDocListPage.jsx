// List page of one upload-type document (Contract, Agreement, Design, Material
// Palette, Tender / Working Drawings) in the shared DocumentListPage format.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileStack, FileText } from 'lucide-react';
import { Button } from '@/components/inos';
import DocumentListPage from '@/components/doc-list/DocumentListPage';
import { useDeleteDocumentMutation } from '@/api/documents/document.api';
import { useDeleteDrawingMutation } from '@/api/documents/drawing.api';
import { UPLOAD_DOCUMENTS } from '@/config/projectDocuments';
import { useUploadRows, viewPathFor } from './uploadDocs';
import UploadDocModal from './UploadDocModal';
import DocketModal from './DocketModal';
import './simple-drawing-upload.css';

const versionNumber = (row) => {
  if (row.kind === 'drawing') return row.revisions || 1;
  const m = /(\d+)/.exec(String(row.version || ''));
  return m ? Number(m[1]) : 1;
};

export default function UploadDocListPage({ docKey, actions }) {
  const cfg = UPLOAD_DOCUMENTS[docKey];
  const nav = useNavigate();
  const [upload, setUpload] = useState(null);
  const [docket, setDocket] = useState(false);
  const { rows, types, isLoading } = useUploadRows(cfg);
  const [deleteDocument] = useDeleteDocumentMutation();
  const [deleteDrawing] = useDeleteDrawingMutation();
  const isDrawing = cfg.target === 'DRAWING';

  return (
    <>
      <DocumentListPage
        type={isDrawing ? 'drawing' : 'document'}
        title={cfg.name}
        icon={FileText}
        rows={rows}
        loading={isLoading}
        getRow={(r) => ({
          id: r.id,
          name: isDrawing ? [r.typeName, r.record?.title].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' — ') || r.title : types.length > 1 ? r.typeName : cfg.name,
          code:
            (isDrawing
              ? (r.record?.drawingNumber ?? r.record?.drawing_number)
              : (r.record?.docNo ?? r.record?.doc_no)) || null,
          projectId: r.projectId,
          projectName: r.projectName,
          version: versionNumber(r),
          status: r.status,
          updatedAt: r.updatedAt,
          search: [r.typeName, r.title].filter(Boolean).join(' '),
          group: isDrawing ? r.typeName || r.record?.title || null : null,
        })}
        onView={(row) => nav(viewPathFor(row.raw, cfg.listPath))}
        // Edit opens the record page (same form for edit + new version).
        onEdit={(row) => nav(viewPathFor(row.raw, cfg.listPath))}
        onDelete={(row) =>
          row.raw.kind === 'drawing'
            ? deleteDrawing(row.id).unwrap()
            : deleteDocument(row.id).unwrap()
        }
        onCreate={() => setUpload({})}
        createLabel="Upload"
        // Design and drawing lists hold several documents per project: show which one.
        nameColumn={isDrawing ? 'Drawing' : cfg.phaseCode ? 'Document' : undefined}
        groupFilter={isDrawing ? 'All drawings' : undefined}
        headerActions={
          <>
            {isDrawing && cfg.phaseCode && (
              <Button variant="secondary" icon={FileStack} onClick={() => setDocket(true)} data-testid="docket-open">
                Single PDF
              </Button>
            )}
            {actions}
          </>
        }
      />
      {docket && <DocketModal cfg={cfg} rows={rows} onClose={() => setDocket(false)} />}
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
