// Read-only render of a saved earlier version of a flow document
// (document_snapshots: the main row + its child rows). Opened in a new tab
// from "Open vN ↗" in the version history.
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, EmptyState, Page, PageHeader, prettyStatus } from "@/components/inos";
import { useLazyGetDocRevisionQuery } from "@/api/doc-flow/doc-flow.api";
import { docCode, docMeta, fmtDay, projectLabel, viewPath } from "@/components/record-context/codes";
import { useRecordContext } from "@/components/record-context/useRecordInfo";
import "@/components/record-context/record-context.css";

const HIDDEN = /(^id$|_id$|Id$|^password|token|signature_url$|^deleted_at$|^storage_filename$)/;
const label = (k) => prettyStatus(k.replace(/_/g, " "));

function show(v) {
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") return JSON.stringify(v);
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}(T|\s|$)/.test(s)) return fmtDay(s) || s;
  if (s.startsWith("[") || s.startsWith("{")) {
    try {
      return JSON.stringify(JSON.parse(s), null, 1).slice(0, 2000);
    } catch {
      return s;
    }
  }
  return s;
}

function Fields({ row }) {
  const keys = Object.keys(row || {}).filter((k) => !HIDDEN.test(k));
  return (
    <div className="inos-table-wrap">
      <table className="inos-table">
        <tbody>
          {keys.map((k) => (
            <tr key={k}>
              <th style={{ width: 240 }}>{label(k)}</th>
              <td style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{show(row[k])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Rows({ rows }) {
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((k) => !HIDDEN.test(k) && !/^(created_at|updated_at|createdAt|updatedAt)$/.test(k)).slice(0, 10);
  return (
    <div className="inos-table-wrap">
      <table className="inos-table">
        <thead>
          <tr>
            {keys.map((k) => (
              <th key={k}>{label(k)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id || i}>
              {keys.map((k) => (
                <td key={k}>{show(r[k])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SnapshotView() {
  const { type, snapshotId } = useParams();
  const [load, { data, isLoading, isError, error }] = useLazyGetDocRevisionQuery();
  useEffect(() => {
    load({ type, snapshotId });
  }, [load, type, snapshotId]);
  const { ctx } = useRecordContext(type, data?.entity_id);
  const meta = docMeta(type);
  const tables = Object.entries(data?.data ?? {});
  const [main, ...children] = tables;
  const code = ctx ? docCode(type, ctx.number, ctx.project?.code) : null;
  const current = viewPath(type, data?.entity_id, ctx?.project?.id);
  return (
    <Page>
      <PageHeader
        crumbs={[{ label: meta.label, to: meta.list }, ...(current ? [{ label: code || meta.label, to: current }] : []), { label: `v${data?.version ?? ""}` }]}
        title={`${code || meta.label} · v${data?.version ?? "…"}`}
        info={[`Saved copy (read-only)`, ctx?.project ? `Project: ${projectLabel(ctx.project)}` : null, data?.created_at ? `Replaced ${fmtDay(data.created_at)}` : null].filter(Boolean).join(" · ")}
      />
      {isLoading ? (
        <Card>
          <p className="rc-empty">Loading…</p>
        </Card>
      ) : isError ? (
        <Card>
          <EmptyState title="Version unavailable" text={error?.data?.message || "It may have been removed or you may not have access."} />
        </Card>
      ) : main ? (
        <>
          <Card title={meta.label} className="rc-card">
            <Fields row={main[1]} />
          </Card>
          {children
            .filter(([, rows]) => Array.isArray(rows) && rows.length)
            .map(([table, rows]) => (
              <Card key={table} title={label(table)} flush className="rc-card">
                <Rows rows={rows} />
              </Card>
            ))}
        </>
      ) : null}
    </Page>
  );
}
