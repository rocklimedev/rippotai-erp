// Review workflow UI shared by every document list and document view:
// ReviewMenu (Approve / Revise / Reject / Archive + history), the comment
// dialog and the history drawer (reviews with comments + saved revisions).
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { ChevronDown, History, MessageSquare, X } from "lucide-react";
import { Button, Pill } from "@/components/inos";
import { useGetDocReviewsQuery, useReviewDocumentMutation } from "@/api/doc-flow/doc-flow.api";
import { REVIEW_ACTIONS, REVIEW_STATE, fmtDateTime } from "./doc-utils";
import RevisionViewer from "./RevisionViewer";
import "./doc-list.css";

const cx = (...c) => c.filter(Boolean).join(" ");

const ACTION = Object.fromEntries(REVIEW_ACTIONS.map((a) => [a.key, a]));

/* ------------------------------------------------------------ popover menu */

function useOutside(refs, onOut, active) {
  useEffect(() => {
    if (!active) return undefined;
    const h = (e) => !refs.some((r) => r.current && r.current.contains(e.target)) && onOut();
    const k = (e) => e.key === "Escape" && onOut();
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [refs, onOut, active]);
}

/**
 * Review button with the four decisions and the history entry.
 * Non-reviewers see the decisions disabled and can still open the history.
 */
export function ReviewMenu({ type, id, name, canReview, count = 0, onOpenHistory, onDone, compact }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const menu = useRef(null);
  const btn = useRef(null);
  const refs = React.useMemo(() => [ref, menu], []);
  const close = React.useCallback(() => setOpen(false), []);
  useOutside(refs, close, open);
  const toggle = () => {
    if (!open && btn.current) {
      const r = btn.current.getBoundingClientRect();
      const left = Math.min(Math.max(8, r.right - 210), window.innerWidth - 218);
      const below = window.innerHeight - r.bottom > 230;
      setPos(below ? { top: r.bottom + 4, left } : { bottom: window.innerHeight - r.top + 4, left });
    }
    setOpen((o) => !o);
  };
  return (
    <div className="dl-review" ref={ref}>
      <button
        type="button"
        ref={btn}
        className={cx("dl-review__btn", compact && "dl-review__btn--compact")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        data-testid="review-menu"
      >
        <span>Review</span>
        {count > 0 && (
          <span className="dl-review__count" title={`${count} review comment${count === 1 ? "" : "s"}`}>
            <MessageSquare aria-hidden size={11} />
            {count}
          </span>
        )}
        <ChevronDown aria-hidden size={14} />
      </button>
      {open &&
        createPortal(
          <div className="dl-menu" role="menu" style={pos} ref={menu}>
            {REVIEW_ACTIONS.map((a) => (
              <button
                key={a.key}
                type="button"
                role="menuitem"
                className={cx("dl-menu__item", `dl-menu__item--${a.tone}`)}
                disabled={!canReview}
                title={canReview ? undefined : "Only reviewers (Full access) can review"}
                onClick={() => {
                  setOpen(false);
                  setAction(a.key);
                }}
              >
                <a.icon aria-hidden size={15} />
                {a.label}
              </button>
            ))}
            <div className="dl-menu__sep" />
            <button
              type="button"
              role="menuitem"
              className="dl-menu__item"
              onClick={() => {
                setOpen(false);
                onOpenHistory?.();
              }}
            >
              <History aria-hidden size={15} />
              History{count > 0 ? ` (${count})` : ""}
            </button>
          </div>,
          document.body,
        )}
      {action && (
        <ReviewDialog
          type={type}
          id={id}
          name={name}
          action={action}
          onClose={() => setAction(null)}
          onDone={() => {
            setAction(null);
            onDone?.();
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------ dialog */

function Overlay({ children, onClose, side }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return createPortal(
    <div className={cx("dl-overlay", side && "dl-overlay--side")} onMouseDown={onClose}>
      <div onMouseDown={(e) => e.stopPropagation()} className={side ? "dl-drawer" : "dl-dialog"} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ReviewDialog({ type, id, name, action, onClose, onDone }) {
  const a = ACTION[action];
  const [comment, setComment] = useState("");
  const [touched, setTouched] = useState(false);
  const [review, { isLoading }] = useReviewDocumentMutation();
  const { data } = useGetDocReviewsQuery({ type, id }, { skip: !id });
  const missing = a.needsComment && !comment.trim();
  const submit = async () => {
    setTouched(true);
    if (missing) return;
    try {
      await review({ entity_type: type, entity_id: id, action, comment: comment.trim() }).unwrap();
      toast.success(`${name || "Document"}: ${a.past.toLowerCase()}`);
      onDone?.();
    } catch (e) {
      toast.error(e?.data?.message || "Review could not be saved");
    }
  };
  return (
    <Overlay onClose={onClose}>
      <div className="dl-dialog__head">
        <span className={cx("dl-dialog__icon", `dl-tone--${a.tone}`)}>
          <a.icon aria-hidden size={18} />
        </span>
        <div style={{ minWidth: 0 }}>
          <h2 className="dl-dialog__title">{a.label}</h2>
          {name && <p className="dl-dialog__sub">{name}</p>}
        </div>
        <button type="button" className="dl-x" onClick={onClose} aria-label="Close">
          <X size={16} aria-hidden />
        </button>
      </div>
      <div className="dl-dialog__body">
        <label className="inos-label" htmlFor="dl-review-comment">
          Comment{a.needsComment ? <span className="req">*</span> : <span className="opt">(optional)</span>}
        </label>
        <textarea
          id="dl-review-comment"
          className="inos-textarea"
          rows={4}
          autoFocus
          value={comment}
          maxLength={4000}
          onChange={(e) => setComment(e.target.value)}
          aria-invalid={touched && missing ? true : undefined}
          placeholder={a.needsComment ? "What needs to change?" : "Add a note"}
          data-testid="review-comment"
        />
        {touched && missing && <span className="inos-error">A comment is required.</span>}
        {data?.reviews?.length > 0 && (
          <div className="dl-dialog__history">
            <div className="dl-subtitle">Previous comments</div>
            <ReviewTimeline reviews={data.reviews.slice(0, 3)} />
          </div>
        )}
      </div>
      <div className="dl-dialog__foot">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={submit} loading={isLoading} data-testid="review-submit">
          {a.label}
        </Button>
      </div>
    </Overlay>
  );
}

/* ------------------------------------------------------------ history */

export function ReviewTimeline({ reviews = [] }) {
  if (!reviews.length) return <p className="dl-empty">No reviews yet.</p>;
  return (
    <ol className="dl-timeline">
      {reviews.map((r) => {
        const a = ACTION[r.action] || ACTION.approve;
        return (
          <li key={r.id} className="dl-timeline__item">
            <span className={cx("dl-timeline__dot", `dl-tone--${a.tone}`)}>
              <a.icon size={12} aria-hidden />
            </span>
            <div className="dl-timeline__body">
              <div className="dl-timeline__meta">
                <strong>{a.past}</strong>
                {r.version ? <span>v{r.version}</span> : null}
                <span>{r.user_name || "—"}</span>
                <span>{fmtDateTime(r.created_at)}</span>
              </div>
              {r.comment && <p className="dl-timeline__comment">{r.comment}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Drawer with the review history (comments) and the revisions of one document.
 * earlier: other saved rows of the same document (row-based versions), [{id, version, updatedAt, viewTo}]
 */
export function HistoryDrawer({ type, id, name, version, canReview, onClose, earlier = [], onViewEarlier, initialTab = "reviews" }) {
  const [tab, setTab] = useState(initialTab);
  const { data, isFetching } = useGetDocReviewsQuery({ type, id }, { skip: !id });
  const [action, setAction] = useState(null);
  const [viewing, setViewing] = useState(null);
  const revisions = data?.revisions ?? [];
  return (
    <Overlay onClose={onClose} side>
      <div className="dl-dialog__head">
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 className="dl-dialog__title">{name || "Document"}</h2>
          <p className="dl-dialog__sub">Current version v{version ?? 1}</p>
        </div>
        <button type="button" className="dl-x" onClick={onClose} aria-label="Close">
          <X size={16} aria-hidden />
        </button>
      </div>
      <div className="dl-drawer__tabs inos-segmented" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "reviews"} onClick={() => setTab("reviews")}>
          Reviews {data?.reviews?.length ? `(${data.reviews.length})` : ""}
        </button>
        <button type="button" role="tab" aria-selected={tab === "revisions"} onClick={() => setTab("revisions")}>
          Revisions {revisions.length + earlier.length ? `(${revisions.length + earlier.length})` : ""}
        </button>
      </div>
      <div className="dl-drawer__body">
        {tab === "reviews" ? (
          <>
            {canReview && (
              <div className="dl-drawer__actions">
                {REVIEW_ACTIONS.map((a) => (
                  <Button key={a.key} size="sm" icon={a.icon} onClick={() => setAction(a.key)}>
                    {a.label}
                  </Button>
                ))}
              </div>
            )}
            {isFetching && !data ? <p className="dl-empty">Loading…</p> : <ReviewTimeline reviews={data?.reviews} />}
          </>
        ) : (
          <ol className="dl-revisions">
            <li className="dl-revisions__item is-current">
              <strong>v{version ?? 1}</strong>
              <span>Current</span>
            </li>
            {earlier.map((e) => (
              <li key={e.id} className="dl-revisions__item">
                <strong>v{e.version}</strong>
                <span>{fmtDateTime(e.updatedAt)}</span>
                {onViewEarlier && (
                  <button type="button" className="dl-link" onClick={() => onViewEarlier(e)}>
                    View
                  </button>
                )}
              </li>
            ))}
            {revisions.map((r) => (
              <li key={r.id} className="dl-revisions__item">
                <strong>v{r.version}</strong>
                <span>
                  Saved {fmtDateTime(r.created_at)}
                  {r.user_name ? ` · replaced by ${r.user_name}` : ""}
                </span>
                <span className="dl-revisions__actions">
                  <button type="button" className="dl-link" onClick={() => setViewing(r)} data-testid="revision-view">
                    View
                  </button>
                </span>
              </li>
            ))}
            {!revisions.length && !earlier.length && <p className="dl-empty">No earlier versions. Saving this document again keeps the previous one here.</p>}
          </ol>
        )}
      </div>
      {viewing && (
        <RevisionViewer
          type={type}
          id={id}
          name={name}
          revision={viewing}
          onClose={() => setViewing(null)}
          onRestored={() => window.location.reload()}
        />
      )}
      {action && (
        <ReviewDialog type={type} id={id} name={name} action={action} onClose={() => setAction(null)} onDone={() => setAction(null)} />
      )}
    </Overlay>
  );
}

/** Status pill for a document from its review state (falls back to the model status). */
export function ReviewStatusPill({ state, status, prettyStatus, toneFor }) {
  if (state && REVIEW_STATE[state]) return <Pill tone={REVIEW_STATE[state].tone}>{REVIEW_STATE[state].label}</Pill>;
  if (status) return <Pill tone={toneFor(status)}>{prettyStatus(String(status).toLowerCase())}</Pill>;
  return <Pill tone="mute">Pending review</Pill>;
}

/**
 * Review bar for a document's view page: status, version, latest comment,
 * the Review menu and the history drawer. Hidden when printing.
 */
export function DocumentReviewBar({ type, id, name, status, version: versionProp }) {
  const { data } = useGetDocReviewsQuery({ type, id }, { skip: !id || !type });
  const [open, setOpen] = useState(null);
  if (!id || !type) return null;
  const state = data?.state;
  const last = data?.reviews?.[0];
  const version = versionProp ?? state?.snapshotVersion;
  return (
    <div className="dl-viewbar" data-testid="doc-review-bar">
      <ReviewStatusPillLite state={state?.state} status={status} />
      {version ? (
        <button type="button" className="dl-version" onClick={() => setOpen("revisions")} title="Revisions">
          v{version}
        </button>
      ) : null}
      <span className="dl-viewbar__last" title={last?.comment || undefined}>
        {last ? `${REVIEW_STATE[last.action]?.label || last.action} by ${last.user_name || "—"} · ${fmtDateTime(last.created_at)}${last.comment ? ` — “${last.comment}”` : ""}` : "No reviews yet"}
      </span>
      <ReviewMenu
        type={type}
        id={id}
        name={name}
        canReview={!!data?.canReview}
        count={data?.reviews?.length || 0}
        onOpenHistory={() => setOpen("reviews")}
      />
      {open && (
        <HistoryDrawer type={type} id={id} name={name} version={version} canReview={!!data?.canReview} initialTab={open} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}

function ReviewStatusPillLite({ state, status }) {
  if (state && REVIEW_STATE[state]) return <Pill tone={REVIEW_STATE[state].tone}>{REVIEW_STATE[state].label}</Pill>;
  if (status) return <Pill tone="mute">{String(status).toLowerCase().replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}</Pill>;
  return <Pill tone="mute">Pending review</Pill>;
}
