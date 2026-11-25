// A past version of any flow document, read from its revision snapshot, with
// "Restore this version" (it becomes current again and can then be edited).
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { History, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/inos";
import { appConfirm } from "@/lib/app-dialog";
import { useGetDocRevisionQuery, useRestoreDocRevisionMutation } from "@/api/doc-flow/doc-flow.api";
import { fmtDateTime } from "./doc-utils";
import "./doc-list.css";

const HIDDEN = /^(id|.*_id|.*Id|uuid|created_at|updated_at|deleted_at|createdAt|updatedAt|deletedAt|created_by|updated_by|deleted_by|password.*|token.*|.*_hash|sort_order|line_number)$/;
const isoRe = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z)?$/;
const label = (k) =>
  String(k)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());
const parse = (v) => {
  if (typeof v !== "string" || !/^[[{]/.test(v.trim())) return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};
const show = (v) => {
  v = parse(v);
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean" || v === 0 || v === 1) return typeof v === "boolean" ? (v ? "Yes" : "No") : String(v);
  if (typeof v === "string" && isoRe.test(v))
    return v.length > 10
      ? new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : new Date(`${v}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  if (typeof v === "object")
    return <pre className="rv-json">{JSON.stringify(v, null, 2).slice(0, 4000)}</pre>;
  return String(v);
};
const visible = (row) => Object.keys(row || {}).filter((k) => !HIDDEN.test(k));

function ChildTable({ name, rows }) {
  if (!rows?.length) return null;
  const cols = [...new Set(rows.flatMap(visible))].slice(0, 16);
  return (
    <section className="rv-child">
      <h4>
        {label(name)} <span>({rows.length})</span>
      </h4>
      <div className="rv-child__scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              {cols.map((c) => (
                <th key={c}>{label(c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id || i}>
                <td>{i + 1}</td>
                {cols.map((c) => (
                  <td key={c}>{show(r[c])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function RevisionViewer({ type, id, revision, name, onClose, onRestored }) {
  const { data, isLoading, isError } = useGetDocRevisionQuery({ type, snapshotId: revision.id });
  const [restore, { isLoading: restoring }] = useRestoreDocRevisionMutation();
  const snapshot = data?.data || {};
  const [mainTable, ...childTables] = Object.keys(snapshot);
  const main = snapshot[mainTable] || {};

  const doRestore = async () => {
    if (!(await appConfirm(`Restore v${revision.version} of ${name || "this document"}? The current version is kept in the history.`)))
      return;
    try {
      await restore({ type, id, snapshotId: revision.id }).unwrap();
      toast.success(`v${revision.version} restored — it is now the current version and can be edited.`);
      onRestored?.();
    } catch (e) {
      toast.error([e?.data?.message || "Could not restore this version"].flat().join(". "));
    }
  };

  return createPortal(
    <div className="rv-overlay" onClick={onClose} role="presentation">
      <div className="rv-dialog" role="dialog" aria-modal="true" aria-label={`Version ${revision.version}`} onClick={(e) => e.stopPropagation()} data-testid="revision-viewer">
        <div className="rv-head">
          <div>
            <h2>
              <History aria-hidden /> {name || "Document"} · v{revision.version}
            </h2>
            <p>
              Saved {fmtDateTime(revision.created_at)}
              {revision.user_name ? ` · replaced by ${revision.user_name}` : ""} · read-only copy
            </p>
          </div>
          <div className="rv-head__actions">
            <Button variant="primary" size="sm" icon={RotateCcw} loading={restoring} onClick={doRestore} data-testid="revision-restore">
              Restore this version
            </Button>
            <button type="button" className="dl-x" onClick={onClose} aria-label="Close">
              <X size={16} aria-hidden />
            </button>
          </div>
        </div>
        <div className="rv-body">
          {isLoading && <p className="cc-muted">Loading version…</p>}
          {isError && <p className="cc-muted">Couldn't load this version.</p>}
          {data && (
            <>
              <dl className="rv-fields">
                {visible(main).map((k) => (
                  <div key={k} className={typeof parse(main[k]) === "object" && main[k] ? "is-wide" : ""}>
                    <dt>{label(k)}</dt>
                    <dd>{show(main[k])}</dd>
                  </div>
                ))}
              </dl>
              {childTables.map((t) => (
                <ChildTable key={t} name={t} rows={snapshot[t]} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
