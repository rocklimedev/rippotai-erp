import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { CloudUpload, FileUp } from 'lucide-react';
import { Button, Field, SelectInput, TextArea, TextInput } from '@/components/inos';
import { useAuth } from '@/context/AuthContext';
import {
  drawingApi,
  useCreateDrawingMutation,
  useGetDrawingsQuery,
  useUpdateDrawingMutation,
} from '@/api/documents/drawing.api';
import { useGetUsersQuery } from '@/api/users/user.api';
import {
  ACCEPT,
  ACCEPT_EXT,
  errMessage,
  extOf,
  formatBytes,
  maxSequence,
  pad3,
  projectCode,
  uploadRevision,
} from '@/pages/design-studio/drawingUtils';
import { asList, useProjectsList } from './uploadDocs';
import './simple-drawing-upload.css';

const MAX_BYTES = 500 * 1024 * 1024;
const today = () => new Date().toISOString().slice(0, 10);
const norm = (s) =>
  String(s || '')
    .trim()
    .toLowerCase();

export default function SimpleDrawingUpload({
  cfg,
  types,
  rows = [],
  projectId: fixedProject,
  typeId: fixedType,
  onBusyChange,
  onDone,
  onCancel,
}) {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { projects, byId } = useProjectsList();
  const { data: usersData = [] } = useGetUsersQuery({});
  const users = asList(usersData);
  // A single-type slot (Pre Design layouts) keeps its name; phase lists (Tender / Working) are editable.
  const fixedTypeRow = types.length === 1 ? types[0] : null;
  const initialType = types.find((t) => t.id === fixedType);

  const [projectId, setProjectId] = useState(fixedProject || '');
  const [nameInput, setName] = useState(null);
  const name = nameInput ?? (fixedTypeRow?.name || initialType?.name || '');
  const [issueDate, setIssueDate] = useState(today());
  const [drawnBy, setDrawnBy] = useState(user?.id || '');
  const [checkedBy, setCheckedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [tried, setTried] = useState(false);

  const { data: projectDrawingsData } = useGetDrawingsQuery({ projectId }, { skip: !projectId });
  const projectDrawings = useMemo(
    () => asList(projectDrawingsData).filter((d) => d.projectId === projectId),
    [projectDrawingsData, projectId],
  );
  const [createDrawing] = useCreateDrawingMutation();
  const [updateDrawing] = useUpdateDrawingMutation();
  const busy = progress !== null;

  // Default names (the phase's drawing list) + names already used in this project for this document.
  const suggestions = useMemo(() => {
    const seen = new Set();
    const out = [];
    const add = (n) => {
      const k = norm(n);
      if (n && !seen.has(k)) {
        seen.add(k);
        out.push(n);
      }
    };
    types.forEach((t) => add(t.name));
    rows
      .filter((r) => !projectId || r.projectId === projectId)
      .forEach((r) => add(r.record?.title));
    return out;
  }, [types, rows, projectId]);

  const matchedType = fixedTypeRow || types.find((t) => norm(t.name) === norm(name)) || null;
  const existing = useMemo(() => {
    if (!projectId || !name.trim()) return null;
    return (
      projectDrawings.find((d) =>
        matchedType
          ? (d.documentTypeId || d.document_type_id) === matchedType.id
          : !d.documentTypeId && norm(d.title) === norm(name),
      ) || null
    );
  }, [projectDrawings, projectId, name, matchedType]);

  const pickFile = (f) => {
    if (!f) return;
    if (!ACCEPT_EXT.includes(extOf(f.name)))
      return toast.error('Use a PDF, DWG, DXF, JPG or PNG file');
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
    const code =
      Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      projectCode(byId[projectId]?.name);
    const prefix = `${code}-`;
    return `${prefix}${pad3(maxSequence(numbers, prefix) + 1)}`;
  };

  const submit = async () => {
    setTried(true);
    if (!projectId || !name.trim() || !file) return;
    setProgress(0);
    onBusyChange?.(true);
    try {
      let drawingId = existing?.id;
      const people = { ...(drawnBy ? { drawnBy } : {}), ...(checkedBy ? { checkedBy } : {}) };
      if (!drawingId) {
        const created = await createDrawing({
          projectId,
          ...(matchedType ? { documentTypeId: matchedType.id } : {}),
          title: name.trim(),
          drawingNumber: nextNumber(),
          phaseCode: matchedType?.phaseCode || cfg.phaseCode || types[0]?.phaseCode,
          ...(notes.trim() ? { remarks: notes.trim() } : {}),
          ...people,
        }).unwrap();
        drawingId = created.id;
      } else if (Object.keys(people).length || norm(existing.title) !== norm(name)) {
        await updateDrawing({ id: drawingId, data: { title: name.trim(), ...people } }).unwrap();
      }
      await uploadRevision({
        drawingId,
        file,
        data: {
          issueDate,
          remarks: notes.trim(),
          uploadedBy: user?.id,
          uploadedByName: user?.name,
        },
        onProgress: setProgress,
      });
      dispatch(
        drawingApi.util.invalidateTags([
          'Drawing',
          'DrawingRevision',
          'DocumentRequirement',
          'ProjectDocumentPhase',
          'DocumentDashboard',
          'CommandCenterKpis',
          'CommandCenterPortfolio',
          'CommandCenterProjectPhases',
          'CommandCenterDocuments',
        ]),
      );
      toast.success(
        existing ? `${name.trim()} — new revision uploaded` : `${name.trim()} uploaded`,
      );
      onDone?.();
    } catch (e) {
      toast.error(errMessage(e, 'Upload failed'));
    } finally {
      setProgress(null);
      onBusyChange?.(false);
    }
  };

  const listId = `drawing-names-${cfg.key}`;
  return (
    <div className="sdu" data-testid="simple-drawing-upload">
      <div className="inos-form-grid">
        <Field label="Project" required error={tried && !projectId ? 'Choose a project' : null}>
          <SelectInput
            value={projectId}
            disabled={!!fixedProject || busy}
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
        <Field
          label="Document name"
          required
          error={tried && !name.trim() ? 'Enter a document name' : null}
          hint={
            fixedTypeRow
              ? null
              : existing
                ? 'Already in this project — uploads as a new revision.'
                : matchedType
                  ? 'Default drawing name.'
                  : name.trim()
                    ? 'New name — saved with this drawing.'
                    : 'Pick a default name or type a new one.'
          }
        >
          <TextInput
            list={fixedTypeRow ? undefined : listId}
            value={name}
            maxLength={255}
            disabled={busy}
            placeholder="e.g. Tender – Electrical"
            onChange={(e) => setName(e.target.value)}
            data-testid="sdu-name"
          />
          {!fixedTypeRow && (
            <datalist id={listId}>
              {suggestions.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          )}
        </Field>
        <Field label="Issued date">
          <TextInput
            type="date"
            value={issueDate}
            disabled={busy}
            onChange={(e) => setIssueDate(e.target.value)}
          />
        </Field>
        <span />
        <Field label="Drawn by">
          <SelectInput value={drawnBy} disabled={busy} onChange={(e) => setDrawnBy(e.target.value)}>
            <option value="">—</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Checked by">
          <SelectInput
            value={checkedBy}
            disabled={busy}
            onChange={(e) => setCheckedBy(e.target.value)}
          >
            <option value="">—</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      <Field label="Notes" optional>
        <TextArea
          rows={2}
          value={notes}
          disabled={busy}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
      <Field label="File" required error={tried && !file ? 'Choose a file' : null}>
        <label className={`sdu-file ${file ? 'has-file' : ''}`}>
          <FileUp size={18} aria-hidden />
          <span className="sdu-file__name">
            {file
              ? `${file.name} · ${formatBytes(file.size)}`
              : 'Choose a PDF, DWG, DXF, JPG or PNG'}
          </span>
          <input
            type="file"
            hidden
            accept={ACCEPT}
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
          icon={CloudUpload}
          onClick={submit}
          loading={busy}
          data-testid="sdu-submit"
        >
          {busy ? `Uploading ${progress}%` : existing ? 'Upload new revision' : 'Upload drawing'}
        </Button>
      </div>
    </div>
  );
}
