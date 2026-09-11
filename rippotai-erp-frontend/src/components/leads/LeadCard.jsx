import { useState } from "react";
import { pill, TAG_COLORS, LEAD_COLORS } from "../../hooks/stages";
import { useUpdateLeadMutation } from "../../api/connectors/leads.api";

const COLOR_DOTS = [
  ["None", "#ffffff"],
  ["Green", "#1f453b"],
  ["Red", "#a54536"],
  ["Yellow", "#c98f2b"],
  ["Blue", "#3f6d8a"],
];

const formatBudget = (value) => {
  if (value == null || value === "") return null;

  if (typeof value === "number") {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(value);
  }

  return String(value);
};

// Bigin gives us Created_Time, not a precomputed "days" field —
// derive an "N days" label from it instead of reading lead.days
// (which never exists on Pipelines records).
const daysSinceCreated = (createdAt) => {
  if (!createdAt) return null;

  const created = new Date(createdAt);

  if (Number.isNaN(created.getTime())) return null;

  return Math.max(0, Math.floor((Date.now() - created.getTime()) / 86400000));
};

export default function LeadCard({
  lead,
  onClick,
  onEdit,
  onRemark,
  onProposed,
  onDragStart,
  onDragEnd,
  dragging,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  // ============================================================
  // BIGIN LEAD UPDATE
  // ============================================================

  const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();

  // ============================================================
  // LEAD DISPLAY
  // ============================================================

  const cc = lead.color && LEAD_COLORS[lead.color];

  const railColor = cc ? cc.rail : lead.stuck ? "#c98f2b" : "var(--sage)";

  const tagStyle = lead.tag
    ? pill(TAG_COLORS[lead.tag]?.fg, TAG_COLORS[lead.tag]?.bg)
    : null;

  const daysAgo = daysSinceCreated(lead.createdAt);

  const daysLabel =
    daysAgo == null
      ? null
      : daysAgo === 0
        ? "Today"
        : daysAgo === 1
          ? "1 day"
          : `${daysAgo} days`;

  const whatsappNumber = lead.whatsapp || lead.phone;

  // Subtitle: prefer account/contact (Pipelines module) over
  // type/location, which don't exist on Pipelines records.
  const subtitle = [lead.company, lead.contact].filter(Boolean).join(" · ");

  // ============================================================
  // WHATSAPP
  // ============================================================

  const openWhatsApp = (e) => {
    e.stopPropagation();

    if (!whatsappNumber) return;

    const number = String(whatsappNumber).replace(/[^0-9]/g, "");

    window.open(`https://wa.me/${number}`, "_blank", "noopener,noreferrer");
  };

  // ============================================================
  // STOP CARD CLICK
  // ============================================================

  const stopCardClick = (e) => {
    e.stopPropagation();
  };

  // ============================================================
  // UPDATE BIGIN LEAD
  // ============================================================

  const updateBiginLead = async (body) => {
    if (!lead?.id) return;

    try {
      await updateLead({
        id: lead.id,
        ...body,
      }).unwrap();

      setMenuOpen(false);
    } catch (error) {
      console.error("Failed to update Bigin lead:", error);
    }
  };

  // ============================================================
  // MARK AS NURTURE
  // ============================================================

  const handleNurture = async () => {
    await updateBiginLead({
      Stage: "Nurture",
    });
  };

  // ============================================================
  // MARK AS LOST
  // ============================================================

  const handleLost = async () => {
    await updateBiginLead({
      Stage: "Closed Lost",
    });
  };

  // ============================================================
  // MARK AS PROPOSED
  // ============================================================

  const handleProposed = () => {
    setMenuOpen(false);

    if (onProposed) {
      onProposed(lead);
    }
  };

  // ============================================================
  // COLOR
  // ============================================================

  const handleColorChange = async (name) => {
    await updateBiginLead({
      Card_Color: name === "None" ? null : name,
    });
  };

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(lead.id));

        onDragStart(lead.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onClick(lead)}
      className={[
        "group relative overflow-visible rounded-xl border bg-paper",
        "border-[var(--stroke)]",
        "transition-all duration-150",
        "cursor-grab active:cursor-grabbing",
        "hover:-translate-y-[1px]",
        "hover:border-[var(--sage)]",
        "hover:shadow-[0_7px_22px_rgba(15,31,26,0.09)]",
        dragging ? "opacity-40 scale-[0.98]" : "",
      ].join(" ")}
      style={{
        boxShadow: `inset 3px 0 0 ${railColor}`,
        zIndex: menuOpen ? 50 : "auto",
      }}
    >
      <div className="p-3.5">
        {/* ====================================================== */}
        {/* TOP ROW                                                */}
        {/* ====================================================== */}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="text-[13.5px] font-semibold leading-5 text-[var(--ink-green)] truncate">
                {lead.name}
              </h3>

              {lead.stuck && (
                <span
                  className="shrink-0 rounded-full px-1.5 py-[2px] text-[8.5px] font-bold tracking-[0.04em]"
                  style={{
                    background: "#f6edda",
                    color: "#a3701a",
                  }}
                >
                  STUCK
                </span>
              )}
            </div>

            <div className="mt-0.5 text-[11px] text-[var(--muted)] truncate">
              {subtitle || "No account linked"}
            </div>
          </div>

          {/* ================================================== */}
          {/* MENU                                                */}
          {/* ================================================== */}

          <div className="relative shrink-0">
            <button
              type="button"
              disabled={isUpdating}
              onClick={(e) => {
                stopCardClick(e);
                setMenuOpen((v) => !v);
              }}
              className={[
                "flex h-7 w-7 items-center justify-center rounded-lg",
                "text-[var(--muted)]",
                "hover:bg-[var(--mist-soft)]",
                "hover:text-[var(--ink-green)]",
                "transition-colors",
                isUpdating ? "opacity-50 cursor-wait" : "",
              ].join(" ")}
              aria-label="Lead actions"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <circle cx="8" cy="3" r="1.25" />
                <circle cx="8" cy="8" r="1.25" />
                <circle cx="8" cy="13" r="1.25" />
              </svg>
            </button>

            {menuOpen && (
              <div
                onClick={stopCardClick}
                className="absolute right-0 top-8 z-50 w-[190px] rounded-xl border border-[var(--stroke)] bg-paper p-1.5 shadow-[0_12px_30px_rgba(15,31,26,0.16)]"
              >
                {/* EDIT */}

                <MenuItem
                  label="Edit lead"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(lead);
                  }}
                />

                {/* REMARK */}

                <MenuItem
                  label="Add remark"
                  onClick={() => {
                    setMenuOpen(false);
                    onRemark(lead);
                  }}
                />

                {/* PROPOSED */}

                <MenuItem label="Mark as proposed" onClick={handleProposed} />
              </div>
            )}
          </div>
        </div>

        {/* ====================================================== */}
        {/* COMMERCIAL VALUE                                       */}
        {/* ====================================================== */}

        <div className="mt-3">
          <div className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--ink-green)]">
            {lead.budget ||
              (lead.budgetValue != null
                ? `₹${formatBudget(lead.budgetValue)}`
                : "Budget not specified")}
          </div>

          {lead.proposal && (
            <div className="mt-1 flex items-center gap-1.5 text-[10.5px]">
              <span className="font-medium text-[var(--muted)]">Quoted</span>

              <span className="font-semibold text-[#3f6d5f]">
                {lead.proposal.amount}
              </span>

              {lead.proposal.timeline && (
                <>
                  <span className="text-[var(--stroke)]">·</span>

                  <span className="text-[var(--muted)]">
                    {lead.proposal.timeline}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ====================================================== */}
        {/* BOTTOM ROW                                             */}
        {/* ====================================================== */}

        <div className="mt-3.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {lead.tag && (
              <span
                className="inline-flex max-w-[110px] truncate rounded-md px-2 py-1 text-[9.5px] font-semibold"
                style={tagStyle}
              >
                {lead.tag}
              </span>
            )}

            {whatsappNumber && (
              <button
                type="button"
                onClick={openWhatsApp}
                title={`WhatsApp ${whatsappNumber}`}
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center",
                  "rounded-lg border border-[var(--stroke)] bg-paper",
                  "text-[#3f6d5f]",
                  "hover:bg-[var(--mist-soft)]",
                  "hover:border-[var(--sage)]",
                  "transition-colors",
                ].join(" ")}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13.5 7.8a5.5 5.5 0 01-8.1 4.8L2.5 13.5l.9-2.8A5.5 5.5 0 1113.5 7.8z" />
                  <path d="M5.8 6.5c.3 1.8 2 3.5 3.9 3.8" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 text-[10px] text-[var(--muted)]">
            {lead.owner && (
              <span className="rounded-md bg-[var(--mist-soft)] px-1.5 py-0.5 font-medium text-[var(--ink-green)]">
                {lead.owner}
              </span>
            )}

            {daysLabel && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--sage)]" />
                {daysLabel}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DRAG HANDLE                                               */}
      {/* ======================================================== */}

      <div
        className={[
          "absolute left-0 top-1/2 -translate-x-[5px] -translate-y-1/2",
          "h-8 w-[3px] rounded-full",
          "bg-[var(--sage)] opacity-0",
          "transition-opacity group-hover:opacity-100",
        ].join(" ")}
      />
    </article>
  );
}

// ============================================================
// MENU ITEM
// ============================================================

function MenuItem({ label, onClick, tone = "default" }) {
  const toneClass =
    tone === "danger"
      ? "text-[#a54536] hover:bg-[#f8eeeb]"
      : tone === "warning"
        ? "text-[#a3701a] hover:bg-[#f7f0e1]"
        : "text-[var(--ink-green)] hover:bg-[var(--mist-soft)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-lg px-2.5 py-2 text-left",
        "text-[11.5px] font-medium",
        "transition-colors",
        toneClass,
      ].join(" ")}
    >
      {label}
    </button>
  );
}
