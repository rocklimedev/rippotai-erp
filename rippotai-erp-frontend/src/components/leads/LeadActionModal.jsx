import { useEffect, useState } from "react";
import { labelStyle, smallInputStyle, inputStyle } from "../constants/stages";
import { stageOf } from "../constants/stages";
import { useAddNoteMutation, useSetProposalMutation } from "../api/leadsApi";

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
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(22,27,29,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          padding: "24px",
          width: "440px",
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          boxShadow: "0 12px 40px rgba(22,27,29,0.2)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#161B1D" }}>
            {title}
          </div>
          <div style={{ fontSize: "12px", color: "#6E7F8D" }}>{sub}</div>
        </div>
        {isProposed && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px 16px",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label style={labelStyle}>Quoted Amount</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. ₹1.4Cr"
                style={smallInputStyle}
              />
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label style={labelStyle}>Timeline</label>
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                style={smallInputStyle}
              >
                <option>1–3 months</option>
                <option>3–6 months</option>
                <option>6–12 months</option>
                <option>12+ months</option>
              </select>
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
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
            style={{ ...inputStyle, resize: "vertical" }}
          ></textarea>
        </div>
        <div
          style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
        >
          <button
            onClick={onClose}
            className="btn-outline"
            style={{
              background: "#FFFFFF",
              color: "#161B1D",
              border: "1px solid #B5BFC6",
              borderRadius: "10px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 400,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="btn-dark"
            style={{
              background: "#161B1D",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "10px",
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: 400,
              cursor: "pointer",
            }}
          >
            {isProposed ? "Save Proposal" : "Add Remark"}
          </button>
        </div>
      </div>
    </div>
  );
}
