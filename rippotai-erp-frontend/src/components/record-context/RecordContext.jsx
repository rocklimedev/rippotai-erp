// "Record context" strip on every document detail page: status pill,
// ← back to the list, ↗ Project overview, linked records and the Review menu.
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Card, prettyStatus, toneFor } from "@/components/inos";
import { HistoryDrawer, ReviewMenu, ReviewStatusPill } from "@/components/doc-list/review";
import { docCode, docMeta, projectLabel, projectOverviewPath, viewPath } from "./codes";
import { currentVersion, useRecordContext } from "./useRecordInfo";
import "./record-context.css";

function linkedLabel(l, projectCode) {
  const m = docMeta(l.type);
  if (l.type === "work-order-payments") return `${m.label} (${l.count})`;
  const code = docCode(l.type, l.number, projectCode);
  if (l.number && m.prefix && code.startsWith(m.prefix)) return code;
  return `${m.short || m.label} ${code || l.title || ""}`.trim();
}

export default function RecordContext({ type, id, status, listTo, listLabel, actions, review = true, title = "Record context" }) {
  const { ctx, reviews } = useRecordContext(type, id);
  const [history, setHistory] = useState(null);
  if (!type || !id) return null;
  const meta = docMeta(type);
  const list = listTo ?? meta.list;
  const projectId = ctx?.project?.id;
  const name = ctx ? docCode(type, ctx.number, ctx.project?.code) || meta.label : meta.label;
  const linked = ctx?.linked ?? [];
  return (
    <Card className="rc-card" data-testid="record-context">
      <div className="rc-head">
        <h2 className="inos-section-title">{title}</h2>
        {review && (
          <div className="rc-review">
            <ReviewMenu
              type={type}
              id={id}
              name={name}
              canReview={!!reviews?.canReview}
              count={reviews?.reviews?.length || 0}
              onOpenHistory={() => setHistory("reviews")}
            />
          </div>
        )}
      </div>
      <div className="rc-strip">
        <ReviewStatusPill state={reviews?.state?.state} status={status ?? ctx?.status} prettyStatus={prettyStatus} toneFor={toneFor} />
        {list && (
          <Link className="rc-link" to={list} data-testid="rc-list">
            <ArrowLeft aria-hidden size={14} />
            {listLabel || `${meta.label} list`}
          </Link>
        )}
        {projectId && (
          <Link className="rc-link" to={projectOverviewPath(projectId)} title={projectLabel(ctx.project)} data-testid="rc-project">
            <ArrowUpRight aria-hidden size={14} />
            Project overview
          </Link>
        )}
        {linked.map((l) => {
          const to = viewPath(l.type, l.id, projectId);
          if (!to) return null;
          return (
            <Link key={`${l.type}:${l.id}`} className="rc-link" to={to} data-testid="rc-linked">
              <ArrowUpRight aria-hidden size={14} />
              {linkedLabel(l, ctx?.project?.code)}
            </Link>
          );
        })}
        {actions}
      </div>
      {history && (
        <HistoryDrawer
          type={type}
          id={id}
          name={name}
          version={currentVersion(ctx, reviews)}
          canReview={!!reviews?.canReview}
          initialTab={history}
          onClose={() => setHistory(null)}
        />
      )}
    </Card>
  );
}
