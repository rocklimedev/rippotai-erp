// "Version & approval history" timeline on document detail pages, built from
// document_reviews (decisions + comments), document_snapshots (saved earlier
// versions) and uploaded file versions (documents / drawings).
//   v3 · Current — 14 Nov 2026, Ajay
//   v2 · Returned — 13 Nov 2026, Megha · "Revise finish"      Open v2 ↗
//   v1 · Draft created — 10 Nov 2026, Sagar
import { ArrowUpRight } from "lucide-react";
import { Card, prettyStatus } from "@/components/inos";
import { REVIEW_STATE } from "@/components/doc-list/doc-utils";
import { fmtDayTime } from "./codes";
import OpenFileLink from "./OpenFileLink";
import { fileOpenPath } from "./openFile";
import { currentVersion, useRecordContext } from "./useRecordInfo";
import "./record-context.css";

const REVIEW_LABEL = { approve: "Approved", revise: "Returned", reject: "Rejected", archive: "Archived" };
const vLabel = (v) => {
  if (v == null || v === "") return null;
  const s = String(v);
  return /^v/i.test(s) ? `v${s.slice(1)}` : /^\d+$/.test(s) ? `v${s}` : s;
};
const time = (v) => (v ? new Date(v).getTime() || 0 : 0);

function buildHistory(type, id, ctx, reviews, extraItems = []) {
  const items = [...extraItems];
  const files = ctx?.files ?? [];
  const cur = currentVersion(ctx, reviews);
  const latestReview = reviews?.reviews?.[0];

  if (files.length) {
    for (const f of files)
      items.push({
        key: `file:${f.id}`,
        version: vLabel(f.version),
        label: f.current ? "Current" : "Uploaded",
        at: f.created_at,
        user: f.user_name,
        note: [f.filename, f.remarks].filter(Boolean).join(" · "),
        open: { source: fileOpenPath(type, id, f), title: f.filename },
      });
  } else if (ctx) {
    const reviewedAfterSave = latestReview && time(latestReview.created_at) >= time(ctx.updated_at) - 1000;
    if (!reviewedAfterSave && (reviews?.revisions?.length || time(ctx.updated_at) - time(ctx.created_at) > 60_000))
      items.push({
        key: "current",
        version: `v${cur}`,
        label: ctx.status ? prettyStatus(String(ctx.status).toLowerCase()) : "Current",
        at: ctx.updated_at,
        note: "Current version",
      });
  }

  for (const r of reviews?.reviews ?? [])
    items.push({
      key: `review:${r.id}`,
      version: vLabel(r.version),
      label: REVIEW_LABEL[r.action] || REVIEW_STATE[r.action]?.label || r.action,
      at: r.created_at,
      user: r.user_name,
      comment: r.comment,
      tone: r.action,
    });

  for (const s of reviews?.revisions ?? [])
    items.push({
      key: `snap:${s.id}`,
      version: `v${s.version}`,
      label: "Saved",
      at: s.created_at,
      user: s.user_name,
      note: `Replaced by v${Number(s.version) + 1}`,
      snapshot: `/projects/records/${type}/snapshot/${s.id}`,
    });

  items.sort((a, b) => time(b.at) - time(a.at));
  if (ctx?.created_at && !files.length)
    items.push({ key: "created", version: "v1", label: "Draft created", at: ctx.created_at, user: ctx.created_by });
  return items;
}

export default function VersionHistory({ type, id, title = "Version & approval history", extraItems }) {
  const { ctx, reviews, isLoading } = useRecordContext(type, id);
  if (!type || !id) return null;
  const items = buildHistory(type, id, ctx, reviews, extraItems);
  return (
    <Card className="rc-card rc-history" title={title} data-testid="version-history">
      {isLoading && !ctx ? (
        <p className="rc-empty">Loading…</p>
      ) : !items.length ? (
        <p className="rc-empty">No history yet.</p>
      ) : (
        <ol className="rc-timeline">
          {items.map((it) => (
            <li key={it.key} className={`rc-timeline__item${it.tone ? ` rc-tone--${it.tone}` : ""}`} data-testid="history-item">
              <span className="rc-timeline__dot" aria-hidden />
              <div className="rc-timeline__body">
                <div className="rc-timeline__title">{[it.version, it.label].filter(Boolean).join(" · ")}</div>
                <div className="rc-timeline__meta">{[fmtDayTime(it.at), it.user, it.note].filter(Boolean).join(" · ")}</div>
                {it.comment && <p className="rc-timeline__comment">“{it.comment}”</p>}
                {it.open?.source && (
                  <OpenFileLink source={it.open.source} title={it.open.title}>
                    Open {it.version || ""}
                  </OpenFileLink>
                )}
                {(it.snapshot || it.href) && (
                  <a className="rc-link" href={it.snapshot || it.href} target="_blank" rel="noopener noreferrer" data-testid="open-snapshot">
                    Open {it.version}
                    <ArrowUpRight aria-hidden size={14} />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
