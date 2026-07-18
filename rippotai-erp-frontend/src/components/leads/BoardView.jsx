import { useState } from "react";
import { useGetBoardQuery, useMoveStageMutation } from "../api/leadsApi";
import LeadCard from "../components/LeadCard";

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
      <div style={{ padding: "28px", color: "#6E7F8D", fontSize: "13px" }}>
        Loading pipeline…
      </div>
    );
  if (isError || !data)
    return (
      <div style={{ padding: "28px", color: "#B0483A", fontSize: "13px" }}>
        Couldn't load the pipeline board.
      </div>
    );

  return (
    <div
      style={{
        padding: "20px 28px 28px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: 700 }}>
          Pipeline Overview
        </div>
        <div style={{ fontSize: "13px", color: "#6E7F8D" }}>
          {data.activeCount} active leads
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: "14px",
          overflowX: "auto",
          alignItems: "flex-start",
          paddingBottom: "10px",
        }}
      >
        {data.columns.map((col) => {
          const over = dragOverCol === col.id && dragId != null;
          const colStyle = {
            flex: "0 0 248px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            minHeight: "160px",
            padding: "4px",
            margin: "-4px",
            borderRadius: "14px",
            background: over ? "#E4EBF1" : "transparent",
            outline: over ? "1.5px dashed #6E7F8D" : "none",
            transition: "background 0.12s",
          };
          return (
            <div
              key={col.id}
              style={colStyle}
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 2px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 400,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: col.leads.some((l) => l.stuck)
                      ? "#B07A1E"
                      : "#6E7F8D",
                  }}
                >
                  {col.label}
                </span>
                <span
                  style={{
                    background: "#E4EBF1",
                    color: "#6E7F8D",
                    fontSize: "11px",
                    fontWeight: 400,
                    padding: "1px 8px",
                    borderRadius: "999px",
                  }}
                >
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
