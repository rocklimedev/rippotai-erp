// NOTE: merge these into your existing `@/common/enums` barrel (same place
// ProjectPriority / ProjectStatus already live) so the import paths used
// throughout this module (`@/common/enums`) resolve correctly.

export enum BoqStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

export enum TemplateTier {
  ESSENTIAL = 'essential',
  PREMIUM = 'premium',
  LUXURY = 'luxury',
}

export enum BoqActivityAction {
  CREATED = 'created',
  UPDATED = 'updated',
  ITEM_ADDED = 'item_added',
  ITEM_UPDATED = 'item_updated',
  ITEM_DELETED = 'item_deleted',
  ITEM_MOVED = 'item_moved',
  CATEGORY_ADDED = 'category_added',
  CATEGORY_DELETED = 'category_deleted',
  RATE_CHANGED = 'rate_changed',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}
