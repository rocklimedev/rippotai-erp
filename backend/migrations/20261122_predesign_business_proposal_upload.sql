-- 20261122_predesign_business_proposal_upload.sql
--
-- Pre Design: the Business Proposal becomes an uploaded file (like the other
-- four Pre Design documents) instead of a form created in INOS.
-- Idempotent: safe to run any number of times. Existing Business Proposal
-- forms stay in the database and in the CRM list; nothing is deleted.
--
-- The new type is OPTIONAL so it never re-opens an existing Pre Design gate
-- in the Command Center.

SET @OLD_SQL_NOTES = @@SQL_NOTES;
SET SQL_NOTES = 0;

INSERT INTO document_types
  (id, code, name, phase_code, project_phase_id, phase_name, section_code,
   section_name, sequence, target_type, requirement_type, allows_multiple,
   requires_revision, requires_approval, description, is_active)
SELECT UUID(), 'PRE_BUSINESS_PROPOSAL', 'Business Proposal', d.phase_code,
       d.project_phase_id, d.phase_name, NULL, NULL,
       d.sequence + 1, 'DOCUMENT', 'OPTIONAL', 0, 0, 0,
       'Business Proposal - uploaded file (Pre Design stage)', 1
  FROM document_types d
 WHERE d.code = 'PRE_PITCH_PROPOSAL'
   AND NOT EXISTS (SELECT 1 FROM document_types e WHERE e.code = 'PRE_BUSINESS_PROPOSAL')
 LIMIT 1;

-- Keep Concept Design 01 after the Business Proposal.
UPDATE document_types c
  JOIN document_types b ON b.code = 'PRE_BUSINESS_PROPOSAL'
   SET c.sequence = b.sequence + 1
 WHERE c.code = 'PRE_CONCEPT_DESIGN_01' AND c.sequence <= b.sequence;

SET SQL_NOTES = @OLD_SQL_NOTES;
