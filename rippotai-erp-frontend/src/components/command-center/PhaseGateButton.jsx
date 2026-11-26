// "Clear gate" on each phase: one button, an optional note, then a second
// "are you sure" step before the gate is cleared (direct clear — open
// conditions are recorded as an override with the note).
import { useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button, TextArea } from '@/components/inos';
import { Modal } from '@/components/projects/_projects-ui';
import {
  useGetCommandCenterGateReadinessQuery,
  useClearCommandCenterGateMutation,
} from '@/api/projects/command-center.api';

const message = (error) => {
  const value = error?.data?.message;
  return Array.isArray(value)
    ? value.join('; ')
    : value || 'The gate could not be cleared. Please retry.';
};
const title = (s) =>
  s
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b[a-z]/g, (c) => c.toUpperCase());
// "Required evidence: 01_BRIEF" → "Brief documents"; "Approved: PRE_PROPOSED_LAYOUT" → "Proposed Layout"
const label = (s) => {
  const code = String(s || '')
    .replace(/^(Approved|Required evidence|Paid milestone):\s*/i, '')
    .trim();
  if (/^(\d{2}|[AB])_[A-Z_]+$/.test(code))
    return `${title(code.replace(/^(\d{2}|[AB])_/, ''))} documents`;
  if (/^[A-Z0-9_]+$/.test(code))
    return title(
      code.replace(/^(PRE|PLAN|DES|TENDER|WORK|EXEC|HANDOVER|VENDOR|MAT|BRIEF|RECCE|MOD)_/, ''),
    );
  return code;
};

export default function PhaseGateButton({ projectId, gates, onFlash }) {
  const { user } = useAuth();
  const permissions = user?.permissions ?? [];
  const canClear = permissions.includes('gates:clear');
  const gate = (gates || []).find((g) => g.status !== 'CLEARED');
  const allCleared = (gates || []).length > 0 && !gate;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const { currentData: readiness } = useGetCommandCenterGateReadinessQuery(
    { projectId, gateCode: gate?.gateCode },
    {
      skip: !projectId || !gate || !permissions.includes('gates:read'),
      refetchOnMountOrArgChange: true,
    },
  );
  const [clear, { isLoading }] = useClearCommandCenterGateMutation();

  if (!gates?.length) return null;
  if (allCleared)
    return (
      <span className="cc-gate-done" data-testid="phase-gate-cleared">
        <CheckCircle2 aria-hidden /> Gate cleared
      </span>
    );
  if (!canClear) return null;

  const locked = readiness && !readiness.unlockedByPreviousGate;
  const unmet = (readiness?.conditions || []).filter((c) => !c.optional && !c.passed);
  const close = () => {
    if (isLoading) return;
    setOpen(false);
    setStep(1);
    setErr('');
  };
  const confirm = async () => {
    setErr('');
    try {
      await clear({
        projectId,
        gateCode: gate.gateCode,
        body: { remarks: note.trim() || undefined, direct: true },
      }).unwrap();
      onFlash?.(`${gate.gateName} cleared.`);
      setNote('');
      close();
      setOpen(false);
    } catch (e) {
      setErr(message(e));
      setStep(1);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="primary"
        size="sm"
        icon={ShieldCheck}
        disabled={locked}
        title={locked ? `Clear ${readiness.previousGateCode} first` : `Clear ${gate.gateName}`}
        onClick={() => setOpen(true)}
        data-testid="phase-clear-gate"
      >
        Clear gate
      </Button>
      {open && (
        <Modal
          open
          onClose={close}
          title={step === 1 ? `Clear gate · ${gate.gateName}` : 'Are you sure?'}
          width={480}
          testId="clear-gate-modal"
          footer={
            step === 1 ? (
              <>
                <Button variant="ghost" onClick={close}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={ShieldCheck}
                  onClick={() => setStep(2)}
                  data-testid="clear-gate-next"
                >
                  Clear gate
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setStep(1)} disabled={isLoading}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={confirm}
                  loading={isLoading}
                  data-testid="clear-gate-confirm"
                >
                  Yes, clear gate
                </Button>
              </>
            )
          }
        >
          {step === 1 ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {unmet.length > 0 && (
                <p className="cc-gate__warn" style={{ margin: 0 }}>
                  Not yet met: {unmet.map((c) => label(c.label)).join(', ')}. Clearing now records
                  an override.
                </p>
              )}
              <TextArea
                aria-label="Note (optional)"
                placeholder="Note (optional)"
                value={note}
                maxLength={2000}
                rows={3}
                onChange={(e) => setNote(e.target.value)}
                data-testid="clear-gate-note"
              />
              {err && (
                <p role="alert" className="cc-gate__error" style={{ margin: 0 }}>
                  {err}
                </p>
              )}
            </div>
          ) : (
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              Confirm clearing <strong>{gate.gateName}</strong>
              {note.trim() ? <> with the note “{note.trim()}”</> : null}. The next phase will be
              unlocked.
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
