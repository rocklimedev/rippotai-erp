import { useEffect, useState } from "react";
import { labelStyle, stageOf } from "../../hooks/stages";
import {
  useAddNoteMutation,
  useSetProposalMutation,
} from "../../api/leads.api";

// modal = null | { kind: 'remark' | 'proposed', lead }
export default function LeadActionModal({ modal, onClose }) {
  const [addNote] = useAddNoteMutation();
  const [setProposal] = useSetProposalMutation();
  const [amount, setAmount] = useState("");
  const [timeline, setTimeline] = useState("1–3 months");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!modal) return;
    if (modal.kind === "proposed" && modal.lead.proposal) {
      setAmount(modal.lead.proposal.amount || "");
      setTimeline(modal.lead.proposal.timeline || "1–3 months");
      setRemarks(modal.lead.proposal.remarks || "");
    } else {
      setAmount("");
      setTimeline("1–3 months");
      setRemarks("");
    }
  }, [modal]);

  if (!modal) return null;
  const isProposed = modal.kind === "proposed";
  const title = isProposed ? "Mark as Proposed" : "Add Remark";
  const sub = modal.lead.name + " · " + stageOf(modal.lead.stage).label;

  const save = async () => {
    if (isProposed) {
      if (!amount.trim()) return;
      await setProposal({
        id: modal.lead.id,
        amount: amount.trim(),
        timeline,
        remarks: remarks.trim(),
      });
    } else {
      if (!remarks.trim()) return;
      await addNote({ id: modal.lead.id, text: remarks.trim() });
    }
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 flex items-center justify-center z-[100] p-5"
      style={{ background: "rgba(15,31,26,0.35)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-paper rounded-2xl p-6 w-[440px] max-w-full flex flex-col gap-3.5"
        style={{ boxShadow: "0 12px 40px rgba(15,31,26,0.22)" }}
      >
        <div className="flex flex-col gap-0.5">
          <div className="text-[16px] font-semibold text-[var(--ink-green)]">
            {title}
          </div>
          <div className="text-[12px] text-[var(--muted)]">{sub}</div>
        </div>

        {isProposed && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="flex flex-col gap-1.5">
              <label style={labelStyle}>Quoted Amount</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. ₹1.4Cr"
                className="bc-input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label style={labelStyle}>Timeline</label>
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="bc-input"
              >
                <option>1–3 months</option>
                <option>3–6 months</option>
                <option>6–12 months</option>
                <option>12+ months</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label style={labelStyle}>Remarks</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows="3"
            placeholder={
              isProposed
                ? "Scope covered by this quote, exclusions, validity…"
                : "Add a remark for this lead…"
            }
            className="bc-input resize-y"
          ></textarea>
        </div>

        <div className="flex justify-end gap-2.5">
          <button onClick={onClose} className="bc-btn-secondary">
            Cancel
          </button>
          <button onClick={save} className="bc-btn-primary">
            {isProposed ? "Save Proposal" : "Add Remark"}
          </button>
        </div>
      </div>
    </div>
  );
}
