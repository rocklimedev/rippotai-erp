import { useState } from "react";
import { labelStyle, stageOf } from "../../hooks/stages";
import { useGetLeadsQuery, useDeleteLeadMutation } from "../../api/leads.api";

const COLS = "1.6fr 1.1fr 1.6fr 1fr 0.9fr 1.3fr 0.8fr 36px";

export default function ContactsView({ onOpenLead, onEditLead }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("name-asc");
  const [menuId, setMenuId] = useState(null);
  const { data: rows = [], isLoading } = useGetLeadsQuery({ q, sort });
  const [deleteLead] = useDeleteLeadMutation();

  return (
    <div className="flex flex-col gap-4 px-7 pt-5 pb-10">
      <div className="bc-card p-5 flex flex-col gap-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[16px] font-semibold text-[var(--ink-green)]">
              Contacts
            </span>
            <span className="text-[12px] text-[var(--muted)]">
              {rows.length} contacts
            </span>
          </div>
          <div className="flex gap-2.5 items-center flex-wrap">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bc-input w-auto py-2 px-2.5 text-[13px]"
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
              className="bc-input w-[240px] max-w-full py-2 px-3 text-[13px]"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-[var(--muted)] text-[13px]">
            Loading contacts…
          </div>
        ) : (
          <div className="table-container">
            <div className="bc-table-scroll">
              <div style={{ minWidth: "860px" }}>
                <div
                  className="grid gap-2.5 px-0.5 pb-2 border-b border-[var(--stroke)]"
                  style={{ gridTemplateColumns: COLS }}
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
                  const menuOpen = menuId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => onOpenLead(c)}
                      className="grid gap-2.5 px-0.5 py-2.5 border-b border-[var(--stroke)] cursor-pointer items-center hover:bg-[var(--mist-soft)]"
                      style={{ gridTemplateColumns: COLS }}
                    >
                      <span className="text-[13px] font-semibold text-[var(--ink-green)] truncate">
                        {c.name}
                      </span>
                      <span className="text-[12px] text-[var(--muted)]">
                        {c.phone}
                      </span>
                      <span className="text-[12px] text-[var(--muted)] truncate">
                        {c.email}
                      </span>
                      <span className="text-[12px] text-[var(--muted)] truncate">
                        {c.location}
                      </span>
                      <span className="text-[12px] text-[var(--muted)]">
                        {c.type}
                      </span>
                      <span
                        className="bc-chip justify-self-start"
                        style={{ background: s.bg, color: s.fg }}
                      >
                        {s.label}
                      </span>
                      <span className="text-[12px] text-[var(--muted)] truncate">
                        {c.owner}
                      </span>
                      <span className="relative flex justify-center">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuId(menuOpen ? null : c.id);
                          }}
                          className="flex items-center justify-center w-6 h-6 rounded-[7px] cursor-pointer hover:bg-[var(--mist)]"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="var(--muted)"
                          >
                            <circle cx="8" cy="3" r="1.3"></circle>
                            <circle cx="8" cy="8" r="1.3"></circle>
                            <circle cx="8" cy="13" r="1.3"></circle>
                          </svg>
                        </span>
                        {menuOpen && (
                          <span
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-7 right-0 bg-paper border border-[var(--stroke)] rounded-[10px] shadow-[0_6px_18px_rgba(15,31,26,0.16)] p-1.5 z-30 flex flex-col gap-0.5 min-w-[150px] cursor-default"
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
                              className="block px-2.5 py-1.5 rounded-[7px] text-[12.5px] cursor-pointer hover:bg-[#e3ede9]"
                              style={{ color: "#3f6d5f" }}
                            >
                              WhatsApp
                            </span>
                            <span
                              onClick={() => {
                                setMenuId(null);
                                onEditLead(c);
                              }}
                              className="block px-2.5 py-1.5 rounded-[7px] text-[12.5px] text-[var(--ink-green)] cursor-pointer hover:bg-[var(--mist-soft)]"
                            >
                              Edit Contact
                            </span>
                            <span
                              onClick={() => {
                                setMenuId(null);
                                deleteLead(c.id);
                              }}
                              className="block px-2.5 py-1.5 rounded-[7px] text-[12.5px] cursor-pointer hover:bg-[#f5e7e4]"
                              style={{ color: "#a54536" }}
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
          </div>
        )}
      </div>
    </div>
  );
}
