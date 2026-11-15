import { useLayoutEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { Plus, Trophy, XCircle, PauseCircle } from 'lucide-react';
import { stageOf, formatINR } from '@/hooks/stages';
import DealCard, { DealCardBody } from './DealCard';

function Column({ col, onOpen, onQuickAdd, onEdit, onTag }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${col.id}`, data: { stage: col.id } });
  const s = stageOf(col.id);
  return (
    <section
      ref={setNodeRef}
      className={`crm-col ${col.closed ? 'crm-col--closed' : ''} ${isOver ? 'is-over' : ''}`}
      style={{ '--stage-dot': s.accent }}
      data-testid={`stage-col-${col.id}`}
    >
      <header className="crm-col__head">
        <div className="crm-col__title">
          <h3 title={col.label}>{col.label}</h3>
          <span className="crm-col__count">{col.leads.length}</span>
          <button
            type="button"
            className="crm-col__add"
            onClick={() => onQuickAdd(col.id)}
            title={`Add a deal to ${col.label}`}
            aria-label={`Add a deal to ${col.label}`}
          >
            <Plus />
          </button>
        </div>
        <div className="crm-col__meta">
          <span>{col.leads.length === 1 ? '1 deal' : `${col.leads.length} deals`}</span>
          <b>{formatINR(col.leads.reduce((a, d) => a + (d.amount || 0), 0))}</b>
        </div>
      </header>
      <div className="crm-col__body">
        {col.leads.length === 0 ? (
          <div className="crm-col__empty">{isOver ? 'Drop here' : 'No deals in this stage'}</div>
        ) : (
          col.leads.map((deal) => (
            <DealCard key={deal.id} deal={deal} onOpen={onOpen} onEdit={onEdit} onTag={onTag} />
          ))
        )}
      </div>
    </section>
  );
}

function DropZone({ id, label, icon: Icon, variant }) {
  const { setNodeRef, isOver } = useDroppable({ id: `zone:${id}`, data: { stage: id } });
  return (
    <div
      ref={setNodeRef}
      className={`crm-dropzone crm-dropzone--${variant} ${isOver ? 'is-over' : ''}`}
      data-testid={`dropzone-${id}`}
    >
      <Icon aria-hidden /> {label}
    </div>
  );
}

/**
 * Kanban with dnd-kit. Cards drop onto a column (or the won / lost / nurture
 * bar that appears while dragging). The parent persists the move.
 */
export default function KanbanBoard({
  columns,
  showClosed,
  onMove,
  onOpen,
  onQuickAdd,
  onEdit,
  onTag,
}) {
  const [active, setActive] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const visible = columns.filter((c) => showClosed || !c.closed);

  // The board fills the viewport below whatever sits above it (header,
  // filters), so every column runs to the bottom of the screen and scrolls
  // its own cards — no column ever "ends" part-way down the page.
  const scrollRef = useRef(null);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    let frame = 0;
    const fit = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const top = el.getBoundingClientRect().top + window.scrollY;
        // bottom padding of the page/shell wrappers sits below the board too
        let below = 0;
        for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
          const cs = getComputedStyle(n);
          below += (parseFloat(cs.paddingBottom) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
        }
        const h = Math.max(320, Math.floor(window.innerHeight - top - below - 4));
        el.style.setProperty('--crm-board-h', `${h}px`);
      });
    };
    fit();
    window.addEventListener('resize', fit);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    if (ro && el.parentElement) ro.observe(el.parentElement);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', fit);
      ro?.disconnect();
    };
  }, []);

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
      <div className="crm-board-scroll" ref={scrollRef}>
        <div className="crm-board" data-testid="kanban-board">
          {visible.map((col) => (
            <Column
              key={col.id}
              col={col}
              onOpen={onOpen}
              onQuickAdd={onQuickAdd}
              onEdit={onEdit}
              onTag={onTag}
            />
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
        {active ? (
          <DealCardBody deal={active} className="is-overlay" style={{ width: 256 }} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
