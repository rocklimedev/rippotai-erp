import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button, TextArea } from "@/components/inos";
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

  const canReopen = cleared && permissions.includes("gates:reopen");
  const canSignOff = !cleared && canClear;

  return (
    <section className="cc-gate" aria-label={gate.gateName}>
      <h4 className="cc-gate__title">{gate.gateName}</h4>
      {!canRead ? (
        <p className="cc-gate__note">
          Gate read permission is required to use gate actions.
        </p>
      ) : (
        <>
          {isFetching && !readiness && <p role="status">Checking gate…</p>}
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
              {canSignOff && (
                <div className="cc-gate__actions">
                  {readiness.conditions
                    .filter((condition) => condition.type === "MANUAL_APPROVAL")
                    .map((condition) => (
                      <Button
                        key={condition.conditionId}
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
                        {condition.passed ? "Remove confirmation for" : "Confirm"}{" "}
                        {condition.label.replace(/^Approved:\s*/i, "")}
                      </Button>
                    ))}
                </div>
              )}
              {!readiness.conditions.length && (
                <p className="cc-gate__warn">
                  No conditions configured. Gate clearance is blocked.
                </p>
              )}
              {(canSignOff || canReopen) && (
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
                {canSignOff && (
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
                {canReopen && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy || !remarks.trim()}
                    onClick={() => act(reopen, { remarks: remarks.trim() })}
                  >
                    Reopen and relock downstream gates
                  </Button>
                )}
                {!canSignOff && !canReopen && (
                  <p className="cc-gate__note">
                    No gate actions available.
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
