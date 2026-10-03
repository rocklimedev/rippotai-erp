// Drawings of one project, for the project workspace. Thumbnail grid + upload shortcut.
import { useNavigate } from "react-router-dom";
import { CloudUpload, FolderOpen, LayoutGrid } from "lucide-react";

import { Card, Button, Pill, EmptyState } from "@/components/inos";
import { useGetDrawingsQuery } from "@/api/documents/drawing.api";
import { FileThumb } from "./DrawingBits";
import { STATUSES, formatDate, latestRevision, statusTone, updatedAt } from "./drawingUtils";
import "./drawings.css";

export default function ProjectDrawingsPanel({ projectId, limit }) {
  const nav = useNavigate();
  const { data: rows = [], isLoading } = useGetDrawingsQuery({ projectId }, { skip: !projectId });
  const sorted = [...rows].sort((a, b) => new Date(updatedAt(b) || 0) - new Date(updatedAt(a) || 0));
  const list = limit ? sorted.slice(0, limit) : sorted;
  const counts = {};
  rows.forEach((d) => (counts[d.status || "Draft"] = (counts[d.status || "Draft"] || 0) + 1));

  return (
    <Card
      title="Drawings"
      subtitle={`${rows.length} drawing${rows.length === 1 ? "" : "s"} in the register`}
      actions={
        <>
          <Button variant="ghost" size="sm" icon={FolderOpen} onClick={() => nav(`/design-studio/all?project=${projectId}`)}>
            Register
          </Button>
          <Button variant="soft" size="sm" icon={CloudUpload} onClick={() => nav(`/design-studio/upload?project=${projectId}`)}>
            Upload
          </Button>
        </>
      }
    >
      {rows.length > 0 && (
        <div className="ds-summary" style={{ marginBottom: 16 }}>
          {STATUSES.filter((s) => counts[s]).map((s) => (
            <Pill key={s} tone={statusTone(s)}>
              {s} · {counts[s]}
            </Pill>
          ))}
        </div>
      )}
      {isLoading ? (
        <div style={{ color: "var(--text-3)", fontSize: 13 }}>Loading drawings…</div>
      ) : !list.length ? (
        <EmptyState
          icon={LayoutGrid}
          title="No drawings yet"
          text="Upload plans, sections and details — they'll appear here with their latest revision."
          action={
            <Button variant="soft" icon={CloudUpload} onClick={() => nav(`/design-studio/upload?project=${projectId}`)}>
              Upload drawings
            </Button>
          }
        />
      ) : (
        <div className="ds-cards ds-cards--tight">
          {list.map((d) => {
            const rev = latestRevision(d);
            return (
              <button type="button" key={d.id} className="ds-dcard" onClick={() => nav(`/design-studio/${d.id}`)}>
                <FileThumb name={rev?.filename || d.drawingNumber} mime={rev?.mime} src={rev?.url} size="lg" />
                <div className="ds-dcard__body">
                  <span className="ds-dcard__num">{d.drawingNumber}</span>
                  <span className="ds-dcard__title">{d.title}</span>
                  <span className="ds-dcard__sub">
                    {d.discipline || "—"} · {formatDate(updatedAt(d))}
                  </span>
                  <div className="ds-dcard__foot">
                    <span className="ds-rev">Rev {rev?.revision || "—"}</span>
                    <Pill tone={statusTone(d.status)} size="sm">
                      {d.status || "Draft"}
                    </Pill>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
