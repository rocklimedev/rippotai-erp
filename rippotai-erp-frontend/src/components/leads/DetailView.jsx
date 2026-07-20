import { useState } from "react";
import {
  labelStyle,
  pill,
  stageOf,
  TAG_COLORS,
  LEAD_COLORS,
  STAGES,
} from "../../hooks/stages";
import {
  useGetLeadQuery,
  useAddNoteMutation,
  useSetProposalMutation,
  useMoveStageMutation,
  useMarkNurtureMutation,
  useMarkLostMutation,
} from "../../api/leads.api";

export default function DetailView({ leadId, onBack, onEditLead }) {
  const {
    data: lead,
    isLoading,
    isError,
  } = useGetLeadQuery(leadId, { skip: !leadId });
  const [addNote] = useAddNoteMutation();
  const [setProposal] = useSetProposalMutation();
  const [moveStage] = useMoveStageMutation();
  const [markNurture] = useMarkNurtureMutation();
  const [markLost] = useMarkLostMutation();

  const [noteText, setNoteText] = useState("");
  const [propAmount, setPropAmount] = useState("");
  const [propTimeline, setPropTimeline] = useState("");
  const [propRemarks, setPropRemarks] = useState("");

  if (!leadId)
    return (
      <div className="p-7 text-[var(--muted)] text-[13px]">
        No lead selected.
      </div>
    );
  if (isLoading)
    return (
      <div className="p-7 text-[var(--muted)] text-[13px]">Loading lead…</div>
    );
  if (isError || !lead)
    return (
      <div className="p-7 text-[13px]" style={{ color: "#a54536" }}>
        Couldn't load this lead.
        <span onClick={onBack} className="ml-2 underline cursor-pointer">
          Back to board
        </span>
      </div>
    );

  const s = stageOf(lead.stage);
  const tagColor = lead.tag && TAG_COLORS[lead.tag];

  const openWhatsApp = () => {
    window.open(
      "https://wa.me/" + (lead.whatsapp || lead.phone).replace(/[^0-9]/g, ""),
      "_blank",
    );
  };

  const submitNote = async () => {
    if (!noteText.trim()) return;
    await addNote({ id: lead.id, text: noteText.trim() });
    setNoteText("");
  };

  const submitProposal = async () => {
    if (!propAmount.trim()) return;
    await setProposal({
      id: lead.id,
      amount: propAmount.trim(),
      timeline: propTimeline.trim() || lead.proposal?.timeline || "",
      remarks: propRemarks.trim(),
    });
    setPropAmount("");
    setPropTimeline("");
    setPropRemarks("");
  };

  const docRow = (label, done) => (
    <div
      key={label}
      className="flex items-center justify-between py-2 px-0.5 border-b border-[var(--stroke)] last:border-b-0"
    >
      <span className="text-[13px] text-[var(--ink-green)]">{label}</span>
      <span
        className="text-[11px] font-medium px-2.5 py-[2px] rounded-full"
        style={
          done
            ? { background: "#e3f0ea", color: "#1f453b" }
            : { background: "var(--mist)", color: "var(--muted)" }
        }
      >
        {done ? "Received" : "Pending"}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-7 pt-5 pb-10">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-[9px] border border-[var(--stroke)] bg-paper cursor-pointer shrink-0 hover:bg-[var(--mist-soft)]"
          title="Back to board"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            stroke="var(--ink-green)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13L5 8l5-5"></path>
          </svg>
        </span>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[19px] font-semibold text-[var(--ink-green)]">
              {lead.name}
            </span>
            {lead.tag && (
              <span
                className="bc-chip"
                style={pill(
                  tagColor ? tagColor.fg : "var(--muted)",
                  tagColor ? tagColor.bg : "var(--mist)",
                )}
              >
                {lead.tag}
              </span>
            )}
            {lead.stuck && (
              <span
                className="bc-badge tracking-wide"
                style={{ background: "#c98f2b", color: "#fff" }}
              >
                STUCK
              </span>
            )}
          </div>
          <div className="text-[13px] text-[var(--muted)]">
            {lead.type} · {lead.location} · {s.label}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={openWhatsApp}
            className="bc-btn-secondary"
            style={{ color: "#3f6d5f", borderColor: "#3f6d5f55" }}
          >
            WhatsApp
          </button>
          <button
            onClick={() => onEditLead && onEditLead(lead)}
            className="bc-btn-primary"
          >
            Edit Lead
          </button>
        </div>
      </div>

      <div
        className="grid gap-4 items-start"
        style={{ gridTemplateColumns: "1.3fr 1fr" }}
      >
        {/* Left column */}
        <div className="flex flex-col gap-4">
          {/* Deal info */}
          <div className="bc-card p-5 flex flex-col gap-3">
            <div className="text-[15px] font-semibold text-[var(--ink-green)]">
              Deal Info
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                ["Phone", lead.phone],
                ["Email", lead.email],
                ["Size", lead.size],
                ["Budget", lead.budget],
                ["Timeline", lead.timeline],
                ["Source", lead.source],
                ["Owner", lead.owner],
                ["Follow-up", lead.followUp || "—"],
              ].map(([l, v]) => (
                <div key={l} className="flex flex-col gap-0.5 min-w-0">
                  <span style={labelStyle}>{l}</span>
                  <span className="text-[13px] text-[var(--ink-green)] truncate">
                    {v || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Proposal */}
          <div className="bc-card p-5 flex flex-col gap-3">
            <div className="text-[15px] font-semibold text-[var(--ink-green)]">
              Proposal
            </div>
            {lead.proposal ? (
              <div className="flex flex-col gap-1 text-[13px]">
                <span className="font-medium" style={{ color: "#3f6d5f" }}>
                  {lead.proposal.amount} · {lead.proposal.timeline}
                </span>
                {lead.proposal.remarks && (
                  <span className="text-[var(--muted)]">
                    {lead.proposal.remarks}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[13px] text-[var(--muted)]">
                No proposal yet.
              </span>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <input
                value={propAmount}
                onChange={(e) => setPropAmount(e.target.value)}
                placeholder="Quoted amount"
                className="bc-input"
              />
              <input
                value={propTimeline}
                onChange={(e) => setPropTimeline(e.target.value)}
                placeholder="Timeline"
                className="bc-input"
              />
            </div>
            <textarea
              value={propRemarks}
              onChange={(e) => setPropRemarks(e.target.value)}
              rows="2"
              placeholder="Remarks"
              className="bc-input resize-y"
            ></textarea>
            <button
              onClick={submitProposal}
              className="bc-btn-primary self-start"
            >
              Save Proposal
            </button>
          </div>

          {/* Notes */}
          <div className="bc-card p-5 flex flex-col gap-3">
            <div className="text-[15px] font-semibold text-[var(--ink-green)]">
              Notes
            </div>
            <div className="flex flex-col gap-2.5">
              {(lead.notes || []).map((n) => (
                <div key={n.id} className="flex flex-col gap-0.5">
                  <span className="text-[13px] text-[var(--ink-green)]">
                    {n.text}
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    {n.author} · {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {(!lead.notes || lead.notes.length === 0) && (
                <span className="text-[13px] text-[var(--muted)]">
                  No notes yet.
                </span>
              )}
            </div>
            <div className="flex gap-2.5">
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note…"
                className="bc-input flex-1"
                onKeyDown={(e) => e.key === "Enter" && submitNote()}
              />
              <button onClick={submitNote} className="bc-btn-secondary">
                Add
              </button>
            </div>
          </div>

          {/* Activity */}
          <div className="bc-card p-5 flex flex-col gap-2.5">
            <div className="text-[15px] font-semibold text-[var(--ink-green)]">
              Activity
            </div>
            {(lead.activity || []).map((a) => (
              <div key={a.id} className="flex flex-col gap-0.5">
                <span className="text-[13px] text-[var(--ink-green)]">
                  {a.text}
                </span>
                <span className="text-[11px] text-[var(--muted)]">
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
            {(!lead.activity || lead.activity.length === 0) && (
              <span className="text-[13px] text-[var(--muted)]">
                No activity yet.
              </span>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Move stage */}
          <div className="bc-card p-5 flex flex-col gap-3">
            <div className="text-[15px] font-semibold text-[var(--ink-green)]">
              Pipeline Stage
            </div>
            <select
              value={lead.stage}
              onChange={(e) =>
                moveStage({ id: lead.id, stage: e.target.value, via: "detail" })
              }
              className="bc-input"
            >
              {STAGES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Documents */}
          <div className="bc-card p-5 flex flex-col">
            <div className="text-[15px] font-semibold text-[var(--ink-green)] mb-2">
              Documents
            </div>
            {docRow("Brief", !!lead.docs?.brief)}
            {docRow("Proposal", !!lead.docs?.proposal)}
            {docRow("Contract", !!lead.docs?.contract)}
          </div>

          {/* Actions */}
          <div className="bc-card p-5 flex flex-col gap-2">
            <div className="text-[15px] font-semibold text-[var(--ink-green)] mb-1">
              Actions
            </div>
            <button
              onClick={() => markNurture(lead.id)}
              className="text-left rounded-[10px] px-3.5 py-2.5 text-[13px]"
              style={{
                background: "#f6edda",
                color: "#a3701a",
                border: "1px solid #a3701a33",
              }}
            >
              Move to Nurture List
            </button>
            <button
              onClick={() => markLost(lead.id)}
              className="text-left rounded-[10px] px-3.5 py-2.5 text-[13px]"
              style={{
                background: "#f5e7e4",
                color: "#a54536",
                border: "1px solid #a5453633",
              }}
            >
              Mark Closed-Lost
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
