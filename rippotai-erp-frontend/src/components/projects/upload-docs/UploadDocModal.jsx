// Upload a file for an upload-type document. If the project already has that
// document, the file becomes its next version (V2, V3…); otherwise V1 is created.
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CloudUpload } from "lucide-react";
import { Button, Field, SelectInput, TextInput } from "@/components/inos";
import { Modal } from "@/components/projects/_projects-ui";
import { useAddDocumentVersionMutation, useCreateDocumentMutation } from "@/api/documents/document.api";
import DrawingUploadPage from "@/pages/design-studio/DrawingUploadPage";
import { useProjectsList } from "./uploadDocs";

const MAX = 500 * 1024 * 1024;

export default function UploadDocModal({ cfg, types, rows = [], projectId: fixedProject, typeId: fixedType, onClose }) {
  const { projects, byId } = useProjectsList();
  const [projectId, setProjectId] = useState(fixedProject || "");
  const [chosenType, setTypeId] = useState(fixedType || "");
  // Types may arrive after the modal opens; a single type is picked automatically.
  const typeId = chosenType || fixedType || (types.length === 1 ? types[0].id : "");
  const [file, setFile] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [createDocument] = useCreateDocumentMutation();
  const [addVersion] = useAddDocumentVersionMutation();
  const type = types.find((t) => t.id === typeId);
  const project = byId[projectId];
  const existing = useMemo(
    () => rows.find((r) => r.kind === "document" && r.projectId === projectId && r.typeId === typeId),
    [rows, projectId, typeId],
  );
  const isDrawing = cfg.target === "DRAWING";

  const submit = async () => {
    if (!projectId || !typeId || !file) return;
    if (file.size > MAX) {
      toast.error("File size cannot exceed 500 MB");
      return;
    }
    setBusy(true);
    try {
      if (existing) {
        await addVersion({ documentId: existing.id, data: { remarks: remarks.trim() }, file }).unwrap();
        toast.success(`${type?.name || cfg.name} updated to a new version`);
      } else {
        await createDocument({
          data: {
            projectId,
            documentTypeId: typeId,
            title: `${type?.name || cfg.name} - ${project?.name || "Project"}`,
            visibility: "internal",
            remarks: remarks.trim(),
            docType: "upload",
          },
          file,
        }).unwrap();
        toast.success(`${type?.name || cfg.name} uploaded`);
      }
      onClose(true);
    } catch (e) {
      toast.error(e?.data?.message || e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const pickers = (
    <div className="inos-form-grid">
      <Field label="Project" required>
        <SelectInput value={projectId} disabled={!!fixedProject} onChange={(e) => setProjectId(e.target.value)} data-testid="upload-doc-project">
          <option value="">Select project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectInput>
      </Field>
      {types.length > 1 && (
        <Field label="Document" required>
          <SelectInput value={typeId} disabled={!!fixedType} onChange={(e) => setTypeId(e.target.value)} data-testid="upload-doc-type">
            <option value="">Select</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </SelectInput>
        </Field>
      )}
    </div>
  );

  if (isDrawing) {
    const ready = projectId && type;
    return (
      <Modal open onClose={() => !busy && onClose(false)} title={`Upload ${cfg.name}`} width={ready ? 1100 : 560} testId="upload-doc-modal">
        {pickers}
        {ready && (
          <div style={{ marginTop: 16 }}>
            <DrawingUploadPage
              key={`${projectId}:${typeId}`}
              embedded
              target={{ projectId, projectName: project?.name, documentTypeId: typeId, name: type.name, phaseCode: type.phaseCode, phaseName: type.phaseName, targetType: "DRAWING" }}
              onCancel={() => onClose(false)}
              onBusyChange={setBusy}
              onUploaded={() => onClose(true)}
            />
          </div>
        )}
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={() => !busy && onClose(false)}
      title={`Upload ${type?.name || cfg.name}`}
      width={560}
      testId="upload-doc-modal"
      footer={
        <>
          <Button variant="ghost" onClick={() => onClose(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" icon={CloudUpload} onClick={submit} loading={busy} disabled={!projectId || !typeId || !file} data-testid="upload-doc-submit">
            {existing ? `Upload as ${nextLabel(existing.version)}` : "Upload"}
          </Button>
        </>
      }
    >
      {pickers}
      <Field label="File" required>
        <input type="file" className="inos-input" onChange={(e) => setFile(e.target.files?.[0] || null)} data-testid="upload-doc-file" />
      </Field>
      <Field label="Note" optional>
        <TextInput value={remarks} onChange={(e) => setRemarks(e.target.value)} maxLength={500} />
      </Field>
    </Modal>
  );
}

function nextLabel(v) {
  const m = /^V(\d+)$/i.exec(String(v || ""));
  return m ? `V${Number(m[1]) + 1}` : "new version";
}
