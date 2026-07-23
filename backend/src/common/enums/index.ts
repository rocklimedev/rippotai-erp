// ============================================================
// Shared ENUM definitions - mirrors the MySQL/MariaDB schema
// ============================================================

export enum AuthTokenType {
  REFRESH = 'refresh',
  SESSION = 'session',
}

export enum VerificationTokenType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

export enum ProjectStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  INACTIVE = 'inactive',
}
export enum ProjectPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}
export enum VendorCategory {
  MATERIAL = 'Material',
  CONTRACTOR = 'Contractor',
}

export enum VendorBusinessType {
  PAINT = 'Paint',
  WIRING = 'Wiring',
  GLASS = 'Glass',
  METAL = 'Metal',
  TILES = 'Tiles',
  CEMENT = 'Cement',
  SAND = 'Sand',
  STEEL = 'Steel',
  WOOD = 'Wood',
  FLOORING = 'Flooring',
  PLUMBING_MATERIALS = 'Plumbing Materials',
  ELECTRICAL_MATERIALS = 'Electrical Materials',
  HARDWARE = 'Hardware',
  LABOUR = 'Labour',
  LABOUR_CONTRACTOR = 'Labour Contractor',
  CIVIL_CONTRACTOR = 'Civil Contractor',
  ELECTRICIAN = 'Electrician',
  PLUMBING_CONTRACTOR = 'Plumbing Contractor',
  PAINTER = 'Painter',
  POLISHING = 'Polishing',
  AC_WORK = 'AC Work',
  INTERIOR_CONTRACTOR = 'Interior Contractor',
  CARPENTER = 'Carpenter',
  MASON = 'Mason',
  MATERIAL_CONTRACTOR = 'Material Contractor',
}

export enum VendorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLACKLISTED = 'blacklisted',
  BLOCKED = 'blocked',
}

export enum QuotationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  RETURNED_FOR_EDITING = 'returned_for_editing',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
}

export enum NotificationType {
  // =========================
  // PROJECTS
  // =========================
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_ARCHIVED = 'project_archived',
  PROJECT_RESTORED = 'project_restored',
  PROJECT_DELETED = 'project_deleted',

  // =========================
  // BRIEFS
  // =========================
  BRIEF_CREATED = 'brief_created',
  BRIEF_UPDATED = 'brief_updated',
  BRIEF_DELETED = 'brief_deleted',

  // =========================
  // CALENDAR
  // =========================
  CALENDAR_EVENT_CREATED = 'calendar_event_created',
  CALENDAR_EVENT_UPDATED = 'calendar_event_updated',
  CALENDAR_EVENT_DELETED = 'calendar_event_deleted',

  // =========================
  // CLIENTS
  // =========================
  CLIENT_CREATED = 'client_created',
  CLIENT_UPDATED = 'client_updated',
  CLIENT_DELETED = 'client_deleted',
  CLIENT_RESTORED = 'client_restored',

  // =========================
  // DRAWINGS
  // =========================
  DRAWING_UPLOADED = 'drawing_uploaded',
  DRAWING_SUPERSEDED = 'drawing_superseded',

  // =========================
  // LEADS
  // =========================
  LEAD_CREATED = 'lead_created',
  LEAD_UPDATED = 'lead_updated',
  LEAD_STAGE_CHANGED = 'lead_stage_changed',
  LEAD_NOTE_ADDED = 'lead_note_added',
  LEAD_PROPOSAL_SENT = 'lead_proposal_sent',
  LEAD_DELETED = 'lead_deleted',

  // =========================
  // QUOTATIONS
  // =========================
  QUOTATION_CREATED = 'quotation_created',
  QUOTATION_UPDATED = 'quotation_updated',
  QUOTATION_SUBMITTED = 'quotation_submitted',
  QUOTATION_APPROVED = 'quotation_approved',
  QUOTATION_RETURNED_FOR_EDITING = 'quotation_returned_for_editing',
  QUOTATION_DECLINED = 'quotation_declined',
  QUOTATION_CANCELLED = 'quotation_cancelled',
  QUOTATION_DELETED = 'quotation_deleted',
  QUOTATION_RESTORED = 'quotation_restored',

  // =========================
  // VENDORS
  // =========================
  VENDOR_CREATED = 'vendor_created',
  VENDOR_UPDATED = 'vendor_updated',
  VENDOR_STATUS_CHANGED = 'vendor_status_changed',
  VENDOR_DELETED = 'vendor_deleted',

  // =========================
  // USERS
  // =========================
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_PROFILE_UPDATED = 'user_profile_updated',
  USER_AVATAR_UPDATED = 'user_avatar_updated',
  USER_DEACTIVATED = 'user_deactivated',
  USER_DELETED = 'user_deleted',

  // =========================
  // TASKS
  // =========================
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_STATUS_CHANGED = 'task_status_changed',
  TASK_COMPLETED = 'task_completed',
  TASK_DELETED = 'task_deleted',

  // =========================
  // SITE RECCE
  // =========================
  SITE_RECCE_CREATED = 'site_recce_created',
  SITE_RECCE_UPDATED = 'site_recce_updated',
  SITE_RECCE_STATUS_CHANGED = 'site_recce_status_changed',
  SITE_RECCE_DELETED = 'site_recce_deleted',

  // =========================
  // PURCHASE ORDERS (already present)
  // =========================
  PURCHASE_ORDER_CREATED = 'purchase_order_created',
  PURCHASE_ORDER_UPDATED = 'purchase_order_updated',
  PURCHASE_ORDER_APPROVED = 'purchase_order_approved',
  PURCHASE_ORDER_REJECTED = 'purchase_order_rejected',
  PURCHASE_ORDER_CANCELLED = 'purchase_order_cancelled',

  // =========================
  // GENERAL
  // =========================
  SYSTEM = 'system',
  REMINDER = 'reminder',
  ANNOUNCEMENT = 'announcement',
}

export enum ActivityAction {
  // =====================
  // AUTH
  // =====================
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  TOKEN_REFRESHED = 'token_refreshed',

  // =====================
  // USER MANAGEMENT
  // =====================
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_PROFILE_UPDATED = 'user_profile_updated',
  USER_AVATAR_UPDATED = 'user_avatar_updated',
  USER_DEACTIVATED = 'user_deactivated',
  USER_REACTIVATED = 'user_reactivated',
  USER_DELETED = 'user_deleted',
  USER_ROLE_CHANGED = 'user_role_changed',
  USER_PERMISSION_UPDATED = 'user_permission_updated',

  // =====================
  // PROJECTS
  // =====================
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_ARCHIVED = 'project_archived',
  PROJECT_RESTORED = 'project_restored',
  PROJECT_DELETED = 'project_deleted',
  PROJECT_MEMBER_ADDED = 'project_member_added',
  PROJECT_MEMBER_REMOVED = 'project_member_removed',
  PROJECT_STATUS_CHANGED = 'project_status_changed',

  // =====================
  // CLIENTS
  // =====================
  CLIENT_CREATED = 'client_created',
  CLIENT_UPDATED = 'client_updated',
  CLIENT_DELETED = 'client_deleted',
  CLIENT_RESTORED = 'client_restored',

  // =====================
  // BRIEFS
  // =====================
  BRIEF_CREATED = 'brief_created',
  BRIEF_UPDATED = 'brief_updated',
  BRIEF_DELETED = 'brief_deleted',

  // =====================
  // CALENDAR
  // =====================
  CALENDAR_EVENT_CREATED = 'calendar_event_created',
  CALENDAR_EVENT_UPDATED = 'calendar_event_updated',
  CALENDAR_EVENT_DELETED = 'calendar_event_deleted',

  // =====================
  // TASKS
  // =====================
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_STATUS_CHANGED = 'task_status_changed',
  TASK_COMPLETED = 'task_completed',
  TASK_DELETED = 'task_deleted',

  // =====================
  // LEADS
  // =====================
  LEAD_CREATED = 'lead_created',
  LEAD_UPDATED = 'lead_updated',
  LEAD_STAGE_CHANGED = 'lead_stage_changed',
  LEAD_NOTE_ADDED = 'lead_note_added',
  LEAD_PROPOSAL_SENT = 'lead_proposal_sent',
  LEAD_DELETED = 'lead_deleted',

  // =====================
  // QUOTATIONS
  // =====================
  QUOTATION_CREATED = 'quotation_created',
  QUOTATION_UPDATED = 'quotation_updated',
  QUOTATION_SUBMITTED = 'quotation_submitted',
  QUOTATION_APPROVED = 'quotation_approved',
  QUOTATION_RETURNED = 'quotation_returned',
  QUOTATION_DECLINED = 'quotation_declined',
  QUOTATION_CANCELLED = 'quotation_cancelled',
  QUOTATION_DELETED = 'quotation_deleted',
  QUOTATION_REVISION_CREATED = 'quotation_revision_created',
  QUOTATION_SENT_TO_CLIENT = 'quotation_sent_to_client',
  QUOTATION_RESTORED = 'quotation_restored',

  // =====================
  // VENDORS
  // =====================
  VENDOR_CREATED = 'vendor_created',
  VENDOR_UPDATED = 'vendor_updated',
  VENDOR_DELETED = 'vendor_deleted',
  VENDOR_APPROVED = 'vendor_approved',
  VENDOR_REJECTED = 'vendor_rejected',
  VENDOR_STATUS_CHANGED = 'vendor_status_changed',

  // =====================
  // DRAWINGS
  // =====================
  DRAWING_UPLOADED = 'drawing_uploaded',
  DRAWING_SUPERSEDED = 'drawing_superseded',

  // =====================
  // SITE RECCE
  // =====================
  SITE_RECCE_CREATED = 'site_recce_created',
  SITE_RECCE_UPDATED = 'site_recce_updated',
  SITE_RECCE_STATUS_CHANGED = 'site_recce_status_changed',
  SITE_RECCE_DELETED = 'site_recce_deleted',

  // =====================
  // SETTINGS / CONFIG
  // =====================
  SETTINGS_UPDATED = 'settings_updated',
  SYSTEM_CONFIG_CHANGED = 'system_config_changed',
  BILLING_SETTINGS_UPDATED = 'billing_settings_updated',

  // =====================
  // FILES / DOCUMENTS
  // =====================
  FILE_UPLOADED = 'file_uploaded',
  FILE_DELETED = 'file_deleted',
  FILE_DOWNLOADED = 'file_downloaded',
  DOCUMENT_GENERATED = 'document_generated',

  // =====================
  // FINANCE (ERP EXPANSION)
  // =====================
  INVOICE_CREATED = 'invoice_created',
  INVOICE_UPDATED = 'invoice_updated',
  INVOICE_PAID = 'invoice_paid',
  PAYMENT_RECEIVED = 'payment_received',

  // =====================
  // SYSTEM / SECURITY
  // =====================
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',
  PERMISSION_DENIED = 'permission_denied',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'unauthorized_access_attempt',
}
