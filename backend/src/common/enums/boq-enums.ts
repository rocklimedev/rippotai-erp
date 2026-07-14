export enum BoqStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  AWAITING_APPROVAL = 'awaiting_approval',
  RETURNED = 'returned',
  APPROVED = 'approved',
  FINAL = 'final',
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
  ITEM_REORDERED = 'item_reordered',
  ITEM_HIDDEN = 'item_hidden',
  ITEM_SHOWN = 'item_shown',
  ITEMS_BULK_UPDATED = 'items_bulk_updated',

  CATEGORY_ADDED = 'category_added',
  CATEGORY_DELETED = 'category_deleted',

  RATE_CHANGED = 'rate_changed',

  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',

  VERSION_CREATED = 'version_created',

  DELETED = 'deleted',
}
