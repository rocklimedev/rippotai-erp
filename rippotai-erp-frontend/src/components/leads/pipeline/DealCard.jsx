import { forwardRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CalendarClock, Clock, ListTodo, AlertTriangle, MessageSquare } from "lucide-react";
import { Avatar, Pill } from "@/components/inos";
import { formatINR, LEAD_COLORS, TAG_COLORS } from "@/hooks/stages";
import { shortDate, isPast } from "./utils";

/** Presentational card — also used inside the DragOverlay. */
export const DealCardBody = forwardRef(function DealCardBody(
  { deal, className = "", style, onOpen, ...rest },
  ref,
) {
  const rail = deal.color ? LEAD_COLORS[deal.color]?.rail : deal.stuck ? "var(--warn-dot)" : null;
  const closeLate = deal.expectedClose && isPast(deal.expectedClose) && ["capture", "qual", "disc", "prop", "nego"].includes(deal.stage);
  const next = deal.nextTask;
  const nextLate = next?.dueDate && isPast(next.dueDate);
  const client = deal.clientName || deal.company || (deal.contact !== deal.title ? deal.contact : null);

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      className={`crm-card ${className}`}
      style={{ ...style, "--rail": rail || "transparent" }}
      onClick={() => onOpen?.(deal)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen?.(deal);
      }}
      data-testid="deal-card"
      data-deal-id={deal.id}
      {...rest}
    >
      <span className="crm-card__rail" aria-hidden />
      <p className="crm-card__title" title={deal.title}>
        {deal.title}
      </p>
      {(client || deal.source) && (
        <div className="crm-card__client" title={[client, deal.source].filter(Boolean).join(" · ")}>
          {client}
          {deal.source && <span style={{ color: "var(--text-3)" }}>{client ? " · " : ""}{deal.source}</span>}
        </div>
      )}

      <div className="crm-card__row">
        <span className="crm-card__value">{deal.amount ? formatINR(deal.amount) : "No value"}</span>
        <span title={deal.owner || "Unassigned"} style={{ display: "inline-flex" }}>
          <Avatar name={deal.owner || "?"} size={24} />
        </span>
      </div>

      <div className="crm-card__meta">
        {deal.expectedClose && (
          <span className={`crm-meta-item ${closeLate ? "is-late" : ""}`} title="Expected close">
            <CalendarClock aria-hidden />
            {shortDate(deal.expectedClose)}
          </span>
        )}
        <span className="crm-meta-item" title="Days in this stage">
          <Clock aria-hidden />
          {deal.daysInStage}d
        </span>
        {deal.notesCount > 0 && (
          <span className="crm-meta-item" title="Notes">
            <MessageSquare aria-hidden />
            {deal.notesCount}
          </span>
        )}
        {deal.stuck && (
          <Pill tone="warn" dot={false} size="sm">
            <AlertTriangle size={11} aria-hidden /> Stuck
          </Pill>
        )}
        {deal.tag && (
          <Pill tone={TAG_COLORS[deal.tag]?.tone || "mute"} size="sm">
            {deal.tag}
          </Pill>
        )}
      </div>

      {next && (
        <div className="crm-card__next" title="Next activity">
          <ListTodo aria-hidden />
          <span style={nextLate ? { color: "var(--bad-fg)", fontWeight: 600 } : undefined}>
            {next.dueDate ? `${shortDate(next.dueDate)} · ` : ""}
            {next.title}
          </span>
        </div>
      )}
    </div>
  );
});

/** Draggable card on the board. */
export default function DealCard({ deal, onOpen }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  });
  return (
    <DealCardBody
      ref={setNodeRef}
      deal={deal}
      onOpen={onOpen}
      className={isDragging ? "is-dragging" : ""}
      {...attributes}
      {...listeners}
    />
  );
}
