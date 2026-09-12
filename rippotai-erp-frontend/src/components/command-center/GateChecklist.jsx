import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

  return (
    <section
      className="mt-4 rounded-lg border border-slate-200 bg-white p-3"
      aria-label={gate.gateName}
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{gate.gateName}</h4>
        <span className="text-xs">
          {cleared
            ? "Cleared"
            : readiness?.isReady
              ? "Ready for sign-off"
              : gate.status}
        </span>
      </div>
      {!canRead ? (
        <p className="mt-2 text-xs text-slate-500">
          Gate read permission is required to view the checklist.
        </p>
      ) : (
        <>
          <Button variant="ghost" size="sm" disabled={busy} onClick={refetch}>
            {isFetching ? "Checking…" : "Refresh readiness"}
          </Button>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {message(error)}
            </p>
          )}
          {readiness && !error && (
            <>
              {!readiness.unlockedByPreviousGate && (
                <p className="text-xs text-amber-700">
                  Clear {readiness.previousGateCode} first.
                </p>
              )}
              <ul className="my-2 space-y-2">
                {readiness.conditions.map((condition) => (
                  <li key={condition.conditionId} className="text-xs">
                    <div
                      className={
                        condition.passed ? "text-emerald-700" : "text-amber-800"
                      }
                    >
                      {condition.passed ? "Passed" : "Pending"} ·{" "}
                      {condition.label}
                      {condition.optional && " (one alternative must pass)"}
                    </div>
                    <p className="text-slate-500">{condition.detail}</p>
                    {condition.meta?.evidence?.map((item) => (
                      <p
                        key={item.code}
                        className={
                          item.satisfied ? "text-emerald-700" : "text-amber-800"
                        }
                      >
                        {item.name}: {item.sourceLabel} · {item.status}
                      </p>
                    ))}
                    {condition.type === "MANUAL_APPROVAL" &&
                      canClear &&
                      !cleared && (
                        <Button
                          variant="outline"
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
                <p className="text-xs text-amber-700">
                  No conditions configured. Gate clearance is blocked.
                </p>
              )}
              {(canClear || permissions.includes("gates:reopen")) && (
                <Textarea
                  aria-label={`Reason for ${gate.gateName}`}
                  placeholder="Sign-off notes; a reason is required for reopening or overriding"
                  value={remarks}
                  maxLength={2000}
                  disabled={busy}
                  onChange={(event) => setRemarks(event.target.value)}
                />
              )}
              {canOverride && !cleared && !readiness.isReady && (
                <label className="my-2 flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={override}
                    disabled={busy || !readiness.unlockedByPreviousGate}
                    onChange={(event) => setOverride(event.target.checked)}
                  />
                  Override unmet conditions with the reason above
                </label>
              )}
              <div className="mt-2 flex gap-2">
                {!cleared && canClear && (
                  <Button
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
                    variant="outline"
                    size="sm"
                    disabled={busy || !remarks.trim()}
                    onClick={() => act(reopen, { remarks: remarks.trim() })}
                  >
                    Reopen and relock downstream gates
                  </Button>
                )}
                {!canClear && !cleared && (
                  <p className="text-xs text-slate-500">
                    Gate clear permission is required for sign-off.
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}
      {actionError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {actionError}
        </p>
      )}
    </section>
  );
}
