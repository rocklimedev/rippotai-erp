// Design Studio → single drawing: large preview, details, status and full revision history.
import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CloudUpload, ImageOff } from "lucide-react";

import { Page, PageHeader, Card, Button, EmptyState } from "@/components/inos";
import { useGetDrawingByIdQuery, useUpdateDrawingMutation } from "../../api/documents/drawing.api";
import { useGetProjectsQuery } from "../../api/projects/project.api";
import { useGetUsersQuery } from "../../api/users/user.api";
import { FileThumb, Chips } from "../design-studio/DrawingBits";
import DrawingPreview from "../design-studio/DrawingPreview";
import {
  STATUSES,
  errMessage,
  fileKind,
  formatDate,
  createdAt,
  phaseLabel,
  sortedRevisions,
} from "../design-studio/drawingUtils";
import "../design-studio/drawings.css";
import RecordContext from "@/components/record-context/RecordContext";
import VersionHistory from "@/components/record-context/VersionHistory";
import { useRecordInfo } from "@/components/record-context/useRecordInfo";
import OpenFileLink from "@/components/record-context/OpenFileLink";

export default function DrawingsView() {
  const { id } = useParams();
  const recordInfo = useRecordInfo("drawing", id);
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
  const hasFile = !!(latest?.storageFilename || fileUrl);
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
        info={recordInfo || [drawing.drawingNumber, project?.name].filter(Boolean).join(" · ")}
        actions={
          <>
            {latest?.id && (
              <OpenFileLink button source={`/drawings/${drawing.id}/revisions/${latest.id}/download`} title={latest.filename} testId="drawing-open">
                Open in new tab
              </OpenFileLink>
            )}
            <Button variant="primary" icon={CloudUpload} onClick={() => nav(`/design-studio/upload?drawing=${drawing.id}`)}>
              Upload new revision
            </Button>
          </>
        }
      />
      <RecordContext type="drawing" id={drawing.id} listTo={`/projects/${drawing.projectId}?tab=drawings`} listLabel="Project drawings" />

      <div className="ds-view">
        <Card flush>
          <div className="ds-preview">
            {!hasFile ? (
              <EmptyState icon={ImageOff} title="No file yet" text="Upload a revision to see the drawing here." />
            ) : kind === "image" || kind === "pdf" ? (
              <DrawingPreview key={`${drawing.id}:${latest.id}:${latest.storageFilename || latest.updatedAt || ""}`} drawingId={drawing.id} revision={latest} kind={kind} title={drawing.title} />
            ) : (
              <div style={{ display: "grid", justifyItems: "center", gap: 12, padding: 32, width: 260 }}>
                <FileThumb name={latest?.filename} mime={latest?.mime} size="lg" />
                <p style={{ margin: 0, color: "var(--text-2)", fontSize: 13, textAlign: "center" }}>
                  CAD files can't be previewed in the browser. Download to open in AutoCAD.
                </p>
                <OpenFileLink button source={`/drawings/${drawing.id}/revisions/${latest.id}/download`} title={latest.filename}>
                  Open file
                </OpenFileLink>
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

      <VersionHistory type="drawing" id={drawing.id} />
    </Page>
  );
}
