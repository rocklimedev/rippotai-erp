import { useEffect, useState } from "react";
import {
  useGetBoardQuery,
  useMoveStageMutation,
} from "../../api/connectors/leads.api";
import { useZohoStatusQuery } from "../../api/auth/authConnectors.api";
import { STAGES, getStageAccent, stageOf } from "../../hooks/stages";

import LeadCard from "../../components/leads/LeadCard";
import LeadActionModal from "../../components/leads/LeadActionModal";

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
  // ------------------------------------------------------------
  // ZOHO CONNECTION STATUS
  // ------------------------------------------------------------

  const {
    data: zohoStatus,
    isLoading: isZohoStatusLoading,
    isFetching: isZohoStatusFetching,
  } = useZohoStatusQuery(undefined, {
    pollingInterval: 5000,
  });

  /*
   * Keep this flexible because your backend response may be:
   *
   * { connected: true }
   * { isConnected: true }
   * { connected: false }
   *
   * Adjust this once you know the exact backend response.
   */
  const zohoConnected =
    zohoStatus?.connected === true ||
    zohoStatus?.isConnected === true ||
    zohoStatus?.status === "connected";

  // ------------------------------------------------------------
  // LEADS BOARD
  // ------------------------------------------------------------

  const { data, isLoading, isFetching, isError, refetch } = useGetBoardQuery(
    undefined,
    {
      skip: !zohoConnected,
    },
  );

  const [moveStage] = useMoveStageMutation();

  const [dragId, setDragId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [modal, setModal] = useState(null);

  // ------------------------------------------------------------
  // WHEN ZOHO CONNECTS
  // ------------------------------------------------------------

  useEffect(() => {
    if (zohoConnected) {
      refetch();
    }
  }, [zohoConnected, refetch]);

  // ------------------------------------------------------------
  // MODALS
  // ------------------------------------------------------------

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

  // ------------------------------------------------------------
  // ZOHO STATUS LOADING
  // ------------------------------------------------------------

  if (isZohoStatusLoading) {
    return (
      <div className="flex items-center justify-center min-h-[420px] text-sm text-[var(--muted)]">
        Checking Zoho connection...
      </div>
    );
  }

  // ------------------------------------------------------------
  // ZOHO NOT CONNECTED
  // ------------------------------------------------------------

  if (!zohoConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] px-6 text-center">
        <div className="w-full max-w-md rounded-2xl border border-[var(--stroke)] bg-paper p-7">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--mist)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#a54536]" />
          </div>

          <h2 className="text-[16px] font-semibold text-[var(--ink-green)]">
            Zoho Bigin is not connected
          </h2>

          <p className="mt-2 text-[12.5px] leading-5 text-[var(--muted)]">
            Connect your Zoho Bigin account to load and manage leads from the
            pipeline.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--mist)] px-3 py-1.5 text-[11px] font-semibold text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a54536]" />
            Disconnected
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // BOARD LOADING
  // ------------------------------------------------------------

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

  // Reconcile whatever the API sent back with the canonical Bigin
  // stage list, in the fixed pipeline order shown in Zoho — Bigin
  // itself always renders every stage as a column even when it's
  // empty (see "Needs Analysis · 0 Deal" in the screenshot), so we
  // do the same instead of only drawing columns that have leads.
  const columnsById = new Map((data.columns || []).map((c) => [c.id, c]));

  const knownColumns = STAGES.map((stage) => {
    const existing = columnsById.get(stage.id);

    return (
      existing || {
        id: stage.id,
        label: stage.label,
        leads: [],
      }
    );
  });

  // Any stage the backend returns that isn't in our known list (e.g.
  // a stage added in Bigin after STAGES was last updated) still gets
  // shown, appended after the canonical columns, so nothing silently
  // disappears from the board.
  const extraColumns = (data.columns || []).filter(
    (c) => !STAGES.some((s) => s.id === c.id),
  );

  const columns = [...knownColumns, ...extraColumns];

  return (
    <div className="flex flex-col min-w-0 h-full">
      {/* ---------------------------------------------------------- */}
      {/* BOARD HEADER                                                */}
      {/* ---------------------------------------------------------- */}

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

              {/* ZOHO CONNECTION INDICATOR */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef7f1] px-2.5 py-1 text-[10px] font-semibold text-[#3f6d5f]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3f6d5f]" />
                Zoho connected
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

      {/* ---------------------------------------------------------- */}
      {/* BOARD                                                       */}
      {/* ---------------------------------------------------------- */}

      <div className="flex-1 min-w-0 overflow-x-auto px-7 pb-8">
        <div className="flex items-start gap-4 min-w-max">
          {columns.map((col) => {
            const isOver = dragOverCol === col.id && dragId != null;

            const accent = getStageAccent(col.id);
            const label = col.label || stageOf(col.id).label;

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
                {/* STAGE HEADER */}

                <div
                  className="px-3.5 pt-3.5 pb-3 rounded-t-2xl border-t-2"
                  style={{ borderTopColor: accent }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: accent }}
                      />

                      <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--ink-green)] truncate">
                        {label}
                      </h2>

                      <span className="inline-flex min-w-[22px] h-[20px] items-center justify-center rounded-full bg-paper border border-[var(--stroke)] px-1.5 text-[10px] font-bold text-[var(--muted)]">
                        {col.leads.length}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10.5px] text-[var(--muted)]">
                      {col.leads.length === 1
                        ? "1 Deal"
                        : `${col.leads.length} Deal`}
                    </span>

                    <span
                      className="text-[10.5px] font-semibold"
                      style={{ color: accent }}
                    >
                      ₹{formatCurrency(stageValue) || "0"}
                    </span>
                  </div>
                </div>

                {/* CARDS */}

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
                        This stage is empty
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

      <LeadActionModal modal={modal} onClose={closeModal} />
    </div>
  );
}
