-- Phase checklists (Command Center + each project) list ONLY documents that exist in INOS.
-- Types with no INOS screen, or that duplicated another INOS document, are deactivated
-- (kept in the table, is_active = 0 — reversible). Kept types are renamed to their INOS names.
UPDATE document_types SET is_active = 0 WHERE code IN (
  'RECCE_SITE_ANALYSIS', 'RECCE_SITE_BRIEF',
  'PRE_REFERENCE_MOODBOARD',
  'PLAN_PAYMENT_RECEIPT', 'PLAN_PROJECT_TIMELINE',
  'EXEC_PHASE_QC_SIGNOFF', 'EXEC_WATERPROOFING_WARRANTY', 'EXEC_TERMITE_TREATMENT_CERTIFICATE',
  'EXEC_SITE_VISIT_LOG', 'EXEC_SITE_MOCKUP_PROCESS_GUIDE', 'EXEC_DESIGN_CLARIFICATION',
  'EXEC_CIVIL_QUALITY_CHECKLIST', 'EXEC_FINISHING_QUALITY_CHECKLIST', 'EXEC_ELECTRICAL_COMPLETION_CERTIFICATE',
  'HANDOVER_COMPLETION_CERTIFICATE', 'HANDOVER_WARRANTY_PACK', 'HANDOVER_AS_BUILT_DRAWING_SET',
  'HANDOVER_CARE_MAINTENANCE_NOTES', 'HANDOVER_CONSOLIDATED_BILLS',
  'VENDOR_SITE_VISIT_SCHEDULE', 'VENDOR_SITE_MEASUREMENT_SHEET', 'VENDOR_CONTRACTOR_LINEUP',
  'MAT_MATERIAL_LAYOUT_SPECIFICATION', 'MAT_MATERIAL_ESTIMATE'
);

UPDATE document_types SET name = 'Project Planner'          WHERE code = 'PLAN_DRAWINGS_PLAN';
UPDATE document_types SET name = 'Plan of Action'           WHERE code = 'PLAN_EXECUTION_PLAN';
UPDATE document_types SET name = 'Estimate'                 WHERE code = 'PLAN_INITIAL_ESTIMATE';
UPDATE document_types SET name = 'BOQ'                      WHERE code = 'PLAN_STANDARD_BOQ';
UPDATE document_types SET name = 'Checklist'                WHERE code = 'EXEC_QC_CHECKLIST_TEMPLATE';
UPDATE document_types SET name = 'Daily Site Report'        WHERE code = 'EXEC_DAILY_PROGRESS_REPORT';
UPDATE document_types SET name = 'Procurement Sheet'        WHERE code = 'MAT_MATERIAL_REQUIREMENT';
UPDATE document_types SET name = 'Vendor Comparison Sheet'  WHERE code = 'MAT_MATERIAL_RATES_SHEET';
UPDATE document_types SET name = 'Purchase Order'           WHERE code = 'MAT_PURCHASE_ORDERS';
UPDATE document_types SET name = 'Delivery Challan'         WHERE code = 'MAT_DELIVERY_CHALLANS';
UPDATE document_types SET name = 'Site Inventory'           WHERE code = 'MAT_SITE_INVENTORY_REGISTER';
