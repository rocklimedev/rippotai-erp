// site-operations.enums.ts

export enum QcResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  REWORK = 'REWORK',
}

export enum QcItemResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  NA = 'NA',
}

export enum VisitorType {
  SUPERVISOR = 'SUPERVISOR', // daily
  ARCHITECT = 'ARCHITECT', // fixed schedule
  VENDOR = 'VENDOR',
  CONTRACTOR = 'CONTRACTOR',
  CLIENT = 'CLIENT',
  OTHER = 'OTHER',
}

export enum VisitFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  FIXED_SCHEDULE = 'FIXED_SCHEDULE', // e.g. every Tuesday/Friday
  AD_HOC = 'AD_HOC',
}

export enum VisitStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
  CANCELLED = 'CANCELLED',
}

export enum MockupStatus {
  PROPOSED = 'PROPOSED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum RfiStatus {
  OPEN = 'OPEN',
  ANSWERED = 'ANSWERED',
  CLOSED = 'CLOSED',
}

export enum RfiPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT', // blocking site work
}

export enum WeatherCondition {
  CLEAR = 'CLEAR',
  CLOUDY = 'CLOUDY',
  RAIN = 'RAIN',
  HEAVY_RAIN = 'HEAVY_RAIN',
  STORM = 'STORM',
  EXTREME_HEAT = 'EXTREME_HEAT',
  OTHER = 'OTHER',
}
