import { useEffect, useState } from "react";
import { Button, Field, TextArea, ChoiceGroup } from "@/components/inos";
import { Modal } from "./Modal";

const REASONS = ["Budget mismatch", "Chose another firm", "Project on hold", "No response", "Scope too small"];

/** Ask why a deal was lost before moving it to Closed Lost. */
export default function LostReasonModal({ deal, open, onCancel, onConfirm, busy }) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setDetail("");
    }
  }, [open]);

  const text = [reason, detail.trim()].filter(Boolean).join(" — ");

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onCancel()}
      size="sm"
      title="Mark deal as lost"
      description={deal ? `${deal.title} moves to Closed Lost.` : undefined}
      testId="lost-modal"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => onConfirm(text)} loading={busy}>
            Mark lost
          </Button>
        </>
      }
    >
      <Field label="Reason">
        <ChoiceGroup value={reason} onChange={setReason} options={REASONS.map((r) => ({ value: r, label: r }))} name="Lost reason" />
      </Field>
      <Field label="Details" optional>
        <TextArea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="e.g. Went with a local contractor at a lower quote" style={{ minHeight: 72 }} />
      </Field>
    </Modal>
  );
}
