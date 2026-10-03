// Design Studio → single drawing: large preview, details, status and full revision history.
import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CloudUpload, Download, ExternalLink, FileText, ImageOff } from "lucide-react";

import { Page, PageHeader, Card, Button, Pill, EmptyState } from "@/components/inos";
import { useGetDrawingByIdQuery, useUpdateDrawingMutation } from "../../api/documents/drawing.api";
import { useGetProjectsQuery } from "../../api/projects/project.api";
import { useGetUsersQuery } from "../../api/users/user.api";
import { FileThumb, Chips } from "../design-studio/DrawingBits";
import {
  STATUSES,
  errMessage,
  fileKind,
  formatBytes,
  formatDate,
  createdAt,
  phaseLabel,
  sortedRevisions,
  statusTone,
} from "../design-studio/drawingUtils";
import "../design-studio/drawings.css";

export default function DrawingsView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: drawing, isLoading, isError } = useGetDrawingByIdQuery(id, { skip: !id });
  const { data: projects = [] } = useGetProjectsQuery({});
  const { data: users = [] } = useGetUsersQuery({});
  const [updateDrawing, { isLoading: saving }] = useUpdateDrawingMutation();

  const revisions = useMemo(() => sortedRevisions(drawing), [drawing]);
  const latest = revisions[0] || null;
  const userList = Array.isArray(users) ? users : users?.data || [];
  const userName = (uid) => userList.find((u) => u.id === uid)?.name || null;
  const project = projects.find((p) => p.id === drawing?.projectId);

  const crumbs = [
    { label: "Design Studio", to: "/design-studio" },
    { label: "Drawings", to: "/design-studio/all" },
    { label: drawing?.drawingNumber || "Drawing" },
  ];

  if (isLoading) {
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Drawing" subtitle="Loading…" />
      </Page>
    );
  }
  if (isError || !drawing) {
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Drawing" />
        <Card>
          <EmptyState
            icon={ImageOff}
            title="Drawing not found"
            text="It may have been deleted, or you don't have access to it."
            action={
              <Button variant="soft" onClick={() => nav("/design-studio/all")}>
                Back to register
              </Button>
            }
          />
        </Card>
      </Page>
    );
  }

  const fileUrl = latest?.url || null;
  const kind = fileKind({ name: latest?.filename, mime: latest?.mime });

  const setStatus = async (status) => {
    if (!status || status === drawing.status) return;
    try {
      await updateDrawing({ id: drawing.id, data: { status } }).unwrap();
      toast.success(`Marked ${status.toLowerCase()}`);
    } catch (e) {
      toast.error(errMessage(e, "Couldn't update status"));
    }
  };

  const kv = [
    [
      "Project",
      project ? (
        <button type="button" onClick={() => nav(`/projects/${project.id}`)} style={{ color: "var(--brand)", fontWeight: 600, textAlign: "left" }}>
          {project.name}
        </button>
      ) : (
        "—"
      ),
    ],
    ["Phase", phaseLabel(drawing.phaseCode)],
    ["Discipline", drawing.discipline || "—"],
    ["Sheet no.", drawing.sheetNumber || "—"],
    ["Scale", drawing.scale || "—"],
    ["Sheet size", drawing.sheetSize || "—"],
    ["Drawn by", userName(drawing.drawnBy) || latest?.uploadedByName || "—"],
    ["Checked by", userName(drawing.checkedBy) || "—"],
    ["Issue purpose", latest?.issuePurpose || drawing.issuePurpose || "—"],
    ["Issued", formatDate(latest?.issueDate || createdAt(latest))],
  ];

  return (
    <Page>
      <PageHeader
        crumbs={crumbs}
        title={drawing.title || "Untitled drawing"}
        subtitle={`${drawing.drawingNumber} · Rev ${latest?.revision || "—"} · ${project?.name || "Unassigned project"}`}
        actions={
          <>
            {fileUrl && (
              <Button
                variant="secondary"
                icon={Download}
                onClick={() => window.open(fileUrl, "_blank", "noopener,noreferrer")}
                data-testid="drawing-download"
              >
                Download
              </Button>
            )}
            <Button variant="primary" icon={CloudUpload} onClick={() => nav(`/design-studio/upload?drawing=${drawing.id}`)}>
              Upload new revision
            </Button>
          </>
        }
      />

      <div className="ds-view">
        <Card flush>
          <div className="ds-preview">
            {!fileUrl ? (
              <EmptyState icon={ImageOff} title="No file yet" text="Upload a revision to see the drawing here." />
            ) : kind === "image" ? (
              <img src={fileUrl} alt={drawing.title} />
            ) : kind === "pdf" ? (
              <iframe title="Drawing preview" src={fileUrl} />
            ) : (
              <div style={{ display: "grid", justifyItems: "center", gap: 12, padding: 32, width: 260 }}>
                <FileThumb name={latest?.filename} mime={latest?.mime} size="lg" />
                <p style={{ margin: 0, color: "var(--text-2)", fontSize: 13, textAlign: "center" }}>
                  CAD files can't be previewed in the browser. Download to open in AutoCAD.
                </p>
                <Button variant="soft" icon={ExternalLink} onClick={() => window.open(fileUrl, "_blank", "noopener,noreferrer")}>
                  Open file
                </Button>
              </div>
            )}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <Card title="Status" subtitle="Headline status of this drawing">
            <Chips value={drawing.status || "Draft"} onChange={setStatus} options={STATUSES} />
            {saving && (
              <p className="inos-hint" style={{ margin: "8px 0 0" }}>
                Saving…
              </p>
            )}
          </Card>
          <Card title="Details">
            <dl className="ds-kv" style={{ margin: 0 }}>
              {kv.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              {(drawing.remarks || latest?.remarks) && (
                <div className="span-full">
                  <dt>Notes</dt>
                  <dd style={{ color: "var(--text-2)" }}>{latest?.remarks || drawing.remarks}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>

      <Card flush title="Revision history" subtitle={`${revisions.length} revision${revisions.length === 1 ? "" : "s"} · newest first`}>
        {!revisions.length ? (
          <EmptyState icon={FileText} title="No revisions uploaded" />
        ) : (
          <div className="inos-table-wrap">
            <table className="inos-table">
              <thead>
                <tr>
                  <th />
                  <th>Rev</th>
                  <th>File</th>
                  <th>Status</th>
                  <th>Issue purpose</th>
                  <th>Issued</th>
                  <th>Uploaded by</th>
                  <th className="num">Size</th>
                  <th className="actions" />
                </tr>
              </thead>
              <tbody>
                {revisions.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{ width: 56 }}>
                      <FileThumb name={r.filename} mime={r.mime} src={r.url} size="sm" />
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span className="ds-rev">{r.revision}</span>
                      {i === 0 && (
                        <span style={{ marginLeft: 8 }}>
                          <Pill tone="brand" size="sm" dot={false}>
                            Current
                          </Pill>
                        </span>
                      )}
                    </td>
                    <td
                      style={{ fontWeight: 600, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      title={r.filename}
                    >
                      {r.filename || "—"}
                    </td>
                    <td>
                      <Pill tone={statusTone(r.status)} size="sm">
                        {r.status || "Draft"}
                      </Pill>
                    </td>
                    <td className="muted">{r.issuePurpose || "—"}</td>
                    <td className="muted">{formatDate(r.issueDate || createdAt(r))}</td>
                    <td className="muted">{r.uploadedByName || "—"}</td>
                    <td className="num muted">{formatBytes(r.size)}</td>
                    <td className="actions">
                      {r.url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Download}
                          aria-label={`Download revision ${r.revision}`}
                          onClick={() => window.open(r.url, "_blank", "noopener,noreferrer")}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  );
}
