-- Apply before deploying the final Scope of Work template.
ALTER TABLE scope_of_work
  ADD COLUMN total_area_sqft DECIMAL(12,2) NULL,
  ADD COLUMN document_date DATE NULL,
  ADD COLUMN authorised_signatory_name VARCHAR(255) NULL,
  ADD COLUMN authorised_signatory_date DATE NULL;
