import { useState } from "react";
import { useGetBoardQuery, useMoveStageMutation } from "../../api/leads.api";
import LeadCard from "./LeadCard";

export default function BoardView({
  onOpenLead,
  onEditLead,
  onRemark,
  onProposed,
}) {
  const { data, isLoading, isError } = useGetBoardQuery();
  const [moveStage] = useMoveStageMutation();
  const [dragId, setDragId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  if (isLoading)
    return (
      <div className="p-7 text-[var(--muted)] text-[13px]">
        Loading pipeline…
      </div>
    );
  if (isError || !data)
    return (
      <div className="p-7 text-[13px]" style={{ color: "#a54536" }}>
        Couldn't load the pipeline board.
      </div>
    );

  return (
    <div className="flex flex-col gap-4 px-7 pt-5 pb-7 min-w-0">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-[16px] font-semibold text-[var(--ink-green)]">
          Pipeline Overview
        </div>
        <div className="text-[13px] text-[var(--muted)]">
          {data.activeCount} active leads
        </div>
      </div>

      <div className="flex gap-3.5 overflow-x-auto items-start pb-2.5">
        {data.columns.map((col) => {
          const over = dragOverCol === col.id && dragId != null;
          return (
            <div
              key={col.id}
              className="flex flex-col gap-2.5 min-h-[160px] p-1 -m-1 rounded-[14px] transition-colors"
              style={{
                flex: "0 0 250px",
                background: over ? "var(--sage-soft)" : "transparent",
                outline: over ? "1.5px dashed var(--ink-green)" : "none",
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverCol !== col.id) setDragOverCol(col.id);
              }}
              onDragLeave={(e) => {
                if (
                  !e.currentTarget.contains(e.relatedTarget) &&
                  dragOverCol === col.id
                )
                  setDragOverCol(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId != null)
                  moveStage({ id: dragId, stage: col.id, via: "drag" });
                setDragId(null);
                setDragOverCol(null);
              }}
            >
              <div className="flex items-center justify-between px-0.5">
                <span
                  className="eyebrow text-[11px]"
                  style={
                    col.leads.some((l) => l.stuck)
                      ? { color: "#a3701a" }
                      : undefined
                  }
                >
                  {col.label}
                </span>
                <span className="bg-[var(--mist)] text-[var(--muted)] text-[11px] font-medium px-2 py-[1px] rounded-full">
                  {col.leads.length}
                </span>
              </div>
              {col.leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  dragging={dragId === lead.id}
                  onClick={onOpenLead}
                  onEdit={onEditLead}
                  onRemark={onRemark}
                  onProposed={onProposed}
                  onDragStart={setDragId}
                  onDragEnd={() => {
                    setDragId(null);
                    setDragOverCol(null);
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
