export interface GateConditionResult {
  conditionId: string;
  type: string;
  label: string;
  optional: boolean;
  passed: boolean;
  detail: string;
  meta?: Record<string, any>;
}

export interface GateReadiness {
  gateCode: string;
  gateName: string;
  sequenceOrder: number;
  status: string;
  unlockedByPreviousGate: boolean;
  previousGateCode: string | null;
  requiredConditionsPassed: boolean;
  optionalGroupPassed: boolean;
  isReady: boolean;
  conditions: GateConditionResult[];
}
