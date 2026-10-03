-- boqs.status: align the DB enum with the code (BoqStatus in src/common/enums/boq-enums.ts).
-- Legacy values pending_approval / rejected are mapped to awaiting_approval / returned. Idempotent.
ALTER TABLE boqs MODIFY status ENUM('draft','in_progress','awaiting_approval','returned','approved','final','archived','pending_approval','rejected') NOT NULL DEFAULT 'draft';
UPDATE boqs SET status = 'awaiting_approval' WHERE status = 'pending_approval';
UPDATE boqs SET status = 'returned' WHERE status = 'rejected';
ALTER TABLE boqs MODIFY status ENUM('draft','in_progress','awaiting_approval','returned','approved','final','archived') NOT NULL DEFAULT 'draft';
