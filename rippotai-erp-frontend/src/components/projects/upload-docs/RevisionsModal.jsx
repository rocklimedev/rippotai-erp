// Revision history of an uploaded document: every version with its date and a download.
import { ArrowUpRight } from "lucide-react";
import { Button, EmptyState, StatusPill } from "@/components/inos";
import { Modal } from "@/components/projects/_projects-ui";
import { useGetDocumentVersionsQuery } from "@/api/documents/document.api";
import { asList, formatDay, openDocumentVersion, openRow } from "./uploadDocs";

export default function RevisionsModal({ row, onClose }) {
  const { data, isLoading } = useGetDocumentVersionsQuery(row.id);
  const versions = asList(data);
  const list = versions.length
    ? versions.map((v) => ({ ...v, current: v.version === row.version }))
    : [{ id: "current", version: row.version, status: row.status, created_at: row.updatedAt, filename: row.record?.filename, uploadedByName: row.record?.uploadedByName, current: true }];

  return (
    <Modal open onClose={onClose} title={`${row.typeName} · revisions`} description={row.projectName} width={620} testId="revisions-modal">
      {isLoading ? (
        <p className="pj-muted">Loading…</p>
      ) : !list.length ? (
        <EmptyState title="No revisions" />
      ) : (
        <div className="inos-table-wrap">
          <table className="inos-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Status</th>
                <th>Date</th>
                <th>By</th>
                <th style={{ width: 48 }} />
              </tr>
            </thead>
            <tbody>
              {list.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 600 }}>
                    {v.version}
                    {v.current && <span className="pj-muted" style={{ fontWeight: 400 }}> · current</span>}
                  </td>
                  <td>
                    <StatusPill status={v.status} size="sm" />
                  </td>
                  <td className="muted">{formatDay(v.created_at || v.createdAt)}</td>
                  <td className="muted">{v.uploadedByName || v.uploaded_by_name || "—"}</td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconRight={ArrowUpRight}
                      title="Open in a new tab"
                      aria-label={`Open ${v.version}`}
                      onClick={() => (v.id === "current" ? openRow(row) : openDocumentVersion(row.id, v))}
                    >
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
