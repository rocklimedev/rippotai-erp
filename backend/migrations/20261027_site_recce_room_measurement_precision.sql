-- Preserve inches when dimensions are stored as decimal feet.
ALTER TABLE site_recce_rooms
  MODIFY COLUMN length DECIMAL(14, 6) NULL,
  MODIFY COLUMN width DECIMAL(14, 6) NULL,
  MODIFY COLUMN height DECIMAL(14, 6) NULL;
