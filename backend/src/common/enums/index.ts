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
  QUOTATION_SUBMITTED = 'quotation_submitted',
  QUOTATION_APPROVED = 'quotation_approved',
  QUOTATION_RETURNED = 'quotation_returned',
  QUOTATION_DECLINED = 'quotation_declined',
}

export enum ActivityAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  QUOTATION_CREATED = 'quotation_created',
  QUOTATION_UPDATED = 'quotation_updated',
  QUOTATION_SUBMITTED = 'quotation_submitted',
  QUOTATION_APPROVED = 'quotation_approved',
  QUOTATION_RETURNED = 'quotation_returned',
  QUOTATION_DECLINED = 'quotation_declined',
  QUOTATION_DELETED = 'quotation_deleted',
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_ARCHIVED = 'project_archived',
  VENDOR_CREATED = 'vendor_created',
  VENDOR_UPDATED = 'vendor_updated',
  VENDOR_DELETED = 'vendor_deleted',
  SETTINGS_UPDATED = 'settings_updated',
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DEACTIVATED = 'user_deactivated',
}
