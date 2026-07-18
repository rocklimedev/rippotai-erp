import { useState } from "react";
import { pill, TAG_COLORS, LEAD_COLORS } from "../constants/stages";
import {
  useMarkNurtureMutation,
  useMarkLostMutation,
  useUpdateColorMutation,
} from "../api/leadsApi";

const COLOR_DOTS = [
  ["None", "#FFFFFF"],
  ["Green", "#2E7D5B"],
  ["Red", "#B0483A"],
  ["Yellow", "#B07A1E"],
  ["Blue", "#4A6B8A"],
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
  const bg = cc ? cc[1] : lead.stuck ? "#F6EDDA" : "#FFFFFF";
  const bd = cc ? cc[0] : lead.stuck ? "#B07A1E" : "#E4EBF1";
  const cardStyle = {
    position: "relative",
    background: bg,
    border: "1px solid " + bd,
    borderRadius: "14px",
    padding: "12px",
    boxShadow: "0 2px 10px rgba(22,27,29,0.06)",
    cursor: "grab",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    opacity: dragging ? 0.45 : 1,
    zIndex: menuOpen ? 10 : "auto",
  };
  const tagStyle = lead.tag
    ? pill(TAG_COLORS[lead.tag][0], TAG_COLORS[lead.tag][1])
    : null;
  const daysLabel =
    lead.days === 0 ? "Added today" : `${lead.days} days in stage`;

  const stop = (e) => e.stopPropagation();
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
      style={cardStyle}
      className="lead-card"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "6px",
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#161B1D" }}>
          {lead.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          {lead.stuck && (
            <span
              style={{
                background: "#B07A1E",
                color: "#FFFFFF",
                fontSize: "9px",
                fontWeight: 400,
                letterSpacing: "0.06em",
                padding: "2px 6px",
                borderRadius: "5px",
              }}
            >
              STUCK
            </span>
          )}
          <span
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="icon-btn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "20px",
              height: "20px",
              borderRadius: "6px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="#6E7F8D">
              <circle cx="8" cy="3" r="1.3"></circle>
              <circle cx="8" cy="8" r="1.3"></circle>
              <circle cx="8" cy="13" r="1.3"></circle>
            </svg>
          </span>
        </div>
      </div>

      {menuOpen && (
        <div
          onClick={stop}
          style={{
            position: "absolute",
            top: "32px",
            right: "8px",
            background: "#FFFFFF",
            border: "1px solid #E4EBF1",
            borderRadius: "10px",
            boxShadow: "0 6px 18px rgba(22,27,29,0.16)",
            padding: "6px",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            minWidth: "170px",
            cursor: "default",
          }}
        >
          <div
            className="menu-item"
            style={{
              padding: "7px 9px",
              borderRadius: "7px",
              fontSize: "12.5px",
              color: "#161B1D",
              cursor: "pointer",
            }}
            onClick={() => {
              setMenuOpen(false);
              onEdit(lead);
            }}
          >
            Edit Lead
          </div>
          <div
            className="menu-item"
            style={{
              padding: "7px 9px",
              borderRadius: "7px",
              fontSize: "12.5px",
              color: "#161B1D",
              cursor: "pointer",
            }}
            onClick={() => {
              setMenuOpen(false);
              onRemark(lead);
            }}
          >
            Add Remark
          </div>
          <div
            className="menu-item"
            style={{
              padding: "7px 9px",
              borderRadius: "7px",
              fontSize: "12.5px",
              color: "#161B1D",
              cursor: "pointer",
            }}
            onClick={() => {
              setMenuOpen(false);
              onProposed(lead);
            }}
          >
            Mark as Proposed
          </div>
          <div
            className="menu-item-warn"
            style={{
              padding: "7px 9px",
              borderRadius: "7px",
              fontSize: "12.5px",
              color: "#B07A1E",
              cursor: "pointer",
            }}
            onClick={() => {
              setMenuOpen(false);
              markNurture(lead.id);
            }}
          >
            Move to Nurture List
          </div>
          <div
            className="menu-item-danger"
            style={{
              padding: "7px 9px",
              borderRadius: "7px",
              fontSize: "12.5px",
              color: "#B0483A",
              cursor: "pointer",
            }}
            onClick={() => {
              setMenuOpen(false);
              markLost(lead.id);
            }}
          >
            Mark Closed-Lost
          </div>
          <div
            style={{
              borderTop: "1px solid #E4EBF1",
              marginTop: "4px",
              padding: "8px 9px 4px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 400,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#6E7F8D",
              }}
            >
              Card Color
            </span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
                    style={{
                      width: "13px",
                      height: "13px",
                      borderRadius: "50%",
                      background: c,
                      border:
                        name === "None"
                          ? "1px solid #B5BFC6"
                          : "1px solid " + c,
                      outline: active ? "1.5px solid #161B1D" : "none",
                      outlineOffset: "1.5px",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{ fontSize: "12px", color: "#6E7F8D" }}>
        {lead.type} · {lead.location}
      </div>
      <div style={{ fontSize: "12px", fontWeight: 400, color: "#161B1D" }}>
        {lead.budget}
      </div>
      {lead.proposal && (
        <div style={{ fontSize: "11px", fontWeight: 400, color: "#2E7D5B" }}>
          Quoted: {lead.proposal.amount} · {lead.proposal.timeline}
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "2px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {lead.tag && <span style={tagStyle}>{lead.tag}</span>}
          <span
            onClick={openWhatsApp}
            title={"WhatsApp " + (lead.whatsapp || lead.phone)}
            className="wa-btn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "22px",
              height: "22px",
              border: "1px solid #E4EBF1",
              borderRadius: "7px",
              background: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="#2E7D5B"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13.5 7.8a5.5 5.5 0 01-8.1 4.8L2.5 13.5l.9-2.8A5.5 5.5 0 1113.5 7.8z"></path>
              <path d="M5.8 6.5c.3 1.8 2 3.5 3.9 3.8"></path>
            </svg>
          </span>
        </div>
        <span style={{ fontSize: "11px", color: "#6E7F8D" }}>{daysLabel}</span>
      </div>
    </div>
  );
}
