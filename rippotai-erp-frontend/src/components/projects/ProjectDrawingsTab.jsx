// Project › Drawings: every drawing of the project with Upload, View, Download, Approve.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowUpRight, CheckCircle2, CloudUpload, Eye, LayoutGrid } from "lucide-react";
import { Button, Card, EmptyState, Pill, SearchInput } from "@/components/inos";
import { useApproveDrawingMutation, useGetDrawingsQuery } from "@/api/documents/drawing.api";
import { useAccess } from "@/hooks/use-permission";
import { latestRevision, phaseLabel, statusTone } from "@/pages/design-studio/drawingUtils";
import { formatDay, openRow } from "./upload-docs/uploadDocs";
import "./projects-ui.css";

export default function ProjectDrawingsTab({ projectId }) {
  const nav = useNavigate();
  const access = useAccess();
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useGetDrawingsQuery({ projectId }, { skip: !projectId });
  const [approve, { isLoading: approving }] = useApproveDrawingMutation();
  const canUpload = access.can("drawings", "create");
  const canApprove = access.can("documents", "approve");

  const rows = useMemo(() => {
    const t = search.trim().toLowerCase();
    return (Array.isArray(data) ? data : [])
      .map((d) => ({ d, rev: latestRevision(d) }))
      .filter(({ d }) => !t || `${d.drawingNumber} ${d.title} ${d.discipline} ${d.status}`.toLowerCase().includes(t))
      .sort((a, b) => new Date(b.rev?.created_at || b.d.updated_at || 0) - new Date(a.rev?.created_at || a.d.updated_at || 0));
  }, [data, search]);

  const doApprove = async (d) => {
    try {
      await approve(d.id).unwrap();
      toast.success(`${d.drawingNumber || d.title} approved`);
    } catch (e) {
      toast.error(e?.data?.message || "Could not approve");
    }
  };

  return (
    <Card
      flush
      title="Drawings"
      actions={
        <>
          <SearchInput value={search} onChange={setSearch} placeholder="Search drawings…" />
          {canUpload && (
            <Button variant="primary" size="sm" icon={CloudUpload} onClick={() => nav(`/design-studio/upload?project=${projectId}`)} data-testid="drawings-upload-btn">
              Upload
            </Button>
          )}
        </>
      }
    >
      {isLoading ? (
        <p className="pj-muted" style={{ padding: 20 }}>
          Loading…
        </p>
      ) : !rows.length ? (
        <EmptyState icon={LayoutGrid} title="No drawings yet" />
      ) : (
        <div className="inos-table-wrap">
          <table className="inos-table" data-testid="project-drawings-table">
            <thead>
              <tr>
                <th>Drawing</th>
                <th>Stage</th>
                <th>Rev</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ d, rev }) => {
                const approved = /approved|for construction/i.test(d.status || "");
                return (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.title}</div>
                      <div className="pj-muted" style={{ fontSize: 12 }}>
                        {d.drawingNumber}
                      </div>
                    </td>
                    <td className="muted">{phaseLabel(d.phaseCode)}</td>
                    <td className="tabular">{rev?.revision || "—"}</td>
                    <td>
                      <Pill tone={statusTone(d.status)} size="sm">
                        {d.status || "Draft"}
                      </Pill>
                    </td>
                    <td className="muted">{formatDay(rev?.created_at || d.updated_at)}</td>
                    <td>
                      <div className="pj-hub-actions">
                        <Button variant="ghost" size="sm" icon={Eye} title="View" aria-label="View" onClick={() => nav(`/design-studio/${d.id}`)} />
                        <Button
                          variant="ghost"
                          size="sm"
                          iconRight={ArrowUpRight}
                          title="Open file in a new tab"
                          disabled={!rev}
                          onClick={() => openRow({ kind: "drawing", id: d.id, record: d })}
                          data-testid="drawing-open-file"
                        >
                          Open
                        </Button>
                        {canApprove && !approved && (
                          <Button variant="secondary" size="sm" icon={CheckCircle2} disabled={approving || !rev} onClick={() => doApprove(d)}>
                            Approve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
