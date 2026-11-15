-- 20261114_flow_structure_document_types.sql
--
-- INOS flow restructure (Projects / Design / Build menus).
-- Idempotent: every statement can run any number of times. No demo data is
-- created; existing documents, drawings and requirements are kept.
--
--   1. Scope of Approval is removed from INOS: its document type is
--      deactivated (uploaded files stay in the database, but the type no
--      longer appears in the Command Center, document lists or uploads).
--   2. Flow names for the upload-type documents that already exist:
--      Signed Contract  -> Contract, Signed Agreement -> Agreement,
--      Pitch / Proposal + Business Proposal -> Pitch Presentation
--      (the Business Proposal is its own form inside the Pre Design stage).
--   3. Adds the Material Palette upload slot (Design Studio), OPTIONAL so it
--      never changes a phase's completion in the Command Center.

SET @OLD_SQL_NOTES = @@SQL_NOTES;
SET SQL_NOTES = 0;

-- 1. Scope of Approval
UPDATE document_types SET is_active = 0
 WHERE code = 'RECCE_SCOPE_OF_APPROVAL' AND is_active <> 0;

-- 2. Flow names
UPDATE document_types SET name = 'Contract'
 WHERE code = 'PLAN_SIGNED_CONTRACT' AND name <> 'Contract';
UPDATE document_types SET name = 'Agreement'
 WHERE code = 'PLAN_SIGNED_AGREEMENT' AND name <> 'Agreement';
UPDATE document_types SET name = 'Pitch Presentation'
 WHERE code = 'PRE_PITCH_PROPOSAL' AND name <> 'Pitch Presentation';

-- 3. Material Palette upload slot (phase 05_DESIGN, after the design types)
INSERT INTO document_types
  (id, code, name, phase_code, project_phase_id, phase_name, section_code,
   section_name, sequence, target_type, requirement_type, allows_multiple,
   requires_revision, requires_approval, description, is_active)
SELECT UUID(), 'DES_MATERIAL_PALETTE', 'Material Palette', d.phase_code,
       d.project_phase_id, d.phase_name, NULL, NULL,
       (SELECT COALESCE(MAX(x.sequence), 0) + 1 FROM document_types x WHERE x.phase_code = d.phase_code),
       'DOCUMENT', 'OPTIONAL', 0, 1, 0,
       'Material Palette - uploaded or generated from the project''s sample boards', 1
  FROM document_types d
 WHERE d.code = 'DES_CONCEPT_DESIGN_02'
   AND NOT EXISTS (SELECT 1 FROM document_types e WHERE e.code = 'DES_MATERIAL_PALETTE')
 LIMIT 1;

SET SQL_NOTES = @OLD_SQL_NOTES;
