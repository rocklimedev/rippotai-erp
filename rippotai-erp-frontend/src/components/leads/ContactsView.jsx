import { useMemo, useState } from "react";
import { labelStyle, stageOf } from "../../hooks/stages";
import { useGetLeadsQuery, useDeleteLeadMutation } from "../../api/leads.api";

const COLS =
  "minmax(220px, 1.6fr) minmax(150px, 1fr) minmax(220px, 1.5fr) minmax(130px, .9fr) minmax(110px, .8fr) minmax(130px, 1fr) minmax(130px, .9fr) 86px";

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "?";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const avatarColors = ["#e5eee9", "#e8edf2", "#f1eadc", "#eee7f1", "#e8ece5"];

const getAvatarColor = (id) => {
  if (!id) return avatarColors[0];

  const value = String(id)
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return avatarColors[value % avatarColors.length];
};

const formatPhone = (phone) => {
  if (!phone) return "No phone";

  return phone;
};

export default function ContactsView({ onOpenLead, onEditLead }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("name-asc");
  const [menuId, setMenuId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const {
    data: rows = [],
    isLoading,
    isFetching,
  } = useGetLeadsQuery({
    q,
    sort,
  });

  const [deleteLead, { isLoading: isDeleting }] = useDeleteLeadMutation();

  const deleteTarget = useMemo(
    () => rows.find((row) => row.id === deleteId),
    [rows, deleteId],
  );

  const handleWhatsApp = (contact) => {
    const phone = contact.whatsapp || contact.phone;

    if (!phone) return;

    const number = String(phone).replace(/[^0-9]/g, "");

    if (!number) return;

    window.open(`https://wa.me/${number}`, "_blank", "noopener,noreferrer");
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteLead(deleteId).unwrap();
      setDeleteId(null);
    } catch {
      // Keep dialog open so the user knows deletion failed.
    }
  };

  return (
    <div className="flex min-w-0 flex-col px-7 pt-6 pb-10">
      {/* ============================================================ */}
      {/* HEADER                                                       */}
      {/* ============================================================ */}

      <div className="mb-5">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[20px] font-semibold tracking-[-0.025em] text-[var(--ink-green)]">
                Contacts
              </h1>

              <span className="inline-flex h-[23px] items-center rounded-full bg-[var(--mist)] px-2.5 text-[10.5px] font-semibold text-[var(--muted)]">
                {rows.length}
              </span>

              {isFetching && !isLoading && (
                <span className="text-[10px] text-[var(--muted)]">
                  Updating…
                </span>
              )}
            </div>

            <p className="mt-1.5 text-[12.5px] text-[var(--muted)]">
              Manage your leads, contact details, pipeline status and ownership.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TOOLBAR                                                      */}
      {/* ============================================================ */}

      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="relative min-w-0 flex-1 max-w-[420px]">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5L14 14" />
          </svg>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search contacts, phone, email or location..."
            className={[
              "h-10 w-full rounded-xl",
              "border border-[var(--stroke)] bg-paper",
              "pl-9 pr-9 text-[12.5px]",
              "text-[var(--ink-green)]",
              "outline-none",
              "placeholder:text-[var(--muted)]",
              "focus:border-[var(--sage)]",
              "focus:ring-2 focus:ring-[var(--sage-soft)]",
            ].join(" ")}
          />

          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--mist-soft)]"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 text-[10.5px] text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--sage)]" />
            {rows.length} contacts
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={[
              "h-10 rounded-xl",
              "border border-[var(--stroke)] bg-paper",
              "px-3 text-[12px] font-medium",
              "text-[var(--ink-green)]",
              "outline-none",
              "focus:border-[var(--sage)]",
            ].join(" ")}
          >
            <option value="name-asc">Name A–Z</option>

            <option value="name-desc">Name Z–A</option>

            <option value="stage">Pipeline stage</option>

            <option value="days">Days in stage</option>

            <option value="owner">Owner</option>

            <option value="location">Location</option>
          </select>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TABLE                                                        */}
      {/* ============================================================ */}

      <div className="overflow-hidden rounded-2xl border border-[var(--stroke)] bg-paper shadow-[0_2px_12px_rgba(15,31,26,0.04)]">
        <div className="overflow-x-auto">
          <div className="min-w-[1100px]">
            {/* ------------------------------------------------------ */}
            {/* HEADER                                                 */}
            {/* ------------------------------------------------------ */}

            <div
              className="sticky top-0 z-10 grid items-center gap-3 border-b border-[var(--stroke)] bg-[var(--mist-soft)] px-4 py-3"
              style={{
                gridTemplateColumns: COLS,
              }}
            >
              <span style={labelStyle}>Contact</span>
              <span style={labelStyle}>Phone</span>
              <span style={labelStyle}>Email</span>
              <span style={labelStyle}>Location</span>
              <span style={labelStyle}>Type</span>
              <span style={labelStyle}>Pipeline</span>
              <span style={labelStyle}>Owner</span>
              <span style={labelStyle}>Actions</span>
            </div>

            {/* ------------------------------------------------------ */}
            {/* LOADING                                                 */}
            {/* ------------------------------------------------------ */}

            {isLoading ? (
              <LoadingRows />
            ) : rows.length === 0 ? (
              <EmptyState hasSearch={Boolean(q)} />
            ) : (
              rows.map((contact) => {
                const stage = stageOf(contact.stage);
                const menuOpen = menuId === contact.id;

                return (
                  <div
                    key={contact.id}
                    onClick={() => onOpenLead(contact)}
                    className={[
                      "group relative grid items-center gap-3",
                      "border-b border-[var(--stroke)]",
                      "px-4 py-3",
                      "cursor-pointer",
                      "transition-colors",
                      "hover:bg-[var(--mist-soft)]",
                      "last:border-b-0",
                    ].join(" ")}
                    style={{
                      gridTemplateColumns: COLS,
                    }}
                  >
                    {/* ------------------------------------------------ */}
                    {/* CONTACT                                           */}
                    {/* ------------------------------------------------ */}

                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold text-[var(--ink-green)]"
                        style={{
                          background: getAvatarColor(contact.id),
                        }}
                      >
                        {getInitials(contact.name)}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-[12.5px] font-semibold text-[var(--ink-green)]">
                          {contact.name || "Unnamed contact"}
                        </div>

                        <div className="mt-0.5 truncate text-[10.5px] text-[var(--muted)]">
                          {contact.whatsapp ? "WhatsApp available" : "Contact"}
                        </div>
                      </div>
                    </div>

                    {/* ------------------------------------------------ */}
                    {/* PHONE                                             */}
                    {/* ------------------------------------------------ */}

                    <div className="min-w-0">
                      <div className="truncate text-[11.5px] text-[var(--ink-green)]">
                        {formatPhone(contact.phone)}
                      </div>

                      {contact.whatsapp && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsApp(contact);
                          }}
                          className="mt-0.5 text-[9.5px] font-semibold text-[#3f6d5f] hover:underline"
                        >
                          WhatsApp
                        </button>
                      )}
                    </div>

                    {/* ------------------------------------------------ */}
                    {/* EMAIL                                             */}
                    {/* ------------------------------------------------ */}

                    <span className="truncate text-[11.5px] text-[var(--muted)]">
                      {contact.email || "—"}
                    </span>

                    {/* ------------------------------------------------ */}
                    {/* LOCATION                                          */}
                    {/* ------------------------------------------------ */}

                    <span className="truncate text-[11.5px] text-[var(--muted)]">
                      {contact.location || "—"}
                    </span>

                    {/* ------------------------------------------------ */}
                    {/* TYPE                                              */}
                    {/* ------------------------------------------------ */}

                    <span className="truncate text-[11px] text-[var(--muted)]">
                      {contact.type || "—"}
                    </span>

                    {/* ------------------------------------------------ */}
                    {/* STAGE                                             */}
                    {/* ------------------------------------------------ */}

                    <span
                      className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-semibold"
                      style={{
                        background: stage.bg,
                        color: stage.fg,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: stage.fg,
                        }}
                      />

                      {stage.label}
                    </span>

                    {/* ------------------------------------------------ */}
                    {/* OWNER                                             */}
                    {/* ------------------------------------------------ */}

                    <div className="flex min-w-0 items-center gap-2">
                      {contact.owner ? (
                        <>
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--mist)] text-[8px] font-bold text-[var(--ink-green)]">
                            {getInitials(contact.owner)}
                          </div>

                          <span className="truncate text-[11px] text-[var(--muted)]">
                            {contact.owner}
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] text-[var(--muted)]">
                          Unassigned
                        </span>
                      )}
                    </div>

                    {/* ------------------------------------------------ */}
                    {/* ACTIONS                                           */}
                    {/* ------------------------------------------------ */}

                    <div className="relative flex items-center justify-end gap-1">
                      {/* WhatsApp */}

                      {contact.phone || contact.whatsapp ? (
                        <button
                          type="button"
                          title="WhatsApp"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsApp(contact);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#3f6d5f] opacity-0 transition-opacity hover:bg-[#e3ede9] group-hover:opacity-100"
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
                      ) : null}

                      {/* Menu */}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();

                          setMenuId(menuOpen ? null : contact.id);
                        }}
                        className={[
                          "flex h-7 w-7 items-center justify-center rounded-lg",
                          "text-[var(--muted)]",
                          "hover:bg-[var(--mist)]",
                          "hover:text-[var(--ink-green)]",
                          menuOpen
                            ? "bg-[var(--mist)] opacity-100"
                            : "opacity-0 group-hover:opacity-100",
                        ].join(" ")}
                        aria-label="Contact actions"
                      >
                        <svg
                          width="14"
                          height="14"
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
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-9 z-40 w-[175px] rounded-xl border border-[var(--stroke)] bg-paper p-1.5 shadow-[0_12px_28px_rgba(15,31,26,0.15)]"
                        >
                          <ActionItem
                            label="Open contact"
                            onClick={() => {
                              setMenuId(null);
                              onOpenLead(contact);
                            }}
                          />

                          <ActionItem
                            label="Edit contact"
                            onClick={() => {
                              setMenuId(null);
                              onEditLead(contact);
                            }}
                          />

                          <ActionItem
                            label="WhatsApp"
                            tone="success"
                            onClick={() => {
                              setMenuId(null);
                              handleWhatsApp(contact);
                            }}
                          />

                          <div className="my-1 border-t border-[var(--stroke)]" />

                          <ActionItem
                            label="Delete contact"
                            tone="danger"
                            onClick={() => {
                              setMenuId(null);
                              setDeleteId(contact.id);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION                                          */}
      {/* ============================================================ */}

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[390px] rounded-2xl border border-[var(--stroke)] bg-paper p-5 shadow-[0_20px_60px_rgba(15,31,26,0.2)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8eeeb] text-[#a54536]">
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M3 5h10" />
                <path d="M6 5V3.5h4V5" />
                <path d="M4.5 5l.5 8h6l.5-8" />
                <path d="M6.5 7v4" />
                <path d="M9.5 7v4" />
              </svg>
            </div>

            <h2 className="mt-4 text-[15px] font-semibold text-[var(--ink-green)]">
              Delete contact?
            </h2>

            <p className="mt-1.5 text-[12px] leading-5 text-[var(--muted)]">
              This will permanently remove{" "}
              <strong className="text-[var(--ink-green)]">
                {deleteTarget.name}
              </strong>{" "}
              from your leads. This action cannot be undone.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="rounded-xl border border-[var(--stroke)] px-3.5 py-2 text-[11.5px] font-semibold text-[var(--ink-green)] hover:bg-[var(--mist-soft)] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl bg-[#a54536] px-3.5 py-2 text-[11.5px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete contact"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* ACTION ITEM                                                        */
/* ================================================================== */

function ActionItem({ label, onClick, tone = "default" }) {
  const toneClass =
    tone === "danger"
      ? "text-[#a54536] hover:bg-[#f8eeeb]"
      : tone === "success"
        ? "text-[#3f6d5f] hover:bg-[#e3ede9]"
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

/* ================================================================== */
/* LOADING                                                           */
/* ================================================================== */

function LoadingRows() {
  return (
    <div>
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="grid items-center gap-3 border-b border-[var(--stroke)] px-4 py-3"
          style={{
            gridTemplateColumns: COLS,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-[var(--mist)]" />

            <div className="flex flex-col gap-1.5">
              <div className="h-2.5 w-[120px] animate-pulse rounded bg-[var(--mist)]" />
              <div className="h-2 w-[75px] animate-pulse rounded bg-[var(--mist)]" />
            </div>
          </div>

          {Array.from({ length: 7 }).map((__, cell) => (
            <div
              key={cell}
              className="h-2.5 w-[75%] animate-pulse rounded bg-[var(--mist)]"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/* EMPTY STATE                                                       */
/* ================================================================== */

function EmptyState({ hasSearch }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--mist-soft)] text-[var(--muted)]">
        <svg
          width="21"
          height="21"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <circle cx="8.5" cy="8.5" r="5" />
          <path d="M12.5 12.5L17 17" />
        </svg>
      </div>

      <div className="mt-4 text-[13px] font-semibold text-[var(--ink-green)]">
        {hasSearch ? "No contacts found" : "No contacts yet"}
      </div>

      <p className="mt-1 max-w-[320px] text-[11.5px] leading-5 text-[var(--muted)]">
        {hasSearch
          ? "Try a different name, phone number, email or location."
          : "Contacts and leads will appear here once they are added."}
      </p>
    </div>
  );
}
