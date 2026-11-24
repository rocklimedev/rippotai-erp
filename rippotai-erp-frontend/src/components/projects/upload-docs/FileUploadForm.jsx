// ONE form to upload or edit a drawing or a design / project document file.
// Same fields everywhere — Upload, Edit and "Upload new version":
//   Project · Category (default names, or add a new name) · Name · Issued date
//   · Drawn by · Checked by · Notes · File
//
// Drawings in Tender / Working Drawings: every upload is its own drawing
// (starts at V0). A new version of a drawing is uploaded from that drawing
// (Edit / Upload new version → V1, V2…). Single-document slots (Contract,
// Pre Design layouts…) keep one record per project; a new file is its next version.
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { CloudUpload, FileUp, Save } from 'lucide-react';
import { Button, Field, SelectInput, TextArea, TextInput } from '@/components/inos';
import { useAuth } from '@/context/AuthContext';
import {
  drawingApi,
  useCreateDrawingMutation,
  useGetDrawingsQuery,
  useUpdateDrawingMutation,
} from '@/api/documents/drawing.api';
import {
  useAddDocumentVersionMutation,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
} from '@/api/documents/document.api';
import { useGetUsersQuery } from '@/api/users/user.api';
import {
  ACCEPT,
  ACCEPT_EXT,
  errMessage,
  extOf,
  formatBytes,
  maxSequence,
  nextRevisionLabel,
  pad3,
  projectCode,
  uploadRevision,
} from '@/pages/design-studio/drawingUtils';
import { asList, useFlowTypes, useProjectsList } from './uploadDocs';
import UploadTypePicker from './UploadTypePicker';
import './simple-drawing-upload.css';

const MAX_BYTES = 500 * 1024 * 1024;
const today = () => new Date().toISOString().slice(0, 10);
const day = (d) => (d ? String(d).slice(0, 10) : '');

const docVersionLabel = (record) => {
  const m = /(\d+)/.exec(String(record?.version || ''));
  return m ? `V${Number(m[1]) + 1}` : 'new version';
};

export default function FileUploadForm({
  cfg,
  types: typesProp,
  rows = [],
  projectId: fixedProject,
  typeId: presetType,
  record, // edit mode: the saved drawing / document
  focusFile = false,
  onBusyChange,
  onDone,
  onCancel,
}) {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const isDrawing = cfg.target === 'DRAWING';
  const editing = !!record;
  const { types: loadedTypes } = useFlowTypes(cfg);
  const types = typesProp?.length ? typesProp : loadedTypes;
  const isList = !!cfg.phaseCode; // Design / Tender / Working: categories with many records
  const singleType = !isList && types.length === 1 ? types[0] : null;

  const { projects, byId } = useProjectsList();
  const { data: usersData = [] } = useGetUsersQuery({});
  const users = asList(usersData);

  const sections = record?.sections && typeof record.sections === 'object' ? record.sections : {};
  const [projectId, setProjectId] = useState(fixedProject || record?.projectId || '');
  const [typeId, setTypeId] = useState(record?.documentTypeId || presetType || '');
  const [category, setCategory] = useState(null);
  const [nameInput, setName] = useState(editing ? record.title || '' : null);
  const [issueDate, setIssueDate] = useState(editing ? day(record.documentDate) || today() : today());
  const [drawnBy, setDrawnBy] = useState(
    editing ? (isDrawing ? record.drawnBy : sections.drawnBy) || '' : user?.id || '',
  );
  const [checkedBy, setCheckedBy] = useState(editing ? (isDrawing ? record.checkedBy : sections.checkedBy) || '' : '');
  const [notes, setNotes] = useState(editing ? record.remarks || '' : '');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [creating, setCreating] = useState(false);
  const [tried, setTried] = useState(false);
  const busy = progress !== null || creating;

  const effectiveType = types.find((t) => t.id === (typeId || singleType?.id)) || category || singleType || null;
  const defaultName = isDrawing ? '' : effectiveType?.name || cfg.name;
  const name = nameInput ?? defaultName;

  const { data: projectDrawingsData } = useGetDrawingsQuery({ projectId }, { skip: !projectId || !isDrawing });
  const projectDrawings = useMemo(
    () => asList(projectDrawingsData).filter((d) => d.projectId === projectId),
    [projectDrawingsData, projectId],
  );

  // Single-document slots: an existing record of this type becomes a new version.
  const existing = useMemo(() => {
    if (editing) return record;
    if (isList || !projectId || !effectiveType) return null;
    if (isDrawing) return projectDrawings.find((d) => (d.documentTypeId || d.document_type_id) === effectiveType.id) || null;
    return rows.find((r) => r.kind === 'document' && r.projectId === projectId && r.typeId === effectiveType.id)?.record || null;
  }, [editing, record, isList, projectId, effectiveType, isDrawing, projectDrawings, rows]);

  const [createDrawing] = useCreateDrawingMutation();
  const [updateDrawing] = useUpdateDrawingMutation();
  const [createDocument] = useCreateDocumentMutation();
  const [updateDocument] = useUpdateDocumentMutation();
  const [addVersion] = useAddDocumentVersionMutation();

  const pickFile = (f) => {
    if (!f) return;
    if (isDrawing && !ACCEPT_EXT.includes(extOf(f.name))) return toast.error('Use a PDF, DWG, DXF, JPG or PNG file');
    if (f.size > MAX_BYTES) return toast.error('File size cannot exceed 500 MB');
    setFile(f);
  };

  const nextNumber = () => {
    const numbers = projectDrawings.map((d) => String(d.drawingNumber || ''));
    const tally = {};
    numbers.forEach((n) => {
      const seg = n.split('-')[0];
      if (seg && seg.length <= 5) tally[seg] = (tally[seg] || 0) + 1;
    });
    const code = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || projectCode(byId[projectId]?.name);
    return `${code}-${pad3(maxSequence(numbers, `${code}-`) + 1)}`;
  };

  const versionLabel = isDrawing ? (existing ? nextRevisionLabel(existing) : 'V0') : existing ? docVersionLabel(existing) : 'V1';
  const fileRequired = !editing;

  const refresh = () =>
    dispatch(
      drawingApi.util.invalidateTags([
        'Drawing',
        'RecordContext',
        'DocReviews',
        'DrawingRevision',
        'Document',
        'DocumentRequirement',
        'ProjectDocumentPhase',
        'DocumentDashboard',
        'CommandCenterKpis',
        'CommandCenterPortfolio',
        'CommandCenterProjectPhases',
        'CommandCenterDocuments',
      ]),
    );

  const submit = async () => {
    setTried(true);
    const typeOk = isDrawing && isList ? !!effectiveType : true;
    if (busy || !projectId || !name.trim() || !typeOk || (fileRequired && !file)) return;
    setProgress(0);
    onBusyChange?.(true);
    const people = { ...(drawnBy ? { drawnBy } : {}), ...(checkedBy ? { checkedBy } : {}) };
    try {
      if (isDrawing) {
        let drawingId = existing?.id;
        const details = {
          title: name.trim(),
          ...(effectiveType ? { documentTypeId: effectiveType.id } : {}),
          ...(effectiveType?.name ? { discipline: effectiveType.name.slice(0, 100) } : {}),
          remarks: notes.trim() || null,
          ...people,
        };
        if (!drawingId) {
          const created = await createDrawing({
            projectId,
            ...details,
            remarks: notes.trim() || undefined,
            drawingNumber: nextNumber(),
            phaseCode: effectiveType?.phaseCode || cfg.phaseCode || types[0]?.phaseCode,
          }).unwrap();
          drawingId = created.id;
        } else {
          await updateDrawing({ id: drawingId, data: details }).unwrap();
        }
        if (file)
          await uploadRevision({
            drawingId,
            file,
            data: { issueDate, remarks: notes.trim(), uploadedBy: user?.id, uploadedByName: user?.name },
            onProgress: setProgress,
          });
      } else {
        const meta = {
          title: name.trim(),
          ...(effectiveType ? { documentTypeId: effectiveType.id } : {}),
          documentDate: issueDate || undefined,
          remarks: notes.trim(),
        };
        const sectionData = { ...sections, drawnBy: drawnBy || null, checkedBy: checkedBy || null };
        if (existing) {
          await updateDocument({ id: existing.id, data: { ...meta, sections: sectionData } }).unwrap();
          if (file) await addVersion({ documentId: existing.id, data: { remarks: notes.trim() }, file }).unwrap();
        } else {
          const created = await createDocument({
            data: { projectId, ...meta, visibility: 'internal', docType: 'upload' },
            file,
          }).unwrap();
          const id = (created?.data || created)?.id;
          if (id && (drawnBy || checkedBy)) await updateDocument({ id, data: { sections: sectionData } }).unwrap();
        }
      }
      refresh();
      toast.success(
        editing
          ? file
            ? `${name.trim()} — ${versionLabel} uploaded`
            : 'Changes saved'
          : existing
            ? `${name.trim()} — ${versionLabel} uploaded`
            : `${name.trim()} uploaded (${versionLabel})`,
      );
      onDone?.();
    } catch (e) {
      toast.error(errMessage(e, 'Could not save'));
    } finally {
      setProgress(null);
      onBusyChange?.(false);
    }
  };

  const people = (value, set, label) => (
    <Field label={label}>
      <SelectInput value={value} disabled={busy} onChange={(e) => set(e.target.value)}>
        <option value="">—</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name || u.email}
          </option>
        ))}
      </SelectInput>
    </Field>
  );

  const categoryLabel = isDrawing ? 'Drawing category' : 'Document';
  return (
    <div className="sdu" data-testid="file-upload-form">
      <div className="inos-form-grid">
        <Field label="Project" required error={tried && !projectId ? 'Choose a project' : null}>
          <SelectInput
            value={projectId}
            disabled={!!fixedProject || editing || busy}
            onChange={(e) => setProjectId(e.target.value)}
            data-testid="sdu-project"
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        {isList ? (
          <UploadTypePicker
            label={categoryLabel}
            placeholder={isDrawing ? 'Select a category (e.g. Electrical)' : 'Select a document'}
            required={isDrawing}
            types={types}
            value={effectiveType?.id || ''}
            onSelect={(id, option) => {
              setTypeId(id);
              setCategory(option || null);
              if (!isDrawing && nameInput === null) setName(null);
            }}
            phaseCode={cfg.phaseCode}
            targetType={cfg.target}
            disabled={busy}
            onCreatingChange={(v) => {
              setCreating(v);
              onBusyChange?.(v);
            }}
            testId="sdu-category"
          />
        ) : (
          <Field label={categoryLabel}>
            <TextInput value={effectiveType?.name || cfg.name} disabled />
          </Field>
        )}
        <Field
          label={isDrawing ? 'Drawing name' : 'Document name'}
          required
          error={tried && !name.trim() ? 'Enter a name' : tried && isDrawing && isList && !effectiveType ? 'Choose a drawing category' : null}
          hint={
            existing && !editing
              ? `${existing.title || cfg.name} is already uploaded — this file becomes ${versionLabel}.`
              : isDrawing && isList && !editing
                ? 'Each upload is a separate drawing (V0). Update a drawing from its own page.'
                : null
          }
        >
          <TextInput
            value={name}
            maxLength={255}
            disabled={busy}
            placeholder={isDrawing ? 'e.g. Ground floor power layout' : 'e.g. Concept Design 02'}
            onChange={(e) => setName(e.target.value)}
            data-testid="sdu-name"
          />
        </Field>
        <Field label="Issued date">
          <TextInput type="date" value={issueDate} disabled={busy} onChange={(e) => setIssueDate(e.target.value)} />
        </Field>
        {people(drawnBy, setDrawnBy, 'Drawn by')}
        {people(checkedBy, setCheckedBy, 'Checked by')}
      </div>
      <Field label="Notes" optional>
        <TextArea rows={2} value={notes} disabled={busy} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <Field
        label={editing ? `New version (${versionLabel})` : 'File'}
        required={fileRequired}
        optional={!fileRequired}
        hint={editing ? 'Leave empty to only save the details above.' : null}
        error={tried && fileRequired && !file ? 'Choose a file' : null}
      >
        <label className={`sdu-file ${file ? 'has-file' : ''} ${focusFile && !file ? 'is-focus' : ''}`}>
          <FileUp size={18} aria-hidden />
          <span className="sdu-file__name">
            {file ? `${file.name} · ${formatBytes(file.size)}` : isDrawing ? 'Choose a PDF, DWG, DXF, JPG or PNG' : 'Choose a file'}
          </span>
          <input
            type="file"
            hidden
            accept={isDrawing ? ACCEPT : undefined}
            disabled={busy}
            onChange={(e) => {
              pickFile(e.target.files?.[0]);
              e.target.value = '';
            }}
            data-testid="sdu-file"
          />
        </label>
      </Field>
      <div className="sdu-actions">
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="primary"
          icon={editing && !file ? Save : CloudUpload}
          onClick={submit}
          loading={progress !== null}
          disabled={creating}
          data-testid="sdu-submit"
        >
          {progress !== null
            ? `Uploading ${progress}%`
            : editing
              ? file
                ? `Save & upload ${versionLabel}`
                : 'Save changes'
              : existing
                ? `Upload as ${versionLabel}`
                : `Upload (${versionLabel})`}
        </Button>
      </div>
    </div>
  );
}
