-- Allow categories created from the dropdown without a slug.
-- The existing unique index continues to apply to non-null slugs.
ALTER TABLE scope_categories MODIFY COLUMN slug VARCHAR(255) NULL;
