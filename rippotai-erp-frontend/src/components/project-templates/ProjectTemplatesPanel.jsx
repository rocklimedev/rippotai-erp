import { useEffect, useRef, useState } from "react";
import { Download, FileText, Sparkles } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Pill,
  TextInput,
} from "@/components/inos";
import { Modal } from "@/components/projects/_projects-ui";
import { DocumentPreview, usePdfDownload } from "@/components/print-document";
import { TEMPLATES } from "./templates.config";

const isBlank = (v) => !String(v ?? "").trim();

/* ---------- Modal 1: shown ONLY when data is missing ---------- */
function CompleteDetailsModal({ template, missing, onCancel, onSubmit }) {
  const [draft, setDraft] = useState({});
  const complete = missing.every((f) => !isBlank(draft[f.key]));
  return (
    <Modal
      open
      onClose={onCancel}
      title="Complete the details"
      description={`“${template.name}” needs the following before it can be generated. Everything else was filled from the project.`}
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!complete}
            onClick={() => onSubmit(draft)}
          >
            Continue
          </Button>
        </>
      }
    >
      <div style={{ display: "grid", gap: 14 }}>
        {missing.map((f) => (
          <Field key={f.key} label={f.label}>
            <TextInput
              type={f.inputType || "text"}
              maxLength={f.maxLength}
              value={draft[f.key] || ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, [f.key]: e.target.value }))
              }
            />
          </Field>
        ))}
      </div>
    </Modal>
  );
}

/* ---------- Modal 2: full generated document, read-only ---------- */
function PreviewModal({ template, values, project, onClose }) {
  const ref = useRef(null);
  const { download, downloading } = usePdfDownload(ref);
  const { Document } = template;
  return (
    <Modal
      open
      onClose={onClose}
      title={template.name}
      description="Generated from this project's details. Signatures and signing dates stay blank."
      width={920}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            icon={Download}
            disabled={downloading}
            onClick={() =>
              download(template.fileName(project), template.pdfOptions(project))
            }
          >
            {downloading ? "Preparing PDF…" : "Download PDF"}
          </Button>
        </>
      }
    >
      <DocumentPreview>
        <Document ref={ref} values={values} />
      </DocumentPreview>
    </Modal>
  );
}

/* ---------- Direct download of a generated template (no preview) ---------- */
function BackgroundExport({ template, values, project, onDone }) {
  const ref = useRef(null);
  const started = useRef(false);
  const { download } = usePdfDownload(ref);
  const { Document } = template;
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t = setTimeout(() => {
      Promise.resolve(
        download(template.fileName(project), template.pdfOptions(project)),
      ).finally(onDone);
    }, 150); // let fonts/logo paint
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }}
      aria-hidden
    >
      <Document ref={ref} values={values} />
    </div>
  );
}

function downloadStatic(template) {
  const a = document.createElement("a");
  a.href = template.fileUrl;
  a.download = template.fileName?.() || "";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ---------- Panel ---------- */
export default function ProjectTemplatesPanel({ project }) {
  const [overrides, setOverrides] = useState({}); // { [templateId]: { key: value } }
  const [flow, setFlow] = useState(null); // { template, action, stage: "collect" | "preview" | "export" }

  const valuesFor = (t) => ({
    ...t.getValues(project),
    ...(overrides[t.id] || {}),
  });
  const missingFor = (t) =>
    t.fields.filter((f) => f.required && isBlank(valuesFor(t)[f.key]));

  const proceed = (template, action) => {
    if (action === "generate")
      return setFlow({ template, action, stage: "preview" });
    return setFlow({ template, action, stage: "export" });
  };

  const start = (template, action) => {
    if (template.type === "static") return downloadStatic(template);
    if (missingFor(template).length)
      return setFlow({ template, action, stage: "collect" });
    proceed(template, action);
  };

  const active = flow?.template;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card
        flush
        title="Templates"
        subtitle="Generate a filled document from this project, or download a ready-made form."
      >
        {TEMPLATES.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No templates yet"
            text="Templates added to the registry will show up here."
          />
        ) : (
          <div className="pj-list">
            {TEMPLATES.map((t) => (
              <div className="pj-list-item" key={t.id}>
                <span className="inos-icon-tile inos-icon-tile--sm">
                  <FileText aria-hidden />
                </span>
                <div className="pj-list-item__main">
                  <div className="pj-list-item__title">{t.name}</div>
                  <div className="pj-list-item__sub">{t.description}</div>
                </div>
                <Pill
                  tone={t.type === "generated" ? "brand" : "mute"}
                  size="sm"
                  dot={false}
                >
                  {t.type === "generated" ? "Auto-filled" : "Ready PDF"}
                </Pill>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Sparkles}
                  disabled={t.type === "static"}
                  title={
                    t.type === "static"
                      ? "This template is a ready-made PDF"
                      : "Preview the generated document"
                  }
                  onClick={() => start(t, "generate")}
                >
                  Generate
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Download}
                  onClick={() => start(t, "download")}
                >
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {flow?.stage === "collect" && (
        <CompleteDetailsModal
          template={active}
          missing={missingFor(active)}
          onCancel={() => setFlow(null)}
          onSubmit={(draft) => {
            setOverrides((o) => ({
              ...o,
              [active.id]: { ...(o[active.id] || {}), ...draft },
            }));
            proceed(active, flow.action);
          }}
        />
      )}

      {flow?.stage === "preview" && (
        <PreviewModal
          template={active}
          values={valuesFor(active)}
          project={project}
          onClose={() => setFlow(null)}
        />
      )}

      {flow?.stage === "export" && (
        <BackgroundExport
          template={active}
          values={valuesFor(active)}
          project={project}
          onDone={() => setFlow(null)}
        />
      )}
    </div>
  );
}
