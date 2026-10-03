import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { Plus, Trophy, XCircle, PauseCircle } from "lucide-react";
import { stageOf, formatINR } from "@/hooks/stages";
import DealCard, { DealCardBody } from "./DealCard";

function Column({ col, onOpen, onQuickAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${col.id}`, data: { stage: col.id } });
  const s = stageOf(col.id);
  return (
    <section
      ref={setNodeRef}
      className={`crm-col ${col.closed ? "crm-col--closed" : ""} ${isOver ? "is-over" : ""}`}
      style={{ "--stage-dot": s.accent }}
      data-testid={`stage-col-${col.id}`}
    >
      <header className="crm-col__head">
        <div className="crm-col__title">
          <h3 title={col.label}>{col.label}</h3>
          <span className="crm-col__count">{col.leads.length}</span>
          <button type="button" className="crm-col__add" onClick={() => onQuickAdd(col.id)} title={`Add a deal to ${col.label}`} aria-label={`Add a deal to ${col.label}`}>
            <Plus />
          </button>
        </div>
        <div className="crm-col__meta">
          <span>{col.leads.length === 1 ? "1 deal" : `${col.leads.length} deals`}</span>
          <b>{formatINR(col.leads.reduce((a, d) => a + (d.amount || 0), 0))}</b>
        </div>
      </header>
      <div className="crm-col__body">
        {col.leads.length === 0 ? (
          <div className="crm-col__empty">{isOver ? "Drop here" : "No deals in this stage"}</div>
        ) : (
          col.leads.map((deal) => <DealCard key={deal.id} deal={deal} onOpen={onOpen} />)
        )}
      </div>
    </section>
  );
}

function DropZone({ id, label, icon: Icon, variant }) {
  const { setNodeRef, isOver } = useDroppable({ id: `zone:${id}`, data: { stage: id } });
  return (
    <div ref={setNodeRef} className={`crm-dropzone crm-dropzone--${variant} ${isOver ? "is-over" : ""}`} data-testid={`dropzone-${id}`}>
      <Icon aria-hidden /> {label}
    </div>
  );
}

/**
 * Kanban with dnd-kit. Cards drop onto a column (or the won / lost / nurture
 * bar that appears while dragging). The parent persists the move.
 */
export default function KanbanBoard({ columns, showClosed, onMove, onOpen, onQuickAdd }) {
  const [active, setActive] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const visible = columns.filter((c) => showClosed || !c.closed);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActive(e.active.data.current?.deal || null)}
      onDragCancel={() => setActive(null)}
      onDragEnd={(e) => {
        const deal = e.active.data.current?.deal;
        const stage = e.over?.data.current?.stage;
        setActive(null);
        if (deal && stage && stage !== deal.stage) onMove(deal, stage);
      }}
    >
      <div className="crm-board-scroll">
        <div className="crm-board" data-testid="kanban-board">
          {visible.map((col) => (
            <Column key={col.id} col={col} onOpen={onOpen} onQuickAdd={onQuickAdd} />
          ))}
        </div>
      </div>

      {active && (
        <div className="crm-dropbar">
          <DropZone id="contract" label="Won" icon={Trophy} variant="won" />
          <DropZone id="nurture" label="Nurture" icon={PauseCircle} variant="nurture" />
          <DropZone id="lost" label="Lost" icon={XCircle} variant="lost" />
        </div>
      )}

      <DragOverlay dropAnimation={null}>
        {active ? <DealCardBody deal={active} className="is-overlay" style={{ width: 256 }} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
