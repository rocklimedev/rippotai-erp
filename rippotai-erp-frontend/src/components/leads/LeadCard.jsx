import { useState } from "react";
import { pill, TAG_COLORS, LEAD_COLORS } from "../../hooks/stages";
import {
  useMarkNurtureMutation,
  useMarkLostMutation,
  useUpdateColorMutation,
} from "../../api/leads.api";

const COLOR_DOTS = [
  ["None", "#ffffff"],
  ["Green", "#1f453b"],
  ["Red", "#a54536"],
  ["Yellow", "#c98f2b"],
  ["Blue", "#3f6d8a"],
];

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
  const [markNurture] = useMarkNurtureMutation();
  const [markLost] = useMarkLostMutation();
  const [updateColor] = useUpdateColorMutation();

  const cc = lead.color && LEAD_COLORS[lead.color];
  const railColor = cc ? cc.rail : lead.stuck ? "#c98f2b" : "var(--sage)";
  const tagStyle = lead.tag
    ? pill(TAG_COLORS[lead.tag].fg, TAG_COLORS[lead.tag].bg)
    : null;
  const daysLabel =
    lead.days === 0 ? "Added today" : `${lead.days} days in stage`;

  const openWhatsApp = (e) => {
    e.stopPropagation();
    window.open(
      "https://wa.me/" + (lead.whatsapp || lead.phone).replace(/[^0-9]/g, ""),
      "_blank",
    );
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(lead.id));
        onDragStart(lead.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onClick(lead)}
      className="relative flex flex-col gap-1.5 bg-paper rounded-[14px] border border-[var(--stroke)] pl-3.5 pr-3 py-3 cursor-grab shadow-[0_2px_10px_rgba(15,31,26,0.06)] transition-opacity"
      style={{
        opacity: dragging ? 0.45 : 1,
        zIndex: menuOpen ? 10 : "auto",
        boxShadow: `inset 3px 0 0 ${railColor}, 0 2px 10px rgba(15,31,26,0.06)`,
      }}
    >
      <div className="flex items-center justify-between gap-1.5">
        <div className="text-[13px] font-semibold text-[var(--ink-green)] truncate">
          {lead.name}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {lead.stuck && (
            <span
              className="bc-badge"
              style={{ background: "#c98f2b", color: "#fff" }}
            >
              STUCK
            </span>
          )}
          <span
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="flex items-center justify-center w-5 h-5 rounded-[6px] cursor-pointer hover:bg-[var(--mist-soft)]"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--muted)">
              <circle cx="8" cy="3" r="1.3"></circle>
              <circle cx="8" cy="8" r="1.3"></circle>
              <circle cx="8" cy="13" r="1.3"></circle>
            </svg>
          </span>
        </div>
      </div>

      {menuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-8 right-2 bg-paper border border-[var(--stroke)] rounded-[10px] shadow-[0_6px_18px_rgba(15,31,26,0.16)] p-1.5 z-20 flex flex-col gap-0.5 min-w-[172px] cursor-default"
        >
          {[
            ["Edit Lead", () => onEdit(lead)],
            ["Add Remark", () => onRemark(lead)],
            ["Mark as Proposed", () => onProposed(lead)],
          ].map(([label, fn]) => (
            <div
              key={label}
              className="px-2.5 py-1.5 rounded-[7px] text-[12.5px] text-[var(--ink-green)] cursor-pointer hover:bg-[var(--mist-soft)]"
              onClick={() => {
                setMenuOpen(false);
                fn();
              }}
            >
              {label}
            </div>
          ))}
          <div
            className="px-2.5 py-1.5 rounded-[7px] text-[12.5px] cursor-pointer hover:bg-[#f6edda]"
            style={{ color: "#a3701a" }}
            onClick={() => {
              setMenuOpen(false);
              markNurture(lead.id);
            }}
          >
            Move to Nurture List
          </div>
          <div
            className="px-2.5 py-1.5 rounded-[7px] text-[12.5px] cursor-pointer hover:bg-[#f5e7e4]"
            style={{ color: "#a54536" }}
            onClick={() => {
              setMenuOpen(false);
              markLost(lead.id);
            }}
          >
            Mark Closed-Lost
          </div>

          <div className="border-t border-[var(--stroke)] mt-1 pt-2 px-2.5 pb-1 flex flex-col gap-1.5">
            <span className="eyebrow text-[10px]">Card Color</span>
            <div className="flex gap-2 items-center">
              {COLOR_DOTS.map(([name, c]) => {
                const active = (lead.color || "None") === name;
                return (
                  <div
                    key={name}
                    title={name}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      updateColor({
                        id: lead.id,
                        color: name === "None" ? null : name,
                      });
                    }}
                    className="w-[13px] h-[13px] rounded-full cursor-pointer shrink-0"
                    style={{
                      background: c,
                      border:
                        name === "None"
                          ? "1px solid var(--sage)"
                          : "1px solid " + c,
                      outline: active ? "1.5px solid var(--ink-green)" : "none",
                      outlineOffset: "1.5px",
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="text-[12px] text-[var(--muted)] truncate">
        {lead.type} · {lead.location}
      </div>
      <div className="text-[12px] font-medium text-[var(--ink-green)]">
        {lead.budget}
      </div>
      {lead.proposal && (
        <div className="text-[11px] font-medium" style={{ color: "#3f6d5f" }}>
          Quoted: {lead.proposal.amount} · {lead.proposal.timeline}
        </div>
      )}

      <div className="flex items-center justify-between mt-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {lead.tag && (
            <span className="bc-chip" style={tagStyle}>
              {lead.tag}
            </span>
          )}
          <span
            onClick={openWhatsApp}
            title={"WhatsApp " + (lead.whatsapp || lead.phone)}
            className="flex items-center justify-center w-[22px] h-[22px] border border-[var(--stroke)] rounded-[7px] bg-paper cursor-pointer hover:bg-[var(--mist-soft)] shrink-0"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="#3f6d5f"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13.5 7.8a5.5 5.5 0 01-8.1 4.8L2.5 13.5l.9-2.8A5.5 5.5 0 1113.5 7.8z"></path>
              <path d="M5.8 6.5c.3 1.8 2 3.5 3.9 3.8"></path>
            </svg>
          </span>
        </div>
        <span className="text-[11px] text-[var(--muted)] whitespace-nowrap">
          {daysLabel}
        </span>
      </div>
    </div>
  );
}
