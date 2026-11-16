-- Preserve historical BOQ links while allowing independent vendor comparisons.
-- Apply before deploying the new workspace. Safe to run repeatedly.
ALTER TABLE vendor_rate_comparisons
  MODIFY COLUMN boq_id CHAR(36) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL;
