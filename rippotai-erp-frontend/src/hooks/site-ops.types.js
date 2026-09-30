/** Site Operations shared constants & enums */

// --- Architect visit enums ---
export const VisitType = {
  MANDATORY: "Mandatory",
  HOLD_POINT: "Hold Point",
  AS_REQUIRED: "As Required",
  MANDATORY_CRITICAL: "Mandatory (Critical)",
};

export const ArchitectVisitStatus = {
  NOT_SCHEDULED: "Not Scheduled",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const SnagStatus = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RECTIFIED: "Rectified",
  CLOSED: "Closed",
};

export const QualityCheckStatus = {
  PENDING: "Pending",
  PASSED: "Passed",
  FAILED: "Failed",
  NOT_APPLICABLE: "N/A",
};

// --- Site-ops enums ---
export const QcResult = {
  PASS: "PASS",
  FAIL: "FAIL",
  REWORK: "REWORK",
};

export const MockupStatus = {
  PROPOSED: "PROPOSED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export const RfiStatus = {
  OPEN: "OPEN",
  ANSWERED: "ANSWERED",
  CLOSED: "CLOSED",
};

export const RfiPriority = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
};

export const WeatherCondition = {
  CLEAR: "CLEAR",
  CLOUDY: "CLOUDY",
  RAIN: "RAIN",
  HEAVY_RAIN: "HEAVY_RAIN",
  STORM: "STORM",
  EXTREME_HEAT: "EXTREME_HEAT",
  OTHER: "OTHER",
};

export const ARCHITECT_VISIT_STATUS_OPTIONS = Object.values(ArchitectVisitStatus);
export const SNAG_STATUS_OPTIONS = Object.values(SnagStatus);
export const RFI_STATUS_OPTIONS = Object.values(RfiStatus);
export const RFI_PRIORITY_OPTIONS = Object.values(RfiPriority);
export const MOCKUP_STATUS_OPTIONS = Object.values(MockupStatus);
export const WEATHER_OPTIONS = Object.values(WeatherCondition);
export const QUALITY_CHECK_STATUS_OPTIONS = Object.values(QualityCheckStatus);
