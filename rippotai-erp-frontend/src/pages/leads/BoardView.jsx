import { useState } from "react";
import { useGetBoardQuery, useMoveStageMutation } from "../../api/leads.api";

import LeadCard from "../../components/leads/LeadCard";
import LeadActionModal from "../../components/leads/LeadActionModal";

const STAGE_ACCENTS = {
  new: "#3f6d8a",
  contacted: "#6b7f68",
  qualified: "#8a6b3f",
  proposed: "#6c5b7c",
  won: "#3f6d5f",
  lost: "#a54536",
};

const getStageAccent = (id) => {
  const key = String(id || "").toLowerCase();

  return (
    Object.entries(STAGE_ACCENTS).find(([name]) => key.includes(name))?.[1] ||
    "var(--ink-green)"
  );
};

const formatCurrency = (value) => {
  if (value == null || value === "") return null;

  if (typeof value === "number") {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(value);
  }

  return String(value);
};

export default function BoardView({ onOpenLead, onEditLead }) {
  const { data, isLoading, isError } = useGetBoardQuery();
  const [moveStage] = useMoveStageMutation();

  const [dragId, setDragId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const [modal, setModal] = useState(null);

  const openRemark = (lead) => {
    setModal({
      kind: "remark",
      lead,
    });
  };

  const openProposed = (lead) => {
    setModal({
      kind: "proposed",
      lead,
    });
  };

  const closeModal = () => {
    setModal(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[420px] text-sm text-[var(--muted)]">
        Loading pipeline...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-7 my-6 rounded-xl border border-[#ead5d0] bg-[#fff8f6] px-4 py-3 text-sm text-[#a54536]">
        Couldn't load the pipeline board.
      </div>
    );
  }

  const totalLeads = data.activeCount ?? 0;

  return (
    <div className="flex flex-col min-w-0 h-full">
      {/* -------------------------------------------------------------- */}
      {/* BOARD HEADER                                                    */}
      {/* -------------------------------------------------------------- */}

      <div className="px-7 pt-6 pb-5">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--ink-green)]">
                Leads Pipeline
              </h1>

              <span className="inline-flex items-center rounded-full bg-[var(--mist)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]">
                {totalLeads} active
              </span>
            </div>

            <p className="mt-1.5 text-[12.5px] text-[var(--muted)]">
              Move leads through the pipeline and keep every opportunity moving
              forward.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] text-[var(--muted)]">
            <span className="h-2 w-2 rounded-full bg-[var(--ink-green)]" />
            Drag cards between stages
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------- */}
      {/* BOARD                                                           */}
      {/* -------------------------------------------------------------- */}

      <div className="flex-1 min-w-0 overflow-x-auto px-7 pb-8">
        <div className="flex items-start gap-4 min-w-max">
          {data.columns.map((col) => {
            const isOver = dragOverCol === col.id && dragId != null;
            const accent = getStageAccent(col.id);

            const stageValue = col.leads.reduce((sum, lead) => {
              const raw =
                lead.budgetValue ??
                lead.budgetAmount ??
                lead.value ??
                lead.budget;

              if (typeof raw === "number") {
                return sum + raw;
              }

              const parsed = Number(String(raw || "").replace(/[₹,\s]/g, ""));

              return Number.isFinite(parsed) ? sum + parsed : sum;
            }, 0);

            return (
              <section
                key={col.id}
                className={[
                  "flex flex-col w-[292px] shrink-0 rounded-2xl transition-all duration-150",
                  isOver
                    ? "bg-[var(--sage-soft)] ring-1 ring-dashed ring-[var(--ink-green)]"
                    : "bg-[var(--mist-soft)]",
                ].join(" ")}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";

                  if (dragOverCol !== col.id) {
                    setDragOverCol(col.id);
                  }
                }}
                onDragLeave={(e) => {
                  if (
                    !e.currentTarget.contains(e.relatedTarget) &&
                    dragOverCol === col.id
                  ) {
                    setDragOverCol(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();

                  if (dragId != null) {
                    moveStage({
                      id: dragId,
                      stage: col.id,
                      via: "drag",
                    });
                  }

                  setDragId(null);
                  setDragOverCol(null);
                }}
              >
                {/* ---------------------------------------------------- */}
                {/* STAGE HEADER                                          */}
                {/* ---------------------------------------------------- */}

                <div className="px-3.5 pt-3.5 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: accent }}
                      />

                      <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--ink-green)] truncate">
                        {col.label}
                      </h2>

                      <span className="inline-flex min-w-[22px] h-[20px] items-center justify-center rounded-full bg-paper border border-[var(--stroke)] px-1.5 text-[10px] font-bold text-[var(--muted)]">
                        {col.leads.length}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10.5px] text-[var(--muted)]">
                      {col.leads.length === 1
                        ? "1 opportunity"
                        : `${col.leads.length} opportunities`}
                    </span>

                    {stageValue > 0 && (
                      <span className="text-[10.5px] font-semibold text-[var(--ink-green)]">
                        ₹{formatCurrency(stageValue)}
                      </span>
                    )}
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* CARDS                                                  */}
                {/* ---------------------------------------------------- */}

                <div className="flex flex-col gap-2 px-2 pb-2">
                  {col.leads.length === 0 ? (
                    <div
                      className={[
                        "flex min-h-[120px] items-center justify-center rounded-xl border border-dashed",
                        isOver
                          ? "border-[var(--ink-green)] bg-paper"
                          : "border-[var(--stroke)]",
                      ].join(" ")}
                    >
                      <span className="text-[11px] text-[var(--muted)]">
                        Drop a lead here
                      </span>
                    </div>
                  ) : (
                    col.leads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        dragging={dragId === lead.id}
                        onClick={onOpenLead}
                        onEdit={onEditLead}
                        onRemark={openRemark}
                        onProposed={openProposed}
                        onDragStart={setDragId}
                        onDragEnd={() => {
                          setDragId(null);
                          setDragOverCol(null);
                        }}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------- */}
      {/* LEAD ACTION MODAL                                               */}
      {/* -------------------------------------------------------------- */}

      <LeadActionModal modal={modal} onClose={closeModal} />
    </div>
  );
}
