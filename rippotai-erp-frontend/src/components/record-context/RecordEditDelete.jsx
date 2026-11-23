// Edit + Delete actions for an uploaded document or drawing, used on the
// document / drawing view pages (Pre Design and every other upload).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import { Button, Field, SelectInput, TextArea, TextInput } from '@/components/inos';
import { Modal } from '@/components/projects/_projects-ui';
import {
  useDeleteDocumentMutation,
  useReplaceDocumentFileMutation,
  useUpdateDocumentMutation,
} from '@/api/documents/document.api';
import { useDeleteDrawingMutation, useUpdateDrawingMutation } from '@/api/documents/drawing.api';
import { useGetUsersQuery } from '@/api/users/user.api';
import { useDocumentAccess } from '@/hooks/use-permission';

const errText = (e, fallback) =>
  (e?.data?.message && [].concat(e.data.message).join(', ')) || e?.message || fallback;

function EditDocumentModal({ document, onClose }) {
  const [title, setTitle] = useState(document.title || '');
  const [remarks, setRemarks] = useState(document.remarks || '');
  const [file, setFile] = useState(null);
  const [update, { isLoading: saving }] = useUpdateDocumentMutation();
  const [replace, { isLoading: replacing }] = useReplaceDocumentFileMutation();
  const busy = saving || replacing;

  const save = async () => {
    if (!title.trim()) return toast.error('Name is required');
    try {
      await update({
        id: document.id,
        data: { title: title.trim(), remarks: remarks.trim() },
      }).unwrap();
      if (file) await replace({ id: document.id, file }).unwrap();
      toast.success('Document updated');
      onClose();
    } catch (e) {
      toast.error(errText(e, 'Could not save the changes'));
    }
  };

  return (
    <Modal
      open
      onClose={() => !busy && onClose()}
      title="Edit document"
      width={520}
      testId="edit-document-modal"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} loading={busy}>
            Save changes
          </Button>
        </>
      }
    >
      <Field label="Name" required>
        <TextInput value={title} maxLength={255} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field
        label="Replace file"
        optional
        hint="Leave empty to keep the current file. Use “Upload new version” to keep history."
      >
        <input
          type="file"
          className="inos-input"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </Field>
      <Field label="Notes" optional>
        <TextArea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </Field>
    </Modal>
  );
}

function EditDrawingModal({ drawing, onClose }) {
  const { data: users = [] } = useGetUsersQuery({});
  const userList = Array.isArray(users) ? users : users?.data || [];
  const [form, setForm] = useState({
    title: drawing.title || '',
    drawnBy: drawing.drawnBy || '',
    checkedBy: drawing.checkedBy || '',
    remarks: drawing.remarks || '',
  });
  const [update, { isLoading }] = useUpdateDrawingMutation();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.title.trim()) return toast.error('Name is required');
    try {
      await update({
        id: drawing.id,
        data: {
          title: form.title.trim(),
          remarks: form.remarks.trim(),
          ...(form.drawnBy ? { drawnBy: form.drawnBy } : {}),
          ...(form.checkedBy ? { checkedBy: form.checkedBy } : {}),
        },
      }).unwrap();
      toast.success('Drawing updated');
      onClose();
    } catch (e) {
      toast.error(errText(e, 'Could not save the changes'));
    }
  };

  const people = (k) => (
    <SelectInput value={form[k]} onChange={set(k)}>
      <option value="">—</option>
      {userList.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name || u.email}
        </option>
      ))}
    </SelectInput>
  );

  return (
    <Modal
      open
      onClose={() => !isLoading && onClose()}
      title="Edit drawing"
      width={520}
      testId="edit-drawing-modal"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} loading={isLoading}>
            Save changes
          </Button>
        </>
      }
    >
      <Field label="Document name" required>
        <TextInput value={form.title} maxLength={255} onChange={set('title')} />
      </Field>
      <div className="inos-form-grid">
        <Field label="Drawn by">{people('drawnBy')}</Field>
        <Field label="Checked by">{people('checkedBy')}</Field>
      </div>
      <Field label="Notes" optional>
        <TextArea rows={3} value={form.remarks} onChange={set('remarks')} />
      </Field>
    </Modal>
  );
}

function DeleteModal({ kind, record, onClose }) {
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
      if (window.history.length > 1) nav(-1);
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

/** Edit + Delete buttons for a document or drawing view page header. */
export default function RecordEditDelete({ kind, record }) {
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
      {open === 'edit' &&
        (kind === 'drawing' ? (
          <EditDrawingModal drawing={record} onClose={() => setOpen(null)} />
        ) : (
          <EditDocumentModal document={record} onClose={() => setOpen(null)} />
        ))}
      {open === 'delete' && (
        <DeleteModal kind={kind} record={record} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
