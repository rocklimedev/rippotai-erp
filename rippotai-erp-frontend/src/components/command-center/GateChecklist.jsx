import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { CircleCheck, CircleDashed, RefreshCw, ShieldCheck } from "lucide-react";
import { Button, Pill, TextArea } from "@/components/inos";
import {
  useGetCommandCenterGateReadinessQuery,
  useClearCommandCenterGateMutation,
  useReopenCommandCenterGateMutation,
  useTickCommandCenterConditionMutation,
} from "@/api/projects/command-center.api";

const message = (error) => {
  const value = error?.data?.message;
  return Array.isArray(value)
    ? value.join("; ")
    : value || "The gate could not be updated. Please retry.";
};

export default function GateChecklist({ projectId, gate, onFlash }) {
  const { user } = useAuth();
  const permissions = user?.permissions ?? [];
  const canRead = permissions.includes("gates:read");
  const canClear = permissions.includes("gates:clear");
  const [remarks, setRemarks] = useState("");
  const [override, setOverride] = useState(false);
  const [actionError, setActionError] = useState("");
  const {
    currentData: readiness,
    isFetching,
    error,
    refetch,
  } = useGetCommandCenterGateReadinessQuery(
    { projectId, gateCode: gate.gateCode },
    {
      skip: !projectId || !canRead,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    },
  );
  const [clear, clearState] = useClearCommandCenterGateMutation();
  const [reopen, reopenState] = useReopenCommandCenterGateMutation();
  const [tick, tickState] = useTickCommandCenterConditionMutation();
  const busy =
    isFetching ||
    clearState.isLoading ||
    reopenState.isLoading ||
    tickState.isLoading;
  const cleared = (readiness?.status ?? gate.status) === "CLEARED";
  const canOverride =
    canClear &&
    permissions.includes("gates:override") &&
    gate.allowsOverride === true;
  const readyToClear =
    readiness &&
    !error &&
    !cleared &&
    readiness.unlockedByPreviousGate &&
    (readiness.isReady || (canOverride && override && remarks.trim()));

  async function act(mutation, body, conditionId) {
    setActionError("");
    try {
      await mutation({
        projectId,
        gateCode: gate.gateCode,
        conditionId,
        body,
      }).unwrap();
      setRemarks("");
      setOverride(false);
      onFlash?.("Gate updated.");
    } catch (failure) {
      setActionError(message(failure));
    }
  }

  const statusTone = cleared ? "ok" : readiness?.isReady ? "info" : "warn";
  const statusText = cleared
    ? "Cleared"
    : readiness?.isReady
      ? "Ready for sign-off"
      : String(gate.status ?? "Pending").replace(/_/g, " ").toLowerCase().replace(/^\w/, (m) => m.toUpperCase());

  return (
    <section className="cc-gate" aria-label={gate.gateName}>
      <div className="cc-gate__head">
        <span className={`inos-icon-tile inos-icon-tile--sm inos-icon-tile--${statusTone}`}>
          <ShieldCheck aria-hidden />
        </span>
        <h4 className="cc-gate__title">{gate.gateName}</h4>
        <Pill tone={statusTone} size="sm">{statusText}</Pill>
        {canRead && (
          <Button variant="ghost" size="sm" icon={RefreshCw} disabled={busy} onClick={refetch}>
            {isFetching ? "Checking…" : "Refresh"}
          </Button>
        )}
      </div>
      {!canRead ? (
        <p className="cc-gate__note">
          Gate read permission is required to view the checklist.
        </p>
      ) : (
        <>
          {error && (
            <p role="alert" className="cc-gate__error">
              {message(error)}
            </p>
          )}
          {readiness && !error && (
            <>
              {!readiness.unlockedByPreviousGate && (
                <p className="cc-gate__warn">
                  Clear {readiness.previousGateCode} first.
                </p>
              )}
              <ul className="cc-gate__list">
                {readiness.conditions.map((condition) => (
                  <li key={condition.conditionId} className="cc-gate__cond">
                    {condition.passed ? (
                      <CircleCheck className="cc-gate__icon is-ok" aria-hidden />
                    ) : (
                      <CircleDashed className="cc-gate__icon" aria-hidden />
                    )}
                    <div className="cc-gate__cond-body">
                      <p className="cc-gate__cond-title">
                        {condition.label}
                        {condition.optional && (
                          <span className="cc-gate__opt"> · one alternative must pass</span>
                        )}
                      </p>
                      {condition.detail && <p className="cc-gate__note">{condition.detail}</p>}
                      {condition.meta?.evidence?.map((item) => (
                        <p key={item.code} className="cc-gate__evidence">
                          <span className={`cc-bullet ${item.satisfied ? "cc-dot--ok" : "cc-dot--warn"}`} />
                          {item.name}: {item.sourceLabel} · {item.status}
                        </p>
                      ))}
                    </div>
                    {condition.type === "MANUAL_APPROVAL" && canClear && !cleared && (
                      <Button
                        variant={condition.passed ? "ghost" : "secondary"}
                        size="sm"
                        disabled={busy || !readiness.unlockedByPreviousGate}
                        onClick={() =>
                          act(
                            tick,
                            { ticked: !condition.passed, remarks },
                            condition.conditionId,
                          )
                        }
                      >
                        {condition.passed ? "Remove confirmation" : "Confirm"}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              {!readiness.conditions.length && (
                <p className="cc-gate__warn">
                  No conditions configured. Gate clearance is blocked.
                </p>
              )}
              {(canClear || permissions.includes("gates:reopen")) && (
                <TextArea
                  aria-label={`Reason for ${gate.gateName}`}
                  placeholder="Sign-off notes. A reason is required to reopen or override."
                  value={remarks}
                  maxLength={2000}
                  disabled={busy}
                  rows={2}
                  style={{ minHeight: 72 }}
                  onChange={(event) => setRemarks(event.target.value)}
                />
              )}
              {canOverride && !cleared && !readiness.isReady && (
                <label className="cc-gate__check">
                  <input
                    type="checkbox"
                    checked={override}
                    disabled={busy || !readiness.unlockedByPreviousGate}
                    onChange={(event) => setOverride(event.target.checked)}
                  />
                  Override unmet conditions with the reason above
                </label>
              )}
              <div className="cc-gate__actions">
                {!cleared && canClear && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={busy || !readyToClear}
                    onClick={() =>
                      act(clear, {
                        remarks: remarks.trim(),
                        override: !!(override && canOverride),
                      })
                    }
                  >
                    Clear gate
                  </Button>
                )}
                {cleared && permissions.includes("gates:reopen") && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy || !remarks.trim()}
                    onClick={() => act(reopen, { remarks: remarks.trim() })}
                  >
                    Reopen and relock downstream gates
                  </Button>
                )}
                {!canClear && !cleared && (
                  <p className="cc-gate__note">
                    Gate clear permission is required for sign-off.
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}
      {actionError && (
        <p role="alert" className="cc-gate__error">
          {actionError}
        </p>
      )}
    </section>
  );
}
