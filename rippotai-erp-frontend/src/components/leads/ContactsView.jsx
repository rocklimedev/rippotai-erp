import { useState } from "react";
import { card, labelStyle, TINT, stageOf } from "../constants/stages";
import { useGetLeadsQuery, useDeleteLeadMutation } from "../api/leadsApi";

const COLS = "1.6fr 1.1fr 1.6fr 1fr 0.9fr 1.3fr 0.8fr 36px";

export default function ContactsView({ onOpenLead, onEditLead }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("name-asc");
  const [menuId, setMenuId] = useState(null);
  const { data: rows = [], isLoading } = useGetLeadsQuery({ q, sort });
  const [deleteLead] = useDeleteLeadMutation();

  return (
    <div
      style={{
        padding: "20px 28px 40px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div
        style={{
          ...card,
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <span style={{ fontSize: "16px", fontWeight: 700 }}>Contacts</span>
            <span style={{ fontSize: "12px", color: "#6E7F8D" }}>
              {rows.length} contacts
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                border: "1px solid #B5BFC6",
                borderRadius: "10px",
                padding: "8px 10px",
                fontSize: "13px",
                background: "#FFFFFF",
                color: "#161B1D",
              }}
            >
              <option value="name-asc">Sort: Name A–Z</option>
              <option value="name-desc">Sort: Name Z–A</option>
              <option value="stage">Sort: Pipeline Stage</option>
              <option value="days">Sort: Days in Stage</option>
              <option value="owner">Sort: Owner</option>
              <option value="location">Sort: Location</option>
            </select>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, city, phone, email…"
              style={{
                border: "1px solid #B5BFC6",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "13px",
                color: "#161B1D",
                background: "#FFFFFF",
                width: "240px",
                maxWidth: "100%",
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ color: "#6E7F8D", fontSize: "13px" }}>
            Loading contacts…
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: "860px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: COLS,
                  gap: "10px",
                  padding: "0 2px 8px",
                  borderBottom: "1px solid #E4EBF1",
                }}
              >
                <span style={labelStyle}>Name</span>
                <span style={labelStyle}>Phone</span>
                <span style={labelStyle}>Email</span>
                <span style={labelStyle}>Location</span>
                <span style={labelStyle}>Type</span>
                <span style={labelStyle}>Stage</span>
                <span style={labelStyle}>Owner</span>
                <span></span>
              </div>
              {rows.map((c) => {
                const s = stageOf(c.stage);
                const stagePill = {
                  background: TINT[s.c],
                  color: s.c,
                  fontSize: "11px",
                  fontWeight: 400,
                  padding: "3px 10px",
                  borderRadius: "999px",
                  justifySelf: "start",
                };
                const menuOpen = menuId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => onOpenLead(c)}
                    className="row-hover"
                    style={{
                      display: "grid",
                      gridTemplateColumns: COLS,
                      gap: "10px",
                      padding: "10px 2px",
                      borderBottom: "1px solid #E4EBF1",
                      cursor: "pointer",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#161B1D",
                      }}
                    >
                      {c.name}
                    </span>
                    <span style={{ fontSize: "12px", color: "#6E7F8D" }}>
                      {c.phone}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#6E7F8D",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.email}
                    </span>
                    <span style={{ fontSize: "12px", color: "#6E7F8D" }}>
                      {c.location}
                    </span>
                    <span style={{ fontSize: "12px", color: "#6E7F8D" }}>
                      {c.type}
                    </span>
                    <span style={stagePill}>{s.label}</span>
                    <span style={{ fontSize: "12px", color: "#6E7F8D" }}>
                      {c.owner}
                    </span>
                    <span
                      style={{
                        position: "relative",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuId(menuOpen ? null : c.id);
                        }}
                        className="icon-btn"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "24px",
                          height: "24px",
                          borderRadius: "7px",
                          cursor: "pointer",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="#6E7F8D"
                        >
                          <circle cx="8" cy="3" r="1.3"></circle>
                          <circle cx="8" cy="8" r="1.3"></circle>
                          <circle cx="8" cy="13" r="1.3"></circle>
                        </svg>
                      </span>
                      {menuOpen && (
                        <span
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: "absolute",
                            top: "28px",
                            right: 0,
                            background: "#FFFFFF",
                            border: "1px solid #E4EBF1",
                            borderRadius: "10px",
                            boxShadow: "0 6px 18px rgba(22,27,29,0.16)",
                            padding: "6px",
                            zIndex: 30,
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                            minWidth: "150px",
                            cursor: "default",
                          }}
                        >
                          <span
                            onClick={() => {
                              window.open(
                                "https://wa.me/" +
                                  (c.whatsapp || c.phone).replace(
                                    /[^0-9]/g,
                                    "",
                                  ),
                                "_blank",
                              );
                              setMenuId(null);
                            }}
                            className="menu-item-wa"
                            style={{
                              padding: "7px 9px",
                              borderRadius: "7px",
                              fontSize: "12.5px",
                              color: "#2E7D5B",
                              cursor: "pointer",
                              display: "block",
                            }}
                          >
                            WhatsApp
                          </span>
                          <span
                            onClick={() => {
                              setMenuId(null);
                              onEditLead(c);
                            }}
                            className="menu-item"
                            style={{
                              padding: "7px 9px",
                              borderRadius: "7px",
                              fontSize: "12.5px",
                              color: "#161B1D",
                              cursor: "pointer",
                              display: "block",
                            }}
                          >
                            Edit Contact
                          </span>
                          <span
                            onClick={() => {
                              setMenuId(null);
                              deleteLead(c.id);
                            }}
                            className="menu-item-danger"
                            style={{
                              padding: "7px 9px",
                              borderRadius: "7px",
                              fontSize: "12.5px",
                              color: "#B0483A",
                              cursor: "pointer",
                              display: "block",
                            }}
                          >
                            Delete Contact
                          </span>
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
