export enum LeadStage {
  CAPTURE = 'capture',
  QUAL = 'qual',
  DISC = 'disc',
  PROP = 'prop',
  NEGO = 'nego',
  CONTRACT = 'contract',
  HANDOFF = 'handoff',
  NURTURE = 'nurture',
  LOST = 'lost',
}

// Stages counted as "active" (used for stuck calculation and active-lead KPIs)
export const ACTIVE_STAGES = [
  LeadStage.CAPTURE,
  LeadStage.QUAL,
  LeadStage.DISC,
  LeadStage.PROP,
  LeadStage.NEGO,
];

// Ordered pipeline, used for sorting / conversion-rate calculations
export const STAGE_ORDER = [
  LeadStage.CAPTURE,
  LeadStage.QUAL,
  LeadStage.DISC,
  LeadStage.PROP,
  LeadStage.NEGO,
  LeadStage.CONTRACT,
  LeadStage.HANDOFF,
  LeadStage.NURTURE,
  LeadStage.LOST,
];

export const STAGE_LABELS: Record<LeadStage, string> = {
  [LeadStage.CAPTURE]: 'Lead Capture',
  [LeadStage.QUAL]: 'Qualification',
  [LeadStage.DISC]: 'Discovery / Site Visit',
  [LeadStage.PROP]: 'Proposal / Concept',
  [LeadStage.NEGO]: 'Negotiation',
  [LeadStage.CONTRACT]: 'Contract Signed',
  [LeadStage.HANDOFF]: 'Handoff to Execution',
  [LeadStage.NURTURE]: 'Nurture List',
  [LeadStage.LOST]: 'Closed-Lost',
};

export enum LeadType {
  RESIDENTIAL = 'Residential',
  COMMERCIAL = 'Commercial',
  INSTITUTIONAL = 'Institutional',
}

export enum LeadTag {
  HOT = 'Hot',
  WARM = 'Warm',
  COLD = 'Cold',
}

export enum LeadColor {
  GREEN = 'Green',
  RED = 'Red',
  YELLOW = 'Yellow',
  BLUE = 'Blue',
}

export enum StuckMode {
  AUTO = 'auto',
  ALWAYS = 'always',
  NEVER = 'never',
}

export enum DocType {
  BRIEF = 'brief',
  PROPOSAL = 'proposal',
  CONTRACT = 'contract',
}

export enum DocStatus {
  NOT_STARTED = 0,
  SENT = 1,
  SIGNED = 2,
}
