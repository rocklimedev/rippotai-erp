// Upload a drawing or a document file — the same form (FileUploadForm) for every
// upload-type document (Pre Design, Contract, Agreement, Design, Material Palette,
// Tender / Working Drawings).
import { useState } from 'react';
import { Modal } from '@/components/projects/_projects-ui';
import FileUploadForm from './FileUploadForm';

export default function UploadDocModal({ cfg, types, rows = [], projectId, typeId, onClose }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open
      onClose={() => !busy && onClose(false)}
      title={`Upload ${cfg.name}`}
      width={680}
      testId="upload-doc-modal"
    >
      <FileUploadForm
        cfg={cfg}
        types={types}
        rows={rows}
        projectId={projectId}
        typeId={typeId}
        onBusyChange={setBusy}
        onCancel={() => onClose(false)}
        onDone={() => onClose(true)}
      />
    </Modal>
  );
}
