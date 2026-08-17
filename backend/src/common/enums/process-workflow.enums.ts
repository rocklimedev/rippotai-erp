// process-workflow.enums.ts

/** The three parallel tracks every phase/step belongs to. */
export enum TrackType {
  MAIN = 'MAIN', // Brief -> Survey -> Pre-Design -> Payment -> Design -> Tender Drawings -> Working Drawings -> Execution -> Snag & Handover
  VENDOR_TRADES = 'VENDOR_TRADES',
  MATERIAL_PROCUREMENT = 'MATERIAL_PROCUREMENT',
}

/** Internal teams + client. Trade contractors are represented separately via isTrade + tradeCategory. */
export enum TeamType {
  ARCHITECT = 'ARCHITECT',
  SUPERVISOR = 'SUPERVISOR',
  ADMIN = 'ADMIN',
  ACCOUNTS = 'ACCOUNTS',
  PLANNING = 'PLANNING',
  PROCUREMENT = 'PROCUREMENT',
  CLIENT = 'CLIENT',
  TRADE = 'TRADE',
}

/** The 12 contractor trades tracked on the Vendor & Trades track. */
export enum TradeCategory {
  CIVIL = 'CIVIL',
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  HVAC = 'HVAC',
  CARPENTRY = 'CARPENTRY',
  FALSE_CEILING = 'FALSE_CEILING',
  FLOORING = 'FLOORING',
  PAINTING = 'PAINTING',
  GLASS_ALUMINIUM = 'GLASS_ALUMINIUM',
  METAL_FABRICATION = 'METAL_FABRICATION',
  SOFT_FURNISHING = 'SOFT_FURNISHING',
  LANDSCAPING = 'LANDSCAPING',
}

export enum ResponsibilityType {
  OWNER = 'OWNER', // accountable for the step's outcome
  SUPPORT = 'SUPPORT', // contributes but isn't the owner
  APPROVER = 'APPROVER', // must sign off for the step/gate to close
}

export enum StepStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
}

export enum PhaseStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
}

export enum ContinuityType {
  CONTINUOUS = 'CONTINUOUS', // runs end-to-end across the whole project (e.g. Architect, Site Supervisor, Client)
  GATE_BOUND = 'GATE_BOUND', // opens at one gate/step and closes at another (e.g. a trade contractor)
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
