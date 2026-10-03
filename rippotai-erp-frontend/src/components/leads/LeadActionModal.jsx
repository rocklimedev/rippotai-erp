import { useEffect, useState } from "react";
import { stageOf } from "../../hooks/stages";
import { Field, TextInput, TextArea, ChoiceGroup, Button } from "@/components/inos";
import { Callout } from "@/components/forms/crm-form-ui";
import {
  useAddNoteMutation,
  useSetProposalMutation,
} from "../../api/connectors/leads.api";

// modal = null | { kind: "remark" | "proposed", lead }
export default function LeadActionModal({ modal, onClose }) {
  const [addNote, { isLoading: isAddingNote }] = useAddNoteMutation();
  const [setProposal, { isLoading: isSavingProposal }] =
    useSetProposalMutation();

  const [amount, setAmount] = useState("");
  const [timeline, setTimeline] = useState("1–3 months");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!modal) return;

    setError("");

    if (modal.kind === "proposed" && modal.lead?.proposal) {
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
  const lead = modal.lead;

  const title = isProposed ? "Mark as proposed" : "Add remark";

  const stageLabel = stageOf(lead?.stage)?.label || lead?.stage || "Unknown";

  const sub = `${lead?.name || "Lead"} · ${stageLabel}`;

  const isSaving = isAddingNote || isSavingProposal;

  const save = async () => {
    setError("");

    if (isProposed) {
      if (!amount.trim()) {
        setError("Quoted amount is required.");
        return;
      }

      try {
        await setProposal({
          id: lead.id,
          amount: amount.trim(),
          timeline,
          remarks: remarks.trim(),
        }).unwrap();

        onClose();
      } catch (err) {
        console.error("Failed to save proposal:", err);

        setError(
          err?.data?.message ||
            err?.error ||
            "Failed to save proposal. Please try again.",
        );
      }

      return;
    }

    if (!remarks.trim()) {
      setError("Please enter a remark.");
      return;
    }

    try {
      await addNote({
        id: lead.id,
        text: remarks.trim(),
      }).unwrap();

      onClose();
    } catch (err) {
      console.error("Failed to add remark:", err);

      setError(
        err?.data?.message ||
          err?.error ||
          "Failed to add remark. Please try again.",
      );
    }
  };

  const TIMELINES = ["1–3 months", "3–6 months", "6–12 months", "12+ months"];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 flex items-center justify-center z-[100] p-4"
      style={{ background: "rgba(20, 38, 32, 0.32)" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-action-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape" && !isSaving) onClose();
        }}
        className="w-[460px] max-w-full"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ padding: "18px 20px 4px" }}>
          <h2 id="lead-action-title" className="inos-section-title">
            {title}
          </h2>
          <p className="inos-section-sub">{sub}</p>
        </div>

        <form
          className="inos-modal-body"
          style={{ padding: "16px 20px 20px" }}
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          {isProposed && (
            <>
              <Field
                label="Quoted amount"
                required
                htmlFor="lead-quote"
                error={error && !amount.trim() ? error : undefined}
              >
                <TextInput
                  id="lead-quote"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. ₹1.4Cr"
                  disabled={isSaving}
                  invalid={Boolean(error && !amount.trim())}
                  autoFocus
                />
              </Field>

              <Field label="Timeline">
                <ChoiceGroup
                  name="Timeline"
                  value={timeline}
                  onChange={(v) => !isSaving && setTimeline(v)}
                  options={TIMELINES.map((t) => ({ value: t, label: t }))}
                />
              </Field>
            </>
          )}

          <Field
            label="Remarks"
            required={!isProposed}
            optional={isProposed}
            htmlFor="lead-remarks"
            error={!isProposed && error && !remarks.trim() ? error : undefined}
          >
            <TextArea
              id="lead-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder={
                isProposed
                  ? "Scope covered by this quote, exclusions, validity…"
                  : "e.g. Called back, client wants a site visit next week"
              }
              disabled={isSaving}
              autoFocus={!isProposed}
            />
          </Field>

          {error &&
            !(isProposed && !amount.trim()) &&
            !(!isProposed && !remarks.trim()) && (
              <Callout tone="bad">{error}</Callout>
            )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : isProposed ? "Save proposal" : "Add remark"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
