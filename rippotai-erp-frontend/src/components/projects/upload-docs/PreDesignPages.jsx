// Pre Design stage: Existing Layout, Proposed Layout, Pitch Presentation,
// Business Proposal and Concept Design 01 – 3D, one page per project.
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, Circle, CloudUpload, Eye, FilePlus2, FolderOpen, History } from "lucide-react";
import { Button, Card, EmptyState, Page, PageHeader, Pill, SearchInput, StatusPill, Toolbar } from "@/components/inos";
import { useGetBusinessProposalsQuery } from "@/api/documents/business-proposals.api";
import { useDocumentAccess } from "@/hooks/use-permission";
import { BUSINESS_PROPOSAL, PRE_DESIGN_SLOTS } from "@/config/projectDocuments";
import { asList, formatDay, openRow, useProjectsList, useUploadRows, viewPathFor } from "./uploadDocs";
import UploadDocModal from "./UploadDocModal";
import RevisionsModal from "./RevisionsModal";
import "@/components/projects/projects-ui.css";

const UPLOAD_SLOTS = PRE_DESIGN_SLOTS.filter((s) => s.kind === "upload");

/** Latest record per slot for one project, or for every project when projectId is empty. */
function usePreDesign(projectId) {
  const a = useUploadRows(UPLOAD_SLOTS[0], projectId);
  const b = useUploadRows(UPLOAD_SLOTS[1], projectId);
  const c = useUploadRows(UPLOAD_SLOTS[2], projectId);
  const d = useUploadRows(UPLOAD_SLOTS[3], projectId);
  const bp = useGetBusinessProposalsQuery(projectId ? { projectId } : {});
  const bySlot = useMemo(
    () => ({
      [UPLOAD_SLOTS[0].key]: a,
      [UPLOAD_SLOTS[1].key]: b,
      [UPLOAD_SLOTS[2].key]: c,
      [UPLOAD_SLOTS[3].key]: d,
    }),
    [a, b, c, d],
  );
  const proposals = useMemo(
    () =>
      asList(bp.data)
        .filter((p) => !projectId || p.project_id === projectId)
        .sort((x, y) => new Date(y.updatedAt || 0) - new Date(x.updatedAt || 0)),
    [bp.data, projectId],
  );
  const latest = (slotKey, pid) => {
    if (slotKey === BUSINESS_PROPOSAL.key) return proposals.find((p) => p.project_id === pid) || null;
    return bySlot[slotKey]?.rows.find((r) => r.projectId === pid) || null;
  };
  const isLoading = a.isLoading || b.isLoading || c.isLoading || d.isLoading || bp.isLoading;
  return { bySlot, latest, isLoading };
}

export function PreDesignList() {
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const { projects } = useProjectsList();
  const { latest, isLoading } = usePreDesign(undefined);
  const list = projects.filter((p) => !search.trim() || `${p.name} ${p.client?.name || ""}`.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <Page>
      <PageHeader title="Pre Design" />
      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search projects…" />
      </Toolbar>
      <Card flush>
        {!list.length ? (
          <EmptyState icon={FolderOpen} title={isLoading ? "Loading…" : "No projects"} />
        ) : (
          <div className="inos-table-wrap">
            <table className="inos-table" data-testid="pre-design-table">
              <thead>
                <tr>
                  <th>Project</th>
                  {PRE_DESIGN_SLOTS.map((s) => (
                    <th key={s.key} style={{ textAlign: "center" }}>
                      {s.name}
                    </th>
                  ))}
                  <th style={{ textAlign: "right" }}>Done</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const done = PRE_DESIGN_SLOTS.filter((s) => latest(s.key, p.id)).length;
                  return (
                    <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => nav(`/design/pre-design/${p.id}`)}>
                      <td style={{ fontWeight: 600 }}>
                        <Link to={`/design/pre-design/${p.id}`} onClick={(e) => e.stopPropagation()}>
                          {p.name}
                        </Link>
                      </td>
                      {PRE_DESIGN_SLOTS.map((s) => (
                        <td key={s.key} style={{ textAlign: "center" }}>
                          {latest(s.key, p.id) ? (
                            <CheckCircle2 size={17} style={{ color: "var(--ok-fg)" }} aria-label="Done" />
                          ) : (
                            <Circle size={17} style={{ color: "var(--line-strong, #c9d1cf)" }} aria-label="Pending" />
                          )}
                        </td>
                      ))}
                      <td className="tabular" style={{ textAlign: "right" }}>
                        <Pill tone={done === PRE_DESIGN_SLOTS.length ? "ok" : done ? "warn" : "mute"} size="sm">
                          {done}/{PRE_DESIGN_SLOTS.length}
                        </Pill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  );
}

function SlotCard({ slot, row, types, rows, onUpload, onRevisions }) {
  const nav = useNavigate();
  const access = useDocumentAccess(slot.target === "DRAWING" ? "drawings" : "documents");
  return (
    <Card
      title={slot.name}
      actions={row ? <StatusPill status={row.status} size="sm" /> : <Pill size="sm">Pending</Pill>}
      data-testid={`slot-${slot.key}`}
    >
      <div className="pj-muted" style={{ fontSize: 13, marginBottom: 12 }}>
        {row ? `${row.version} · ${formatDay(row.updatedAt)}` : "Not uploaded"}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {(access.canCreate || access.canEdit) && (!row || row.kind === "document") && (
          <Button size="sm" variant={row ? "secondary" : "primary"} icon={CloudUpload} onClick={() => onUpload({ slot, types, rows, typeId: row?.typeId })}>
            {row ? "New version" : "Upload"}
          </Button>
        )}
        {row && (
          <>
            <Button size="sm" variant="ghost" icon={Eye} onClick={() => nav(viewPathFor(row))}>
              View
            </Button>
            <Button size="sm" variant="ghost" icon={History} onClick={() => (row.kind === "drawing" ? nav(viewPathFor(row)) : onRevisions(row))}>
              Revisions
            </Button>
            <Button size="sm" variant="ghost" iconRight={ArrowUpRight} disabled={!row.hasFile} onClick={() => openRow(row)} data-testid="slot-open-file">
              Open
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

export function PreDesignProject() {
  const { projectId } = useParams();
  const nav = useNavigate();
  const { byId } = useProjectsList();
  const { bySlot, latest } = usePreDesign(projectId);
  const [upload, setUpload] = useState(null);
  const [revisions, setRevisions] = useState(null);
  const project = byId[projectId];
  const proposal = latest(BUSINESS_PROPOSAL.key, projectId);
  const bpAccess = useDocumentAccess("business-proposals");

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Pre Design", to: "/design/pre-design" }, { label: project?.name || "Project" }]}
        title="Pre Design"
        actions={
          <Button variant="secondary" onClick={() => nav(`/projects/${projectId}?tab=documents`)}>
            Project documents
          </Button>
        }
      />
      <div className="pj-slot-grid">
        {PRE_DESIGN_SLOTS.map((slot) =>
          slot.key === BUSINESS_PROPOSAL.key ? (
            <Card
              key={slot.key}
              title={slot.name}
              actions={proposal ? <Pill tone="ok" size="sm">Created</Pill> : <Pill size="sm">Pending</Pill>}
              data-testid={`slot-${slot.key}`}
            >
              <div className="pj-muted" style={{ fontSize: 13, marginBottom: 12 }}>
                {proposal ? formatDay(proposal.updatedAt) : "Not created"}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {proposal ? (
                  <Button size="sm" variant="secondary" icon={Eye} onClick={() => nav(BUSINESS_PROPOSAL.viewPath(proposal.id))}>
                    Open
                  </Button>
                ) : (
                  bpAccess.canCreate && (
                    <Button size="sm" variant="primary" icon={FilePlus2} onClick={() => nav(BUSINESS_PROPOSAL.createPath(projectId))}>
                      Create
                    </Button>
                  )
                )}
              </div>
            </Card>
          ) : (
            <SlotCard
              key={slot.key}
              slot={slot}
              row={latest(slot.key, projectId)}
              types={bySlot[slot.key]?.types || []}
              rows={bySlot[slot.key]?.rows || []}
              onUpload={setUpload}
              onRevisions={setRevisions}
            />
          ),
        )}
      </div>
      {upload && (
        <UploadDocModal
          cfg={upload.slot}
          types={upload.types}
          rows={upload.rows}
          projectId={projectId}
          typeId={upload.typeId || upload.types[0]?.id}
          onClose={() => setUpload(null)}
        />
      )}
      {revisions && <RevisionsModal row={revisions} onClose={() => setRevisions(null)} />}
    </Page>
  );
}
