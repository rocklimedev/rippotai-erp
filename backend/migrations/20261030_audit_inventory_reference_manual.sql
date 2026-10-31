-- audit: InventoryService.receive() tags manual receipts with reference_type
-- 'MANUAL', but the column enum did not include it, so "Receive stock" failed
-- with "Data truncated for column 'reference_type'". Idempotent.
ALTER TABLE inventory_transactions
  MODIFY COLUMN reference_type
    ENUM('DELIVERY_CHALLAN','PURCHASE_ORDER','ISSUE','TRANSFER','ADJUSTMENT','RETURN','MANUAL') NULL DEFAULT NULL;
