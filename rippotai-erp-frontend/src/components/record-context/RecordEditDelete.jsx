// Edit + Delete actions for an uploaded document or drawing, used on the
// document / drawing view pages (Pre Design and every other upload).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CloudUpload, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/inos';
import { Modal } from '@/components/projects/_projects-ui';
import { useDeleteDocumentMutation } from '@/api/documents/document.api';
import { useDeleteDrawingMutation } from '@/api/documents/drawing.api';
import FileUploadForm from '@/components/projects/upload-docs/FileUploadForm';
import { cfgForRecord } from '@/components/projects/upload-docs/uploadDocs';
import { useDocumentAccess } from '@/hooks/use-permission';

const errText = (e, fallback) =>
  (e?.data?.message && [].concat(e.data.message).join(', ')) || e?.message || fallback;

/** Edit details and/or upload a new version — the same form as Upload. */
function EditModal({ kind, record, focusFile, onClose }) {
  const [busy, setBusy] = useState(false);
  const cfg = cfgForRecord(kind, record);
  return (
    <Modal
      open
      onClose={() => !busy && onClose()}
      title={focusFile ? `Upload new version — ${record.title || cfg.name}` : `Edit ${record.title || cfg.name}`}
      width={680}
      testId={kind === 'drawing' ? 'edit-drawing-modal' : 'edit-document-modal'}
    >
      <FileUploadForm
        cfg={cfg}
        record={record}
        focusFile={focusFile}
        onBusyChange={setBusy}
        onCancel={onClose}
        onDone={onClose}
      />
    </Modal>
  );
}

function DeleteModal({ kind, record, backTo, onClose }) {
  const nav = useNavigate();
  const [deleteDocument, d1] = useDeleteDocumentMutation();
  const [deleteDrawing, d2] = useDeleteDrawingMutation();
  const busy = d1.isLoading || d2.isLoading;
  const name = record.title || (kind === 'drawing' ? 'this drawing' : 'this document');

  const remove = async () => {
    try {
      await (kind === 'drawing' ? deleteDrawing(record.id) : deleteDocument(record.id)).unwrap();
      toast.success(`${kind === 'drawing' ? 'Drawing' : 'Document'} deleted`);
      onClose();
      if (backTo) nav(backTo);
      else if (window.history.length > 1) nav(-1);
      else nav(record.projectId ? `/projects/${record.projectId}?tab=documents` : '/projects');
    } catch (e) {
      toast.error(errText(e, 'Could not delete'));
    }
  };

  return (
    <Modal
      open
      onClose={() => !busy && onClose()}
      title={`Delete ${kind}?`}
      width={460}
      testId="delete-record-modal"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" icon={Trash2} onClick={remove} loading={busy}>
            Delete
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, lineHeight: 1.5 }}>
        <strong>{name}</strong> and all its {kind === 'drawing' ? 'revisions' : 'versions'} will be
        removed from the project. This can’t be undone.
      </p>
    </Modal>
  );
}

/** Edit · Delete · Upload new version for a document or drawing page header (one shared form). */
export default function RecordEditDelete({ kind, record, backTo, withNewVersion = true }) {
  const access = useDocumentAccess(kind === 'drawing' ? 'drawings' : 'documents');
  const [open, setOpen] = useState(null);
  if (!record?.id) return null;
  return (
    <>
      {(access.canEdit || access.canCreate) && (
        <Button
          variant="secondary"
          icon={Pencil}
          onClick={() => setOpen('edit')}
          data-testid="record-edit"
        >
          Edit
        </Button>
      )}
      {access.canDelete && (
        <Button
          variant="ghost"
          icon={Trash2}
          onClick={() => setOpen('delete')}
          data-testid="record-delete"
        >
          Delete
        </Button>
      )}
      {withNewVersion && (access.canEdit || access.canCreate) && (
        <Button variant="primary" icon={CloudUpload} onClick={() => setOpen('version')} data-testid="record-new-version">
          Upload new version
        </Button>
      )}
      {(open === 'edit' || open === 'version') && (
        <EditModal kind={kind} record={record} focusFile={open === 'version'} onClose={() => setOpen(null)} />
      )}
      {open === 'delete' && (
        <DeleteModal kind={kind} record={record} backTo={backTo} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
