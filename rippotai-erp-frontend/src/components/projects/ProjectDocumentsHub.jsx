// Project › Documents: one row per document of the INOS flow — does it exist,
// version, status, last edited, and one-click Open / Create / Upload /
// Revisions / Download.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, CloudUpload, Eye, FilePlus2, FileText, History, List } from "lucide-react";
import { Button, Card, Pill, StatusPill } from "@/components/inos";
import { useGetDocumentHubQuery } from "@/api/projects/document-hub.api";
import { useAccess } from "@/hooks/use-permission";
import { PRE_DESIGN_SLOTS, PROJECT_DOCUMENTS, UPLOAD_DOCUMENTS } from "@/config/projectDocuments";
import { routeRequirement } from "@/lib/permissions";
import { formatDay, openRow, useFlowTypes } from "./upload-docs/uploadDocs";
import { docCode } from "@/components/record-context/codes";
import UploadDocModal from "./upload-docs/UploadDocModal";
import RevisionsModal from "./upload-docs/RevisionsModal";
import "./projects-ui.css";

const IconBtn = ({ icon, label, ...rest }) => <Button variant="ghost" size="sm" icon={icon} title={label} aria-label={label} {...rest} />;

/** Document row shaped like an upload-docs row from a hub entry. */
const hubRow = (doc, entry, project) => ({
  id: entry.latest.id,
  kind: doc.target === "DRAWING" ? "drawing" : "document",
  typeId: entry.latest.document_type_id,
  typeName: doc.name,
  projectId: project.id,
  projectName: project.name,
  version: entry.latest.version || "V1",
  status: entry.latest.status,
  updatedAt: entry.latest.updated_at,
  hasFile: true,
  record: { filename: entry.latest.filename },
});

function UploadAction({ doc, project, existing, onDone }) {
  const { types } = useFlowTypes(UPLOAD_DOCUMENTS[doc.key]);
  return (
    <UploadDocModal
      cfg={UPLOAD_DOCUMENTS[doc.key]}
      types={types}
      rows={existing ? [existing] : []}
      projectId={project.id}
      typeId={existing?.typeId || (types.length === 1 ? types[0].id : undefined)}
      onClose={onDone}
    />
  );
}

export default function ProjectDocumentsHub({ project }) {
  const nav = useNavigate();
  const access = useAccess();
  const { data: hub = {}, isLoading } = useGetDocumentHubQuery(project.id);
  const [upload, setUpload] = useState(null);
  const [revisions, setRevisions] = useState(null);
  const can = (path, action = "read") => {
    const req = routeRequirement(path.split("?")[0]);
    if (!req) return true;
    return access.can(req.resource, action);
  };

  const rows = PROJECT_DOCUMENTS.map((doc) => {
    if (doc.kind === "stage") {
      const done = PRE_DESIGN_SLOTS.filter((s) => hub[s.key]?.count).length;
      const last = PRE_DESIGN_SLOTS.map((s) => hub[s.key]?.latest?.updated_at).filter(Boolean).sort().pop();
      return { doc, exists: done > 0, version: `${done}/${PRE_DESIGN_SLOTS.length}`, status: done === PRE_DESIGN_SLOTS.length ? "completed" : done ? "in_progress" : null, updated: last };
    }
    const entry = hub[doc.key] || { count: 0, latest: null };
    const latest = entry.latest;
    const version =
      doc.kind === "register" || ["design", "tender-drawings", "working-drawings"].includes(doc.key)
        ? entry.count
          ? `${entry.count} record${entry.count === 1 ? "" : "s"}`
          : "—"
        : latest?.version != null
          ? /^v/i.test(String(latest.version))
            ? String(latest.version).toUpperCase()
            : `V${latest.version}`
          : latest
            ? "V1"
            : "—";
    return { doc, entry, latest, exists: entry.count > 0, version, status: latest?.status, updated: latest?.updated_at };
  });

  const open = (r) => {
    const { doc, latest } = r;
    if (doc.kind === "stage") return nav(doc.stagePath(project.id));
    if (doc.kind === "register") return nav(doc.projectListPath(project.id));
    if (doc.kind === "upload") {
      const single = doc.typeCodes && doc.target !== "DRAWING";
      return nav(single && latest ? `/projects/documents/${latest.id}` : `${doc.listPath}?projectId=${project.id}`);
    }
    return nav(latest ? doc.viewPath(latest.id) : doc.createPath(project.id));
  };

  return (
    <Card flush title="Documents" actions={<Pill size="sm">{rows.filter((r) => r.exists).length}/{rows.length}</Pill>}>
      <div className="inos-table-wrap">
        <table className="inos-table" data-testid="project-documents-hub">
          <thead>
            <tr>
              <th>Document</th>
              <th>Version</th>
              <th>Status</th>
              <th>Last edited</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const { doc, latest, entry } = r;
              const createAllowed = doc.createPath && can(doc.createPath(project.id), "create");
              const uploadAllowed = doc.kind === "upload" && (access.can(doc.target === "DRAWING" ? "drawings" : "documents", "create") || access.can(doc.target === "DRAWING" ? "drawings" : "documents", "update"));
              const single = doc.kind === "upload" && doc.typeCodes && doc.target !== "DRAWING";
              const row = single && latest ? hubRow(doc, entry, project) : null;
              return (
                <tr key={doc.key} data-testid={`hub-row-${doc.key}`}>
                  <td>
                    <span className="pj-hub-name">
                      <span className="inos-icon-tile inos-icon-tile--sm">
                        <FileText aria-hidden />
                      </span>
                      {doc.name}
                      {r.exists && doc.kind === "form" && docCode(doc.key, null, project.code) && (
                        <span className="muted" data-testid="hub-code">
                          {docCode(doc.key, null, project.code)}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="tabular">{isLoading ? "…" : r.version}</td>
                  <td>{r.exists ? r.status ? <StatusPill status={String(r.status).toLowerCase()} size="sm" /> : <Pill tone="ok" size="sm">Created</Pill> : <Pill size="sm">Not started</Pill>}</td>
                  <td className="muted">{formatDay(r.updated)}</td>
                  <td>
                    <div className="pj-hub-actions">
                      {r.exists || doc.kind === "stage" || doc.kind === "register" || (doc.kind === "upload" && !uploadAllowed) ? (
                        <Button variant={r.exists ? "secondary" : "ghost"} size="sm" icon={Eye} onClick={() => open(r)} data-testid={`hub-open-${doc.key}`}>
                          Open
                        </Button>
                      ) : null}
                      {doc.kind === "form" && !r.exists && createAllowed && (
                        <Button variant="primary" size="sm" icon={FilePlus2} onClick={() => nav(doc.createPath(project.id))} data-testid={`hub-create-${doc.key}`}>
                          Create
                        </Button>
                      )}
                      {doc.kind === "register" && createAllowed && (
                        <IconBtn icon={FilePlus2} label={`New ${doc.name}`} onClick={() => nav(doc.createPath(project.id))} />
                      )}
                      {doc.kind === "upload" && uploadAllowed && !r.exists && (
                        <Button variant="primary" size="sm" icon={CloudUpload} onClick={() => setUpload({ doc, existing: null })} data-testid={`hub-upload-${doc.key}`}>
                          Upload
                        </Button>
                      )}
                      {doc.kind === "upload" && uploadAllowed && r.exists && (
                        <IconBtn icon={CloudUpload} label="Upload new version" onClick={() => setUpload({ doc, existing: row })} data-testid={`hub-upload-${doc.key}`} />
                      )}
                      {row && <IconBtn icon={History} label="Revisions" onClick={() => setRevisions(row)} />}
                      {row && (
                        <Button variant="ghost" size="sm" iconRight={ArrowUpRight} title="Open file in a new tab" onClick={() => openRow(row)} data-testid={`hub-file-${doc.key}`}>
                          Open
                        </Button>
                      )}
                      {doc.kind === "form" && r.exists && entry?.count > 1 && (
                        <IconBtn icon={List} label="All versions" onClick={() => nav(`${doc.listPath}?projectId=${project.id}&project_id=${project.id}`)} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {upload && <UploadAction doc={upload.doc} project={project} existing={upload.existing} onDone={() => setUpload(null)} />}
      {revisions && <RevisionsModal row={revisions} onClose={() => setRevisions(null)} />}
    </Card>
  );
}
