-- audit: inventory_transactions.unit is a legacy NOT NULL snapshot column that the
-- Sequelize model did not map, so every stock movement insert (receipt, issue,
-- opening stock, transfer, reversal) failed with "Field 'unit' doesn't have a
-- default value". The model now writes the unit code; this default keeps any
-- other insert path working. Idempotent.
ALTER TABLE inventory_transactions
  MODIFY COLUMN unit VARCHAR(30) NOT NULL DEFAULT '';
